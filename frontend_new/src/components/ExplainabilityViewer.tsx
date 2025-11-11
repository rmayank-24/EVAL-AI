import { motion } from 'framer-motion';
import { Brain, CheckCircle, AlertCircle, XCircle, TrendingUp, Eye, Lightbulb } from 'lucide-react';

interface ChainOfThoughtStep {
  step: number;
  criterion: string;
  maxPoints: number;
  observation: string;
  relevantQuote?: string;
  analysis: string;
  decision: string;
  pointsAwarded: number;
  confidence: string;
  reasoning: string;
}

interface ConfidenceMetrics {
  overallConfidence: string;
  averageScore: string;
  highConfidenceSteps: number;
  mediumConfidenceSteps: number;
  lowConfidenceSteps: number;
  uncertainAreas: string[];
}

interface FeatureImportance {
  features: Array<{
    criterion: string;
    maxPoints: number;
    earnedPoints: number;
    lostPoints: number;
    percentageOfTotal: string;
    impact: string;
    decision: string;
  }>;
  mostImpactful: string;
  leastImpactful: string;
}

interface Counterfactual {
  improvements: Array<{
    area: string;
    currentIssue: string;
    suggestion: string;
    potentialPointGain: number;
  }>;
  message: string;
}

interface ExplainabilityData {
  explainable: boolean;
  chainOfThought: ChainOfThoughtStep[];
  overallReasoning: string;
  keyFactors: string[];
  confidence: ConfidenceMetrics;
  featureImportance: FeatureImportance;
  counterfactuals: Counterfactual;
  summary: {
    score: string;
    confidenceLevel: string;
    stepsAnalyzed: number;
    highlightsFound: number;
    improvementsAvailable: number;
  };
  timestamp?: string;
}

interface ExplainabilityViewerProps {
  data: ExplainabilityData;
}

