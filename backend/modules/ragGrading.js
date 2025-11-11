// RAG-Enhanced Grading Module for EVAL-AI
// Retrieves similar high-quality submissions to improve evaluation consistency
// Uses context from past submissions to provide better grading

const stringSimilarity = require('string-similarity');

/**
 * RAG (Retrieval Augmented Generation) Grading System
 * Enhances evaluation by retrieving and using similar past submissions as context
 * Features:
 * 1. Similarity-based retrieval of past submissions
 * 2. Context injection into prompts
 * 3. Consistency improvement across evaluations
 * 4. Example-based grading
 */
class RAGGrading {
    constructor() {
        this.similarityThreshold = 0.3; // Minimum similarity to consider relevant
    }

    /**
     * Normalize text for comparison
     */
    normalizeText(text) {
        return text
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * Calculate TF-IDF style importance scores for words
     */
    calculateWordImportance(text, allTexts) {
        const words = this.normalizeText(text).split(/\s+/);
        const wordCount = {};
        const docFreq = {};
        
        // Count word frequency in current text
        words.forEach(word => {
            if (word.length > 3) { // Ignore very short words
                wordCount[word] = (wordCount[word] || 0) + 1;
            }
        });
        
        // Count document frequency
        allTexts.forEach(t => {
            const uniqueWords = new Set(this.normalizeText(t).split(/\s+/));
            uniqueWords.forEach(word => {
                if (word.length > 3) {
                    docFreq[word] = (docFreq[word] || 0) + 1;
                }
            });
        });
        
        // Calculate TF-IDF scores
        const tfidf = {};
        const totalDocs = allTexts.length;
        
        Object.keys(wordCount).forEach(word => {
            const tf = wordCount[word] / words.length;
            const idf = Math.log(totalDocs / (docFreq[word] || 1));
            tfidf[word] = tf * idf;
        });
        
        return tfidf;
    }

    /**
     * Calculate similarity between two texts using multiple metrics
     */
    calculateSimilarity(text1, text2, allTexts = []) {
        // Normalize both texts
        const norm1 = this.normalizeText(text1);
        const norm2 = this.normalizeText(text2);
        
        // 1. Basic string similarity (Dice coefficient)
        const basicSimilarity = stringSimilarity.compareTwoStrings(norm1, norm2);
        
        // 2. Word overlap (Jaccard)
        const words1 = new Set(norm1.split(/\s+/));
        const words2 = new Set(norm2.split(/\s+/));
        const intersection = new Set([...words1].filter(x => words2.has(x)));
        const union = new Set([...words1, ...words2]);
        const jaccard = intersection.size / union.size;
        
        // 3. Length similarity (penalize very different lengths)
        const lengthRatio = Math.min(text1.length, text2.length) / 
                           Math.max(text1.length, text2.length);
        
        // Weighted combination
        return (basicSimilarity * 0.5) + (jaccard * 0.3) + (lengthRatio * 0.2);
    }

    /**
     * Retrieve relevant past submissions
     * @param {string} currentSubmission - The new submission to evaluate
     * @param {Array} pastSubmissions - Array of {text, score, feedback} objects
     * @param {number} topK - Number of similar submissions to retrieve
     */
    retrieveRelevantContext(currentSubmission, pastSubmissions, topK = 3) {
        if (!pastSubmissions || pastSubmissions.length === 0) {
            return {
                retrieved: [],
                message: "No past submissions available for context"
            };
        }
        
        console.log(`📚 Retrieving context from ${pastSubmissions.length} past submissions...`);
        
        const allTexts = pastSubmissions.map(s => s.text);
        
        // Calculate similarity with each past submission
        const similarities = pastSubmissions.map(submission => ({
            ...submission,
            similarity: this.calculateSimilarity(
                currentSubmission,
                submission.text,
                allTexts
            )
        }));
        
        // Filter by threshold and sort by similarity
        const relevant = similarities
            .filter(s => s.similarity >= this.similarityThreshold)
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, topK);
        
        console.log(`✅ Found ${relevant.length} relevant past submissions`);
        
        return {
            retrieved: relevant.map(s => ({
                text: s.text,
                score: s.score,
                feedback: s.feedback,
                similarity: (s.similarity * 100).toFixed(1),
                studentEmail: s.studentEmail,
                date: s.date
            })),
            count: relevant.length,
            avgSimilarity: relevant.length > 0 
                ? (relevant.reduce((sum, s) => sum + s.similarity, 0) / relevant.length * 100).toFixed(1)
                : 0
        };
    }

