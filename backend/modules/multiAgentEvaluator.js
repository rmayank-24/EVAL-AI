// Multi-Agent Evaluation System for EVAL-AI
// This module implements a sophisticated multi-agent grading system using Google Gemini
// Different agents with different personas evaluate the submission and reach consensus

const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Multi-Agent Evaluator
 * Uses 3 different AI agents with distinct grading philosophies:
 * 1. Strict Agent - Rigorous, detail-oriented, catches minor errors
 * 2. Lenient Agent - Encouraging, focuses on effort and understanding
 * 3. Expert Agent - Domain expert, evaluates conceptual understanding
 * 
 * The system aggregates their evaluations using a consensus mechanism
 */
class MultiAgentEvaluator {
    constructor(apiKey) {
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
    }

    /**
     * Define agent personas with specific grading philosophies
     */
    getAgentPersonas() {
        return {
            strict: {
                name: "Strict Evaluator",
                role: "strict_grader",
                persona: `You are a STRICT and RIGOROUS professor known for high standards.
- You have ZERO tolerance for errors, no matter how small
- You deduct points for unclear explanations, poor formatting, or missing steps
- You focus on precision, accuracy, and completeness
- You are detail-oriented and catch every minor mistake
- Your grading tends to be 10-20% lower than average
- You believe strict grading helps students improve`,
                weight: 0.25
            },
            lenient: {
                name: "Lenient Evaluator", 
                role: "lenient_grader",
                persona: `You are a SUPPORTIVE and ENCOURAGING professor who focuses on effort.
- You value the learning process and give partial credit generously
- You focus on what the student did RIGHT, not what they did wrong
- You consider effort, creativity, and conceptual understanding
- You are forgiving of minor mistakes if the main idea is correct
- Your grading tends to be 10-20% higher than average
- You believe encouragement helps students learn better`,
                weight: 0.25
            },
            expert: {
                name: "Expert Evaluator",
                role: "expert_grader", 
                persona: `You are a BALANCED DOMAIN EXPERT with years of teaching experience.
- You evaluate both conceptual understanding AND execution
- You recognize different valid approaches to solving problems
- You give credit for correct reasoning even if the final answer is wrong
- You identify fundamental misunderstandings vs. careless mistakes
- You are fair, consistent, and objective
- Your grading reflects true understanding of the subject`,
                weight: 0.5
            }
        };
    }

    /**
     * Generate prompt for a specific agent
     */
    createAgentPrompt(agent, question, submission, rubric, totalPoints) {
        const rubricContent = rubric.map(r => `- ${r.criterion} (${r.points} points)`).join('\n');
        
        return `${agent.persona}

ASSIGNMENT QUESTION:
"${question}"

GRADING RUBRIC (Total: ${totalPoints} points):
${rubricContent}

STUDENT'S SUBMISSION:
${submission}

TASK:
Evaluate this submission according to YOUR grading philosophy (${agent.name}).
Stay true to your character - if you're strict, be strict. If you're lenient, be encouraging.

Respond with ONLY a valid JSON object:
{
    "agent": "${agent.role}",
    "score": "X/${totalPoints}",
    "numericScore": X,
    "evaluation": "One-sentence summary of your assessment",
    "strengths": ["strength1", "strength2"],
    "weaknesses": ["weakness1", "weakness2"],
    "reasoning": "2-3 sentences explaining YOUR perspective and why you gave this score",
    "rubricBreakdown": [
        {"criterion": "criterion name", "pointsAwarded": X, "maxPoints": Y, "comment": "brief comment"}
    ]
}`;
    }

    /**
     * Evaluate submission with a single agent
     */
    async evaluateWithAgent(agent, question, submission, rubric, totalPoints) {
        try {
            const prompt = this.createAgentPrompt(agent, question, submission, rubric, totalPoints);
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const rawText = response.text();

            // Parse JSON from response
            const startIndex = rawText.indexOf('{');
            const endIndex = rawText.lastIndexOf('}');
            if (startIndex === -1 || endIndex === -1) {
                throw new Error(`Agent ${agent.name} returned invalid JSON`);
            }
            
            const jsonString = rawText.substring(startIndex, endIndex + 1);
            const evaluation = JSON.parse(jsonString);
            
            return {
                ...evaluation,
                agentName: agent.name,
                weight: agent.weight
            };
        } catch (error) {
            console.error(`Error with ${agent.name}:`, error.message);
            // Return fallback evaluation
            return {
                agent: agent.role,
                agentName: agent.name,
                score: `${Math.floor(totalPoints * 0.7)}/${totalPoints}`,
                numericScore: Math.floor(totalPoints * 0.7),
                evaluation: "Error occurred during evaluation",
                strengths: ["Unable to evaluate"],
                weaknesses: ["Evaluation failed"],
                reasoning: `${agent.name} encountered an error`,
                rubricBreakdown: [],
                weight: agent.weight,
                error: true
            };
        }
    }

