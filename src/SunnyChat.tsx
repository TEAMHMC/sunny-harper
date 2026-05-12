import React, { useState, useRef, useEffect, useCallback } from 'react';

export interface SunnyConfig {
  lang?: 'en' | 'es';
  position?: 'bottom-right' | 'bottom-left';
  primaryColor?: string;
  logoUrl?: string;
  volunteerPortalUrl?: string;
  onLiveChatRequest?: (sessionId: string, messages: Message[]) => void;
}

interface Message {
  id: string;
  type: 'user' | 'bot' | 'system';
  content: string;
  timestamp: Date;
  senderName?: string;
}

interface HandoffState {
  active: boolean;
  category: string;
  awaitingContact: boolean;
  contact?: string;
}

const SUNNY_API_ENDPOINT = 'https://hmc-volunteer-portal-172668994130.us-central1.run.app/api/sunny/chat';
const SUNNY_HANDOFF_ENDPOINT = 'https://hmc-volunteer-portal-172668994130.us-central1.run.app/api/sunny/handoff';
const SUNNY_MEMORY_ENDPOINT = 'https://hmc-volunteer-portal-172668994130.us-central1.run.app/api/sunny/memory';

const DEFAULT_CONFIG: Required<SunnyConfig> = {
  lang: 'en',
  position: 'bottom-right',
  primaryColor: '#233dff',
  logoUrl: 'https://cdn.prod.website-files.com/67359e6040140078962e8a54/6912e29e5710650a4f45f53f_Untitled%20(256%20x%20256%20px).png',
  volunteerPortalUrl: 'https://volunteer.healthmatters.clinic',
  onLiveChatRequest: () => {},
};


const QUICK_ACTIONS = [
  { label: 'Events This May',  labelEs: 'Eventos en Mayo',  query: 'What events are happening this May for Take Action LA?' },
  { label: 'Mental Health',    labelEs: 'Salud Mental',     query: 'I need mental health support' },
  { label: 'Find Resources',   labelEs: 'Recursos',         query: 'I need help finding resources near me' },
  { label: 'Check Yourself',   labelEs: 'Autoevaluacion',   query: 'I want to check in on my mental health' },
  { label: 'Volunteer',        labelEs: 'Voluntariado',     query: 'I want to volunteer with Health Matters Clinic' },
  { label: 'Housing',          labelEs: 'Vivienda',         query: 'I need help with housing' },
  { label: 'Talk to Someone',  labelEs: 'Hablar',           query: '__handoff__' },
];

const TEXT = {
  en: {
    greeting: "Hey, I am Sunny. What brings you here today?",
    placeholder: 'Type your message...',
    send: 'Send',
    powered_by: 'Powered by Health Matters Clinic',
    typing: 'Sunny is typing...',
    quick_help: 'Quick Help',
    online: 'Online now',
    new_chat: 'New conversation',
    minimize: 'Minimize chat',
    open: 'Chat with Sunny',
    handoff_prompt: 'What is the best way to reach you — email or phone number?',
    handoff_confirm: 'I will make sure the right person gets this.',
    error: 'Sorry, I\'m having trouble right now. Browse our Resource Directory or Event Finder to find what you need — or call 988 for immediate support.',
    clear_chat: 'Clear chat',
  },
  es: {
    greeting: 'Hola, soy Sunny. Que te trae por aqui hoy?',
    placeholder: 'Escribe tu mensaje...',
    send: 'Enviar',
    powered_by: 'Desarrollado por Health Matters Clinic',
    typing: 'Sunny esta escribiendo...',
    quick_help: 'Ayuda Rapida',
    online: 'En linea',
    new_chat: 'Nueva conversacion',
    minimize: 'Minimizar chat',
    open: 'Chatear con Sunny',
    handoff_prompt: 'Cual es la mejor manera de contactarte — correo electronico o numero de telefono?',
    handoff_confirm: 'Me asegurare de que la persona correcta reciba esto.',
    error: 'Lo siento, estoy teniendo problemas ahora mismo. Busca en nuestro Directorio de Recursos o en el Buscador de Eventos — o llama al 988 para apoyo inmediato.',
    clear_chat: 'Borrar chat',
  },
};

