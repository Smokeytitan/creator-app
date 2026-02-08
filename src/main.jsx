import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { ThemeProvider } from './contexts/ThemeContext'
import { ToastProvider } from './contexts/ToastContext'
import ErrorBoundary from './components/ErrorBoundary'
import { ClerkProvider } from '@clerk/clerk-react'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

// Check if using placeholder credentials (for local testing without auth)
const isPlaceholder = !PUBLISHABLE_KEY || PUBLISHABLE_KEY.includes('placeholder')

// Conditionally render with or without ClerkProvider
const AppContent = () => (
  <ThemeProvider>
    <ToastProvider>
      <BrowserRouter>
        <App bypassAuth={isPlaceholder} />
      </BrowserRouter>
    </ToastProvider>
  </ThemeProvider>
)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      {isPlaceholder ? (
        <AppContent />
      ) : (
        <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
          <AppContent />
        </ClerkProvider>
      )}
    </ErrorBoundary>
  </StrictMode>,
)
