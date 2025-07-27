// This line now correctly reads the environment variable for production,
// but falls back to localhost for local development.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

class ApiService {
  async getAuthHeaders() {
    // A small improvement: use a try-catch block for safer parsing
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user?.accessToken) {
        // No need to throw an error here, the request might be public
        return { 'Content-Type': 'application/json' };
      }
      return {
        'Authorization': `Bearer ${user.accessToken}`,
        'Content-Type': 'application/json',
      };
    } catch (error) {
      return { 'Content-Type': 'application/json' };
    }
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    // Headers are now fetched inside the request to be more dynamic
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

    // Handle cases where the response might be empty
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
        return response.json();
    } else {
        return; 
    }
  }

  async uploadRequest(endpoint, formData) {
    const user = JSON.parse(localStorage.getItem('user'));
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        // No 'Content-Type' here, the browser sets it for multipart/form-data
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

  // --- THIS IS THE CORRECTED FUNCTION ---
  // User Management
  async setupUser(token) {
    // This method is special and doesn't use the generic 'request' method.
    // It's called immediately after signup and needs to use the token that was
    // just generated, before it has been saved to localStorage.
    const url = `${API_BASE_URL}/users`;
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`, // Use the provided token
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({}), // Send an empty body for a POST request
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'User setup failed' }));
        throw new Error(error.error || `HTTP ${response.status}`);
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
        return response.json();
    } else {
        return;
    }
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
