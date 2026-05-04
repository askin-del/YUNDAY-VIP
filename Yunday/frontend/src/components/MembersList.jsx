import { useStore } from '../store'
import './MembersList.css'

export default function MembersList() {
  const members = useStore(s => s.members)
  const onlineUsers = useStore(s => s.onlineUsers)

  const onlineIds = new Set(onlineUsers.map(u => u.id))

  const online = members.filter(m => onlineIds.has(m.id))
  const offline = members.filter(m => !onlineIds.has(m.id))

  return (
    <div className="members-list">
      <div className="members-header">Membres — {members.length}</div>

      {online.length > 0 && (
        <div className="members-section">
          <div className="members-group-label">En ligne — {online.length}</div>
          {online.map(m => <MemberItem key={m.id} member={m} online />)}
        </div>
      )}

      {offline.length > 0 && (
        <div className="members-section">
          <div className="members-group-label">Hors ligne — {offline.length}</div>
          {offline.map(m => <MemberItem key={m.id} member={m} online={false} />)}
        </div>
      )}
    </div>
  )
}

function MemberItem({ member, online }) {
  return (
    <div className="member-item">
      <div className="member-avatar-wrap">
        <div className={`member-avatar ${online ? 'online' : ''}`}>
          {member.username?.[0]?.toUpperCase()}
        </div>
        <div className={`status-dot ${online ? 'online' : 'offline'}`} />
      </div>
      <div className="member-info">
        <div className="member-name">{member.username}</div>
        {member.role === 'admin' && <div className="member-badge">admin</div>}
      </div>
    </div>
  )
}
