import React, { useState, useEffect } from 'react';
import { FileText, Award, CheckCircle, RefreshCw } from 'lucide-react';
import StatCard from '../components/StatCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { useNotification } from '../contexts/NotificationContext';
import apiService from '../services/api';

const AnalyticsView = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const { showError, showSuccess } = useNotification();

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    try {
      const data = await apiService.getAnalyticsReport();
      setReport(data);
    } catch (error) {
      showError('Failed to fetch analytics report');
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    setGenerating(true);
    try {
      await apiService.generateAnalyticsReport();
      showSuccess('Analytics report generated successfully!');
      await fetchReport();
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

  const stats = report?.stats || { totalSubmissions: 0, averageScore: 0, reviewedCount: 0 };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Overview</h2>
          <p className="text-gray-600 mt-1">Track student performance and engagement</p>
        </div>
        
        <button
          onClick={generateReport}
          disabled={generating}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Submissions"
          value={stats.totalSubmissions}
          icon={FileText}
          color="blue"
        />
        
        <StatCard
          title="Average Score"
          value={`${stats.averageScore}%`}
          icon={Award}
          color="green"
        />
        
        <StatCard
          title="Reviewed Count"
          value={stats.reviewedCount}
          icon={CheckCircle}
          color="purple"
        />
      </div>

      {report?.aiSummary && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Performance Summary</h3>
          <div className="bg-gradient-to-r from-blue-50 to-teal-50 p-4 rounded-lg border border-blue-200">
            <p className="text-gray-700 leading-relaxed">{report.aiSummary}</p>
          </div>
          
          {report.generatedAt && (
            <p className="text-sm text-gray-500 mt-4">
              Generated on {new Date(report.generatedAt).toLocaleString()}
            </p>
          )}
        </div>
      )}

      {!report?.aiSummary && (
        <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
          <div className="text-gray-400 mb-4">
            <FileText className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Report Available</h3>
          <p className="text-gray-600 mb-4">
            Generate your first analytics report to see detailed insights about student performance.
          </p>
          <button
            onClick={generateReport}
            disabled={generating}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Generate First Report
          </button>
        </div>
      )}
    </div>
  );
};

export default AnalyticsView;