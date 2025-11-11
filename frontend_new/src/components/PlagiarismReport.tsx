import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, AlertCircle, Info, RefreshCw } from 'lucide-react';

interface PlagiarismMetric {
  type: string;
  score: number;
  isPlagiarism: boolean;
}

interface MatchingSubmission {
  comparisonId: string;
  studentEmail: string;
  submissionDate?: string;
  percentageMatch: string;
  metrics: PlagiarismMetric[];
  matchingSentences?: Array<{
    sentence1: string;
    sentence2: string;
    similarity: string;
  }>;
  isSuspicious: boolean;
}

interface PlagiarismReportProps {
  report: {
    checked: boolean;
    noComparisons?: boolean;
    totalComparisons?: number;
    suspiciousMatches?: number;
    highestSimilarity?: number;
    verdict: {
      verdict: string;
      severity: string;
      color: string;
      overallScore: string;
      criticalFlags?: number;
    };
    detailedResults?: MatchingSubmission[];
    summary?: {
      message: string;
      action: string;
    };
    timestamp?: string;
  };
  submissionId?: string;
  onRecheck?: () => void;
  isRechecking?: boolean;
}

const PlagiarismReport = ({ report, submissionId, onRecheck, isRechecking = false }: PlagiarismReportProps) => {
  if (!report || !report.checked) {
    return (
      <div className="p-8 text-center text-gray-400">
        <Info className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No plagiarism report available for this submission.</p>
      </div>
    );
  }

  if (report.noComparisons) {
    return (
      <div className="p-8 text-center">
        <CheckCircle className="w-16 h-16 mx-auto mb-4 text-blue-400" />
        <h3 className="text-xl font-bold text-white mb-2">First Submission</h3>
        <p className="text-gray-400">{report.message || "This is the first submission for this assignment. No comparisons available yet."}</p>
      </div>
    );
  }

  const getSeverityIcon = () => {
    switch (report.verdict.severity) {
      case 'critical':
        return <AlertTriangle className="w-12 h-12" />;
      case 'warning':
        return <AlertCircle className="w-12 h-12" />;
      case 'caution':
        return <Info className="w-12 h-12" />;
      default:
        return <CheckCircle className="w-12 h-12" />;
    }
  };

  const getSeverityStyles = () => {
    switch (report.verdict.severity) {
      case 'critical':
        return 'from-red-500/20 to-red-600/20 border-red-500/50';
      case 'warning':
        return 'from-orange-500/20 to-orange-600/20 border-orange-500/50';
      case 'caution':
        return 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/50';
      default:
        return 'from-green-500/20 to-green-600/20 border-green-500/50';
    }
  };

  const getScoreColor = (score: string) => {
    const numScore = parseFloat(score);
    if (numScore >= 85) return 'text-red-400';
    if (numScore >= 70) return 'text-orange-400';
    if (numScore >= 50) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getMetricLabel = (type: string) => {
    const labels: Record<string, string> = {
      'exact_match': 'Exact Match',
      'lexical_similarity': 'Word Similarity',
      'semantic_similarity': 'Semantic Match',
      'structural_similarity': 'Structure Match',
      'ngram_similarity': 'Phrase Match'
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-gradient-to-br ${getSeverityStyles()} border rounded-xl p-8 backdrop-blur-sm`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div style={{ color: report.verdict.color }}>
              {getSeverityIcon()}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">
                {report.verdict.verdict}
              </h2>
              <p className="text-gray-300">
                Overall Similarity: <span className={`font-bold ${getScoreColor(report.verdict.overallScore)}`}>
                  {report.verdict.overallScore}%
                </span>
              </p>
            </div>
          </div>
          {onRecheck && (
            <button
              onClick={onRecheck}
              disabled={isRechecking}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRechecking ? 'animate-spin' : ''}`} />
              <span>{isRechecking ? 'Rechecking...' : 'Recheck'}</span>
            </button>
          )}
        </div>

        {report.verdict.criticalFlags && report.verdict.criticalFlags > 0 && (
          <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
            <p className="text-red-200 text-sm">
              ⚠️ <strong>{report.verdict.criticalFlags}</strong> metric(s) exceeded plagiarism threshold
            </p>
          </div>
        )}
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-800/50 border border-white/10 rounded-xl p-4"
        >
          <p className="text-gray-400 text-sm mb-1">Comparisons Made</p>
          <p className="text-3xl font-bold text-white">{report.totalComparisons || 0}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-800/50 border border-white/10 rounded-xl p-4"
        >
          <p className="text-gray-400 text-sm mb-1">Suspicious Matches</p>
          <p className="text-3xl font-bold text-orange-400">{report.suspiciousMatches || 0}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-800/50 border border-white/10 rounded-xl p-4"
        >
          <p className="text-gray-400 text-sm mb-1">Highest Match</p>
          <p className={`text-3xl font-bold ${getScoreColor((report.highestSimilarity || 0).toFixed(1))}`}>
            {(report.highestSimilarity || 0).toFixed(1)}%
          </p>
        </motion.div>
      </div>

      {/* Summary */}
      {report.summary && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4"
        >
          <h3 className="text-lg font-bold text-blue-300 mb-2">Summary</h3>
          <p className="text-gray-300 mb-2">{report.summary.message}</p>
          <p className="text-sm text-blue-200">
            <strong>Recommended Action:</strong> {report.summary.action}
          </p>
        </motion.div>
      )}

      {/* Detailed Matches */}
      {report.detailedResults && report.detailedResults.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-400" />
            Similar Submissions Found
          </h3>

          {report.detailedResults.map((match, index) => (
            <motion.div
              key={match.comparisonId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              className={`bg-gray-800/50 border ${
                match.isSuspicious ? 'border-orange-500/50' : 'border-white/10'
              } rounded-xl p-6`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="text-lg font-bold text-white mb-1">
                    Match #{index + 1}
                    {match.isSuspicious && (
                      <span className="ml-2 px-2 py-1 text-xs bg-orange-500/20 text-orange-300 rounded">
                        Suspicious
                      </span>
                    )}
                  </h4>
                  <p className="text-sm text-gray-400">
                    Student: {match.studentEmail}
                    {match.submissionDate && ` • ${match.submissionDate}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold" style={{ color: report.verdict.color }}>
                    {match.percentageMatch}%
                  </p>
                  <p className="text-xs text-gray-400">Similarity</p>
                </div>
              </div>

              {/* Metrics Breakdown */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                {match.metrics.map((metric) => (
                  <div
                    key={metric.type}
                    className={`p-3 rounded-lg ${
                      metric.isPlagiarism ? 'bg-red-500/20 border border-red-500/30' : 'bg-gray-700/30'
                    }`}
                  >
                    <p className="text-xs text-gray-400 mb-1">{getMetricLabel(metric.type)}</p>
                    <p className={`text-lg font-bold ${
                      metric.isPlagiarism ? 'text-red-300' : 'text-gray-300'
                    }`}>
                      {(metric.score * 100).toFixed(0)}%
                    </p>
                  </div>
                ))}
              </div>

              {/* Matching Sentences */}
              {match.matchingSentences && match.matchingSentences.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-sm font-bold text-gray-300 mb-3">
                    Matching Sentences ({match.matchingSentences.length})
                  </p>
                  <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar">
                    {match.matchingSentences.map((sentenceMatch, idx) => (
                      <div key={idx} className="bg-gray-900/50 rounded-lg p-3">
                        <div className="mb-2">
                          <p className="text-xs text-cyan-400 mb-1">Current Submission:</p>
                          <p className="text-sm text-gray-300">"{sentenceMatch.sentence1}"</p>
                        </div>
                        <div>
                          <p className="text-xs text-purple-400 mb-1">Previous Submission:</p>
                          <p className="text-sm text-gray-300">"{sentenceMatch.sentence2}"</p>
                        </div>
                        <p className="text-xs text-right text-gray-500 mt-2">
                          {(parseFloat(sentenceMatch.similarity) * 100).toFixed(0)}% similar
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Timestamp */}
      {report.timestamp && (
        <p className="text-xs text-gray-500 text-center">
          Checked on {new Date(report.timestamp).toLocaleString()}
        </p>
      )}

      {/* Custom Scrollbar Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </div>
  );
};

export default PlagiarismReport;

