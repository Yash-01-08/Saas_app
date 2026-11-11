import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CalendarDays, Check, Circle, Clock3, Download, FileText, MessageCircle, MoreHorizontal, Paperclip, Plus, Send, Trash2, UploadCloud, X } from "lucide-react";
import { api, messageFromError } from "../api";
import { displayName, idOf, shortDate, statusLabel } from "../utils";
import TaskModal from "./TaskModal";
import Modal from "./Modal";

const columns = [
  { key: "todo", label: "To do", tone: "slate" },
  { key: "in_progress", label: "In progress", tone: "blue" },
  { key: "in_review", label: "In review", tone: "amber" },
  { key: "done", label: "Done", tone: "green" }
];

function TaskCard({ task, onEdit, onComments }) {
  return <article className="task-card">
    <div className="task-card-top"><span className={`priority-dot ${task.priority || "medium"}`}></span><span className="priority-label">{task.priority || "medium"} priority</span><button className="icon-btn small" onClick={() => onEdit(task)}><MoreHorizontal size={16}/></button></div>
    <h4>{task.title}</h4>
    {task.description && <p>{task.description}</p>}
    <div className="task-card-bottom">
      <span className="task-due"><CalendarDays size={13}/>{shortDate(task.dueDate)}</span>
      <button className="comment-count" onClick={() => onComments(task)}><MessageCircle size={14}/></button>
      <span className="mini-avatar">{(displayName(task.assignedTo)[0] || "U").toUpperCase()}</span>
    </div>
  </article>;
}

