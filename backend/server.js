// --- Backend Server (server.js) ---
// V7.0 (Revised): Implemented robust error handling, security patches, and performance optimizations.

// 1. Import necessary packages
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();
const admin = require('firebase-admin');
const multer = require('multer');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');

// 2. Initialize Express App and configure middleware
const app = express();
const PORT = process.env.PORT || 8000;
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:4173', 'http://localhost:5174', 'https://eval-50qea5ca9-mayanks-projects-fd92aa30.vercel.app', 'https://eval-ai-beta.vercel.app'],
    credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// 3. Initialize Firebase Admin (Securely)
let db;
try {
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
        throw new Error("Firebase service account key environment variable (GOOGLE_SERVICE_ACCOUNT_KEY) is not set.");
    }
    const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    db = admin.firestore();
    console.log("Firebase Admin initialized successfully.");
} catch (error) {
    console.error("Error initializing Firebase Admin:", error);
    process.exit(1);
}

// 4. Initialize the Google AI Client
let genAI;
try {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        throw new Error("GOOGLE_API_KEY environment variable is not set!");
    }
    genAI = new GoogleGenerativeAI(apiKey);
    console.log("Google AI initialized successfully.");
} catch (error) {
    console.error("Error initializing Google AI:", error);
    process.exit(1);
}

