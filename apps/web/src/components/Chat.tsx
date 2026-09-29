'use client';

import { useEffect, useRef, useState } from 'react';
import { messageQueries, type Message } from '@ondigo/shared';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { useAuth } from '@/lib/AuthProvider';
import { Button } from './Button';

export function Chat({ deliveryId }: { deliveryId: string }) {
  const { user } = useAuth();
  const client = getSupabaseClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messageQueries.listMessages(client, deliveryId).then(setMessages);
    const unsubscribe = messageQueries.subscribeToMessages(client, deliveryId, (m) =>
      setMessages((prev) => [...prev, m])
    );
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deliveryId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!body.trim() || !user) return;
    setBody('');
    await messageQueries.sendMessage(client, deliveryId, user.id, body.trim());
  };

  return (
    <div className="flex h-96 flex-col border border-line">
      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[75%] px-3 py-2 text-sm ${
              m.sender_id === user?.id ? 'ml-auto bg-ink text-paper' : 'bg-line/40 text-ink'
            }`}
          >
            {m.body}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="flex gap-2 border-t border-line p-3"
      >
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Message about pickup/dropoff…"
          className="flex-1 rounded-full border border-line px-4 py-2 text-sm focus:border-ink focus:outline-none"
        />
        <Button type="submit">Send</Button>
      </form>
    </div>
  );
}
