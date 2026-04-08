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
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: '#000',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{
        textAlign: 'center'
      }}>
        <h1 style={{ color: '#D4AF37', marginBottom: '0.5rem', fontSize: '1.5rem' }}>Lightning Bathware</h1>
        <p style={{ color: '#fff' }}>Loading...</p>
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
