import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { db } from "../../firebase";
import { collection, addDoc, updateDoc, doc, getDocs, query, where, onSnapshot } from "firebase/firestore";

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

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      console.log("Users synced from Firebase:", snapshot.size);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", email), where("password", "==", password));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        const loggedInUser: User = {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
          address: userData.address,
        };
        setUser(loggedInUser);
        localStorage.setItem("currentUser", JSON.stringify(loggedInUser));
        return true;
      }
      return false;
    } catch (error) {
      console.error("Login error:", error);
      return false;
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
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        return false;
      }

      const newUser = {
        name,
        email,
        phone,
        address,
        password,
      };

      const docRef = await addDoc(usersRef, {
        ...newUser,
        createdAt: new Date().toISOString(),
      });

      const registeredUser: User = {
        id: docRef.id,
        name,
        email,
        phone,
        address,
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
      const q = query(usersRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return { success: false, error: "email_not_found" };
      }

      const userDoc = querySnapshot.docs[0];
      await updateDoc(doc(db, "users", userDoc.id), { password: newPassword });
      return { success: true };
    } catch (error) {
      console.error("Reset password error:", error);
      return { success: false, error: "unknown" };
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
