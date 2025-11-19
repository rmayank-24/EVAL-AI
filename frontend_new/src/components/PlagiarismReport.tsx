import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, AlertCircle, Info, RefreshCw, FileText, Clock, TrendingUp, Quote, Edit3, Globe } from 'lucide-react';
import { useState } from 'react';

interface SentenceMatch {
  original: string;
  matched: string;
  source: string;
  submissionId: string;
  submittedOn: string;
  similarity: number;
  type: 'exact_copy' | 'paraphrase' | 'near_duplicate' | 'similar_content';
  confidence: 'very_high' | 'high' | 'medium' | 'low';
  isDirect: boolean;
  isParaphrase: boolean;
}

interface CitationData {
  quotedCount: number;
  citations: {
    total: number;
    parenthetical: string[];
    numeric: string[];
    apa: string[];
  };
  properlyFormatted: boolean;
  warning: string | null;
}

interface StyleShift {
  paragraph: number;
  type: string;
  severity: 'high' | 'medium';
  details: {
    lexicalChange: string;
    sentenceChange: string;
    readabilityChange: string;
  };
  suspicion: string;
}

interface HeatmapData {
  text: string;
  similarity: number;
  color: string;
  hasMatch: boolean;
  matchCount: number;
}

interface PlagiarismReportProps {
  report: {
    checked: boolean;
    noComparisons?: boolean;
    overallScore?: number;
    processingTime?: string;
    verdict: {
      verdict: string;
      severity: string;
      color: string;
      message: string;
      overallScore?: string;
    };
    detectionMethods?: {
      sentenceLevel: {
        total: number;
        exactCopies: number;
        paraphrases: number;
        nearDuplicates: number;
      };
      citations: CitationData;
      styleAnalysis: any;
    };
    sentenceMatches?: SentenceMatch[];
    citations?: CitationData;
    styleAnalysis?: {
      shifts: StyleShift[];
      consistent: boolean;
    };
    timeline?: {
      currentSubmission: string;
      totalMatchedSubmissions: number;
      earliestMatch?: {
        studentEmail: string;
        submittedOn: string;
        matchCount: number;
      };
      likelyOriginal?: string;
      verdict?: string;
    };
    visualization?: {
      heatmap: HeatmapData[];
    };
    summary?: {
      totalComparisons: number;
      matchesFound: number;
      highConfidenceMatches: number;
      recommendation: string;
    };
    timestamp?: string;
  };
  submissionId?: string;
  onRecheck?: () => void;
  isRechecking?: boolean;
}

