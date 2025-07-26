const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function testAIAssignmentGenerator() {
    console.log('🧪 Testing AI Assignment Generator...\n');
    
    // Check if API key is set
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        console.error('❌ GOOGLE_API_KEY not found in environment variables');
        console.error('Please set your Google AI API key in the .env file');
        return;
    }
    
    console.log('✅ Google AI API key found');
    
    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        
        const topic = 'vector sum';
        const assignmentType = 'problem set';
        const totalMarks = 10;
        
        console.log(`📝 Testing with topic: "${topic}"`);
        console.log(`📝 Assignment type: "${assignmentType}"`);
        console.log(`📝 Total marks: ${totalMarks}\n`);
        
        const systemPrompt = `You are an expert educator creating assignments. You MUST follow these rules:
1. ONLY create content about the specified topic
2. NEVER create content about unrelated subjects
3. If topic is physics/math related, create physics/math content
4. If topic is literature related, create literature content
5. If topic is history related, create history content
6. Stay strictly within the academic domain of the topic`;

        const userPrompt = `Create an assignment with these specifications:

TOPIC: ${topic}
ASSIGNMENT TYPE: ${assignmentType}
TOTAL MARKS: ${totalMarks}

REQUIREMENTS:
- Question must be about: ${topic}
- Model answer must be about: ${topic}
- Rubric must be relevant to: ${topic}
- Do NOT create content about social media, politics, or unrelated subjects

Respond with ONLY a JSON object in this format:
{
  "question": "Your assignment question about ${topic}",
  "rubric": [{"criterion": "string", "points": number}],
  "modelAnswer": "Your model answer about ${topic}"
}`;

        console.log('🤖 Sending request to AI...\n');
        
        const result = await model.generateContent(systemPrompt + "\n\n" + userPrompt);
        
        const response = await result.response;
        const rawText = response.text();
        
        console.log('📄 Raw AI Response:');
        console.log(rawText);
        console.log('\n' + '='.repeat(50) + '\n');
        
        // Parse JSON
        let jsonString = '';
        const startIndex = rawText.indexOf('```json');
        const endIndex = rawText.lastIndexOf('```');

        if (startIndex !== -1 && endIndex > startIndex) {
            jsonString = rawText.substring(startIndex + 7, endIndex).trim();
        } else {
            const firstBrace = rawText.indexOf('{');
            const lastBrace = rawText.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace > firstBrace) {
                jsonString = rawText.substring(firstBrace, lastBrace + 1);
            }
        }

        if (!jsonString) {
            console.error('❌ Could not extract JSON from AI response');
            return;
        }
        
        const parsedContent = JSON.parse(jsonString);
        
        console.log('✅ Parsed Content:');
        console.log(JSON.stringify(parsedContent, null, 2));
        console.log('\n' + '='.repeat(50) + '\n');
        
        // Validate topic relevance
        const questionText = parsedContent.question?.toLowerCase() || '';
        const modelAnswerText = parsedContent.modelAnswer?.toLowerCase() || '';
        const topicLower = topic.toLowerCase();
        
        const topicKeywords = topicLower.split(' ');
        const isOnTopic = topicKeywords.some(keyword => 
            questionText.includes(keyword) || modelAnswerText.includes(keyword)
        ) || questionText.includes(topicLower) || modelAnswerText.includes(topicLower);
        
        console.log('🔍 Topic Validation:');
        console.log(`Topic: "${topic}"`);
        console.log(`Question contains topic: ${questionText.includes(topicLower)}`);
        console.log(`Model answer contains topic: ${modelAnswerText.includes(topicLower)}`);
        console.log(`Is on topic: ${isOnTopic ? '✅ YES' : '❌ NO'}`);
        
        if (!isOnTopic) {
            console.log('\n⚠️  WARNING: Generated content appears to be off-topic!');
            console.log('This indicates the AI is not following the topic instructions properly.');
        } else {
            console.log('\n✅ SUCCESS: Generated content appears to be on-topic!');
        }
        
    } catch (error) {
        console.error('❌ Error testing AI:', error.message);
    }
}

// Run the test
testAIAssignmentGenerator(); 