export default function MessageBubble({ message }) {
  if (message.role === 'system') {
    return <div className="system-note">{message.text}</div>;
  }

  const isUser = message.role === 'user';

  return (
    <div className={`bubble-row ${isUser ? 'bubble-row--user' : 'bubble-row--assistant'}`}>
      <div className={`bubble ${isUser ? 'bubble--user' : 'bubble--assistant'}`}>
        {message.text}
        {message.streaming && <span className="cursor" />}
      </div>
    </div>
  );
}
