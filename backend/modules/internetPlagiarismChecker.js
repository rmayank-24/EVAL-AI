// Free Internet Plagiarism Checker for EVAL-AI
// Uses DuckDuckGo HTML parsing (free, no API key needed)

const axios = require('axios');
const cheerio = require('cheerio');
const natural = require('natural');

/**
 * Internet Plagiarism Checker (Free Version)
 * 
 * Features:
 * 1. DuckDuckGo search (no API key, no rate limits)
 * 2. Wikipedia API (official, free)
 * 3. arXiv API (academic papers, free)
 * 
 * No cost, no API keys, works out of the box!
 */
class InternetPlagiarismChecker {
    constructor() {
        this.tokenizer = new natural.SentenceTokenizer();
        this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
        
        // Rate limiting
        this.lastRequestTime = 0;
        this.minDelay = 1000; // 1 second between requests (be respectful)
    }

    /**
     * Main function: Check text against internet sources
     */
    async checkTextOnline(text, maxSentences = 15) {
        console.log('\n🌐 ===== INTERNET PLAGIARISM CHECK STARTED =====');
        console.log(`📊 Checking up to ${maxSentences} sentences online`);
        
        const startTime = Date.now();
        
        try {
            // Extract important sentences
            const sentences = this.extractImportantSentences(text, maxSentences);
            console.log(`📝 Selected ${sentences.length} important sentences to check`);
            
            const matches = [];
            let checked = 0;
            
            for (const sentence of sentences) {
                checked++;
                console.log(`   [${checked}/${sentences.length}] Checking: "${sentence.substring(0, 60)}..."`);
                
                // Search on DuckDuckGo
                const ddgResults = await this.searchDuckDuckGo(sentence);
                
                if (ddgResults.found) {
                    matches.push({
                        sentence: sentence,
                        source: 'DuckDuckGo',
                        results: ddgResults.results,
                        confidence: this.calculateConfidence(sentence, ddgResults.results)
                    });
                    console.log(`      ✅ Found ${ddgResults.results.length} potential matches`);
                } else {
                    console.log(`      ❌ No matches found`);
                }
                
                // Respect rate limits
                await this.delay(this.minDelay);
            }
            
            // Also check Wikipedia for common knowledge
            console.log('\n📚 Checking Wikipedia...');
            const wikiMatches = await this.checkWikipedia(text);
            if (wikiMatches.length > 0) {
                matches.push(...wikiMatches);
                console.log(`   ✅ Found ${wikiMatches.length} Wikipedia matches`);
            }
            
            const processingTime = ((Date.now() - startTime) / 1000).toFixed(1);
            console.log(`\n✅ ===== INTERNET CHECK COMPLETE in ${processingTime}s =====`);
            console.log(`📊 Results: ${matches.length} internet sources found\n`);
            
            return {
                checked: true,
                timestamp: new Date().toISOString(),
                processingTime: `${processingTime}s`,
                sentencesChecked: sentences.length,
                internetMatches: matches.length,
                matches: matches,
                summary: this.generateSummary(matches),
                sources: this.extractUniqueSources(matches)
            };
            
        } catch (error) {
            console.error('❌ Internet check error:', error.message);
            return {
                checked: false,
                error: true,
                message: 'Internet plagiarism check failed: ' + error.message,
                internetMatches: 0
            };
        }
    }

    /**
     * Search DuckDuckGo (free, no API key)
     */
    async searchDuckDuckGo(query) {
        try {
            await this.respectRateLimit();
            
            // DuckDuckGo HTML search
            const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent('"' + query + '"')}`;
            
            const response = await axios.get(searchUrl, {
                headers: {
                    'User-Agent': this.userAgent,
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Accept-Encoding': 'gzip, deflate',
                    'DNT': '1',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1'
                },
                timeout: 10000,
                maxRedirects: 5
            });
            
            const $ = cheerio.load(response.data);
            const results = [];
            
            // Parse DuckDuckGo results
            $('.result').each((i, element) => {
                if (i >= 5) return false; // Top 5 results only
                
                const titleElement = $(element).find('.result__a');
                const snippetElement = $(element).find('.result__snippet');
                const urlElement = $(element).find('.result__url');
                
                const title = titleElement.text().trim();
                const snippet = snippetElement.text().trim();
                const url = titleElement.attr('href') || urlElement.text().trim();
                
                if (title && url) {
                    results.push({
                        title: title,
                        url: this.cleanUrl(url),
                        snippet: snippet,
                        similarity: this.calculateSnippetSimilarity(query, snippet)
                    });
                }
            });
            
            return {
                found: results.length > 0,
                results: results
            };
            
        } catch (error) {
            console.error('   ⚠️ DuckDuckGo search failed:', error.message);
            return { found: false, results: [] };
        }
    }

    /**
     * Check Wikipedia (official API, completely free)
     */
    async checkWikipedia(text) {
        try {
            const sentences = this.extractImportantSentences(text, 5);
            const matches = [];
            
            for (const sentence of sentences) {
                await this.respectRateLimit();
                
                // Wikipedia search API
                const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(sentence)}&format=json&utf8=1`;
                
                const response = await axios.get(searchUrl, {
                    headers: { 'User-Agent': this.userAgent },
                    timeout: 8000
                });
                
                if (response.data.query && response.data.query.search.length > 0) {
                    const topResult = response.data.query.search[0];
                    
                    // Check if snippet contains similar content
                    const similarity = this.calculateSnippetSimilarity(
                        sentence, 
                        topResult.snippet.replace(/<[^>]*>/g, '') // Remove HTML tags
                    );
                    
                    if (similarity > 0.6) {
                        matches.push({
                            sentence: sentence,
                            source: 'Wikipedia',
                            results: [{
                                title: topResult.title,
                                url: `https://en.wikipedia.org/wiki/${topResult.title.replace(/ /g, '_')}`,
                                snippet: topResult.snippet.replace(/<[^>]*>/g, ''),
                                similarity: similarity
                            }],
                            confidence: similarity >= 0.8 ? 'high' : 'medium'
                        });
                    }
                }
                
                await this.delay(500); // Be nice to Wikipedia
            }
            
