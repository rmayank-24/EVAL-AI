const request = require('supertest');
const app = require('../server'); // Correct path to your exported Express app
const admin = require('firebase-admin');

// Define a mock for the firestore 'doc' function so we can configure it in tests
const mockDoc = jest.fn();

// Mock the entire 'firebase-admin' package
jest.mock('firebase-admin', () => {
    // Mock functions for auth
    const mockAuth = {
        verifyIdToken: jest.fn(),
        listUsers: jest.fn(),
        setCustomUserClaims: jest.fn(), // Added for other potential tests
    };

    // Mock functions for firestore, using the mockDoc defined above
    const mockFirestore = {
        collection: jest.fn(() => ({
            doc: mockDoc,
        })),
    };

    // The main mock object that Jest will use
    return {
        // We need to initializeApp, but it can be a dummy function for tests
        initializeApp: jest.fn(),
        // Return the mock objects when auth() or firestore() are called
        auth: () => mockAuth,
        firestore: () => mockFirestore,
        // Add a dummy credential object to prevent crash on server import
        credential: {
            cert: jest.fn(),
        },
    };
});

// Main test suite for User API Endpoints
describe('User API Endpoints', () => {
    // This block runs before each test in this file
    beforeEach(() => {
        // Reset all mock function calls before each test
        jest.clearAllMocks();
        mockDoc.mockClear(); // Also clear the doc mock
    });

    /**
     * Test suite for GET /users
     */
    describe('GET /users', () => {
        it('should return 401 Unauthorized if no token is provided', async () => {
            const response = await request(app).get('/users');
            expect(response.statusCode).toBe(401);
            expect(response.body.error).toBe('Unauthorized. No token provided.');
        });

        it('should return 403 Forbidden if the user is not an admin', async () => {
            // Simulate a valid token for a non-admin user
            admin.auth().verifyIdToken.mockResolvedValue({ uid: 'test-student-uid', role: 'student' });

            const response = await request(app)
                .get('/users')
                .set('Authorization', 'Bearer fake-student-token');

            expect(response.statusCode).toBe(403);
            expect(response.body.error).toBe('Forbidden: Requires admin role.');
        });

        it('should return 200 OK and a list of users if the user is an admin', async () => {
            // Simulate a valid token for an admin user
            admin.auth().verifyIdToken.mockResolvedValue({ uid: 'test-admin-uid', role: 'admin' });

            // Simulate the data that would be returned from Firebase Auth and Firestore
            const mockUsersFromAuth = {
                users: [
                    { uid: 'user1', email: 'user1@example.com' },
                    { uid: 'user2', email: 'user2@example.com' },
                ],
            };
            const mockUser1FromFirestore = {
                exists: true,
                data: () => ({ role: 'student', createdAt: { toDate: () => new Date() } }),
            };
            const mockUser2FromFirestore = {
                exists: true,
                data: () => ({ role: 'teacher', createdAt: { toDate: () => new Date() } }),
            };

            // Set up the mock return values for the functions called in the endpoint
            admin.auth().listUsers.mockResolvedValue(mockUsersFromAuth);
            
            // Configure the mockDoc to return the correct user data based on the ID
            mockDoc.mockImplementation(docId => {
                if (docId === 'user1') {
                    return { get: jest.fn().mockResolvedValue(mockUser1FromFirestore) };
                }
                if (docId === 'user2') {
                    return { get: jest.fn().mockResolvedValue(mockUser2FromFirestore) };
                }
                return { get: jest.fn().mockResolvedValue({ exists: false }) }; // Default case
            });

            const response = await request(app)
                .get('/users')
                .set('Authorization', 'Bearer fake-admin-token');

            expect(response.statusCode).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(2);
            expect(response.body[0]).toHaveProperty('uid', 'user1');
            expect(response.body[0]).toHaveProperty('role', 'student');
            expect(response.body[1]).toHaveProperty('uid', 'user2');
            expect(response.body[1]).toHaveProperty('role', 'teacher');
        });

        it('should return 500 if there is a server error', async () => {
            // Simulate an admin user
            admin.auth().verifyIdToken.mockResolvedValue({ uid: 'test-admin-uid', role: 'admin' });

            // Simulate an error when calling listUsers
            const errorMessage = 'Failed to list users.';
            admin.auth().listUsers.mockRejectedValue(new Error(errorMessage));

            const response = await request(app)
                .get('/users')
                .set('Authorization', 'Bearer fake-admin-token');

            expect(response.statusCode).toBe(500);
            expect(response.body.error).toBe(errorMessage);
        });
    });

    // You can add more 'describe' blocks here for other user endpoints like POST /users/set-role
});
