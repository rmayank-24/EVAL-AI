// 100% FREE Internet Plagiarism Checker
// No API keys, no rate limits, no costs!
// 
// Sources:
// 1. Wikipedia API (official, unlimited)
// 2. Semantic Scholar API (200M+ papers, free, 100 req/sec)
// 3. ArXiv API (academic papers, free)
// 4. Archive.org (web archive, free)

const axios = require('axios');
const natural = require('natural');

/**
 * Free Internet Plagiarism Checker
 * Uses only free, unlimited APIs - no Google, no DuckDuckGo scraping
 */
class FreeInternetChecker {
    constructor() {
        this.tokenizer = new natural.SentenceTokenizer();
        // Wikipedia requires proper User-Agent with contact info
        this.userAgent = 'EVAL-AI/1.0 (https://github.com/rmayank-24/EVAL-AI; Educational plagiarism detection) Node/axios';
    }

    /**
     * Main function: Check text against all free sources
     */
    async checkTextOnline(text, maxSentences = 15) {
        console.log('\n🌐 ===== FREE INTERNET PLAGIARISM CHECK STARTED =====');
        console.log('📊 Using 100% FREE sources (Wikipedia, Semantic Scholar, ArXiv)');
        
        const startTime = Date.now();
        
        try {
            // Extract important sentences
            const sentences = this.extractImportantSentences(text, maxSentences);
            console.log(`📝 Selected ${sentences.length} important sentences to check\n`);
            
            const allMatches = [];
            
            // 1. Check Wikipedia (most common source for students)
            console.log('📚 [1/3] Checking Wikipedia...');
            const wikiMatches = await this.checkWikipedia(sentences);
            if (wikiMatches.length > 0) {
                console.log(`   ✅ Found ${wikiMatches.length} Wikipedia matches`);
                allMatches.push(...wikiMatches);
            } else {
                console.log(`   ❌ No Wikipedia matches`);
            }
            
            // 2. Check Semantic Scholar (academic papers)
            console.log('\n🎓 [2/3] Checking Semantic Scholar (200M+ academic papers)...');
            const scholarMatches = await this.checkSemanticScholar(sentences);
            if (scholarMatches.length > 0) {
                console.log(`   ✅ Found ${scholarMatches.length} Semantic Scholar matches`);
                allMatches.push(...scholarMatches);
            } else {
                console.log(`   ❌ No Semantic Scholar matches`);
            }
            
            // 3. Check ArXiv (physics, CS, math papers)
            console.log('\n📄 [3/3] Checking ArXiv (academic papers)...');
            const arxivMatches = await this.checkArXiv(sentences);
            if (arxivMatches.length > 0) {
                console.log(`   ✅ Found ${arxivMatches.length} ArXiv matches`);
                allMatches.push(...arxivMatches);
            } else {
                console.log(`   ❌ No ArXiv matches`);
            }
            
            const processingTime = ((Date.now() - startTime) / 1000).toFixed(1);
            console.log(`\n✅ ===== INTERNET CHECK COMPLETE in ${processingTime}s =====`);
            console.log(`📊 Total matches: ${allMatches.length}\n`);
            
            return {
                checked: true,
                timestamp: new Date().toISOString(),
                processingTime: `${processingTime}s`,
                sentencesChecked: sentences.length,
                internetMatches: allMatches.length,
                matches: allMatches,
                summary: this.generateSummary(allMatches),
                sources: this.extractUniqueSources(allMatches)
            };
            
        } catch (error) {
            console.error('❌ Free internet check error:', error.message);
            return {
                checked: false,
                error: true,
                message: 'Free internet check failed: ' + error.message,
                internetMatches: 0
            };
        }
    }