const ExplainabilityViewer = ({ data }: ExplainabilityViewerProps) => {
  if (!data || !data.explainable) {
    return (
      <div className="p-8 text-center text-gray-400">
        <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No explainability data available for this submission.</p>
      </div>
    );
  }

  const getDecisionIcon = (decision: string) => {
    if (decision === 'Pass') return <CheckCircle className="w-5 h-5 text-green-400" />;
    if (decision === 'Partial') return <AlertCircle className="w-5 h-5 text-yellow-400" />;
    return <XCircle className="w-5 h-5 text-red-400" />;
  };

  const getConfidenceColor = (confidence: string) => {
    if (confidence === 'High') return 'text-green-400 bg-green-500/20 border-green-500/30';
    if (confidence === 'Medium') return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
    return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
  };

  const getImpactColor = (impact: string) => {
    if (impact === 'positive') return 'bg-green-500/20 border-green-500/50 text-green-300';
    if (impact === 'negative') return 'bg-red-500/20 border-red-500/50 text-red-300';
    return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300';
  };

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-purple-500/20 to-blue-600/20 border border-purple-500/50 rounded-xl p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Brain className="w-8 h-8 text-purple-400" />
            <div>
              <h2 className="text-2xl font-bold text-white">Explainable AI Analysis</h2>
              <p className="text-gray-300">Transparent evaluation reasoning</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-purple-400">{data.summary.score}</p>
            <div className={`inline-block px-3 py-1 rounded-full text-sm border ${
              getConfidenceColor(data.summary.confidenceLevel)
            }`}>
              {data.summary.confidenceLevel} Confidence
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="bg-black/20 rounded-lg p-3">
            <p className="text-xs text-gray-400 mb-1">Steps Analyzed</p>
            <p className="text-2xl font-bold text-white">{data.summary.stepsAnalyzed}</p>
          </div>
          <div className="bg-black/20 rounded-lg p-3">
            <p className="text-xs text-gray-400 mb-1">Highlights Found</p>
            <p className="text-2xl font-bold text-cyan-400">{data.summary.highlightsFound}</p>
          </div>
          <div className="bg-black/20 rounded-lg p-3">
            <p className="text-xs text-gray-400 mb-1">Improvements</p>
            <p className="text-2xl font-bold text-yellow-400">{data.summary.improvementsAvailable}</p>
          </div>
        </div>
      </motion.div>

      {/* Overall Reasoning */}
      {data.overallReasoning && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-800/50 border border-white/10 rounded-xl p-6"
        >
          <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <Eye className="w-5 h-5 text-cyan-400" />
            Overall Evaluation Summary
          </h3>
          <p className="text-gray-300 leading-relaxed">{data.overallReasoning}</p>

          {data.keyFactors && data.keyFactors.length > 0 && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-sm font-bold text-gray-400 mb-2">Key Factors:</p>
              <div className="flex flex-wrap gap-2">
                {data.keyFactors.map((factor, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-cyan-500/20 border border-cyan-500/30 rounded-full text-sm text-cyan-300"
                  >
                    {factor}
                  </span>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Chain of Thought */}
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Brain className="w-6 h-6 text-purple-400" />
          Step-by-Step Reasoning (Chain-of-Thought)
        </h3>

        {data.chainOfThought.map((step, index) => (
          <motion.div
            key={step.step}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + index * 0.05 }}
            className="bg-gray-800/50 border border-white/10 rounded-xl p-5"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 bg-purple-500/20 border border-purple-500/50 rounded-full text-purple-300 font-bold">
                  {step.step}
                </div>
                <div>
                  <h4 className="font-bold text-white">{step.criterion}</h4>
                  <p className="text-xs text-gray-400">Max Points: {step.maxPoints}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className={`px-3 py-1 rounded-full text-sm border ${getConfidenceColor(step.confidence)}`}>
                  {step.confidence}
                </div>
                <div className="flex items-center gap-2">
                  {getDecisionIcon(step.decision)}
                  <span className="font-bold text-lg text-white">
                    {step.pointsAwarded}/{step.maxPoints}
                  </span>
                </div>
              </div>
            </div>

            {/* Observation */}
            <div className="mb-3">
              <p className="text-xs font-bold text-gray-400 mb-1">Observation:</p>
              <p className="text-sm text-gray-300">{step.observation}</p>
            </div>

            {/* Relevant Quote */}
            {step.relevantQuote && (
              <div className="mb-3 p-3 bg-cyan-500/10 border-l-4 border-cyan-500 rounded">
                <p className="text-xs font-bold text-cyan-400 mb-1">Relevant Excerpt:</p>
                <p className="text-sm text-gray-300 italic">"{step.relevantQuote}"</p>
              </div>
            )}

            {/* Analysis */}
            <div className="mb-3">
              <p className="text-xs font-bold text-gray-400 mb-1">Analysis:</p>
              <p className="text-sm text-gray-300">{step.analysis}</p>
            </div>

            {/* Reasoning */}
            <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
              <p className="text-xs font-bold text-purple-400 mb-1">Reasoning:</p>
              <p className="text-sm text-gray-300">{step.reasoning}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Confidence Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-gray-800/50 border border-white/10 rounded-xl p-6"
      >
        <h3 className="text-lg font-bold text-white mb-4">Confidence Analysis</h3>
        
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-green-400">{data.confidence.highConfidenceSteps}</p>
            <p className="text-xs text-gray-400">High</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-yellow-400">{data.confidence.mediumConfidenceSteps}</p>
            <p className="text-xs text-gray-400">Medium</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-orange-400">{data.confidence.lowConfidenceSteps}</p>
            <p className="text-xs text-gray-400">Low</p>
          </div>
          <div className="text-center">
            <div className={`inline-block px-3 py-1 rounded-full border ${
              getConfidenceColor(data.confidence.overallConfidence)
            }`}>
              <p className="font-bold">{data.confidence.overallConfidence}</p>
            </div>
            <p className="text-xs text-gray-400 mt-1">Overall</p>
          </div>
        </div>

        {data.confidence.uncertainAreas && data.confidence.uncertainAreas.length > 0 && (
          <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
            <p className="text-sm font-bold text-orange-300 mb-2">⚠️ Uncertain Areas:</p>
            <ul className="space-y-1">
              {data.confidence.uncertainAreas.map((area, idx) => (
                <li key={idx} className="text-sm text-gray-300">• {area}</li>
              ))}
            </ul>
          </div>
        )}
      </motion.div>

      {/* Feature Importance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-gray-800/50 border border-white/10 rounded-xl p-6"
      >
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-cyan-400" />
          Feature Importance (What Mattered Most)
        </h3>

        <div className="space-y-3">
          {data.featureImportance.features.map((feature, idx) => (
            <div key={idx} className={`p-3 border rounded-lg ${getImpactColor(feature.impact)}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold">{feature.criterion}</span>
                <span className="text-lg font-bold">
                  {feature.earnedPoints}/{feature.maxPoints}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="opacity-80">{feature.percentageOfTotal}% of total grade</span>
                {feature.lostPoints > 0 && (
                  <span className="text-red-300">-{feature.lostPoints} points lost</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Improvement Suggestions */}
      {data.counterfactuals && data.counterfactuals.improvements.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl p-6"
        >
          <h3 className="text-lg font-bold text-yellow-300 mb-4 flex items-center gap-2">
            <Lightbulb className="w-5 h-5" />
            {data.counterfactuals.message}
          </h3>

          <div className="space-y-4">
            {data.counterfactuals.improvements.map((improvement, idx) => (
              <div key={idx} className="bg-black/20 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-bold text-white">{improvement.area}</h4>
                  <span className="px-2 py-1 bg-green-500/20 border border-green-500/30 rounded text-sm text-green-300">
                    +{improvement.potentialPointGain} pts
                  </span>
                </div>
                <div className="mb-2">
                  <p className="text-xs text-gray-400 mb-1">Current Issue:</p>
                  <p className="text-sm text-red-300">{improvement.currentIssue}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Suggestion:</p>
                  <p className="text-sm text-green-300">💡 {improvement.suggestion}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Timestamp */}
      {data.timestamp && (
        <p className="text-xs text-gray-500 text-center">
          Analyzed on {new Date(data.timestamp).toLocaleString()}
        </p>
      )}
    </div>
  );
};

export default ExplainabilityViewer;

