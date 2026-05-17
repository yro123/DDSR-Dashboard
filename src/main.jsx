import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ClerkProvider } from '@clerk/react'
import './index.css'
import App from './App.jsx'

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

const clerkAppearance = {
  variables: {
    colorPrimary:         '#00D4C8',
    colorBackground:      '#1A1A1A',
    colorText:            '#D4D4D8',
    colorTextSecondary:   '#71717A',
    colorInputBackground: '#242424',
    colorInputText:       '#D4D4D8',
    borderRadius:         '8px',
    fontFamily:           'Inter, system-ui, sans-serif',
  },
  layout: {
    logoImageUrl:  '/ddsr-logo.png',
    logoPlacement: 'inside',
  },
  elements: {
    card:              { border: '1px solid #2D2D2D', boxShadow: '0 25px 50px rgba(0,0,0,.6)' },
    formButtonPrimary: { background: '#00D4C8', color: '#0A0A0A', fontWeight: 700 },
  },
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ClerkProvider publishableKey={publishableKey} appearance={clerkAppearance}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ClerkProvider>
  </StrictMode>,
)