export default function ProjectDetail({ project, members, workspaceId, onBack, onChanged }) {
  const [tasks, setTasks] = useState([]); const [sprints, setSprints] = useState([]);
  const [taskModal, setTaskModal] = useState(null); const [commentsTask, setCommentsTask] = useState(null);
  const [comments, setComments] = useState([]); const [commentText, setCommentText] = useState("");
  const [files, setFiles] = useState([]); const [uploading, setUploading] = useState(false); const [error, setError] = useState("");
  const [sprintName, setSprintName] = useState(""); const [showSprintForm, setShowSprintForm] = useState(false);
  const [tab, setTab] = useState("board");

  async function load() {
    const [taskRes, sprintRes, fileRes] = await Promise.allSettled([
      api.get(`/tasks/project/${project._id}`),
      api.get(`/sprints/project/${project._id}`),
      api.get(`/files/project/${project._id}`)
    ]);
    if (taskRes.status === "fulfilled") setTasks(taskRes.value.data.tasks || []);
    if (sprintRes.status === "fulfilled") setSprints(sprintRes.value.data.sprints || []);
    if (fileRes.status === "fulfilled") setFiles(fileRes.value.data.files || []);
  }
  useEffect(() => { load(); }, [project._id]);

  async function openComments(task) {
    setCommentsTask(task); setCommentText("");
    try { const res = await api.get(`/comments/task/${task._id}`); setComments(res.data.data || []); }
    catch (err) { setError(messageFromError(err)); }
  }
  async function sendComment(e) {
    e.preventDefault(); if (!commentText.trim()) return;
    try {
      await api.post(`/comments/task/${commentsTask._id}`, { content: commentText.trim() });
      const res = await api.get(`/comments/task/${commentsTask._id}`); setComments(res.data.data || []); setCommentText("");
    } catch(err) { setError(messageFromError(err)); }
  }
  async function changeStatus(task, status) {
    try { await api.patch(`/tasks/${task._id}`, { status }); await load(); }
    catch(err) { setError(messageFromError(err)); }
  }
  async function createSprint(e) {
    e.preventDefault(); if (!sprintName.trim()) return;
    try { await api.post("/sprints", { name: sprintName.trim(), projectId: project._id }); setSprintName(""); setShowSprintForm(false); await load(); }
    catch(err) { setError(messageFromError(err)); }
  }
  async function uploadFile(file) {
    setUploading(true); setError("");
    try {
      const contentType = file.type || "application/octet-stream";
      const init = await api.post("/files/upload-url", { fileName: file.name, contentType, fileSize: file.size, workspaceId, projectId: project._id });
      await fetch(init.data.uploadUrl, { method: "PUT", headers: { "Content-Type": contentType }, body: file });
      await api.post("/files/confirm", { s3Key: init.data.s3Key, fileName: file.name, contentType, fileSize: file.size, workspaceId, projectId: project._id });
      const res = await api.get(`/files/project/${project._id}`); setFiles(res.data.files || []);
    } catch(err) { setError(err.response?.data?.message || err.message || "Upload failed"); }
    finally { setUploading(false); }
  }
  async function downloadFile(file) {
    try { const res = await api.get(`/files/${file._id}/download-url`); window.open(res.data.downloadUrl, "_blank", "noopener,noreferrer"); }
    catch(err) { setError(messageFromError(err)); }
  }
  async function deleteFile(file) {
    if (!confirm(`Delete ${file.originalName}?`)) return;
    try { await api.delete(`/files/${file._id}`); setFiles(old => old.filter(x => x._id !== file._id)); }
    catch(err) { setError(messageFromError(err)); }
  }

  return <div className="project-detail">
    <div className="detail-heading">
      <button className="back-btn" onClick={onBack}><ArrowLeft size={16}/>All projects</button>
      <div className="detail-title-row"><div><div className="eyebrow">PROJECT</div><h2>{project.name}</h2><p>{project.description || "A shared space for your team's work."}</p></div><span className={`status-badge ${project.status}`}>{statusLabel(project.status)}</span></div>
      <div className="detail-meta"><span><CalendarDays size={14}/>Due {shortDate(project.dueDate)}</span><span><Circle size={8} fill="currentColor"/> {project.priority} priority</span><span><Check size={14}/>{tasks.filter(t=>t.status==="done").length}/{tasks.length} tasks completed</span></div>
    </div>
    {error && <div className="inline-error">{error}<button onClick={()=>setError("")}><X size={14}/></button></div>}
    <div className="tabs"><button className={tab==="board"?"selected":""} onClick={()=>setTab("board")}>Board</button><button className={tab==="sprints"?"selected":""} onClick={()=>setTab("sprints")}>Sprints <span>{sprints.length}</span></button><button className={tab==="files"?"selected":""} onClick={()=>setTab("files")}>Files <span>{files.length}</span></button></div>
    {tab === "board" && <div className="kanban">
      {columns.map(col => <section className="kanban-column" key={col.key}>
        <div className="column-head"><div><span className={`column-indicator ${col.tone}`}></span><strong>{col.label}</strong><span className="count-chip">{tasks.filter(t=>t.status===col.key).length}</span></div>{col.key==="todo" && <button className="tiny-add" onClick={()=>setTaskModal({})}><Plus size={15}/></button>}</div>
        <div className="task-list">{tasks.filter(t=>t.status===col.key).map(task=><TaskCard key={task._id} task={task} onEdit={setTaskModal} onComments={openComments}/>)}
          {tasks.filter(t=>t.status===col.key).length===0 && <div className="empty-column">No tasks here yet</div>}
        </div>
      </section>)}
    </div>}
    {tab === "sprints" && <section className="panel-card">
      <div className="panel-heading"><div><h3>Sprints</h3><p>Plan and track focused delivery cycles.</p></div><button className="secondary-btn" onClick={()=>setShowSprintForm(v=>!v)}><Plus size={15}/>New sprint</button></div>
      {showSprintForm && <form className="inline-form" onSubmit={createSprint}><input value={sprintName} onChange={e=>setSprintName(e.target.value)} placeholder="Sprint name" required/><button className="primary-btn">Create</button></form>}
      <div className="sprint-list">{sprints.map(s=><div className="sprint-row" key={s._id}><div className="sprint-symbol"><Clock3 size={17}/></div><div className="sprint-main"><strong>{s.name}</strong><span>{s.goal || "No sprint goal"}</span></div><span className={`status-badge ${s.status}`}>{s.status}</span><div className="sprint-actions">{s.status==="planned" && <button className="secondary-btn small-btn" onClick={async()=>{await api.patch(`/sprints/${s._id}/start`);load();}}>Start</button>}{s.status==="active" && <button className="secondary-btn small-btn" onClick={async()=>{await api.patch(`/sprints/${s._id}/complete`);load();}}>Complete</button>}</div></div>)}</div>
      {sprints.length===0 && <div className="empty-state compact">No sprints created yet.</div>}
    </section>}
    {tab === "files" && <section className="panel-card">
      <div className="panel-heading"><div><h3>Project files</h3><p>Private attachments stored securely in Amazon S3.</p></div><label className={`upload-btn ${uploading?"disabled":""}`}><UploadCloud size={16}/>{uploading?"Uploading...":"Upload file"}<input type="file" hidden disabled={uploading} onChange={e=>e.target.files?.[0] && uploadFile(e.target.files[0])}/></label></div>
      <div className="file-list">{files.map(f=><div className="file-row" key={f._id}><div className="file-icon"><FileText size={18}/></div><div className="file-info"><strong>{f.originalName}</strong><span>{(f.size/1024).toFixed(1)} KB · {f.uploadedBy?.name || "Team member"}</span></div><button className="icon-btn" onClick={()=>downloadFile(f)} title="Download"><Download size={16}/></button><button className="icon-btn danger-hover" onClick={()=>deleteFile(f)} title="Delete"><Trash2 size={16}/></button></div>)}</div>
      {files.length===0 && <div className="empty-state compact">No files attached to this project.</div>}
    </section>}
    {taskModal && <TaskModal project={project} members={members} task={taskModal._id?taskModal:null} onClose={()=>setTaskModal(null)} onSaved={()=>{load();onChanged?.();}}/>}
    {commentsTask && <Modal title="Task discussion" subtitle={commentsTask.title} onClose={()=>setCommentsTask(null)} wide>
      <div className="comment-list">{comments.map(c=><div className="comment-item" key={c._id}><div className="avatar tiny">{(c.author?.name||"U")[0]}</div><div><strong>{c.author?.name || "Member"}</strong><span>{new Date(c.createdAt).toLocaleString()}</span><p>{c.content}</p></div></div>)}</div>
      <form className="comment-form" onSubmit={sendComment}><input value={commentText} onChange={e=>setCommentText(e.target.value)} placeholder="Write a comment..." /><button className="primary-btn"><Send size={15}/>Send</button></form>
    </Modal>}
  </div>;
}
