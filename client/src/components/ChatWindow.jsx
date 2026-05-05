import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../api';
import { useAuthStore } from '../store/authStore';

export default function ChatWindow({ rideId, rideTitle }) {
  const { user, profile } = useAuthStore();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);
  const pollingRef = useRef(null);
  const lastMessageIdRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  const fetchMessages = useCallback(async (initial = false) => {
    try {
      const res = await api.get(`/messages/${rideId}`);
      const fetched = res.data || [];

      setMessages(prev => {
        // Only update if there are new messages (avoid re-renders on every poll)
        const newLastId = fetched.length > 0 ? fetched[fetched.length - 1].id : null;
        if (!initial && newLastId === lastMessageIdRef.current) return prev;
        lastMessageIdRef.current = newLastId;
        return fetched;
      });
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      if (initial) setLoading(false);
    }
  }, [rideId]);

  // Initial load + polling every 3 seconds
  useEffect(() => {
    fetchMessages(true);
    pollingRef.current = setInterval(() => fetchMessages(false), 3000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [fetchMessages]);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  async function handleSend(e) {
    e.preventDefault();
    const text = newMessage.trim();
    if (!text || sending) return;

    setSending(true);
    setNewMessage('');

    // Optimistic message so the sender sees it immediately
    const optimisticId = `opt-${Date.now()}`;
    const optimistic = {
      id: optimisticId,
      ride_id: rideId,
      sender_id: user?.id,
      content: text,
      created_at: new Date().toISOString(),
      sender: { name: profile?.name || 'You' }
    };
    setMessages(prev => [...prev, optimistic]);

    try {
      const res = await api.post('/messages', { ride_id: rideId, content: text });
      // Replace optimistic message with real one from server
      setMessages(prev => prev.map(m => m.id === optimisticId ? res.data : m));
      lastMessageIdRef.current = res.data.id;
    } catch (err) {
      // Remove optimistic message on failure and restore input
      setMessages(prev => prev.filter(m => m.id !== optimisticId));
      setNewMessage(text);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="chat-window" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>⏳ Loading messages...</div>
      </div>
    );
  }

  return (
    <div className="chat-window">
      <div className="chat-header">
        <h4>💬 Group Chat: {rideTitle}</h4>
      </div>
      
      <div className="chat-messages" ref={scrollRef}>
        {messages.length === 0 ? (
          <p className="no-messages">No messages yet. Say hi! 👋</p>
        ) : (
          messages.map(msg => (
            <div 
              key={msg.id} 
              className={`message-bubble ${msg.sender_id === user?.id ? 'own' : ''}`}
            >
              <div className="message-info">
                <span className="sender-name">
                  {msg.sender_id === user?.id ? 'You' : (msg.sender?.name || 'User')}
                </span>
                <span className="message-time">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="message-content">{msg.content}</div>
            </div>
          ))
        )}
      </div>

      <form className="chat-input-area" onSubmit={handleSend}>
        <input 
          type="text" 
          placeholder="Type a message..." 
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          disabled={sending}
          autoComplete="off"
        />
        <button type="submit" disabled={!newMessage.trim() || sending}>
          {sending ? '...' : 'Send'}
        </button>
      </form>
    </div>
  );
}
