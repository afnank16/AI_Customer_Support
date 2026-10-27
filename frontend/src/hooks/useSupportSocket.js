import { useCallback, useEffect, useRef, useState } from 'react';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8787/ws';

let idCounter = 0;
const nextId = () => `msg_${Date.now()}_${idCounter++}`;

export function useSupportSocket() {
  const [status, setStatus] = useState('connecting'); // connecting | online | offline
  const [messages, setMessages] = useState([
    {
      id: nextId(),
      role: 'assistant',
      text: "Hi, I'm the Northwind support assistant. What can I help you with today?",
      streaming: false,
    },
  ]);
  const [isAssistantTyping, setIsAssistantTyping] = useState(false);
  const socketRef = useRef(null);
  const streamingIdRef = useRef(null);

  useEffect(() => {
    const socket = new WebSocket(WS_URL);
    socketRef.current = socket;

    socket.onopen = () => setStatus('online');
    socket.onclose = () => setStatus('offline');
    socket.onerror = () => setStatus('offline');

    socket.onmessage = (event) => {
      const payload = JSON.parse(event.data);

      switch (payload.type) {
        case 'assistant_start': {
          setIsAssistantTyping(true);
          const id = nextId();
          streamingIdRef.current = id;
          setMessages((prev) => [...prev, { id, role: 'assistant', text: '', streaming: true }]);
          break;
        }
        case 'assistant_chunk': {
          const id = streamingIdRef.current;
          if (!id) return;
          setMessages((prev) =>
            prev.map((m) => (m.id === id ? { ...m, text: m.text + payload.text } : m))
          );
          break;
        }
        case 'assistant_done': {
          const id = streamingIdRef.current;
          setIsAssistantTyping(false);
          streamingIdRef.current = null;
          setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, streaming: false } : m)));
          break;
        }
        case 'error': {
          setIsAssistantTyping(false);
          streamingIdRef.current = null;
          setMessages((prev) => [
            ...prev,
            { id: nextId(), role: 'system', text: payload.message, streaming: false },
          ]);
          break;
        }
        default:
          break;
      }
    };

    return () => socket.close();
  }, []);

  const sendMessage = useCallback((text) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setMessages((prev) => [
      ...prev,
      { id: nextId(), role: 'user', text: trimmed, streaming: false },
    ]);

    const socket = socketRef.current;
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'user_message', text: trimmed }));
    } else {
      setMessages((prev) => [
        ...prev,
        {
          id: nextId(),
          role: 'system',
          text: "You're disconnected from support. Reconnecting…",
          streaming: false,
        },
      ]);
    }
  }, []);

  return { status, messages, isAssistantTyping, sendMessage };
}
