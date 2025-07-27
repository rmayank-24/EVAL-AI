import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { auth } from '../firebase';
import apiService from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();
          const tokenResult = await firebaseUser.getIdTokenResult();
          const userRole = tokenResult.claims.role || 'student';
          
          const userData = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            accessToken: token,
          };
          
          setUser(userData);
          setRole(userRole);
          localStorage.setItem('user', JSON.stringify(userData));
        } catch (error) {
          console.error('Error getting user token:', error);
          setUser(null);
          setRole(null);
          localStorage.removeItem('user');
        }
      } else {
        setUser(null);
        setRole(null);
        localStorage.removeItem('user');
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result;
  };

  // --- THIS IS THE CORRECTED SIGNUP FUNCTION ---
  const signup = async (email, password) => {
    // 1. Create the user in Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);

    try {
      // 2. Immediately get the ID token from the newly created user object
      const token = await userCredential.user.getIdToken();

      // 3. Call the backend setup and pass the token directly.
      //    You will need to update your apiService.setupUser function for this.
      await apiService.setupUser(token);

    } catch (error) {
      console.error('Error setting up user in backend:', error);
      
      // IMPORTANT (but optional): If the backend setup fails, it's good practice
      // to delete the user from Firebase Auth to prevent an "orphaned" account
      // that exists in Auth but not in your database.
      await userCredential.user.delete();

      // Rethrow the error so your UI can catch it and show a message to the user.
      throw new Error('Failed to create user profile. Please try again.');
    }

    return userCredential;
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setRole(null);
    localStorage.removeItem('user');
  };

  const value = {
    user,
    role,
    login,
    signup,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
