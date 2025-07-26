# AI Homework Evaluator - Backend

## Overview
This is the enhanced backend server for the AI Homework Evaluator application, built with Express.js and Firebase. It provides a comprehensive API for managing assignments, submissions, evaluations, and analytics.

## Features

### 🔐 Authentication & Authorization
- Firebase Authentication integration
- Role-based access control (Student, Teacher, Admin)
- JWT token verification
- Custom user claims management

### 📚 Subject Management
- Create, read, update, delete subjects
- Teacher assignment to subjects
- Cascade deletion of related data

### 📝 Assignment Management
- Create assignments with custom rubrics
- AI-powered assignment generation
- Visibility controls for students
- Assignment editing and deletion

### 📄 Submission & Evaluation
- File upload support (PDF, DOCX, Images)
- AI-powered evaluation using Google Gemini
- Strict and general evaluation modes
- Teacher review and feedback system

### 💬 Communication
- Comment system on submissions
- Real-time notifications
- Teacher-student communication

### 📊 Analytics
- Performance analytics for teachers
- AI-generated insights
- Statistical reports

### 🤖 AI Features
- Assignment generation
- Document-based chat (RAG mode)
- Intelligent evaluation system

## Setup Instructions

### 1. Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Firebase project with Firestore
- Google AI API key

### 2. Installation
```bash
cd backend
npm install
```

### 3. Environment Configuration
Create a `.env` file in the backend directory:

```env
# Backend Environment Configuration
NODE_ENV=development
PORT=8000

# Google AI API Key (Required for AI features)
GOOGLE_API_KEY=your_google_api_key_here

# Firebase Service Account (Optional - will use serviceAccountKey.json if not set)
# GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"ai-homework-evaluator",...}

# CORS Origins (comma-separated)
CORS_ORIGINS=http://localhost:5173,http://localhost:3000,http://localhost:4173

# File Upload Limits
MAX_FILE_SIZE=10485760
```

### 4. Firebase Setup
1. Create a Firebase project
2. Enable Authentication and Firestore
3. Download your service account key and save it as `serviceAccountKey.json`
4. Configure Authentication providers (Email/Password)

### 5. Google AI Setup
1. Get a Google AI API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Add the API key to your `.env` file

### 6. Running the Server
```bash
# Development
npm start

# Production
NODE_ENV=production npm start
```

## API Endpoints

### Health Check
- `GET /health` - Server health status

### User Management
- `POST /users` - Setup new user
- `GET /users` - List all users (Admin only)
- `POST /users/set-role` - Change user role (Admin only)

### Subject Management
- `POST /subjects` - Create subject
- `GET /subjects` - List subjects
- `PUT /subjects/:id` - Update subject
- `DELETE /subjects/:id` - Delete subject (Admin only)

### Assignment Management
- `POST /assignments` - Create assignment
- `GET /assignments/subject/:subjectId` - Get assignments by subject
- `GET /assignments/:id` - Get specific assignment
- `PUT /assignments/:id` - Update assignment
- `PUT /assignments/:id/visibility` - Toggle assignment visibility
- `DELETE /assignments/:id` - Delete assignment

### Submissions & Evaluation
- `POST /evaluate` - Submit and evaluate work
- `GET /submissions` - Get user submissions
- `GET /submissions/teacher` - Get teacher's submissions
- `GET /submissions/:id` - Get specific submission
- `PUT /submissions/:id/review` - Review submission

### Comments
- `GET /submissions/:id/comments` - Get submission comments
- `POST /submissions/:id/comments` - Add comment

### Notifications
- `GET /notifications` - Get user notifications
- `PUT /notifications/:id/read` - Mark notification as read

### Analytics
- `GET /analytics/report` - Get analytics report
- `POST /analytics/generate` - Generate new report

### AI Features
- `POST /generate-assignment` - Generate assignment with AI
- `POST /chat` - AI chat with submission context

## Authentication

All endpoints (except `/health`) require authentication. Include the Firebase ID token in the Authorization header:

```
Authorization: Bearer <firebase_id_token>
```

## Error Handling

The API returns consistent error responses:

```json
{
  "error": "Error message description"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## File Upload

Supported file types:
- PDF documents
- DOCX documents
- Images (JPEG, PNG, GIF)

Maximum file size: 10MB

## Security Features

- CORS protection
- Input validation and sanitization
- Role-based access control
- File type validation
- Rate limiting (via Firebase)
- Secure token handling

## Development

### Project Structure
```
backend/
├── server.js          # Main server file
├── package.json       # Dependencies
├── serviceAccountKey.json  # Firebase service account
├── .env              # Environment variables
└── README.md         # This file
```

### Dependencies
- `express` - Web framework
- `firebase-admin` - Firebase SDK
- `@google/generative-ai` - Google AI SDK
- `multer` - File upload handling
- `pdf-parse` - PDF text extraction
- `mammoth` - DOCX text extraction
- `cors` - CORS middleware

## Troubleshooting

### Common Issues

1. **Firebase initialization error**
   - Check service account key format
   - Verify Firebase project configuration

2. **Google AI API errors**
   - Verify API key is valid
   - Check API quota limits

3. **CORS errors**
   - Update CORS origins in `.env`
   - Check frontend URL configuration

4. **File upload issues**
   - Verify file type is supported
   - Check file size limits

### Logs
The server provides detailed logging for debugging. Check the console output for error messages and request logs.

## Support

For issues and questions, please check the project documentation or create an issue in the repository. 