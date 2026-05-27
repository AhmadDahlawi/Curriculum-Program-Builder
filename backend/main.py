from fastapi import FastAPI, Depends, HTTPException, Query, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import insert, delete, select
from typing import List, Optional
from datetime import timedelta
import models, schemas, database
from database import engine, get_db
from auth import hash_password, verify_password, create_access_token, decode_access_token
from excel_utils import create_excel_template, validate_excel_file, validate_plan_data, export_plan_to_excel
from fastapi.responses import Response
import io
import pandas as pd

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
        raise HTTPException(status_code=400, detail="Username already exists")
    new_user = models.User(username=user.username, email=user.email, hashed_password=hash_password(user.password))
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/auth/login")
def login(request: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == request.username).first()
    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    token = create_access_token(data={"sub": user.username})
    return {"access_token": token, "token_type": "bearer", "user": {"id": user.id, "username": user.username, "email": user.email}}

@app.get("/auth/me")
def get_me(token: str, db: Session = Depends(get_db)):
    payload = decode_access_token(token)
    if not payload: raise HTTPException(status_code=401, detail="Invalid token")
    user = db.query(models.User).filter(models.User.username == payload.get("sub")).first()
    if not user: raise HTTPException(status_code=401, detail="User not found")
    return {"id": user.id, "username": user.username, "email": user.email}

# --- COURSE ENDPOINTS ---

@app.get("/courses", response_model=List[schemas.CourseResponse])
def get_courses(db: Session = Depends(get_db)):
    courses = db.query(models.Course).all()
    for c in courses: c.prerequisite_codes = [p.code for p in c.prerequisites]
    return courses

@app.get("/courses/{course_id}", response_model=schemas.CourseResponse)
def get_course(course_id: int, db: Session = Depends(get_db)):
    c = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not c: raise HTTPException(status_code=404, detail="Course not found")
    c.prerequisite_codes = [p.code for p in c.prerequisites]
    return c

@app.post("/courses", response_model=schemas.CourseResponse)
def create_course(course: schemas.CourseCreate, db: Session = Depends(get_db)):
    db_c = models.Course(**course.model_dump(exclude={'prerequisite_codes'}))
    if course.prerequisite_codes:
        db_c.prerequisites = db.query(models.Course).filter(models.Course.code.in_(course.prerequisite_codes)).all()
    db.add(db_c)
    db.commit()
    db.refresh(db_c)
    db_c.prerequisite_codes = [p.code for p in db_c.prerequisites]
    return db_c

@app.put("/courses/{course_id}", response_model=schemas.CourseResponse)
def update_course(course_id: int, course: schemas.CourseCreate, db: Session = Depends(get_db)):
    db_c = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not db_c: raise HTTPException(status_code=404, detail="Course not found")
    for k, v in course.model_dump(exclude={'prerequisite_codes'}).items(): setattr(db_c, k, v)
    if course.prerequisite_codes is not None:
        db_c.prerequisites = db.query(models.Course).filter(models.Course.code.in_(course.prerequisite_codes)).all()
    db.commit()
    db.refresh(db_c)
    db_c.prerequisite_codes = [p.code for p in db_c.prerequisites]
    return db_c

@app.delete("/courses/{course_id}")
def delete_course(course_id: int, db: Session = Depends(get_db)):
    c = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not c: raise HTTPException(status_code=404, detail="Course not found")
    db.execute(delete(models.plan_courses).where(models.plan_courses.c.course_id == course_id))
    db.execute(delete(models.course_prerequisites).where((models.course_prerequisites.c.course_id == course_id) | (models.course_prerequisites.c.prerequisite_id == course_id)))
    db.delete(c)
    db.commit()
    return {"message": "Deleted"}

@app.get("/courses/search/", response_model=List[schemas.CourseResponse])
def search_courses(q: str, db: Session = Depends(get_db)):
    courses = db.query(models.Course).filter((models.Course.name_ar.contains(q)) | (models.Course.name_en.contains(q)) | (models.Course.code.contains(q))).all()
    for c in courses: c.prerequisite_codes = [p.code for p in c.prerequisites]
    return courses

# --- PLAN ENDPOINTS ---

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

@app.get("/plans", response_model=List[schemas.PlanResponse])
def get_plans(db: Session = Depends(get_db)):
    plans = db.query(models.Plan).all()
    return [format_plan_response(p, db) for p in plans]

@app.get("/plans/{plan_id}", response_model=schemas.PlanResponse)
def get_plan(plan_id: int, db: Session = Depends(get_db)):
    p = db.query(models.Plan).filter(models.Plan.id == plan_id).first()
    if not p: raise HTTPException(status_code=404, detail="Plan not found")
    return format_plan_response(p, db)

