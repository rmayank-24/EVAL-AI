import { useState, useEffect, useRef, FormEvent, useCallback } from 'react'; // 1. Import useCallback
import { X, Send, MessageCircle, User } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import { useNotificationContext } from '../contexts/NotificationContext';
import { useAuth } from '../hooks/useAuth'; // Corrected import';
import apiService from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

// Define types for component props and state
interface Comment {
  id: string;
  text: string;
  authorEmail: string;
  authorRole: 'student' | 'teacher' | 'admin';
  createdAt: string;
}

interface CommentThreadProps {
  submissionId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface NotificationContextType {
  showError: (message: string) => void;
}

const CommentThread = ({ submissionId, isOpen, onClose }: CommentThreadProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { showError } = useNotificationContext() as NotificationContextType;
  const { role } = useAuth();

  // 2. Wrap fetchComments in useCallback
  // This memoizes the function so it doesn't get recreated on every render,
  // making it safe to use as a dependency in useEffect.
  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiService.getComments(submissionId);
      setComments(data);
    } catch (error) {
      showError('Failed to fetch comments');
    } finally {
      setLoading(false);
    }
  }, [submissionId, showError]); // Dependencies for useCallback

  useEffect(() => {
    if (isOpen && submissionId) {
      fetchComments();
    }
    // 3. Add fetchComments to the dependency array to fix the warning.
  }, [isOpen, submissionId, fetchComments]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  const handleSendComment = async (e: FormEvent) => {
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

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getRoleColor = (commentRole: string) => {
    switch (commentRole) {
      case 'student': return 'bg-blue-500/10 text-blue-300';
      case 'teacher': return 'bg-green-500/10 text-green-300';
      case 'admin': return 'bg-purple-500/10 text-purple-300';
      default: return 'bg-gray-500/10 text-gray-400';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            className="bg-gray-900/50 border border-white/10 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center">
                <div className="bg-blue-500/10 p-2 rounded-full mr-3 border border-blue-500/20"><MessageCircle className="w-5 h-5 text-blue-400" /></div>
                <div>
                  <h3 className="text-lg font-bold text-white font-heading">Discussion Thread</h3>
                </div>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loading ? (
                <div className="flex justify-center p-8"><LoadingSpinner text="Loading comments..." /></div>
              ) : comments.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-600" />
                  <p className="font-body">No messages yet. Start the conversation!</p>
                </div>
              ) : (
                comments.map((comment) => (
                  <motion.div
                    key={comment.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex items-start space-x-3 ${comment.authorRole === role ? 'flex-row-reverse space-x-reverse' : ''}`}
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gray-800/50 border border-white/10"><User className="w-4 h-4 text-gray-400" /></div>
                    <div className={`flex-1 ${comment.authorRole === role ? 'text-right' : ''}`}>
                      <div className={`flex items-center space-x-2 mb-1 ${comment.authorRole === role ? 'justify-end' : ''}`}>
                        <span className="text-sm font-medium text-gray-200 font-mono">{comment.authorEmail}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRoleColor(comment.authorRole)}`}>{comment.authorRole}</span>
                      </div>
                      <div className={`inline-block max-w-xs md:max-w-md p-3 rounded-lg ${comment.authorRole === role ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white' : 'bg-gray-800/70 text-gray-300'}`}>
                        <p className="text-sm font-body">{comment.text}</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 font-mono">{formatTime(comment.createdAt)}</p>
                    </div>
                  </motion.div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendComment} className="p-4 border-t border-white/10">
              <div className="flex space-x-2">
                <input type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Type your message..." className="flex-1 px-3 py-2 bg-gray-800/50 border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white font-body" disabled={sending} />
                <button type="submit" disabled={!newComment.trim() || sending} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-mono">
                  {sending ? <LoadingSpinner size="small" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CommentThread;