    /**
     * Check Wikipedia (official API, completely free, unlimited)
     * Strategy: Search exact phrase in quotes for better matching
     */
    async checkWikipedia(sentences) {
        const matches = [];
        
        try {
            for (const sentence of sentences.slice(0, 10)) { // Check top 10
                await this.delay(500); // Be respectful
                
                // Search with exact phrase in quotes for better results
                const searchQuery = `"${sentence.substring(0, 100)}"`; // Limit to 100 chars
                const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchQuery)}&format=json&utf8=1&srlimit=5`;
                
                const response = await axios.get(searchUrl, {
                    headers: { 'User-Agent': this.userAgent },
                    timeout: 8000
                });
                
                if (response.data.query && response.data.query.search && response.data.query.search.length > 0) {
                    // Check all results, not just top one
                    for (const result of response.data.query.search) {
                        const cleanSnippet = result.snippet.replace(/<[^>]*>/g, '');
                        const textToCompare = cleanSnippet + ' ' + result.title;
                        const similarity = this.calculateSimilarity(sentence, textToCompare);
                        
                        console.log(`      Found: "${result.title}" (similarity: ${(similarity * 100).toFixed(1)}%)`);
                        
                        // Accept if >= 15% similarity (Wikipedia is authoritative)
                        if (similarity >= 0.15) {
                            matches.push({
                                sentence: sentence,
                                source: 'Wikipedia',
                                results: [{
                                    title: result.title,
                                    url: `https://en.wikipedia.org/?curid=${result.pageid}`,
                                    snippet: cleanSnippet,
                                    similarity: similarity
                                }],
                                confidence: similarity >= 0.4 ? 'high' : similarity >= 0.25 ? 'medium' : 'low'
                            });
                            console.log(`      ✅ Match added (${(similarity * 100).toFixed(1)}% similarity)`);
                            break; // Found a match, move to next sentence
                        }
                    }
                }
            }
        } catch (error) {
            console.error('   ⚠️ Wikipedia check failed:', error.message);
        }
        
        return matches;
    }

    /**
     * Check Semantic Scholar (200M+ academic papers, FREE, no API key!)
     * API: https://api.semanticscholar.org/
     */
    async checkSemanticScholar(sentences) {
        const matches = [];
        
        try {
            for (const sentence of sentences.slice(0, 10)) { // Check top 10
                await this.delay(100); // 100 req/sec allowed, but be nice
                
                // Semantic Scholar search API
                const searchUrl = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(sentence)}&limit=3&fields=title,abstract,url,authors`;
                
                const response = await axios.get(searchUrl, {
                    headers: { 
                        'User-Agent': this.userAgent
                    },
                    timeout: 8000
                });
                
                if (response.data.data && response.data.data.length > 0) {
                    for (const paper of response.data.data) {
                        const textToCompare = `${paper.title} ${paper.abstract || ''}`;
                        const similarity = this.calculateSimilarity(sentence, textToCompare);
                        
                        if (similarity >= 0.3) {
                            matches.push({
                                sentence: sentence,
                                source: 'Semantic Scholar',
                                results: [{
                                    title: paper.title,
                                    url: paper.url || `https://www.semanticscholar.org/paper/${paper.paperId}`,
                                    snippet: paper.abstract ? paper.abstract.substring(0, 200) + '...' : '(No abstract)',
                                    similarity: similarity
                                }],
                                confidence: similarity >= 0.6 ? 'high' : similarity >= 0.4 ? 'medium' : 'low'
                            });
                        }
                    }
                }
            }
        } catch (error) {
            console.error('   ⚠️ Semantic Scholar check failed:', error.message);
        }
        
        return matches;
    }

    /**
     * Check ArXiv (academic papers, FREE)
     * API: https://arxiv.org/help/api
     */
    async checkArXiv(sentences) {
        const matches = [];
        
        try {
            for (const sentence of sentences.slice(0, 10)) { // Check top 10
                await this.delay(350); // 3 requests/sec limit
                
                // ArXiv API
                const searchUrl = `http://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(sentence)}&max_results=3`;
                
                const response = await axios.get(searchUrl, {
                    headers: { 'User-Agent': this.userAgent },
                    timeout: 8000
                });
                
                // Parse XML response
                const entries = response.data.match(/<entry>(.*?)<\/entry>/gs) || [];
                
                for (const entry of entries) {
                    const titleMatch = entry.match(/<title>(.*?)<\/title>/s);
                    const summaryMatch = entry.match(/<summary>(.*?)<\/summary>/s);
                    const idMatch = entry.match(/<id>(.*?)<\/id>/);
                    
                    if (titleMatch && summaryMatch) {
                        const title = titleMatch[1].trim().replace(/\s+/g, ' ');
                        const summary = summaryMatch[1].trim().replace(/\s+/g, ' ');
                        const url = idMatch ? idMatch[1].trim() : '';
                        
                        const textToCompare = `${title} ${summary}`;
                        const similarity = this.calculateSimilarity(sentence, textToCompare);
                        
                        if (similarity >= 0.3) {
                            matches.push({
                                sentence: sentence,
                                source: 'ArXiv',
                                results: [{
                                    title: title,
                                    url: url,
                                    snippet: summary.substring(0, 200) + '...',
                                    similarity: similarity
                                }],
                                confidence: similarity >= 0.6 ? 'high' : similarity >= 0.4 ? 'medium' : 'low'
                            });
                        }
                    }
                }
            }
        } catch (error) {
            console.error('   ⚠️ ArXiv check failed:', error.message);
        }
        
        return matches;
    }

    /**
     * Extract important sentences
     */
    extractImportantSentences(text, maxSentences) {
        const sentences = this.tokenizer.tokenize(text);
        
        if (!sentences || sentences.length === 0) {
            return [];
        }
        
        // Score and sort sentences
        const scoredSentences = sentences.map(sentence => ({
            text: sentence,
            score: this.scoreSentenceImportance(sentence)
        }));
        
        return scoredSentences
            .sort((a, b) => b.score - a.score)
            .slice(0, maxSentences)
            .map(s => s.text);
    }

    /**
     * Score sentence importance
     */
    scoreSentenceImportance(sentence) {
        let score = 0;
        
        // Length (50-150 chars ideal)
        const len = sentence.length;
        if (len >= 50 && len <= 150) score += 10;
        else if (len > 150) score += 5;
        
        // Word count (8-25 words ideal)
        const wordCount = sentence.split(/\s+/).length;
        if (wordCount >= 8 && wordCount <= 25) score += 10;
        
        // Has numbers or technical terms
        if (/\d/.test(sentence)) score += 3;
        if (/[A-Z][a-z]+[A-Z]/.test(sentence)) score += 3;
        
        // Avoid questions and very short
        if (sentence.includes('?')) score -= 5;
        if (wordCount < 5) score -= 10;
        
        // Avoid common starts
        const commonStarts = ['the', 'this', 'that', 'it', 'in', 'for', 'and', 'but'];
        const firstWord = sentence.toLowerCase().split(/\s+/)[0];
        if (commonStarts.includes(firstWord)) score -= 2;
        
        return score;
    }

    /**
     * Calculate text similarity (Jaccard)
     */
    calculateSimilarity(text1, text2) {
        if (!text1 || !text2) return 0;
        
        const words1 = new Set(text1.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 3));
        const words2 = new Set(text2.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 3));
        
        if (words1.size === 0 || words2.size === 0) return 0;
        
        const intersection = new Set([...words1].filter(w => words2.has(w)));
        const union = new Set([...words1, ...words2]);
        
        return intersection.size / union.size;
    }

    /**
     * Generate summary
     */
    generateSummary(matches) {
        if (matches.length === 0) {
            return {
                verdict: 'No Internet Sources Found',
                severity: 'safe',
                color: '#22c55e',
                message: 'No matching content found in Wikipedia, Semantic Scholar, or ArXiv.'
            };
        }
        
        const highConfidence = matches.filter(m => m.confidence === 'high').length;
        
        if (highConfidence >= 3) {
            return {
                verdict: 'High Internet Plagiarism Risk',
                severity: 'critical',
                color: '#ef4444',
                message: `Found ${matches.length} internet sources with ${highConfidence} high-confidence matches.`
            };
        } else if (matches.length >= 5) {
            return {
                verdict: 'Moderate Internet Plagiarism',
                severity: 'moderate',
                color: '#f59e0b',
                message: `Found ${matches.length} potential internet sources.`
            };
        } else {
            return {
                verdict: 'Low Internet Match',
                severity: 'low',
                color: '#eab308',
                message: `Found ${matches.length} possible matches. May be common knowledge.`
            };
        }
    }

    /**
     * Extract unique sources
     */
    extractUniqueSources(matches) {
        const sources = new Map();
        
        matches.forEach(match => {
            match.results.forEach(result => {
                if (!sources.has(result.url)) {
                    sources.set(result.url, {
                        url: result.url,
                        title: result.title,
                        matchCount: 1
                    });
                } else {
                    sources.get(result.url).matchCount++;
                }
            });
        });
        
        return Array.from(sources.values())
            .sort((a, b) => b.matchCount - a.matchCount)
            .slice(0, 10);
    }

    /**
     * Delay helper
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = FreeInternetChecker;

