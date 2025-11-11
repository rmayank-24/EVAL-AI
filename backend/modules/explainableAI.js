// Explainable AI Module for EVAL-AI
// Provides transparency and interpretability in AI-generated evaluations
// Implements Chain-of-Thought reasoning and confidence scoring

const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Explainable AI System
 * Makes AI evaluation decisions transparent and understandable
 * Features:
 * 1. Chain-of-Thought (CoT) reasoning
 * 2. Step-by-step evaluation breakdown
 * 3. Confidence scores for each decision
 * 4. Highlight extraction (what influenced the grade)
 * 5. Counterfactual explanations (what could improve the score)
 */
class ExplainableAI {
    constructor(apiKey) {
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
    }

    /**
     * Generate Chain-of-Thought evaluation
     * Shows step-by-step reasoning process
     */
    async generateChainOfThought(question, submission, rubric) {
        const rubricContent = rubric.map((r, i) => 
            `${i + 1}. ${r.criterion} (${r.points} points)`
        ).join('\n');
        
        const totalPoints = rubric.reduce((sum, r) => sum + (Number(r.points) || 0), 0);

        const prompt = `You are an expert evaluator. I need you to think step-by-step and show your reasoning.

ASSIGNMENT QUESTION:
"${question}"

GRADING RUBRIC (Total: ${totalPoints} points):
${rubricContent}

STUDENT'S SUBMISSION:
${submission}

TASK:
Evaluate this submission using explicit Chain-of-Thought reasoning.

**IMPORTANT**: Think through each criterion step-by-step. For EACH criterion:
1. Quote/reference the relevant part of the submission
2. Explain what you observe
3. Determine if it meets the criterion
4. Assign points with justification
5. State your confidence level (Low/Medium/High)

Respond with ONLY valid JSON:
{
    "chainOfThought": [
        {
            "step": 1,
            "criterion": "criterion name",
            "maxPoints": X,
            "observation": "What I see in the submission",
            "relevantQuote": "Direct quote from submission if applicable",
            "analysis": "My analysis of how well this meets the criterion",
            "decision": "Pass/Partial/Fail",
            "pointsAwarded": X,
            "confidence": "High/Medium/Low",
            "reasoning": "Why I gave this score"
        }
    ],
    "overallReasoning": "Summary of my complete thought process",
    "finalScore": "X/${totalPoints}",
    "confidenceLevel": "High/Medium/Low",
    "keyFactors": ["factor1", "factor2", "factor3"]
}`;

        try {
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const rawText = response.text();
            
            const startIndex = rawText.indexOf('{');
            const endIndex = rawText.lastIndexOf('}');
            if (startIndex === -1 || endIndex === -1) {
                throw new Error('Invalid JSON in CoT response');
            }
            
            const jsonString = rawText.substring(startIndex, endIndex + 1);
            return JSON.parse(jsonString);
        } catch (error) {
            console.error('Error generating Chain-of-Thought:', error.message);
            return null;
        }
    }

    /**
     * Extract highlights from submission
     * Identifies which parts of the submission influenced the grade
     */
    async extractInfluentialHighlights(submission, chainOfThought) {
        const quotes = chainOfThought.chainOfThought
            .filter(step => step.relevantQuote && step.relevantQuote.length > 0)
            .map(step => ({
                text: step.relevantQuote,
                criterion: step.criterion,
                impact: step.decision,
                points: step.pointsAwarded
            }));

        // Find positions in original text
        const highlights = [];
        for (const quote of quotes) {
            const index = submission.indexOf(quote.text);
            if (index !== -1) {
                highlights.push({
                    text: quote.text,
                    startIndex: index,
                    endIndex: index + quote.text.length,
                    criterion: quote.criterion,
                    impact: quote.impact === 'Pass' ? 'positive' : 
                           quote.impact === 'Partial' ? 'neutral' : 'negative',
                    points: quote.points
                });
            }
        }

        return highlights.sort((a, b) => a.startIndex - b.startIndex);
    }

    /**
     * Calculate confidence metrics
     */
    calculateConfidenceMetrics(chainOfThought) {
        const steps = chainOfThought.chainOfThought;
        
        const confidenceLevels = {
            'High': 3,
            'Medium': 2,
            'Low': 1
        };
        
        const scores = steps.map(s => confidenceLevels[s.confidence] || 2);
        const avgConfidence = scores.reduce((a, b) => a + b, 0) / scores.length;
        
        let overallConfidence;
        if (avgConfidence >= 2.5) overallConfidence = 'High';
        else if (avgConfidence >= 1.5) overallConfidence = 'Medium';
        else overallConfidence = 'Low';
        
        const lowConfidenceSteps = steps.filter(s => s.confidence === 'Low');
        
        return {
            overallConfidence,
            averageScore: avgConfidence.toFixed(2),
            highConfidenceSteps: steps.filter(s => s.confidence === 'High').length,
            mediumConfidenceSteps: steps.filter(s => s.confidence === 'Medium').length,
            lowConfidenceSteps: lowConfidenceSteps.length,
            uncertainAreas: lowConfidenceSteps.map(s => s.criterion)
        };
    }

