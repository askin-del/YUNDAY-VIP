import { useEffect } from 'react'
import { useStore } from '../store'
import api from '../api'
import Sidebar from '../components/Sidebar'
import ChatArea from '../components/ChatArea'
import MembersList from '../components/MembersList'
import CreateChannelModal from '../components/CreateChannelModal'
import InviteModal from '../components/InviteModal'
import './chat.css'

export default function ChatPage() {
  const { setChannels, setCurrentChannel, channels, setMembers, showCreateChannel, showInvite } = useStore()

  useEffect(() => {
    api.get('/channels').then(data => {
      setChannels(data)
      if (data.length > 0) setCurrentChannel(data[0])
    }).catch(console.error)

    api.get('/auth/members').then(setMembers).catch(console.error)
  }, [])

  return (
    <div className="chat-layout">
      <Sidebar />
      <ChatArea />
      <MembersList />
      {showCreateChannel && <CreateChannelModal />}
      {showInvite && <InviteModal />}
    </div>
  )
}
