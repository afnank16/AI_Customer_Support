import Header from './components/Header.jsx';
import ChatWindow from './components/ChatWindow.jsx';
import Composer from './components/Composer.jsx';
import { useSupportSocket } from './hooks/useSupportSocket.js';

export default function App() {
  const { status, messages, isAssistantTyping, sendMessage } = useSupportSocket();

  return (
    <div className="app-shell">
      <div className="chat-card">
        <Header status={status} />
        <ChatWindow messages={messages} isAssistantTyping={isAssistantTyping} />
        <Composer onSend={sendMessage} disabled={status !== 'online'} />
      </div>
    </div>
  );
}
