import React, { useState } from 'react';
import { X, Award, Clock, MessageCircle, Bot, FileText, Image } from 'lucide-react';
import CommentThread from './CommentThread';
import ChatbotModal from './ChatbotModal';

const StudentReviewModal = ({ submission, isOpen, onClose }) => {
  const [showComments, setShowComments] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);

  if (!isOpen || !submission) return null;

  const finalScore = submission.teacherScore || submission.aiFeedback?.score;
  const finalFeedback = submission.teacherFeedback || submission.aiFeedback?.feedback;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Submission Details</h2>
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
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${
                    submission.teacherReviewed ? 'bg-green-500' : 'bg-yellow-500'
                  }`} />
                  {submission.teacherReviewed ? 'Teacher Reviewed' : 'AI Graded'}
                </div>
              </div>
            </div>

            {submission.base64Image && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Your Submission:</h4>
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
                <h4 className="font-medium text-gray-900 mb-3">Your Submission:</h4>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">Final Score</h4>
                <p className="text-2xl font-bold text-blue-600">{finalScore}</p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="font-medium text-green-900 mb-2">Status</h4>
                <p className="text-green-800">
                  {submission.teacherReviewed ? 'Reviewed by Teacher' : 'AI Evaluation'}
                </p>
              </div>
            </div>

            {finalFeedback && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">
                  {submission.teacherReviewed ? 'Teacher Feedback:' : 'AI Feedback:'}
                </h4>
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <p className="text-gray-700 leading-relaxed">{finalFeedback}</p>
                </div>
              </div>
            )}

            {submission.aiFeedback?.mistakes && submission.aiFeedback.mistakes.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Areas for Improvement:</h4>
                <ul className="space-y-2">
                  {submission.aiFeedback.mistakes.map((mistake, index) => (
                    <li key={index} className="flex items-start">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3 mt-2 flex-shrink-0" />
                      <span className="text-gray-700">{mistake}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex space-x-4 pt-6 border-t border-gray-200">
              <button
                onClick={() => setShowComments(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Chat with Teacher
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

export default StudentReviewModal;