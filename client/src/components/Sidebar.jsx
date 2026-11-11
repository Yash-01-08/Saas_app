import { Bell, Blocks, ChevronDown, CircleHelp, FolderKanban, LayoutDashboard, LogOut, Settings2, Users } from "lucide-react";

export default function Sidebar({ user, organizations, organization, workspaces, workspace, onOrganization, onWorkspace, page, setPage, onLogout, onCreateWorkspace }) {
  return (
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark">o</div><span>orbit<span className="brand-dot">.</span></span></div>
      <div className="switcher-wrap">
        <label className="eyebrow">ORGANIZATION</label>
        <div className="select-shell">
          <Blocks size={16} />
          <select value={organization?._id || ""} onChange={(e) => onOrganization(e.target.value)}>
            <option value="">Choose organization</option>
            {organizations.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
          </select>
          <ChevronDown size={14} />
        </div>
      </div>
      <div className="side-section">
        <div className="section-row"><span className="eyebrow">WORKSPACES</span><button className="tiny-add" onClick={onCreateWorkspace}>+</button></div>
        {workspaces.map((item) => (
          <button key={item._id} className={`side-link ${workspace?._id === item._id ? "active" : ""}`} onClick={() => onWorkspace(item._id)}>
            <span className="workspace-icon">{item.name?.slice(0, 1)?.toUpperCase() || "W"}</span><span className="side-link-text">{item.name}</span>
          </button>
        ))}
        {organization && workspaces.length === 0 && <p className="side-empty">No workspaces yet</p>}
      </div>
      <div className="side-section nav-section">
        <span className="eyebrow">WORKSPACE</span>
        <button className={`side-link ${page === "overview" ? "active" : ""}`} onClick={() => setPage("overview")}><LayoutDashboard size={17} />Overview</button>
        <button className={`side-link ${page === "projects" ? "active" : ""}`} onClick={() => setPage("projects")}><FolderKanban size={17} />Projects</button>
        <button className={`side-link ${page === "members" ? "active" : ""}`} onClick={() => setPage("members")}><Users size={17} />Members</button>
        <button className={`side-link ${page === "notifications" ? "active" : ""}`} onClick={() => setPage("notifications")}><Bell size={17} />Notifications</button>
      </div>
      <div className="sidebar-bottom">
        <button className="side-link muted-link"><CircleHelp size={17} />Help center</button>
        <div className="profile-card">
          <div className="avatar">{(user?.name || "U").split(" ").map(x => x[0]).slice(0,2).join("").toUpperCase()}</div>
          <div className="profile-info"><strong>{user?.name || "User"}</strong><span>{user?.email || user?.username || ""}</span></div>
          <button className="icon-btn small" onClick={onLogout} title="Log out"><LogOut size={16} /></button>
        </div>
      </div>
    </aside>
  );
}