@app.post("/plans", response_model=schemas.PlanResponse)
def create_plan(plan: schemas.PlanCreate, db: Session = Depends(get_db)):
    db_p = models.Plan(name=plan.name, max_credits_per_semester=plan.max_credits_per_semester)
    db.add(db_p)
    db.commit()
    db.refresh(db_p)
    
    if plan.courses:
        for c_info in plan.courses:
            db.execute(insert(models.plan_courses).values(plan_id=db_p.id, course_id=c_info.course_id, semester=c_info.semester))
    elif plan.course_ids:
        for cid in plan.course_ids:
            # Fallback to default semester if not provided
            course = db.query(models.Course).filter(models.Course.id == cid).first()
            sem = course.semester if course else "1"
            db.execute(insert(models.plan_courses).values(plan_id=db_p.id, course_id=cid, semester=sem))
    
    db.commit()
    db.refresh(db_p)
    return format_plan_response(db_p, db)

@app.put("/plans/{plan_id}", response_model=schemas.PlanResponse)
def update_plan(plan_id: int, plan: schemas.PlanUpdate, db: Session = Depends(get_db)):
    db_p = db.query(models.Plan).filter(models.Plan.id == plan_id).first()
    if not db_p: raise HTTPException(status_code=404, detail="Plan not found")
    
    db_p.name = plan.name if plan.name else db_p.name
    db_p.max_credits_per_semester = plan.max_credits_per_semester if plan.max_credits_per_semester else db_p.max_credits_per_semester
    
    if plan.courses is not None or plan.course_ids is not None:
        db.execute(delete(models.plan_courses).where(models.plan_courses.c.plan_id == plan_id))
        if plan.courses:
            for c_info in plan.courses:
                db.execute(insert(models.plan_courses).values(plan_id=plan_id, course_id=c_info.course_id, semester=c_info.semester))
        elif plan.course_ids:
            for cid in plan.course_ids:
                course = db.query(models.Course).filter(models.Course.id == cid).first()
                sem = course.semester if course else "1"
                db.execute(insert(models.plan_courses).values(plan_id=plan_id, course_id=cid, semester=sem))
    
    db.commit()
    db.refresh(db_p)
    return format_plan_response(db_p, db)

@app.delete("/plans/{plan_id}")
def delete_plan(plan_id: int, db: Session = Depends(get_db)):
    p = db.query(models.Plan).filter(models.Plan.id == plan_id).first()
    if not p: raise HTTPException(status_code=404, detail="Plan not found")
    db.execute(delete(models.plan_courses).where(models.plan_courses.c.plan_id == plan_id))
    db.delete(p)
    db.commit()
    return {"message": "Deleted"}

# --- EXCEL ENDPOINTS ---

