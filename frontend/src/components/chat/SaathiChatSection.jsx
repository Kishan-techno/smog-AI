import { useEffect, useRef, useState } from 'react';
import {
  Send,
  Sparkles,
  BookOpen,
  ExternalLink,
  Square,
  RotateCcw,
  Languages,
} from 'lucide-react';
import { getAuthToken, getSessionId } from '../../utils/apiClient';
import { formatTimeIST } from '../../utils/aqiTokens';
import { TiltGlassCard } from '../ui/TiltGlassCard';
import { MagneticButton } from '../ui/MagneticButton';
import { useLanguage } from '../../app/LanguageContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

const STARTER_PROMPTS = {
  auto: [
    'Can kids play outside in Bhopal this evening?',
    'स्कूल जाने के लिए कौन सा मास्क सही है?',
    'Bhopal mein aaj morning walk aur commute ka kya plan rakhein?',
  ],
  en: [
    'Can kids play outside this evening?',
    'Which mask should I use for a two-wheeler commute?',
    'When should I open windows for ventilation today?',
  ],
  hi: [
    'क्या आज बच्चों के लिए शाम को बाहर खेलना सुरक्षित है?',
    'स्कूल और ऑफिस सफर के लिए कौन सा मास्क सही है?',
    'घर की खिड़कियाँ कब खोलना बेहतर रहेगा?',
  ],
  hinglish: [
    'Bhopal mein aaj morning walk karna safe hai?',
    'Two-wheeler commute ke liye N95 mask zaroori hai kya?',
    'Shaam ko ghar ki windows band rakhein ya kholein?',
  ],
};

function formatInlineMarkdown(text) {
  const parts = String(text).split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={idx}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <em key={idx} className="text-slate-600 dark:text-slate-300">
          {part.slice(1, -1)}
        </em>
      );
    }
    return part;
  });
}

function parseSseFrames(buffer) {
  const frames = [];
  const parts = buffer.split('\n\n');
  const remainder = parts.pop() || '';
  for (const raw of parts) {
    let eventName = 'message';
    let dataLine = '';
    for (const line of raw.split('\n')) {
      if (line.startsWith('event:')) eventName = line.slice(6).trim();
      if (line.startsWith('data:')) dataLine += line.slice(5).trim();
    }
    if (dataLine) {
      try {
        frames.push({ event: eventName, data: JSON.parse(dataLine) });
      } catch {
        // Ignore malformed partial chunk
      }
    }
  }
  return { frames, remainder };
}

