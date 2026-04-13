import axios from 'axios';

// Base URL = BFF Service
// In Docker (Nginx), this will be relative '/api'
// In local dev, it falls back to 'http://localhost:8080/api'
const baseURL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Axios Interceptor - Auto-attach JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (studentId, email, password, role) => api.post('/auth/register', { studentId, email, password, role }),
  getCurrentUser: () => api.get('/auth/me'),
  changePassword: (currentPassword, newPassword) => api.post('/auth/change-password', { currentPassword, newPassword }),
};

// Academic API
export const academicAPI = {
  test: () => api.get('/academic/test'),

  // Session management (Faculty)
  createSession: (data) => api.post('/academic/attendance/session', data),

  // Mark attendance (Student)
  markAttendance: (data) => api.post('/academic/attendance/mark', data),

  // View attendance
  getStudentAttendance: () => api.get('/academic/attendance/student'),
  getFacultyAttendance: (courseCode) => api.get(`/academic/attendance/faculty/${courseCode}`),

  // Timetable
  getTimetable: () => api.get('/academic/timetable'),
  addClass: (timetableData) => api.post('/academic/timetable', timetableData),
};

export const copilotAPI = {
  ask: (message) => api.post('/copilot/ask', { message }),
  sendImage: (image, prompt) => api.post('/copilot/image', { image, prompt }),
  getImageStatus: (taskId) => api.get(`/copilot/image/status/${taskId}`),
};

export default api;
