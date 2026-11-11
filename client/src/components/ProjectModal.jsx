import { useState } from "react";
import Modal from "./Modal";
import { api, messageFromError } from "../api";

export default function ProjectModal({ workspaceId, project, onClose, onSaved }) {
  const [form, setForm] = useState({ name: project?.name || "", description: project?.description || "", priority: project?.priority || "medium", status: project?.status || "planning", dueDate: project?.dueDate ? new Date(project.dueDate).toISOString().slice(0,10) : "" });
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const change = (k,v) => setForm(old => ({...old,[k]:v}));
  async function submit(e) {
    e.preventDefault(); setBusy(true); setError("");
    try {
      if (project) await api.patch(`/projects/${project._id}`, { ...form, dueDate: form.dueDate || null });
      else await api.post("/projects", { ...form, workspaceId, dueDate: form.dueDate || null });
      onSaved(); onClose();
    } catch(err) { setError(messageFromError(err)); } finally { setBusy(false); }
  }
  return <Modal title={project ? "Edit project" : "Create a project"} subtitle="Give your team a clear place to collaborate." onClose={onClose}>
    <form className="form-stack" onSubmit={submit}>
      <label>Project name<input autoFocus required value={form.name} onChange={e=>change("name",e.target.value)} placeholder="Website redesign"/></label>
      <label>Description<textarea rows="3" value={form.description} onChange={e=>change("description",e.target.value)} placeholder="What is this project about?"/></label>
      <div className="form-grid">
        <label>Priority<select value={form.priority} onChange={e=>change("priority",e.target.value)}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label>
        <label>Status<select value={form.status} onChange={e=>change("status",e.target.value)}><option value="planning">Planning</option><option value="active">Active</option><option value="completed">Completed</option><option value="archived">Archived</option></select></label>
      </div>
      <label>Due date<input type="date" value={form.dueDate} onChange={e=>change("dueDate",e.target.value)}/></label>
      {error && <div className="form-error">{error}</div>}
      <div className="modal-footer"><button type="button" className="secondary-btn" onClick={onClose}>Cancel</button><button className="primary-btn" disabled={busy}>{busy ? "Saving..." : project ? "Save project" : "Create project"}</button></div>
    </form>
  </Modal>;
}
