from fastapi import FastAPI, Depends, HTTPException, Query, status, UploadFile, File, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import insert, delete, select
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
from datetime import timedelta
import models, schemas, database
from database import engine, get_db
from auth import hash_password, verify_password, create_access_token, decode_access_token
from excel_utils import create_excel_template, validate_excel_file, validate_plan_data, export_plan_to_excel
from fastapi.responses import Response
import io
import pandas as pd
import os
import json
import httpx
from dotenv import load_dotenv

load_dotenv()

# 1. Create database tables
models.Base.metadata.create_all(bind=engine)

# 2. Create default Admin user
def create_admin():
    db = database.SessionLocal()
    try:
        admin = db.query(models.User).filter(models.User.username == "Admin").first()
        if not admin:
            admin = models.User(
                username="Admin",
                email="admin@university.edu",
                hashed_password=hash_password("12345"),
                is_active=True
            )
            db.add(admin)
            db.commit()
    except Exception as e:
        print(f"ERROR creating admin: {e}")
    finally:
        db.close()

# Only initialize admin on launch, no sample data
create_admin()

app = FastAPI(title="Curriculum Program Builder API")

# 3. CONFIGURE CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"status": "online", "message": "Backend is working!"}

# --- AUTH ENDPOINTS ---

@app.post("/auth/register", response_model=schemas.UserResponse)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    new_user = models.User(
        username=user.username,
        email=user.email,
        hashed_password=hash_password(user.password)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.get("/auth/me")
def get_current_user(
    token: Optional[str] = None,
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    # Prefer the Authorization header (Bearer <token>); fall back to query param for compatibility
    if authorization:
        scheme, _, header_token = authorization.partition(" ")
        if scheme.lower() == "bearer" and header_token:
            token = header_token
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    username = payload.get("sub")
    db_user = db.query(models.User).filter(models.User.username == username).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"username": db_user.username, "email": db_user.email}

@app.post("/auth/login")
def login(user: schemas.LoginRequest, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    access_token = create_access_token(data={"sub": db_user.username})
    return {"access_token": access_token, "token_type": "bearer", "user": {"username": db_user.username, "email": db_user.email}}

# --- COURSE & PLAN ENDPOINTS ---

@app.get("/courses/search/", response_model=List[schemas.CourseResponse])
def search_courses(q: str, db: Session = Depends(get_db)):
    # Enforce a minimum query length so an empty/blank query does not return every course
    if not q or len(q.strip()) < 1:
        raise HTTPException(status_code=422, detail="Search query must not be empty")
    search = f"%{q}%"
    return db.query(models.Course).filter(
        (models.Course.name_ar.ilike(search)) | 
        (models.Course.name_en.ilike(search)) | 
        (models.Course.code.ilike(search))
    ).all()

def serialize_course(db_course):
    """Serialize a Course ORM object including its prerequisite codes."""
    res = schemas.CourseResponse.model_validate(db_course)
    res.prerequisite_codes = [p.code for p in db_course.prerequisites]
    return res

@app.get("/courses", response_model=List[schemas.CourseResponse])
def get_courses(db: Session = Depends(get_db)):
    return [serialize_course(c) for c in db.query(models.Course).all()]

@app.post("/courses", response_model=schemas.CourseResponse, status_code=201)
def create_course(course: schemas.CourseCreate, db: Session = Depends(get_db)):
    data = course.model_dump()
    # Remove prerequisite_codes as it's not a direct column in Course model
    p_codes = data.pop('prerequisite_codes', [])

    # Guard against duplicate course code before attempting insert (TC-13)
    existing = db.query(models.Course).filter(models.Course.code == data.get("code")).first()
    if existing:
        raise HTTPException(status_code=409, detail="Course code already exists")

    db_course = models.Course(**data)
    
    # Handle prerequisites
    if p_codes:
        prereqs = db.query(models.Course).filter(models.Course.code.in_(p_codes)).all()
        db_course.prerequisites = prereqs

    try:
        db.add(db_course)
        db.commit()
        db.refresh(db_course)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Course code already exists")
    return serialize_course(db_course)

@app.get("/courses/{course_id}", response_model=schemas.CourseResponse)
def get_course(course_id: int, db: Session = Depends(get_db)):
    db_course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not db_course:
        raise HTTPException(status_code=404, detail="Course not found")
    res = schemas.CourseResponse.model_validate(db_course)
    res.prerequisite_codes = [p.code for p in db_course.prerequisites]
    return res

@app.put("/courses/{course_id}", response_model=schemas.CourseResponse)
def update_course(course_id: int, course: schemas.CourseUpdate, db: Session = Depends(get_db)):
    db_course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not db_course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    data = course.model_dump(exclude_unset=True)
    p_codes = data.pop('prerequisite_codes', None)
    
    for key, value in data.items():
        setattr(db_course, key, value)
    
    if p_codes is not None:
        prereqs = db.query(models.Course).filter(models.Course.code.in_(p_codes)).all()
        db_course.prerequisites = prereqs
        
    db.commit()
    db.refresh(db_course)
    return serialize_course(db_course)

@app.delete("/courses/{course_id}")
def delete_course(course_id: int, db: Session = Depends(get_db)):
    db_course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not db_course:
        raise HTTPException(status_code=404, detail="Course not found")
    # Guard: do not allow deleting a course that is still referenced by a plan (UT-19)
    in_plan = db.execute(
        select(models.plan_courses).where(models.plan_courses.c.course_id == course_id)
    ).first()
    if in_plan:
        raise HTTPException(
            status_code=400,
            detail="Course is used in one or more plans and cannot be deleted",
        )
    db.delete(db_course)
    db.commit()
    return {"message": "Course deleted"}

def format_plan_response(p, db: Session):
    res = schemas.PlanResponse.model_validate(p)
    # Get semester info from association table
    plan_courses_data = db.execute(select(models.plan_courses).where(models.plan_courses.c.plan_id == p.id)).all()
    semester_map = {row.course_id: row.semester for row in plan_courses_data}
    
    total_credits = 0
    for i, c in enumerate(res.courses):
        res.courses[i].prerequisite_codes = [x.code for x in p.courses[i].prerequisites]
        if c.id in semester_map and semester_map[c.id]:
            res.courses[i].semester = semester_map[c.id]
        total_credits += c.credits
    res.total_credits = total_credits
    return res

@app.get("/plans/excel/template")
def get_excel_template():
    content = create_excel_template()
    return Response(content=content, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", headers={"Content-Disposition": "attachment; filename=study_plan_template.xlsx"})

@app.get("/plans", response_model=List[schemas.PlanResponse])
def get_plans(db: Session = Depends(get_db)):
    plans = db.query(models.Plan).all()
    return [format_plan_response(p, db) for p in plans]

@app.get("/plans/{plan_id}", response_model=schemas.PlanResponse)
def get_plan(plan_id: int, db: Session = Depends(get_db)):
    p = db.query(models.Plan).filter(models.Plan.id == plan_id).first()
    if not p: raise HTTPException(status_code=404, detail="Plan not found")
    return format_plan_response(p, db)

@app.post("/plans", response_model=schemas.PlanResponse, status_code=201)
def create_plan(plan: schemas.PlanCreate, db: Session = Depends(get_db)):
    # Guard against duplicate plan name before insert (TC-24)
    existing = db.query(models.Plan).filter(models.Plan.name == plan.name).first()
    if existing:
        raise HTTPException(status_code=409, detail="Plan name already exists")

    db_p = models.Plan(name=plan.name, max_credits_per_semester=plan.max_credits_per_semester)
    try:
        db.add(db_p)
        db.commit()
        db.refresh(db_p)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Plan name already exists")
    
    # Handle initial courses if provided
    if plan.courses:
        for pc in plan.courses:
            db.execute(insert(models.plan_courses).values(
                plan_id=db_p.id,
                course_id=pc.course_id,
                semester=pc.semester
            ))
        db.commit()
        db.refresh(db_p)
    elif plan.course_ids:
        for cid in plan.course_ids:
            db.execute(insert(models.plan_courses).values(
                plan_id=db_p.id,
                course_id=cid,
                semester="1"
            ))
        db.commit()
        db.refresh(db_p)

    return format_plan_response(db_p, db)

@app.put("/plans/{plan_id}", response_model=schemas.PlanResponse)
def update_plan(plan_id: int, plan: schemas.PlanUpdate, db: Session = Depends(get_db)):
    db_p = db.query(models.Plan).filter(models.Plan.id == plan_id).first()
    if not db_p:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    if plan.name is not None:
        db_p.name = plan.name
    if plan.max_credits_per_semester is not None:
        db_p.max_credits_per_semester = plan.max_credits_per_semester
        
    # Handle courses update if provided
    if plan.courses is not None:
        # Clear existing associations
        db.execute(delete(models.plan_courses).where(models.plan_courses.c.plan_id == plan_id))
        # Add new associations
        for pc in plan.courses:
            db.execute(insert(models.plan_courses).values(
                plan_id=plan_id,
                course_id=pc.course_id,
                semester=pc.semester
            ))
    elif plan.course_ids is not None:
        # Fallback for course_ids only
        db.execute(delete(models.plan_courses).where(models.plan_courses.c.plan_id == plan_id))
        for cid in plan.course_ids:
            db.execute(insert(models.plan_courses).values(
                plan_id=plan_id,
                course_id=cid,
                semester="1" # Default semester
            ))

    db.commit()
    db.refresh(db_p)
    return format_plan_response(db_p, db)

@app.delete("/plans/{plan_id}")
def delete_plan(plan_id: int, db: Session = Depends(get_db)):
    p = db.query(models.Plan).filter(models.Plan.id == plan_id).first()
    if not p: raise HTTPException(status_code=404, detail="Plan not found")
    db.delete(p)
    db.commit()
    return {"message": "Deleted"}

# --- EXCEL OPERATIONS ---

@app.post("/plans/excel/import")
async def import_excel(file: UploadFile = File(...), db: Session = Depends(get_db)):
    try:
        contents = await file.read()
        # validate_excel_file returns (bool, df_or_error_msg)
        success, result = validate_excel_file(io.BytesIO(contents))
        if not success:
            raise HTTPException(status_code=400, detail=result)
        
        df = result
        # validate_plan_data returns a list of errors
        errors = validate_plan_data(df)
        if errors:
            raise HTTPException(status_code=400, detail="; ".join(errors))
        
        # Extract plan info
        plan_name = df['Plan Name'].iloc[0]
        max_credits = int(df['Max Credits Per Semester'].iloc[0])

        # Guard against duplicate plan name (TC-34) — return a clean 400 instead of a mid-transaction crash
        existing_plan = db.query(models.Plan).filter(models.Plan.name == plan_name).first()
        if existing_plan:
            raise HTTPException(status_code=400, detail="Plan name already exists")

        db_p = models.Plan(name=plan_name, max_credits_per_semester=max_credits)
        db.add(db_p); db.flush()
        
        for _, row in df.iterrows():
            code = str(row['Course Code']).strip().upper()
            db_c = db.query(models.Course).filter(models.Course.code == code).first()
            if not db_c:
                db_c = models.Course(
                    semester=str(int(row['Semester'])), 
                    name_ar=str(row['Course Name (Arabic)']), 
                    name_en=str(row['Course Name (English)']),
                    code=code, 
                    credits=int(row['Credit Hours']), 
                    type=str(row['Course Type']), 
                    mode=str(row['Study Mode']),
                    lecture_hours=int(row['Lecture Hours']) if not pd.isna(row['Lecture Hours']) else 0,
                    lab_hours=int(row['Lab Hours']) if not pd.isna(row['Lab Hours']) else 0,
                    training_hours=int(row['Training Hours']) if not pd.isna(row['Training Hours']) else 0,
                    department=str(row['Department']) if not pd.isna(row['Department']) else None
                )
                db.add(db_c); db.flush()
            
            # Add to plan_courses association
            db.execute(insert(models.plan_courses).values(
                plan_id=db_p.id, 
                course_id=db_c.id, 
                semester=str(int(row['Semester']))
            ))
        
        db.commit(); db.refresh(db_p)
        return {"message": "Success", "plan": format_plan_response(db_p, db)}
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Import failed: {str(e)}")

@app.get("/plans/{plan_id}/excel/export")
def export_excel(plan_id: int, db: Session = Depends(get_db)):
    try:
        p = db.query(models.Plan).filter(models.Plan.id == plan_id).first()
        if not p: raise HTTPException(status_code=404)
        plan_res = format_plan_response(p, db)
        p_data = {'name': p.name, 'max_credits_per_semester': p.max_credits_per_semester}
        c_data = []
        for c in plan_res.courses:
            c_data.append({
                'semester': c.semester, 'name_ar': c.name_ar, 'name_en': c.name_en, 'code': c.code, 'credits': c.credits,
                'type': c.type, 'mode': c.mode, 'lecture_hours': c.lecture_hours, 'lab_hours': c.lab_hours,
                'training_hours': c.training_hours, 'department': c.department, 'prerequisite_codes': c.prerequisite_codes
            })
        content = export_plan_to_excel(p_data, c_data)
        return Response(content=content, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", headers={"Content-Disposition": f"attachment; filename={p.name}.xlsx"})
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

# ═══════════════════════════════════════════════════════════════════════════════
#  NEW ENDPOINTS – Course Alignment (Plan Alignment Tool)
# ═══════════════════════════════════════════════════════════════════════════════

from excel_utils import export_alignment_to_excel

@app.get("/alignments/export/excel")
def export_alignment_excel(plan_a_id: int = Query(...), plan_b_id: int = Query(...), db: Session = Depends(get_db)):
    plan_a = db.query(models.Plan).filter(models.Plan.id == plan_a_id).first()
    plan_b = db.query(models.Plan).filter(models.Plan.id == plan_b_id).first()
    if not plan_a or not plan_b: raise HTTPException(status_code=404, detail="Plan not found")
    res_a, res_b = format_plan_response(plan_a, db), format_plan_response(plan_b, db)

    def build_plan_data(plan_obj, res):
        sems = {}
        for c in res.courses: sems.setdefault(c.semester, []).append(c)
        return {"name": plan_obj.name, "total_credits": res.total_credits, "course_count": len(res.courses), "sem_count": len(sems), "courses_by_sem": sems}

    plan_a_data, plan_b_data = build_plan_data(plan_a, res_a), build_plan_data(plan_b, res_b)
    lo, hi = min(plan_a_id, plan_b_id), max(plan_a_id, plan_b_id)
    aln_rows = db.query(models.CourseAlignment).filter(models.CourseAlignment.plan_a_id == lo, models.CourseAlignment.plan_b_id == hi).all()

    def course_dict(c_obj): return {"code": c_obj.code, "name_ar": c_obj.name_ar, "credits": c_obj.credits, "semester": c_obj.semester}
    alignments = []
    for row in aln_rows:
        if plan_a_id <= plan_b_id: alignments.append({"course_a": course_dict(row.course_a), "course_b": course_dict(row.course_b), "relation_type": row.relation_type})
        else: alignments.append({"course_a": course_dict(row.course_b), "course_b": course_dict(row.course_a), "relation_type": row.relation_type})

    content = export_alignment_to_excel(plan_a_data, plan_b_data, alignments)
    return Response(content=content, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", headers={"Content-Disposition": f"attachment; filename=alignment_{plan_a.name}_{plan_b.name}.xlsx"})

@app.post("/alignments/ai-suggest", status_code=201)
async def ai_suggest_alignments(
    plan_a_id: int = Query(...),
    plan_b_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """
    Use Gemini to automatically suggest course alignments between two plans.
    """
    gemini_api_key = os.environ.get("GEMINI_API_KEY")
    if not gemini_api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY is not configured on the server")

    plan_a = db.query(models.Plan).filter(models.Plan.id == plan_a_id).first()
    plan_b = db.query(models.Plan).filter(models.Plan.id == plan_b_id).first()
    if not plan_a or not plan_b:
        raise HTTPException(status_code=404, detail="One or both plans not found")

    res_a = format_plan_response(plan_a, db)
    res_b = format_plan_response(plan_b, db)

    def describe_courses(courses):
        return [
            {
                "id": c.id, "code": c.code, "name_ar": c.name_ar, "name_en": c.name_en,
                "credits": c.credits, "type": c.type, "semester": c.semester, "department": c.department,
            }
            for c in courses
        ]

    courses_a = describe_courses(res_a.courses)
    courses_b = describe_courses(res_b.courses)

    prompt = f"""You are an academic curriculum alignment expert.
Identify which courses from Plan A match or are equivalent to courses in Plan B.
Respond ONLY with a JSON array of: {{"course_a_id": int, "course_b_id": int, "relation_type": "equivalent"|"similar"|"replaced_by"}}
Do not include any explanation or markdown formatting, just the raw JSON array.

Plan A courses: {json.dumps(courses_a, ensure_ascii=False)}
Plan B courses: {json.dumps(courses_b, ensure_ascii=False)}
"""

    try:
        async with httpx.AsyncClient(timeout=60) as client:
            # Using Gemini API (Google AI SDK style via REST)
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={gemini_api_key}"
            response = await client.post(
                url,
                headers={"Content-Type": "application/json"},
                json={
                    "contents": [{
                        "parts": [{"text": prompt}]
                    }],
                    "generationConfig": {
                        "temperature": 0.1,
                        "response_mime_type": "application/json"
                    }
                }
            )
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="The AI suggestion service timed out. Please try again.")
    except httpx.RequestError:
        raise HTTPException(status_code=502, detail="Could not reach the AI suggestion service. Please try again later.")

    if response.status_code != 200:
        raise HTTPException(status_code=502, detail=f"Gemini API error: {response.text}")

    try:
        res_json = response.json()
        content = res_json["candidates"][0]["content"]["parts"][0]["text"].strip()
    except (KeyError, IndexError):
        raise HTTPException(status_code=502, detail="Invalid response format from Gemini")

    # Strip markdown fences if Gemini still includes them despite response_mime_type
    if content.startswith("```"):
        content = content.split("```")[1]
        if content.startswith("json"): content = content[4:]
    content = content.strip()

    try:
        suggestions = json.loads(content)
    except json.JSONDecodeError:
        raise HTTPException(status_code=502, detail="Gemini returned invalid JSON")

    # Clear existing
    lo, hi = min(plan_a_id, plan_b_id), max(plan_a_id, plan_b_id)
    db.query(models.CourseAlignment).filter(models.CourseAlignment.plan_a_id == lo, models.CourseAlignment.plan_b_id == hi).delete(synchronize_session=False)

    valid_a_ids = {c.id for c in res_a.courses}
    valid_b_ids = {c.id for c in res_b.courses}
    saved = []; used_a = set(); used_b = set()

    for s in suggestions:
        try:
            ca_id, cb_id = int(s["course_a_id"]), int(s["course_b_id"])
            rel = str(s.get("relation_type", "equivalent"))
            if ca_id not in valid_a_ids or cb_id not in valid_b_ids or ca_id in used_a or cb_id in used_b: continue
            
            # Prevent aligning a course with itself (same ID)
            if ca_id == cb_id:
                continue

            # Normalise plan order
            p1, p2 = (ca_id, cb_id) if plan_a_id <= plan_b_id else (cb_id, ca_id)
            new_aln = models.CourseAlignment(plan_a_id=lo, plan_b_id=hi, course_a_id=p1, course_b_id=p2, relation_type=rel)
            db.add(new_aln); db.flush()
            used_a.add(ca_id); used_b.add(cb_id)
            saved.append({"id": new_aln.id, "planAId": new_aln.plan_a_id, "planBId": new_aln.plan_b_id, "courseAId": new_aln.course_a_id, "courseBId": new_aln.course_b_id, "relationType": new_aln.relation_type})
        except: continue

    db.commit()
    return {"alignments": saved, "count": len(saved)}

@app.get("/alignments")
def get_alignments(plan_a_id: int = Query(...), plan_b_id: int = Query(...), db: Session = Depends(get_db)):
    lo, hi = min(plan_a_id, plan_b_id), max(plan_a_id, plan_b_id)
    rows = db.query(models.CourseAlignment).filter(models.CourseAlignment.plan_a_id == lo, models.CourseAlignment.plan_b_id == hi).all()
    return [{"id": r.id, "planAId": r.plan_a_id, "planBId": r.plan_b_id, "courseAId": r.course_a_id, "courseBId": r.course_b_id, "relationType": r.relation_type, "createdAt": r.created_at.isoformat()} for r in rows]

@app.post("/alignments", status_code=201)
def create_alignment(payload: schemas.AlignmentCreate, db: Session = Depends(get_db)):
    if payload.course_a_id == payload.course_b_id: raise HTTPException(status_code=400, detail="Cannot align a course with itself")
    lo_p, hi_p = min(payload.plan_a_id, payload.plan_b_id), max(payload.plan_a_id, payload.plan_b_id)
    c_a, c_b = (payload.course_a_id, payload.course_b_id) if payload.plan_a_id < payload.plan_b_id else (payload.course_b_id, payload.course_a_id)
    db.query(models.CourseAlignment).filter(models.CourseAlignment.plan_a_id == lo_p, models.CourseAlignment.plan_b_id == hi_p, (models.CourseAlignment.course_a_id == c_a) | (models.CourseAlignment.course_b_id == c_b)).delete(synchronize_session=False)
    new_aln = models.CourseAlignment(plan_a_id=lo_p, plan_b_id=hi_p, course_a_id=c_a, course_b_id=c_b, relation_type=payload.relation_type)
    db.add(new_aln); db.commit(); db.refresh(new_aln)
    return {"id": new_aln.id, "planAId": new_aln.plan_a_id, "planBId": new_aln.plan_b_id, "courseAId": new_aln.course_a_id, "courseBId": new_aln.course_b_id, "relationType": new_aln.relation_type, "createdAt": new_aln.created_at.isoformat()}

@app.delete("/alignments/{alignment_id}")
def delete_alignment(alignment_id: int, db: Session = Depends(get_db)):
    aln = db.query(models.CourseAlignment).filter(models.CourseAlignment.id == alignment_id).first()
    if not aln: raise HTTPException(status_code=404, detail="Alignment not found")
    db.delete(aln); db.commit()
    return {"message": "Deleted"}

@app.delete("/alignments")
def delete_all_alignments(plan_a_id: int = Query(...), plan_b_id: int = Query(...), db: Session = Depends(get_db)):
    lo, hi = min(plan_a_id, plan_b_id), max(plan_a_id, plan_b_id)
    db.query(models.CourseAlignment).filter(models.CourseAlignment.plan_a_id == lo, models.CourseAlignment.plan_b_id == hi).delete(synchronize_session=False)
    db.commit()
    return {"message": "Cleared"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
