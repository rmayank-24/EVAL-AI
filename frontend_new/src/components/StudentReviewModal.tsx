import { useState, useEffect } from 'react';
import { X, Award, Clock, MessageCircle, Bot, FileText, Image } from 'lucide-react';
import CommentThread from './CommentThread';
import ChatbotModal from './ChatbotModal';
import { motion, AnimatePresence } from 'framer-motion';

// Define types for the data structures
interface AiFeedback {
  score: string;
  feedback: string;
  mistakes: string[];
}

interface Submission {
  id: string;
  question: string;
  createdAt: { seconds: number };
  teacherScore?: string;
  teacherFeedback?: string;
  teacherReviewed: boolean;
  base64Image?: string;
  fileName?: string;
  fileType?: string;
  aiFeedback?: AiFeedback;
}

interface StudentReviewModalProps {
  submission: Submission | null;
  isOpen: boolean;
  onClose: () => void;
}

const StudentReviewModal = ({ submission, isOpen, onClose }: StudentReviewModalProps) => {
  const [showComments, setShowComments] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);

  useEffect(() => {
    // Reset states when modal is reopened with a new submission
    if (isOpen) {
      setShowComments(false);
      setShowChatbot(false);
    }
  }, [isOpen]);

  if (!isOpen || !submission) return null;

  const finalScore = submission.teacherScore || submission.aiFeedback?.score;
  const finalFeedback = submission.teacherFeedback || submission.aiFeedback?.feedback;

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
            className="bg-gray-900/50 border border-white/10 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-white/10 flex-shrink-0">
              <h2 className="text-xl font-bold text-white font-heading">Submission Details</h2>
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
                  <h4 className="font-medium text-gray-300 mb-3 font-mono">Your Submission:</h4>
                  <div className="border border-white/10 rounded-lg p-2 bg-black/20"><img src={submission.base64Image} alt="Submitted work" className="max-w-full h-auto rounded-md" /></div>
                </div>
              )}

              {submission.fileName && !submission.base64Image && (
                <div>
                  <h4 className="font-medium text-gray-300 mb-3 font-mono">Your Submission:</h4>
                  <div className="flex items-center p-4 bg-gray-800/50 rounded-lg border border-white/10">
                    {submission.fileType?.startsWith('image/') ? <Image className="w-6 h-6 text-blue-400 mr-3" /> : <FileText className="w-6 h-6 text-blue-400 mr-3" />}
                    <span className="font-medium text-gray-200 font-mono">{submission.fileName}</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-500/10 p-4 rounded-lg border border-blue-500/20">
                  <h4 className="font-medium text-blue-300 mb-2 font-mono">Final Score</h4>
                  <p className="text-2xl font-bold text-white">{finalScore}</p>
                </div>
                <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/20">
                  <h4 className="font-medium text-green-300 mb-2 font-mono">Status</h4>
                  <p className="font-medium text-white">{submission.teacherReviewed ? 'Reviewed by Teacher' : 'AI Evaluation'}</p>
                </div>
              </div>

              {finalFeedback && (
                <div>
                  <h4 className="font-medium text-gray-300 mb-3 font-mono">{submission.teacherReviewed ? 'Teacher Feedback:' : 'AI Feedback:'}</h4>
                  <div className="bg-gray-800/30 p-4 rounded-lg border border-white/10">
                    <p className="text-gray-300 leading-relaxed font-body">{finalFeedback}</p>
                  </div>
                </div>
              )}

              {submission.aiFeedback?.mistakes && submission.aiFeedback.mistakes.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-300 mb-3 font-mono">Areas for Improvement:</h4>
                  <ul className="space-y-2">
                    {submission.aiFeedback.mistakes.map((mistake, index) => (
                      <li key={index} className="flex items-start">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full mr-3 mt-1.5 flex-shrink-0" />
                        <span className="text-gray-300 font-body">{mistake}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex space-x-4 pt-6 border-t border-white/10">
                <button onClick={() => setShowComments(true)} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-mono"><MessageCircle className="w-4 h-4 mr-2" />Chat with Teacher</button>
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

export default StudentReviewModal;
