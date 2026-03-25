import React from "react";
import { RouterProvider } from "react-router";
import { router } from "./routes";
import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";
import { AdminProvider } from "./context/AdminContext";
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

function App() {
  // Detect page refresh using sessionStorage
  const [showRefreshLoader, setShowRefreshLoader] = React.useState(false);
  const [initialLoad, setInitialLoad] = React.useState(true);

  React.useEffect(() => {
    // Check if this is a refresh (page was loaded recently)
    const lastLoad = sessionStorage.getItem('lastPageLoad');
    const now = Date.now();
    
    if (lastLoad) {
      const timeSinceLastLoad = now - parseInt(lastLoad);
      // If page was loaded within last 10 seconds, show loading
      if (timeSinceLastLoad < 10000) {
        setShowRefreshLoader(true);
      }
    }
    
    // Update last load time
    sessionStorage.setItem('lastPageLoad', now.toString());
    
    // Also set a refresh flag before unload
    const handleBeforeUnload = () => {
      sessionStorage.setItem('isRefreshing', 'true');
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Hide loader after initial render
    const timer = setTimeout(() => {
      setShowRefreshLoader(false);
      setInitialLoad(false);
    }, 2000);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      clearTimeout(timer);
    };
  }, []);

  return (
    <>
      {/* Refresh Loading Screen */}
      {showRefreshLoader && (
        <LoadingScreen />
      )}
      
      <ErrorBoundary>
        <UserProvider>
          <AdminProvider>
            <CartProvider>
              <WishlistProvider>
                <RouterProvider router={router} />
                <Toaster position="top-right" />
              </WishlistProvider>
            </CartProvider>
          </AdminProvider>
        </UserProvider>
      </ErrorBoundary>
    </>
  );
}

export default App;
