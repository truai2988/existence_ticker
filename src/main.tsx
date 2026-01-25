import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { UserViewProvider } from './contexts/UserViewContext'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <UserViewProvider>
      <App />
    </UserViewProvider>
  </React.StrictMode>,
)
