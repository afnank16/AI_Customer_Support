import { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble.jsx';
import TypingIndicator from './TypingIndicator.jsx';

export default function ChatWindow({ messages, isAssistantTyping }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isAssistantTyping]);

  const showTypingGhost = isAssistantTyping && messages[messages.length - 1]?.text === '';

  return (
    <div className="chat-window">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
      {showTypingGhost && (
        <div className="bubble-row bubble-row--assistant">
          <TypingIndicator />
        </div>
      )}
      <div ref={endRef} />
    </div>
  );
}
