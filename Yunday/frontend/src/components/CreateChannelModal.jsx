import { useState } from 'react'
import { useStore } from '../store'
import api from '../api'
import toast from 'react-hot-toast'

export default function CreateChannelModal() {
  const { setShowCreateChannel, addChannel } = useStore()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  const handle = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    try {
      const channel = await api.post('/channels', { name, description })
      addChannel(channel)
      toast.success(`Canal #${channel.name} créé !`)
      setShowCreateChannel(false)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={() => setShowCreateChannel(false)}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Créer un canal</h2>
        <form onSubmit={handle}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-1)', marginBottom: 6 }}>
              Nom du canal
            </label>
            <input
              className="input"
              placeholder="ex: design, backend, urgent..."
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
              required
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-1)', marginBottom: 6 }}>
              Description (optionnel)
            </label>
            <input
              className="input"
              placeholder="À quoi sert ce canal ?"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setShowCreateChannel(false)} style={{ flex: 1 }}>
              Annuler
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
              {loading ? <span className="spinner" /> : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
