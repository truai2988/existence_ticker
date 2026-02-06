import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { UserViewProvider } from './contexts/UserViewContext'
import { WishesProvider } from './contexts/WishesContext'
import { ToastProvider } from './contexts/ToastContext'
import { AuthProvider } from './contexts/AuthContext'

import { ErrorBoundary } from './components/ErrorBoundary'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <UserViewProvider>
          <WishesProvider>
            <App />
          </WishesProvider>
        </UserViewProvider>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
