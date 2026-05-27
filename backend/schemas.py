from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import List, Optional
from datetime import datetime
import re

# Course Schemas
class CourseBase(BaseModel):
    semester: str
    name_ar: str = Field(..., alias="nameAr")
    name_en: str = Field(..., alias="nameEn")
    code: str
    credits: int = Field(gt=0)
    type: str  # Required or Elective
    mode: str  # In-Person, Online, Hybrid
    lecture_hours: int = Field(default=0, ge=0, alias="lectureHours")
    lab_hours: int = Field(default=0, ge=0, alias="labHours")
    training_hours: int = Field(default=0, ge=0, alias="trainingHours")
    department: Optional[str] = None
    description: Optional[str] = None
    objectives: Optional[str] = None
    assessment: Optional[str] = None
    instructor: Optional[str] = None
    materials: Optional[str] = None
    grading: Optional[str] = None
    schedule: Optional[str] = None
    office_hours: Optional[str] = Field(default=None, alias="officeHours")
    notes: Optional[str] = None

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

class CourseCreate(CourseBase):
    prerequisite_codes: List[str] = Field(default=[], alias="prerequisiteCodes")

class CourseUpdate(BaseModel):
    semester: Optional[str] = None
    name_ar: Optional[str] = Field(default=None, alias="nameAr")
    name_en: Optional[str] = Field(default=None, alias="nameEn")
    code: Optional[str] = None
    credits: Optional[int] = Field(default=None, gt=0)
    type: Optional[str] = None
    mode: Optional[str] = None
    lecture_hours: Optional[int] = Field(default=None, ge=0, alias="lectureHours")
    lab_hours: Optional[int] = Field(default=None, ge=0, alias="labHours")
    training_hours: Optional[int] = Field(default=None, ge=0, alias="trainingHours")
    department: Optional[str] = None
    description: Optional[str] = None
    objectives: Optional[str] = None
    assessment: Optional[str] = None
    instructor: Optional[str] = None
    materials: Optional[str] = None
    grading: Optional[str] = None
    schedule: Optional[str] = None
    office_hours: Optional[str] = Field(default=None, alias="officeHours")
    notes: Optional[str] = None
    prerequisite_codes: Optional[List[str]] = Field(default=None, alias="prerequisiteCodes")

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

class CourseResponse(CourseBase):
    id: int
    prerequisite_codes: List[str] = Field(default=[], alias="prerequisiteCodes")
    created_at: datetime
    updated_at: datetime

# Plan Course Schemas
class PlanCourseBase(BaseModel):
    course_id: int = Field(..., alias="courseId")
    semester: str

# Plan Schemas
class PlanBase(BaseModel):
    name: str
    max_credits_per_semester: int = Field(default=18, gt=0, alias="maxCreditsPerSemester")

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

class PlanCreate(PlanBase):
    course_ids: Optional[List[int]] = Field(default=None, alias="courseIds")
    courses: Optional[List[PlanCourseBase]] = None # Support both for backward compatibility

class PlanUpdate(BaseModel):
    name: Optional[str] = None
    max_credits_per_semester: Optional[int] = Field(default=None, gt=0, alias="maxCreditsPerSemester")
    course_ids: Optional[List[int]] = Field(default=None, alias="courseIds")
    courses: Optional[List[PlanCourseBase]] = None

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

class PlanResponse(PlanBase):
    id: int
    courses: List[CourseResponse] = []
    total_credits: int = Field(default=0, alias="totalCredits")
    created_at: datetime
    updated_at: datetime

# User/Auth Schemas
class UserBase(BaseModel):
    username: str
    email: Optional[str] = None

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

# ── NEW: Course Alignment Schemas ──────────────────────────────────────────────

class AlignmentCreate(BaseModel):
    plan_a_id:     int    = Field(..., alias="planAId")
    plan_b_id:     int    = Field(..., alias="planBId")
    course_a_id:   int    = Field(..., alias="courseAId")
    course_b_id:   int    = Field(..., alias="courseBId")
    relation_type: str    = Field(default="equivalent", alias="relationType")

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

class AlignmentResponse(BaseModel):
    id:            int
    plan_a_id:     int    = Field(..., alias="planAId")
    plan_b_id:     int    = Field(..., alias="planBId")
    course_a_id:   int    = Field(..., alias="courseAId")
    course_b_id:   int    = Field(..., alias="courseBId")
    relation_type: str    = Field(alias="relationType")
    created_at:    datetime = Field(alias="createdAt")

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)
