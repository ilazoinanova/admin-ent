import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from "./auth/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import "./i18n";
import { Toaster } from "react-hot-toast";


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            success: {
              style: {
                background: "#e6f9f0",
                color: "#065f46",
              },
            },
            error: {
              style: {
                background: "#fdecea",
                color: "#7f1d1d",
              },
            },
          }}
        />
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);  