// --- AI Helper Function with Retry Logic ---
const callGenerativeAI = async (prompt, isJson = true, retries = 3, delay = 1000) => {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

    for (let i = 0; i < retries; i++) {
        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const rawText = response.text();

            if (!isJson) {
                return rawText; // Return raw text if JSON is not expected
            }

            // Robust JSON parsing
            const startIndex = rawText.indexOf('{');
            const endIndex = rawText.lastIndexOf('}');
            if (startIndex === -1 || endIndex === -1) {
                console.error("AI Response Text (Invalid JSON):", rawText);
                throw new Error("Valid JSON object not found in the AI's response.");
            }
            const jsonString = rawText.substring(startIndex, endIndex + 1);
            return JSON.parse(jsonString);

        } catch (error) {
            // Check for retryable server errors (5xx)
            const status = error.status || (error.cause && error.cause.status);
            if (status >= 500 && i < retries - 1) {
                console.log(`AI call failed (attempt ${i + 1}/${retries}) with status ${status}. Retrying in ${delay / 1000}s...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 2; // Exponential backoff
            } else {
                // For non-retryable errors or after all retries fail
                console.error("Critical AI Error after retries or non-retryable error:", error);
                throw new Error("Failed to get a response from the AI model. It may be overloaded or the request is invalid.");
            }
        }
    }
};

// 5. Middleware
const checkAuth = async (req, res, next) => {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) return res.status(401).json({ error: 'Unauthorized. No token provided.' });
    try {
        req.user = await admin.auth().verifyIdToken(idToken);
        next();
    } catch (error) {
        console.error("Auth verification error:", error.message);
        return res.status(401).json({ error: 'Invalid or expired token.' });
    }
};

const checkAdmin = (req, res, next) => {
    if (req.user.role === 'admin') next();
    else res.status(403).json({ error: 'Forbidden: Requires admin role.' });
};

const checkTeacherOrAdmin = (req, res, next) => {
    if (req.user.role === 'teacher' || req.user.role === 'admin') next();
    else res.status(403).json({ error: 'Forbidden: Requires teacher or admin role.' });
};

// 6. Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        version: '7.0.0'
    });
});

// --- USER MANAGEMENT ENDPOINTS ---
app.post('/users', checkAuth, async (req, res) => {
    const { email, uid } = req.user;
    try {
        const usersCollection = db.collection('users');
        const userDoc = await usersCollection.doc(uid).get();

        // Only create user document and set role if it doesn't exist
        if (!userDoc.exists) {
            const userCountSnapshot = await usersCollection.get();
            const role = userCountSnapshot.empty ? 'admin' : 'student';

            await admin.auth().setCustomUserClaims(uid, { role: role });
            await usersCollection.doc(uid).set({
                email: email,
                role: role,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                lastLogin: admin.firestore.FieldValue.serverTimestamp()
            });
            res.status(201).json({ message: `User setup complete. Role: ${role}`, role: role });
        } else {
            // If user exists, just update last login
            await usersCollection.doc(uid).update({ lastLogin: admin.firestore.FieldValue.serverTimestamp() });
            res.status(200).json({ message: 'User already exists.', role: userDoc.data().role });
        }
    } catch (error) {
        console.error("Error setting up user:", error);
        res.status(500).json({ error: "Failed to set up user." });
    }
});

app.get('/users', [checkAuth, checkAdmin], async (req, res) => {
    try {
        const listUsersResult = await admin.auth().listUsers(1000);
        const users = await Promise.all(listUsersResult.users.map(async (userRecord) => {
            const doc = await db.collection('users').doc(userRecord.uid).get();
            return {
                uid: userRecord.uid,
                email: userRecord.email,
                role: doc.exists ? doc.data().role : 'student',
                createdAt: doc.exists ? doc.data().createdAt?.toDate() : null
            };
        }));
        res.status(200).json(users);
    } catch (error) {
        console.error("Error listing users:", error);
        res.status(500).json({ error: 'Failed to list users.' });
    }
});

app.post('/users/set-role', [checkAuth, checkAdmin], async (req, res) => {
    const { targetUid, newRole } = req.body;
    if (!targetUid || !newRole || !['student', 'teacher', 'admin'].includes(newRole)) {
        return res.status(400).json({ error: 'Valid targetUid and newRole are required.' });
    }
    try {
        await admin.auth().setCustomUserClaims(targetUid, { role: newRole });
        await db.collection('users').doc(targetUid).update({
            role: newRole,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        res.status(200).json({ message: `Successfully set role for ${targetUid} to ${newRole}` });
    } catch (error) {
        console.error("Error setting user role:", error);
        res.status(500).json({ error: "Failed to set user role." });
    }
});

// --- SUBJECT MANAGEMENT ENDPOINTS ---
app.post('/subjects', [checkAuth, checkTeacherOrAdmin], async (req, res) => {
    const { name, description, teacherUid } = req.body;
    if (!name || !teacherUid) return res.status(400).json({ error: 'Subject name and teacher are required.' });

    try {
        const teacherRecord = await admin.auth().getUser(teacherUid);
        const subjectData = {
            name: name.trim(),
            description: description ? description.trim() : '',
            teacherUid: teacherUid,
            teacherEmail: teacherRecord.email,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        const docRef = await db.collection('subjects').add(subjectData);
        res.status(201).json({ id: docRef.id, ...subjectData });
    } catch (error) {
        console.error("Error creating subject:", error);
        res.status(500).json({ error: 'Failed to create subject. Ensure teacher UID is valid.' });
    }
});

app.get('/subjects', checkAuth, async (req, res) => {
    try {
        const { role, uid } = req.user;
        let query = db.collection('subjects');

        if (role === 'teacher') {
            query = query.where('teacherUid', '==', uid);
        }

        const subjectsSnapshot = await query.get();
        if (subjectsSnapshot.empty) {
            return res.status(200).json([]);
        }

        const subjectsData = subjectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Batch-fetch teacher information to prevent N+1 queries
        const teacherUids = [...new Set(subjectsData.map(s => s.teacherUid).filter(Boolean))];
        const teacherMap = new Map();

        if (teacherUids.length > 0) {
            const teachersSnapshot = await db.collection('users').where(admin.firestore.FieldPath.documentId(), 'in', teacherUids).get();
            teachersSnapshot.forEach(doc => {
                const teacherData = doc.data();
                teacherMap.set(doc.id, {
                    uid: doc.id,
                    name: teacherData.name || teacherData.email,
                    email: teacherData.email
                });
            });
        }

        const subjects = subjectsData.map(subject => ({
            ...subject,
            teacher: teacherMap.get(subject.teacherUid) || null,
            createdAt: subject.createdAt?.toDate(),
            updatedAt: subject.updatedAt?.toDate()
        }));

        subjects.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));

        res.status(200).json(subjects);
    } catch (error) {
        console.error("Error fetching subjects:", error);
        res.status(500).json({ error: 'Failed to fetch subjects.' });
    }
});

app.put('/subjects/:id', [checkAuth, checkTeacherOrAdmin], async (req, res) => {
    const { id } = req.params;
    const { name, description, teacherUid } = req.body;

    try {
        const docRef = db.collection('subjects').doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).json({ error: 'Subject not found.' });
        }

        if (doc.data().teacherUid !== req.user.uid && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden. You do not own this subject.' });
        }

        const updateData = {
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        if (name) updateData.name = name.trim();
        if (description !== undefined) updateData.description = description.trim();

        if (teacherUid !== undefined && req.user.role === 'admin') {
            if (teacherUid) {
                const teacherDoc = await db.collection('users').doc(teacherUid).get();
                if (!teacherDoc.exists || teacherDoc.data().role !== 'teacher') {
                    return res.status(400).json({ error: 'Invalid teacher UID provided.' });
                }
                updateData.teacherUid = teacherUid;
            } else {
                updateData.teacherUid = null;
            }
        }

        await docRef.update(updateData);
        res.status(200).json({ message: 'Subject updated successfully.' });
    } catch (error) {
        console.error("Error updating subject:", error);
        res.status(500).json({ error: 'Failed to update subject.' });
    }
});

app.delete('/subjects/:id', [checkAuth, checkAdmin], async (req, res) => {
    const { id } = req.params;
    const batch = db.batch();

    try {
        const submissionsSnapshot = await db.collection('submissions').where('subjectId', '==', id).get();
        submissionsSnapshot.docs.forEach(doc => batch.delete(doc.ref));

        const assignmentsSnapshot = await db.collection('assignments').where('subjectId', '==', id).get();
        assignmentsSnapshot.docs.forEach(doc => batch.delete(doc.ref));

        const subjectRef = db.collection('subjects').doc(id);
        batch.delete(subjectRef);

        await batch.commit();
        res.status(200).json({ message: 'Subject and all related items deleted.' });
    } catch (error) {
        console.error("Error during cascade delete of subject:", error);
        res.status(500).json({ error: 'Failed to delete subject.' });
    }
});

app.get('/teachers', checkAuth, async (req, res) => {
    try {
        const snapshot = await db.collection('users')
            .where('role', '==', 'teacher')
            .orderBy('email', 'asc')
            .get();

        const teachers = snapshot.docs.map(doc => ({
            uid: doc.id,
            name: doc.data().name || doc.data().email,
            email: doc.data().email
        }));
        res.status(200).json(teachers);
    } catch (error) {
        console.error("Error fetching teachers:", error);
        res.status(500).json({ error: 'Failed to fetch teachers.' });
    }
});


// --- ASSIGNMENT MANAGEMENT ENDPOINTS ---
app.post('/assignments', [checkAuth, checkTeacherOrAdmin], async (req, res) => {
    const { title, description, subjectId, rubric, showDetailsToStudent } = req.body;
    if (!title || !subjectId || !rubric || !Array.isArray(rubric) || rubric.length === 0) {
        return res.status(400).json({ error: 'Title, subjectId, and a valid rubric are required.' });
    }
    try {
        const subjectDoc = await db.collection('subjects').doc(subjectId).get();
        if (!subjectDoc.exists) {
            return res.status(404).json({ error: 'Subject not found.' });
        }

        const subjectData = subjectDoc.data();
        if (subjectData.teacherUid !== req.user.uid && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden. You do not own this subject.' });
        }

        const assignmentData = {
            title: title.trim(),
            description: description ? description.trim() : '',
            rubric: rubric.map(r => ({
                criterion: r.criterion.trim(),
                points: parseInt(r.points) || 0
            })),
            subjectId,
            teacherUid: req.user.uid,
            showDetailsToStudent: !!showDetailsToStudent,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        const docRef = await db.collection('assignments').add(assignmentData);
        res.status(201).json({ id: docRef.id, ...assignmentData });
    } catch (error) {
        console.error("Error creating assignment:", error);
        res.status(500).json({ error: 'Failed to create assignment.' });
    }
});

app.get('/assignments/subject/:subjectId', checkAuth, async (req, res) => {
    try {
        const { subjectId } = req.params;
        const { role } = req.user;

        const snapshot = await db.collection('assignments').where('subjectId', '==', subjectId).get();

        let assignments = snapshot.docs.map(doc => {
            const data = doc.data();
            const assignment = {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate(),
                updatedAt: data.updatedAt?.toDate()
            };

            if (role === 'student' && !assignment.showDetailsToStudent) {
                delete assignment.description;
                delete assignment.rubric;
            }
            return assignment;
        });

        assignments.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
        res.status(200).json(assignments);
    } catch (error) {
        console.error("Error fetching assignments:", error);
        res.status(500).json({ error: 'Failed to fetch assignments.' });
    }
});

app.get('/assignments/:id', checkAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.user;
        const doc = await db.collection('assignments').doc(id).get();
        if (!doc.exists) {
            return res.status(404).json({ error: 'Assignment not found.' });
        }
        const assignment = { id: doc.id, ...doc.data() };
        if (role === 'student' && !assignment.showDetailsToStudent) {
            delete assignment.description;
            delete assignment.rubric;
        }
        res.status(200).json(assignment);
    } catch (error) {
        console.error("Error fetching assignment:", error);
        res.status(500).json({ error: 'Failed to fetch assignment.' });
    }
});

app.put('/assignments/:id', [checkAuth, checkTeacherOrAdmin], async (req, res) => {
    const { id } = req.params;
    const { title, description, rubric, showDetailsToStudent } = req.body;
    try {
        const docRef = db.collection('assignments').doc(id);
        const doc = await docRef.get();
        if (!doc.exists) {
            return res.status(404).json({ error: 'Assignment not found.' });
        }
        if (doc.data().teacherUid !== req.user.uid && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden. You do not own this assignment.' });
        }
        const updateData = {
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        if (title) updateData.title = title.trim();
        if (description !== undefined) updateData.description = description.trim();
        if (rubric) updateData.rubric = rubric.map(r => ({
            criterion: r.criterion.trim(),
            points: parseInt(r.points) || 0
        }));
        if (showDetailsToStudent !== undefined) updateData.showDetailsToStudent = !!showDetailsToStudent;
        await docRef.update(updateData);
        res.status(200).json({ message: 'Assignment updated successfully.' });
    } catch (error) {
        console.error("Error updating assignment:", error);
        res.status(500).json({ error: 'Failed to update assignment.' });
    }
});

app.delete('/assignments/:id', [checkAuth, checkTeacherOrAdmin], async (req, res) => {
    const { id } = req.params;
    const batch = db.batch();
    try {
        const docRef = db.collection('assignments').doc(id);
        const doc = await docRef.get();
        if (!doc.exists) return res.status(404).json({ error: 'Assignment not found.' });

        if (doc.data().teacherUid !== req.user.uid && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden.' });
        }

        const submissionsSnapshot = await db.collection('submissions').where('assignmentId', '==', id).get();
        submissionsSnapshot.docs.forEach(doc => batch.delete(doc.ref));

        batch.delete(docRef);
        await batch.commit();
        res.status(200).json({ message: 'Assignment and related submissions deleted.' });
    } catch (error) {
        console.error("Error deleting assignment:", error);
        res.status(500).json({ error: 'Failed to delete assignment.' });
    }
});

// --- SUBMISSION ENDPOINTS ---
app.post('/evaluate', checkAuth, upload.single('file'), async (req, res) => {
    try {
        const { assignmentId, subjectId, teacherUid, isStrictMode } = req.body;
        const file = req.file;

        if (!file || !assignmentId || !subjectId || !teacherUid) {
            return res.status(400).json({ error: 'Missing required fields.' });
        }

        const assignmentDoc = await db.collection('assignments').doc(assignmentId).get();
        if (!assignmentDoc.exists) {
            return res.status(404).json({ error: 'Assignment not found.' });
        }

        const assignmentData = assignmentDoc.data();
        const { title: question, rubric } = assignmentData;
        if (!rubric || !Array.isArray(rubric)) {
            return res.status(400).json({ error: 'The selected assignment is missing a valid rubric.' });
        }

        const rubricContent = rubric.map(r => `- ${r.criterion} (${r.points} points)`).join('\n');
        const totalPoints = rubric.reduce((sum, r) => sum + (Number(r.points) || 0), 0);
        const jsonSchema = `{"score": "string (e.g., '8/${totalPoints}')","evaluation": "string (A brief, one-sentence summary.)","mistakes": "array of strings","feedback": "string (Detailed, constructive feedback.)"}`;
        const persona = isStrictMode ? 'You are a strict, logical grading machine.' : 'You are a helpful and fair professor.';
        const basePrompt = `${persona}\n\nEvaluate the student's submission for the question: "${question}".\nThe scoring guide is:\n${rubricContent}\n\nYou MUST respond with ONLY a valid JSON object following this schema:\n${jsonSchema}`;

        const promptParts = [{ text: basePrompt }];
        let extractedText = '';
        let base64ImageForDb = null;

        if (file.mimetype.startsWith('image/')) {
            const fullBase64Image = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
            const FIRESTORE_BYTE_LIMIT = 1048487;
            if (Buffer.byteLength(fullBase64Image, 'utf8') <= FIRESTORE_BYTE_LIMIT) {
                base64ImageForDb = fullBase64Image;
            }
            promptParts.push({ inlineData: { data: file.buffer.toString('base64'), mimeType: file.mimetype } });
        } else if (file.mimetype === 'application/pdf') {
            extractedText = (await pdf(file.buffer)).text;
            promptParts.push({ text: `\n\n--- STUDENT'S SUBMISSION TEXT ---\n${extractedText}` });
        } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            extractedText = (await mammoth.extractRawText({ buffer: file.buffer })).value;
            promptParts.push({ text: `\n\n--- STUDENT'S SUBMISSION TEXT ---\n${extractedText}` });
        } else {
            return res.status(400).json({ error: 'Unsupported file type.' });
        }

        const generationRequest = { contents: [{ role: "user", parts: promptParts }] };
        const parsedFeedback = await callGenerativeAI(generationRequest, true);

        await db.collection('submissions').add({
            userId: req.user.uid,
            assignmentId,
            question,
            aiFeedback: parsedFeedback,
            mode: isStrictMode ? 'Strict' : 'General',
            subjectId,
            teacherUid,
            base64Image: base64ImageForDb,
            fileName: file.originalname,
            fileType: file.mimetype,
            extractedText: extractedText,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        res.status(200).json(parsedFeedback);
    } catch (error) {
        console.error("Detailed error during evaluation:", error);
        res.status(500).json({ error: error.message || 'An internal server error occurred during evaluation.' });
    }
});

app.get('/submissions', checkAuth, async (req, res) => {
    try {
        const submissionsRef = db.collection('submissions');
        const snapshot = await submissionsRef.where('userId', '==', req.user.uid).orderBy('createdAt', 'desc').get();
        const submissions = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                question: data.question || "Untitled",
                score: (data.showScoreToStudent !== false && data.teacherScore) ? data.teacherScore : data.aiFeedback?.score,
                teacherReviewed: data.teacherReviewed || false,
                date: new Date(data.createdAt.toDate()).toLocaleDateString(),
                createdAt: data.createdAt.toDate()
            };
        });
        res.status(200).json(submissions);
    } catch (error) {
        console.error("Error fetching student submissions:", error);
        res.status(500).json({ error: 'Failed to fetch history.' });
    }
});

