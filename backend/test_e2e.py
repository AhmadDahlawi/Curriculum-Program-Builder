"""
End-to-End Tests for Study Plan API
Tests the complete workflow of creating, updating, and managing courses and plans
"""

import pytest
from fastapi.testclient import TestClient
from main import app
from database import Base, engine, get_db
from sqlalchemy.orm import sessionmaker

# Create test database
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture
def client():
    """Create test client"""
    Base.metadata.create_all(bind=engine)
    yield TestClient(app)
    Base.metadata.drop_all(bind=engine)

class TestCourseEndpoints:
    """Test Course CRUD operations"""
    
    def test_create_course(self, client):
        """Test creating a new course"""
        course_data = {
            "semester": "1",
            "nameAr": "مقدمة في البرمجة",
            "nameEn": "Introduction to Programming",
            "code": "CS101",
            "credits": 3,
            "type": "Required",
            "mode": "In-Person",
            "lectureHours": 3,
            "labHours": 1,
            "trainingHours": 0,
            "department": "Computer Science"
        }
        response = client.post("/courses", json=course_data)
        assert response.status_code == 200
        data = response.json()
        assert data["code"] == "CS101"
        assert data["credits"] == 3

    def test_create_course_invalid_arabic(self, client):
        """Test creating course with invalid Arabic name"""
        course_data = {
            "semester": "1",
            "nameAr": "Programming",  # English instead of Arabic
            "nameEn": "Introduction to Programming",
            "code": "CS101",
            "credits": 3,
            "type": "Required",
            "mode": "In-Person",
            "lectureHours": 3,
            "labHours": 1,
            "trainingHours": 0,
            "department": "Computer Science"
        }
        response = client.post("/courses", json=course_data)
        assert response.status_code == 422  # Validation error

    def test_create_course_invalid_english(self, client):
        """Test creating course with invalid English name"""
        course_data = {
            "semester": "1",
            "nameAr": "مقدمة في البرمجة",
            "nameEn": "مقدمة في البرمجة",  # Arabic instead of English
            "code": "CS101",
            "credits": 3,
            "type": "Required",
            "mode": "In-Person",
            "lectureHours": 3,
            "labHours": 1,
            "trainingHours": 0,
            "department": "Computer Science"
        }
        response = client.post("/courses", json=course_data)
        assert response.status_code == 422  # Validation error

    def test_create_course_negative_credits(self, client):
        """Test creating course with negative credits"""
        course_data = {
            "semester": "1",
            "nameAr": "مقدمة في البرمجة",
            "nameEn": "Introduction to Programming",
            "code": "CS101",
            "credits": -3,  # Negative
            "type": "Required",
            "mode": "In-Person",
            "lectureHours": 3,
            "labHours": 1,
            "trainingHours": 0,
            "department": "Computer Science"
        }
        response = client.post("/courses", json=course_data)
        assert response.status_code == 422  # Validation error

    def test_create_course_invalid_semester(self, client):
        """Test creating course with invalid semester"""
        course_data = {
            "semester": "15",  # Invalid semester
            "nameAr": "مقدمة في البرمجة",
            "nameEn": "Introduction to Programming",
            "code": "CS101",
            "credits": 3,
            "type": "Required",
            "mode": "In-Person",
            "lectureHours": 3,
            "labHours": 1,
            "trainingHours": 0,
            "department": "Computer Science"
        }
        response = client.post("/courses", json=course_data)
        assert response.status_code == 422  # Validation error

    def test_get_courses(self, client):
        """Test retrieving all courses"""
        # Create a course first
        course_data = {
            "semester": "1",
            "nameAr": "مقدمة في البرمجة",
            "nameEn": "Introduction to Programming",
            "code": "CS101",
            "credits": 3,
            "type": "Required",
            "mode": "In-Person",
            "lectureHours": 3,
            "labHours": 1,
            "trainingHours": 0,
            "department": "Computer Science"
        }
        client.post("/courses", json=course_data)
        
        # Get all courses
        response = client.get("/courses")
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        assert data[0]["code"] == "CS101"

    def test_get_single_course(self, client):
        """Test retrieving a single course"""
        # Create a course first
        course_data = {
            "semester": "1",
            "nameAr": "مقدمة في البرمجة",
            "nameEn": "Introduction to Programming",
            "code": "CS101",
            "credits": 3,
            "type": "Required",
            "mode": "In-Person",
            "lectureHours": 3,
            "labHours": 1,
            "trainingHours": 0,
            "department": "Computer Science"
        }
        create_response = client.post("/courses", json=course_data)
        course_id = create_response.json()["id"]
        
        # Get the course
        response = client.get(f"/courses/{course_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["code"] == "CS101"

    def test_update_course(self, client):
        """Test updating a course"""
        # Create a course first
        course_data = {
            "semester": "1",
            "nameAr": "مقدمة في البرمجة",
            "nameEn": "Introduction to Programming",
            "code": "CS101",
            "credits": 3,
            "type": "Required",
            "mode": "In-Person",
            "lectureHours": 3,
            "labHours": 1,
            "trainingHours": 0,
            "department": "Computer Science"
        }
        create_response = client.post("/courses", json=course_data)
        course_id = create_response.json()["id"]
        
        # Update the course
        update_data = {
            "credits": 4,
            "lectureHours": 4
        }
        response = client.put(f"/courses/{course_id}", json=update_data)
        assert response.status_code == 200
        data = response.json()
        assert data["credits"] == 4
        assert data["lectureHours"] == 4

    def test_delete_course(self, client):
        """Test deleting a course"""
        # Create a course first
        course_data = {
            "semester": "1",
            "nameAr": "مقدمة في البرمجة",
            "nameEn": "Introduction to Programming",
            "code": "CS101",
            "credits": 3,
            "type": "Required",
            "mode": "In-Person",
            "lectureHours": 3,
            "labHours": 1,
            "trainingHours": 0,
            "department": "Computer Science"
        }
        create_response = client.post("/courses", json=course_data)
        course_id = create_response.json()["id"]
        
        # Delete the course
        response = client.delete(f"/courses/{course_id}")
        assert response.status_code == 200
        
        # Verify it's deleted
        get_response = client.get(f"/courses/{course_id}")
        assert get_response.status_code == 404

    def test_search_courses(self, client):
        """Test searching courses"""
        # Create multiple courses
        courses = [
            {
                "semester": "1",
                "nameAr": "مقدمة في البرمجة",
                "nameEn": "Introduction to Programming",
                "code": "CS101",
                "credits": 3,
                "type": "Required",
                "mode": "In-Person",
                "lectureHours": 3,
                "labHours": 1,
                "trainingHours": 0,
                "department": "Computer Science"
            },
            {
                "semester": "2",
                "nameAr": "هياكل البيانات",
                "nameEn": "Data Structures",
                "code": "CS102",
                "credits": 3,
                "type": "Required",
                "mode": "In-Person",
                "lectureHours": 3,
                "labHours": 1,
                "trainingHours": 0,
                "department": "Computer Science"
            }
        ]
        
        for course in courses:
            client.post("/courses", json=course)
        
        # Search for a course
        response = client.get("/courses/search/?q=Programming")
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        assert data[0]["code"] == "CS101"


class TestPlanEndpoints:
    """Test Plan CRUD operations"""
    
    def test_create_plan(self, client):
        """Test creating a new plan"""
        # Create a course first
        course_data = {
            "semester": "1",
            "nameAr": "مقدمة في البرمجة",
            "nameEn": "Introduction to Programming",
            "code": "CS101",
            "credits": 3,
            "type": "Required",
            "mode": "In-Person",
            "lectureHours": 3,
            "labHours": 1,
            "trainingHours": 0,
            "department": "Computer Science"
        }
        course_response = client.post("/courses", json=course_data)
        course_id = course_response.json()["id"]
        
        # Create a plan
        plan_data = {
            "name": "Computer Science Plan",
            "maxCreditsPerSemester": 18,
            "courseIds": [course_id]
        }
        response = client.post("/plans", json=plan_data)
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Computer Science Plan"
        assert len(data["courses"]) == 1

    def test_create_plan_invalid_name(self, client):
        """Test creating plan with invalid name"""
        plan_data = {
            "name": "",  # Empty name
            "maxCreditsPerSemester": 18,
            "courseIds": []
        }
        response = client.post("/plans", json=plan_data)
        assert response.status_code == 422  # Validation error

    def test_create_plan_invalid_credits(self, client):
        """Test creating plan with invalid max credits"""
        plan_data = {
            "name": "Computer Science Plan",
            "maxCreditsPerSemester": 50,  # Too high
            "courseIds": []
        }
        response = client.post("/plans", json=plan_data)
        assert response.status_code == 422  # Validation error

    def test_get_plans(self, client):
        """Test retrieving all plans"""
        # Create a course and plan first
        course_data = {
            "semester": "1",
            "nameAr": "مقدمة في البرمجة",
            "nameEn": "Introduction to Programming",
            "code": "CS101",
            "credits": 3,
            "type": "Required",
            "mode": "In-Person",
            "lectureHours": 3,
            "labHours": 1,
            "trainingHours": 0,
            "department": "Computer Science"
        }
        course_response = client.post("/courses", json=course_data)
        course_id = course_response.json()["id"]
        
        plan_data = {
            "name": "Computer Science Plan",
            "maxCreditsPerSemester": 18,
            "courseIds": [course_id]
        }
        client.post("/plans", json=plan_data)
        
        # Get all plans
        response = client.get("/plans")
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1

    def test_update_plan(self, client):
        """Test updating a plan"""
        # Create a course and plan first
        course_data = {
            "semester": "1",
            "nameAr": "مقدمة في البرمجة",
            "nameEn": "Introduction to Programming",
            "code": "CS101",
            "credits": 3,
            "type": "Required",
            "mode": "In-Person",
            "lectureHours": 3,
            "labHours": 1,
            "trainingHours": 0,
            "department": "Computer Science"
        }
        course_response = client.post("/courses", json=course_data)
        course_id = course_response.json()["id"]
        
        plan_data = {
            "name": "Computer Science Plan",
            "maxCreditsPerSemester": 18,
            "courseIds": [course_id]
        }
        plan_response = client.post("/plans", json=plan_data)
        plan_id = plan_response.json()["id"]
        
        # Update the plan
        update_data = {
            "maxCreditsPerSemester": 20
        }
        response = client.put(f"/plans/{plan_id}", json=update_data)
        assert response.status_code == 200
        data = response.json()
        assert data["maxCreditsPerSemester"] == 20

    def test_delete_plan(self, client):
        """Test deleting a plan"""
        # Create a plan first
        plan_data = {
            "name": "Computer Science Plan",
            "maxCreditsPerSemester": 18,
            "courseIds": []
        }
        plan_response = client.post("/plans", json=plan_data)
        plan_id = plan_response.json()["id"]
        
        # Delete the plan
        response = client.delete(f"/plans/{plan_id}")
        assert response.status_code == 200
        
        # Verify it's deleted
        get_response = client.get(f"/plans/{plan_id}")
        assert get_response.status_code == 404


class TestDataSynchronization:
    """Test data synchronization between frontend and backend"""
    
    def test_course_sync_on_create(self, client):
        """Test that course is properly synced when created"""
        course_data = {
            "semester": "1",
            "nameAr": "مقدمة في البرمجة",
            "nameEn": "Introduction to Programming",
            "code": "CS101",
            "credits": 3,
            "type": "Required",
            "mode": "In-Person",
            "lectureHours": 3,
            "labHours": 1,
            "trainingHours": 0,
            "department": "Computer Science"
        }
        
        # Create course
        create_response = client.post("/courses", json=course_data)
        assert create_response.status_code == 200
        created_course = create_response.json()
        
        # Verify it can be retrieved
        get_response = client.get(f"/courses/{created_course['id']}")
        assert get_response.status_code == 200
        retrieved_course = get_response.json()
        
        # Verify all fields match
        assert retrieved_course["code"] == course_data["code"]
        assert retrieved_course["nameAr"] == course_data["nameAr"]
        assert retrieved_course["nameEn"] == course_data["nameEn"]
        assert retrieved_course["credits"] == course_data["credits"]

    def test_plan_course_sync(self, client):
        """Test that courses in plan are properly synced"""
        # Create multiple courses
        courses = []
        for i in range(2):
            course_data = {
                "semester": str(i+1),
                "nameAr": f"مقرر {i+1}",
                "nameEn": f"Course {i+1}",
                "code": f"CS{101+i}",
                "credits": 3,
                "type": "Required",
                "mode": "In-Person",
                "lectureHours": 3,
                "labHours": 1,
                "trainingHours": 0,
                "department": "Computer Science"
            }
            response = client.post("/courses", json=course_data)
            courses.append(response.json())
        
        # Create plan with courses
        plan_data = {
            "name": "Full Plan",
            "maxCreditsPerSemester": 18,
            "courseIds": [c["id"] for c in courses]
        }
        plan_response = client.post("/plans", json=plan_data)
        plan = plan_response.json()
        
        # Verify all courses are in the plan
        assert len(plan["courses"]) == 2
        assert plan["totalCredits"] == 6

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
