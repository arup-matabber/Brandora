"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth } from "./firebase/client";
import { signInWithGoogle, signInWithEmail, signOut, UserProfile, syncUserProfile } from "./firebase/auth";
import { activeUser } from "./data";

import { safeStorage } from "./safe-storage";
import { isFirebaseConfigured } from "./data-mode";

export interface AppUser {
  uid?: string;
  name: string;
  fullName: string;
  email?: string;
  avatar?: string | null;
  role: string;
  initials: string;
  studio: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: AppUser;
  firebaseUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  login: (email?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [user, setUser] = useState<AppUser>({
    ...activeUser,
    uid: "designer-1",
    email: "subhajit@studio-opalite.design",
  });

  // Listen to Firebase Auth state if configured; otherwise use safeStorage session
  useEffect(() => {
    // 1. Instant check from safeStorage session
    const stored = safeStorage.getRaw("opalite_auth");
    if (stored === "true") {
      setIsAuthenticated(true);
    }

    if (!isFirebaseConfigured) {
      return;
    }

    try {
      const unsubscribe = onAuthStateChanged(auth, async (fUser) => {
        if (fUser) {
          setFirebaseUser(fUser);
          setIsAuthenticated(true);
          try {
            const profile = await syncUserProfile(fUser);
            setUserProfile(profile);
            const namePart = profile.fullName.split(" ")[0] || "Subhajit";
            setUser({
              ...activeUser,
              name: namePart,
              fullName: profile.fullName,
              email: profile.email,
              avatar: profile.avatarUrl || null,
              uid: fUser.uid,
            });
          } catch (e) {
            console.warn("Firestore profile sync fallback:", e);
          }
        } else {
          // Check local session fallback
          const localAuth = safeStorage.getRaw("opalite_auth");
          if (localAuth === "true") {
            setIsAuthenticated(true);
          } else {
            setFirebaseUser(null);
            setUserProfile(null);
            setIsAuthenticated(false);
          }
        }
      });

      return () => unsubscribe();
    } catch (e) {
      console.warn("Firebase Auth listener initialization error:", e);
    }
  }, []);

  const login = async (email?: string) => {
    const targetEmail = email || "subhajit.roy@studio.design";

    if (!isFirebaseConfigured) {
      // Fast, resilient local mock login
      setIsAuthenticated(true);
      if (targetEmail.includes("@")) {
        const namePart = targetEmail.split("@")[0];
        const capitalized = namePart.charAt(0).toUpperCase() + namePart.slice(1);
        setUser((prev) => ({
          ...prev,
          name: capitalized,
          fullName: `${capitalized} Roy`,
          email: targetEmail,
        }));
      }
      safeStorage.setRaw("opalite_auth", "true");
      router.push("/home");
      return;
    }

    try {
      const { user: fUser, profile } = await signInWithEmail(targetEmail);
      setFirebaseUser(fUser);
      setUserProfile(profile);
      setIsAuthenticated(true);
      safeStorage.setRaw("opalite_auth", "true");
      router.push("/home");
    } catch (e) {
      console.warn("Firebase email auth fell back to local session:", e);
      setIsAuthenticated(true);
      if (email && email.includes("@")) {
        const namePart = email.split("@")[0];
        const capitalized = namePart.charAt(0).toUpperCase() + namePart.slice(1);
        setUser((prev) => ({
          ...prev,
          name: capitalized,
          fullName: `${capitalized} Roy`,
        }));
      }
      safeStorage.setRaw("opalite_auth", "true");
      router.push("/home");
    }
  };

  const loginWithGoogle = async () => {
    if (!isFirebaseConfigured) {
      setIsAuthenticated(true);
      safeStorage.setRaw("opalite_auth", "true");
      router.push("/home");
      return;
    }

    try {
      const { user: fUser, profile } = await signInWithGoogle();
      setFirebaseUser(fUser);
      setUserProfile(profile);
      setIsAuthenticated(true);
      safeStorage.setRaw("opalite_auth", "true");
      router.push("/home");
    } catch (e) {
      console.warn("Firebase Google auth fell back to local session:", e);
      setIsAuthenticated(true);
      safeStorage.setRaw("opalite_auth", "true");
      router.push("/home");
    }
  };

  const logout = async () => {
    if (isFirebaseConfigured) {
      try {
        await signOut();
      } catch (e) {
        console.warn("Firebase sign out non-fatal:", e);
      }
    }
    setFirebaseUser(null);
    setUserProfile(null);
    setIsAuthenticated(false);
    safeStorage.remove("opalite_auth");
    router.push("/auth");
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        firebaseUser,
        userProfile,
        login,
        loginWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      isAuthenticated: true,
      user: { ...activeUser, uid: "designer-1" },
      firebaseUser: null,
      userProfile: null,
      login: async () => {},
      loginWithGoogle: async () => {},
      logout: async () => {},
    };
  }
  return context;
}

