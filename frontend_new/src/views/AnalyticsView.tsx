import { useState, useEffect } from 'react';
import { FileText, Award, CheckCircle, RefreshCw, TrendingUp, Users, PieChart as PieIcon } from 'lucide-react';
import StatCard from '../components/StatCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { useNotificationContext } from '../contexts/NotificationContext';
import apiService from '../services/api';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

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

interface AnalyticsViewProps {
  role?: 'teacher' | 'admin';
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

const AnalyticsView = ({ role = 'teacher' }: AnalyticsViewProps) => {
  const [report, setReport] = useState<AnalyticsReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [graphData, setGraphData] = useState<{
    scoreDist: any[];
    trends: any[];
    statusDist: any[];
  }>({ scoreDist: [], trends: [], statusDist: [] });

  const { showError, showSuccess } = useNotificationContext() as NotificationContextType;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Fetch Summary Report
        const reportData = await apiService.getAnalyticsReport();
        setReport(reportData);

        // 2. Fetch Raw Submissions for Graphs
        let submissions = [];
        if (role === 'admin') {
          submissions = await apiService.getSubmissions();
        } else {
          submissions = await apiService.getTeacherSubmissions();
        }

        processGraphData(submissions);

      } catch (error: any) {
        console.error('Analytics fetch error:', error);
        showError(error.message || 'Failed to fetch analytics data');
        setReport({
          stats: { totalSubmissions: 0, averageScore: 0, reviewedCount: 0 },
          aiSummary: "Unable to load analytics. Please try generating a new report.",
          generatedAt: new Date().toISOString()
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [showError, role]);

  const processGraphData = (submissions: any[]) => {
    // --- Score Distribution ---
    const dist = [
      { range: '0-20', count: 0 },
      { range: '21-40', count: 0 },
      { range: '41-60', count: 0 },
      { range: '61-80', count: 0 },
      { range: '81-100', count: 0 },
    ];

    submissions.forEach(sub => {
      const score = typeof sub.aiScore === 'number' ? sub.aiScore : 0;
      if (score <= 20) dist[0].count++;
      else if (score <= 40) dist[1].count++;
      else if (score <= 60) dist[2].count++;
      else if (score <= 80) dist[3].count++;
      else dist[4].count++;
    });

    // --- Submission Trends (Last 7 days) ---
    const trendsMap = new Map();
    // Initialize last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0]; // YYYY-MM-DD
      trendsMap.set(dateStr, 0);
    }

    submissions.forEach(sub => {
      if (sub.submittedAt) {
        const dateStr = new Date(sub.submittedAt).toISOString().split('T')[0];
        if (trendsMap.has(dateStr)) {
          trendsMap.set(dateStr, trendsMap.get(dateStr) + 1);
        }
      }
    });

    const trends = Array.from(trendsMap.entries()).map(([date, count]) => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      submissions: count
    }));

    // --- Status Distribution ---
    const statusCounts = {
      graded: 0,
      pending: 0,
      reviewed: 0
    };

    submissions.forEach(sub => {
      if (sub.teacherScore) statusCounts.reviewed++;
      else if (sub.aiScore) statusCounts.graded++;
      else statusCounts.pending++;
    });

    const statusDist = [
      { name: 'AI Graded', value: statusCounts.graded },
      { name: 'Reviewed', value: statusCounts.reviewed },
      { name: 'Pending', value: statusCounts.pending },
    ].filter(item => item.value > 0);

    setGraphData({ scoreDist: dist, trends, statusDist });
  };

  const generateReport = async () => {
    setGenerating(true);
    try {
      await apiService.generateAnalyticsReport();
      showSuccess('New analytics report generated successfully!');
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
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const stats = report?.stats || {
    totalSubmissions: 0,
    averageScore: 0,
    reviewedCount: 0,
  };

  // Custom Tooltip for Recharts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-slate-700 p-3 rounded-lg shadow-xl">
          <p className="text-slate-200 font-medium mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      className="space-y-8"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white font-heading">Analytics Overview</h2>
          <p className="text-gray-400 mt-1 font-body">
            {role === 'admin' ? 'System-wide performance metrics' : 'Track student performance and engagement'}
          </p>
        </div>

        <button
          onClick={generateReport}
          disabled={generating}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-mono shadow-lg shadow-blue-900/20"
        >
          {generating ? (
            <LoadingSpinner size="small" text="Generating..." />
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Generate AI Report
            </>
          )}
        </button>
      </motion.div>

      {/* Key Stats Cards */}
      <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Score Distribution */}
        <motion.div variants={itemVariants} className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
          <div className="flex items-center mb-6">
            <div className="p-2 bg-blue-500/10 rounded-lg mr-3">
              <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">Score Distribution</h3>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={graphData.scoreDist}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="range" stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
                <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#334155', opacity: 0.4 }} />
                <Bar dataKey="count" name="Students" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Submission Trends */}
        <motion.div variants={itemVariants} className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
          <div className="flex items-center mb-6">
            <div className="p-2 bg-purple-500/10 rounded-lg mr-3">
              <Users className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">Submission Activity (7 Days)</h3>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={graphData.trends}>
                <defs>
                  <linearGradient id="colorSubmissions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="date" stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
                <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="submissions" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorSubmissions)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Status Distribution (Donut) */}
        <motion.div variants={itemVariants} className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur-sm lg:col-span-2">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="w-full md:w-1/3">
              <div className="flex items-center mb-6">
                <div className="p-2 bg-green-500/10 rounded-lg mr-3">
                  <PieIcon className="w-5 h-5 text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Grading Status</h3>
              </div>
              <p className="text-gray-400 text-sm mb-4">
                Overview of submission statuses. "Reviewed" indicates teacher has verified the AI grade.
              </p>
              <div className="space-y-3">
                {graphData.statusDist.map((entry, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                      <span className="text-gray-300">{entry.name}</span>
                    </div>
                    <span className="font-mono font-bold text-white">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="w-full md:w-2/3 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={graphData.statusDist}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {graphData.statusDist.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>

      </div>

      {/* AI Summary Section */}
      {report?.aiSummary && (
        <motion.div
          variants={itemVariants}
          className="bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-6 shadow-lg"
        >
          <h3 className="text-lg font-bold text-white mb-4 font-mono flex items-center">
            <SparklesIcon className="w-5 h-5 mr-2 text-yellow-400" />
            AI Performance Insight
          </h3>
          <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-800">
            <p className="text-gray-300 leading-relaxed font-body">{report.aiSummary}</p>
          </div>

          {report.generatedAt && (
            <p className="text-sm text-gray-500 mt-4 font-mono text-right">
              Generated on {new Date(report.generatedAt).toLocaleString()}
            </p>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};

// Helper Icon
const SparklesIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
  </svg>
);

export default AnalyticsView;

