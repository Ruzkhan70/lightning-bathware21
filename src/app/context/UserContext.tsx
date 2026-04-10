import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { 
  auth, 
  db 
} from "../../firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser
} from "firebase/auth";
import { doc, setDoc, getDoc, query, where, collection, getDocs, updateDoc, getDocs as firestoreGetDocs } from "firebase/firestore";
import { toast } from "sonner";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
}

interface UserContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (
    name: string,
    email: string,
    phone: string,
    address: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  const fetchUserProfile = useCallback(async (uid: string): Promise<User | null> => {
    try {
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        return {
          id: uid,
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          address: data.address || "",
        };
      }
      return null;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
  }, []);

  const syncUserData = useCallback(async (fbUser: FirebaseUser) => {
    try {
      const userDoc = await getDoc(doc(db, "users", fbUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUser({
          id: fbUser.uid,
          name: data.name || fbUser.displayName || "",
          email: fbUser.email || "",
          phone: data.phone || "",
          address: data.address || "",
        });
      } else if (fbUser.email) {
        const newUser: Omit<User, "id"> = {
          name: fbUser.displayName || "",
          email: fbUser.email,
          phone: "",
          address: "",
        };
        await setDoc(doc(db, "users", fbUser.uid), newUser);
        setUser({ id: fbUser.uid, ...newUser });
      }
    } catch (error) {
      console.error("Error syncing user data:", error);
    }
  }, []);

  const checkIfUserIsAdmin = useCallback(async (fbUser: FirebaseUser): Promise<boolean> => {
    try {
      const adminQuery = query(collection(db, "admins"), where("email", "==", fbUser.email));
      const adminDocs = await getDocs(adminQuery);
      return !adminDocs.empty;
    } catch (error) {
      console.error("Error checking admin status:", error);
      return false;
    }
  }, []);

  useEffect(() => {
    if (isInitialized) return;
    
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      
      if (fbUser) {
        const isAdmin = await checkIfUserIsAdmin(fbUser);
        if (!isAdmin) {
          await syncUserData(fbUser);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
      
      setIsLoading(false);
      setIsInitialized(true);
    });

    return () => unsubscribe();
  }, [isInitialized, syncUserData, checkIfUserIsAdmin]);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!email?.trim() || !password?.trim()) {
        return { success: false, error: "Email and password are required" };
      }

      const result = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      
      if (result.user) {
        // Show toast IMMEDIATELY, then sync data in background
        console.log("🔔 TOAST DEBUG: Login success, showing welcome toast");
        toast.success("Welcome back!");
        console.log("🔔 TOAST DEBUG: Toast.success() called");
        // Sync data after showing toast (doesn't block the toast)
        syncUserData(result.user);
        return { success: true };
      }
      
      return { success: false, error: "Login failed" };
    } catch (error: any) {
      console.error("Login error:", error);
      
      let errorMessage = "Login failed. Please check your credentials.";
      
      if (error.code === "auth/user-not-found") {
        errorMessage = "No account found with this email";
      } else if (error.code === "auth/wrong-password") {
        errorMessage = "Incorrect password";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email address";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Too many failed attempts. Please try again later.";
      } else if (error.code === "auth/invalid-credential") {
        errorMessage = "Invalid email or password";
      }
      
      return { success: false, error: errorMessage };
    }
  };

  const register = async (
    name: string,
    email: string,
    phone: string,
    address: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!name?.trim() || !email?.trim() || !phone?.trim() || !address?.trim() || !password?.trim()) {
        return { success: false, error: "All fields are required" };
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return { success: false, error: "Invalid email format" };
      }

      const existingQuery = query(collection(db, "users"), where("email", "==", email.toLowerCase()));
      const existingDocs = await getDocs(existingQuery);
      if (!existingDocs.empty) {
        return { success: false, error: "An account with this email already exists" };
      }

      const result = await createUserWithEmailAndPassword(auth, email.toLowerCase().trim(), password);
      
      if (result.user) {
        await updateProfile(result.user, { displayName: name.trim() });
        
        const newUser = {
          name: name.trim(),
          email: email.toLowerCase().trim(),
          phone: phone.trim(),
          address: address.trim(),
          createdAt: new Date().toISOString(),
        };
        
        await setDoc(doc(db, "users", result.user.uid), newUser);
        
        setUser({ id: result.user.uid, ...newUser });
        toast.success("Account created successfully!");
        return { success: true };
      }
      
      return { success: false, error: "Registration failed" };
    } catch (error: any) {
      console.error("Registration error:", error);
      
      let errorMessage = "Registration failed. Please try again.";
      
      if (error.code === "auth/email-already-in-use") {
        errorMessage = "An account with this email already exists";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Password should be at least 6 characters";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email address";
      }
      
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (user) {
      try {
        const userRef = doc(db, "users", user.id);
        await updateDoc(userRef, updates);
        
        setUser({ ...user, ...updates });
        toast.success("Profile updated!");
      } catch (error) {
        console.error("Update profile error:", error);
        toast.error("Failed to update profile");
      }
    } else {
      toast.error("User not logged in");
    }
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { sendPasswordResetEmail } = await import("firebase/auth");
      await sendPasswordResetEmail(auth, email);
      toast.success("Password reset email sent!");
      return { success: true };
    } catch (error: any) {
      console.error("Reset password error:", error);
      
      let errorMessage = "Failed to send reset email.";
      
      if (error.code === "auth/user-not-found") {
        errorMessage = "No account found with this email";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email address";
      }
      
      return { success: false, error: errorMessage };
    }
  };

  return (
    <UserContext.Provider
      value={{
        user,
        firebaseUser,
        isLoggedIn: !!user,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
        resetPassword,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within UserProvider");
  }
  return context;
}
