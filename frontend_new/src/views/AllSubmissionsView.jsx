import React, { useState, useEffect } from 'react';
import { Calendar, Award, User, Eye } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import SubmissionDetailModal from '../components/SubmissionDetailModal';
import { useNotification } from '../contexts/NotificationContext';
import apiService from '../services/api';

const AllSubmissionsView = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const { showError } = useNotification();

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const data = await apiService.getTeacherSubmissions();
      setSubmissions(data);
    } catch (error) {
      showError('Failed to fetch submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmissionClick = async (submission) => {
    try {
      const fullSubmission = await apiService.getSubmission(submission.id);
      setSelectedSubmission(fullSubmission);
    } catch (error) {
      showError('Failed to load submission details');
    }
  };

  const handleSubmissionUpdate = (updatedSubmission) => {
    setSubmissions(prev => prev.map(sub => 
      sub.id === updatedSubmission.id 
        ? { ...sub, teacherReviewed: true, score: updatedSubmission.teacherScore || sub.score }
        : sub
    ));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner text="Loading submissions..." />
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="text-center py-12">
        <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No submissions yet</h3>
        <p className="text-gray-600">Student submissions will appear here once they start submitting work.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">All Submissions</h2>
          <p className="text-gray-600 mt-1">Review and provide feedback on student work</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student & Question
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subject
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {submissions.map((submission) => (
                <tr key={submission.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <div className="flex items-center">
                        <User className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900">
                          {submission.studentEmail}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {submission.question}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {submission.subjectName}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <Award className="w-4 h-4 text-yellow-500 mr-1" />
                      <span className="text-sm font-medium text-gray-900">
                        {submission.score}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      submission.teacherReviewed
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {submission.teacherReviewed ? 'Reviewed' : 'AI-Graded'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-1" />
                      {submission.date}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleSubmissionClick(submission)}
                      className="flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedSubmission && (
        <SubmissionDetailModal
          submission={selectedSubmission}
          isOpen={!!selectedSubmission}
          onClose={() => setSelectedSubmission(null)}
          onUpdate={handleSubmissionUpdate}
        />
      )}
    </div>
  );
};

export default AllSubmissionsView;