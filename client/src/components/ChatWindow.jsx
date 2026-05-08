import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../api';
import { useAuthStore } from '../store/authStore';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, MessageCircle, UserX, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ChatWindow({ rideId, rideTitle }) {
  const { user, profile } = useAuthStore();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);
  const pollingRef = useRef(null);
  const lastMessageIdRef = useRef(null);

  const fetchMessages = useCallback(async (initial = false) => {
    try {
      const res = await api.get(`/messages/${rideId}`);
      const fetched = res.data || [];
      setMessages(prev => {
        const newLastId = fetched.length > 0 ? fetched[fetched.length - 1].id : null;
        if (!initial && newLastId === lastMessageIdRef.current) return prev;
        lastMessageIdRef.current = newLastId;
        return fetched;
      });
    } catch (err) { console.error('Failed to fetch messages:', err); } finally { if (initial) setLoading(false); }
  }, [rideId]);

  useEffect(() => {
    fetchMessages(true);
    pollingRef.current = setInterval(() => fetchMessages(false), 3000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [fetchMessages]);

  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  }, [messages]);

  async function handleSend(e) {
    e.preventDefault();
    const text = newMessage.trim();
    if (!text || sending) return;
    setSending(true);
    setNewMessage('');
    const optimisticId = `opt-${Date.now()}`;
    const optimistic = { id: optimisticId, ride_id: rideId, sender_id: user?.id, content: text, created_at: new Date().toISOString(), sender: { name: profile?.name || 'You' } };
    setMessages(prev => [...prev, optimistic]);
    try {
      const res = await api.post('/messages', { ride_id: rideId, content: text });
      setMessages(prev => prev.map(m => m.id === optimisticId ? res.data : m));
      lastMessageIdRef.current = res.data.id;
    } catch (err) {
      setMessages(prev => prev.filter(m => m.id !== optimisticId));
      setNewMessage(text);
    } finally { setSending(false); }
  }

  if (loading) return <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Loading chat...</div>;

  return (
    <div className="flex flex-col h-full bg-card border border-border rounded-xl overflow-hidden shadow-2xl">
      <div className="p-4 bg-muted/50 border-b border-border flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <MessageCircle className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h4 className="font-bold text-white text-sm truncate">{rideTitle}</h4>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Group Discussion</p>
        </div>
      </div>

      <ScrollArea ref={scrollRef} className="flex-1 p-4 space-y-4">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-center space-y-2">
              <MessageCircle className="w-12 h-12 opacity-10" />
              <p className="text-sm font-medium">No messages yet</p>
              <p className="text-xs">Coordinate with your co-riders here.</p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isOwn = msg.sender_id === user?.id;
              const isCancelled = msg.sender_status === 'cancelled';
              return (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  key={msg.id || idx} 
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] space-y-1 ${isOwn ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-2 px-1">
                      <span className="text-[10px] font-bold text-muted-foreground">
                        {isOwn ? 'You' : (isCancelled ? 'Cancelled Rider' : (msg.sender?.name || 'User'))}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className={`p-3 rounded-2xl text-sm ${
                      isOwn 
                        ? 'bg-primary text-white rounded-tr-none' 
                        : isCancelled 
                          ? 'bg-red-500/10 border border-red-500/20 text-red-400 italic rounded-tl-none' 
                          : 'bg-muted text-muted-foreground border border-border rounded-tl-none'
                    }`}>
                      {isCancelled && <UserX className="inline-block w-3 h-3 mr-1 mb-0.5" />}
                      {msg.content}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </ScrollArea>

      <form onSubmit={handleSend} className="p-4 bg-muted/30 border-t border-border flex gap-2">
        <Input 
          placeholder="Message co-riders..." 
          className="flex-1 bg-card border-border text-white placeholder:text-muted-foreground focus:ring-primary"
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          disabled={sending}
          autoComplete="off"
        />
        <Button 
          type="submit" 
          size="icon" 
          disabled={!newMessage.trim() || sending}
          className="bg-primary hover:bg-primary shrink-0"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </form>
    </div>
  );
}
