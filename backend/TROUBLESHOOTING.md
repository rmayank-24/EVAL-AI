# Troubleshooting Guide

## Issue 1: AI Assignment Generator Creating Off-Topic Content

### Problem
The AI generates content about social media, politics, or other unrelated topics instead of the requested topic (e.g., "vector sum").

### Debugging Steps

1. **Check Google AI API Key**
   ```bash
   cd backend
   node test-ai.js
   ```
   This will test if your API key is working and show the AI's response.

2. **Check Backend Logs**
   - Start the backend server: `npm start`
   - Try generating an assignment
   - Check the console for debug logs showing:
     - The request parameters
     - The prompt sent to AI
     - The AI's response
     - Topic validation results

3. **Verify Environment Variables**
   Make sure your `.env` file contains:
   ```env
   GOOGLE_API_KEY=your_actual_api_key_here
   ```

4. **Test with Different Topics**
   Try these test cases:
   - Topic: "vector sum" → Should generate physics/math content
   - Topic: "Shakespeare's Hamlet" → Should generate literature content
   - Topic: "photosynthesis" → Should generate biology content

### Solutions Implemented

1. **Enhanced Prompt Structure**
   - Uses system and user prompts separately
   - Multiple explicit reminders about topic focus
   - Domain-specific instructions

2. **Content Validation**
   - Checks if generated content contains the topic keywords
   - Provides fallback content if AI generates off-topic content

3. **Fallback Mechanism**
   - If AI generates off-topic content, provides a template assignment
   - Ensures users always get something relevant to their topic

## Issue 2: Teachers Seeing All Subjects Instead of Only Assigned Ones

### Problem
Teachers can see all subjects in the system instead of only subjects they're assigned to.

### Debugging Steps

1. **Check User Role**
   - Verify the teacher's role is set to "teacher" in Firebase
   - Check if the user has the correct custom claims

2. **Test Subject Filtering**
   ```bash
   # Use the debug endpoint (requires authentication)
   GET /debug/subjects
   ```
   This will show:
   - User's role and ID
   - Number of subjects found
   - All subjects (with filtering applied)

3. **Check Database**
   - Verify subjects have the correct `teacherUid` field
   - Ensure the teacher's UID matches the `teacherUid` in subjects

4. **Test with Different Users**
   - Log in as admin → Should see all subjects
   - Log in as teacher → Should see only assigned subjects
   - Log in as student → Should see all subjects

### Solutions Implemented

1. **Role-Based Filtering**
   ```javascript
   if (role === 'teacher') {
       query = query.where('teacherUid', '==', uid);
   }
   ```

2. **Debug Endpoint**
   - `/debug/subjects` provides detailed information about filtering
   - Shows user role, ID, and subject count

## Common Issues and Solutions

### API Key Issues
```bash
# Error: GOOGLE_API_KEY environment variable is not set!
```
**Solution:** Add your Google AI API key to the `.env` file

### Firebase Authentication Issues
```bash
# Error: Invalid or expired token
```
**Solution:** 
- Make sure you're logged in via Firebase Auth
- Check if the token is being sent in the Authorization header
- Verify the Firebase project configuration

### CORS Issues
```bash
# Error: CORS policy blocked
```
**Solution:** 
- Backend CORS is configured for localhost:5173, 3000, 4173
- If using a different port, update the CORS configuration

### Database Connection Issues
```bash
# Error: Firebase Admin initialization failed
```
**Solution:**
- Check if `serviceAccountKey.json` exists and is valid
- Verify the Firebase project ID matches

## Testing Checklist

### AI Assignment Generator
- [ ] API key is set in `.env`
- [ ] Backend server is running
- [ ] Try generating with topic "vector sum"
- [ ] Check console logs for debug information
- [ ] Verify generated content is about the topic

### Subject Filtering
- [ ] User role is correctly set
- [ ] Subjects have correct `teacherUid`
- [ ] Test with different user roles
- [ ] Use debug endpoint to verify filtering

## Getting Help

If issues persist:

1. **Check the backend console logs** for detailed error messages
2. **Run the test script** to isolate AI issues: `node test-ai.js`
3. **Use the debug endpoint** to check subject filtering: `GET /debug/subjects`
4. **Verify all environment variables** are set correctly
5. **Check Firebase project configuration** and service account key

## Environment Variables Checklist

Make sure your `.env` file contains:
```env
NODE_ENV=development
PORT=8000
GOOGLE_API_KEY=your_google_ai_api_key_here
CORS_ORIGINS=http://localhost:5173,http://localhost:3000,http://localhost:4173
MAX_FILE_SIZE=10485760
``` 