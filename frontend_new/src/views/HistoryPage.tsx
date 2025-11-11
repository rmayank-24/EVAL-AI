import { useState, useEffect } from 'react';
import { Calendar, Award, MessageCircle, Bot, FileText } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import StudentReviewModal from '../components/StudentReviewModal';
import { useNotification } from '../contexts/NotificationContext';
import apiService from '../services/api';
import { motion } from 'framer-motion';

// Define types for our state and data
interface Submission {
  id: string;
  question: string;
  date: string;
  score: string;
  teacherReviewed: boolean;
  createdAt: { seconds: number };
  enhancedFeatures?: {
    multiAgent: boolean;
    plagiarismCheck: boolean;
    explainableAI: boolean;
  };
  plagiarismReport?: {
    verdict: {
      severity: string;
      overallScore: string;
      color: string;
    };
  };
  aiFeedback?: {
    multiAgent?: any;
  };
}

interface NotificationContextType {
  showError: (message: string) => void;
}

const HistoryPage = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const { showError } = useNotification() as NotificationContextType;

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

  const handleSubmissionClick = async (submission: Submission) => {
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="bg-gray-900/30 border border-white/10 rounded-xl p-6 backdrop-blur-lg">
        <h2 className="text-xl font-bold text-white font-heading">My Submissions</h2>
        <p className="text-gray-400 mt-1 font-body">Track your progress and view feedback</p>
      </div>

      {submissions.length === 0 ? (
        <div className="text-center py-12 bg-gray-900/30 border border-white/10 rounded-xl">
          <FileText className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2 font-mono">No submissions yet</h3>
          <p className="text-gray-400 font-body">Start by submitting your first assignment!</p>
        </div>
      ) : (
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
        >
          {submissions.map((submission) => (
            <motion.div
              key={submission.id}
              onClick={() => handleSubmissionClick(submission)}
              className="bg-gray-900/30 border border-white/10 rounded-xl p-6 cursor-pointer hover:bg-gray-800/40 transition-colors hover:-translate-y-1"
              variants={itemVariants}
              whileHover={{ scale: 1.03 }}
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-md font-medium text-white font-mono truncate flex-1">
                  {submission.question}
                </h3>
                {submission.enhancedFeatures && (
                  submission.enhancedFeatures.multiAgent || 
                  submission.enhancedFeatures.plagiarismCheck || 
                  submission.enhancedFeatures.explainableAI
                ) && (
                  <span className="ml-2 px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded border border-purple-500/30 whitespace-nowrap">
                    ✨ Enhanced
                  </span>
                )}
              </div>
              
              <div className="space-y-2 text-sm text-gray-400 font-mono">
                <div className="flex items-center"><Calendar className="w-4 h-4 mr-2" />{submission.date}</div>
                <div className="flex items-center"><Award className="w-4 h-4 mr-2 text-yellow-400" />Score: {submission.score}</div>
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${submission.teacherReviewed ? 'bg-green-400' : 'bg-yellow-400'}`} />
                  {submission.teacherReviewed ? 'Reviewed' : 'AI-Graded'}
                </div>
              </div>

              {/* Enhanced Features Badges */}
              {submission.enhancedFeatures && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {submission.enhancedFeatures.multiAgent && (
                    <span className="px-2 py-1 bg-purple-500/10 text-purple-300 text-xs rounded border border-purple-500/20">
                      🤖 Multi-Agent
                    </span>
                  )}
                  {submission.enhancedFeatures.plagiarismCheck && submission.plagiarismReport && (
                    <span 
                      className="px-2 py-1 text-xs rounded border"
                      style={{
                        backgroundColor: `${submission.plagiarismReport.verdict.color}10`,
                        borderColor: `${submission.plagiarismReport.verdict.color}30`,
                        color: submission.plagiarismReport.verdict.color
                      }}
                    >
                      🔍 {submission.plagiarismReport.verdict.overallScore}%
                    </span>
                  )}
                  {submission.enhancedFeatures.explainableAI && (
                    <span className="px-2 py-1 bg-blue-500/10 text-blue-300 text-xs rounded border border-blue-500/20">
                      💡 Explainable
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-center space-x-2 text-gray-500 mt-4 pt-4 border-t border-white/10">
                <MessageCircle className="w-5 h-5" />
                <Bot className="w-5 h-5" />
                <span className="text-xs font-body">View Details</span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {selectedSubmission && (
        <StudentReviewModal
          submission={selectedSubmission}
          isOpen={!!selectedSubmission}
          onClose={() => setSelectedSubmission(null)}
        />
      )}
    </motion.div>
  );
};

export default HistoryPage;
