// Google Custom Search API Integration (FREE - 100 searches/day)
// Documentation: https://developers.google.com/custom-search/v1/overview

const axios = require('axios');

/**
 * Google Custom Search API Plagiarism Checker
 * 
 * FREE TIER: 100 searches/day (3,000/month)
 * To get API key:
 * 1. Go to: https://developers.google.com/custom-search/v1/overview
 * 2. Click "Get a Key"
 * 3. Create project and enable Custom Search API
 * 4. Get Search Engine ID from: https://programmablesearchengine.google.com/
 */
class GoogleSearchChecker {
    constructor(apiKey, searchEngineId) {
        this.apiKey = apiKey || process.env.GOOGLE_SEARCH_API_KEY;
        this.searchEngineId = searchEngineId || process.env.GOOGLE_SEARCH_ENGINE_ID;
        this.baseUrl = 'https://www.googleapis.com/customsearch/v1';
        this.enabled = !!(this.apiKey && this.searchEngineId);
        
        if (!this.enabled) {
            console.log('⚠️ Google Search API not configured (optional - using DuckDuckGo only)');
        }
    }

    /**
     * Search Google for exact phrase
     */
    async searchGoogle(query) {
        if (!this.enabled) {
            return { found: false, results: [], reason: 'API not configured' };
        }

        try {
            const url = `${this.baseUrl}?key=${this.apiKey}&cx=${this.searchEngineId}&q="${encodeURIComponent(query)}"&num=5`;
            
            console.log(`      🔍 Searching Google Custom Search API...`);
            
            const response = await axios.get(url, {
                timeout: 10000
            });

            if (response.data.items && response.data.items.length > 0) {
                const results = response.data.items.map(item => ({
                    title: item.title,
                    url: item.link,
                    snippet: item.snippet || '',
                    similarity: this.calculateSimilarity(query, item.snippet || item.title)
                }));

                console.log(`      ✅ Found ${results.length} Google results`);
                results.forEach((r, idx) => {
                    console.log(`         ${idx + 1}. ${r.title} (similarity: ${(r.similarity * 100).toFixed(1)}%)`);
                });

                return {
                    found: true,
                    results: results,
                    quotaUsed: 1 // Track quota usage
                };
            } else {
                console.log(`      ❌ No Google results found`);
                return { found: false, results: [] };
            }

        } catch (error) {
            if (error.response && error.response.status === 429) {
                console.error(`      ⚠️ Google API quota exceeded (100/day limit)`);
                return { found: false, results: [], reason: 'quota_exceeded' };
            } else if (error.response && error.response.status === 403) {
                console.error(`      ⚠️ Google API authentication failed - check API key`);
                return { found: false, results: [], reason: 'auth_failed' };
            } else {
                console.error(`      ❌ Google API error: ${error.message}`);
                return { found: false, results: [], reason: error.message };
            }
        }
    }

    /**
     * Check multiple sentences against Google
     */
    async checkTextOnline(sentences) {
        if (!this.enabled) {
            return {
                checked: false,
                reason: 'Google API not configured',
                matches: []
            };
        }

        const matches = [];
        let quotaUsed = 0;

        for (const sentence of sentences) {
            if (quotaUsed >= 15) { // Max 15 checks per submission to save quota
                console.log(`      ⏸️ Stopping at 15 checks to preserve API quota`);
                break;
            }

            const googleResults = await this.searchGoogle(sentence);
            quotaUsed++;

            if (googleResults.found && googleResults.results.length > 0) {
                const relevantResults = googleResults.results.filter(r => r.similarity >= 0.3);
                
                if (relevantResults.length > 0) {
                    matches.push({
                        sentence: sentence,
                        source: 'Google',
                        results: relevantResults,
                        confidence: this.calculateConfidence(relevantResults)
                    });
                }
            }

            // Rate limiting (Google allows 1 request/second)
            await this.delay(1000);
        }

        return {
            checked: true,
            source: 'Google Custom Search API',
            quotaUsed: quotaUsed,
            quotaRemaining: `${100 - quotaUsed} searches left today (resets daily)`,
            matches: matches
        };
    }

    /**
     * Calculate text similarity (Jaccard similarity)
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
     * Calculate confidence level
     */
    calculateConfidence(results) {
        if (results.length === 0) return 'none';
        
        const avgSimilarity = results.reduce((sum, r) => sum + (r.similarity || 0), 0) / results.length;
        
        if (avgSimilarity >= 0.7) return 'high';
        if (avgSimilarity >= 0.5) return 'medium';
        return 'low';
    }

    /**
     * Delay helper
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = GoogleSearchChecker;