app.get('/submissions/teacher', [checkAuth, checkTeacherOrAdmin], async (req, res) => {
    const teacherId = req.user.uid;
    try {
        const submissionsSnapshot = await db.collection('submissions').where('teacherUid', '==', teacherId).get();
        if (submissionsSnapshot.empty) return res.status(200).json([]);

        const submissionsData = submissionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const userIds = [...new Set(submissionsData.map(s => s.userId))];
        const subjectIds = [...new Set(submissionsData.map(s => s.subjectId))];
        
        const userMap = new Map();
        if (userIds.length > 0) {
            const userRecords = await admin.auth().getUsers(userIds.map(uid => ({ uid })));
            userRecords.users.forEach(user => { userMap.set(user.uid, user.email); });
        }

        const subjectMap = new Map();
        if (subjectIds.length > 0) {
            const subjectDocs = await db.collection('subjects').where(admin.firestore.FieldPath.documentId(), 'in', subjectIds).get();
            subjectDocs.forEach(doc => { subjectMap.set(doc.id, doc.data().name); });
        }

        let teacherSubmissions = submissionsData.map(data => ({
            id: data.id,
            question: data.question,
            score: data.teacherScore || data.aiFeedback?.score,
            teacherReviewed: data.teacherReviewed || false,
            createdAt: data.createdAt.toDate(),
            studentEmail: userMap.get(data.userId) || 'Unknown Student',
            subjectName: subjectMap.get(data.subjectId) || 'Unknown Subject',
            subjectId: data.subjectId
        }));
        
        teacherSubmissions.sort((a, b) => b.createdAt - a.createdAt);
        res.status(200).json(teacherSubmissions);
    } catch (error) {
        console.error("Error fetching teacher submissions:", error);
        res.status(500).json({ error: "An internal server error occurred." });
    }
});

