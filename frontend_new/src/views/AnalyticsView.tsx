import { useState, useEffect } from 'react';
import { FileText, Award, CheckCircle, RefreshCw } from 'lucide-react';
import StatCard from '../components/StatCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { useNotificationContext } from '../contexts/NotificationContext';
import apiService from '../services/api';
import { motion } from 'framer-motion';

interface AnalyticsReport {
  stats: {
    totalSubmissions: number;
    averageScore: number;
    reviewedCount: number;
  };
  aiSummary: string;
  generatedAt: string;
}

interface NotificationContextType {
  showError: (message: string) => void;
  showSuccess: (message: string) => void;
}

const AnalyticsView = () => {
  const [report, setReport] = useState<AnalyticsReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const { showError, showSuccess } = useNotificationContext() as NotificationContextType;

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      try {
        const data = await apiService.getAnalyticsReport();
        setReport(data);
      } catch (error) {
        showError('Failed to fetch analytics report');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [showError]);

  const generateReport = async () => {
    setGenerating(true);
    try {
      await apiService.generateAnalyticsReport();
      showSuccess('New analytics report generated successfully!');
      // Re-fetch updated report after generation
      const data = await apiService.getAnalyticsReport();
      setReport(data);
    } catch (error) {
      showError('Failed to generate analytics report');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner text="Loading analytics..." />
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const stats = report?.stats || {
    totalSubmissions: 0,
    averageScore: 0,
    reviewedCount: 0,
  };

  return (
    <motion.div
      className="space-y-8"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div
        variants={{ hidden: { opacity: 0, y: -20 }, visible: { opacity: 1, y: 0 } }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-2xl font-bold text-white font-heading">Analytics Overview</h2>
          <p className="text-gray-400 mt-1 font-body">Track student performance and engagement</p>
        </div>

        <button
          onClick={generateReport}
          disabled={generating}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-mono"
        >
          {generating ? (
            <LoadingSpinner size="small" text="Generating..." />
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Generate Latest Report
            </>
          )}
        </button>
      </motion.div>

      <motion.div
        variants={containerVariants}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <StatCard
          title="Total Submissions"
          value={stats.totalSubmissions}
          icon={FileText}
          color="blue"
        />

        <StatCard
          title="Average Score"
          value={`${stats.averageScore.toFixed(1)}%`}
          icon={Award}
          color="green"
        />

        <StatCard
          title="Reviewed Count"
          value={stats.reviewedCount}
          icon={CheckCircle}
          color="purple"
        />
      </motion.div>

      {report?.aiSummary && (
        <motion.div
          variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
          className="bg-gray-900/30 border border-white/10 rounded-xl p-6 backdrop-blur-lg"
        >
          <h3 className="text-lg font-bold text-white mb-4 font-mono">AI Performance Summary</h3>
          <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 p-4 rounded-lg border border-blue-500/20">
            <p className="text-gray-300 leading-relaxed font-body">{report.aiSummary}</p>
          </div>

          {report.generatedAt && (
            <p className="text-sm text-gray-500 mt-4 font-mono">
              Generated on {new Date(report.generatedAt).toLocaleString()}
            </p>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};

export default AnalyticsView;
