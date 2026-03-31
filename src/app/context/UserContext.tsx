import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { db } from "../../firebase";
import { collection, addDoc, updateDoc, doc, getDocs, query, where } from "firebase/firestore";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
}

interface UserContextType {
  user: User | null;
  isLoggedIn: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; shouldSyncCart?: boolean }>;
  register: (
    name: string,
    email: string,
    phone: string,
    address: string,
    password: string
  ) => Promise<boolean>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  resetPassword: (email: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
}

interface UserContextType {
  user: User | null;
  isLoggedIn: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (
    name: string,
    email: string,
    phone: string,
    address: string,
    password: string
  ) => Promise<boolean>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  resetPassword: (email: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);



  const login = async (email: string, password: string): Promise<{ success: boolean; shouldSyncCart?: boolean }> => {
    try {
      if (!email?.trim() || !password?.trim()) {
        return { success: false };
      }

      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", email.toLowerCase().trim()), where("password", "==", password));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        const loggedInUser: User = {
          id: userData.id || querySnapshot.docs[0].id,
          name: userData.name || "User",
          email: userData.email || email,
          phone: userData.phone || "",
          address: userData.address || "",
        };

        const hasExistingCart = userData.hasCart || false;
        
        setUser(loggedInUser);
        localStorage.setItem("currentUser", JSON.stringify(loggedInUser));
        
        return { success: true, shouldSyncCart: hasExistingCart };
      }
      return { success: false };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false };
    }
  };

  const register = async (
    name: string,
    email: string,
    phone: string,
    address: string,
    password: string
  ): Promise<boolean> => {
    try {
      // Validate required fields
      if (!name?.trim() || !email?.trim() || !phone?.trim() || !address?.trim() || !password?.trim()) {
        console.error("All fields are required");
        return false;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        console.error("Invalid email format");
        return false;
      }

      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", email.toLowerCase()));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        return false;
      }

      const newUser = {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone.trim(),
        address: address.trim(),
        password,
      };

      const docRef = await addDoc(usersRef, {
        ...newUser,
        createdAt: new Date().toISOString(),
      });

      const registeredUser: User = {
        id: docRef.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        address: newUser.address,
      };

      setUser(registeredUser);
      localStorage.setItem("currentUser", JSON.stringify(registeredUser));
      return true;
    } catch (error) {
      console.error("Registration error:", error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("currentUser");
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (user) {
      try {
        const userRef = doc(db, "users", user.id);
        await updateDoc(userRef, updates);

        const updatedUser = { ...user, ...updates };
        setUser(updatedUser);
        localStorage.setItem("currentUser", JSON.stringify(updatedUser));
      } catch (error) {
        console.error("Update profile error:", error);
      }
    }
  };

  const resetPassword = async (email: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", email.toLowerCase()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return { success: false, error: "email_not_found" };
      }

      const userDoc = querySnapshot.docs[0];
      await updateDoc(doc(db, "users", userDoc.id), { password: newPassword });
      return { success: true };
    } catch (error: any) {
      console.error("Reset password error:", error?.message || error);
      return { success: false, error: error?.message || "unknown" };
    }
  };

  if (isLoading) {
    return null;
  }

  return (
    <UserContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
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