app.get('/submissions/:id', checkAuth, async (req, res) => {
    try {
        const doc = await db.collection('submissions').doc(req.params.id).get();
        if (!doc.exists) return res.status(404).json({ error: 'Submission not found.' });

        const submissionData = doc.data();
        const { role, uid } = req.user;

        if (role === 'admin' || (role === 'teacher' && submissionData.teacherUid === uid) || (submissionData.userId === uid)) {
            res.status(200).json({
                id: doc.id,
                ...submissionData,
                createdAt: submissionData.createdAt?.toDate(),
                teacherReviewAt: submissionData.teacherReviewAt?.toDate()
            });
        } else {
            return res.status(403).json({ error: 'Forbidden.' });
        }
    } catch (error) {
        console.error('Error fetching single submission:', error);
        res.status(500).json({ error: 'Failed to fetch submission details.' });
    }
});

app.put('/submissions/:id/review', [checkAuth, checkTeacherOrAdmin], async (req, res) => {
    const { id } = req.params;
    const { teacherScore, teacherFeedback, showScoreToStudent } = req.body;
    const { uid, role, email } = req.user;
    try {
        const submissionRef = db.collection('submissions').doc(id);
        const doc = await submissionRef.get();
        if (!doc.exists) return res.status(404).json({ error: 'Submission not found.' });
        const submissionData = doc.data();
        if (role === 'teacher' && submissionData.teacherUid !== uid) {
            return res.status(403).json({ error: 'Forbidden.' });
        }
        const updateData = {
            teacherReviewed: true,
            teacherReviewAt: admin.firestore.FieldValue.serverTimestamp(),
            showScoreToStudent: !!showScoreToStudent
        };
        if (teacherScore !== undefined) updateData.teacherScore = teacherScore;
        if (teacherFeedback !== undefined) updateData.teacherFeedback = teacherFeedback;
        await submissionRef.update(updateData);
        const notificationData = {
            studentUid: submissionData.userId,
            teacherEmail: email,
            submissionId: id,
            question: submissionData.question,
            text: "Your submission has been reviewed by your teacher.",
            type: 'review',
            isRead: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };
        await db.collection('notifications').add(notificationData);
        const updatedDoc = await submissionRef.get();
        res.status(200).json({
            id: updatedDoc.id,
            ...updatedDoc.data(),
            createdAt: updatedDoc.data().createdAt?.toDate(),
            teacherReviewAt: updatedDoc.data().teacherReviewAt?.toDate()
        });
    } catch (error) {
        console.error('Error updating submission review:', error);
        res.status(500).json({ error: 'Failed to save review.' });
    }
});

