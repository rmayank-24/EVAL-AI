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

  const signup = async (email, password) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    // Setup user in backend
    try {
      await apiService.setupUser();
    } catch (error) {
      console.error('Error setting up user in backend:', error);
    }
    return result;
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