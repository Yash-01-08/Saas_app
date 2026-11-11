import { useState } from "react";
import Modal from "./Modal";
import { api, messageFromError } from "../api";

export default function TaskModal({ project, members, task, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: task?.title || "",
    description: task?.description || "",
    priority: task?.priority || "medium",
    status: task?.status || "todo",
    assignedTo: task?.assignedTo?._id || task?.assignedTo || "",
    dueDate: task?.dueDate ? new Date(task.dueDate).toISOString().slice(0,10) : ""
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const change = (key, value) => setForm((old) => ({ ...old, [key]: value }));

  async function submit(event) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const payload = { ...form, assignedTo: form.assignedTo || null, dueDate: form.dueDate || null };
      if (task) {
        await api.patch(`/tasks/${task._id}`, payload);
      } else {
        await api.post("/tasks", { ...payload, projectId: project._id });
      }
      onSaved(); onClose();
    } catch (err) { setError(messageFromError(err)); }
    finally { setBusy(false); }
  }

  return (
    <Modal title={task ? "Edit task" : "Create a task"} subtitle={project?.name} onClose={onClose}>
      <form className="form-stack" onSubmit={submit}>
        <label>Task title<input required autoFocus value={form.title} onChange={e => change("title", e.target.value)} placeholder="e.g. Design onboarding flow"/></label>
        <label>Description<textarea rows="3" value={form.description} onChange={e => change("description", e.target.value)} placeholder="Add context and details..."/></label>
        <div className="form-grid">
          <label>Priority<select value={form.priority} onChange={e => change("priority", e.target.value)}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option></select></label>
          <label>Status<select value={form.status} onChange={e => change("status", e.target.value)}><option value="todo">To do</option><option value="in_progress">In progress</option><option value="in_review">In review</option><option value="done">Done</option></select></label>
        </div>
        <div className="form-grid">
          <label>Assignee<select value={form.assignedTo} onChange={e => change("assignedTo", e.target.value)}><option value="">Unassigned</option>{members.map(m => <option key={m.user?._id || m._id} value={m.user?._id || m.user || m._id}>{m.user?.name || m.name || m.user?.username || "Workspace member"}</option>)}</select></label>
          <label>Due date<input type="date" value={form.dueDate} onChange={e => change("dueDate", e.target.value)}/></label>
        </div>
        {error && <div className="form-error">{error}</div>}
        <div className="modal-footer"><button type="button" className="secondary-btn" onClick={onClose}>Cancel</button><button className="primary-btn" disabled={busy}>{busy ? "Saving..." : task ? "Save changes" : "Create task"}</button></div>
      </form>
    </Modal>
  );
}
