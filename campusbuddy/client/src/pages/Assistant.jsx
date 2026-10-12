import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bot, MapPin, Send, Trash2 } from 'lucide-react';
import RichText from '../components/RichText.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api.js';
import { cn, timeOfDay } from '../lib/format.js';

const PROMPTS = [
  'Where is the library?',
  'What classes do I have today?',
  'Show campus events',
  'Where is Medical Centre?',
  "Today's announcements",
];

function Bubble({ message }) {
  const mine = message.role === 'user';
  return (
    <div className={cn('flex gap-3', mine && 'flex-row-reverse')}>
      {!mine && (
        <span className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-brand text-white">
          <Bot size={16} />
        </span>
      )}
      <div className={cn('max-w-[85%] sm:max-w-[75%]', mine && 'text-right')}>
        <div
          className={cn(
            'inline-block rounded-2xl px-4 py-3 text-left text-sm leading-relaxed shadow-sm',
            mine && 'bg-brand text-white',
            !mine && !message.error && 'border border-line bg-paper',
            message.error && 'border border-red-200 bg-red-50 text-red-700'
          )}
        >
          <RichText text={message.content} />
        </div>

        {message.places?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {message.places.map((p) => (
              <Link
                key={p._id}
                to={`/map?focus=${p._id}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand/5 px-3 py-1.5 text-xs font-semibold text-brand hover:bg-brand/10"
              >
                <MapPin size={13} /> Show {p.name} on map
              </Link>
            ))}
          </div>
        )}

        {message.createdAt && <p className="mt-1 text-[11px] text-muted">{timeOfDay(message.createdAt)}</p>}
      </div>
    </div>
  );
}

export default function Assistant() {
  const { user } = useAuth();
  const firstName = user.name.split(' ')[0];

  const greeting = {
    id: 'greeting',
    role: 'assistant',
    content: `Hello ${firstName}! 👋 I am your CampusBuddy AI Assistant, powered by live campus data.\n\nHow can I help you today? You can ask about course schedules, library opening hours, exam timetables, or building locations.`,
    places: [],
  };

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    api
      .get('/chat/history')
      .then((data) => setMessages(data.messages))
      .catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, sending]);

  async function send(text) {
    const content = text.trim();
    if (!content || sending) return;

    setInput('');
    setSending(true);
    setMessages((m) => [...m, { id: `tmp-${Date.now()}`, role: 'user', content, createdAt: new Date().toISOString() }]);

    try {
      const data = await api.post('/chat', { message: content });
      setMessages((m) => [...m, data.message]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        { id: `err-${Date.now()}`, role: 'assistant', content: err.message, error: true, places: [] },
      ]);
    } finally {
      setSending(false);
    }
  }

  async function clearChat() {
    if (!window.confirm('Clear this conversation?')) return;
    try {
      await api.delete('/chat/history');
      setMessages([]);
    } catch {
      /* keep the messages if clearing failed */
    }
  }

  return (
    <div className="mx-auto flex h-full max-w-4xl flex-col">
      <div className="card flex min-h-0 flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b border-line px-5 py-3">
          <div className="flex items-center gap-2">
            <h1 className="font-semibold">CampusBuddy AI</h1>
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold uppercase text-green-700">
              Live
            </span>
          </div>
          <button
            onClick={clearChat}
            disabled={messages.length === 0}
            className="rounded-lg p-2 text-muted hover:bg-black/5 disabled:opacity-40"
            aria-label="Clear conversation"
            title="Clear conversation"
          >
            <Trash2 size={16} />
          </button>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-5" aria-live="polite">
          <Bubble message={greeting} />
          {messages.map((m) => (
            <Bubble key={m.id} message={m} />
          ))}

          {sending && (
            <div className="flex items-center gap-3">
              <span className="flex size-8 items-center justify-center rounded-full bg-brand text-white">
                <Bot size={16} />
              </span>
              <div className="flex gap-1 rounded-2xl border border-line bg-paper px-4 py-3" aria-label="CampusBuddy AI is typing">
                {[0, 150, 300].map((delay) => (
                  <span
                    key={delay}
                    className="size-1.5 animate-bounce rounded-full bg-muted"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-line p-3 sm:p-4">
          <div className="no-scrollbar mb-3 flex gap-2 overflow-x-auto">
            <span className="shrink-0 self-center text-[10px] font-semibold uppercase tracking-wider text-muted">
              Prompts
            </span>
            {PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => send(p)}
                disabled={sending}
                className="shrink-0 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-medium hover:border-brand hover:text-brand disabled:opacity-50"
              >
                {p}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex gap-2"
          >
            <input
              className="input"
              placeholder="Ask CampusBuddy AI anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={1000}
              aria-label="Message CampusBuddy AI"
            />
            <button className="btn-primary shrink-0" disabled={sending || !input.trim()}>
              <Send size={16} /> <span className="hidden sm:inline">Send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
