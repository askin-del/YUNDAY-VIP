import { useState } from 'react'
import { useStore } from '../store'
import api from '../api'
import toast from 'react-hot-toast'

export default function InviteModal() {
  const { setShowInvite } = useStore()
  const [code, setCode] = useState(null)
  const [loading, setLoading] = useState(false)

  const generate = async () => {
    setLoading(true)
    try {
      const res = await api.post('/auth/invite')
      setCode(res.code)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const copy = () => {
    navigator.clipboard.writeText(code)
    toast.success('Code copié !')
  }

  return (
    <div className="modal-overlay" onClick={() => setShowInvite(false)}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Inviter un membre</h2>
        <p style={{ color: 'var(--text-2)', marginBottom: 24, fontSize: 13, lineHeight: 1.6 }}>
          Générez un code d'invitation à usage unique. La personne pourra l'utiliser sur la page d'inscription.
        </p>

        {!code ? (
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={generate} disabled={loading}>
            {loading ? <span className="spinner" /> : '✨ Générer un code d\'invitation'}
          </button>
        ) : (
          <>
            <div style={{
              background: 'var(--bg-0)',
              border: '1px solid var(--accent)',
              borderRadius: 'var(--radius)',
              padding: '16px 20px',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12
            }}>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: '4px',
                color: 'var(--accent)'
              }}>
                {code}
              </span>
              <button className="btn btn-ghost" onClick={copy} style={{ flexShrink: 0 }}>
                Copier
              </button>
            </div>
            <p style={{ color: 'var(--text-3)', fontSize: 12 }}>
              ⚠️ Ce code est à usage unique et expire dès qu'il est utilisé.
            </p>
            <button
              className="btn btn-ghost"
              style={{ width: '100%', marginTop: 16 }}
              onClick={generate}
              disabled={loading}
            >
              Générer un autre code
            </button>
          </>
        )}

        <button
          className="btn btn-ghost"
          style={{ width: '100%', marginTop: 12 }}
          onClick={() => setShowInvite(false)}
        >
          Fermer
        </button>
      </div>
    </div>
  )
}
