import React, { useState, useEffect } from 'react';
import { Calendar, Award, MessageCircle, Bot } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import StudentReviewModal from '../components/StudentReviewModal';
import { useNotification } from '../contexts/NotificationContext';
import apiService from '../services/api';

const HistoryPage = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const { showError } = useNotification();

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const data = await apiService.getSubmissions();
      setSubmissions(data);
    } catch (error) {
      showError('Failed to fetch submission history');
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner text="Loading your submissions..." />
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="text-center py-12">
        <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No submissions yet</h3>
        <p className="text-gray-600">Start by submitting your first assignment!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">My Submissions</h2>
          <p className="text-gray-600 mt-1">Track your progress and view feedback</p>
        </div>

        <div className="divide-y divide-gray-200">
          {submissions.map((submission) => (
            <div
              key={submission.id}
              onClick={() => handleSubmissionClick(submission)}
              className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {submission.question}
                  </h3>
                  
                  <div className="flex items-center space-x-6 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {submission.date}
                    </div>
                    
                    <div className="flex items-center">
                      <Award className="w-4 h-4 mr-1" />
                      {submission.score}
                    </div>
                    
                    <div className="flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-2 ${
                        submission.teacherReviewed ? 'bg-green-500' : 'bg-yellow-500'
                      }`} />
                      {submission.teacherReviewed ? 'Reviewed' : 'AI-Graded'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-gray-400">
                  <MessageCircle className="w-5 h-5" />
                  <Bot className="w-5 h-5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedSubmission && (
        <StudentReviewModal
          submission={selectedSubmission}
          isOpen={!!selectedSubmission}
          onClose={() => setSelectedSubmission(null)}
        />
      )}
    </div>
  );
};

export default HistoryPage;