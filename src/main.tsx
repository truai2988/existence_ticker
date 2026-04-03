import React from "react";
import ReactDOM from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import App from "./App.tsx";
import { LandingPage } from "./app/page";

import { TrustPage } from "./components/TrustPage";
import { SignupRedirect } from "./components/SignupRedirect";
import "./index.css";
import { UserViewProvider } from "./contexts/UserViewContext";
import { WishesProvider } from "./contexts/WishesContext";
import { ToastProvider } from "./contexts/ToastProvider";
import { WalletProvider } from "./contexts/WalletContext.tsx";
import { AuthProvider } from "./contexts/AuthContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { LanguageProvider } from "./contexts/LanguageContext";

const isStandalone = 
  window.matchMedia('(display-mode: standalone)').matches || 
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ('standalone' in window.navigator && (window.navigator as any).standalone);


// --- Service Worker Kill Switch (Branding Synchronization) ---
// This ensures that any legacy service workers (e.g. from the 'Noctiluca' project)
// are forcefully unregistered so that the new 'Existence Ticker' branding 
// and metadata are correctly served.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister();
      console.log('Legacy Service Worker Unregistered for Branding Sync.');
    }
  });
}
// -------------------------------------------------------------

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <LanguageProvider>
      <ErrorBoundary>
        <ToastProvider>
        <AuthProvider>
          <UserViewProvider>
            <WishesProvider>
              <WalletProvider>
                <BrowserRouter>
                  <Routes>
                    {/* 地平：ランディングページ */}
                    <Route path="/" element={isStandalone ? <Navigate to="/app" replace /> : <LandingPage />} />


                    {/* 約束と庭師について */}
                    <Route path="/trust" element={<TrustPage />} />

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
    </LanguageProvider>
  </React.StrictMode>,
);
