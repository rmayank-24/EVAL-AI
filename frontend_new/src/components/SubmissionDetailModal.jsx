import React, { useState } from 'react';
import { X, Award, Clock, MessageCircle, Bot, FileText, Image, Save, Eye, EyeOff } from 'lucide-react';
import CommentThread from './CommentThread';
import ChatbotModal from './ChatbotModal';
import LoadingSpinner from './LoadingSpinner';
import { useNotification } from '../contexts/NotificationContext';
import apiService from '../services/api';

const SubmissionDetailModal = ({ submission, isOpen, onClose, onUpdate }) => {
  const [showComments, setShowComments] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const [editing, setEditing] = useState(false);
  const [teacherScore, setTeacherScore] = useState(submission?.teacherScore || '');
  const [teacherFeedback, setTeacherFeedback] = useState(submission?.teacherFeedback || '');
  const [showScoreToStudent, setShowScoreToStudent] = useState(submission?.showScoreToStudent ?? true);
  const [saving, setSaving] = useState(false);
  const { showError, showSuccess } = useNotification();

  if (!isOpen || !submission) return null;

  const handleSaveReview = async () => {
    setSaving(true);
    try {
      const updatedSubmission = await apiService.reviewSubmission(
        submission.id,
        teacherScore,
        teacherFeedback,
        showScoreToStudent
      );
      
      showSuccess('Review saved successfully!');
      setEditing(false);
      onUpdate(updatedSubmission);
    } catch (error) {
      showError('Failed to save review');
    } finally {
      setSaving(false);
    }
  };

  const finalScore = submission.teacherScore || submission.aiFeedback?.score;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Review Submission</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {submission.question}
              </h3>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {new Date(submission.createdAt?.seconds * 1000).toLocaleDateString()}
                </div>
                <div className="flex items-center">
                  <Award className="w-4 h-4 mr-1" />
                  {finalScore}
                </div>
              </div>
            </div>

            {submission.base64Image && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Student Submission:</h4>
                <div className="border rounded-lg p-4">
                  <img
                    src={submission.base64Image}
                    alt="Submitted work"
                    className="max-w-full h-auto rounded-lg"
                  />
                </div>
              </div>
            )}

            {submission.fileName && !submission.base64Image && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Student Submission:</h4>
                <div className="flex items-center p-4 bg-gray-50 rounded-lg border">
                  {submission.fileType?.startsWith('image/') ? (
                    <Image className="w-6 h-6 text-blue-600 mr-3" />
                  ) : (
                    <FileText className="w-6 h-6 text-blue-600 mr-3" />
                  )}
                  <span className="font-medium text-gray-900">{submission.fileName}</span>
                </div>
              </div>
            )}

            {submission.aiFeedback && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-3">Original AI Feedback:</h4>
                <div className="space-y-2">
                  <p><strong>Score:</strong> {submission.aiFeedback.score}</p>
                  <p><strong>Evaluation:</strong> {submission.aiFeedback.evaluation}</p>
                  {submission.aiFeedback.mistakes && submission.aiFeedback.mistakes.length > 0 && (
                    <div>
                      <strong>Mistakes:</strong>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        {submission.aiFeedback.mistakes.map((mistake, index) => (
                          <li key={index} className="text-sm text-blue-800">{mistake}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {submission.aiFeedback.feedback && (
                    <p><strong>Feedback:</strong> {submission.aiFeedback.feedback}</p>
                  )}
                </div>
              </div>
            )}

            <div className="bg-gray-50 p-4 rounded-lg border">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-gray-900">Teacher Review</h4>
                {!editing && (
                  <button
                    onClick={() => setEditing(true)}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
                  >
                    Edit Review
                  </button>
                )}
              </div>

              {editing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Score (optional)
                    </label>
                    <input
                      type="text"
                      value={teacherScore}
                      onChange={(e) => setTeacherScore(e.target.value)}
                      placeholder="e.g., 8/10"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Feedback (optional)
                    </label>
                    <textarea
                      value={teacherFeedback}
                      onChange={(e) => setTeacherFeedback(e.target.value)}
                      rows={4}
                      placeholder="Provide detailed feedback for the student..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="showScore"
                      checked={showScoreToStudent}
                      onChange={(e) => setShowScoreToStudent(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="showScore" className="ml-2 text-sm text-gray-700">
                      Show score and feedback to student
                    </label>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={handleSaveReview}
                      disabled={saving}
                      className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      {saving ? (
                        <LoadingSpinner size="small" text="Saving..." />
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Review
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setEditing(false)}
                      className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {submission.teacherScore && (
                    <p><strong>Teacher Score:</strong> {submission.teacherScore}</p>
                  )}
                  {submission.teacherFeedback && (
                    <p><strong>Teacher Feedback:</strong> {submission.teacherFeedback}</p>
                  )}
                  {!submission.teacherScore && !submission.teacherFeedback && (
                    <p className="text-gray-500 italic">No teacher review yet</p>
                  )}
                  <div className="flex items-center text-sm text-gray-600">
                    {submission.showScoreToStudent !== false ? (
                      <>
                        <Eye className="w-4 h-4 mr-1" />
                        Visible to student
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-4 h-4 mr-1" />
                        Hidden from student
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex space-x-4 pt-6 border-t border-gray-200">
              <button
                onClick={() => setShowComments(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Discussion Thread
              </button>
              
              <button
                onClick={() => setShowChatbot(true)}
                className="flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                <Bot className="w-4 h-4 mr-2" />
                AI Assistant
              </button>
            </div>
          </div>
        </div>
      </div>

      {showComments && (
        <CommentThread
          submissionId={submission.id}
          isOpen={showComments}
          onClose={() => setShowComments(false)}
        />
      )}

      {showChatbot && (
        <ChatbotModal
          submissionId={submission.id}
          isOpen={showChatbot}
          onClose={() => setShowChatbot(false)}
        />
      )}
    </div>
  );
};

export default SubmissionDetailModal;