export function SaathiChatSection({ selectedCity }) {
  const { lang: uiLang, t } = useLanguage();
  const [language, setLanguage] = useState('auto');
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: null,
      citations: [],
    },
  ]);

  useEffect(() => {
    if (uiLang === 'hi' || uiLang === 'hinglish') {
      setLanguage(uiLang);
    } else {
      setLanguage('auto');
    }
  }, [uiLang]);

  const abortRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    const el = listRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  const stopStream = () => {
    abortRef.current?.abort();
    setStreaming(false);
  };

  const sendQuestion = async (rawQuestion) => {
    const question = rawQuestion.trim();
    if (!question || streaming) return;

    setErrorMsg('');
    setInput('');
    const userMsgId = `u-${Date.now()}`;
    const botMsgId = `a-${Date.now()}`;

    setMessages((prev) => [
      ...prev,
      { id: userMsgId, role: 'user', text: question },
      { id: botMsgId, role: 'assistant', text: '', citations: [], sensorContext: null, loading: true },
    ]);

    const controller = new AbortController();
    abortRef.current = controller;
    setStreaming(true);

    try {
      const headers = {
        'Content-Type': 'application/json',
        'x-session-id': getSessionId(),
      };
      const token = getAuthToken();
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/chat/stream`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: question,
          city: selectedCity,
          language,
        }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        const errPayload = await res.json().catch(() => ({}));
        throw new Error(errPayload?.error?.message || `Chat failed (${res.status})`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const { frames, remainder } = parseSseFrames(buffer);
        buffer = remainder;

        for (const frame of frames) {
          if (frame.event === 'meta') {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === botMsgId
                  ? {
                      ...m,
                      citations: frame.data.citations || [],
                      sensorContext: frame.data.sensorContext,
                      mode: frame.data.mode,
                    }
                  : m
              )
            );
          } else if (frame.event === 'token') {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === botMsgId
                  ? { ...m, loading: false, text: m.text + (frame.data.delta || '') }
                  : m
              )
            );
          } else if (frame.event === 'done') {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === botMsgId
                  ? { ...m, loading: false, latencyMs: frame.data.latencyMs }
                  : m
              )
            );
          } else if (frame.event === 'error') {
            throw new Error(frame.data.message || 'Streaming interrupted');
          }
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setErrorMsg(err.message);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === botMsgId
              ? {
                  ...m,
                  loading: false,
                  text: m.text || 'Sorry, I could not fetch a response right now. Please retry.',
                }
              : m
          )
        );
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  const prompts = STARTER_PROMPTS[language] || STARTER_PROMPTS.auto;

  return (
    <section id="assistant" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/35 bg-gradient-to-r from-cyan-500/15 to-violet-500/15 px-3 py-1 text-xs font-semibold text-cyan-600 dark:text-cyan-300">
            <Sparkles className="h-3.5 w-3.5 text-violet-400" />
            {t('chatBadge')}
          </span>
          <h2 className="mt-2 font-display text-2xl font-bold tracking-tight sm:text-3xl">
            {t('chatTitle')}
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{t('chatSub')}</p>
        </div>

        <div className="flex items-center gap-1.5 self-start rounded-xl border border-cyan-500/20 bg-white/60 p-1 dark:border-cyan-400/20 dark:bg-slate-900/75">
          <Languages className="ml-2 h-4 w-4 text-cyan-400" />
          {[
            { id: 'auto', label: 'Auto' },
            { id: 'en', label: 'EN' },
            { id: 'hi', label: 'हिन्दी' },
            { id: 'hinglish', label: 'Hinglish' },
          ].map((lang) => (
            <button
              key={lang.id}
              type="button"
              onClick={() => setLanguage(lang.id)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                language === lang.id
                  ? 'bg-gradient-to-r from-cyan-400 to-violet-500 font-semibold text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>

      <TiltGlassCard gradientBorder disableTilt className="p-4 sm:p-6">
        {/* Starter Chips */}
        <div className="mb-4 flex flex-wrap gap-2">
          {prompts.map((p) => (
            <button
              key={p}
              type="button"
              disabled={streaming}
              onClick={() => sendQuestion(p)}
              className="rounded-full border border-slate-300/70 bg-slate-100/70 px-3 py-1.5 text-xs text-slate-700 transition-colors hover:border-cyan-400/60 hover:text-cyan-600 disabled:opacity-50 dark:border-indigo-500/30 dark:bg-slate-900/75 dark:text-slate-200 dark:hover:text-cyan-300"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Message History */}
        <div
          ref={listRef}
          aria-live="polite"
          className="max-h-[420px] space-y-4 overflow-y-auto rounded-2xl border border-indigo-500/15 bg-slate-100/50 p-4 dark:border-cyan-400/15 dark:bg-[#04081a]/70"
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[78%] ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-cyan-500 via-indigo-500 to-violet-600 font-medium text-white shadow-[0_4px_20px_-6px_rgba(34,211,238,0.5)]'
                    : 'glass-card-strong text-slate-800 dark:text-slate-100'
                }`}
              >
                {msg.loading ? (
                  <span className="inline-flex items-center gap-2 text-xs text-slate-400">
                    <span className="h-2 w-2 animate-ping rounded-full bg-cyan-400" />
                    {t('chatChecking')}
                  </span>
                ) : (
                  <div className="whitespace-pre-line">
                    {formatInlineMarkdown(msg.id === 'welcome' ? t('chatWelcome') : msg.text)}
                  </div>
                )}

                {msg.sensorContext && (
                  <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-slate-200/50 pt-2 text-[11px] text-slate-500 dark:border-slate-700/70 dark:text-slate-400">
                    <span>
                      Grounded: {msg.sensorContext.city} AQI {msg.sensorContext.aqi} (
                      {msg.sensorContext.dataQuality})
                    </span>
                    <span>· {formatTimeIST(msg.sensorContext.stationTimestamp)}</span>
                    {msg.latencyMs != null && <span>· {msg.latencyMs}ms</span>}
                  </div>
                )}
              </div>

              {msg.citations?.length > 0 && (
                <div className="mt-2 flex max-w-[90%] flex-wrap gap-2 sm:max-w-[78%]">
                  {msg.citations.map((cite) => (
                    <a
                      key={cite.id}
                      href={cite.url}
                      target="_blank"
                      rel="noreferrer"
                      title={cite.snippet}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-400/35 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-medium text-cyan-700 hover:bg-cyan-500/20 dark:text-cyan-300"
                    >
                      <BookOpen className="h-3 w-3" />
                      <span>{cite.id}</span>
                      <ExternalLink className="h-3 w-3 opacity-70" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {errorMsg && (
          <div className="mt-3 flex items-center justify-between rounded-xl border border-orange-500/30 bg-orange-500/10 px-3 py-2 text-xs text-orange-500">
            <span>{errorMsg}</span>
            <button
              type="button"
              onClick={() => setErrorMsg('')}
              className="inline-flex items-center gap-1 font-semibold underline"
            >
              <RotateCcw className="h-3 w-3" />
              Dismiss
            </button>
          </div>
        )}

        {/* Prompt Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendQuestion(input);
          }}
          className="mt-4 flex items-center gap-2"
        >
          <label htmlFor="saathi-chat-input" className="sr-only">
            Ask a question in English, Hindi, or Hinglish
          </label>
          <input
            id="saathi-chat-input"
            type="text"
            maxLength={1000}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('chatPlaceholder')}
            className="flex-1 rounded-xl border border-slate-300 bg-white/80 px-4 py-3 text-sm focus:ring-2 focus:ring-cyan-400 dark:border-indigo-500/30 dark:bg-slate-900/80"
          />
          {streaming ? (
            <MagneticButton variant="secondary" onClick={stopStream} aria-label="Stop response">
              <Square className="h-4 w-4 text-orange-400" />
              {t('stopBtn')}
            </MagneticButton>
          ) : (
            <MagneticButton type="submit" disabled={!input.trim()}>
              <Send className="h-4 w-4" />
              {t('askBtn')}
            </MagneticButton>
          )}
        </form>
      </TiltGlassCard>
    </section>
  );
}
