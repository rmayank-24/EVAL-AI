import { auth } from '../firebase';


const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

interface RubricItem {
  criterion: string;
  points: string;
}

class ApiService {
  async getAuthHeaders(): Promise<Record<string, string>> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        return { 'Content-Type': 'application/json' };
      }

      const token = await currentUser.getIdToken();

      return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };
    } catch (error) {
      console.error("Error getting auth token:", error);
      return { 'Content-Type': 'application/json' };
    }
  }

  async request(endpoint: string, options: RequestInit = {}) {
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

    const contentType = response.headers.get("content-type");
    return contentType?.includes("application/json") ? response.json() : undefined;
  }

  async uploadRequest(endpoint: string, formData: FormData) {
    const url = `${API_BASE_URL}${endpoint}`;
    const baseHeaders = await this.getAuthHeaders();
    const uploadHeaders = Object.fromEntries(
  Object.entries(baseHeaders).filter(([key]) => key !== 'Content-Type')
);


    const response = await fetch(url, {
      method: 'POST',
      headers: uploadHeaders,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async setupUser(token: string) {
    return this.request('/users', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
  }

  // Other methods below...

  async getUsers() { return this.request('/users'); }
  async setUserRole(targetUid: string, newRole: string) {
    return this.request('/users/set-role', {
      method: 'POST',
      body: JSON.stringify({ targetUid, newRole })
    });
  }

  async createSubject(name: string, description: string, teacherUid: string) {
    return this.request('/subjects', {
      method: 'POST',
      body: JSON.stringify({ name, description, teacherUid })
    });
  }

  async getSubjects() { return this.request('/subjects'); }
  async deleteSubject(id: string) {
    return this.request(`/subjects/${id}`, { method: 'DELETE' });
  }

  async createAssignment(title: string, description: string, subjectId: string, rubric: RubricItem[], showDetailsToStudent: boolean) {
    return this.request('/assignments', {
      method: 'POST',
      body: JSON.stringify({ title, description, subjectId, rubric, showDetailsToStudent })
    });
  }

  async getAssignmentsBySubject(subjectId: string) {
    return this.request(`/assignments/subject/${subjectId}`);
  }

  async updateAssignmentVisibility(id: string, isVisible: boolean) {
    return this.request(`/assignments/${id}/visibility`, {
      method: 'PUT',
      body: JSON.stringify({ isVisible })
    });
  }

  async deleteAssignment(id: string) {
    return this.request(`/assignments/${id}`, { method: 'DELETE' });
  }

  async submitEvaluation(formData: FormData) {
    return this.uploadRequest('/evaluate', formData);
  }

  async getSubmissions() { return this.request('/submissions'); }
  async getTeacherSubmissions() { return this.request('/submissions/teacher'); }
  async getSubmission(id: string) { return this.request(`/submissions/${id}`); }

  async reviewSubmission(id: string, teacherScore: string, teacherFeedback: string, showScoreToStudent: boolean) {
    return this.request(`/submissions/${id}/review`, {
      method: 'PUT',
      body: JSON.stringify({ teacherScore, teacherFeedback, showScoreToStudent })
    });
  }

  async getComments(submissionId: string) {
    return this.request(`/submissions/${submissionId}/comments`);
  }

  async addComment(submissionId: string, text: string) {
    return this.request(`/submissions/${submissionId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ text })
    });
  }

  async getAnalyticsReport() { return this.request('/analytics/report'); }
  async generateAnalyticsReport() { return this.request('/analytics/generate', { method: 'POST' }); }

  async generateAssignment(topic: string, assignmentType: string, totalMarks: number, customRubric: RubricItem[]) {
    return this.request('/generate-assignment', {
      method: 'POST',
      body: JSON.stringify({ topic, assignmentType, totalMarks, customRubric })
    });
  }

  async chat(submissionId: string, message: string, isRagMode: boolean) {
    return this.request('/chat', {
      method: 'POST',
      body: JSON.stringify({ submissionId, message, isRagMode })
    });
  }
}

export default new ApiService();
