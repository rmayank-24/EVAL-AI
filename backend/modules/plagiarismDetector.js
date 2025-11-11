// Custom Plagiarism Detection System for EVAL-AI
// This module implements a proprietary multi-algorithm plagiarism detection system
// Combines lexical, semantic, and structural similarity analysis

const stringSimilarity = require('string-similarity');
const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Plagiarism Detector
 * Implements multiple plagiarism detection algorithms:
 * 1. Exact Match Detection (copy-paste)
 * 2. Lexical Similarity (word-level comparison)
 * 3. Semantic Similarity (AI-powered paraphrase detection)
 * 4. Structural Similarity (writing pattern analysis)
 * 5. N-gram Analysis (phrase-level comparison)
 */
class PlagiarismDetector {
    constructor(apiKey) {
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
        
        // Thresholds for different similarity types
        this.thresholds = {
            exact: 0.95,        // 95% exact match = plagiarism
            lexical: 0.80,      // 80% word similarity = suspicious
            semantic: 0.85,     // 85% semantic similarity = likely paraphrase
            structural: 0.75,   // 75% structure match = suspicious
            ngram: 0.70         // 70% n-gram match = suspicious
        };
    }

    /**
     * Normalize text for comparison
     */
    normalizeText(text) {
        return text
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')  // Remove punctuation
            .replace(/\s+/g, ' ')       // Normalize whitespace
            .trim();
    }

    /**
     * Extract sentences from text
     */
    extractSentences(text) {
        return text
            .split(/[.!?]+/)
            .map(s => s.trim())
            .filter(s => s.length > 10); // Ignore very short sentences
    }

    /**
     * Generate n-grams from text
     */
    generateNgrams(text, n = 3) {
        const words = text.split(/\s+/);
        const ngrams = [];
        
        for (let i = 0; i <= words.length - n; i++) {
            ngrams.push(words.slice(i, i + n).join(' '));
        }
        
        return ngrams;
    }

    /**
     * Calculate exact match similarity
     */
    calculateExactMatch(text1, text2) {
        const normalized1 = this.normalizeText(text1);
        const normalized2 = this.normalizeText(text2);
        
        // Use Levenshtein-based similarity
        const similarity = stringSimilarity.compareTwoStrings(normalized1, normalized2);
        
        return {
            score: similarity,
            isPlagiarism: similarity >= this.thresholds.exact,
            type: 'exact_match'
        };
    }

    /**
     * Calculate lexical similarity (word-level)
     */
    calculateLexicalSimilarity(text1, text2) {
        const words1 = new Set(this.normalizeText(text1).split(/\s+/));
        const words2 = new Set(this.normalizeText(text2).split(/\s+/));
        
        // Jaccard similarity
        const intersection = new Set([...words1].filter(x => words2.has(x)));
        const union = new Set([...words1, ...words2]);
        const jaccard = intersection.size / union.size;
        
        // Also calculate overlap coefficient
        const overlap = intersection.size / Math.min(words1.size, words2.size);
        
        const avgSimilarity = (jaccard + overlap) / 2;
        
        return {
            score: avgSimilarity,
            isPlagiarism: avgSimilarity >= this.thresholds.lexical,
            type: 'lexical_similarity',
            metrics: {
                jaccard: jaccard.toFixed(3),
                overlap: overlap.toFixed(3),
                commonWords: intersection.size,
                uniqueWords1: words1.size,
                uniqueWords2: words2.size
            }
        };
    }

    /**
     * Calculate N-gram similarity
     */
    calculateNgramSimilarity(text1, text2, n = 3) {
        const ngrams1 = this.generateNgrams(this.normalizeText(text1), n);
        const ngrams2 = this.generateNgrams(this.normalizeText(text2), n);
        
        if (ngrams1.length === 0 || ngrams2.length === 0) {
            return { score: 0, isPlagiarism: false, type: 'ngram_similarity' };
        }
        
        const set1 = new Set(ngrams1);
        const set2 = new Set(ngrams2);
        
        const intersection = new Set([...set1].filter(x => set2.has(x)));
        const jaccard = intersection.size / (set1.size + set2.size - intersection.size);
        
        return {
            score: jaccard,
            isPlagiarism: jaccard >= this.thresholds.ngram,
            type: 'ngram_similarity',
            matchingPhrases: Array.from(intersection).slice(0, 5) // Top 5 matching phrases
        };
    }

