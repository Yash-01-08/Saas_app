import { useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { Activity, ArrowUpRight, Bell, BriefcaseBusiness, CheckCircle2, ChevronRight, CirclePlus, FolderKanban, Layers3, Plus, Sparkles, Users, X } from "lucide-react";
import { api, messageFromError, socketUrl } from "./api";
import { displayName, fullDate, idOf, initials, statusLabel } from "./utils";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Modal from "./components/Modal";
import ProjectModal from "./components/ProjectModal";
import ProjectDetail from "./components/ProjectDetail";

function AuthPage({ mode, onAuth }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name:"", username:"", email:"", password:"", phone:"", company:"" });
  const [busy,setBusy] = useState(false); const [error,setError] = useState("");
  const register = mode === "register";
  const set = (k,v)=>setForm(old=>({...old,[k]:v}));
  async function submit(e) {
    e.preventDefault(); setBusy(true); setError("");
    try {
      if (register) {
        await api.post("/auth/register", form);
        const result = await api.post("/auth/login", { username: form.username, password: form.password });
        onAuth(result.data.token, result.data.user);
      } else {
        const result = await api.post("/auth/login", { username: form.username, password: form.password });
        onAuth(result.data.token, result.data.user);
      }
      navigate("/");
    } catch(err) { setError(messageFromError(err)); } finally { setBusy(false); }
  }
  return <div className="auth-shell">
    <div className="auth-left"><div className="brand brand-light"><div className="brand-mark">o</div><span>orbit<span className="brand-dot">.</span></span></div><div className="auth-pitch"><div className="pill-label"><Sparkles size={13}/> YOUR TEAM'S WORK, IN SYNC</div><h1>Make space for<br/><em>great work.</em></h1><p>Bring projects, people and progress together in one calm, collaborative workspace.</p><div className="auth-proof"><div className="proof-avatars"><span>Y</span><span>A</span><span>M</span><span>+</span></div><span>Built for teams that move things forward.</span></div></div><div className="auth-left-foot">© 2026 Orbit Workspace</div></div>
    <div className="auth-right"><div className="auth-form-wrap"><div className="mobile-brand brand"><div className="brand-mark">o</div><span>orbit<span className="brand-dot">.</span></span></div><div className="auth-heading"><span className="eyebrow">{register ? "GET STARTED" : "WELCOME BACK"}</span><h2>{register ? "Create your account" : "Sign in to Orbit"}</h2><p>{register ? "Set up your profile and start collaborating." : "Enter your details to access your workspace."}</p></div>
      <form className="form-stack auth-form" onSubmit={submit}>
        {register && <label>Full name<input required value={form.name} onChange={e=>set("name",e.target.value)} placeholder="Your name"/></label>}
        <label>Username<input required value={form.username} onChange={e=>set("username",e.target.value)} placeholder="yourusername" autoComplete="username"/></label>
        {register && <label>Email address<input required type="email" value={form.email} onChange={e=>set("email",e.target.value)} placeholder="you@company.com"/></label>}
        <label>Password<input required type="password" minLength="8" value={form.password} onChange={e=>set("password",e.target.value)} placeholder="At least 8 characters" autoComplete={register?"new-password":"current-password"}/></label>
        {register && <div className="form-grid"><label>Phone<input required value={form.phone} onChange={e=>set("phone",e.target.value)} placeholder="+91..."/></label><label>Company<input required value={form.company} onChange={e=>set("company",e.target.value)} placeholder="Company / team"/></label></div>}
        {error && <div className="form-error">{error}</div>}
        <button className="primary-btn auth-submit" disabled={busy}>{busy ? "Please wait..." : register ? "Create account" : "Sign in"}<ArrowUpRight size={17}/></button>
      </form>
      <p className="auth-switch">{register ? "Already have an account?" : "New to Orbit?"} <button onClick={()=>navigate(register?"/login":"/register")}>{register?"Sign in":"Create an account"}</button></p>
    </div><div className="auth-right-foot">A little more focus. A lot more momentum.</div></div>
  </div>;
}