const PlagiarismReport = ({ report, submissionId, onRecheck, isRechecking = false }: PlagiarismReportProps) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'matches' | 'internet' | 'citations' | 'style' | 'timeline'>('overview');

  if (!report || !report.checked) {
    return (
      <div className="p-8 text-center text-gray-400">
        <Info className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No plagiarism report available for this submission.</p>
      </div>
    );
  }

  // Check if internet check was enabled (even if it found 0 matches)
  const internetCheckEnabled = (report as any).internet && 
    ((report as any).internet.checked === true || (report as any).internet.checked === false);

  // Only show "First Submission" message if:
  // 1. No peer comparisons AND
  // 2. Internet check was NOT enabled at all
  // If internet check was enabled (even with 0 results), show the tabs
  if (report.noComparisons && !internetCheckEnabled) {
    return (
      <div className="p-8 text-center">
        <CheckCircle className="w-16 h-16 mx-auto mb-4 text-blue-400" />
        <h3 className="text-xl font-bold text-white mb-2">First Submission</h3>
        <p className="text-gray-400">This is the first submission for this assignment.</p>
        <p className="text-gray-400 mt-2">No peer comparisons available yet.</p>
      </div>
    );
  }

  const getSeverityIcon = () => {
    switch (report.verdict.severity) {
      case 'critical':
        return <AlertTriangle className="w-12 h-12" />;
      case 'high':
        return <AlertCircle className="w-12 h-12" />;
      case 'moderate':
      case 'low':
        return <Info className="w-12 h-12" />;
      default:
        return <CheckCircle className="w-12 h-12" />;
    }
  };

  const getSeverityStyles = () => {
    switch (report.verdict.severity) {
      case 'critical':
        return 'from-red-500/20 to-red-600/20 border-red-500/50';
      case 'high':
        return 'from-orange-500/20 to-orange-600/20 border-orange-500/50';
      case 'moderate':
        return 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/50';
      case 'low':
        return 'from-lime-500/20 to-lime-600/20 border-lime-500/50';
      default:
        return 'from-green-500/20 to-green-600/20 border-green-500/50';
    }
  };

  const getMatchTypeColor = (type: string) => {
    switch (type) {
      case 'exact_copy': return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'paraphrase': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'near_duplicate': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      default: return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    }
  };

  const getMatchTypeLabel = (type: string) => {
    switch (type) {
      case 'exact_copy': return 'Exact Copy';
      case 'paraphrase': return 'Paraphrased';
      case 'near_duplicate': return 'Near Duplicate';
      default: return 'Similar';
    }
  };

  const getConfidenceBadge = (confidence: string) => {
    const colors = {
      very_high: 'bg-red-500/20 text-red-300',
      high: 'bg-orange-500/20 text-orange-300',
      medium: 'bg-yellow-500/20 text-yellow-300',
      low: 'bg-green-500/20 text-green-300'
    };
    return colors[confidence as keyof typeof colors] || colors.medium;
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
              <p className="text-gray-300 mb-1">
                Overall Plagiarism Score: <span className="font-bold text-white text-lg">
                  {report.overallScore?.toFixed(1) || report.verdict.overallScore}%
                </span>
              </p>
              <p className="text-sm text-gray-400">{report.verdict.message}</p>
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
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['overview', 'matches', 'internet', 'citations', 'style', 'timeline'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeTab === tab
                ? 'bg-blue-500 text-white'
                : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-800/50 border border-white/10 rounded-xl p-4">
              <p className="text-gray-400 text-sm mb-1">Total Comparisons</p>
              <p className="text-3xl font-bold text-white">{report.summary?.totalComparisons || 0}</p>
            </div>

            <div className="bg-gray-800/50 border border-white/10 rounded-xl p-4">
              <p className="text-gray-400 text-sm mb-1">Matches Found</p>
              <p className="text-3xl font-bold text-orange-400">{report.summary?.matchesFound || 0}</p>
            </div>

            <div className="bg-gray-800/50 border border-white/10 rounded-xl p-4">
              <p className="text-gray-400 text-sm mb-1">High Confidence</p>
              <p className="text-3xl font-bold text-red-400">{report.summary?.highConfidenceMatches || 0}</p>
            </div>

            <div className="bg-gray-800/50 border border-white/10 rounded-xl p-4">
              <p className="text-gray-400 text-sm mb-1">Processing Time</p>
              <p className="text-3xl font-bold text-blue-400">{report.processingTime || 'N/A'}</p>
            </div>
          </div>

          {/* Detection Methods */}
          {report.detectionMethods && (
            <div className="bg-gray-800/50 border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-400" />
                Detection Breakdown
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                  <p className="text-sm text-gray-400 mb-1">Exact Copies</p>
                  <p className="text-2xl font-bold text-red-300">{report.detectionMethods.sentenceLevel.exactCopies}</p>
                </div>
                <div className="p-4 bg-orange-500/10 rounded-lg border border-orange-500/20">
                  <p className="text-sm text-gray-400 mb-1">Paraphrases</p>
                  <p className="text-2xl font-bold text-orange-300">{report.detectionMethods.sentenceLevel.paraphrases}</p>
                </div>
                <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                  <p className="text-sm text-gray-400 mb-1">Near Duplicates</p>
                  <p className="text-2xl font-bold text-yellow-300">{report.detectionMethods.sentenceLevel.nearDuplicates}</p>
                </div>
              </div>
            </div>
          )}

          {/* Recommendation */}
          {report.summary && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
              <h3 className="text-lg font-bold text-blue-300 mb-2">Recommendation</h3>
              <p className="text-gray-300">{report.summary.recommendation}</p>
            </div>
          )}
        </motion.div>
      )}

      {/* Sentence Matches Tab */}
      {activeTab === 'matches' && report.sentenceMatches && report.sentenceMatches.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-yellow-400" />
            Sentence-Level Matches ({report.sentenceMatches.length})
          </h3>

          <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar">
            {report.sentenceMatches.map((match, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-gray-800/50 border border-white/10 rounded-xl p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getMatchTypeColor(match.type)}`}>
                      {getMatchTypeLabel(match.type)}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs ${getConfidenceBadge(match.confidence)}`}>
                      {match.confidence.replace('_', ' ')}
                    </span>
                  </div>
                  <span className="text-2xl font-bold" style={{ color: report.verdict.color }}>
                    {match.similarity.toFixed(1)}%
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="bg-cyan-500/10 rounded-lg p-3 border border-cyan-500/20">
                    <p className="text-xs text-cyan-400 mb-1 font-medium">Current Submission:</p>
                    <p className="text-sm text-gray-200">"{match.original}"</p>
                  </div>

                  <div className="bg-purple-500/10 rounded-lg p-3 border border-purple-500/20">
                    <p className="text-xs text-purple-400 mb-1 font-medium">Matched With:</p>
                    <p className="text-sm text-gray-200">"{match.matched}"</p>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>Source: {match.source}</span>
                    <span>Submitted: {new Date(match.submittedOn).toLocaleDateString()}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {activeTab === 'matches' && (!report.sentenceMatches || report.sentenceMatches.length === 0) && (
        <div className="text-center py-12 text-gray-400">
          <CheckCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>No sentence-level matches detected</p>
        </div>
      )}

      {/* Internet Tab */}
      {activeTab === 'internet' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {!(report as any).internet ? (
            <div className="text-center py-12 bg-gray-800/30 rounded-xl border border-white/10">
              <Info className="w-16 h-16 mx-auto mb-4 text-gray-500 opacity-50" />
              <h3 className="text-lg font-bold text-white mb-2">Internet Check Not Enabled</h3>
              <p className="text-gray-400 mb-4">This submission was not checked against internet sources.</p>
              <p className="text-sm text-gray-500">Enable "Internet Plagiarism Check" when submitting to scan Wikipedia, Semantic Scholar, and ArXiv (100% FREE!).</p>
            </div>
          ) : (report as any).internet.checked && (report as any).internet.matches && (report as any).internet.matches.length > 0 ? (
            <>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Globe className="w-5 h-5 text-emerald-400" />
                Internet Sources Found ({(report as any).internet.internetMatches})
              </h3>

              {/* Internet Summary */}
              <div className={`p-4 rounded-lg border ${
                (report as any).internet.summary.severity === 'critical' ? 'bg-red-500/10 border-red-500/30' :
                (report as any).internet.summary.severity === 'moderate' ? 'bg-orange-500/10 border-orange-500/30' :
                'bg-green-500/10 border-green-500/30'
              }`}>
                <p className={`font-medium mb-1 ${
                  (report as any).internet.summary.severity === 'critical' ? 'text-red-300' :
                  (report as any).internet.summary.severity === 'moderate' ? 'text-orange-300' :
                  'text-green-300'
                }`}>
                  {(report as any).internet.summary.verdict}
                </p>
                <p className="text-sm text-gray-300">{(report as any).internet.summary.message}</p>
              </div>

              {/* Internet Matches */}
              <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar">
                {(report as any).internet.matches.map((match: any, idx: number) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-gray-800/50 border border-white/10 rounded-xl p-5"
                  >
                    <div className="mb-3">
                      <div className="bg-emerald-500/10 rounded-lg p-3 border border-emerald-500/20">
                        <p className="text-xs text-emerald-400 mb-1 font-medium">Sentence from submission:</p>
                        <p className="text-sm text-gray-200">"{match.sentence}"</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-medium text-gray-400">Found in {match.results.length} source(s):</p>
                      {match.results.map((result: any, ridx: number) => (
                        <div key={ridx} className="bg-gray-900/50 rounded-lg p-3 border border-white/5">
                          <div className="flex items-start justify-between mb-2">
                            <a 
                              href={result.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 font-medium text-sm flex items-center gap-1 flex-1"
                            >
                              {result.title}
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              result.similarity >= 0.8 ? 'bg-red-500/20 text-red-300' :
                              result.similarity >= 0.6 ? 'bg-orange-500/20 text-orange-300' :
                              'bg-yellow-500/20 text-yellow-300'
                            }`}>
                              {(result.similarity * 100).toFixed(0)}% match
                            </span>
                          </div>
                          {result.snippet && (
                            <p className="text-xs text-gray-400 italic">"{result.snippet}"</p>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                      <span>Source: {match.source}</span>
                      <span className={`px-2 py-1 rounded ${
                        match.confidence === 'high' ? 'bg-red-500/20 text-red-300' :
                        match.confidence === 'medium' ? 'bg-orange-500/20 text-orange-300' :
                        'bg-green-500/20 text-green-300'
                      }`}>
                        {match.confidence} confidence
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Unique Sources */}
              {(report as any).internet.sources && (report as any).internet.sources.length > 0 && (
                <div className="bg-gray-800/30 rounded-xl border border-white/10 p-4">
                  <h4 className="text-sm font-bold text-white mb-3">Most Matched Sources</h4>
                  <div className="space-y-2">
                    {(report as any).internet.sources.map((source: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <a 
                          href={source.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 truncate flex-1"
                        >
                          {source.title || source.url}
                        </a>
                        <span className="text-gray-400 ml-2">×{source.matchCount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (report as any).internet.checked ? (
            <div className="text-center py-12 bg-green-500/10 rounded-xl border border-green-500/30">
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-400" />
              <h3 className="text-lg font-bold text-white mb-2">No Internet Sources Found</h3>
              <p className="text-gray-300">The content does not match any sources on Wikipedia, Semantic Scholar, or ArXiv.</p>
              <p className="text-sm text-gray-400 mt-2">This is a good sign of original work! ✅</p>
            </div>
          ) : (
            <div className="text-center py-12 bg-red-500/10 rounded-xl border border-red-500/30">
              <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
              <h3 className="text-lg font-bold text-white mb-2">Internet Check Failed</h3>
              <p className="text-gray-400">{(report as any).internet.message || 'An error occurred during internet plagiarism check.'}</p>
            </div>
          )}
        </motion.div>
      )}

      {/* Citations Tab */}
      {activeTab === 'citations' && report.citations && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Quote className="w-5 h-5 text-blue-400" />
            Citation Analysis
          </h3>

          <div className="bg-gray-800/50 border border-white/10 rounded-xl p-6">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
                <p className="text-sm text-gray-400 mb-1">Quoted Text</p>
                <p className="text-3xl font-bold text-blue-300">{report.citations.quotedCount}</p>
              </div>
              <div className="bg-purple-500/10 rounded-lg p-4 border border-purple-500/20">
                <p className="text-sm text-gray-400 mb-1">Citations Found</p>
                <p className="text-3xl font-bold text-purple-300">{report.citations.citations.total}</p>
              </div>
            </div>

            <div className={`p-4 rounded-lg border ${
              report.citations.properlyFormatted 
                ? 'bg-green-500/10 border-green-500/20'
                : 'bg-orange-500/10 border-orange-500/20'
            }`}>
              <p className={`font-medium mb-2 ${
                report.citations.properlyFormatted ? 'text-green-300' : 'text-orange-300'
              }`}>
                {report.citations.properlyFormatted ? '✅ Citations Properly Formatted' : '⚠️ Citation Issues Detected'}
              </p>
              {report.citations.warning && (
                <p className="text-sm text-gray-300">{report.citations.warning}</p>
              )}
            </div>

            {report.citations.citations.total > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium text-gray-400">Citation Types:</p>
                <div className="grid grid-cols-3 gap-2">
                  {report.citations.citations.parenthetical.length > 0 && (
                    <div className="text-xs bg-gray-700/30 rounded p-2">
                      <span className="text-gray-400">Parenthetical:</span> <span className="text-white">{report.citations.citations.parenthetical.length}</span>
                    </div>
                  )}
                  {report.citations.citations.numeric.length > 0 && (
                    <div className="text-xs bg-gray-700/30 rounded p-2">
                      <span className="text-gray-400">Numeric:</span> <span className="text-white">{report.citations.citations.numeric.length}</span>
                    </div>
                  )}
                  {report.citations.citations.apa.length > 0 && (
                    <div className="text-xs bg-gray-700/30 rounded p-2">
                      <span className="text-gray-400">APA:</span> <span className="text-white">{report.citations.citations.apa.length}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Style Analysis Tab */}
      {activeTab === 'style' && report.styleAnalysis && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-purple-400" />
            Writing Style Analysis
          </h3>

          <div className={`p-6 rounded-xl border ${
            report.styleAnalysis.consistent 
              ? 'bg-green-500/10 border-green-500/20'
              : 'bg-orange-500/10 border-orange-500/20'
          }`}>
            <div className="flex items-center gap-3 mb-2">
              {report.styleAnalysis.consistent ? (
                <CheckCircle className="w-6 h-6 text-green-400" />
              ) : (
                <AlertCircle className="w-6 h-6 text-orange-400" />
              )}
              <p className={`text-lg font-bold ${
                report.styleAnalysis.consistent ? 'text-green-300' : 'text-orange-300'
              }`}>
                {report.styleAnalysis.consistent 
                  ? 'Consistent Writing Style' 
                  : `${report.styleAnalysis.shifts.length} Style Shift(s) Detected`
                }
              </p>
            </div>
            <p className="text-sm text-gray-400">
              {report.styleAnalysis.consistent 
                ? 'The writing style remains consistent throughout the document.'
                : 'Sudden changes in writing style may indicate copy-pasted content from different sources.'}
            </p>
          </div>

          {report.styleAnalysis.shifts.length > 0 && (
            <div className="space-y-3">
              {report.styleAnalysis.shifts.map((shift, idx) => (
                <div key={idx} className={`p-4 rounded-lg border ${
                  shift.severity === 'high'
                    ? 'bg-red-500/10 border-red-500/20'
                    : 'bg-yellow-500/10 border-yellow-500/20'
                }`}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-white">Paragraph {shift.paragraph}</p>
                      <p className="text-sm text-gray-400">{shift.type}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      shift.severity === 'high' ? 'bg-red-500/20 text-red-300' : 'bg-yellow-500/20 text-yellow-300'
                    }`}>
                      {shift.severity.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 mb-2">{shift.suspicion}</p>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-black/20 rounded p-2">
                      <span className="text-gray-400">Lexical:</span> <span className="text-white">{shift.details.lexicalChange}</span>
                    </div>
                    <div className="bg-black/20 rounded p-2">
                      <span className="text-gray-400">Sentence:</span> <span className="text-white">{shift.details.sentenceChange}</span>
                    </div>
                    <div className="bg-black/20 rounded p-2">
                      <span className="text-gray-400">Readability:</span> <span className="text-white">{shift.details.readabilityChange}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Timeline Tab */}
      {activeTab === 'timeline' && report.timeline && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-400" />
            Submission Timeline
          </h3>

          <div className="bg-gray-800/50 border border-white/10 rounded-xl p-6">
            {report.timeline.earliestMatch && (
              <div className="space-y-4">
                <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <p className="text-sm text-gray-400 mb-1">Total Matched Submissions</p>
                  <p className="text-3xl font-bold text-blue-300">{report.timeline.totalMatchedSubmissions}</p>
                </div>

                <div className="p-4 bg-orange-500/10 rounded-lg border border-orange-500/20">
                  <p className="text-sm text-gray-400 mb-2">Earliest Match (Likely Original)</p>
                  <p className="text-lg font-bold text-orange-300 mb-1">{report.timeline.earliestMatch.studentEmail}</p>
                  <p className="text-sm text-gray-400">
                    Submitted: {new Date(report.timeline.earliestMatch.submittedOn).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-400">
                    Matches: {report.timeline.earliestMatch.matchCount}
                  </p>
                </div>

                {report.timeline.verdict && (
                  <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                    <p className="text-sm text-gray-400 mb-1">Analysis</p>
                    <p className="text-red-300">{report.timeline.verdict}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Timestamp */}
      {report.timestamp && (
        <p className="text-xs text-gray-500 text-center">
          Report generated on {new Date(report.timestamp).toLocaleString()}
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
