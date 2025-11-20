import { useState, useEffect } from 'react';
import { FileText, Award, CheckCircle, RefreshCw, TrendingUp, Users, PieChart as PieIcon, AlertTriangle, Zap, Target, Shield, Activity } from 'lucide-react';
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
  ScatterChart,
  Scatter,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart,
  Line,
  Label,
  RadialBarChart,
  RadialBar
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

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const AnalyticsView = ({ role = 'teacher' }: AnalyticsViewProps) => {
  const [report, setReport] = useState<AnalyticsReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [graphData, setGraphData] = useState<{
    scoreDist: any[];
    trends: any[];
    statusDist: any[];
    deviationData: any[];
    subjectRadar: any[];
    plagiarismRisk: any[];
    userDist: any[];
    subjectPopularity: any[];
    plagiarismHealth: any[];
  }>({
    scoreDist: [], trends: [], statusDist: [], deviationData: [], subjectRadar: [], plagiarismRisk: [],
    userDist: [], subjectPopularity: [], plagiarismHealth: []
  });

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
          // 3. Fetch Users for Admin
          const users = await apiService.getUsers();
          processAdminData(submissions, users);
        } else {
          submissions = await apiService.getTeacherSubmissions();
          processTeacherData(submissions);
        }

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

  const processTeacherData = (submissions: any[]) => {
    // Helper to parse score string "85/100" -> 85
    const parseScore = (val: any) => {
      if (typeof val === 'number') return val;
      if (typeof val === 'string') return parseFloat(val.split('/')[0]);
      return 0;
    };

    // --- 1. Score Distribution ---
    const dist = [
      { range: '0-20', count: 0 },
      { range: '21-40', count: 0 },
      { range: '41-60', count: 0 },
      { range: '61-80', count: 0 },
      { range: '81-100', count: 0 },
    ];

    // --- 2. Subject Performance (Radar) ---
    const subjectStats: Record<string, { total: number; count: number }> = {};

    // --- 3. Deviation (AI vs Teacher) ---
    const deviationData: any[] = [];

    // --- 4. Plagiarism Risk ---
    const plagiarismRisk: any[] = [];

    // --- 5. Trends ---
    const trendsMap = new Map();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      trendsMap.set(dateStr, 0);
    }

    // --- 6. Status ---
    const statusCounts = { graded: 0, pending: 0, reviewed: 0 };

    submissions.forEach(sub => {
      const aiScore = parseScore(sub.aiScore || sub.score); // Fallback
      const teacherScore = sub.teacherScore ? parseScore(sub.teacherScore) : null;
      const finalScore = teacherScore !== null ? teacherScore : aiScore;

      // Score Dist
      if (finalScore <= 20) dist[0].count++;
      else if (finalScore <= 40) dist[1].count++;
      else if (finalScore <= 60) dist[2].count++;
      else if (finalScore <= 80) dist[3].count++;
      else dist[4].count++;

      // Subject Radar
      const subject = sub.subjectName || 'General';
      if (!subjectStats[subject]) subjectStats[subject] = { total: 0, count: 0 };
      subjectStats[subject].total += finalScore;
      subjectStats[subject].count++;

      // Deviation
      if (teacherScore !== null && aiScore > 0) {
        deviationData.push({
          name: `Sub ${sub.id.substring(0, 4)}`,
          aiScore,
          teacherScore,
          diff: Math.abs(aiScore - teacherScore)
        });
      }

      // Plagiarism Risk
      const plagiarismScore = sub.plagiarismReport?.verdict?.overallScore
        ? parseFloat(sub.plagiarismReport.verdict.overallScore)
        : 0;

      if (plagiarismScore > 0) {
        plagiarismRisk.push({
          score: finalScore,
          plagiarism: plagiarismScore,
          id: sub.id.substring(0, 4),
          risk: plagiarismScore > 30 && finalScore > 70 ? 'High' : 'Low' // Smart Cheater Detection
        });
      }

      // Trends
      if (sub.submittedAt) {
        const dateStr = new Date(sub.submittedAt).toISOString().split('T')[0];
        if (trendsMap.has(dateStr)) {
          trendsMap.set(dateStr, trendsMap.get(dateStr) + 1);
        }
      }

      // Status
      if (sub.teacherScore) statusCounts.reviewed++;
      else if (sub.aiScore) statusCounts.graded++;
      else statusCounts.pending++;
    });

    // Finalize Radar Data
    const subjectRadar = Object.entries(subjectStats).map(([subject, data]) => ({
      subject,
      average: Math.round(data.total / data.count),
      fullMark: 100
    }));

    // Finalize Trends
    const trends = Array.from(trendsMap.entries()).map(([date, count]) => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      submissions: count
    }));

    // Finalize Status
    const statusDist = [
      { name: 'AI Graded', value: statusCounts.graded },
      { name: 'Reviewed', value: statusCounts.reviewed },
      { name: 'Pending', value: statusCounts.pending },
    ].filter(item => item.value > 0);

    setGraphData(prev => ({
      ...prev,
      scoreDist: dist,
      trends,
      statusDist,
      deviationData: deviationData.slice(0, 20), // Limit points
      subjectRadar,
      plagiarismRisk
    }));
  };

  const processAdminData = (submissions: any[], users: any[]) => {
    // --- 1. User Distribution ---
    const userCounts = { student: 0, teacher: 0, admin: 0 };
    users.forEach(u => {
      if (userCounts[u.role as keyof typeof userCounts] !== undefined) {
        userCounts[u.role as keyof typeof userCounts]++;
      }
    });
    const userDist = [
      { name: 'Students', value: userCounts.student },
      { name: 'Teachers', value: userCounts.teacher },
      { name: 'Admins', value: userCounts.admin }
    ].filter(i => i.value > 0);

    // --- 2. Subject Popularity ---
    const subjectCounts: Record<string, number> = {};
    submissions.forEach(sub => {
      const subject = sub.subjectName || 'General';
      subjectCounts[subject] = (subjectCounts[subject] || 0) + 1;
    });
    const subjectPopularity = Object.entries(subjectCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5

    // --- 3. Global Plagiarism Health ---
    let cleanCount = 0;
    let flaggedCount = 0;
    submissions.forEach(sub => {
      const score = sub.plagiarismReport?.verdict?.overallScore
        ? parseFloat(sub.plagiarismReport.verdict.overallScore)
        : 0;
      if (score > 20) flaggedCount++;
      else cleanCount++;
    });
    const plagiarismHealth = [
      { name: 'Clean', value: cleanCount, fill: '#10b981' },
      { name: 'Flagged', value: flaggedCount, fill: '#ef4444' }
    ];

    // --- 4. Global Trends ---
    const trendsMap = new Map();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
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

    setGraphData(prev => ({
      ...prev,
      userDist,
      subjectPopularity,
      plagiarismHealth,
      trends
    }));
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
        <div className="bg-slate-900/90 border border-slate-700 p-3 rounded-lg shadow-xl backdrop-blur-md">
          <p className="text-slate-200 font-medium mb-1 font-mono text-xs">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color || entry.fill }} className="text-sm font-medium">
              {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
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
          <h2 className="text-2xl font-bold text-white font-heading">
            {role === 'admin' ? 'System Health Dashboard' : 'Class Performance Analytics'}
          </h2>
          <p className="text-gray-400 mt-1 font-body">
            {role === 'admin' ? 'Monitor user growth, system load, and integrity' : 'Deep dive into student performance & AI accuracy'}
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

      {/* --- ADMIN VIEW --- */}
      {role === 'admin' ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* User Distribution */}
            <motion.div variants={itemVariants} className="bg-slate-900/40 border border-white/5 rounded-xl p-6 backdrop-blur-md shadow-xl">
              <div className="flex items-center mb-6">
                <div className="p-2 bg-indigo-500/10 rounded-lg mr-3">
                  <Users className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">User Distribution</h3>
                  <p className="text-xs text-gray-400">Platform adoption by role</p>
                </div>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={graphData.userDist}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {graphData.userDist.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Global Plagiarism Health */}
            <motion.div variants={itemVariants} className="bg-slate-900/40 border border-white/5 rounded-xl p-6 backdrop-blur-md shadow-xl">
              <div className="flex items-center mb-6">
                <div className="p-2 bg-red-500/10 rounded-lg mr-3">
                  <Shield className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">System Integrity</h3>
                  <p className="text-xs text-gray-400">Global plagiarism status</p>
                </div>
              </div>
              <div className="h-72 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={graphData.plagiarismHealth}
                      cx="50%"
                      cy="50%"
                      startAngle={180}
                      endAngle={0}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {graphData.plagiarismHealth.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Subject Popularity */}
            <motion.div variants={itemVariants} className="bg-slate-900/40 border border-white/5 rounded-xl p-6 backdrop-blur-md shadow-xl">
              <div className="flex items-center mb-6">
                <div className="p-2 bg-cyan-500/10 rounded-lg mr-3">
                  <Activity className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Subject Popularity</h3>
                  <p className="text-xs text-gray-400">Most active subjects by submissions</p>
                </div>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart layout="vertical" data={graphData.subjectPopularity}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                    <XAxis type="number" stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
                    <YAxis dataKey="name" type="category" width={100} stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" fill="#06b6d4" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Global Trends */}
            <motion.div variants={itemVariants} className="bg-slate-900/40 border border-white/5 rounded-xl p-6 backdrop-blur-md shadow-xl">
              <div className="flex items-center mb-6">
                <div className="p-2 bg-purple-500/10 rounded-lg mr-3">
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">System Load</h3>
                  <p className="text-xs text-gray-400">Total submissions over last 7 days</p>
                </div>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={graphData.trends}>
                    <defs>
                      <linearGradient id="colorSubmissionsGlobal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="date" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="submissions" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorSubmissionsGlobal)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>
        </>
      ) : (
        /* --- TEACHER VIEW --- */
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Subject Performance Radar */}
            <motion.div variants={itemVariants} className="bg-slate-900/40 border border-white/5 rounded-xl p-6 backdrop-blur-md shadow-xl">
              <div className="flex items-center mb-6">
                <div className="p-2 bg-pink-500/10 rounded-lg mr-3">
                  <Target className="w-5 h-5 text-pink-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Subject Performance</h3>
                  <p className="text-xs text-gray-400">Average score per subject</p>
                </div>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={graphData.subjectRadar}>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#475569' }} />
                    <Radar name="Avg Score" dataKey="average" stroke="#ec4899" fill="#ec4899" fillOpacity={0.3} />
                    <Tooltip content={<CustomTooltip />} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Submission Trends */}
            <motion.div variants={itemVariants} className="bg-slate-900/40 border border-white/5 rounded-xl p-6 backdrop-blur-md shadow-xl">
              <div className="flex items-center mb-6">
                <div className="p-2 bg-purple-500/10 rounded-lg mr-3">
                  <Users className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Activity Trends</h3>
                  <p className="text-xs text-gray-400">Submissions over last 7 days</p>
                </div>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={graphData.trends}>
                    <defs>
                      <linearGradient id="colorSubmissions" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="date" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="submissions" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorSubmissions)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>

          {/* --- ROW 2: Deep Insights (Deviation & Plagiarism) --- */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* AI vs Teacher Deviation */}
            <motion.div variants={itemVariants} className="bg-slate-900/40 border border-white/5 rounded-xl p-6 backdrop-blur-md shadow-xl">
              <div className="flex items-center mb-6">
                <div className="p-2 bg-orange-500/10 rounded-lg mr-3">
                  <Zap className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">AI vs. Human Accuracy</h3>
                  <p className="text-xs text-gray-400">Comparison of AI scores vs Teacher overrides</p>
                </div>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={graphData.deviationData}>
                    <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
                    <XAxis dataKey="name" scale="band" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="aiScore" name="AI Score" barSize={20} fill="#3b82f6" />
                    <Line type="monotone" dataKey="teacherScore" name="Teacher Score" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Plagiarism Risk Analysis */}
            <motion.div variants={itemVariants} className="bg-slate-900/40 border border-white/5 rounded-xl p-6 backdrop-blur-md shadow-xl">
              <div className="flex items-center mb-6">
                <div className="p-2 bg-red-500/10 rounded-lg mr-3">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Plagiarism vs. Score</h3>
                  <p className="text-xs text-gray-400">Identifying high-scoring potential plagiarism</p>
                </div>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis type="number" dataKey="plagiarism" name="Plagiarism %" unit="%" stroke="#94a3b8" domain={[0, 100]} tick={{ fill: '#94a3b8' }}>
                      <Label value="Plagiarism %" offset={-5} position="insideBottom" fill="#94a3b8" />
                    </XAxis>
                    <YAxis type="number" dataKey="score" name="Score" unit="" stroke="#94a3b8" domain={[0, 100]} tick={{ fill: '#94a3b8' }}>
                      <Label value="Score" angle={-90} position="insideLeft" fill="#94a3b8" />
                    </YAxis>
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
                    <Scatter name="Submissions" data={graphData.plagiarismRisk} fill="#ef4444">
                      {graphData.plagiarismRisk.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.risk === 'High' ? '#ef4444' : '#10b981'} />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

          </div>
        </>
      )}

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
