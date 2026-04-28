// Vercel deployment test
import React, { useEffect, ReactNode } from "react";
import { RouterProvider } from "react-router";
import { router } from "./routes";
import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";
import { CompareProvider } from "./context/CompareContext";
import { AdminProvider, useAdmin } from "./context/AdminContext";
import { UserProvider } from "./context/UserContext";
import { NotificationsProvider } from "./context/NotificationsContext";
import { AnnouncementProvider } from "./context/AnnouncementContext";
import { Toaster } from "./components/ui/sonner";
import LoadingScreen from "./components/LoadingScreen";

function DataLoader({ children }: { children: ReactNode }) {
  const { isDataLoaded, storeProfile } = useAdmin();
  
  useEffect(() => {
    if (isDataLoaded) {
      document.title = `${storeProfile.storeName} ${storeProfile.storeNameAccent} - Sri Lanka's Premier Hardware Store`;
    }
  }, [isDataLoaded, storeProfile.storeName, storeProfile.storeNameAccent]);
  
  if (!isDataLoaded) {
    return <LoadingScreen />;
  }
  
  return <>{children}</>;
}

function App() {
  return (
    <>
      <Toaster />
      <AnnouncementProvider>
        <UserProvider>
          <AdminProvider>
            <NotificationsProvider>
              <CartProvider>
                <CompareProvider>
                  <WishlistProvider>
                    <DataLoader>
                      <RouterProvider router={router} />
                    </DataLoader>
                  </WishlistProvider>
                </CompareProvider>
              </CartProvider>
            </NotificationsProvider>
          </AdminProvider>
        </UserProvider>
      </AnnouncementProvider>
    </>
  );
}

export default App;
