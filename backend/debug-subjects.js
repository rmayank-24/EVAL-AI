require('dotenv').config();
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function debugSubjects() {
  try {
    console.log('🔍 Debugging Subjects and Teacher Assignments...\n');
    
    const snapshot = await db.collection('subjects').get();
    console.log(`📊 Total subjects found: ${snapshot.docs.length}\n`);
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      console.log(`📚 Subject: ${data.name}`);
      console.log(`   ID: ${doc.id}`);
      console.log(`   Teacher UID: ${data.teacherUid || 'None'}`);
      console.log(`   Created: ${data.createdAt?.toDate?.() || 'N/A'}`);
      
      if (data.teacherUid) {
        try {
          const teacherDoc = await db.collection('users').doc(data.teacherUid).get();
          if (teacherDoc.exists) {
            const teacherData = teacherDoc.data();
            console.log(`   ✅ Teacher found: ${teacherData.name || teacherData.email} (${teacherData.role})`);
          } else {
            console.log(`   ❌ Teacher not found in users collection`);
          }
        } catch (error) {
          console.log(`   ❌ Error fetching teacher: ${error.message}`);
        }
      } else {
        console.log(`   ⚠️  No teacher assigned`);
      }
      console.log('');
    }
    
    // Also check all teachers
    console.log('👨‍🏫 All teachers in users collection:');
    const teachersSnapshot = await db.collection('users').where('role', '==', 'teacher').get();
    teachersSnapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log(`   - ${data.name || data.email} (UID: ${doc.id})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugSubjects().then(() => process.exit(0)); 