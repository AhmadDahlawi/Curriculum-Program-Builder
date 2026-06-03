from sqlalchemy import Column, Integer, String, ForeignKey, Table, Text, DateTime, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

# Association table for course prerequisites (many-to-many)
course_prerequisites = Table(
    'course_prerequisites',
    Base.metadata,
    Column('course_id', Integer, ForeignKey('courses.id'), primary_key=True),
    Column('prerequisite_id', ForeignKey('courses.id'), primary_key=True)
)

# Association table for plan courses (many-to-many)
# Added semester column to store which semester the course belongs to in THIS specific plan
plan_courses = Table(
    'plan_courses',
    Base.metadata,
    Column('plan_id', Integer, ForeignKey('plans.id'), primary_key=True),
    Column('course_id', Integer, ForeignKey('courses.id'), primary_key=True),
    Column('semester', String, nullable=True)
)


class Course(Base):
    __tablename__ = "courses"
    
    id = Column(Integer, primary_key=True, index=True)
    semester = Column(String, nullable=False)
    name_ar = Column(String, nullable=False)
    name_en = Column(String, nullable=False)
    code = Column(String, nullable=False, unique=True, index=True)
    credits = Column(Integer, nullable=False)
    type = Column(String, nullable=False)  # Required or Elective
    mode = Column(String, nullable=False)  # In-Person, Online, Hybrid
    lecture_hours = Column(Integer, default=0)
    lab_hours = Column(Integer, default=0)
    training_hours = Column(Integer, default=0)
    department = Column(String, nullable=True)
    
    # Optional detailed fields
    description = Column(Text, nullable=True)
    objectives = Column(Text, nullable=True)
    assessment = Column(Text, nullable=True)
    instructor = Column(String, nullable=True)
    materials = Column(Text, nullable=True)
    grading = Column(Text, nullable=True)
    schedule = Column(String, nullable=True)
    office_hours = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    prerequisites = relationship(
        'Course',
        secondary=course_prerequisites,
        primaryjoin=id == course_prerequisites.c.course_id,
        secondaryjoin=id == course_prerequisites.c.prerequisite_id,
        backref='required_by'
    )
    
    plans = relationship('Plan', secondary=plan_courses, back_populates='courses')


class Plan(Base):
    __tablename__ = "plans"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True, index=True)
    max_credits_per_semester = Column(Integer, default=18)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    courses = relationship('Course', secondary=plan_courses, back_populates='plans')


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, nullable=False, unique=True, index=True)
    email = Column(String, nullable=True, index=True)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# ── NEW: Course alignment / mapping table ──────────────────────────────────────
class CourseAlignment(Base):
    """
    Stores manually-created equivalences between courses in two plans.
    (plan_a_id, course_a_id) ↔ (plan_b_id, course_b_id)
    The pair (plan_a_id, plan_b_id) is always stored with plan_a_id < plan_b_id
    to avoid duplicates; the frontend/backend normalises this on write.
    relation_type: 'equivalent' | 'similar' | 'replaced_by'
    """
    __tablename__ = "course_alignments"

    id            = Column(Integer, primary_key=True, index=True)
    plan_a_id     = Column(Integer, ForeignKey('plans.id'),   nullable=False)
    plan_b_id     = Column(Integer, ForeignKey('plans.id'),   nullable=False)
    course_a_id   = Column(Integer, ForeignKey('courses.id'), nullable=False)
    course_b_id   = Column(Integer, ForeignKey('courses.id'), nullable=False)
    relation_type = Column(String, default='equivalent')
    created_at    = Column(DateTime, default=datetime.utcnow)

    plan_a    = relationship('Plan',   foreign_keys=[plan_a_id])
    plan_b    = relationship('Plan',   foreign_keys=[plan_b_id])
    course_a  = relationship('Course', foreign_keys=[course_a_id])
    course_b  = relationship('Course', foreign_keys=[course_b_id])