app.get('/submissions/:id/comments', checkAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const commentsRef = db.collection('submissions').doc(id).collection('comments');
        const snapshot = await commentsRef.orderBy('createdAt', 'asc').get();
        const comments = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt.toDate()
        }));
        res.status(200).json(comments);
    } catch (error) {
        console.error("Error fetching comments:", error);
        res.status(500).json({ error: "Failed to fetch comments." });
    }
});

app.post('/submissions/:id/comments', checkAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { text } = req.body;
        const { uid, email, role } = req.user;
        if (!text) {
            return res.status(400).json({ error: 'Comment text is required.' });
        }
        const commentData = {
            text: text.trim(),
            authorUid: uid,
            authorEmail: email,
            authorRole: role,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };
        const commentRef = await db.collection('submissions').doc(id).collection('comments').add(commentData);
        const submissionDoc = await db.collection('submissions').doc(id).get();
        if (submissionDoc.exists) {
            const submissionData = submissionDoc.data();
            let notificationData = {};
            if (role === 'student') {
                notificationData = {
                    teacherUid: submissionData.teacherUid,
                    studentEmail: email,
                    submissionId: id,
                    question: submissionData.question,
                    text: text,
                    type: 'student_comment',
                    isRead: false,
                    createdAt: admin.firestore.FieldValue.serverTimestamp()
                };
            } else { // Teacher or Admin
                notificationData = {
                    studentUid: submissionData.userId,
                    teacherEmail: email,
                    submissionId: id,
                    question: submissionData.question,
                    text: text,
                    type: 'teacher_comment',
                    isRead: false,
                    createdAt: admin.firestore.FieldValue.serverTimestamp()
                };
            }
            await db.collection('notifications').add(notificationData);
        }
        res.status(201).json({ id: commentRef.id, ...commentData });
    } catch (error) {
        console.error("Error posting comment:", error);
        res.status(500).json({ error: "Failed to post comment." });
    }
});