    /**
     * Generate counterfactual explanations
     * "What would improve the score?"
     */
    async generateCounterfactuals(question, submission, chainOfThought, rubric) {
        const failedSteps = chainOfThought.chainOfThought
            .filter(step => step.decision === 'Fail' || step.decision === 'Partial')
            .map(step => `${step.criterion}: ${step.analysis}`)
            .join('\n');

        if (!failedSteps) {
            return {
                improvements: [],
                message: "Excellent work! No significant improvements needed."
            };
        }

        const prompt = `Given this evaluation, suggest specific improvements.

ASSIGNMENT: "${question}"

AREAS THAT LOST POINTS:
${failedSteps}

TASK: Provide 3-5 specific, actionable suggestions for how the student could improve their submission to get full points. Be concrete and practical.

Respond with ONLY valid JSON:
{
    "improvements": [
        {
            "area": "criterion name",
            "currentIssue": "what's wrong now",
            "suggestion": "specific action to improve",
            "potentialPointGain": X
        }
    ]
}`;

        try {
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const rawText = response.text();
            
            const startIndex = rawText.indexOf('{');
            const endIndex = rawText.lastIndexOf('}');
            if (startIndex === -1 || endIndex === -1) {
                throw new Error('Invalid JSON in counterfactual response');
            }
            
            const jsonString = rawText.substring(startIndex, endIndex + 1);
            const parsed = JSON.parse(jsonString);
            
            return {
                improvements: parsed.improvements,
                message: "Here's how to improve your score:"
            };
        } catch (error) {
            console.error('Error generating counterfactuals:', error.message);
            return {
                improvements: [],
                message: "Unable to generate improvement suggestions."
            };
        }
    }

    /**
     * Generate feature importance
     * What criteria mattered most in the final score?
     */
    calculateFeatureImportance(chainOfThought) {
        const steps = chainOfThought.chainOfThought;
        const totalPoints = steps.reduce((sum, s) => sum + s.maxPoints, 0);
        
        const importance = steps.map(step => ({
            criterion: step.criterion,
            maxPoints: step.maxPoints,
            earnedPoints: step.pointsAwarded,
            lostPoints: step.maxPoints - step.pointsAwarded,
            percentageOfTotal: ((step.maxPoints / totalPoints) * 100).toFixed(1),
            impact: step.maxPoints - step.pointsAwarded === 0 ? 'positive' : 
                   step.pointsAwarded === 0 ? 'negative' : 'mixed',
            decision: step.decision
        }));
        
        // Sort by points lost (most impactful first)
        importance.sort((a, b) => b.lostPoints - a.lostPoints);
        
        return {
            features: importance,
            mostImpactful: importance[0].criterion,
            leastImpactful: importance[importance.length - 1].criterion
        };
    }

    /**
     * Create visual decision tree data
     */
    createDecisionTree(chainOfThought) {
        return {
            name: "Evaluation",
            value: chainOfThought.finalScore,
            children: chainOfThought.chainOfThought.map(step => ({
                name: step.criterion,
                value: `${step.pointsAwarded}/${step.maxPoints}`,
                decision: step.decision,
                confidence: step.confidence,
                reasoning: step.reasoning
            }))
        };
    }

    /**
     * Main explainability function
     */
    async explain(question, submission, rubric, existingEvaluation = null) {
        console.log('🔍 Generating Explainable AI Analysis...');
        
        // Generate Chain-of-Thought reasoning
        const chainOfThought = await this.generateChainOfThought(question, submission, rubric);
        
        if (!chainOfThought) {
            return {
                error: true,
                message: "Failed to generate explanation"
            };
        }
        
        console.log('✅ Chain-of-Thought generated');
        
        // Extract highlights
        const highlights = await this.extractInfluentialHighlights(submission, chainOfThought);
        console.log(`✅ Extracted ${highlights.length} influential highlights`);
        
        // Calculate confidence metrics
        const confidence = this.calculateConfidenceMetrics(chainOfThought);
        console.log(`✅ Confidence: ${confidence.overallConfidence}`);
        
        // Calculate feature importance
        const featureImportance = this.calculateFeatureImportance(chainOfThought);
        console.log('✅ Feature importance calculated');
        
        // Generate improvement suggestions
        const counterfactuals = await this.generateCounterfactuals(
            question, 
            submission, 
            chainOfThought, 
            rubric
        );
        console.log(`✅ Generated ${counterfactuals.improvements.length} improvement suggestions`);
        
        // Create decision tree
        const decisionTree = this.createDecisionTree(chainOfThought);
        
        return {
            explainable: true,
            timestamp: new Date().toISOString(),
            
            // Core explanation data
            chainOfThought: chainOfThought.chainOfThought,
            overallReasoning: chainOfThought.overallReasoning,
            keyFactors: chainOfThought.keyFactors,
            
            // Confidence analysis
            confidence,
            
            // Visual elements
            highlights,
            decisionTree,
            featureImportance,
            
            // Improvements
            counterfactuals,
            
            // Summary
            summary: {
                score: chainOfThought.finalScore,
                confidenceLevel: chainOfThought.confidenceLevel,
                stepsAnalyzed: chainOfThought.chainOfThought.length,
                highlightsFound: highlights.length,
                improvementsAvailable: counterfactuals.improvements.length
            }
        };
    }

    /**
     * Generate a simple explanation from existing evaluation
     * For when full CoT is not needed
     */
    async generateSimpleExplanation(evaluation, rubric) {
        const prompt = `Create a clear explanation of this evaluation result.

SCORE: ${evaluation.score}
EVALUATION: ${evaluation.evaluation}
MISTAKES: ${evaluation.mistakes?.join(', ') || 'None'}
FEEDBACK: ${evaluation.feedback}

RUBRIC CRITERIA:
${rubric.map(r => `- ${r.criterion} (${r.points} pts)`).join('\n')}

TASK: Explain in 2-3 sentences:
1. Why this score was given
2. What was done well
3. What could improve

Return ONLY the explanation text, no JSON.`;

        try {
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            return response.text().trim();
        } catch (error) {
            console.error('Error generating simple explanation:', error);
            return evaluation.feedback || "No explanation available.";
        }
    }
}

module.exports = ExplainableAI;

