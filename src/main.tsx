import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { UserViewProvider } from './contexts/UserViewContext'
import { WishesProvider } from './contexts/WishesContext'
import { ToastProvider } from './contexts/ToastContext'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ToastProvider>
      <UserViewProvider>
        <WishesProvider>
          <App />
        </WishesProvider>
      </UserViewProvider>
    </ToastProvider>
  </React.StrictMode>,
)
