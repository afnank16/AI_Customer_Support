export default function Header({ status }) {
  const statusLabel =
    status === 'online' ? 'Online now' : status === 'connecting' ? 'Connecting…' : 'Reconnecting…';

  return (
    <header className="chat-header">
      <div className={`avatar-ring avatar-ring--${status}`}>
        <div className="avatar">N</div>
      </div>
      <div className="header-text">
        <h1>Northwind Support</h1>
        <p className={`status-line status-line--${status}`}>
          <span className="status-dot" />
          {statusLabel}
        </p>
      </div>
    </header>
  );
}
