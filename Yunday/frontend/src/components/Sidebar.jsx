import { useStore } from '../store'
import { useSocket } from '../SocketContext'
import './Sidebar.css'

export default function Sidebar() {
  const { user, channels, currentChannel, setCurrentChannel, setShowCreateChannel, setShowInvite, logout } = useStore()
  const socketRef = useSocket()

  const joinChannel = (channel) => {
    if (socketRef.current) {
      if (currentChannel) socketRef.current.emit('channel:leave', currentChannel.id)
      socketRef.current.emit('channel:join', channel.id)
    }
    setCurrentChannel(channel)
  }

  const allUsers = useStore(s => s.members)
  const isAdmin = user?.role === 'admin' || allUsers[0]?.id === user?.id

  return (
    <div className="sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <div className="workspace-name">
          <span className="ws-icon">⬡</span>
          <span>TeamSpace</span>
        </div>
      </div>

      {/* Channels */}
      <div className="sidebar-section">
        <div className="section-header">
          <span>Canaux</span>
          <button className="icon-btn" onClick={() => setShowCreateChannel(true)} title="Nouveau canal">+</button>
        </div>
        <div className="channel-list">
          {channels.map(channel => (
            <button
              key={channel.id}
              className={`channel-item ${currentChannel?.id === channel.id ? 'active' : ''}`}
              onClick={() => joinChannel(channel)}
            >
              <span className="channel-hash">#</span>
              <span className="channel-name">{channel.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Admin actions */}
      {isAdmin && (
        <div className="sidebar-section">
          <button className="sidebar-action" onClick={() => setShowInvite(true)}>
            <span>➕</span> Inviter un membre
          </button>
        </div>
      )}

      {/* User footer */}
      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">{user?.username?.[0]?.toUpperCase()}</div>
          <div className="user-details">
            <div className="user-name">{user?.username}</div>
            <div className="user-role">{user?.role === 'admin' ? '👑 Admin' : '· Membre'}</div>
          </div>
        </div>
        <button className="icon-btn logout-btn" onClick={logout} title="Déconnexion">⎋</button>
      </div>
    </div>
  )
}
