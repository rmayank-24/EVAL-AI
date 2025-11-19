// Advanced Plagiarism Detection System for EVAL-AI
// Production-grade multi-method plagiarism detection with vector embeddings
// Similar to Grammarly/Turnitin but customized for educational assignments

const { pipeline } = require('@xenova/transformers');
const natural = require('natural');
const nlp = require('compromise');
const stringSimilarity = require('string-similarity');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const murmurhash = require('murmurhash');
const diff = require('diff');
const FreeInternetChecker = require('./freeInternetChecker');

/**
 * Advanced Plagiarism Detector
 * Features:
 * 1. Sentence-level semantic embeddings (Transformer-based)
 * 2. Citation detection and validation
 * 3. Stylometric analysis (writing style)
 * 4. Multi-method detection (exact, fuzzy, semantic)
 * 5. Source attribution with confidence scores
 * 6. Timeline analysis (who copied from whom)
 * 7. Visual heatmap data generation
 */
class AdvancedPlagiarismDetector {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
        this.embedder = null;
        this.tokenizer = new natural.WordTokenizer();
        this.initialized = false;
        
        // Initialize FREE internet plagiarism checker (Wikipedia + Semantic Scholar + ArXiv)
        // PLUS: Hidden Gemini oracle for enhanced detection (not shown in UI)
        this.internetChecker = new FreeInternetChecker(apiKey);
        
