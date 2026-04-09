import React, { Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import App from './app/App'
import './styles/index.css'
import { RecentlyViewedProvider } from './app/context/RecentlyViewedContext'
import { ReviewsProvider } from './app/context/ReviewsContext'

function LoadingFallback() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: '#000',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{
        textAlign: 'center'
      }}>
        <h1 style={{ color: '#D4AF37', marginBottom: '2rem', fontSize: '1.5rem', fontWeight: 'bold' }}>Lightning Bathware</h1>
        <div style={{
          width: '50px',
          height: '50px',
          border: '4px solid rgba(212, 175, 55, 0.3)',
          borderTop: '4px solid #D4AF37',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 1rem'
        }} />
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
        <p style={{ color: '#fff', fontSize: '0.875rem' }}>Loading your experience...</p>
      </div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <Suspense fallback={<LoadingFallback />}>
    <RecentlyViewedProvider>
      <ReviewsProvider>
        <App />
      </ReviewsProvider>
    </RecentlyViewedProvider>
  </Suspense>
)
