import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { CartProvider } from '@/contexts/CartContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { router } from '@/router'
import './index.css'

document.documentElement.setAttribute('data-theme', localStorage.getItem('otherside-theme') === 'light' ? 'light' : 'dark')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <RouterProvider router={router} />
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
)
