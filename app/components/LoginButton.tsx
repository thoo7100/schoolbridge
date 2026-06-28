"use client";

import { auth } from "../lib/firebase";
import useAuth from "../hooks/useAuth";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "firebase/auth";

export default function LoginButton() {
  const user = useAuth();

  const login = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      if (error.code === "auth/cancelled-popup-request") {
        // user closed popup → ignore silently
        return;
      }
  
      console.error("Login error:", error);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <div style={{ marginBottom: 20 }}>
      {!user ? (
        <button onClick={login} style={{ padding: 10 }}>
          🔐 Login with Google
        </button>
      ) : (
        <div>
          <p>👤 {user.displayName}</p>
          <button onClick={logout} style={{ padding: 5 }}>
            Logout
          </button>
        </div>
      )}
    </div>
  );
}