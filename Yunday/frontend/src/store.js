import { create } from 'zustand'

export const useStore = create((set, get) => ({
  // Auth
  user: null,
  token: localStorage.getItem('ts_token'),
  setUser: (user) => set({ user }),
  setToken: (token) => {
    localStorage.setItem('ts_token', token)
    set({ token })
  },
  logout: () => {
    localStorage.removeItem('ts_token')
    set({ user: null, token: null, currentChannel: null })
  },

  // Channels
  channels: [],
  currentChannel: null,
  setChannels: (channels) => set({ channels }),
  addChannel: (channel) => set(s => ({ channels: [...s.channels, channel] })),
  removeChannel: (id) => set(s => ({ channels: s.channels.filter(c => c.id !== id) })),
  setCurrentChannel: (channel) => set({ currentChannel: channel, messages: [] }),

  // Messages
  messages: [],
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set(s => ({ messages: [...s.messages, message] })),
  deleteMessage: (id) => set(s => ({ messages: s.messages.filter(m => m.id !== id) })),

  // Members
  members: [],
  onlineUsers: [],
  setMembers: (members) => set({ members }),
  setOnlineUsers: (users) => set({ onlineUsers: users }),

  // Typing
  typingUsers: [],
  setTypingUsers: (typingUsers) => set({ typingUsers }),

  // UI
  showMembers: true,
  toggleMembers: () => set(s => ({ showMembers: !s.showMembers })),
  showCreateChannel: false,
  setShowCreateChannel: (v) => set({ showCreateChannel: v }),
  showInvite: false,
  setShowInvite: (v) => set({ showInvite: v }),
}))
