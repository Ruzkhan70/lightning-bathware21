import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './app/App'
import './styles/index.css'
import { RecentlyViewedProvider } from './app/context/RecentlyViewedContext'
import { ReviewsProvider } from './app/context/ReviewsContext'

ReactDOM.createRoot(document.getElementById('root')!).render(
    <RecentlyViewedProvider>
      <ReviewsProvider>
        <App />
      </ReviewsProvider>
    </RecentlyViewedProvider>
)
