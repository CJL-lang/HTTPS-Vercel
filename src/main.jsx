import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import { LanguageProvider } from './utils/LanguageContext'
import { ToastProvider } from './components/toast/ToastProvider'
import AIReportWsToastBridge from './services/AIReportWsToastBridge'

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <BrowserRouter>
            <LanguageProvider>
                <ToastProvider>
                    <AIReportWsToastBridge />
                    <App />
                </ToastProvider>
            </LanguageProvider>
        </BrowserRouter>
    </React.StrictMode>,
)


