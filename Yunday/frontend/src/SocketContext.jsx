import { createContext, useContext, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import { useStore } from './store'

const SocketContext = createContext(null)

export function SocketProvider({ children }) {
  const socketRef = useRef(null)
  const token = useStore(s => s.token)
  const addMessage = useStore(s => s.addMessage)
  const deleteMessage = useStore(s => s.deleteMessage)
  const setOnlineUsers = useStore(s => s.setOnlineUsers)
  const setTypingUsers = useStore(s => s.setTypingUsers)

  useEffect(() => {
    if (!token) return

    const socket = io('/', {
      auth: { token },
      transports: ['websocket']
    })

    socketRef.current = socket

    socket.on('connect', () => console.log('🔌 Socket connecté'))
    socket.on('disconnect', () => console.log('🔌 Socket déconnecté'))

    socket.on('message:new', (message) => {
      addMessage(message)
    })

    socket.on('message:deleted', (id) => {
      deleteMessage(id)
    })

    socket.on('users:online', (users) => {
      setOnlineUsers(users)
    })

    socket.on('typing:update', ({ userId, username, typing }) => {
      setTypingUsers(prev => {
        if (typing) {
          if (prev.find(u => u.userId === userId)) return prev
          return [...prev, { userId, username }]
        } else {
          return prev.filter(u => u.userId !== userId)
        }
      })
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [token])

  return (
    <SocketContext.Provider value={socketRef}>
      {children}
    </SocketContext.Provider>
  )
}

export function useSocket() {
  return useContext(SocketContext)
}