    /**
     * Calculate structural similarity (writing pattern)
     */
    calculateStructuralSimilarity(text1, text2) {
        const sentences1 = this.extractSentences(text1);
        const sentences2 = this.extractSentences(text2);
        
        // Compare sentence length patterns
        const lengths1 = sentences1.map(s => s.split(/\s+/).length);
        const lengths2 = sentences2.map(s => s.split(/\s+/).length);
        
        // Calculate average sentence length similarity
        const avgLen1 = lengths1.reduce((a, b) => a + b, 0) / lengths1.length || 0;
        const avgLen2 = lengths2.reduce((a, b) => a + b, 0) / lengths2.length || 0;
        const lengthSimilarity = 1 - Math.abs(avgLen1 - avgLen2) / Math.max(avgLen1, avgLen2);
        
        // Compare sentence structure (beginning words)
        const beginnings1 = sentences1.map(s => s.split(/\s+/)[0]);
        const beginnings2 = sentences2.map(s => s.split(/\s+/)[0]);
        const beginningSet1 = new Set(beginnings1);
        const beginningSet2 = new Set(beginnings2);
        const beginningIntersection = new Set([...beginningSet1].filter(x => beginningSet2.has(x)));
        const beginningSimilarity = beginningIntersection.size / Math.max(beginningSet1.size, beginningSet2.size);
        
        const structuralScore = (lengthSimilarity + beginningSimilarity) / 2;
        
        return {
            score: structuralScore,
            isPlagiarism: structuralScore >= this.thresholds.structural,
            type: 'structural_similarity',
            metrics: {
                avgSentenceLength1: avgLen1.toFixed(1),
                avgSentenceLength2: avgLen2.toFixed(1),
                totalSentences1: sentences1.length,
                totalSentences2: sentences2.length
            }
        };
    }

    /**
     * AI-powered semantic similarity (paraphrase detection)
     */
    async calculateSemanticSimilarity(text1, text2) {
        try {
            const prompt = `You are an expert plagiarism detector specializing in paraphrase detection.

TEXT A:
"${text1}"

TEXT B:
"${text2}"

TASK:
Determine if these texts are semantically similar (meaning the same thing with different words).
Consider:
- Do they convey the same main ideas?
- Are key concepts identical, just reworded?
- Is the logical flow the same?
- Are specific facts/numbers/names the same?

Respond with ONLY a JSON object:
{
    "semanticSimilarity": 0.0-1.0 (0=completely different, 1=identical meaning),
    "isPlagiarism": true/false,
    "reasoning": "Brief explanation",
    "paraphrasedSections": ["section 1", "section 2"] or [],
    "sharedConcepts": ["concept1", "concept2"]
}`;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const rawText = response.text();
            
            // Parse JSON
            const startIndex = rawText.indexOf('{');
            const endIndex = rawText.lastIndexOf('}');
            if (startIndex === -1 || endIndex === -1) {
                throw new Error('Invalid JSON in semantic analysis');
            }
            
            const jsonString = rawText.substring(startIndex, endIndex + 1);
            const analysis = JSON.parse(jsonString);
            
            return {
                score: analysis.semanticSimilarity,
                isPlagiarism: analysis.isPlagiarism || analysis.semanticSimilarity >= this.thresholds.semantic,
                type: 'semantic_similarity',
                aiAnalysis: {
                    reasoning: analysis.reasoning,
                    paraphrasedSections: analysis.paraphrasedSections || [],
                    sharedConcepts: analysis.sharedConcepts || []
                }
            };
        } catch (error) {
            console.error('Error in semantic analysis:', error.message);
            // Fallback to lexical similarity if AI fails
            return {
                score: 0,
                isPlagiarism: false,
                type: 'semantic_similarity',
                error: 'AI analysis failed'
            };
        }
    }

    /**
     * Find matching sentence pairs
     */
    async findMatchingSentences(text1, text2) {
        const sentences1 = this.extractSentences(text1);
        const sentences2 = this.extractSentences(text2);
        
        const matches = [];
        
        for (let i = 0; i < sentences1.length; i++) {
            for (let j = 0; j < sentences2.length; j++) {
                const similarity = stringSimilarity.compareTwoStrings(
                    this.normalizeText(sentences1[i]),
                    this.normalizeText(sentences2[j])
                );
                
                if (similarity >= 0.7) { // 70% similarity threshold for sentences
                    matches.push({
                        sentence1: sentences1[i],
                        sentence2: sentences2[j],
                        similarity: similarity.toFixed(3),
                        index1: i,
                        index2: j
                    });
                }
            }
        }
        
        // Sort by similarity (highest first)
        matches.sort((a, b) => b.similarity - a.similarity);
        
        return matches.slice(0, 10); // Return top 10 matches
    }

    /**
     * Calculate overall plagiarism score using weighted combination
     */
    calculateOverallScore(results) {
        const weights = {
            exact_match: 0.30,
            lexical_similarity: 0.20,
            semantic_similarity: 0.30,
            structural_similarity: 0.10,
            ngram_similarity: 0.10
        };
        
        let weightedSum = 0;
        let totalWeight = 0;
        
        for (const [type, weight] of Object.entries(weights)) {
            const result = results.find(r => r.type === type);
            if (result && !result.error) {
                weightedSum += result.score * weight;
                totalWeight += weight;
            }
        }
        
        return totalWeight > 0 ? weightedSum / totalWeight : 0;
    }

