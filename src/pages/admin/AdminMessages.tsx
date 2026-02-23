import { useState, useEffect } from 'react';
import { Mail, MailOpen } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export default function AdminMessages() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadMessages(); }, []);

  async function loadMessages() {
    const { data } = await supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false });
    setMessages(data || []);
    setLoading(false);
  }

  async function toggleRead(id: string, current: boolean) {
    await supabase.from('contact_messages').update({ is_read: !current }).eq('id', id);
    loadMessages();
  }

  if (loading) {
    return <div className="animate-pulse"><div className="h-8 bg-brand-surface rounded w-32 mb-4" /><div className="h-40 bg-brand-surface rounded-xl" /></div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-white mb-6">Contact Messages</h1>

      {messages.length === 0 ? (
        <div className="bg-brand-surface rounded-xl border border-white/[0.06] p-10 text-center text-brand-text-muted">No messages</div>
      ) : (
        <div className="space-y-3">
          {messages.map((msg) => (
            <div key={msg.id} className={`bg-brand-surface rounded-xl border p-4 ${msg.is_read ? 'border-white/[0.06]' : 'border-brand-gold/20 bg-brand-gold/[0.02]'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-sm text-white">{msg.name}</span>
                    <span className="text-xs text-brand-text-dim">{msg.email}</span>
                    {!msg.is_read && <span className="w-2 h-2 bg-brand-gold rounded-full" />}
                  </div>
                  <p className="text-sm text-brand-text-muted">{msg.message}</p>
                  <p className="text-xs text-brand-text-dim mt-2">{new Date(msg.created_at).toLocaleString()}</p>
                </div>
                <button
                  onClick={() => toggleRead(msg.id, msg.is_read)}
                  className="p-2 hover:bg-white/[0.06] rounded-lg text-brand-text-dim hover:text-white transition-colors flex-shrink-0"
                  title={msg.is_read ? 'Mark as unread' : 'Mark as read'}
                >
                  {msg.is_read ? <MailOpen size={16} /> : <Mail size={16} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