        // Detection thresholds
        this.thresholds = {
            exactMatch: 0.95,           // 95% = exact copy
            highSimilarity: 0.85,       // 85% = paraphrase
            moderateSimilarity: 0.70,   // 70% = suspicious
            semanticMatch: 0.90,        // 90% = same meaning
            styleShift: 0.15            // 15% = writing style changed
        };
    }

    /**
     * Initialize the embedding model (lazy loading)
     */
    async initialize() {
        if (this.initialized) return;
        
        try {
            console.log('🤖 Initializing Sentence-BERT embedding model...');
            // Use lightweight sentence transformer model
            this.embedder = await pipeline(
                'feature-extraction',
                'Xenova/all-MiniLM-L6-v2',
                { quantized: true } // Faster inference
            );
            this.initialized = true;
            console.log('✅ Embedding model initialized');
        } catch (error) {
            console.warn('⚠️ Failed to load embedding model:', error.message);
            console.warn('Will use fallback methods');
            this.initialized = false;
        }
    }

    /**
     * Generate semantic embedding for text using Sentence-BERT
     */
    async generateEmbedding(text) {
        if (!this.initialized) {
            await this.initialize();
        }
        
        if (!this.embedder) {
            // Fallback: return null if model not available
            return null;
        }

        try {
            const output = await this.embedder(text, {
                pooling: 'mean',
                normalize: true
            });
            return Array.from(output.data);
        } catch (error) {
            console.error('Embedding generation error:', error.message);
            return null;
        }
    }

    /**
     * Calculate cosine similarity between two embeddings
     */
    cosineSimilarity(embedding1, embedding2) {
        if (!embedding1 || !embedding2 || embedding1.length !== embedding2.length) {
            return 0;
        }

        let dotProduct = 0;
        let norm1 = 0;
        let norm2 = 0;

        for (let i = 0; i < embedding1.length; i++) {
            dotProduct += embedding1[i] * embedding2[i];
            norm1 += embedding1[i] * embedding1[i];
            norm2 += embedding2[i] * embedding2[i];
        }

        return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
    }

    /**
     * Segment text into sentences using natural language processing
     */
    segmentSentences(text) {
        const tokenizer = new natural.SentenceTokenizer();
        const sentences = tokenizer.tokenize(text);
        
        // Filter out very short sentences and clean up
        return sentences
            .map(s => s.trim())
            .filter(s => s.length > 20 && s.split(/\s+/).length > 3);
    }

    /**
     * Create text fingerprint for fast exact/near-exact matching
     */
    createFingerprint(text) {
        const normalized = text.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
        
        // Create multiple hash signatures
        const hash1 = murmurhash.v3(normalized);
        const hash2 = murmurhash.v3(normalized.split('').reverse().join(''));
        
        // Create n-gram fingerprints for fuzzy matching
        const ngrams = [];
        const words = normalized.split(/\s+/);
        for (let i = 0; i < words.length - 4; i++) {
            ngrams.push(words.slice(i, i + 5).join(' '));
        }
        
        return {
            primaryHash: hash1,
            secondaryHash: hash2,
            ngramHashes: ngrams.map(ng => murmurhash.v3(ng)).slice(0, 20)
        };
    }

    /**
     * Detect citations and quoted text
     */
    detectCitations(text) {
        const doc = nlp(text);
        
        // Find quoted text
        const quotes = doc.quotations().out('array');
        
        // Find various citation patterns
        const patterns = {
            parenthetical: text.match(/\([^)]*\d{4}[^)]*\)/g) || [], // (Author, 2023)
            numeric: text.match(/\[\d+\]/g) || [],                   // [1], [2]
            footnote: text.match(/\^\d+/g) || [],                    // ^1
            apa: text.match(/\b[A-Z][a-z]+,?\s+(?:&\s+)?[A-Z][a-z]+,?\s+\(\d{4}\)/g) || []
        };
        
        // Check for reference section
        const hasReferences = /references|bibliography|works cited/i.test(text);
        
        // Analyze quoted text vs citations ratio
        const properQuoting = quotes.length > 0 && 
            (patterns.parenthetical.length + patterns.numeric.length + patterns.apa.length) >= quotes.length * 0.5;
        
        return {
            quotedText: quotes,
            quotedCount: quotes.length,
            citations: {
                parenthetical: patterns.parenthetical,
                numeric: patterns.numeric,
                footnote: patterns.footnote,
                apa: patterns.apa,
                total: Object.values(patterns).flat().length
            },
            hasReferencesSection: hasReferences,
            properlyFormatted: properQuoting,
            warning: quotes.length > 0 && !properQuoting ? 
                'Quoted text found without proper citations' : null,
            score: properQuoting ? 1.0 : quotes.length > 0 ? 0.3 : 0.8
        };
    }

    /**
     * Analyze writing style (stylometric analysis)
     */
    analyzeWritingStyle(text) {
        const words = this.tokenizer.tokenize(text.toLowerCase());
        const sentences = this.segmentSentences(text);
        
        if (!words || words.length === 0) {
            return null;
        }

        // Lexical diversity (Type-Token Ratio)
        const uniqueWords = new Set(words);
        const lexicalDiversity = uniqueWords.size / words.length;
        
        // Sentence complexity
        const avgWordsPerSentence = words.length / Math.max(sentences.length, 1);
        
        // Punctuation analysis
        const commas = (text.match(/,/g) || []).length;
        const semicolons = (text.match(/;/g) || []).length;
        const exclamations = (text.match(/!/g) || []).length;
        const questions = (text.match(/\?/g) || []).length;
        
        // Part-of-speech diversity
        const doc = nlp(text);
        const adjectives = doc.adjectives().length;
        const verbs = doc.verbs().length;
        const nouns = doc.nouns().length;
        
        // Readability (simplified Flesch-Kincaid)
        const syllables = words.reduce((sum, word) => sum + this.countSyllables(word), 0);
        const fleschScore = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * (syllables / words.length);
        
        return {
            lexicalDiversity: parseFloat(lexicalDiversity.toFixed(3)),
            avgWordsPerSentence: parseFloat(avgWordsPerSentence.toFixed(1)),
            punctuationDensity: parseFloat(((commas + semicolons) / Math.max(sentences.length, 1)).toFixed(2)),
            exclamationRate: parseFloat((exclamations / Math.max(sentences.length, 1)).toFixed(2)),
            questionRate: parseFloat((questions / Math.max(sentences.length, 1)).toFixed(2)),
            adjectiveRate: parseFloat((adjectives / words.length).toFixed(3)),
            verbRate: parseFloat((verbs / words.length).toFixed(3)),
            nounRate: parseFloat((nouns / words.length).toFixed(3)),
            readabilityScore: parseFloat(fleschScore.toFixed(1)),
            fingerprint: this.createStyleFingerprint(lexicalDiversity, avgWordsPerSentence, fleschScore)
        };
    }

    /**
     * Count syllables in a word (approximate)
     */
    countSyllables(word) {
        word = word.toLowerCase();
        if (word.length <= 3) return 1;
        
        word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
        word = word.replace(/^y/, '');
        const matches = word.match(/[aeiouy]{1,2}/g);
        return matches ? matches.length : 1;
    }

    /**
     * Create a style fingerprint for comparison
     */
    createStyleFingerprint(lexicalDiversity, avgWords, readability) {
        return `${(lexicalDiversity * 1000).toFixed(0)}-${avgWords.toFixed(0)}-${readability.toFixed(0)}`;
    }

    /**
     * Detect writing style changes within a document
     */
    detectStyleShifts(text) {
        const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 100);
        
        if (paragraphs.length < 2) {
            return { shifts: [], consistent: true };
        }

        const styles = paragraphs.map((p, idx) => ({
            paragraph: idx + 1,
            style: this.analyzeWritingStyle(p)
        })).filter(s => s.style !== null);

        const shifts = [];
        
        for (let i = 1; i < styles.length; i++) {
            const prev = styles[i - 1].style;
            const curr = styles[i].style;
            
            const lexicalDiff = Math.abs(curr.lexicalDiversity - prev.lexicalDiversity);
            const sentenceDiff = Math.abs(curr.avgWordsPerSentence - prev.avgWordsPerSentence);
            const readabilityDiff = Math.abs(curr.readabilityScore - prev.readabilityScore);
            
            if (lexicalDiff > this.thresholds.styleShift || sentenceDiff > 5 || readabilityDiff > 20) {
                shifts.push({
                    paragraph: i + 1,
                    type: 'Style shift detected',
                    severity: lexicalDiff > 0.25 || sentenceDiff > 10 ? 'high' : 'medium',
                    details: {
                        lexicalChange: `${(lexicalDiff * 100).toFixed(1)}%`,
                        sentenceChange: `${sentenceDiff.toFixed(1)} words`,
                        readabilityChange: `${readabilityDiff.toFixed(1)} points`
                    },
                    suspicion: lexicalDiff > 0.25 ? 'High - potential copy-paste' : 'Medium - review recommended'
                });
            }
        }

        return {
            shifts: shifts,
            consistent: shifts.length === 0,
            avgStyle: styles.length > 0 ? {
                lexicalDiversity: (styles.reduce((sum, s) => sum + s.style.lexicalDiversity, 0) / styles.length).toFixed(3),
                avgWordsPerSentence: (styles.reduce((sum, s) => sum + s.style.avgWordsPerSentence, 0) / styles.length).toFixed(1)
            } : null
        };
    }

    /**
     * Sentence-level plagiarism detection with semantic embeddings
     */
    async detectSentenceLevelPlagiarism(submissionText, pastSubmissions) {
        console.log('🔍 Starting sentence-level plagiarism detection...');
        
        const sentences = this.segmentSentences(submissionText);
        console.log(`📝 Analyzing ${sentences.length} sentences`);
        
        const matches = [];
        let processedCount = 0;

        for (const sentence of sentences) {
            processedCount++;
            if (processedCount % 10 === 0) {
                console.log(`   Progress: ${processedCount}/${sentences.length} sentences`);
            }

            // Generate embedding for current sentence
            const sentenceEmbedding = await this.generateEmbedding(sentence);
            
            // Compare with all past submissions
            for (const pastSubmission of pastSubmissions) {
                const pastSentences = this.segmentSentences(pastSubmission.text);
                
                for (const pastSentence of pastSentences) {
                    // Fast pre-filter: check string similarity first
                    const stringSim = stringSimilarity.compareTwoStrings(
                        sentence.toLowerCase(),
                        pastSentence.toLowerCase()
                    );
                    
                    if (stringSim >= 0.6) { // Potential match
                        let semanticSim = stringSim; // Fallback
                        
                        // If embeddings available, use semantic similarity
                        if (sentenceEmbedding) {
                            const pastEmbedding = await this.generateEmbedding(pastSentence);
                            if (pastEmbedding) {
                                semanticSim = this.cosineSimilarity(sentenceEmbedding, pastEmbedding);
                            }
                        }
                        
                        // If high similarity, record the match
                        if (semanticSim >= 0.75) {
                            const similarityScore = Math.max(stringSim, semanticSim);
                            
                            matches.push({
                                original: sentence,
                                matched: pastSentence,
                                source: pastSubmission.studentEmail || 'Unknown',
                                submissionId: pastSubmission.id,
                                submittedOn: pastSubmission.date,
                                similarity: parseFloat((similarityScore * 100).toFixed(1)),
                                type: this.classifyMatchType(similarityScore, stringSim, semanticSim),
                                confidence: this.calculateConfidence(similarityScore),
                                position: submissionText.indexOf(sentence),
                                length: sentence.length,
                                isDirect: stringSim >= this.thresholds.exactMatch,
                                isParaphrase: semanticSim >= this.thresholds.semanticMatch && stringSim < this.thresholds.exactMatch
                            });
                        }
                    }
                }
            }
        }
        
        console.log(`✅ Found ${matches.length} sentence-level matches`);
        
        // Sort by similarity (highest first) and remove duplicates
        return matches
            .sort((a, b) => b.similarity - a.similarity)
            .filter((match, index, self) => 
                index === self.findIndex(m => m.original === match.original && m.matched === match.matched)
            );
    }

    /**
     * Classify match type based on similarity scores
     */
    classifyMatchType(overallSim, stringSim, semanticSim) {
        if (stringSim >= this.thresholds.exactMatch) {
            return 'exact_copy';
        } else if (semanticSim >= this.thresholds.semanticMatch && stringSim < 0.7) {
            return 'paraphrase';
        } else if (stringSim >= this.thresholds.highSimilarity) {
            return 'near_duplicate';
        } else {
            return 'similar_content';
        }
    }

    /**
     * Calculate confidence level for a match
     */
    calculateConfidence(similarity) {
        if (similarity >= 0.95) return 'very_high';
        if (similarity >= 0.85) return 'high';
        if (similarity >= 0.75) return 'medium';
        return 'low';
    }

    /**
     * Generate visualization data (heatmap)
     */
    generateHeatmapData(submissionText, matches) {
        const heatmap = [];
        const sentences = this.segmentSentences(submissionText);
        
        let currentPosition = 0;
        for (const sentence of sentences) {
            const sentenceStart = submissionText.indexOf(sentence, currentPosition);
            const sentenceEnd = sentenceStart + sentence.length;
            
            // Find all matches for this sentence
            const sentenceMatches = matches.filter(m => 
                m.position >= sentenceStart && m.position < sentenceEnd
            );
            
            const maxSimilarity = sentenceMatches.length > 0 
                ? Math.max(...sentenceMatches.map(m => m.similarity))
                : 0;
            
            heatmap.push({
                text: sentence,
                start: sentenceStart,
                end: sentenceEnd,
                similarity: maxSimilarity,
                color: this.getHeatmapColor(maxSimilarity),
                hasMatch: maxSimilarity > 0,
                matchCount: sentenceMatches.length
            });
            
            currentPosition = sentenceEnd;
        }
        
        return heatmap;
    }

    /**
     * Get color for heatmap based on similarity score
     */
    getHeatmapColor(similarity) {
        if (similarity >= 90) return '#ef4444'; // Red - exact match
        if (similarity >= 75) return '#f59e0b'; // Orange - high similarity
        if (similarity >= 60) return '#eab308'; // Yellow - moderate
        if (similarity >= 40) return '#a3e635'; // Light green - low
        return '#22c55e'; // Green - original
    }

    /**
     * Determine who copied from whom based on timestamps
     */
    analyzeTimeline(currentSubmission, matches) {
        if (matches.length === 0) {
            return { analysis: 'No matches to analyze', likelyOriginal: null };
        }

        const matchedSubmissions = {};
        
        matches.forEach(match => {
            if (!matchedSubmissions[match.submissionId]) {
                matchedSubmissions[match.submissionId] = {
                    id: match.submissionId,
                    studentEmail: match.source,
                    submittedOn: match.submittedOn,
                    matchCount: 0,
                    totalSimilarity: 0
                };
            }
            matchedSubmissions[match.submissionId].matchCount++;
            matchedSubmissions[match.submissionId].totalSimilarity += match.similarity;
        });

        const submissions = Object.values(matchedSubmissions);
        const earliestMatch = submissions.reduce((earliest, current) => 
            new Date(current.submittedOn) < new Date(earliest.submittedOn) ? current : earliest
        );

        return {
            currentSubmission: currentSubmission.timestamp,
            totalMatchedSubmissions: submissions.length,
            earliestMatch: {
                studentEmail: earliestMatch.studentEmail,
                submittedOn: earliestMatch.submittedOn,
                matchCount: earliestMatch.matchCount
            },
            likelyOriginal: earliestMatch.studentEmail,
            verdict: 'Current submission likely copied from earlier work'
        };
    }

    /**
     * Calculate overall plagiarism score
     */
    calculateOverallScore(matches, citationData, styleShifts) {
        if (matches.length === 0) {
            return 0;
        }

        // Weight factors
        const matchScore = Math.min(100, matches.length * 5); // More matches = higher score
        const avgSimilarity = matches.reduce((sum, m) => sum + m.similarity, 0) / matches.length;
        const exactMatchCount = matches.filter(m => m.type === 'exact_copy').length;
        const paraphraseCount = matches.filter(m => m.type === 'paraphrase').length;
        
        // Citation penalty
        const citationPenalty = citationData.properlyFormatted ? 0 : 10;
        
        // Style shift penalty
        const styleShiftPenalty = styleShifts.shifts.filter(s => s.severity === 'high').length * 5;
        
        // Weighted calculation
        const baseScore = (avgSimilarity * 0.6) + (matchScore * 0.3) + (exactMatchCount * 2);
        const finalScore = Math.min(100, baseScore + citationPenalty + styleShiftPenalty);
        
        return parseFloat(finalScore.toFixed(1));
    }

    /**
     * Generate verdict based on overall score
     */
    generateVerdict(overallScore, exactMatches, paraphrases, styleShifts) {
        let verdict, severity, color, message;
        
        if (overallScore >= 70 || exactMatches >= 5) {
            verdict = 'Critical - High Plagiarism';
            severity = 'critical';
            color = '#ef4444';
            message = 'Significant plagiarism detected. Manual review required immediately.';
        } else if (overallScore >= 50 || exactMatches >= 3) {
            verdict = 'High Risk';
            severity = 'high';
            color = '#f59e0b';
            message = 'Substantial similarity found. Teacher review strongly recommended.';
        } else if (overallScore >= 30 || paraphrases >= 5) {
            verdict = 'Moderate Risk';
            severity = 'moderate';
            color = '#eab308';
            message = 'Notable similarities detected. Review suggested.';
        } else if (overallScore >= 15) {
            verdict = 'Low Risk';
            severity = 'low';
            color = '#a3e635';
            message = 'Minor similarities found. Likely acceptable overlap.';
        } else {
            verdict = 'Original Work';
            severity = 'safe';
            color = '#22c55e';
            message = 'No significant plagiarism detected. Work appears original.';
        }
        
        // Add style shift warning
        if (styleShifts.shifts.length > 0) {
            message += ` Warning: ${styleShifts.shifts.length} writing style shift(s) detected.`;
        }
        
        return {
            verdict,
            severity,
            color,
            overallScore: overallScore.toFixed(1),
            message
        };
    }

    /**
     * Main plagiarism detection function
     */
    async checkPlagiarism(submissionText, comparisonTexts = [], metadata = {}, options = {}) {
        console.log('\n🚀 ===== ADVANCED PLAGIARISM DETECTION STARTED =====');
        console.log(`📊 Analyzing submission against ${comparisonTexts.length} past submissions`);
        if (options.checkInternet) {
            console.log('🌐 Internet plagiarism check: ENABLED');
        }
        
        const startTime = Date.now();
        
        // Initialize if needed
        await this.initialize();

        // Handle edge case: no comparisons (but still check internet if requested!)
        const hasNoComparisons = comparisonTexts.length === 0;
        
        if (hasNoComparisons) {
            console.log('ℹ️  No past submissions to compare against (first submission)');
            
            // If internet check is NOT enabled, return early
            if (!options.checkInternet) {
                console.log('ℹ️  Internet check not enabled, returning early');
                return {
                    checked: true,
                    noComparisons: true,
                    message: "First submission for this assignment. No peer plagiarism check possible.",
                    overallScore: 0,
                    verdict: {
                        verdict: "Cannot Determine",
                        severity: "info",
                        color: "#6b7280",
                        message: "No peer comparison data available"
                    },
                    timestamp: new Date().toISOString()
                };
            }
            
            // Internet check IS enabled, so skip internal checks but continue to internet check
            console.log('✅ Internet check enabled - will check online sources');
        }

        try {
            // Initialize result variables
            let citationData, styleShifts, sentenceMatches, heatmap, timeline, overallScore, verdict, overallStyle;
            let exactMatches = 0, paraphrases = 0, nearDuplicates = 0;
            
            // Only run internal checks if we have past submissions to compare
            if (!hasNoComparisons) {
                // 1. Citation Detection
                console.log('\n📚 Step 1: Checking citations...');
                citationData = this.detectCitations(submissionText);
                console.log(`   Found: ${citationData.quotedCount} quotes, ${citationData.citations.total} citations`);

                // 2. Style Analysis
                console.log('\n✍️  Step 2: Analyzing writing style...');
                overallStyle = this.analyzeWritingStyle(submissionText);
                styleShifts = this.detectStyleShifts(submissionText);
                console.log(`   Style consistency: ${styleShifts.consistent ? 'Consistent' : `${styleShifts.shifts.length} shifts detected`}`);

                // 3. Sentence-Level Detection
                console.log('\n🔬 Step 3: Performing sentence-level analysis...');
                sentenceMatches = await this.detectSentenceLevelPlagiarism(submissionText, comparisonTexts);
                
                exactMatches = sentenceMatches.filter(m => m.type === 'exact_copy').length;
                paraphrases = sentenceMatches.filter(m => m.type === 'paraphrase').length;
                nearDuplicates = sentenceMatches.filter(m => m.type === 'near_duplicate').length;

                console.log(`   Exact copies: ${exactMatches}`);
                console.log(`   Paraphrases: ${paraphrases}`);
                console.log(`   Near duplicates: ${nearDuplicates}`);

                // 4. Generate Heatmap
                console.log('\n🗺️  Step 4: Generating visualization data...');
                heatmap = this.generateHeatmapData(submissionText, sentenceMatches);

                // 5. Timeline Analysis
                console.log('\n⏰ Step 5: Analyzing submission timeline...');
                timeline = this.analyzeTimeline(metadata, sentenceMatches);

                // 6. Calculate Overall Score
                console.log('\n📈 Step 6: Calculating overall plagiarism score...');
                overallScore = this.calculateOverallScore(sentenceMatches, citationData, styleShifts);
                verdict = this.generateVerdict(overallScore, exactMatches, paraphrases, styleShifts);

                const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);
                console.log(`\n✅ ===== INTERNAL DETECTION COMPLETE in ${processingTime}s =====`);
                console.log(`📊 Final Score: ${overallScore}% - ${verdict.verdict}\n`);
            } else {
                // First submission - set defaults
                console.log('\n⏩ Skipping internal checks (no past submissions)');
                citationData = { quotedCount: 0, citations: { total: 0 }, properlyFormatted: true, warning: null };
                styleShifts = { consistent: true, shifts: [] };
                sentenceMatches = [];
                heatmap = [];
                timeline = null;
                overallScore = 0;
                overallStyle = { avgSentenceLength: 0, avgWordLength: 0, complexity: 0, formality: 0 };
                verdict = {
                    verdict: "First Submission",
                    severity: "info",
                    color: "#6b7280",
                    message: "No peer comparison data available. Check Internet tab for online sources."
                };
            }

            // Optional: Internet plagiarism check (FREE!)
            let internetResults = null;
            if (options.checkInternet) {
                console.log('\n🌐 Starting internet plagiarism check...');
                try {
                    internetResults = await this.internetChecker.checkTextOnline(submissionText, 15);
                    console.log(`✅ Internet check complete: ${internetResults.internetMatches} matches found`);
                } catch (error) {
                    console.error('❌ Internet check failed:', error.message);
                    internetResults = {
                        checked: false,
                        error: true,
                        message: error.message
                    };
                }
            }

            const totalProcessingTime = ((Date.now() - startTime) / 1000).toFixed(2);

            // Return comprehensive report
            return {
                checked: true,
                noComparisons: hasNoComparisons,  // Flag to indicate first submission
                timestamp: new Date().toISOString(),
                processingTime: `${totalProcessingTime}s`,
                
                // Overall metrics
                overallScore: parseFloat(overallScore.toFixed(1)),
                verdict: verdict,
                
                // Detailed results
                detectionMethods: {
                    sentenceLevel: {
                        total: sentenceMatches.length,
                        exactCopies: exactMatches,
                        paraphrases: paraphrases,
                        nearDuplicates: nearDuplicates
                    },
                    citations: {
                        detected: citationData.quotedCount > 0,
                        properlyFormatted: citationData.properlyFormatted,
                        ...citationData.citations
                    },
                    styleAnalysis: {
                        consistent: styleShifts.consistent,
                        shiftsDetected: styleShifts.shifts.length,
                        ...overallStyle
                    }
                },
                
                // Sentence matches (top 20)
                sentenceMatches: sentenceMatches.slice(0, 20),
                
                // Citation analysis
                citations: citationData,
                
                // Style analysis
                styleAnalysis: {
                    overallStyle: overallStyle,
                    shifts: styleShifts.shifts,
                    consistent: styleShifts.consistent
                },
                
                // Timeline
                timeline: timeline,
                
                // Visualization data
                visualization: {
                    heatmap: heatmap,
                    highlightRanges: sentenceMatches.slice(0, 50).map(m => ({
                        start: m.position,
                        end: m.position + m.length,
                        similarity: m.similarity,
                        color: this.getHeatmapColor(m.similarity),
                        type: m.type
                    }))
                },
                
                // Summary
                summary: {
                    totalComparisons: comparisonTexts.length,
                    matchesFound: sentenceMatches.length,
                    highConfidenceMatches: sentenceMatches.filter(m => m.confidence === 'very_high' || m.confidence === 'high').length,
                    recommendation: verdict.severity === 'critical' || verdict.severity === 'high' 
                        ? 'Manual review required'
                        : verdict.severity === 'moderate'
                        ? 'Review recommended'
                        : 'No action needed'
                },
                
                // Internet plagiarism check results (if enabled)
                internet: internetResults,
                totalProcessingTime: `${totalProcessingTime}s`
            };

        } catch (error) {
            console.error('\n❌ Error during plagiarism detection:', error);
            return {
                checked: false,
                error: true,
                message: 'Plagiarism detection failed: ' + error.message,
                overallScore: 0,
                verdict: {
                    verdict: "Detection Failed",
                    severity: "error",
                    color: "#ef4444",
                    message: "An error occurred during plagiarism detection"
                }
            };
        }
    }
}

module.exports = AdvancedPlagiarismDetector;


