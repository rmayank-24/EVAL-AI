import React, { useState, useEffect, useRef } from 'react';
import { X, Send, MessageCircle, User } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import { useNotification } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';

const CommentThread = ({ submissionId, isOpen, onClose }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const { showError } = useNotification();
  const { role } = useAuth();

  useEffect(() => {
    if (isOpen && submissionId) {
      fetchComments();
    }
  }, [isOpen, submissionId]);

  useEffect(() => {
    scrollToBottom();
  }, [comments]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchComments = async () => {
    try {
      const data = await apiService.getComments(submissionId);
      setComments(data);
    } catch (error) {
      showError('Failed to fetch comments');
    } finally {
      setLoading(false);
    }
  };

  const handleSendComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || sending) return;

    setSending(true);
    try {
      const comment = await apiService.addComment(submissionId, newComment.trim());
      setComments(prev => [...prev, comment]);
      setNewComment('');
    } catch (error) {
      showError('Failed to send comment');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleString();
  };

  const getRoleColor = (commentRole) => {
    switch (commentRole) {
      case 'student':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'teacher':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center">
            <MessageCircle className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Discussion Thread</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="flex justify-center">
              <LoadingSpinner text="Loading comments..." />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div
                key={comment.id}
                className={`flex items-start space-x-3 ${
                  comment.authorRole === role ? 'flex-row-reverse space-x-reverse' : ''
                }`}
              >
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getRoleColor(comment.authorRole)}`}>
                    <User className="w-4 h-4" />
                  </div>
                </div>
                
                <div className={`flex-1 ${comment.authorRole === role ? 'text-right' : ''}`}>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm font-medium text-gray-900">
                      {comment.authorEmail}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(comment.authorRole)}`}>
                      {comment.authorRole}
                    </span>
                  </div>
                  
                  <div className={`inline-block max-w-xs md:max-w-md p-3 rounded-lg ${
                    comment.authorRole === role
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    <p className="text-sm">{comment.text}</p>
                  </div>
                  
                  <p className="text-xs text-gray-500 mt-1">
                    {formatTime(comment.createdAt)}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSendComment} className="p-4 border-t border-gray-200">
          <div className="flex space-x-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={!newComment.trim() || sending}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? (
                <LoadingSpinner size="small" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CommentThread;