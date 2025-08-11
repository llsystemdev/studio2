
"use client";

import React, { useState, useEffect, useContext, createContext, useCallback } from 'react';
import {
    onAuthStateChanged,
    sendPasswordResetEmail,
    signOut,
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    OAuthProvider,
    type User,
} from 'firebase/auth';
import { doc, onSnapshot, addDoc, collection, setDoc } from 'firebase/firestore';
import type { UserProfile, UserRole, ActivityLog } from '@/lib/types';
import { auth, db, storage } from '@/lib/firebase/client'; 
import type { Firestore } from 'firebase/firestore';
import type { FirebaseStorage } from "firebase/storage";
import type { Auth } from 'firebase/auth';
import { useRouter, usePathname } from 'next/navigation';

interface PostAuthAction {
    callback: (user: User) => void;
    redirectUrl: string;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  role: UserRole | null;
  db: Firestore;
  storage: FirebaseStorage;
  auth: Auth;
  login: (email: string, pass: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  logout: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  logActivity: (action: ActivityLog['action'], entityType: ActivityLog['entityType'], entityId: string, details: string) => Promise<void>;
  setPostAuthAction: (action: PostAuthAction | null) => void;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    userProfile: null,
    loading: true,
    role: null,
    db: db,
    storage: storage,
    auth: auth,
    login: async () => {},
    signInWithGoogle: async () => {},
    signInWithApple: async () => {},
    logout: async () => {},
    sendPasswordReset: async () => {},
    logActivity: async () => {},
    setPostAuthAction: () => {},
});


export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [postAuthAction, setPostAuthAction] = useState<PostAuthAction | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  const logActivity = useCallback(async (action: ActivityLog['action'], entityType: ActivityLog['entityType'], entityId: string, details: string) => {
    if (!userProfile || userProfile.role === 'Client') return; // Only log for staff
    try {
        await addDoc(collection(db, 'activityLogs'), {
            timestamp: new Date().toISOString(),
            user: userProfile.name,
            action,
            entityType,
            entityId,
            details,
        });
    } catch (error) {
        console.error("Error logging activity:", error);
    }
  }, [userProfile]);
  
  const createSessionCookie = async (user: User) => {
    const idToken = await user.getIdToken(true);
    const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Server-side session creation failed.' }));
        throw new Error(errorData.error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      setLoading(true);
      if (authUser) {
        await createSessionCookie(authUser);
        setUser(authUser);
        
        // Execute post-auth action if it exists and we're on the right page
        if (postAuthAction && postAuthAction.redirectUrl === pathname) {
            postAuthAction.callback(authUser);
            setPostAuthAction(null); // Clear the action after execution
        }
        
        const userDocRef = doc(db, 'users', authUser.uid);
        const unsubscribeSnapshot = onSnapshot(userDocRef, (userDocSnap) => {
            if (userDocSnap.exists()) {
              const profileData = { id: userDocSnap.id, ...userDocSnap.data() } as UserProfile;
              setUserProfile(profileData);
              const roleFromDb = profileData.role;
              setRole(roleFromDb);
            } else {
              // This is a client user if they exist in Auth but not in the 'users' collection
              const clientProfile: UserProfile = {
                  id: authUser.uid,
                  name: authUser.displayName || 'Nuevo Cliente',
                  email: authUser.email || '',
                  role: 'Client',
              };
              setUserProfile(clientProfile);
              setRole('Client');
              // Create a customer document if it doesn't exist
              const customerDocRef = doc(db, 'customers', authUser.uid);
              setDoc(customerDocRef, {
                  name: authUser.displayName,
                  email: authUser.email,
                  id: authUser.uid,
                  createdAt: new Date().toISOString()
              }, { merge: true });
            }
            setLoading(false);
        }, (error) => {
            console.error("Firestore snapshot error on user doc:", error);
            setUserProfile(null);
            setRole(null);
            setLoading(false);
        });
         return () => unsubscribeSnapshot();
      } else {
        setUser(null);
        setUserProfile(null);
        setRole(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [postAuthAction, pathname]);
  

  const handleLogin = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const handleSocialLogin = async (provider: 'google' | 'apple') => {
      const authProvider = provider === 'google' 
          ? new GoogleAuthProvider() 
          : new OAuthProvider('apple.com');
      await signInWithPopup(auth, authProvider);
  };
  
  const handleLogout = async () => {
    if (user && userProfile && userProfile.role !== 'Client') {
        await logActivity('Logout', 'Auth', user.uid, `User ${userProfile.name} logged out.`);
    }
    await signOut(auth);
    await fetch('/api/auth', { method: 'DELETE' });
    
    setUser(null);
    setUserProfile(null);
    setRole(null);
    
    router.push('/');
  };

  const handlePasswordReset = (email: string) => {
    return sendPasswordResetEmail(auth, email);
  };
  
  return (
    <AuthContext.Provider value={{
        loading,
        user,
        userProfile,
        role,
        login: handleLogin,
        signInWithGoogle: () => handleSocialLogin('google'),
        signInWithApple: () => handleSocialLogin('apple'),
        logout: handleLogout,
        sendPasswordReset: handlePasswordReset,
        logActivity,
        setPostAuthAction,
        db,
        storage,
        auth,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