function AppShell({ token, user, onLogout }) {
  const [organizations,setOrganizations] = useState([]);
  const [organization,setOrganization] = useState(null);
  const [workspaces,setWorkspaces] = useState([]);
  const [workspace,setWorkspace] = useState(null);
  const [projects,setProjects] = useState([]);
  const [members,setMembers] = useState([]);
  const [notifications,setNotifications] = useState([]);
  const [unread,setUnread] = useState(0);
  const [page,setPage] = useState("overview");
  const [selectedProject,setSelectedProject] = useState(null);
  const [projectModal,setProjectModal] = useState(false);
  const [orgModal,setOrgModal] = useState(false);
  const [workspaceModal,setWorkspaceModal] = useState(false);
  const [joinModal,setJoinModal] = useState(false);
  const [busy,setBusy] = useState(false);
  const [toast,setToast] = useState("");
  const [error,setError] = useState("");
  const navigate=useNavigate();

  async function loadOrganizations() {
    try {
      const res=await api.get("/organizations/my");
      const list=(res.data.organizations||[]).map(item=>item.organization || item);
      setOrganizations(list);
      if(list.length && !organization) setOrganization(list[0]);
    } catch(err) { setError(messageFromError(err)); }
  }
  async function loadWorkspaces(orgId) {
    if(!orgId){setWorkspaces([]);setWorkspace(null);return;}
    try { const res=await api.get(`/workspaces/organization/${orgId}`); const list=res.data.workspaces||[]; setWorkspaces(list); setWorkspace(old=>list.find(x=>x._id===old?._id)||list[0]||null); }
    catch(err){setError(messageFromError(err));}
  }
  async function loadProjects(workspaceId) {
    if(!workspaceId){setProjects([]);return;}
    try { const res=await api.get(`/projects/workspace/${workspaceId}`);setProjects(res.data.projects||[]); }
    catch(err){setError(messageFromError(err));}
  }
  async function loadMembers(workspaceId) {
    if(!workspaceId){setMembers([]);return;}
    try { const res=await api.get(`/workspaces/${workspaceId}/members`);setMembers(res.data.members||[]); }
    catch(err){setMembers([]);}
  }
  async function loadNotifications() {
    try { const [list,count]=await Promise.all([api.get("/notifications?limit=30"),api.get("/notifications/unread-count")]);setNotifications(list.data.notifications||list.data.data||[]);setUnread(count.data.unreadCount||0); }
    catch(err) { /* notifications are non-blocking */ }
  }
  useEffect(()=>{loadOrganizations();loadNotifications();},[]);
  useEffect(()=>{if(organization?._id)loadWorkspaces(organization._id);},[organization?._id]);
  useEffect(()=>{if(workspace?._id){loadProjects(workspace._id);loadMembers(workspace._id);setSelectedProject(null);}},[workspace?._id]);
  useEffect(()=>{
    const socket=io(socketUrl,{auth:{token},transports:["websocket","polling"]});
    socket.on("notification:new",(notification)=>{setNotifications(old=>[notification,...old]);setUnread(old=>old+1);setToast(notification.message||"New notification");});
    return ()=>socket.disconnect();
  },[token]);

  async function createOrganization(e) {
    e.preventDefault(); const fd=new FormData(e.currentTarget); setBusy(true);
    try { const res=await api.post("/organizations",{name:fd.get("name"),description:fd.get("description")}); const org=res.data.organization; setOrganizations(old=>[org,...old]);setOrganization(org);setOrgModal(false);setToast("Organization created"); }
    catch(err){setError(messageFromError(err));}finally{setBusy(false);}
  }
  async function joinOrganization(e) {
    e.preventDefault();const fd=new FormData(e.currentTarget);setBusy(true);
    try { const res=await api.post("/organizations/join",{inviteCode:fd.get("inviteCode")});const org=res.data.organization || res.data;await loadOrganizations();setOrganization(org);setJoinModal(false);setToast("Joined organization"); }
    catch(err){setError(messageFromError(err));}finally{setBusy(false);}
  }
  async function createWorkspace(e) {
    e.preventDefault();const fd=new FormData(e.currentTarget);setBusy(true);
    try { const res=await api.post("/workspaces",{name:fd.get("name"),description:fd.get("description"),organizationId:organization._id});setWorkspaces(old=>[...old,res.data.workspace]);setWorkspace(res.data.workspace);setWorkspaceModal(false);setToast("Workspace created"); }
    catch(err){setError(messageFromError(err));}finally{setBusy(false);}
  }
  async function markRead(item) {
    try { await api.patch(`/notifications/${item._id}/read`);setNotifications(old=>old.map(n=>n._id===item._id?{...n,isRead:true}:n));setUnread(old=>Math.max(0,old-1)); }
    catch(err){setError(messageFromError(err));}
  }
  async function markAllRead() {
    try { await api.patch("/notifications/read-all");setNotifications(old=>old.map(n=>({...n,isRead:true})));setUnread(0); }
    catch(err){setError(messageFromError(err));}
  }

  const activePageTitle=selectedProject ? selectedProject.name : page==="overview"?"Overview":page==="projects"?"Projects":page==="members"?"Members":"Notifications";
  const completed=projects.filter(p=>p.status==="completed").length;
  const active=projects.filter(p=>p.status==="active").length;

  return <div className="app-shell">
    <Sidebar user={user} organizations={organizations} organization={organization} workspaces={workspaces} workspace={workspace} onOrganization={id=>setOrganization(organizations.find(o=>o._id===id)||null)} onWorkspace={id=>setWorkspace(workspaces.find(w=>w._id===id)||null)} page={page} setPage={p=>{setPage(p);setSelectedProject(null);}} onLogout={onLogout} onCreateWorkspace={()=>setWorkspaceModal(true)}/>
    <main className="main-area">
      <Topbar title={activePageTitle} subtitle={selectedProject?"Project workspace":workspace?`${organization?.name || "Organization"} / ${workspace.name}`:"Your team's command center"} onCreate={!selectedProject && page==="projects" && workspace?()=>setProjectModal(true):null} createLabel="New project" unread={unread} onNotifications={()=>{setPage("notifications");setSelectedProject(null);}}/>
      <div className="content-area">
        {error && <div className="inline-error">{error}<button onClick={()=>setError("")}><X size={14}/></button></div>}
        {!organization && <div className="welcome-empty"><div className="welcome-orb"><Layers3 size={30}/></div><span className="eyebrow">YOUR WORKSPACE STARTS HERE</span><h2>Make room for your next big thing.</h2><p>Create an organization or join one with an invite code to get started.</p><div className="welcome-actions"><button className="primary-btn" onClick={()=>setOrgModal(true)}><Plus size={16}/>Create organization</button><button className="secondary-btn" onClick={()=>setJoinModal(true)}>Join with invite code</button></div></div>}
        {organization && !workspace && <div className="welcome-empty"><div className="welcome-orb"><Layers3 size={30}/></div><h2>Create your first workspace</h2><p>Keep projects and teammates organized in one place.</p><button className="primary-btn" onClick={()=>setWorkspaceModal(true)}><Plus size={16}/>New workspace</button></div>}
        {selectedProject && <ProjectDetail project={selectedProject} members={members} workspaceId={workspace?._id} onBack={()=>setSelectedProject(null)} onChanged={()=>loadProjects(workspace?._id)}/>}
        {!selectedProject && organization && workspace && page==="overview" && <div className="overview-page">
          <div className="welcome-banner"><div><div className="pill-label"><Sparkles size={13}/> WORKSPACE OVERVIEW</div><h2>Good work happens<br/><em>when it's in sync.</em></h2><p>Here's what's moving across {workspace.name}.</p></div><div className="banner-art"><div className="art-card art-card-one"><span className="art-dot green"></span><span>Product launch</span><strong>On track</strong></div><div className="art-card art-card-two"><span className="art-dot blue"></span><span>Design system</span><strong>12 tasks</strong></div><div className="art-orbit"></div></div></div>
          <div className="stats-grid">
            <div className="stat-card"><div className="stat-icon purple"><FolderKanban size={18}/></div><span>All projects</span><strong>{projects.length}</strong><small>In this workspace</small></div>
            <div className="stat-card"><div className="stat-icon blue"><Activity size={18}/></div><span>Active projects</span><strong>{active}</strong><small>Currently in progress</small></div>
            <div className="stat-card"><div className="stat-icon green"><CheckCircle2 size={18}/></div><span>Completed</span><strong>{completed}</strong><small>Projects delivered</small></div>
            <div className="stat-card"><div className="stat-icon amber"><Users size={18}/></div><span>Team members</span><strong>{members.length}</strong><small>In this workspace</small></div>
          </div>
          <div className="section-heading"><div><h3>Recent projects</h3><p>Pick up where your team left off.</p></div><button className="text-btn" onClick={()=>setPage("projects")}>View all projects <ChevronRight size={15}/></button></div>
          <ProjectGrid projects={projects.slice(0,3)} onOpen={setSelectedProject}/>
          {projects.length===0 && <div className="empty-state"><div className="empty-icon"><BriefcaseBusiness size={22}/></div><h3>Your first project is waiting</h3><p>Create a project to start organizing work and tracking progress.</p><button className="primary-btn" onClick={()=>setProjectModal(true)}><Plus size={16}/>Create project</button></div>}
          <div className="section-heading recent-heading"><div><h3>Team members</h3><p>People collaborating in this workspace.</p></div><button className="text-btn" onClick={()=>setPage("members")}>Manage team <ChevronRight size={15}/></button></div>
          <div className="member-strip">{members.slice(0,6).map((m,i)=><div className="member-chip" key={m._id || i}><div className="avatar">{initials(m.user?.name || m.name)}</div><div><strong>{m.user?.name || m.name || "Workspace member"}</strong><span>{m.role || "member"}</span></div></div>)}</div>
        </div>}
        {!selectedProject && organization && workspace && page==="projects" && <div className="projects-page"><div className="section-heading"><div><h3>All projects</h3><p>Projects inside {workspace.name}.</p></div><button className="primary-btn" onClick={()=>setProjectModal(true)}><Plus size={16}/>New project</button></div><ProjectGrid projects={projects} onOpen={setSelectedProject}/>{projects.length===0 && <div className="empty-state"><div className="empty-icon"><FolderKanban size={22}/></div><h3>No projects yet</h3><p>Create the first project for this workspace.</p></div>}</div>}
        {!selectedProject && organization && workspace && page==="members" && <div className="panel-card"><div className="panel-heading"><div><h3>Workspace members</h3><p>People who can access this workspace.</p></div><span className="count-chip">{members.length} members</span></div><div className="member-table">{members.map((m,i)=><div className="member-table-row" key={m._id || i}><div className="avatar">{initials(m.user?.name || m.name)}</div><div className="member-table-name"><strong>{m.user?.name || m.name || "Workspace member"}</strong><span>{m.user?.email || m.email || ""}</span></div><span className="role-pill">{m.role || "member"}</span></div>)}</div></div>}
        {!selectedProject && organization && page==="notifications" && <div className="panel-card"><div className="panel-heading"><div><h3>Notifications</h3><p>Updates from your workspace activity.</p></div><button className="text-btn" onClick={markAllRead}>Mark all as read</button></div><div className="notification-list">{notifications.map(n=><button className={`notification-row ${n.isRead?"read":""}`} key={n._id} onClick={()=>!n.isRead&&markRead(n)}><div className="notification-symbol"><Bell size={17}/></div><div className="notification-content"><strong>{n.message}</strong><span>{new Date(n.createdAt).toLocaleString()}</span></div>{!n.isRead && <i className="unread-dot"/>}</button>)}</div>{notifications.length===0 && <div className="empty-state compact">You're all caught up.</div>}</div>}
      </div>
    </main>
    {projectModal && <ProjectModal workspaceId={workspace?._id} onClose={()=>setProjectModal(false)} onSaved={()=>loadProjects(workspace?._id)}/>}
    {orgModal && <Modal title="Create organization" subtitle="Organizations bring your teams together." onClose={()=>setOrgModal(false)}><form className="form-stack" onSubmit={createOrganization}><label>Organization name<input name="name" required placeholder="Acme Studio"/></label><label>Description<textarea name="description" rows="3" placeholder="What does your organization do?"/></label><div className="modal-footer"><button type="button" className="secondary-btn" onClick={()=>setOrgModal(false)}>Cancel</button><button className="primary-btn" disabled={busy}>Create organization</button></div></form></Modal>}
    {joinModal && <Modal title="Join an organization" subtitle="Enter the invite code shared by an organization admin." onClose={()=>setJoinModal(false)}><form className="form-stack" onSubmit={joinOrganization}><label>Invite code<input name="inviteCode" required placeholder="e.g. A1B2C3D4" autoCapitalize="characters"/></label><div className="modal-footer"><button type="button" className="secondary-btn" onClick={()=>setJoinModal(false)}>Cancel</button><button className="primary-btn" disabled={busy}>Join organization</button></div></form></Modal>}
    {workspaceModal && <Modal title="Create workspace" subtitle={`Inside ${organization?.name || "your organization"}.`} onClose={()=>setWorkspaceModal(false)}><form className="form-stack" onSubmit={createWorkspace}><label>Workspace name<input name="name" required placeholder="Engineering"/></label><label>Description<textarea name="description" rows="3" placeholder="What work belongs here?"/></label><div className="modal-footer"><button type="button" className="secondary-btn" onClick={()=>setWorkspaceModal(false)}>Cancel</button><button className="primary-btn" disabled={busy}>Create workspace</button></div></form></Modal>}
    {toast && <div className="toast"><CheckCircle2 size={16}/>{toast}<button onClick={()=>setToast("")}><X size={14}/></button></div>}
  </div>;
}

function ProjectGrid({projects,onOpen}) {
  return <div className="project-grid">{projects.map((p,i)=><button className="project-card" key={p._id} onClick={()=>onOpen(p)}><div className="project-card-top"><div className={`project-symbol symbol-${i%4}`}><FolderKanban size={19}/></div><span className={`status-badge ${p.status}`}>{statusLabel(p.status)}</span></div><h3>{p.name}</h3><p>{p.description || "No description added yet."}</p><div className="project-card-bottom"><span><span className={`priority-dot ${p.priority}`}></span>{p.priority} priority</span><span>{p.dueDate ? `Due ${fullDate(p.dueDate)}` : "No due date"}<ArrowUpRight size={15}/></span></div></button>)}</div>;
}

export default function App() {
  const [token,setToken]=useState(()=>localStorage.getItem("saas_token"));
  const [user,setUser]=useState(()=>{try{return JSON.parse(localStorage.getItem("saas_user")||"null")}catch{return null}});
  function onAuth(nextToken,nextUser){localStorage.setItem("saas_token",nextToken);localStorage.setItem("saas_user",JSON.stringify(nextUser));setToken(nextToken);setUser(nextUser);}
  function logout(){localStorage.removeItem("saas_token");localStorage.removeItem("saas_user");setToken(null);setUser(null);}
  return <Routes>
    <Route path="/login" element={token?<Navigate to="/"/>:<AuthPage mode="login" onAuth={onAuth}/>}/>
    <Route path="/register" element={token?<Navigate to="/"/>:<AuthPage mode="register" onAuth={onAuth}/>}/>
    <Route path="/*" element={token?<AppShell token={token} user={user} onLogout={logout}/>:<Navigate to="/login"/>}/>
  </Routes>;
}
