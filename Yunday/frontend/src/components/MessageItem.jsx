import { useState } from 'react'
import { useStore } from '../store'
import { useSocket } from '../SocketContext'
import { formatDistanceToNow, format } from 'date-fns'
import { fr } from 'date-fns/locale'
import './MessageItem.css'

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB'
}

function getFileIcon(mimeType) {
  if (!mimeType) return '📄'
  if (mimeType.startsWith('image/')) return '🖼️'
  if (mimeType.startsWith('video/')) return '🎬'
  if (mimeType.startsWith('audio/')) return '🎵'
  if (mimeType.includes('pdf')) return '📕'
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) return '🗜️'
  if (mimeType.includes('word') || mimeType.includes('document')) return '📝'
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return '📊'
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return '📊'
  if (mimeType.includes('javascript') || mimeType.includes('json') || mimeType.includes('html')) return '💻'
  return '📄'
}

const EMOJIS = ['👍', '❤️', '😂', '🔥', '🎉', '👀']

export default function MessageItem({ message, prevMessage }) {
  const { user, deleteMessage } = useStore()
  const socketRef = useSocket()
  const [showActions, setShowActions] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [reactions, setReactions] = useState({})

  // Grouper les messages consécutifs du même auteur
  const isSameAuthor = prevMessage?.userId === message.userId
  const timeDiff = prevMessage
    ? (new Date(message.createdAt) - new Date(prevMessage.createdAt)) / 60000
    : Infinity
  const isGrouped = isSameAuthor && timeDiff < 5

  const isOwn = message.userId === user?.id
  const date = new Date(message.createdAt)

  const react = (emoji) => {
    setReactions(prev => ({
      ...prev,
      [emoji]: (prev[emoji] || 0) + 1
    }))
    socketRef.current?.emit('message:react', {
      channelId: message.channelId,
      messageId: message.id,
      emoji
    })
    setShowEmojiPicker(false)
  }

  const del = () => {
    if (window.confirm('Supprimer ce message ?')) {
      socketRef.current?.emit('message:delete', message.id)
    }
  }

  return (
    <div
      className={`message-item ${isGrouped ? 'grouped' : ''}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => { setShowActions(false); setShowEmojiPicker(false) }}
    >
      {/* Avatar / timestamp pour messages groupés */}
      {isGrouped ? (
        <div className="message-time-gutter">
          {showActions && (
            <span className="message-hover-time">
              {format(date, 'HH:mm')}
            </span>
          )}
        </div>
      ) : (
        <div className="message-avatar">
          {message.user?.username?.[0]?.toUpperCase() || '?'}
        </div>
      )}

      <div className="message-content">
        {/* Header (seulement si pas groupé) */}
        {!isGrouped && (
          <div className="message-header">
            <span className="message-author">{message.user?.username || 'Inconnu'}</span>
            <span className="message-timestamp" title={format(date, 'dd/MM/yyyy HH:mm')}>
              {formatDistanceToNow(date, { addSuffix: true, locale: fr })}
            </span>
          </div>
        )}

        {/* Texte */}
        {message.type === 'text' && (
          <div className="message-text">{message.content}</div>
        )}

        {/* Fichier */}
        {message.type === 'file' && message.file && (
          <div className="file-attachment">
            <div className="file-icon">{getFileIcon(message.file.mimeType)}</div>
            <div className="file-info">
              <div className="file-name">{message.file.name}</div>
              <div className="file-size">{formatFileSize(message.file.size)}</div>
            </div>
            <a
              href={`/api/files/download/${message.file.id}`}
              className="file-download btn btn-ghost"
              download
            >
              ↓
            </a>
          </div>
        )}

        {/* System message */}
        {message.type === 'file' && !message.file && (
          <div className="message-text system">{message.user?.username} {message.content}</div>
        )}

        {/* Réactions */}
        {Object.keys(reactions).length > 0 && (
          <div className="message-reactions">
            {Object.entries(reactions).map(([emoji, count]) => (
              <button key={emoji} className="reaction-badge" onClick={() => react(emoji)}>
                {emoji} <span>{count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Actions hover */}
      {showActions && (
        <div className="message-actions">
          <div className="emoji-picker-wrapper">
            <button
              className="action-btn"
              title="Réagir"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              😊
            </button>
            {showEmojiPicker && (
              <div className="emoji-picker">
                {EMOJIS.map(e => (
                  <button key={e} onClick={() => react(e)}>{e}</button>
                ))}
              </div>
            )}
          </div>
          {isOwn && (
            <button className="action-btn danger" title="Supprimer" onClick={del}>🗑</button>
          )}
        </div>
      )}
    </div>
  )
}