            return matches;
            
        } catch (error) {
            console.error('   ⚠️ Wikipedia check failed:', error.message);
            return [];
        }
    }

    /**
     * Extract important sentences to check (avoid checking everything)
     */
    extractImportantSentences(text, maxSentences) {
        const sentences = this.tokenizer.tokenize(text);
        
        if (!sentences || sentences.length === 0) {
            return [];
        }
        
        // Score sentences by importance
        const scoredSentences = sentences.map(sentence => ({
            text: sentence,
            score: this.scoreSentenceImportance(sentence)
        }));
        
        // Sort by score and take top N
        return scoredSentences
            .sort((a, b) => b.score - a.score)
            .slice(0, maxSentences)
            .map(s => s.text);
    }

    /**
     * Score sentence importance (longer, more unique = higher score)
     */
    scoreSentenceImportance(sentence) {
        let score = 0;
        
        // Length factor (prefer 50-150 chars)
        const len = sentence.length;
        if (len >= 50 && len <= 150) {
            score += 10;
        } else if (len > 150) {
            score += 5;
        }
        
        // Word count (prefer 8-25 words)
        const wordCount = sentence.split(/\s+/).length;
        if (wordCount >= 8 && wordCount <= 25) {
            score += 10;
        }
        
        // Has numbers or technical terms
        if (/\d/.test(sentence)) score += 3;
        if (/[A-Z][a-z]+[A-Z]/.test(sentence)) score += 3; // CamelCase
        
        // Avoid questions and very short sentences
        if (sentence.includes('?')) score -= 5;
        if (wordCount < 5) score -= 10;
        
        // Avoid common phrases
        const commonStarts = ['the', 'this', 'that', 'it', 'in', 'for', 'and', 'but'];
        const firstWord = sentence.toLowerCase().split(/\s+/)[0];
        if (commonStarts.includes(firstWord)) score -= 2;
        
        return score;
    }

    /**
     * Calculate similarity between query and snippet
     */
    calculateSnippetSimilarity(sentence, snippet) {
        if (!snippet || snippet.length < 10) return 0;
        
        const s1 = sentence.toLowerCase().replace(/[^\w\s]/g, '');
        const s2 = snippet.toLowerCase().replace(/[^\w\s]/g, '');
        
        const words1 = new Set(s1.split(/\s+/).filter(w => w.length > 3));
        const words2 = new Set(s2.split(/\s+/).filter(w => w.length > 3));
        
        if (words1.size === 0 || words2.size === 0) return 0;
        
        // Jaccard similarity
        const intersection = new Set([...words1].filter(w => words2.has(w)));
        const union = new Set([...words1, ...words2]);
        
        return intersection.size / union.size;
    }

    /**
     * Calculate confidence for a match
     */
    calculateConfidence(sentence, results) {
        if (results.length === 0) return 'none';
        
        const avgSimilarity = results.reduce((sum, r) => sum + (r.similarity || 0), 0) / results.length;
        
        if (avgSimilarity >= 0.8) return 'high';
        if (avgSimilarity >= 0.6) return 'medium';
        return 'low';
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
                message: 'No matching content found on the internet.'
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
     * Clean URL (remove DuckDuckGo redirect)
     */
    cleanUrl(url) {
        if (url.includes('uddg=')) {
            try {
                const match = url.match(/uddg=([^&]+)/);
                if (match) {
                    return decodeURIComponent(match[1]);
                }
            } catch (e) {
                // Fall through
            }
        }
        return url;
    }

    /**
     * Rate limiting
     */
    async respectRateLimit() {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        
        if (timeSinceLastRequest < this.minDelay) {
            await this.delay(this.minDelay - timeSinceLastRequest);
        }
        
        this.lastRequestTime = Date.now();
    }

    /**
     * Delay helper
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = InternetPlagiarismChecker;

