import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { UserViewProvider } from './contexts/UserViewContext'
import { WishesProvider } from './contexts/WishesContext'
import { ToastProvider } from './contexts/ToastContext'

import { ErrorBoundary } from './components/ErrorBoundary'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <UserViewProvider>
          <WishesProvider>
            <App />
          </WishesProvider>
        </UserViewProvider>
      </ToastProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
