import { useState, useEffect } from 'react';
import { X, Award, Clock, MessageCircle, Bot, FileText, Image, Save, Eye, EyeOff, Brain, Shield, Sparkles, RefreshCw } from 'lucide-react';
import CommentThread from './CommentThread';
import ChatbotModal from './ChatbotModal';
import LoadingSpinner from './LoadingSpinner';
import PlagiarismReport from './PlagiarismReport';
import MultiAgentBreakdown from './MultiAgentBreakdown';
import ExplainabilityViewer from './ExplainabilityViewer';
import { useNotificationContext } from '../contexts/NotificationContext';
import apiService from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

// Define types for the data structures
interface AiFeedback {
  score: string;
  evaluation: string;
  mistakes: string[];
  feedback: string;
  multiAgent?: any;
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
  plagiarismReport?: any;
  explainability?: any;
  enhancedFeatures?: {
    multiAgent: boolean;
    plagiarismCheck: boolean;
    explainableAI: boolean;
  };
}

interface SubmissionDetailModalProps {
  submission: Submission | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedSubmission: Submission) => void;
}

interface NotificationContextType {
  showError: (message: string) => void;
  showSuccess: (message: string) => void;
}

const SubmissionDetailModal = ({ submission, isOpen, onClose, onUpdate }: SubmissionDetailModalProps) => {
  // Existing state
  const [showComments, setShowComments] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const [editing, setEditing] = useState(false);
  const [teacherScore, setTeacherScore] = useState(submission?.teacherScore || '');
  const [teacherFeedback, setTeacherFeedback] = useState(submission?.teacherFeedback || '');
  const [showScoreToStudent, setShowScoreToStudent] = useState(submission?.showScoreToStudent ?? true);
  const [saving, setSaving] = useState(false);
  
  // Enhanced features state
  const [activeTab, setActiveTab] = useState('evaluation');
  const [plagiarismData, setPlagiarismData] = useState<any>(null);
  const [explainabilityData, setExplainabilityData] = useState<any>(null);
  const [multiAgentData, setMultiAgentData] = useState<any>(null);
  const [loadingEnhancedData, setLoadingEnhancedData] = useState(false);
  const [recheckingPlagiarism, setRecheckingPlagiarism] = useState(false);
  
  const { showError, showSuccess } = useNotificationContext() as NotificationContextType;

  // Fetch enhanced data when submission changes
  useEffect(() => {
    if (submission?.id) {
      fetchEnhancedData();
      setTeacherScore(submission.teacherScore || '');
      setTeacherFeedback(submission.teacherFeedback || '');
      setShowScoreToStudent(submission.showScoreToStudent ?? true);
    }
  }, [submission?.id]);

  const fetchEnhancedData = async () => {
    if (!submission?.id) return;
    
    setLoadingEnhancedData(true);
    try {
      const [plagiarism, explainability, multiAgent] = await Promise.all([
        apiService.getPlagiarismReport(submission.id).catch(() => null),
        apiService.getExplainability(submission.id).catch(() => null),
        apiService.getMultiAgentData(submission.id).catch(() => null)
      ]);
      
      setPlagiarismData(plagiarism);
      setExplainabilityData(explainability);
      setMultiAgentData(multiAgent);
    } catch (error) {
      console.error('Failed to fetch enhanced data:', error);
    } finally {
      setLoadingEnhancedData(false);
    }
  };

  const handleRecheckPlagiarism = async () => {
    if (!submission?.id) return;
    
    setRecheckingPlagiarism(true);
    try {
      const result = await apiService.recheckPlagiarism(submission.id);
      setPlagiarismData(result.report);
      showSuccess('Plagiarism check completed!');
    } catch (error) {
      showError('Failed to recheck plagiarism');
    } finally {
      setRecheckingPlagiarism(false);
    }
  };

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

  // Determine available tabs
  const hasMultiAgent = multiAgentData !== null;
  const hasPlagiarism = plagiarismData !== null;
  const hasExplainability = explainabilityData !== null;

  const TabButton = ({ id, label, icon, badge, isActive, onClick }: any) => (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-4 px-8 py-6 font-medium text-lg transition-all whitespace-nowrap ${
        isActive
          ? 'text-white bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border-b-3 border-cyan-400'
          : 'text-gray-400 hover:text-white hover:bg-white/5'
      }`}
    >
      <span className="flex-shrink-0">{icon}</span>
      <span className="font-semibold tracking-wide">{label}</span>
      {badge && (
        <span className="ml-2 px-3 py-1.5 bg-purple-500/30 text-purple-200 text-sm rounded-full font-medium">
          {badge}
        </span>
      )}
      {isActive && (
        <motion.div
          layoutId="activeTab"
          className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 to-purple-400"
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        />
      )}
    </button>
  );

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
            onClick={(e) => e.stopPropagation()}
            className="bg-gray-900/95 border border-white/10 rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col backdrop-blur-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10 bg-gradient-to-r from-purple-500/10 to-cyan-500/10">
              <div>
                <h2 className="text-2xl font-bold text-white font-heading">Submission Review</h2>
                <div className="flex items-center gap-3 mt-2 text-sm">
                  <span className="text-gray-400 font-mono">{submission.question}</span>
                  {submission.enhancedFeatures && (
                    <div className="flex items-center gap-2">
                      {submission.enhancedFeatures.multiAgent && (
                        <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded border border-purple-500/30">
                          🤖 Multi-Agent
                        </span>
                      )}
                      {submission.enhancedFeatures.plagiarismCheck && (
                        <span className="px-2 py-1 bg-cyan-500/20 text-cyan-300 text-xs rounded border border-cyan-500/30">
                          🔍 Plagiarism
                        </span>
                      )}
                      {submission.enhancedFeatures.explainableAI && (
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded border border-blue-500/30">
                          💡 Explainable
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Tabs Navigation */}
            <div className="border-b-2 border-white/10 bg-gradient-to-r from-gray-900/80 to-gray-800/80 backdrop-blur-sm overflow-x-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900 min-h-[80px]">
              <nav className="flex min-w-max px-4 py-2">
                <TabButton
                  id="evaluation"
                  label="Evaluation"
                  icon={<Award className="w-6 h-6" />}
                  isActive={activeTab === 'evaluation'}
                  onClick={() => setActiveTab('evaluation')}
                />
                {hasMultiAgent && (
                  <TabButton
                    id="multiAgent"
                    label="Multi-Agent"
                    icon={<Sparkles className="w-6 h-6" />}
                    badge="🤖"
                    isActive={activeTab === 'multiAgent'}
                    onClick={() => setActiveTab('multiAgent')}
                  />
                )}
                {hasPlagiarism && (
                  <TabButton
                    id="plagiarism"
                    label="Plagiarism"
                    icon={<Shield className="w-6 h-6" />}
                    badge={plagiarismData?.verdict?.severity === 'critical' ? '⚠️' : '✓'}
                    isActive={activeTab === 'plagiarism'}
                    onClick={() => setActiveTab('plagiarism')}
                  />
                )}
                {hasExplainability && (
                  <TabButton
                    id="explainability"
                    label="Explainability"
                    icon={<Brain className="w-6 h-6" />}
                    isActive={activeTab === 'explainability'}
                    onClick={() => setActiveTab('explainability')}
                  />
                )}
                <TabButton
                  id="comments"
                  label="Discussion"
                  icon={<MessageCircle className="w-6 h-6" />}
                  isActive={activeTab === 'comments'}
                  onClick={() => setActiveTab('comments')}
                />
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-8 overflow-y-auto flex-1 bg-[#0A0F18] max-h-[calc(100vh-300px)]">
              {loadingEnhancedData && activeTab !== 'evaluation' && (
                <div className="flex items-center justify-center h-64">
                  <LoadingSpinner text="Loading enhanced data..." />
                </div>
              )}

              {/* Evaluation Tab */}
              {activeTab === 'evaluation' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Score & Metadata */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-gray-400 font-mono">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1.5" />
                        {new Date(submission.createdAt?.seconds * 1000).toLocaleDateString()}
                      </div>
                      <div className="flex items-center">
                        <Award className="w-4 h-4 mr-1.5 text-yellow-400" />
                        Score: <span className="ml-1 text-white font-bold">{finalScore}</span>
                      </div>
                    </div>
                  </div>

                  {/* Submission File */}
                  {submission.base64Image && (
                    <div>
                      <h4 className="font-medium text-gray-300 mb-3 font-mono">Student Submission:</h4>
                      <div className="border border-white/10 rounded-lg p-2 bg-black/20">
                        <img src={submission.base64Image} alt="Submitted work" className="max-w-full h-auto rounded-md" />
                      </div>
                    </div>
                  )}

                  {submission.fileName && !submission.base64Image && (
                    <div>
                      <h4 className="font-medium text-gray-300 mb-3 font-mono">Student Submission:</h4>
                      <div className="flex items-center p-4 bg-gray-800/50 rounded-lg border border-white/10">
                        {submission.fileType?.startsWith('image/') ? (
                          <Image className="w-6 h-6 text-blue-400 mr-3" />
                        ) : (
                          <FileText className="w-6 h-6 text-blue-400 mr-3" />
                        )}
                        <span className="font-medium text-gray-200 font-mono">{submission.fileName}</span>
                      </div>
                    </div>
                  )}

                  {/* AI Feedback */}
                  {submission.aiFeedback && (
                    <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 p-5 rounded-lg border border-blue-500/20">
                      <h4 className="font-medium text-blue-300 mb-3 font-mono flex items-center gap-2">
                        <Bot className="w-5 h-5" />
                        AI Evaluation
                      </h4>
                      <div className="space-y-3 text-sm text-gray-300 font-body">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-black/20 rounded-lg p-3">
                            <p className="text-xs text-gray-400 mb-1">Score</p>
                            <p className="text-2xl font-bold text-cyan-400">{submission.aiFeedback.score}</p>
                          </div>
                          <div className="bg-black/20 rounded-lg p-3">
                            <p className="text-xs text-gray-400 mb-1">Evaluation</p>
                            <p className="text-sm text-white">{submission.aiFeedback.evaluation}</p>
                          </div>
                        </div>
                        {submission.aiFeedback.mistakes?.length > 0 && (
                          <div>
                            <strong className="text-orange-300">Areas for Improvement:</strong>
                            <ul className="list-disc list-inside mt-2 space-y-1">
                              {submission.aiFeedback.mistakes.map((mistake, index) => (
                                <li key={index} className="text-gray-300">{mistake}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {submission.aiFeedback.feedback && (
                          <div>
                            <strong className="text-green-300">Detailed Feedback:</strong>
                            <p className="mt-2 leading-relaxed">{submission.aiFeedback.feedback}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Teacher Review */}
                  <div className="bg-gray-800/30 p-5 rounded-lg border border-white/10">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-white font-mono flex items-center gap-2">
                        <Award className="w-5 h-5 text-yellow-400" />
                        Teacher Review
                      </h4>
                      {!editing && (
                        <button
                          onClick={() => setEditing(true)}
                          className="text-cyan-400 hover:text-cyan-300 text-sm font-mono transition-colors"
                        >
                          Edit Review
                        </button>
                      )}
                    </div>

                    {editing ? (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm text-gray-400 mb-2">Score</label>
                          <input
                            type="text"
                            value={teacherScore}
                            onChange={(e) => setTeacherScore(e.target.value)}
                            placeholder="e.g., 8/10"
                            className="w-full px-3 py-2 bg-gray-800/50 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-cyan-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-400 mb-2">Feedback</label>
                          <textarea
                            value={teacherFeedback}
                            onChange={(e) => setTeacherFeedback(e.target.value)}
                            rows={4}
                            placeholder="Provide detailed feedback..."
                            className="w-full px-3 py-2 bg-gray-800/50 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-cyan-500"
                          />
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="showScore"
                            checked={showScoreToStudent}
                            onChange={(e) => setShowScoreToStudent(e.target.checked)}
                            className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                          />
                          <label htmlFor="showScore" className="ml-2 text-sm text-gray-400">
                            Show score and feedback to student
                          </label>
                        </div>
                        <div className="flex space-x-3">
                          <button
                            onClick={handleSaveReview}
                            disabled={saving}
                            className="flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 font-mono shadow-lg"
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
                            className="px-4 py-2 text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg font-mono"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3 text-sm text-gray-300 font-body">
                        {submission.teacherScore && (
                          <div className="bg-black/20 rounded-lg p-3">
                            <p className="text-xs text-gray-400 mb-1">Teacher Score</p>
                            <p className="text-xl font-bold text-yellow-400">{submission.teacherScore}</p>
                          </div>
                        )}
                        {submission.teacherFeedback && (
                          <div>
                            <strong className="text-gray-400">Teacher Feedback:</strong>
                            <p className="mt-2 leading-relaxed">{submission.teacherFeedback}</p>
                          </div>
                        )}
                        {!submission.teacherScore && !submission.teacherFeedback && (
                          <p className="text-gray-500 italic">No teacher review yet</p>
                        )}
                        <div className="flex items-center text-xs text-gray-400 pt-2 border-t border-white/10">
                          {submission.showScoreToStudent !== false ? (
                            <>
                              <Eye className="w-4 h-4 mr-1.5" />
                              Visible to student
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-4 h-4 mr-1.5" />
                              Hidden from student
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-4 pt-4">
                    <button
                      onClick={() => setShowChatbot(true)}
                      className="flex items-center px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg hover:from-cyan-700 hover:to-blue-700 transition-colors font-mono shadow-lg"
                    >
                      <Bot className="w-4 h-4 mr-2" />
                      AI Assistant
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Multi-Agent Tab */}
              {activeTab === 'multiAgent' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {multiAgentData ? (
                    <MultiAgentBreakdown data={multiAgentData} />
                  ) : (
                    <div className="text-center py-12 text-gray-400">
                      <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No multi-agent evaluation data available</p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Plagiarism Tab */}
              {activeTab === 'plagiarism' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {plagiarismData ? (
                    <PlagiarismReport
                      report={plagiarismData}
                      submissionId={submission.id}
                      onRecheck={handleRecheckPlagiarism}
                      isRechecking={recheckingPlagiarism}
                    />
                  ) : (
                    <div className="text-center py-12 text-gray-400">
                      <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No plagiarism report available</p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Explainability Tab */}
              {activeTab === 'explainability' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {explainabilityData ? (
                    <ExplainabilityViewer data={explainabilityData} />
                  ) : (
                    <div className="text-center py-12 text-gray-400">
                      <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No explainability data available</p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Comments Tab */}
              {activeTab === 'comments' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <CommentThread submissionId={submission.id} isOpen={true} onClose={() => {}} />
                </motion.div>
              )}
            </div>
          </motion.div>

          {showChatbot && (
            <ChatbotModal
              submissionId={submission.id}
              isOpen={showChatbot}
              onClose={() => setShowChatbot(false)}
            />
          )}
        </motion.div>
      )}
      
      {/* Custom Scrollbar Styles */}
      <style>{`
        .scrollbar-thin::-webkit-scrollbar {
          height: 10px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: rgba(17, 24, 39, 0.5);
          border-radius: 5px;
          margin: 0 8px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(107, 114, 128, 0.8);
          border-radius: 5px;
          transition: background 0.2s;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: rgba(156, 163, 175, 0.9);
        }
      `}</style>
    </AnimatePresence>
  );
};

export default SubmissionDetailModal;
