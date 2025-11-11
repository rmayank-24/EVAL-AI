import { motion } from 'framer-motion';
import { Scale, Heart, GraduationCap, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface AgentEvaluation {
  agent: string;
  role: string;
  score: string;
  reasoning: string;
  strengths: string[];
  weaknesses: string[];
  rubricBreakdown?: Array<{
    criterion: string;
    pointsAwarded: number;
    maxPoints: number;
    comment: string;
  }>;
}

interface MultiAgentData {
  consensus: {
    consensusScore: number;
    consensusScoreString: string;
    consensusStrength: string;
    standardDeviation: string;
    agentScores: Array<{
      score: number;
      agent: string;
      weight: number;
    }>;
    topStrengths: string[];
    topWeaknesses: string[];
  };
  agentEvaluations: AgentEvaluation[];
  metadata: {
    totalAgents: number;
    consensusStrength: string;
    standardDeviation: string;
    timestamp: string;
  };
}

interface MultiAgentBreakdownProps {
  data: MultiAgentData;
}

const MultiAgentBreakdown = ({ data }: MultiAgentBreakdownProps) => {
  if (!data || !data.agentEvaluations) {
    return (
      <div className="p-8 text-center text-gray-400">
        <p>No multi-agent evaluation data available.</p>
      </div>
    );
  }

  const getAgentIcon = (agent: string) => {
    if (agent.includes('Strict')) return <Scale className="w-6 h-6" />;
    if (agent.includes('Lenient')) return <Heart className="w-6 h-6" />;
    return <GraduationCap className="w-6 h-6" />;
  };

  const getAgentColor = (agent: string) => {
    if (agent.includes('Strict')) return {
      bg: 'from-red-500/20 to-red-600/20',
      border: 'border-red-500/50',
      text: 'text-red-300',
      icon: 'text-red-400'
    };
    if (agent.includes('Lenient')) return {
      bg: 'from-green-500/20 to-green-600/20',
      border: 'border-green-500/50',
      text: 'text-green-300',
      icon: 'text-green-400'
    };
    return {
      bg: 'from-blue-500/20 to-blue-600/20',
      border: 'border-blue-500/50',
      text: 'text-blue-300',
      icon: 'text-blue-400'
    };
  };

  const getConsensusStrengthColor = (strength: string) => {
    if (strength === 'Strong Agreement') return 'text-green-400';
    if (strength === 'Moderate Agreement') return 'text-yellow-400';
    return 'text-orange-400';
  };

  const getScoreTrend = (agentScore: number, consensusScore: number) => {
    const diff = agentScore - consensusScore;
    if (Math.abs(diff) < 0.5) return { icon: <Minus className="w-4 h-4" />, color: 'text-gray-400', text: 'On par' };
    if (diff > 0) return { icon: <TrendingUp className="w-4 h-4" />, color: 'text-green-400', text: `+${diff.toFixed(1)}` };
    return { icon: <TrendingDown className="w-4 h-4" />, color: 'text-red-400', text: diff.toFixed(1) };
  };

  return (
    <div className="space-y-6">
      {/* Consensus Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-cyan-500/20 to-purple-600/20 border border-cyan-500/50 rounded-xl p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Multi-Agent Consensus</h2>
            <p className="text-gray-300">
              <span className={`font-bold ${getConsensusStrengthColor(data.consensus.consensusStrength)}`}>
                {data.consensus.consensusStrength}
              </span>
              {' '}• Std Dev: {data.consensus.standardDeviation}
            </p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-bold text-cyan-400">{data.consensus.consensusScoreString}</p>
            <p className="text-sm text-gray-400">Final Score</p>
          </div>
        </div>

        {/* Score Distribution */}
        <div className="flex items-center justify-between gap-2 mb-4">
          {data.consensus.agentScores.map((agent, idx) => (
            <motion.div
              key={agent.agent}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.2 + idx * 0.1, duration: 0.5 }}
              className="relative flex-1"
            >
              <div
                className={`h-2 rounded-full bg-gradient-to-r ${
                  agent.agent.includes('Strict') ? 'from-red-500 to-red-600' :
                  agent.agent.includes('Lenient') ? 'from-green-500 to-green-600' :
                  'from-blue-500 to-blue-600'
                }`}
                style={{ width: `${(agent.score / 10) * 100}%` }}
              />
              <p className="text-xs text-gray-400 mt-1">{agent.agent.split(' ')[0]}</p>
            </motion.div>
          ))}
        </div>

        {/* Common Points */}
        <div className="grid md:grid-cols-2 gap-4 mt-4">
          {data.consensus.topStrengths.length > 0 && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
              <p className="text-sm font-bold text-green-300 mb-2">✓ Common Strengths</p>
              <ul className="space-y-1">
                {data.consensus.topStrengths.slice(0, 3).map((strength, idx) => (
                  <li key={idx} className="text-sm text-gray-300 capitalize">• {strength}</li>
                ))}
              </ul>
            </div>
          )}

          {data.consensus.topWeaknesses.length > 0 && (
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
              <p className="text-sm font-bold text-orange-300 mb-2">! Common Weaknesses</p>
              <ul className="space-y-1">
                {data.consensus.topWeaknesses.slice(0, 3).map((weakness, idx) => (
                  <li key={idx} className="text-sm text-gray-300 capitalize">• {weakness}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </motion.div>

      {/* Agent Cards */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-white">Individual Agent Evaluations</h3>

        <div className="grid md:grid-cols-3 gap-4">
          {data.agentEvaluations.map((agent, index) => {
            const colors = getAgentColor(agent.agent);
            const agentScoreNum = parseFloat(agent.score.split('/')[0]);
            const trend = getScoreTrend(agentScoreNum, data.consensus.consensusScore);

            return (
              <motion.div
                key={agent.agent}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className={`bg-gradient-to-br ${colors.bg} border ${colors.border} rounded-xl p-5`}
              >
                {/* Agent Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={colors.icon}>
                      {getAgentIcon(agent.agent)}
                    </div>
                    <div>
                      <h4 className={`font-bold ${colors.text}`}>{agent.agent}</h4>
                      <p className="text-xs text-gray-400">{agent.role.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-bold ${colors.text}`}>{agent.score}</p>
                    <div className={`flex items-center gap-1 text-xs ${trend.color} justify-end`}>
                      {trend.icon}
                      <span>{trend.text}</span>
                    </div>
                  </div>
                </div>

                {/* Reasoning */}
                <div className="mb-4">
                  <p className="text-sm text-gray-300 italic">"{agent.reasoning}"</p>
                </div>

                {/* Strengths */}
                {agent.strengths && agent.strengths.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-bold text-gray-400 mb-1">Identified Strengths:</p>
                    <ul className="space-y-1">
                      {agent.strengths.slice(0, 2).map((strength, idx) => (
                        <li key={idx} className="text-xs text-green-300">✓ {strength}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Weaknesses */}
                {agent.weaknesses && agent.weaknesses.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-gray-400 mb-1">Identified Weaknesses:</p>
                    <ul className="space-y-1">
                      {agent.weaknesses.slice(0, 2).map((weakness, idx) => (
                        <li key={idx} className="text-xs text-orange-300">! {weakness}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Rubric Breakdown (if available) */}
                {agent.rubricBreakdown && agent.rubricBreakdown.length > 0 && (
                  <details className="mt-3 text-xs">
                    <summary className="cursor-pointer text-gray-400 hover:text-gray-300">
                      View detailed breakdown
                    </summary>
                    <div className="mt-2 space-y-2 bg-black/20 rounded p-2">
                      {agent.rubricBreakdown.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-start">
                          <span className="text-gray-300 flex-1">{item.criterion}</span>
                          <span className={`font-bold ml-2 ${
                            item.pointsAwarded === item.maxPoints ? 'text-green-400' :
                            item.pointsAwarded === 0 ? 'text-red-400' :
                            'text-yellow-400'
                          }`}>
                            {item.pointsAwarded}/{item.maxPoints}
                          </span>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Metadata */}
      {data.metadata && (
        <div className="text-xs text-gray-500 text-center">
          Evaluated by {data.metadata.totalAgents} agents on {new Date(data.metadata.timestamp).toLocaleString()}
        </div>
      )}
    </div>
  );
};

export default MultiAgentBreakdown;

