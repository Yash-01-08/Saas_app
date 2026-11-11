import { Bell, Plus, Search } from "lucide-react";

export default function Topbar({ title, subtitle, onCreate, createLabel = "New project", unread = 0, onNotifications }) {
  return (
    <header className="topbar">
      <div className="topbar-title"><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>
      <div className="topbar-actions">
        <div className="search-pill"><Search size={16}/><span>Search workspace</span><kbd>⌘ K</kbd></div>
        <button className="icon-btn notification-btn" onClick={onNotifications} title="Notifications"><Bell size={18}/>{unread > 0 && <i>{unread > 9 ? "9+" : unread}</i>}</button>
        {onCreate && <button className="primary-btn" onClick={onCreate}><Plus size={17}/>{createLabel}</button>}
      </div>
    </header>
  );
}