// --- NOTIFICATIONS ENDPOINTS ---
app.get('/notifications', checkAuth, async (req, res) => {
    try {
        const { uid, role } = req.user;
        let query = db.collection('notifications');

        if (role === 'student') {
            query = query.where('studentUid', '==', uid);
        } else if (role === 'teacher') {
            query = query.where('teacherUid', '==', uid);
        }
        // Admin can see all notifications

        const snapshot = await query.orderBy('createdAt', 'desc').limit(50).get();
        const notifications = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt.toDate()
        }));

        res.status(200).json(notifications);
    } catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({ error: "Failed to fetch notifications." });
    }
});

app.put('/notifications/:id/read', checkAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { uid, role } = req.user;

        const docRef = db.collection('notifications').doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).json({ error: 'Notification not found.' });
        }

        const notificationData = doc.data();
        if ((role === 'student' && notificationData.studentUid !== uid) ||
            (role === 'teacher' && notificationData.teacherUid !== uid)) {
            return res.status(403).json({ error: 'Forbidden.' });
        }

        await docRef.update({
            isRead: true,
            readAt: admin.firestore.FieldValue.serverTimestamp()
        });

        res.status(200).json({ message: 'Notification marked as read.' });
    } catch (error) {
        console.error("Error marking notification as read:", error);
        res.status(500).json({ error: "Failed to mark notification as read." });
    }
});

