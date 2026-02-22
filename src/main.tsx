import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import App from './App.tsx'
import { LandingPage } from './app/page'
import { StoryPage } from './components/StoryPage'
import './index.css'
import { UserViewProvider } from './contexts/UserViewContext'
import { WishesProvider } from './contexts/WishesContext'
import { ToastProvider } from './contexts/ToastContext'
import { WalletProvider } from './contexts/WalletContext.tsx'
import { AuthProvider } from './contexts/AuthContext'
import { ErrorBoundary } from './components/ErrorBoundary'

const SignupRedirect = () => {
  const location = useLocation();
  return <Navigate to={`/app${location.search}`} replace />;
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <UserViewProvider>
          <WishesProvider>
            <WalletProvider>
              <BrowserRouter>
                <Routes>
                  {/* 地平：ランディングページ */}
                  <Route path="/" element={<LandingPage />} />
                  
                  {/* 原典：物語のページ */}
                  <Route path="/story" element={<StoryPage />} />

                  {/* 招待リンクからのリダイレクト */}
                  <Route path="/signup" element={<SignupRedirect />} />
                  
                  {/* 器：既存のアプリケーション機能 */}
                  {/* path="/app/*" とすることで、App内での内部ルーティングも維持します */}
                  <Route path="/app/*" element={<App />} />

                  {/* 救済：迷い込んだユーザーをLPへ */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </BrowserRouter>
            </WalletProvider>
          </WishesProvider>
          </UserViewProvider>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
