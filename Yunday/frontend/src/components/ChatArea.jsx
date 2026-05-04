import { useEffect, useRef, useState, useCallback } from 'react'
import { useStore } from '../store'
import { useSocket } from '../SocketContext'
import api from '../api'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import MessageItem from './MessageItem'
import FileUploadProgress from './FileUploadProgress'
import './ChatArea.css'

export default function ChatArea() {
  const { currentChannel, messages, setMessages, user, typingUsers } = useStore()
  const socketRef = useSocket()
  const [input, setInput] = useState('')
  const [uploads, setUploads] = useState([]) // { id, name, progress, done }
  const bottomRef = useRef(null)
  const typingTimer = useRef(null)
  const [isTyping, setIsTyping] = useState(false)

  // Charger les messages du canal
  useEffect(() => {
    if (!currentChannel) return
    api.get(`/messages/${currentChannel.id}`)
      .then(setMessages)
      .catch(console.error)
  }, [currentChannel?.id])

  // Rejoindre le canal via socket
  useEffect(() => {
    if (!currentChannel || !socketRef.current) return
    socketRef.current.emit('channel:join', currentChannel.id)
  }, [currentChannel?.id])

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Envoyer un message
  const sendMessage = (e) => {
    e.preventDefault()
    if (!input.trim() || !currentChannel || !socketRef.current) return

    socketRef.current.emit('message:send', {
      channelId: currentChannel.id,
      content: input.trim()
    })

    // Stop typing
    socketRef.current.emit('typing:stop', currentChannel.id)
    setIsTyping(false)
    setInput('')
  }

  // Indicateur de frappe
  const handleInputChange = (e) => {
    setInput(e.target.value)

    if (!socketRef.current || !currentChannel) return

    if (!isTyping) {
      setIsTyping(true)
      socketRef.current.emit('typing:start', currentChannel.id)
    }

    clearTimeout(typingTimer.current)
    typingTimer.current = setTimeout(() => {
      setIsTyping(false)
      socketRef.current?.emit('typing:stop', currentChannel.id)
    }, 2000)
  }

  // Upload simple
  const uploadFile = async (file) => {
    const uploadId = Math.random().toString(36).substring(2)

    setUploads(prev => [...prev, { id: uploadId, name: file.name, progress: 0, done: false }])

    try {
      const form = new FormData()
      form.append('file', file)
      form.append('channelId', currentChannel.id)

      const res = await api.post('/files/simple', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100)
          setUploads(prev => prev.map(u => u.id === uploadId ? { ...u, progress } : u))
        }
      })

      // Notifier via socket
      socketRef.current?.emit('file:uploaded', {
        channelId: currentChannel.id,
        fileId: res.file.id
      })

      setUploads(prev => prev.map(u => u.id === uploadId ? { ...u, done: true } : u))
      setTimeout(() => {
        setUploads(prev => prev.filter(u => u.id !== uploadId))
      }, 2000)
      toast.success(`${file.name} uploadé !`)
    } catch (err) {
      toast.error(`Erreur upload: ${err.message}`)
      setUploads(prev => prev.filter(u => u.id !== uploadId))
    }
  }

  const onDrop = useCallback((files) => {
    if (!currentChannel) return
    files.forEach(uploadFile)
  }, [currentChannel])

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    noClick: true,
    noKeyboard: true
  })

  const otherTyping = typingUsers.filter(u => u.userId !== user?.id)

  if (!currentChannel) {
    return (
      <div className="chat-area empty">
        <div className="empty-state">
          <span style={{ fontSize: 48 }}>⬡</span>
          <h2>Sélectionnez un canal</h2>
          <p>Choisissez un canal dans la barre latérale</p>
        </div>
      </div>
    )
  }

  return (
    <div className="chat-area" {...getRootProps()}>
      <input {...getInputProps()} />

      {/* Drag overlay */}
      {isDragActive && (
        <div className="drag-overlay">
          <div className="drag-inner">
            <span style={{ fontSize: 48 }}>📁</span>
            <h2>Déposer pour uploader</h2>
            <p>dans #{currentChannel.name}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-left">
          <span className="chat-hash">#</span>
          <span className="chat-channel-name">{currentChannel.name}</span>
          {currentChannel.description && (
            <span className="chat-description">{currentChannel.description}</span>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="messages-container">
        <div className="messages-list">
          {messages.length === 0 && (
            <div className="channel-start">
              <div className="channel-start-icon">#</div>
              <h2>Début de #{currentChannel.name}</h2>
              <p>C'est le début de ce canal. Soyez le premier à écrire !</p>
            </div>
          )}
          {messages.map((msg, i) => (
            <MessageItem
              key={msg.id}
              message={msg}
              prevMessage={messages[i - 1]}
            />
          ))}

          {/* Typing indicator */}
          {otherTyping.length > 0 && (
            <div className="typing-indicator">
              <div className="typing-dots">
                <span/><span/><span/>
              </div>
              <span className="typing-text">
                {otherTyping.map(u => u.username).join(', ')} est en train d'écrire...
              </span>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Upload progress */}
      {uploads.length > 0 && (
        <div className="uploads-bar">
          {uploads.map(u => <FileUploadProgress key={u.id} upload={u} />)}
        </div>
      )}

      {/* Input */}
      <div className="chat-input-area">
        <button className="attach-btn" onClick={open} title="Joindre un fichier">📎</button>
        <form onSubmit={sendMessage} style={{ flex: 1, display: 'flex', gap: 10 }}>
          <input
            className="chat-input"
            placeholder={`Message #${currentChannel.name}`}
            value={input}
            onChange={handleInputChange}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(e)}
          />
          <button type="submit" className="btn btn-primary send-btn" disabled={!input.trim()}>
            ↑
          </button>
        </form>
      </div>
    </div>
  )
}