    /**
     * Consensus mechanism: Weighted average with outlier detection
     */
    calculateConsensus(agentEvaluations, totalPoints) {
        // Extract numeric scores
        const scores = agentEvaluations.map(e => ({
            score: e.numericScore,
            weight: e.weight,
            agent: e.agentName
        }));

        // Calculate weighted average
        const weightedSum = scores.reduce((sum, s) => sum + (s.score * s.weight), 0);
        const totalWeight = scores.reduce((sum, s) => sum + s.weight, 0);
        const consensusScore = Math.round(weightedSum / totalWeight);

        // Calculate standard deviation to detect disagreement
        const mean = scores.reduce((sum, s) => sum + s.score, 0) / scores.length;
        const variance = scores.reduce((sum, s) => sum + Math.pow(s.score - mean, 2), 0) / scores.length;
        const stdDev = Math.sqrt(variance);
        
        // Determine consensus strength
        let consensusStrength;
        if (stdDev <= totalPoints * 0.1) {
            consensusStrength = "Strong Agreement";
        } else if (stdDev <= totalPoints * 0.2) {
            consensusStrength = "Moderate Agreement";
        } else {
            consensusStrength = "Significant Disagreement";
        }

        // Aggregate strengths and weaknesses
        const allStrengths = agentEvaluations.flatMap(e => e.strengths || []);
        const allWeaknesses = agentEvaluations.flatMap(e => e.weaknesses || []);
        
        // Count occurrences (mentioned by multiple agents = more important)
        const strengthCounts = {};
        const weaknessCounts = {};
        
        allStrengths.forEach(s => {
            const lower = s.toLowerCase();
            strengthCounts[lower] = (strengthCounts[lower] || 0) + 1;
        });
        
        allWeaknesses.forEach(w => {
            const lower = w.toLowerCase();
            weaknessCounts[lower] = (weaknessCounts[lower] || 0) + 1;
        });

        // Get top 3 strengths and weaknesses (those mentioned by multiple agents)
        const topStrengths = Object.entries(strengthCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([strength]) => strength);
            
        const topWeaknesses = Object.entries(weaknessCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([weakness]) => weakness);

        return {
            consensusScore,
            consensusScoreString: `${consensusScore}/${totalPoints}`,
            consensusStrength,
            standardDeviation: stdDev.toFixed(2),
            agentScores: scores,
            topStrengths,
            topWeaknesses
        };
    }

    /**
     * Generate final comprehensive feedback based on all agents
     */
    async generateConsensusFeedback(agentEvaluations, consensus, question, totalPoints) {
        try {
            const agentSummaries = agentEvaluations.map(e => 
                `${e.agentName}: ${e.score} - ${e.reasoning}`
            ).join('\n');

            const prompt = `You are a meta-evaluator synthesizing feedback from multiple graders.

ASSIGNMENT: "${question}"

AGENT EVALUATIONS:
${agentSummaries}

CONSENSUS SCORE: ${consensus.consensusScoreString}
AGREEMENT LEVEL: ${consensus.consensusStrength}

TASK: Create a unified, coherent feedback message that:
1. Explains the consensus score
2. Highlights the main strengths (${consensus.topStrengths.join(', ')})
3. Points out key areas for improvement (${consensus.topWeaknesses.join(', ')})
4. Mentions if agents disagreed and why
5. Gives actionable advice for the student

Keep it concise (3-4 sentences), professional, and encouraging.
Return ONLY the feedback text, no JSON.`;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            return response.text().trim();
        } catch (error) {
            console.error('Error generating consensus feedback:', error);
            return `Based on evaluation by multiple graders, your submission scored ${consensus.consensusScoreString}. ${consensus.topStrengths.length > 0 ? 'Strengths include: ' + consensus.topStrengths.join(', ') + '. ' : ''}${consensus.topWeaknesses.length > 0 ? 'Areas for improvement: ' + consensus.topWeaknesses.join(', ') + '.' : ''}`;
        }
    }

    /**
     * Main evaluation function: Orchestrates all agents
     */
    async evaluate(question, submission, rubric) {
        console.log('🤖 Starting Multi-Agent Evaluation...');
        
        const totalPoints = rubric.reduce((sum, r) => sum + (Number(r.points) || 0), 0);
        const agents = this.getAgentPersonas();

        // Run all agents in parallel
        const agentPromises = Object.values(agents).map(agent => 
            this.evaluateWithAgent(agent, question, submission, rubric, totalPoints)
        );

        const agentEvaluations = await Promise.all(agentPromises);
        
        console.log('✅ All agents completed evaluation');
        console.log('Agent Scores:', agentEvaluations.map(e => `${e.agentName}: ${e.score}`).join(', '));

        // Calculate consensus
        const consensus = this.calculateConsensus(agentEvaluations, totalPoints);
        
        console.log(`🎯 Consensus Score: ${consensus.consensusScoreString} (${consensus.consensusStrength})`);

        // Generate unified feedback
        const consensusFeedback = await this.generateConsensusFeedback(
            agentEvaluations, 
            consensus, 
            question, 
            totalPoints
        );

        // Return comprehensive evaluation
        return {
            // Standard format for compatibility
            score: consensus.consensusScoreString,
            evaluation: `Multi-Agent Evaluation: ${consensus.consensusStrength}`,
            mistakes: consensus.topWeaknesses,
            feedback: consensusFeedback,
            
            // Extended multi-agent data
            multiAgent: {
                consensus,
                agentEvaluations: agentEvaluations.map(e => ({
                    agent: e.agentName,
                    role: e.agent,
                    score: e.score,
                    reasoning: e.reasoning,
                    strengths: e.strengths,
                    weaknesses: e.weaknesses,
                    rubricBreakdown: e.rubricBreakdown
                })),
                metadata: {
                    totalAgents: agentEvaluations.length,
                    consensusStrength: consensus.consensusStrength,
                    standardDeviation: consensus.standardDeviation,
                    timestamp: new Date().toISOString()
                }
            }
        };
    }
}

module.exports = MultiAgentEvaluator;

