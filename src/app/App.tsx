import React from "react";
import { RouterProvider } from "react-router";
import { router } from "./routes";
import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";
import { AdminProvider, useAdmin } from "./context/AdminContext";
import { UserProvider } from "./context/UserContext";
import { Toaster } from "./components/ui/sonner";
import LoadingScreen from "./components/LoadingScreen";

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("App Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          backgroundColor: '#f3f4f6',
          fontFamily: 'system-ui, sans-serif',
          padding: '2rem'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '0.5rem',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            maxWidth: '500px'
          }}>
            <h1 style={{ color: '#dc2626', marginBottom: '1rem' }}>Something went wrong</h1>
            <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                backgroundColor: '#D4AF37',
                color: 'black',
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function DataLoader({ children }: { children: React.ReactNode }) {
  const { isDataLoaded } = useAdmin();
  
  if (!isDataLoaded) {
    return <LoadingScreen />;
  }
  
  return <>{children}</>;
}

function AppContent() {
  return (
    <ErrorBoundary>
      <UserProvider>
        <AdminProvider>
          <CartProvider>
            <WishlistProvider>
              <DataLoader>
                <RouterProvider router={router} />
                <Toaster position="top-right" draggable />
              </DataLoader>
            </WishlistProvider>
          </CartProvider>
        </AdminProvider>
      </UserProvider>
    </ErrorBoundary>
  );
}

function App() {
  return <AppContent />;
}

export default App;
