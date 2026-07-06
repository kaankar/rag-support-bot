'use client';

import { useState } from 'react';

type Message = { role: 'user' | 'assistant'; content: string };

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  async function sendMessage() {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const newMessages: Message[] = [...messages, { role: 'user', content: trimmed }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!res.body) throw new Error('No stream');

      setMessages([...newMessages, { role: 'assistant', content: '' }]);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages([...newMessages, { role: 'assistant', content: acc }]);
      }
    } catch {
      setMessages([...newMessages, { role: 'assistant', content: 'Connection error.' }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex h-screen max-w-2xl flex-col p-4">
      <h1 className="mb-4 text-xl font-semibold">Luna &amp; Co. — Support Assistant</h1>

      <div className="flex-1 space-y-4 overflow-y-auto">
        {messages.length === 0 && (
          <p className="text-gray-400">Ask me about orders, shipping, returns, sizing, or care.</p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'text-right' : 'text-left'}>
            <span
              className={
                'inline-block max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2 ' +
                (m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900')
              }
            >
              {m.content}
            </span>
          </div>
        ))}
        {loading && <div className="text-left text-gray-400">Typing…</div>}
      </div>

      <div className="mt-4 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type your question…"
          className="flex-1 rounded-full border border-gray-300 px-4 py-2 outline-none focus:border-blue-500"
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          className="rounded-full bg-blue-600 px-5 py-2 text-white disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </main>
  );
}