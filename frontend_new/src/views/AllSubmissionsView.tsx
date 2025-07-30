import { useState, useEffect, useCallback } from 'react';
import { Calendar, Award, User, Eye, FileText } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import SubmissionDetailModal from '../components/SubmissionDetailModal';
// Keep useNotifications if you need the feed, but it's not for showError

// IMPORT THE CORRECT HOOK FOR TOAST NOTIFICATIONS
import { useNotification } from '../contexts/NotificationContext'; // <-- ADD THIS LINE
import apiService from '../services/api';
import { motion } from 'framer-motion';

// --- Type Definitions ---

// This type represents the summarized data for the list view.
interface SubmissionSummary {
  id: string;
  studentEmail: string;
  question: string;
  subjectName: string;
  score: string;
  teacherReviewed: boolean;
  date: string;
}

// This type represents the full data object, matching what SubmissionDetailModal expects.
interface SubmissionDetail {
  id: string;
  question: string;
  createdAt: { seconds: number };
  teacherScore?: string;
  teacherFeedback?: string;
  showScoreToStudent?: boolean;
  base64Image?: string;
  fileName?: string;
  fileType?: string;
  aiFeedback?: {
    score: string;
    evaluation: string;
    mistakes: string[];
    feedback: string;
  };
  teacherReviewed?: boolean;
}

const AllSubmissionsView = () => {
  const [submissions, setSubmissions] = useState<SubmissionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionDetail | null>(null);

  // CORRECTED: Destructure showError from useNotification()
  const { showError } = useNotification(); // <-- CHANGED THIS LINE

  // If you also need the notification feed data (like unreadCount), you would keep:
  // const { notifications, unreadCount, loading: notificationsLoading } = useNotifications();


  const fetchSubmissions = useCallback(async () => {
    try {
      const data = await apiService.getTeacherSubmissions();
      setSubmissions(data);
    } catch (_error) { // eslint-disable-next-line @typescript-eslint/no-unused-vars
      showError('Failed to fetch submissions');
    } finally {
      setLoading(false);
    }
  }, [showError]); // Depend on showError to ensure useCallback doesn't warn

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const handleSubmissionClick = async (submission: SubmissionSummary) => {
    try {
      const fullSubmission: SubmissionDetail = await apiService.getSubmission(submission.id);
      setSelectedSubmission(fullSubmission);
    } catch (_error) { // eslint-disable-next-line @typescript-eslint/no-unused-vars
      showError('Failed to load submission details');
    }
  };

  const handleSubmissionUpdate = (updatedSubmission: SubmissionDetail) => {
    setSubmissions(prev => prev.map(sub =>
      sub.id === updatedSubmission.id
        ? {
            ...sub,
            teacherReviewed: updatedSubmission.teacherReviewed ?? true,
            score: updatedSubmission.teacherScore || sub.score
          }
        : sub
    ));
    setSelectedSubmission(updatedSubmission);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner text="Loading submissions..." />
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
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
      <div className="bg-gray-900/30 border border-white/10 rounded-xl backdrop-blur-lg overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-white font-heading">All Submissions</h2>
          <p className="text-gray-400 mt-1 font-body">Review and provide feedback on student work</p>
        </div>

        {submissions.length === 0 ? (
           <div className="text-center py-12">
             <FileText className="w-16 h-16 text-gray-500 mx-auto mb-4" />
             <h3 className="text-lg font-medium text-white mb-2 font-mono">No submissions yet</h3>
             <p className="text-gray-400 font-body">Student submissions will appear here once they are available.</p>
           </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="border-b border-white/10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider font-mono">
                    Student & Question
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider font-mono">
                    Subject
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider font-mono">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider font-mono">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider font-mono">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider font-mono">
                    Actions
                  </th>
                </tr>
              </thead>
              <motion.tbody variants={containerVariants}>
                {submissions.map((submission) => (
                  <motion.tr
                    key={submission.id}
                    className="border-b border-white/10 hover:bg-gray-800/40 transition-colors"
                    variants={itemVariants}
                  >
                    <td className="px-6 py-4">
                      <div>
                        <div className="flex items-center">
                          <User className="w-4 h-4 text-gray-500 mr-2" />
                          <span className="text-sm font-medium text-gray-200 font-mono">
                            {submission.studentEmail}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400 mt-1 font-body">
                          {submission.question}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-300">
                        {submission.subjectName}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <Award className="w-4 h-4 text-yellow-400 mr-1.5" />
                        <span className="text-sm font-medium text-gray-200 font-mono">
                          {submission.score}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        submission.teacherReviewed
                          ? 'bg-green-500/10 text-green-300'
                          : 'bg-yellow-500/10 text-yellow-300'
                      }`}>
                        {submission.teacherReviewed ? 'Reviewed' : 'AI-Graded'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-sm text-gray-400 font-mono">
                        <Calendar className="w-4 h-4 mr-1.5" />
                        {submission.date}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleSubmissionClick(submission)}
                        className="flex items-center px-3 py-1 text-sm text-cyan-400 hover:text-white hover:bg-cyan-500/20 rounded-md transition-colors font-mono"
                      >
                        <Eye className="w-4 h-4 mr-1.5" />
                        View
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </motion.tbody>
            </table>
          </div>
        )}
      </div>

      {selectedSubmission && (
        <SubmissionDetailModal
          submission={selectedSubmission}
          isOpen={!!selectedSubmission}
          onClose={() => setSelectedSubmission(null)}
          onUpdate={handleSubmissionUpdate}
        />
      )}
    </motion.div>
  );
};

export default AllSubmissionsView;