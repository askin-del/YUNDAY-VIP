import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useStore } from './store'
import { SocketProvider } from './SocketContext'
import api from './api'
import LoginPage from './pages/LoginPage'
import SetupPage from './pages/SetupPage'
import RegisterPage from './pages/RegisterPage'
import ChatPage from './pages/ChatPage'

function PrivateRoute({ children }) {
  const token = useStore(s => s.token)
  const user = useStore(s => s.user)
  if (!token) return <Navigate to="/login" replace />
  if (!user) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-2)' }}>Chargement...</div>
  return children
}

export default function App() {
  const token = useStore(s => s.token)
  const setUser = useStore(s => s.setUser)
  const logout = useStore(s => s.logout)

  useEffect(() => {
    if (!token) return
    api.get('/auth/me')
      .then(user => setUser(user))
      .catch(() => logout())
  }, [token])

  return (
    <BrowserRouter>
      <SocketProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'var(--bg-3)',
              color: 'var(--text-0)',
              border: '1px solid var(--border)',
              fontFamily: 'var(--font-display)',
              fontSize: '13px',
            }
          }}
        />
        <Routes>
          <Route path="/setup" element={<SetupPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={
            <PrivateRoute>
              <ChatPage />
            </PrivateRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </SocketProvider>
    </BrowserRouter>
  )
}
