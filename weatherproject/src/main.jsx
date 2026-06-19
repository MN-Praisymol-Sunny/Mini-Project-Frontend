import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import JSX from './weather.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <JSX></JSX>
  </StrictMode>,
)
