const admin = require('firebase-admin');
require('dotenv').config();

// Initialize Firebase Admin
const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || require('./serviceAccountKey.json'));
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function testSubjectFiltering() {
    console.log('🧪 Testing Subject Filtering...\n');
    
    try {
        // Get all subjects first
        const allSubjectsSnapshot = await db.collection('subjects').get();
        const allSubjects = allSubjectsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        console.log(`📊 Total subjects in database: ${allSubjects.length}`);
        allSubjects.forEach(subject => {
            console.log(`  - ${subject.name} (Teacher: ${subject.teacherUid})`);
        });
        
        console.log('\n' + '='.repeat(50) + '\n');
        
        // Test with different user roles
        const testUsers = [
            { uid: 'admin-test', role: 'admin' },
            { uid: 'teacher-test', role: 'teacher' },
            { uid: 'student-test', role: 'student' }
        ];
        
        for (const user of testUsers) {
            console.log(`👤 Testing with user: ${user.uid} (Role: ${user.role})`);
            
            let query = db.collection('subjects');
            
            // Apply the same filtering logic as the backend
            if (user.role === 'teacher') {
                query = query.where('teacherUid', '==', user.uid);
                console.log(`  🔍 Filtering for teacher UID: ${user.uid}`);
            } else {
                console.log(`  🔍 Showing all subjects for role: ${user.role}`);
            }
            
            const snapshot = await query.orderBy('createdAt', 'desc').get();
            const subjects = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            console.log(`  📋 Found ${subjects.length} subjects:`);
            subjects.forEach(subject => {
                console.log(`    - ${subject.name} (Teacher: ${subject.teacherUid})`);
            });
            
            console.log('');
        }
        
        console.log('✅ Subject filtering test completed!');
        
    } catch (error) {
        console.error('❌ Error testing subject filtering:', error);
    }
}

// Run the test
testSubjectFiltering(); 