    /**
     * Create an enhanced prompt with retrieved context
     */
    createRAGEnhancedPrompt(question, currentSubmission, rubric, retrievedContext, isStrictMode = false) {
        const rubricContent = rubric.map(r => `- ${r.criterion} (${r.points} points)`).join('\n');
        const totalPoints = rubric.reduce((sum, r) => sum + (Number(r.points) || 0), 0);
        
        let contextSection = "";
        if (retrievedContext.retrieved.length > 0) {
            contextSection = `\n📚 REFERENCE EXAMPLES (from similar past submissions):

${retrievedContext.retrieved.map((ex, i) => `
Example ${i + 1} (${ex.similarity}% similar, Score: ${ex.score}):
Submission: "${ex.text.substring(0, 300)}..."
Feedback Given: "${ex.feedback}"
`).join('\n')}

Use these examples to maintain consistency in your grading. Consider:
- How were similar submissions scored?
- What level of detail was expected?
- What mistakes were penalized?
`;
        }
        
        const persona = isStrictMode 
            ? 'You are a strict, rigorous evaluator with high standards.'
            : 'You are a fair and balanced evaluator.';
        
        const jsonSchema = `{
    "score": "X/${totalPoints}",
    "evaluation": "One-sentence summary",
    "mistakes": ["mistake1", "mistake2"],
    "feedback": "Detailed constructive feedback",
    "contextUsage": "How you used the reference examples (if provided)"
}`;
        
        return `${persona}
${contextSection}
ASSIGNMENT QUESTION:
"${question}"

GRADING RUBRIC (Total: ${totalPoints} points):
${rubricContent}

CURRENT STUDENT'S SUBMISSION:
${currentSubmission}

TASK:
Evaluate this submission. ${retrievedContext.retrieved.length > 0 ? 'Use the reference examples above to ensure consistency with past grading.' : ''}

Respond with ONLY valid JSON:
${jsonSchema}`;
    }

    /**
     * Extract patterns from high-scoring submissions
     */
    analyzeHighScorers(pastSubmissions, scoreThreshold = 0.8) {
        // Filter high-scoring submissions
        const highScorers = pastSubmissions.filter(s => {
            if (!s.score) return false;
            const [earned, total] = s.score.split('/').map(Number);
            return (earned / total) >= scoreThreshold;
        });
        
        if (highScorers.length === 0) {
            return {
                patterns: [],
                message: "No high-scoring submissions to analyze"
            };
        }
        
        // Analyze common characteristics
        const avgLength = highScorers.reduce((sum, s) => 
            sum + s.text.split(/\s+/).length, 0
        ) / highScorers.length;
        
        const avgSentences = highScorers.reduce((sum, s) => 
            sum + s.text.split(/[.!?]+/).length, 0
        ) / highScorers.length;
        
        return {
            patterns: [
                {
                    characteristic: "Average Word Count",
                    value: Math.round(avgLength),
                    significance: "High-scoring submissions tend to be around this length"
                },
                {
                    characteristic: "Average Sentences",
                    value: Math.round(avgSentences),
                    significance: "Typical structure of good submissions"
                },
                {
                    characteristic: "Sample Count",
                    value: highScorers.length,
                    significance: "Number of high-quality examples available"
                }
            ],
            examples: highScorers.slice(0, 2).map(s => ({
                text: s.text.substring(0, 200) + "...",
                score: s.score
            }))
        };
    }

    /**
     * Generate evaluation with RAG enhancement
     */
    async evaluateWithRAG(aiModel, question, submission, rubric, pastSubmissions, isStrictMode = false) {
        console.log('🚀 Starting RAG-Enhanced Evaluation...');
        
        // Retrieve relevant context
        const context = this.retrieveRelevantContext(submission, pastSubmissions, 3);
        
        // Create enhanced prompt
        const prompt = this.createRAGEnhancedPrompt(
            question,
            submission,
            rubric,
            context,
            isStrictMode
        );
        
        // Generate evaluation
        try {
            const result = await aiModel.generateContent(prompt);
            const response = await result.response;
            const rawText = response.text();
            
            const startIndex = rawText.indexOf('{');
            const endIndex = rawText.lastIndexOf('}');
            if (startIndex === -1 || endIndex === -1) {
                throw new Error('Invalid JSON in RAG evaluation');
            }
            
            const jsonString = rawText.substring(startIndex, endIndex + 1);
            const evaluation = JSON.parse(jsonString);
            
            console.log('✅ RAG-Enhanced Evaluation complete');
            
            return {
                ...evaluation,
                rag: {
                    contextsUsed: context.count,
                    avgSimilarity: context.avgSimilarity,
                    examples: context.retrieved.map(r => ({
                        score: r.score,
                        similarity: r.similarity
                    }))
                }
            };
        } catch (error) {
            console.error('Error in RAG evaluation:', error);
            throw error;
        }
    }

    /**
     * Build context database from past submissions
     */
    buildContextDatabase(submissions, assignmentId) {
        return submissions
            .filter(s => s.assignmentId === assignmentId && s.extractedText)
            .map(s => ({
                id: s.id,
                text: s.extractedText || s.question,
                score: s.teacherScore || s.aiFeedback?.score,
                feedback: s.teacherFeedback || s.aiFeedback?.feedback,
                studentEmail: s.studentEmail,
                date: s.createdAt,
                teacherReviewed: s.teacherReviewed
            }))
            .filter(s => s.text && s.score); // Only include valid entries
    }
}

module.exports = RAGGrading;