function renderMessageContent(text: string, isUser: boolean): React.ReactNode {
  if (isUser) return text;
  // Match full https:// URLs or bare healthmatters.clinic / eventfinder.healthmatters.clinic paths
  const urlRegex = /(https?:\/\/[^\s)>\]]+|(?:eventfinder\.)?healthmatters\.clinic\/[^\s)>\]]*)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, i) => {
    const isUrl = /^https?:\/\//.test(part) || /^(?:eventfinder\.)?healthmatters\.clinic\//.test(part);
    if (!isUrl) return part;
    const href = part.startsWith('http') ? part : `https://${part}`;
    return (
      <a key={i} href={href} target="_blank" rel="noopener noreferrer"
        style={{ color: '#233dff', textDecoration: 'underline', overflowWrap: 'anywhere', wordBreak: 'break-all', display: 'inline' }}>
        {part}
      </a>
    );
  });
}

function detectLang(text: string): 'en' | 'es' {
  const esSignals = /\b(hola|gracias|por favor|necesito|ayuda|como|que|donde|cuando|tengo|quiero|puedo|para|con|una|uno|los|las|esta|esto|estoy|tengo|me|si)\b/i;
  return esSignals.test(text) ? 'es' : 'en';
}

export const SunnyChat: React.FC<SunnyConfig> = (props) => {
  const config = { ...DEFAULT_CONFIG, ...props };
  const { position, primaryColor, logoUrl } = config;

  const [sessionId] = useState<string>(() => {
    try {
      const stored = localStorage.getItem('sunny_session_id');
      if (stored) return stored;
      const newId = `sunny-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('sunny_session_id', newId);
      return newId;
    } catch {
      return `sunny-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
  });

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const stored = localStorage.getItem('sunny_messages');
      if (!stored) return [];
      const parsed: Message[] = JSON.parse(stored);
      if (!parsed.length) return [];
      const lastMsg = new Date(parsed[parsed.length - 1].timestamp);
      const hoursSince = (Date.now() - lastMsg.getTime()) / 3600000;
      if (hoursSince > 4) return [];
      return parsed.map(m => ({ ...m, timestamp: new Date(m.timestamp) }));
    } catch { return []; }
  });

  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [detectedLang, setDetectedLang] = useState<'en' | 'es'>(config.lang);
  const [handoff, setHandoff] = useState<HandoffState>({ active: false, category: 'general', awaitingContact: false });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const announcerRef = useRef<HTMLDivElement>(null);
  const isReturningUser = messages.length > 0;

  const lang = detectedLang;
  const text = TEXT[lang];

  // Persist messages
  useEffect(() => {
    try {
      localStorage.setItem('sunny_messages', JSON.stringify(messages.slice(-15)));
    } catch {}
  }, [messages]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ARIA live region announcement for new bot messages
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.type === 'bot' && announcerRef.current) {
      announcerRef.current.textContent = lastMsg.content;
    }
  }, [messages]);

  // Greeting on first open
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setTimeout(() => {
        setMessages([
          {
            id: 'greeting',
            type: 'bot',
            content: text.greeting,
            timestamp: new Date(),
            senderName: 'Sunny',
          },
        ]);
      }, 300);
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Focus input on open
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen]);

  const addBotMessage = useCallback((content: string) => {
    setMessages(prev => [...prev, {
      id: `bot-${Date.now()}`,
      type: 'bot',
      content,
      timestamp: new Date(),
      senderName: 'Sunny',
    }]);
  }, []);

  const triggerHandoff = useCallback((category = 'general') => {
    setHandoff({ active: true, category, awaitingContact: true });
    addBotMessage(text.handoff_prompt);
  }, [addBotMessage, text.handoff_prompt]);

  const submitHandoff = useCallback(async (contact: string) => {
    // Validate: must contain @ (email) or at least 7 digits (phone)
    const hasEmail = contact.includes('@');
    const hasPhone = (contact.replace(/\D/g, '').length >= 7);
    if (!hasEmail && !hasPhone) {
      addBotMessage(lang === 'es'
        ? 'Por favor ingresa un correo electronico o numero de telefono valido.'
        : 'Please enter a valid email address or phone number.');
      return;
    }

    setHandoff(prev => ({ ...prev, awaitingContact: false }));
    const transcript = messages.slice(-15).map(m => ({ type: m.type, content: m.content }));
    const summary = messages.filter(m => m.type === 'user').slice(-3).map(m => m.content).join(' | ');
    try {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 10000)
      );
      const fetchPromise = fetch(SUNNY_HANDOFF_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, category: handoff.category, transcript, summary, userContact: contact, lang }),
      });
      const res = await Promise.race([fetchPromise, timeoutPromise]);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      addBotMessage(
        lang === 'es'
          ? `Listo. Alguien del equipo de Health Matters Clinic se pondra en contacto contigo pronto. ${text.handoff_confirm}`
          : `Done. Someone from the Health Matters Clinic team will be in touch soon. ${text.handoff_confirm}`
      );
    } catch {
      addBotMessage(text.error);
    }
    setHandoff({ active: false, category: 'general', awaitingContact: false });
  }, [messages, sessionId, handoff.category, lang, addBotMessage, text]);

  const handleSendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;
    if (isTyping) return;

    // Detect language from first user message
    if (messages.filter(m => m.type === 'user').length === 0) {
      const detected = detectLang(content);
      setDetectedLang(detected);
    }

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setShowQuickActions(false);
    setIsTyping(true);

    // "Forget me" command — clear memory and session
    const lower = content.toLowerCase().trim();
    if (['forget me', 'delete my data', 'clear my history', 'forget everything'].some(cmd => lower.includes(cmd))) {
      try {
        await fetch(`${SUNNY_MEMORY_ENDPOINT}/${sessionId}`, { method: 'DELETE' });
        localStorage.removeItem('sunny_messages');
        localStorage.removeItem('sunny_session_id');
      } catch {}
      setIsTyping(false);
      setMessages([{
        id: `bot-${Date.now()}`,
        type: 'bot',
        content: lang === 'es'
          ? 'Listo. Tus datos de sesion de Sunny han sido eliminados. No retendre nada de esta conversacion en sesiones futuras.'
          : 'Done. Your Sunny session data has been cleared. I will not retain anything from this conversation in future sessions.',
        timestamp: new Date(),
        senderName: 'Sunny',
      }]);
      return;
    }

    // Handoff contact collection
    if (handoff.awaitingContact) {
      setIsTyping(false);
      await submitHandoff(content.trim());
      return;
    }

    // Route everything through Claude
    try {
      const history = messages.filter(m => m.type !== 'system').slice(-12).map(m => ({
        type: m.type === 'user' ? 'user' : 'bot',
        content: m.content,
      }));

      const res = await fetch(SUNNY_API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content.trim(),
          history,
          lang,
          sessionId,
          pageUrl: typeof window !== 'undefined' ? window.location.href : undefined,
          pageTitle: typeof window !== 'undefined' ? document.title : undefined,
          pageContext: typeof window !== 'undefined' ? (window as any).__sunnyPageContext : undefined,
        }),
        signal: AbortSignal.timeout(22000),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data.reply) throw new Error('Empty reply');

      // Strip markdown formatting — chat renders plain text with inline links
      const cleaned = data.reply
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .replace(/^#{1,3}\s/gm, '')
        .trim();

      addBotMessage(cleaned);
    } catch (e) {
      addBotMessage(text.error);
    }

    setIsTyping(false);
  }, [messages, lang, sessionId, handoff.awaitingContact, submitHandoff, addBotMessage, text.error]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputValue);
    }
  };

  const positionStyle = position === 'bottom-right'
    ? { right: '1rem' }
    : { left: '1rem' };

  return (
    <>
      {/* ARIA live region for screen readers */}
      <div
        ref={announcerRef}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap' }}
      />

      {/* Chat toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{ ...positionStyle, position: 'fixed', bottom: '1rem', zIndex: 9999, width: '56px', height: '56px', borderRadius: '50%', backgroundColor: primaryColor, color: 'white', border: '1.5px solid black', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s' }}
        aria-label={isOpen ? TEXT.en.minimize : TEXT.en.open}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
      >
        {isOpen ? (
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
        {!isOpen && !isReturningUser && (
          <span style={{ position: 'absolute', top: 0, right: 0, width: '12px', height: '12px', backgroundColor: '#ef4444', borderRadius: '50%', border: '2px solid white' }} aria-hidden="true" />
        )}
      </button>

      {/* Chat window */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Chat with Sunny, Health Matters Clinic AI assistant"
          aria-modal="false"
          style={{
            ...positionStyle,
            position: 'fixed',
            bottom: '80px',
            zIndex: 9998,
            width: 'min(400px, calc(100vw - 2rem))',
            height: 'min(580px, calc(100dvh - 120px))',
            backgroundColor: 'white',
            borderRadius: '16px',
            border: '1.5px solid black',
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'sunnySlideUp 0.25s ease-out',
          }}
        >
          {/* Header */}
          <div style={{ backgroundColor: primaryColor, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <img src={logoUrl} alt="" aria-hidden="true" style={{ width: '44px', height: '44px', borderRadius: '50%', border: '2px solid white', backgroundColor: 'white', objectFit: 'contain' }} />
              <span style={{ position: 'absolute', bottom: '1px', right: '1px', width: '10px', height: '10px', backgroundColor: '#4ade80', borderRadius: '50%', border: '2px solid white' }} aria-hidden="true" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, color: 'white', fontWeight: 700, fontSize: '16px' }}>Sunny</p>
              <p style={{ margin: 0, color: 'rgba(255,255,255,0.8)', fontSize: '11px' }}>{text.online}</p>
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              {isReturningUser && (
                <button
                  onClick={() => {
                    try { localStorage.removeItem('sunny_messages'); } catch {}
                    setMessages([]);
                    setShowQuickActions(true);
                    setTimeout(() => {
                      setMessages([
                        { id: 'greeting-new', type: 'bot', content: text.greeting, timestamp: new Date(), senderName: 'Sunny' },
                      ]);
                    }, 300);
                  }}
                  style={{ width: '32px', height: '32px', borderRadius: '50%', border: 'none', background: 'transparent', color: 'rgba(255,255,255,0.75)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  aria-label={text.new_chat}
                  title={text.new_chat}
                >
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                style={{ width: '32px', height: '32px', borderRadius: '50%', border: 'none', background: 'transparent', color: 'rgba(255,255,255,0.8)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                aria-label={text.minimize}
              >
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div
            role="log"
            aria-label="Conversation with Sunny"
            aria-live="off"
            style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: '#f9fafb' }}
          >
            {messages.map((message) => (
              <div key={message.id} style={{ display: 'flex', justifyContent: message.type === 'user' ? 'flex-end' : message.type === 'system' ? 'center' : 'flex-start' }}>
                {message.type === 'system' ? (
                  <p style={{ fontSize: '11px', color: '#6b7280', textAlign: 'center', maxWidth: '90%', margin: 0, lineHeight: 1.5 }}>
                    {renderMessageContent(message.content, false)}
                  </p>
                ) : (
                  <div
                    style={{
                      maxWidth: '85%',
                      padding: '10px 14px',
                      borderRadius: message.type === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      backgroundColor: message.type === 'user' ? primaryColor : 'white',
                      color: message.type === 'user' ? 'white' : '#1f2937',
                      border: message.type === 'user' ? '1.5px solid black' : '1px solid #e5e7eb',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                    }}
                  >
                    {message.type === 'bot' && message.senderName && (
                      <p style={{ margin: '0 0 4px 0', fontSize: '11px', fontWeight: 600, color: primaryColor }}>{message.senderName}</p>
                    )}
                    <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.55, whiteSpace: 'pre-wrap', color: 'inherit', overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
                      {renderMessageContent(message.content, message.type === 'user')}
                    </p>
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '16px 16px 16px 4px', padding: '12px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }} aria-label={text.typing} role="status">
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    {[0, 150, 300].map(delay => (
                      <span key={delay} style={{ width: '7px', height: '7px', backgroundColor: '#9ca3af', borderRadius: '50%', display: 'inline-block', animation: `sunnyBounce 1.2s ${delay}ms infinite` }} aria-hidden="true" />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick actions */}
          {showQuickActions && messages.length <= 1 && (
            <div style={{ padding: '10px 12px', backgroundColor: 'white', borderTop: '1px solid #e5e7eb' }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '10px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{text.quick_help}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {QUICK_ACTIONS.map((action, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      if (action.query === '__handoff__') {
                        triggerHandoff('general');
                        setMessages(prev => [...prev, { id: `user-qa-${idx}`, type: 'user', content: lang === 'en' ? action.label : action.labelEs, timestamp: new Date() }]);
                        setShowQuickActions(false);
                      } else {
                        handleSendMessage(lang === 'en' ? action.query : action.labelEs);
                      }
                    }}
                    style={{ padding: '5px 12px', backgroundColor: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '20px', fontSize: '12px', fontWeight: 600, color: '#374151', cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    {lang === 'en' ? action.label : action.labelEs}
                  </button>
                ))}
                <button
                  onClick={() => {
                    try { localStorage.removeItem('sunny_messages'); } catch {}
                    try { localStorage.removeItem('sunny_session_id'); } catch {}
                    setMessages([]);
                    setShowQuickActions(true);
                    setTimeout(() => {
                      setMessages([
                        { id: 'greeting-clear', type: 'bot', content: text.greeting, timestamp: new Date(), senderName: 'Sunny' },
                      ]);
                    }, 300);
                  }}
                  style={{ padding: '5px 12px', backgroundColor: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '20px', fontSize: '12px', fontWeight: 600, color: '#374151', cursor: 'pointer', whiteSpace: 'nowrap' }}
                >
                  {text.clear_chat}
                </button>
              </div>
            </div>
          )}

          {/* Input */}
          <div style={{ padding: '10px 12px', paddingBottom: 'max(10px, calc(10px + env(safe-area-inset-bottom, 0px)))', backgroundColor: 'white', borderTop: '1px solid #e5e7eb' }}>
            <form
              onSubmit={(e) => { e.preventDefault(); handleSendMessage(inputValue); }}
              style={{ display: 'flex', gap: '8px', alignItems: 'center' }}
              role="search"
              aria-label="Send a message to Sunny"
            >
              <label htmlFor="sunny-input" style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>
                Message Sunny
              </label>
              <input
                id="sunny-input"
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={handoff.awaitingContact ? text.handoff_prompt : text.placeholder}
                autoComplete="off"
                aria-label={text.placeholder}
                style={{ flex: 1, backgroundColor: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '20px', padding: '9px 16px', fontSize: '16px', outline: 'none', fontFamily: 'inherit' }}
                onFocus={e => { e.target.style.borderColor = primaryColor; e.target.style.boxShadow = `0 0 0 2px ${primaryColor}33`; }}
                onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isTyping}
                aria-label={text.send}
                style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: primaryColor, border: '1.5px solid black', color: 'white', cursor: inputValue.trim() ? 'pointer' : 'default', opacity: inputValue.trim() ? 1 : 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'opacity 0.15s' }}
              >
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </form>
            <p style={{ margin: '6px 0 0 0', fontSize: '10px', color: '#9ca3af', textAlign: 'center' }}>
              {text.powered_by} &middot; <a href="https://healthmatters.clinic/privacy-policy" target="_blank" rel="noopener noreferrer" style={{ color: '#9ca3af', textDecoration: 'underline' }}>{lang === 'es' ? 'Privacidad' : 'Privacy'}</a>
            </p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes sunnySlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes sunnyBounce {
          0%, 60%, 100% { transform: translateY(0); }
          30%            { transform: translateY(-5px); }
        }
      `}</style>
    </>
  );
};

export default SunnyChat;
