const API_BASE_URL = 'http://localhost:8000';

class ApiService {
  async getAuthHeaders() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user?.accessToken) {
      throw new Error('No authentication token available');
    }
    return {
      'Authorization': `Bearer ${user.accessToken}`,
      'Content-Type': 'application/json',
    };
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async uploadRequest(endpoint, formData) {
    const user = JSON.parse(localStorage.getItem('user'));
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${user.accessToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // User Management
  async setupUser() {
    return this.request('/users', { method: 'POST' });
  }

  async getUsers() {
    return this.request('/users');
  }

  async setUserRole(targetUid, newRole) {
    return this.request('/users/set-role', {
      method: 'POST',
      body: JSON.stringify({ targetUid, newRole }),
    });
  }

  // Subjects
  async createSubject(name, description, teacherUid) {
    return this.request('/subjects', {
      method: 'POST',
      body: JSON.stringify({ name, description, teacherUid }),
    });
  }

  async getSubjects() {
    return this.request('/subjects');
  }

  async deleteSubject(id) {
    return this.request(`/subjects/${id}`, { method: 'DELETE' });
  }

  // Assignments
  async createAssignment(title, description, subjectId, rubric, showDetailsToStudent) {
    return this.request('/assignments', {
      method: 'POST',
      body: JSON.stringify({ title, description, subjectId, rubric, showDetailsToStudent }),
    });
  }

  async getAssignmentsBySubject(subjectId) {
    return this.request(`/assignments/subject/${subjectId}`);
  }

  async updateAssignmentVisibility(id, isVisible) {
    return this.request(`/assignments/${id}/visibility`, {
      method: 'PUT',
      body: JSON.stringify({ isVisible }),
    });
  }

  async deleteAssignment(id) {
    return this.request(`/assignments/${id}`, { method: 'DELETE' });
  }

  // Submissions
  async submitEvaluation(formData) {
    return this.uploadRequest('/evaluate', formData);
  }

  async getSubmissions() {
    return this.request('/submissions');
  }

  async getTeacherSubmissions() {
    return this.request('/submissions/teacher');
  }

  async getSubmission(id) {
    return this.request(`/submissions/${id}`);
  }

  async reviewSubmission(id, teacherScore, teacherFeedback, showScoreToStudent) {
    return this.request(`/submissions/${id}/review`, {
      method: 'PUT',
      body: JSON.stringify({ teacherScore, teacherFeedback, showScoreToStudent }),
    });
  }

  // Comments
  async getComments(submissionId) {
    return this.request(`/submissions/${submissionId}/comments`);
  }

  async addComment(submissionId, text) {
    return this.request(`/submissions/${submissionId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  }

  // Analytics
  async getAnalyticsReport() {
    return this.request('/analytics/report');
  }

  async generateAnalyticsReport() {
    return this.request('/analytics/generate', { method: 'POST' });
  }

  // AI Features
  async generateAssignment(topic, assignmentType, totalMarks, customRubric) {
    return this.request('/generate-assignment', {
      method: 'POST',
      body: JSON.stringify({ topic, assignmentType, totalMarks, customRubric }),
    });
  }

  async chat(submissionId, message, isRagMode) {
    return this.request('/chat', {
      method: 'POST',
      body: JSON.stringify({ submissionId, message, isRagMode }),
    });
  }
}

export default new ApiService();