// --- ANALYTICS ENDPOINTS ---
app.get('/analytics/report', [checkAuth, checkTeacherOrAdmin], async (req, res) => {
    try {
        const { uid } = req.user;
        const reportRef = db.collection('analyticsReports').doc(uid);
        const reportDoc = await reportRef.get();

        if (!reportDoc.exists) {
            return res.status(200).json({
                stats: { totalSubmissions: 0, averageScore: 0, reviewedCount: 0 },
                aiSummary: "No report has been generated yet. Click the 'Generate' button to create the first one.",
                generatedAt: null
            });
        }
        const data = reportDoc.data();
        res.status(200).json({
            ...data,
            generatedAt: data.generatedAt?.toDate ? data.generatedAt.toDate().toISOString() : null
        });
    } catch (error) {
        console.error("Error fetching analytics report:", error);
        res.status(500).json({ error: "Failed to fetch analytics report." });
    }
});

app.post('/analytics/generate', [checkAuth, checkTeacherOrAdmin], async (req, res) => {
    try {
        const { role, uid } = req.user;
        let submissionsQuery = db.collection('submissions');
        if (role === 'teacher') {
            submissionsQuery = submissionsQuery.where('teacherUid', '==', uid);
        }
        const snapshot = await submissionsQuery.get();

        let totalSubmissions = 0, reviewedCount = 0, totalScore = 0, scoredSubmissions = 0;
        let submissionsForAI = [];
        if (!snapshot.empty) {
            const allSubmissions = snapshot.docs.map(doc => ({ ...doc.data(), createdAt: doc.data().createdAt.toDate() }));
            allSubmissions.forEach(data => {
                totalSubmissions++;
                if (data.teacherReviewed) reviewedCount++;
                const scoreString = data.teacherScore || data.aiFeedback?.score;
                if (typeof scoreString === 'string') {
                    const [score, maxScore] = scoreString.split('/').map(parseFloat);
                    if (!isNaN(score) && !isNaN(maxScore) && maxScore > 0) {
                        totalScore += (score / maxScore) * 100;
                        scoredSubmissions++;
                    }
                }
            });
            allSubmissions.sort((a, b) => b.createdAt - a.createdAt);
            const recentSubmissions = allSubmissions.slice(0, 50);
            submissionsForAI = recentSubmissions.map(data => ({
                question: data.question,
                score: data.teacherScore || data.aiFeedback?.score,
                mistakes: data.aiFeedback?.mistakes || []
            }));
        }

        const averageScore = scoredSubmissions > 0 ? (totalScore / scoredSubmissions).toFixed(1) : 0;
        const stats = { totalSubmissions, averageScore: parseFloat(averageScore), reviewedCount };

        let aiSummary = "No submission data is available yet to generate an analysis.";
        if (submissionsForAI.length > 0) {
            const promptText = `You are an expert educational analyst. Your role is to provide a concise, high-level summary of student performance based on recent submission data. Focus on identifying common trends, widespread mistakes, and potential areas for teacher focus. Do not list individual student performance. Keep the summary to 3-4 sentences. Here is the submission data: ${JSON.stringify(submissionsForAI, null, 2)}`;
            const prompt = { contents: [{ role: "user", parts: [{ text: promptText }] }] };
            aiSummary = await callGenerativeAI(prompt, false); // Expecting text
        }

        const reportRef = db.collection('analyticsReports').doc(uid);
        await reportRef.set({
            stats,
            aiSummary,
            generatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        res.status(200).json({ message: "Analytics report generated successfully." });
    } catch (error) {
        console.error("Error generating AI analytics summary:", error);
        res.status(500).json({ error: error.message || "Failed to generate AI summary." });
    }
});

// --- AI ASSIGNMENT GENERATOR ENDPOINT ---
app.post('/generate-assignment', [checkAuth, checkTeacherOrAdmin], async (req, res) => {
    try {
        const { topic, assignmentType, totalMarks, customRubric } = req.body;
        if (!topic) return res.status(400).json({ error: 'Topic is required.' });

        const customRubricString = (customRubric || [])
            .filter(r => r.criterion && r.points)
            .map(r => `- ${r.criterion} (${r.points} points)`)
            .join('\n');

        const systemPrompt = `You are an expert educator creating assignments. You MUST follow these rules:
1. ONLY create content about the specified topic.
2. NEVER create content about unrelated subjects.
3. Stay strictly within the academic domain of the topic.`;

        const userPrompt = `Create an assignment with these specifications:
TOPIC: ${topic}
ASSIGNMENT TYPE: ${assignmentType || 'General Assignment'}
TOTAL MARKS: ${totalMarks || 10}
${customRubricString ? `CUSTOM RUBRIC:\n${customRubricString}` : ''}
REQUIREMENTS:
- Question must be about: ${topic}
- Model answer must be about: ${topic}
- Rubric must be relevant to: ${topic}
Respond with ONLY a JSON object in this format:
{"question": "Your assignment question about ${topic}","rubric": [{"criterion": "string", "points": number}],"modelAnswer": "Your model answer about ${topic}"}`;

        const prompt = { contents: [{ role: "user", parts: [{ text: systemPrompt + "\n\n" + userPrompt }] }] };
        const parsedContent = await callGenerativeAI(prompt, true); // Expecting JSON

        // Your fallback logic remains the same
        res.status(200).json(parsedContent);
    } catch (error) {
        console.error("Error in assignment generator endpoint:", error);
        res.status(500).json({ error: error.message || "Failed to generate assignment." });
    }
});

// --- CHAT ENDPOINT ---
app.post('/chat', checkAuth, async (req, res) => {
    try {
        const { submissionId, message, isRagMode } = req.body;
        if (!submissionId || !message) {
            return res.status(400).json({ error: "Submission ID and message are required." });
        }

        const submissionDoc = await db.collection('submissions').doc(submissionId).get();
        if (!submissionDoc.exists) return res.status(404).json({ error: "Submission not found." });
        
        const submissionData = submissionDoc.data();
        let promptText = '';

        if (isRagMode) {
            if (submissionData.extractedText) {
                promptText = `IMPORTANT: You are an expert assistant. Your task is to answer the user's question based *only* on the provided document context. Do not use any external knowledge. If the answer cannot be found in the context, you must respond with 'I'm sorry, but I cannot answer that question based on the provided document.'\n\n--- DOCUMENT CONTEXT ---\n${submissionData.extractedText}\n--- END OF CONTEXT ---\n\nUser's Question: ${message}`;
            } else {
                return res.status(400).json({ error: "RAG mode is only available for text-based submissions." });
            }
        } else {
            promptText = `You are a helpful AI assistant. Please answer the user's question: ${message}`;
        }

        const prompt = { contents: [{ role: "user", parts: [{ text: promptText }] }] };
        const aiResponse = await callGenerativeAI(prompt, false); // Expecting text

        res.status(200).json({ response: aiResponse });
    } catch (error) {
        console.error("Error in chat endpoint:", error);
        res.status(500).json({ error: error.message || "Failed to get a response from the AI." });
    }
});


// --- ERROR HANDLING MIDDLEWARE ---
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err.stack);
    res.status(500).json({ error: 'Internal server error.' });
});

// --- 404 HANDLER ---
app.all('*', (req, res) => {
    res.status(404).json({ error: `Endpoint not found: ${req.method} ${req.path}` });
});

// --- Start server only if this file is run directly ---
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
        console.log(`📊 Health check available at http://localhost:${PORT}/health`);
        console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
}

// --- Export the app for testing ---
module.exports = app;
