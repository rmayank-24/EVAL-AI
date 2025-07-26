require('dotenv').config();
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Simulate the checkAuth middleware
async function simulateAuth() {
  // Get any admin user for testing
  const adminSnapshot = await db.collection('users').where('role', '==', 'admin').limit(1).get();
  if (adminSnapshot.empty) {
    throw new Error('No admin user found');
  }
  const adminDoc = adminSnapshot.docs[0];
  return {
    role: adminDoc.data().role,
    uid: adminDoc.id
  };
}

// Simulate the subjects endpoint
async function testSubjectsEndpoint() {
  try {
    console.log('🧪 Testing /subjects endpoint...\n');
    
    const user = await simulateAuth();
    console.log(`👤 Authenticated as: ${user.role} (${user.uid})\n`);
    
    const { role, uid } = user;
    let query = db.collection('subjects');
    
    // Teachers can only see subjects they're assigned to
    if (role === 'teacher') {
      query = query.where('teacherUid', '==', uid);
    }
    // Admins and students can see all subjects
    
    const snapshot = await query.get();
    const subjects = [];
    
    console.log('🔄 Processing subjects...\n');
    
    // Process each subject and fetch teacher information
    for (const doc of snapshot.docs) {
      const subjectData = doc.data();
      const subject = {
        id: doc.id,
        ...subjectData,
        createdAt: subjectData.createdAt?.toDate(),
        updatedAt: subjectData.updatedAt?.toDate()
      };
      
      console.log(`📚 Processing: ${subject.name} (Teacher UID: ${subjectData.teacherUid || 'None'})`);
      
      // Fetch teacher information if teacherUid exists
      if (subjectData.teacherUid) {
        try {
          const teacherDoc = await db.collection('users').doc(subjectData.teacherUid).get();
          if (teacherDoc.exists) {
            const teacherData = teacherDoc.data();
            subject.teacher = {
              uid: subjectData.teacherUid,
              name: teacherData.name || teacherData.email,
              email: teacherData.email
            };
            console.log(`   ✅ Teacher found: ${subject.teacher.name}`);
          } else {
            console.log(`   ❌ Teacher not found in users collection`);
            subject.teacher = null;
          }
        } catch (error) {
          console.error(`   ❌ Error fetching teacher: ${error.message}`);
          subject.teacher = null;
        }
      } else {
        console.log(`   ⚠️  No teacher assigned`);
      }
      
      subjects.push(subject);
    }
    
    // Sort in memory instead of using orderBy to avoid composite index requirement
    subjects.sort((a, b) => {
      if (!a.createdAt || !b.createdAt) return 0;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
    
    console.log('\n📋 Final API Response:');
    console.log(JSON.stringify(subjects, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testSubjectsEndpoint().then(() => process.exit(0)); 