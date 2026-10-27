import { useRef, useState } from 'react';

export default function Composer({ onSend, disabled }) {
  const [value, setValue] = useState('');
  const textareaRef = useRef(null);

  const handleChange = (e) => {
    setValue(e.target.value);
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
    }
  };

  const submit = () => {
    if (!value.trim()) return;
    onSend(value);
    setValue('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="composer">
      <textarea
        ref={textareaRef}
        className="composer-input"
        placeholder="Message support…"
        rows={1}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
      />
      <button
        type="button"
        className="composer-send"
        onClick={submit}
        disabled={disabled || !value.trim()}
        aria-label="Send message"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
          <path
            d="M4 12L20 4L13 20L11 13L4 12Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}
