import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import App from './App.tsx'
import { LandingPage } from './app/page'
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
            <BrowserRouter>
              <Routes>
                {/* 地平：ランディングページ */}
                <Route path="/" element={<LandingPage />} />
                
                {/* 器：既存のアプリケーション機能 */}
                {/* path="/app/*" とすることで、App内での内部ルーティングも維持します */}
                <Route path="/app/*" element={<App />} />

                {/* 救済：迷い込んだユーザーをLPへ */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </WishesProvider>
          </UserViewProvider>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
