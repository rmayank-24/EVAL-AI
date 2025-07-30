// contexts/AuthContext.tsx
import { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  UserCredential
} from 'firebase/auth';
import { auth } from '../firebase';
import apiService from '../services/api';

// Define the shape of the authenticated user
interface User {
  uid: string;
  email: string | null;
  accessToken: string;
}

// Define the shape of the AuthContext - THIS IS THE CENTRAL DEFINITION
export interface AuthContextType {
  user: User | null;
  signup: (email: string, password: string) => Promise<UserCredential>;
  login: (email: string, password: string) => Promise<UserCredential>; // Corrected return type
  logout: () => Promise<void>;
  loading: boolean;
  role: string | null;
}


// Create the context
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();
          const tokenResult = await firebaseUser.getIdTokenResult();
          const userRole = (tokenResult.claims.role as string) || 'student';

          const userData: User = {
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

  const login = async (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const signup = async (email: string, password: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password); // Fixed typo
    try {
      const token = await userCredential.user.getIdToken();
      await apiService.setupUser(token);
    } catch (error) {
      console.error('Error setting up user in backend:', error);
      await userCredential.user.delete();
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

  const value: AuthContextType = {
    user,
    role,
    loading,
    login,
    signup,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};