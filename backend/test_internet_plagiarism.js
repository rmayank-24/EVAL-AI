// Test script for internet plagiarism checker
const InternetPlagiarismChecker = require('./modules/internetPlagiarismChecker');

async function test() {
    console.log('🧪 Testing Internet Plagiarism Checker\n');
    
    const checker = new InternetPlagiarismChecker();
    
    // Test with a sentence that should definitely be found online
    const testText = `
    The Earth is the third planet from the Sun and the only astronomical object 
    known to harbor life. According to radiometric dating and other sources of evidence, 
    Earth formed over 4.5 billion years ago. The Earth's gravity interacts with other 
    objects in space, especially the Sun and the Moon.
    `;
    
    console.log('📝 Test text (from Wikipedia - should be detected):');
    console.log(testText.trim());
    console.log('\n' + '='.repeat(80) + '\n');
    
    try {
        const result = await checker.checkTextOnline(testText, 5); // Check 5 sentences max
        
        console.log('\n' + '='.repeat(80));
        console.log('📊 FINAL RESULTS:');
        console.log('='.repeat(80));
        console.log(`✅ Checked: ${result.checked}`);
        console.log(`⏱️  Processing time: ${result.processingTime}`);
        console.log(`📝 Sentences checked: ${result.sentencesChecked}`);
        console.log(`🌐 Internet matches found: ${result.internetMatches}`);
        console.log(`📈 Summary: ${result.summary.verdict}`);
        console.log(`📊 Severity: ${result.summary.severity}`);
        console.log(`💬 Message: ${result.summary.message}`);
        
        if (result.matches && result.matches.length > 0) {
            console.log('\n🔍 Match Details:');
            result.matches.forEach((match, idx) => {
                console.log(`\n  ${idx + 1}. Source: ${match.source}`);
                console.log(`     Sentence: "${match.sentence.substring(0, 80)}..."`);
                console.log(`     Confidence: ${match.confidence}`);
                console.log(`     Results found: ${match.results.length}`);
                
                match.results.forEach((r, ridx) => {
                    console.log(`       ${ridx + 1}. ${r.title} (${(r.similarity * 100).toFixed(1)}%)`);
                    console.log(`          URL: ${r.url}`);
                });
            });
        }
        
        if (result.sources && result.sources.length > 0) {
            console.log('\n📚 Unique Sources:');
            result.sources.forEach((source, idx) => {
                console.log(`  ${idx + 1}. ${source.title} (${source.matchCount} matches)`);
                console.log(`     ${source.url}`);
            });
        }
        
        console.log('\n' + '='.repeat(80));
        
        if (result.internetMatches === 0) {
            console.log('\n⚠️  WARNING: No matches found!');
            console.log('Possible causes:');
            console.log('  1. DuckDuckGo is blocking requests (403 error in logs above)');
            console.log('  2. Similarity threshold too high (currently 30%)');
            console.log('  3. Network connectivity issues');
            console.log('\n💡 Solution: Set up Google Custom Search API (100 free/day)');
            console.log('   See: GOOGLE_SEARCH_API_SETUP.md');
        } else {
            console.log('\n✅ TEST PASSED: Internet plagiarism detection is working!');
            console.log(`   Found ${result.internetMatches} matches from online sources.`);
        }
        
    } catch (error) {
        console.error('\n❌ TEST FAILED:', error.message);
        console.error(error.stack);
    }
}

// Run test
console.log('Starting test in 2 seconds...\n');
setTimeout(() => {
    test().then(() => {
        console.log('\n✅ Test complete!');
        process.exit(0);
    }).catch(err => {
        console.error('\n❌ Test error:', err);
        process.exit(1);
    });
}, 2000);

