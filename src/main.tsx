import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { UserViewProvider } from './contexts/UserViewContext'
import { WishesProvider } from './contexts/WishesContext'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <UserViewProvider>
      <WishesProvider>
        <App />
      </WishesProvider>
    </UserViewProvider>
  </React.StrictMode>,
)
