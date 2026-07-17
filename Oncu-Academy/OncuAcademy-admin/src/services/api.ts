const API_BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

export const ADMIN_SESSION_TOKEN_KEY = 'rim_admin_token';
export const ADMIN_SESSION_USER_KEY = 'rim_admin_user';

const getAdminToken = () => {
  if (typeof window === 'undefined') {
    return '';
  }

  return localStorage.getItem(ADMIN_SESSION_TOKEN_KEY) || '';
};

const clearAdminSession = () => {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.removeItem(ADMIN_SESSION_TOKEN_KEY);
  localStorage.removeItem(ADMIN_SESSION_USER_KEY);
  window.dispatchEvent(new Event('rim-admin-auth-expired'));
};

const buildUrl = (path: string) => `${API_BASE_URL}${path}`;

async function requestJson(path: string, init: RequestInit = {}) {
  const adminToken = getAdminToken();
  const response = await fetch(buildUrl(path), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(adminToken ? { 'Authorization': `Bearer ${adminToken}` } : {}),
      ...(init.headers || {})
    }
  });

  const contentType = response.headers.get('content-type') || '';
  const body = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    if (response.status === 401) {
      clearAdminSession();
    }

    const message = typeof body === 'object' && body && 'message' in body
      ? String((body as { message?: string }).message || 'Request failed')
      : 'Request failed';

    throw new Error(message);
  }

  return body;
}

export const adminApi = {
  googleLogin: (credential: string) => requestJson('/admin/auth/google', {
    method: 'POST',
    body: JSON.stringify({ credential })
  }),
  getDashboard: () => requestJson('/admin/dashboard'),
  getTeachers: () => requestJson('/admin/teachers'),
  createTeacher: (payload: Record<string, unknown>) => requestJson('/teacher/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  updateTeacher: (teacherId: string, payload: Record<string, unknown>) => requestJson(`/admin/teachers/${teacherId}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  }),
  deleteTeacher: (teacherId: string) => requestJson(`/admin/teachers/${teacherId}`, {
    method: 'DELETE'
  }),
  getStudents: () => requestJson('/admin/students'),
  getStudentTestResults: (studentId: string) => requestJson(`/admin/students/${studentId}/test-results`),
  assignStudentItem: (studentId: string, payload: Record<string, unknown>) => requestJson(`/admin/students/${studentId}/assignments`, {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  getExamPanelData: () => requestJson('/tests/teacher-exams/admin/panel'),
  publishExamFromDrafts: (payload: Record<string, unknown>) => requestJson('/tests/teacher-exams/admin/publish', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  getCourses: () => requestJson('/admin/courses'),
  getTests: () => requestJson('/admin/tests'),
  getTestResults: (testId: string) => requestJson(`/admin/tests/${testId}/results`),
  getCategories: () => requestJson('/admin/categories'),
  createCategory: (payload: Record<string, unknown>) => requestJson('/admin/categories', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  deleteCategory: (categoryId: string) => requestJson(`/admin/categories/${categoryId}`, {
    method: 'DELETE'
  })
};

export type DashboardResponse = Awaited<ReturnType<typeof adminApi.getDashboard>>;
export type TeachersResponse = Awaited<ReturnType<typeof adminApi.getTeachers>>;
export type StudentsResponse = Awaited<ReturnType<typeof adminApi.getStudents>>;
export type ExamPanelResponse = Awaited<ReturnType<typeof adminApi.getExamPanelData>>;
export type CoursesResponse = Awaited<ReturnType<typeof adminApi.getCourses>>;
export type TestsResponse = Awaited<ReturnType<typeof adminApi.getTests>>;
export type TestResultsResponse = Awaited<ReturnType<typeof adminApi.getTestResults>>;
export type CategoriesResponse = Awaited<ReturnType<typeof adminApi.getCategories>>;