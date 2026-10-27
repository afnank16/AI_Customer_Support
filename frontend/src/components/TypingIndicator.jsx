export default function TypingIndicator() {
  return (
    <div className="bubble bubble--assistant bubble--typing" aria-label="Assistant is typing">
      <span className="typing-dot" />
      <span className="typing-dot" />
      <span className="typing-dot" />
    </div>
  );
}
