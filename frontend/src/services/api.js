const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Debug: Log the API base URL being used
if (import.meta.env.DEV) {
  console.log('API Base URL:', API_BASE_URL);
}

export const api = {
  // Courses
  getCourses: async () => {
    const response = await fetch(`${API_BASE_URL}/courses`);
    if (!response.ok) throw new Error('Failed to fetch courses');
    return await response.json();
  },

  getCourse: async (id) => {
    const response = await fetch(`${API_BASE_URL}/courses/${id}`);
    if (!response.ok) throw new Error('Failed to fetch course');
    return await response.json();
  },

  createCourse: async (courseData) => {
    const response = await fetch(`${API_BASE_URL}/courses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(courseData)
    });
    if (!response.ok) {
      const error = await response.json();
      const err = new Error('Failed to create course');
      err.detail = error.detail;
      throw err;
    }
    return await response.json();
  },

  updateCourse: async (id, courseData) => {
    const response = await fetch(`${API_BASE_URL}/courses/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(courseData)
    });
    if (!response.ok) {
      const error = await response.json();
      const err = new Error('Failed to update course');
      err.detail = error.detail;
      throw err;
    }
    return await response.json();
  },

  deleteCourse: async (id) => {
    const response = await fetch(`${API_BASE_URL}/courses/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete course');
    return await response.json();
  },

  searchCourses: async (query) => {
    const response = await fetch(`${API_BASE_URL}/courses/search/?q=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error('Failed to search courses');
    return await response.json();
  },

  // Plans
  getPlans: async () => {
    const response = await fetch(`${API_BASE_URL}/plans`);
    if (!response.ok) throw new Error('Failed to fetch plans');
    return await response.json();
  },

  getPlan: async (id) => {
    const response = await fetch(`${API_BASE_URL}/plans/${id}`);
    if (!response.ok) throw new Error('Failed to fetch plan');
    return await response.json();
  },

  createPlan: async (planData) => {
    const response = await fetch(`${API_BASE_URL}/plans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(planData)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create plan');
    }
    return await response.json();
  },

  updatePlan: async (id, planData) => {
    const response = await fetch(`${API_BASE_URL}/plans/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(planData)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update plan');
    }
    return await response.json();
  },

  deletePlan: async (id) => {
    const response = await fetch(`${API_BASE_URL}/plans/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete plan');
    return await response.json();
  },

  // Authentication
  register: async (username, password, email = '') => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, email })
    });
    if (!response.ok) {
      const error = await response.json();
      const err = new Error('Registration failed');
      err.detail = error.detail;
      throw err;
    }
    return await response.json();
  },

  login: async (username, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (!response.ok) {
      const error = await response.json();
      const err = new Error('Login failed');
      err.detail = error.detail;
      throw err;
    }
    return await response.json();
  },

  getCurrentUser: async (token) => {
    const response = await fetch(`${API_BASE_URL}/auth/me?token=${token}`);
    if (!response.ok) throw new Error('Failed to fetch user');
    return await response.json();
  }
};
