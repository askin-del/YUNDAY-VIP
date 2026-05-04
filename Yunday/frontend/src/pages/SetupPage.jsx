import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import api from '../api'
import toast from 'react-hot-toast'
import './auth.css'

export default function SetupPage() {
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const { setToken, setUser } = useStore()
  const navigate = useNavigate()

  const handle = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { token, user } = await api.post('/auth/setup', form)
      setToken(token)
      setUser(user)
      toast.success('Espace créé ! Bienvenue 🎉')
      navigate('/')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-glow" />
      <div className="auth-card">
        <div className="auth-logo">
          <span className="logo-icon">⬡</span>
          <span className="logo-text">YUNDAY VIP</span>
        </div>
        <h1>Créer votre espace</h1>
        <p className="auth-sub">Configuration initiale — vous serez administrateur</p>

        <form onSubmit={handle}>
          <div className="field">
            <label>Nom d'utilisateur</label>
            <input className="input" placeholder="votre_pseudo" value={form.username}
              onChange={e => setForm({...form, username: e.target.value})} required />
          </div>
          <div className="field">
            <label>Email</label>
            <input className="input" type="email" placeholder="vous@email.com" value={form.email}
              onChange={e => setForm({...form, email: e.target.value})} required />
          </div>
          <div className="field">
            <label>Mot de passe</label>
            <input className="input" type="password" placeholder="••••••••" value={form.password}
              onChange={e => setForm({...form, password: e.target.value})} required />
          </div>
          <button className="btn btn-primary" style={{width:'100%', marginTop: 8}} disabled={loading}>
            {loading ? <span className="spinner"/> : 'Créer l\'espace'}
          </button>
        </form>

        <p className="auth-footer">
          Déjà configuré ? <a href="/login">Se connecter</a>
        </p>
      </div>
    </div>
  )
}
