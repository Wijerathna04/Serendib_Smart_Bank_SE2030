import React, { useState, useRef, useEffect } from 'react';
import { send, date } from '../api/client';
import { useApi, Heading, Panel, Field, ErrorMessage, Pagination, Loading, Empty } from '../components/ui';
import type { Page } from '../types/api';

interface Message {
  chatId: number;
  question: string;
  response: string;
  createdAt: string;
}

export default function AssistantPage() {
  const [question, setQuestion] = useState('');
  const [page, setPage] = useState(0);
  const [revision, setRevision] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [sessionMessages, setSessionMessages] = useState<
    { id: string; sender: 'bot' | 'user'; text: string; time: string; card?: any }[]
  >([
    {
      id: 'welcome-concierge',
      sender: 'bot',
      text: 'Good day. I am your Serendib Sovereign AI Concierge. I can assist you with real-time balance inquiries, initiating CEFT transfers, scheduling utility payments, or checking your active credit limits.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const chatStreamRef = useRef<HTMLDivElement>(null);
  const result = useApi<Page<Message>>(`/api/assistant/messages?page=${page}`, revision);

  useEffect(() => {
    chatStreamRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sessionMessages]);

  const quickPrompts = [
    'What is my available balance?',
    'How do I transfer funds via CEFT?',
    'Apply for Sovereign Credit Card',
    'How do fixed deposits work?',
    'What is the 24/7 Hotline number?'
  ];

  async function submitQuestion(qText?: string) {
    const textToSend = qText || question;
    if (!textToSend.trim()) return;

    const userMsg = {
      id: String(Date.now()),
      sender: 'user' as const,
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setSessionMessages((prev) => [...prev, userMsg]);
    if (!qText) setQuestion('');
    setBusy(true);
    setError(null);

    try {
      const res = await send<{ response: string }>('/api/assistant/messages', { question: textToSend });
      const botMsg = {
        id: String(Date.now() + 1),
        sender: 'bot' as const,
        text: res.response || 'Guidance processed successfully.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setSessionMessages((prev) => [...prev, botMsg]);
      setRevision((r) => r + 1);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }

  function handleDownloadTranscript() {
    const text = sessionMessages.map((m) => `[${m.time}] ${m.sender.toUpperCase()}: ${m.text}`).join('\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `serendib_ai_concierge_transcript_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleClearSession() {
    if (confirm('Clear active chat session history from screen?')) {
      setSessionMessages([
        {
          id: 'welcome-concierge-reset',
          sender: 'bot',
          text: 'Session reset. How may I be of service today?',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  }

  return (
    <div className="sovereign-ai-concierge-page">
      {/* 1. Header Protocol Bar (Extracted from Stitch design) */}
      <div className="flex flex-col md:flex-row md:items-end justify-between pb-4 mb-6 border-b border-white/10 gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/10 text-[#ecc246] text-xs font-semibold uppercase tracking-widest border border-[#ecc246]/20">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ecc246] animate-pulse"></span>
              Private Banking Advisory Protocol
            </span>
            <span className="text-xs text-neutral-400">Session ID: SRN-8902-E2E</span>
          </div>
          <Heading title="Serendib AI Concierge" subtitle="Your private sovereign banking assistant — real-time advisory, navigation guidance, and institutional knowledge." />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1e1f25] text-xs text-[#d1c5af] border border-white/10 shadow-sm">
            <span className="text-[#ecc246]">🛡️</span>
            <span className="font-semibold tracking-wider uppercase">Tier 4 Clearance</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1e1f25] text-xs text-[#d1c5af] border border-white/10 shadow-sm">
            <span className="text-[#ddc582]">✓</span>
            <span>Biometric Sync Active</span>
          </div>
        </div>
      </div>

      <ErrorMessage error={error || result.error} />

      {/* 2. Main Concierge Container (Extracted from Stitch design) */}
      <div className="relative w-full rounded-2xl bg-[#0d0e13] border border-white/10 shadow-2xl overflow-hidden mb-8">
        {/* Top Control Bar */}
        <div className="px-6 py-4 bg-[#1a1b21]/95 backdrop-blur-md flex flex-wrap items-center justify-between gap-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#c9a227] to-[#ecc246] text-black flex items-center justify-center font-bold text-lg shadow-lg">
              🤖
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#e3e1e9]">Serendib AI Concierge</span>
                <span className="px-2 py-0.5 rounded-full bg-[#584711] text-[#ddc582] text-[10px] font-bold tracking-wider uppercase">
                  v4.8 Core
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#99907b]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>Online • 256-Bit Encrypted Session</span>
                <span>•</span>
                <span>Latency: 14ms</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="px-3.5 py-1.5 rounded-full bg-[#1e1f25] hover:bg-[#292a2f] text-xs text-[#d1c5af] hover:text-[#e3e1e9] transition-colors flex items-center gap-1.5 border border-white/10"
              onClick={handleClearSession}
            >
              <span>🗑️</span> Clear Session
            </button>
            <button
              type="button"
              className="px-3.5 py-1.5 rounded-full bg-[#1e1f25] hover:bg-[#292a2f] text-xs text-[#d1c5af] hover:text-[#e3e1e9] transition-colors flex items-center gap-1.5 border border-white/10"
              onClick={handleDownloadTranscript}
            >
              <span>📥</span> Download Transcript
            </button>
          </div>
        </div>

        {/* Live Conversation Feed */}
        <div className="p-6 max-h-[500px] min-h-[380px] overflow-y-auto space-y-6 bg-[#0d0e13]">
          <div className="text-center">
            <span className="text-[11px] uppercase tracking-widest text-[#99907b] bg-[#1a1b21] px-4 py-1 rounded-full border border-white/5">
              Authenticated via Ceylon Sovereign Vault Pass
            </span>
          </div>

          {sessionMessages.map((m) => (
            <div
              key={m.id}
              className={`flex items-start gap-3 ${m.sender === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-md ${
                  m.sender === 'user'
                    ? 'bg-[#ecc246] text-black font-bold'
                    : 'bg-gradient-to-br from-[#c9a227] to-[#ddc582] text-black font-bold'
                }`}
              >
                {m.sender === 'user' ? '👤' : '🤖'}
              </div>

              <div className={`max-w-2xl flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center gap-2 mb-1 text-xs">
                  <span className={`font-semibold ${m.sender === 'user' ? 'text-[#ecc246]' : 'text-[#ddc582]'}`}>
                    {m.sender === 'user' ? 'You' : 'AI Concierge'}
                  </span>
                  <span className="text-[#99907b]">{m.time}</span>
                </div>

                <div
                  className={`p-4 rounded-2xl text-sm leading-relaxed shadow-lg ${
                    m.sender === 'user'
                      ? 'bg-gradient-to-br from-[#c9a227] to-[#ecc246] text-black font-medium'
                      : 'bg-[#1a1b21] border border-white/10 text-[#e3e1e9]'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.text}</p>
                </div>
              </div>
            </div>
          ))}

          {busy && (
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-[#c9a227] text-black flex items-center justify-center font-bold">
                🤖
              </div>
              <div className="p-4 rounded-2xl bg-[#1a1b21] border border-white/10 text-xs text-[#ddc582] animate-pulse">
                AI Concierge is processing your advisory request...
              </div>
            </div>
          )}

          <div ref={chatStreamRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-6 py-3 bg-[#121318] border-t border-white/10 flex flex-wrap gap-2">
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              className="px-3 py-1 rounded-full bg-[#1e1f25] hover:bg-[#c9a227]/20 hover:text-[#ecc246] text-xs text-[#d1c5af] transition-all border border-white/10"
              onClick={() => submitQuestion(prompt)}
            >
              💬 {prompt}
            </button>
          ))}
        </div>

        {/* Question Submission Input Bar */}
        <form
          className="p-4 bg-[#1a1b21] border-t border-white/10 flex items-center gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            submitQuestion();
          }}
        >
          <input
            type="text"
            className="flex-1 bg-[#0d0e13] border border-white/10 rounded-full px-5 py-3 text-sm text-[#e3e1e9] focus:outline-none focus:border-[#ecc246] italic"
            placeholder="Type your question or request guidance..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
          <button
            type="submit"
            className="px-6 py-3 rounded-full bg-gradient-to-r from-[#c9a227] to-[#ecc246] text-black font-semibold text-sm hover:shadow-[0_0_16px_rgba(236,194,70,0.4)] transition-all disabled:opacity-50"
            disabled={busy || !question.trim()}
          >
            {busy ? 'Processing...' : 'Send Request'}
          </button>
        </form>
      </div>

      {/* 3. History Panel */}
      <Panel title="Saved Advisory History">
        {result.loading ? (
          <Loading />
        ) : (
          result.data && (
            <>
              {result.data.content.map((m) => (
                <article className="feedback-item mb-3 p-4 bg-[#1e1f25] rounded-xl border border-white/10" key={m.chatId}>
                  <small className="text-[#99907b] block mb-1">{date(m.createdAt)}</small>
                  <h3 className="font-semibold text-[#ecc246] mb-1">Q: {m.question}</h3>
                  <p className="text-[#e3e1e9] text-sm leading-relaxed">{m.response}</p>
                </article>
              ))}
              {!result.data.content.length && <Empty>Your past guidance history will be safely recorded here.</Empty>}
              <Pagination data={result.data} onPage={setPage} />
            </>
          )
        )}
      </Panel>
    </div>
  );
}