    /**
     * Determine plagiarism verdict
     */
    determinePlagiarismVerdict(overallScore, results) {
        let verdict, severity, color;
        
        if (overallScore >= 0.85) {
            verdict = "High Plagiarism Risk";
            severity = "critical";
            color = "#ef4444"; // red
        } else if (overallScore >= 0.70) {
            verdict = "Moderate Plagiarism Risk";
            severity = "warning";
            color = "#f59e0b"; // orange
        } else if (overallScore >= 0.50) {
            verdict = "Low Plagiarism Risk";
            severity = "caution";
            color = "#eab308"; // yellow
        } else {
            verdict = "Minimal Plagiarism Risk";
            severity = "safe";
            color = "#22c55e"; // green
        }
        
        // Check if any individual metric exceeded threshold
        const criticalFlags = results.filter(r => r.isPlagiarism);
        
        return {
            verdict,
            severity,
            color,
            overallScore: (overallScore * 100).toFixed(1),
            criticalFlags: criticalFlags.length,
            flaggedMetrics: criticalFlags.map(r => r.type)
        };
    }

    /**
     * Main plagiarism check function
     */
    async checkPlagiarism(submissionText, comparisonTexts = [], metadata = {}) {
        console.log('🔍 Starting Plagiarism Detection...');
        console.log(`Comparing against ${comparisonTexts.length} previous submissions`);
        
        if (comparisonTexts.length === 0) {
            return {
                checked: true,
                noComparisons: true,
                message: "No previous submissions to compare against. This is the first submission.",
                overallScore: 0,
                verdict: {
                    verdict: "Cannot Determine",
                    severity: "info",
                    color: "#6b7280"
                }
            };
        }
        
        const allResults = [];
        
        // Compare against each previous submission
        for (let i = 0; i < comparisonTexts.length; i++) {
            const comparison = comparisonTexts[i];
            console.log(`Analyzing similarity with submission #${i + 1}...`);
            
            // Run all similarity checks
            const exactMatch = this.calculateExactMatch(submissionText, comparison.text);
            const lexical = this.calculateLexicalSimilarity(submissionText, comparison.text);
            const ngram = this.calculateNgramSimilarity(submissionText, comparison.text);
            const structural = this.calculateStructuralSimilarity(submissionText, comparison.text);
            
            // Only run expensive AI analysis if other metrics show suspicion
            let semantic = { score: 0, isPlagiarism: false, type: 'semantic_similarity' };
            if (exactMatch.score > 0.5 || lexical.score > 0.5 || ngram.score > 0.5) {
                semantic = await this.calculateSemanticSimilarity(submissionText, comparison.text);
            }
            
            const results = [exactMatch, lexical, ngram, structural, semantic];
            const overallScore = this.calculateOverallScore(results);
            
            // Only flag if overall score is significant
            if (overallScore >= 0.4) { // 40% similarity threshold
                const matchingSentences = await this.findMatchingSentences(
                    submissionText, 
                    comparison.text
                );
                
                allResults.push({
                    comparisonId: comparison.id || `submission_${i}`,
                    studentEmail: comparison.studentEmail || 'Unknown',
                    submissionDate: comparison.date || 'Unknown',
                    overallScore,
                    percentageMatch: (overallScore * 100).toFixed(1),
                    metrics: results,
                    matchingSentences: matchingSentences.slice(0, 5), // Top 5
                    isSuspicious: overallScore >= 0.5
                });
            }
        }
        
        console.log(`✅ Plagiarism check complete. Found ${allResults.length} potential matches.`);
        
        // Sort by overall score (highest first)
        allResults.sort((a, b) => b.overallScore - a.overallScore);
        
        // Calculate final verdict based on highest match
        const highestMatch = allResults.length > 0 ? allResults[0].overallScore : 0;
        const verdict = this.determinePlagiarismVerdict(
            highestMatch,
            allResults.length > 0 ? allResults[0].metrics : []
        );
        
        return {
            checked: true,
            timestamp: new Date().toISOString(),
            totalComparisons: comparisonTexts.length,
            suspiciousMatches: allResults.filter(r => r.isSuspicious).length,
            highestSimilarity: highestMatch,
            verdict,
            detailedResults: allResults.slice(0, 5), // Top 5 matches
            summary: {
                message: allResults.length === 0 
                    ? "No significant similarity detected with previous submissions."
                    : `Found ${allResults.length} submission(s) with notable similarity.`,
                action: verdict.severity === 'critical' 
                    ? "Manual review recommended"
                    : verdict.severity === 'warning'
                    ? "Teacher review suggested"
                    : "No action needed"
            }
        };
    }
}

module.exports = PlagiarismDetector;

