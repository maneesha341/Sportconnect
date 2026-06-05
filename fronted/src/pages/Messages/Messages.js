import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import './Messages.css';

const COLORS = ['#c8f230','#00d4e8','#ff6b6b','#a78bfa','#fbbf24','#34d399'];
function avatarColor(name) {
  let h = 0;
  for (let c of (name||'')) h = c.charCodeAt(0) + h * 31;
  return COLORS[Math.abs(h) % COLORS.length];
}
function initials(name) {
  return (name||'').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
}
function formatTime(date) {
  const d = new Date(date);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff/60000)}m ago`;
  if (diff < 86400000) return d.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
  return d.toLocaleDateString([], {month:'short',day:'numeric'});
}

function Avatar({ name, photo, size = 44 }) {
  if (photo) return <img src={photo} alt={name} className="conv-avatar" style={{width:size,height:size}} />;
  return (
    <div className="conv-avatar-letter" style={{width:size,height:size,background:avatarColor(name)}}>
      {initials(name)}
    </div>
  );
}

export default function Messages() {
  const { user } = useAuth();
  const { partnerId: urlPartnerId } = useParams();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [activePartnerId, setActivePartnerId] = useState(urlPartnerId || null);
  const [activePartner, setActivePartner] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const bottomRef = useRef();
  const pollRef = useRef();

  // Load conversations
  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const res = await api.get('/messages/conversations');
      setConversations(res.data);
    } catch (e) { console.error(e); }
  };

  // If URL has partnerId, load that conversation
  useEffect(() => {
    if (urlPartnerId) {
      openConversation(urlPartnerId);
    }
  }, [urlPartnerId]);

  // Poll for new messages every 4 seconds
  useEffect(() => {
    if (!activePartnerId) return;
    pollRef.current = setInterval(() => {
      loadMessages(activePartnerId, false);
    }, 4000);
    return () => clearInterval(pollRef.current);
  }, [activePartnerId]);

  const openConversation = async (partnerId) => {
    setActivePartnerId(partnerId);
    navigate(`/messages/${partnerId}`, { replace: true });

    // Get partner info
    try {
      const convs = conversations;
      const existing = convs.find(c => c.partnerId === partnerId);
      if (existing) {
        setActivePartner({ name: existing.partnerName, role: existing.partnerRole, photo: existing.trainerPhoto });
      } else {
        // Fetch from API
        const res = await api.get(`/messages/partner-info-by-user/${partnerId}`);
        setActivePartner(res.data);
      }
    } catch (e) {
      setActivePartner({ name: 'User', role: '', photo: '' });
    }

    loadMessages(partnerId, true);
    // Refresh conversations to clear unread
    setTimeout(loadConversations, 500);
  };

  const loadMessages = async (partnerId, showLoader = false) => {
    try {
      if (showLoader) setLoadingMsgs(true);
      const res = await api.get(`/messages/${partnerId}`);
      setMessages(res.data);
    } catch (e) { console.error(e); }
    finally { setLoadingMsgs(false); }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!text.trim() || !activePartnerId || sending) return;
    setSending(true);
    try {
      const res = await api.post('/messages', { receiverId: activePartnerId, text });
      setMessages(prev => [...prev, res.data]);
      setText('');
      loadConversations();
    } catch (e) { console.error(e); }
    finally { setSending(false); }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const totalUnread = conversations.reduce((sum, c) => sum + c.unread, 0);

  return (
    <div className="messages-page">
      <h1>Messages {totalUnread > 0 && <span style={{fontSize:24,color:'var(--accent)'}}>({totalUnread})</span>}</h1>
      <p className="subtitle">Direct communication between colleges and trainers</p>

      <div className="messages-layout">

        {/* ── Sidebar ── */}
        <div className="conv-sidebar">
          <div className="conv-sidebar-header">
            Conversations ({conversations.length})
          </div>
          <div className="conv-list">
            {conversations.length === 0 ? (
              <div className="no-convs">
                <div style={{fontSize:36,marginBottom:12}}>💬</div>
                No conversations yet.<br />
                {user?.role === 'college'
                  ? <><br />Go to <strong>Find Trainers</strong> and click <strong>Message</strong> to start chatting.</>
                  : <><br />Colleges will message you once they find your profile.</>
                }
              </div>
            ) : (
              conversations.map(conv => (
                <div
                  key={conv.partnerId}
                  className={`conv-item ${activePartnerId === conv.partnerId ? 'active' : ''}`}
                  onClick={() => openConversation(conv.partnerId)}
                >
                  <Avatar name={conv.partnerName} photo={conv.trainerPhoto} size={44} />
                  <div className="conv-info">
                    <div className="conv-name">{conv.partnerName}</div>
                    <div className="conv-last">{conv.lastMessage}</div>
                  </div>
                  {conv.unread > 0 && (
                    <div className="conv-badge">{conv.unread}</div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Chat Panel ── */}
        <div className="chat-panel">
          {!activePartnerId ? (
            <div className="chat-empty">
              <div className="chat-empty-icon">💬</div>
              <h3>Select a conversation</h3>
              <p>Choose a conversation from the left or<br />message a trainer from the Find Trainers page.</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="chat-header">
                <Avatar name={activePartner?.name || '?'} photo={activePartner?.photo} size={40} />
                <div className="chat-header-info">
                  <div className="chat-header-name">{activePartner?.name || 'Loading...'}</div>
                  <div className="chat-header-role">
                    {activePartner?.role === 'trainer' ? '🏅 Trainer' : '🏫 College'}
                  </div>
                </div>
                <div className="online-dot" title="Active" />
              </div>

              {/* Messages */}
              <div className="chat-messages">
                {loadingMsgs ? (
                  <div style={{textAlign:'center',color:'var(--text-secondary)',paddingTop:40}}>Loading...</div>
                ) : messages.length === 0 ? (
                  <div style={{textAlign:'center',color:'var(--text-secondary)',paddingTop:40,fontSize:14}}>
                    No messages yet. Say hello! 👋
                  </div>
                ) : (
                  messages.map(msg => {
                    const mine = msg.senderId === user?.id || msg.senderId?._id === user?.id || msg.senderId?.toString() === user?.id;
                    return (
                      <div key={msg._id} className={`msg-bubble-wrap ${mine ? 'mine' : 'theirs'}`}>
                        <div className="msg-bubble">{msg.text}</div>
                        <div className="msg-time">{formatTime(msg.createdAt)}</div>
                      </div>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="chat-input-bar">
                <textarea
                  className="chat-input"
                  rows={1}
                  placeholder="Type a message... (Enter to send)"
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <button className="send-btn" onClick={sendMessage} disabled={!text.trim() || sending}>
                  ➤
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}