@app.get("/plans/excel/template")
def download_template():
    try:
        content = create_excel_template()
        return Response(content=content, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", headers={"Content-Disposition": "attachment; filename=template.xlsx"})
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

@app.post("/plans/excel/import")
async def import_excel(file: UploadFile = File(...), db: Session = Depends(get_db)):
    try:
        contents = await file.read()
        is_valid, result = validate_excel_file(io.BytesIO(contents))
        if not is_valid: raise HTTPException(status_code=400, detail=result)
        df = result
        errs = validate_plan_data(df)
        if errs: raise HTTPException(status_code=400, detail="\n".join(errs))
        
        p_name = str(df['Plan Name'].iloc[0]).strip()
        if db.query(models.Plan).filter(models.Plan.name.ilike(p_name)).first():
            raise HTTPException(status_code=400, detail=f"Plan '{p_name}' exists")
            
        db_p = models.Plan(name=p_name, max_credits_per_semester=int(df['Max Credits Per Semester'].iloc[0]))
        db.add(db_p); db.flush()
        
        for _, row in df.iterrows():
            code = str(row['Course Code']).strip().upper()
            db_c = db.query(models.Course).filter(models.Course.code == code).first()
            if not db_c:
                db_c = models.Course(
                    semester=str(int(row['Semester'])), name_ar=str(row['Course Name (Arabic)']), name_en=str(row['Course Name (English)']),
                    code=code, credits=int(row['Credit Hours']), type=str(row['Course Type']), mode=str(row['Study Mode']),
                    lecture_hours=int(row['Lecture Hours']) if not pd.isna(row['Lecture Hours']) else 0,
                    lab_hours=int(row['Lab Hours']) if not pd.isna(row['Lab Hours']) else 0,
                    training_hours=int(row['Training Hours']) if not pd.isna(row['Training Hours']) else 0,
                    department=str(row['Department']) if not pd.isna(row['Department']) else None
                )
                db.add(db_c); db.flush()
            db.execute(insert(models.plan_courses).values(plan_id=db_p.id, course_id=db_c.id, semester=str(int(row['Semester']))))
        
        db.commit(); db.refresh(db_p)
        return {"message": "Success", "plan": format_plan_response(db_p, db)}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

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

@app.get("/alignments")
def get_alignments(plan_a_id: int = Query(...), plan_b_id: int = Query(...), db: Session = Depends(get_db)):
    """Return all alignments between two plans (order-independent)."""
    lo, hi = min(plan_a_id, plan_b_id), max(plan_a_id, plan_b_id)
    rows = db.query(models.CourseAlignment).filter(
        models.CourseAlignment.plan_a_id == lo,
        models.CourseAlignment.plan_b_id == hi
    ).all()
    result = []
    for r in rows:
        result.append({
            "id": r.id,
            "planAId": r.plan_a_id,
            "planBId": r.plan_b_id,
            "courseAId": r.course_a_id,
            "courseBId": r.course_b_id,
            "relationType": r.relation_type,
            "createdAt": r.created_at.isoformat()
        })
    return result


@app.post("/alignments", status_code=201)
def create_alignment(payload: schemas.AlignmentCreate, db: Session = Depends(get_db)):
    """Create or replace an alignment between two courses in two plans."""
    if payload.course_a_id == payload.course_b_id:
        raise HTTPException(status_code=400, detail="Cannot align a course with itself")
        
    lo_plan   = min(payload.plan_a_id, payload.plan_b_id)
    hi_plan   = max(payload.plan_a_id, payload.plan_b_id)
    # Normalise so plan_a always has the lower id
    if payload.plan_a_id < payload.plan_b_id:
        c_a, c_b = payload.course_a_id, payload.course_b_id
    else:
        c_a, c_b = payload.course_b_id, payload.course_a_id

    # Remove any existing entry for either course within this plan pair
    db.query(models.CourseAlignment).filter(
        models.CourseAlignment.plan_a_id == lo_plan,
        models.CourseAlignment.plan_b_id == hi_plan,
        (models.CourseAlignment.course_a_id == c_a) | (models.CourseAlignment.course_b_id == c_b)
    ).delete(synchronize_session=False)

    new_aln = models.CourseAlignment(
        plan_a_id=lo_plan, plan_b_id=hi_plan,
        course_a_id=c_a, course_b_id=c_b,
        relation_type=payload.relation_type
    )
    db.add(new_aln)
    db.commit()
    db.refresh(new_aln)
    return {
        "id": new_aln.id,
        "planAId": new_aln.plan_a_id,
        "planBId": new_aln.plan_b_id,
        "courseAId": new_aln.course_a_id,
        "courseBId": new_aln.course_b_id,
        "relationType": new_aln.relation_type,
        "createdAt": new_aln.created_at.isoformat()
    }


@app.delete("/alignments/{alignment_id}")
def delete_alignment(alignment_id: int, db: Session = Depends(get_db)):
    aln = db.query(models.CourseAlignment).filter(models.CourseAlignment.id == alignment_id).first()
    if not aln:
        raise HTTPException(status_code=404, detail="Alignment not found")
    db.delete(aln)
    db.commit()
    return {"message": "Deleted"}


@app.delete("/alignments")
def delete_all_alignments(plan_a_id: int = Query(...), plan_b_id: int = Query(...), db: Session = Depends(get_db)):
    """Clear all alignments between two plans."""
    lo, hi = min(plan_a_id, plan_b_id), max(plan_a_id, plan_b_id)
    db.query(models.CourseAlignment).filter(
        models.CourseAlignment.plan_a_id == lo,
        models.CourseAlignment.plan_b_id == hi
    ).delete(synchronize_session=False)
    db.commit()
    return {"message": "Cleared"}


@app.get("/alignments/export/excel")
def export_alignment_excel(plan_a_id: int = Query(...), plan_b_id: int = Query(...), db: Session = Depends(get_db)):
    """Generate an RTL Excel file summarising the alignment between two plans."""
    plan_a = db.query(models.Plan).filter(models.Plan.id == plan_a_id).first()
    plan_b = db.query(models.Plan).filter(models.Plan.id == plan_b_id).first()
    if not plan_a or not plan_b:
        raise HTTPException(status_code=404, detail="Plan not found")

    res_a = format_plan_response(plan_a, db)
    res_b = format_plan_response(plan_b, db)

    def build_plan_data(plan_obj, res):
        sems = {}
        for c in res.courses:
            sems.setdefault(c.semester, []).append(c)
        return {
            "name": plan_obj.name,
            "total_credits": res.total_credits,
            "course_count": len(res.courses),
            "sem_count": len(sems),
            "courses_by_sem": sems
        }

    plan_a_data = build_plan_data(plan_a, res_a)
    plan_b_data = build_plan_data(plan_b, res_b)

    lo, hi = min(plan_a_id, plan_b_id), max(plan_a_id, plan_b_id)
    aln_rows = db.query(models.CourseAlignment).filter(
        models.CourseAlignment.plan_a_id == lo,
        models.CourseAlignment.plan_b_id == hi
    ).all()

    def course_dict(c_obj):
        return {"code": c_obj.code, "name_ar": c_obj.name_ar, "credits": c_obj.credits, "semester": c_obj.semester}

    alignments = []
    for row in aln_rows:
        # If the caller requested plan_a_id > plan_b_id, swap the display
        if plan_a_id <= plan_b_id:
            alignments.append({"course_a": course_dict(row.course_a), "course_b": course_dict(row.course_b), "relation_type": row.relation_type})
        else:
            alignments.append({"course_a": course_dict(row.course_b), "course_b": course_dict(row.course_a), "relation_type": row.relation_type})

    content = export_alignment_to_excel(plan_a_data, plan_b_data, alignments)
    filename = f"alignment_{plan_a.name}_{plan_b.name}.xlsx"
    return Response(
        content=content,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
