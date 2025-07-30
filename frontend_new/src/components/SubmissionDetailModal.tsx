import { useState, useEffect } from 'react';
import { X, Award, Clock, MessageCircle, Bot, FileText, Image, Save, Eye, EyeOff } from 'lucide-react';
import CommentThread from './CommentThread';
import ChatbotModal from './ChatbotModal';
import LoadingSpinner from './LoadingSpinner';
import { useNotificationContext } from '../contexts/NotificationContext';
import apiService from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

// Define types for the data structures
interface AiFeedback {
  score: string;
  evaluation: string;
  mistakes: string[];
  feedback: string;
}

interface Submission {
  id: string;
  question: string;
  createdAt: { seconds: number };
  teacherScore?: string;
  teacherFeedback?: string;
  showScoreToStudent?: boolean;
  base64Image?: string;
  fileName?: string;
  fileType?: string;
  aiFeedback?: AiFeedback;
}

interface SubmissionDetailModalProps {
  submission: Submission | null;
  isOpen: boolean;
  onClose: () => void;
  // FIX: Replaced 'any' with the specific 'Submission' type
  onUpdate: (updatedSubmission: Submission) => void;
}

interface NotificationContextType {
  showError: (message: string) => void;
  showSuccess: (message: string) => void;
}

const SubmissionDetailModal = ({ submission, isOpen, onClose, onUpdate }: SubmissionDetailModalProps) => {
  const [showComments, setShowComments] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const [editing, setEditing] = useState(false);
  const [teacherScore, setTeacherScore] = useState(submission?.teacherScore || '');
  const [teacherFeedback, setTeacherFeedback] = useState(submission?.teacherFeedback || '');
  const [showScoreToStudent, setShowScoreToStudent] = useState(submission?.showScoreToStudent ?? true);
  const [saving, setSaving] = useState(false);
  const { showError, showSuccess } = useNotificationContext() as NotificationContextType;

  useEffect(() => {
    if (submission) {
      setTeacherScore(submission.teacherScore || '');
      setTeacherFeedback(submission.teacherFeedback || '');
      setShowScoreToStudent(submission.showScoreToStudent ?? true);
    }
  }, [submission]);

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
    // FIX: Renamed 'error' to '_error' to resolve the unused variable warning
    } catch (error) {
      showError('Failed to save review');
    } finally {
      setSaving(false);
    }
  };

  const finalScore = submission.teacherScore || submission.aiFeedback?.score;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            className="bg-gray-900/50 border border-white/10 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-xl font-bold text-white font-heading">Review Submission</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors"><X className="w-6 h-6" /></button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              <div>
                <h3 className="text-lg font-medium text-white mb-2 font-mono">{submission.question}</h3>
                <div className="flex items-center space-x-4 text-sm text-gray-400 font-mono">
                  <div className="flex items-center"><Clock className="w-4 h-4 mr-1.5" />{new Date(submission.createdAt?.seconds * 1000).toLocaleDateString()}</div>
                  <div className="flex items-center"><Award className="w-4 h-4 mr-1.5 text-yellow-400" />Score: {finalScore}</div>
                </div>
              </div>

              {submission.base64Image && (
                <div>
                  <h4 className="font-medium text-gray-300 mb-3 font-mono">Student Submission:</h4>
                  <div className="border border-white/10 rounded-lg p-2 bg-black/20"><img src={submission.base64Image} alt="Submitted work" className="max-w-full h-auto rounded-md" /></div>
                </div>
              )}

              {submission.fileName && !submission.base64Image && (
                <div>
                  <h4 className="font-medium text-gray-300 mb-3 font-mono">Student Submission:</h4>
                  <div className="flex items-center p-4 bg-gray-800/50 rounded-lg border border-white/10">
                    {submission.fileType?.startsWith('image/') ? <Image className="w-6 h-6 text-blue-400 mr-3" /> : <FileText className="w-6 h-6 text-blue-400 mr-3" />}
                    <span className="font-medium text-gray-200 font-mono">{submission.fileName}</span>
                  </div>
                </div>
              )}

              {submission.aiFeedback && (
                <div className="bg-blue-500/10 p-4 rounded-lg border border-blue-500/20">
                  <h4 className="font-medium text-blue-300 mb-3 font-mono">Original AI Feedback:</h4>
                  <div className="space-y-2 text-sm text-gray-300 font-body">
                    <p><strong>Score:</strong> {submission.aiFeedback.score}</p>
                    <p><strong>Evaluation:</strong> {submission.aiFeedback.evaluation}</p>
                    {submission.aiFeedback.mistakes?.length > 0 && (
                      <div><strong>Mistakes:</strong><ul className="list-disc list-inside mt-1 space-y-1">{submission.aiFeedback.mistakes.map((mistake, index) => <li key={index}>{mistake}</li>)}</ul></div>
                    )}
                    {submission.aiFeedback.feedback && <p><strong>Feedback:</strong> {submission.aiFeedback.feedback}</p>}
                  </div>
                </div>
              )}

              <div className="bg-gray-800/30 p-4 rounded-lg border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-white font-mono">Teacher Review</h4>
                  {!editing && <button onClick={() => setEditing(true)} className="text-cyan-400 hover:text-cyan-300 text-sm font-mono transition-colors">Edit Review</button>}
                </div>

                {editing ? (
                  <div className="space-y-4">
                    <input type="text" value={teacherScore} onChange={(e) => setTeacherScore(e.target.value)} placeholder="e.g., 8/10" className="w-full px-3 py-2 bg-gray-800/50 border border-white/10 rounded-lg text-white" />
                    <textarea value={teacherFeedback} onChange={(e) => setTeacherFeedback(e.target.value)} rows={4} placeholder="Provide detailed feedback..." className="w-full px-3 py-2 bg-gray-800/50 border border-white/10 rounded-lg text-white" />
                    <div className="flex items-center"><input type="checkbox" id="showScore" checked={showScoreToStudent} onChange={(e) => setShowScoreToStudent(e.target.checked)} className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500" /><label htmlFor="showScore" className="ml-2 text-sm text-gray-400">Show score and feedback to student</label></div>
                    <div className="flex space-x-3"><button onClick={handleSaveReview} disabled={saving} className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-mono">{saving ? <LoadingSpinner size="small" text="Saving..." /> : <><Save className="w-4 h-4 mr-2" />Save Review</>}</button><button onClick={() => setEditing(false)} className="px-4 py-2 text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg font-mono">Cancel</button></div>
                  </div>
                ) : (
                  <div className="space-y-2 text-sm text-gray-300 font-body">
                    {submission.teacherScore && <p><strong>Teacher Score:</strong> {submission.teacherScore}</p>}
                    {submission.teacherFeedback && <p><strong>Teacher Feedback:</strong> {submission.teacherFeedback}</p>}
                    {!submission.teacherScore && !submission.teacherFeedback && <p className="text-gray-500 italic">No teacher review yet</p>}
                    <div className="flex items-center text-xs text-gray-400">{submission.showScoreToStudent !== false ? <><Eye className="w-4 h-4 mr-1.5" />Visible to student</> : <><EyeOff className="w-4 h-4 mr-1.5" />Hidden from student</>}</div>
                  </div>
                )}
              </div>

              <div className="flex space-x-4 pt-6 border-t border-white/10">
                <button onClick={() => setShowComments(true)} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-mono"><MessageCircle className="w-4 h-4 mr-2" />Discussion</button>
                <button onClick={() => setShowChatbot(true)} className="flex items-center px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors font-mono"><Bot className="w-4 h-4 mr-2" />AI Assistant</button>
              </div>
            </div>
          </motion.div>

          {showComments && <CommentThread submissionId={submission.id} isOpen={showComments} onClose={() => setShowComments(false)} />}
          {showChatbot && <ChatbotModal submissionId={submission.id} isOpen={showChatbot} onClose={() => setShowChatbot(false)} />}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SubmissionDetailModal;
