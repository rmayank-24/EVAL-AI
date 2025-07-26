# AI Homework Evaluator - API Documentation

## Base URL
```
http://localhost:8000
```

## Authentication
All endpoints (except `/health`) require authentication. Include the Firebase ID token in the Authorization header:

```
Authorization: Bearer <firebase_id_token>
```

## Response Format
All responses are in JSON format. Success responses typically include the requested data, while error responses include an `error` field with a description.

## Endpoints

### Health Check

#### GET /health
Check server status and version.

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "6.0.0"
}
```

### User Management

#### POST /users
Setup a new user in the system. Automatically assigns role based on whether they're the first user.

**Headers:**
```
Authorization: Bearer <firebase_id_token>
```

**Response:**
```json
{
  "message": "User setup complete. Role: admin",
  "role": "admin"
}
```

#### GET /users
Get all users (Admin only).

**Headers:**
```
Authorization: Bearer <firebase_id_token>
```

**Response:**
```json
[
  {
    "uid": "user123",
    "email": "user@example.com",
    "role": "student",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

#### POST /users/set-role
Change a user's role (Admin only).

**Headers:**
```
Authorization: Bearer <firebase_id_token>
Content-Type: application/json
```

**Body:**
```json
{
  "targetUid": "user123",
  "newRole": "teacher"
}
```

**Response:**
```json
{
  "message": "Successfully set role for user123 to teacher"
}
```

### Subject Management

#### POST /subjects
Create a new subject (Teacher/Admin only).

**Headers:**
```
Authorization: Bearer <firebase_id_token>
Content-Type: application/json
```

**Body:**
```json
{
  "name": "Mathematics",
  "description": "Advanced mathematics course",
  "teacherUid": "teacher123"
}
```

**Response:**
```json
{
  "id": "subject123",
  "name": "Mathematics",
  "description": "Advanced mathematics course",
  "teacherUid": "teacher123",
  "teacherEmail": "teacher@example.com",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### GET /subjects
Get all subjects.

**Headers:**
```
Authorization: Bearer <firebase_id_token>
```

**Response:**
```json
[
  {
    "id": "subject123",
    "name": "Mathematics",
    "description": "Advanced mathematics course",
    "teacherUid": "teacher123",
    "teacherEmail": "teacher@example.com",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

#### PUT /subjects/:id
Update a subject (Teacher/Admin only).

**Headers:**
```
Authorization: Bearer <firebase_id_token>
Content-Type: application/json
```

**Body:**
```json
{
  "name": "Advanced Mathematics",
  "description": "Updated description"
}
```

**Response:**
```json
{
  "message": "Subject updated successfully."
}
```

#### DELETE /subjects/:id
Delete a subject and all related data (Admin only).

**Headers:**
```
Authorization: Bearer <firebase_id_token>
```

**Response:**
```json
{
  "message": "Subject and all related items deleted."
}
```

### Assignment Management

#### POST /assignments
Create a new assignment (Teacher/Admin only).

**Headers:**
```
Authorization: Bearer <firebase_id_token>
Content-Type: application/json
```

**Body:**
```json
{
  "title": "Calculus Problem Set",
  "description": "Solve the following calculus problems",
  "subjectId": "subject123",
  "rubric": [
    {
      "criterion": "Correct solution",
      "points": 5
    },
    {
      "criterion": "Clear explanation",
      "points": 3
    }
  ],
  "showDetailsToStudent": false
}
```

**Response:**
```json
{
  "id": "assignment123",
  "title": "Calculus Problem Set",
  "description": "Solve the following calculus problems",
  "subjectId": "subject123",
  "rubric": [
    {
      "criterion": "Correct solution",
      "points": 5
    },
    {
      "criterion": "Clear explanation",
      "points": 3
    }
  ],
  "teacherUid": "teacher123",
  "showDetailsToStudent": false,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### GET /assignments/subject/:subjectId
Get all assignments for a subject.

**Headers:**
```
Authorization: Bearer <firebase_id_token>
```

**Response:**
```json
[
  {
    "id": "assignment123",
    "title": "Calculus Problem Set",
    "description": "Solve the following calculus problems",
    "subjectId": "subject123",
    "rubric": [
      {
        "criterion": "Correct solution",
        "points": 5
      }
    ],
    "teacherUid": "teacher123",
    "showDetailsToStudent": false,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

#### GET /assignments/:id
Get a specific assignment.

**Headers:**
```
Authorization: Bearer <firebase_id_token>
```

**Response:**
```json
{
  "id": "assignment123",
  "title": "Calculus Problem Set",
  "description": "Solve the following calculus problems",
  "subjectId": "subject123",
  "rubric": [
    {
      "criterion": "Correct solution",
      "points": 5
    }
  ],
  "teacherUid": "teacher123",
  "showDetailsToStudent": false,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### PUT /assignments/:id
Update an assignment (Teacher/Admin only).

**Headers:**
```
Authorization: Bearer <firebase_id_token>
Content-Type: application/json
```

**Body:**
```json
{
  "title": "Updated Calculus Problem Set",
  "description": "Updated description",
  "rubric": [
    {
      "criterion": "Correct solution",
      "points": 6
    }
  ],
  "showDetailsToStudent": true
}
```

**Response:**
```json
{
  "message": "Assignment updated successfully."
}
```

#### PUT /assignments/:id/visibility
Toggle assignment visibility for students (Teacher/Admin only).

**Headers:**
```
Authorization: Bearer <firebase_id_token>
Content-Type: application/json
```

**Body:**
```json
{
  "isVisible": true
}
```

**Response:**
```json
{
  "message": "Visibility updated successfully."
}
```

#### DELETE /assignments/:id
Delete an assignment and related submissions (Teacher/Admin only).

**Headers:**
```
Authorization: Bearer <firebase_id_token>
```

**Response:**
```json
{
  "message": "Assignment and related submissions deleted."
}
```

### Submissions & Evaluation

#### POST /evaluate
Submit and evaluate work using AI.

**Headers:**
```
Authorization: Bearer <firebase_id_token>
```

**Body:** (multipart/form-data)
```
file: <file>
assignmentId: assignment123
subjectId: subject123
teacherUid: teacher123
isStrictMode: false
```

**Response:**
```json
{
  "score": "8/10",
  "evaluation": "Good work with minor errors",
  "mistakes": [
    "Incorrect formula application",
    "Missing units"
  ],
  "feedback": "Your solution shows good understanding of the concepts..."
}
```

#### GET /submissions
Get user's own submissions.

**Headers:**
```
Authorization: Bearer <firebase_id_token>
```

**Response:**
```json
[
  {
    "id": "submission123",
    "question": "Calculus Problem Set",
    "score": "8/10",
    "teacherReviewed": false,
    "date": "1/1/2024",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

#### GET /submissions/teacher
Get submissions for teacher review (Teacher/Admin only).

**Headers:**
```
Authorization: Bearer <firebase_id_token>
```

**Response:**
```json
[
  {
    "id": "submission123",
    "question": "Calculus Problem Set",
    "score": "8/10",
    "teacherReviewed": false,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "studentEmail": "student@example.com",
    "subjectName": "Mathematics",
    "subjectId": "subject123",
    "date": "1/1/2024"
  }
]
```

#### GET /submissions/:id
Get specific submission details.

**Headers:**
```
Authorization: Bearer <firebase_id_token>
```

**Response:**
```json
{
  "id": "submission123",
  "userId": "student123",
  "assignmentId": "assignment123",
  "question": "Calculus Problem Set",
  "aiFeedback": {
    "score": "8/10",
    "evaluation": "Good work with minor errors",
    "mistakes": ["Incorrect formula application"],
    "feedback": "Your solution shows good understanding..."
  },
  "mode": "General",
  "subjectId": "subject123",
  "teacherUid": "teacher123",
  "fileName": "submission.pdf",
  "fileType": "application/pdf",
  "extractedText": "Student's submission text...",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

#### PUT /submissions/:id/review
Review a submission (Teacher/Admin only).

**Headers:**
```
Authorization: Bearer <firebase_id_token>
Content-Type: application/json
```

**Body:**
```json
{
  "teacherScore": "9/10",
  "teacherFeedback": "Excellent work!",
  "showScoreToStudent": true
}
```

**Response:**
```json
{
  "id": "submission123",
  "userId": "student123",
  "teacherReviewed": true,
  "teacherScore": "9/10",
  "teacherFeedback": "Excellent work!",
  "showScoreToStudent": true,
  "teacherReviewAt": "2024-01-01T00:00:00.000Z",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### Comments

#### GET /submissions/:id/comments
Get comments for a submission.

**Headers:**
```
Authorization: Bearer <firebase_id_token>
```

**Response:**
```json
[
  {
    "id": "comment123",
    "text": "Great work on this problem!",
    "authorUid": "teacher123",
    "authorEmail": "teacher@example.com",
    "authorRole": "teacher",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

#### POST /submissions/:id/comments
Add a comment to a submission.

**Headers:**
```
Authorization: Bearer <firebase_id_token>
Content-Type: application/json
```

**Body:**
```json
{
  "text": "Great work on this problem!"
}
```

**Response:**
```json
{
  "id": "comment123",
  "text": "Great work on this problem!",
  "authorUid": "teacher123",
  "authorEmail": "teacher@example.com",
  "authorRole": "teacher",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### Notifications

#### GET /notifications
Get user notifications.

**Headers:**
```
Authorization: Bearer <firebase_id_token>
```

**Response:**
```json
[
  {
    "id": "notification123",
    "studentUid": "student123",
    "teacherEmail": "teacher@example.com",
    "submissionId": "submission123",
    "question": "Calculus Problem Set",
    "text": "Your submission has been reviewed by your teacher.",
    "type": "review",
    "isRead": false,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

#### PUT /notifications/:id/read
Mark notification as read.

**Headers:**
```
Authorization: Bearer <firebase_id_token>
```

**Response:**
```json
{
  "message": "Notification marked as read."
}
```

### Analytics

#### GET /analytics/report
Get analytics report (Teacher/Admin only).

**Headers:**
```
Authorization: Bearer <firebase_id_token>
```

**Response:**
```json
{
  "stats": {
    "totalSubmissions": 25,
    "averageScore": 85.5,
    "reviewedCount": 20
  },
  "aiSummary": "Students are performing well overall...",
  "generatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### POST /analytics/generate
Generate new analytics report (Teacher/Admin only).

**Headers:**
```
Authorization: Bearer <firebase_id_token>
```

**Response:**
```json
{
  "message": "Analytics report generated successfully."
}
```

### AI Features

#### POST /generate-assignment
Generate assignment using AI (Teacher/Admin only).

**Headers:**
```
Authorization: Bearer <firebase_id_token>
Content-Type: application/json
```

**Body:**
```json
{
  "topic": "Calculus derivatives",
  "assignmentType": "Problem Set",
  "totalMarks": 10,
  "customRubric": [
    {
      "criterion": "Correct derivative calculation",
      "points": 5
    }
  ]
}
```

**Response:**
```json
{
  "question": "Calculate the derivative of f(x) = x^2 + 3x + 1",
  "rubric": [
    {
      "criterion": "Correct derivative calculation",
      "points": 5
    },
    {
      "criterion": "Clear step-by-step solution",
      "points": 3
    },
    {
      "criterion": "Proper notation",
      "points": 2
    }
  ],
  "modelAnswer": "f'(x) = 2x + 3..."
}
```

#### POST /chat
AI chat with submission context.

**Headers:**
```
Authorization: Bearer <firebase_id_token>
Content-Type: application/json
```

**Body:**
```json
{
  "submissionId": "submission123",
  "message": "What are the main concepts in this submission?",
  "isRagMode": true
}
```

**Response:**
```json
{
  "response": "Based on the submission, the main concepts covered are..."
}
```

## Error Responses

### Common Error Codes

- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Missing or invalid authentication token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

### Error Response Format
```json
{
  "error": "Error message description"
}
```

## File Upload

### Supported File Types
- PDF documents (`application/pdf`)
- DOCX documents (`application/vnd.openxmlformats-officedocument.wordprocessingml.document`)
- Images (`image/jpeg`, `image/png`, `image/gif`)

### File Size Limit
Maximum file size: 10MB

### Upload Format
Use `multipart/form-data` for file uploads.

## Rate Limiting
The API uses Firebase's built-in rate limiting. Excessive requests may be throttled.

## CORS
The API supports CORS for the following origins:
- `http://localhost:5173` (Vite dev server)
- `http://localhost:3000` (Create React App)
- `http://localhost:4173` (Vite preview)

## Versioning
Current API version: 6.0.0

API version information is available in the `/health` endpoint response. 