import { useEffect, useState } from "react";
import { api, type Doctor } from "../api";
import Modal from "../components/Modal";

const emptyForm = { name: "", specialty: "", phone: "", email: "" };

export default function Doctors() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = () =>
    api
      .listDoctors()
      .then(setDoctors)
      .catch((e) => setError(e.message));

  useEffect(() => {
    load();
  }, []);

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      await api.createDoctor(form);
      setForm(emptyForm);
      setOpen(false);
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Delete this doctor? This also removes their appointments.")) return;
    await api.deleteDoctor(id);
    await load();
  };

  return (
    <div>
      <header className="page-header">
        <div>
          <h1>Doctors</h1>
          <p className="muted">{doctors.length} on staff</p>
        </div>
        <button className="btn primary" onClick={() => setOpen(true)}>
          + New doctor
        </button>
      </header>

      {error && <div className="alert error">{error}</div>}

      <div className="doctor-grid">
        {doctors.map((d) => (
          <div className="doctor-card" key={d.id}>
            <div className="avatar">{d.name.replace(/^Dr\.?\s*/, "").charAt(0)}</div>
            <div className="doctor-info">
              <div className="strong">{d.name}</div>
              <span className="badge">{d.specialty}</span>
              <div className="muted small">{d.phone}</div>
              <div className="muted small">{d.email}</div>
            </div>
            <button className="btn ghost danger" onClick={() => remove(d.id)}>
              Delete
            </button>
          </div>
        ))}
        {doctors.length === 0 && <div className="muted center card">No doctors yet</div>}
      </div>

      <Modal title="Add doctor" open={open} onClose={() => setOpen(false)}>
        <div className="form-grid">
          <label>
            Full name
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Dr. Alex Kim"
            />
          </label>
          <label>
            Specialty
            <input
              value={form.specialty}
              onChange={(e) => setForm({ ...form, specialty: e.target.value })}
              placeholder="Neurology"
            />
          </label>
          <label>
            Phone
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="555-0200"
            />
          </label>
          <label>
            Email
            <input
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="a.kim@hospital.org"
            />
          </label>
        </div>
        <div className="modal-actions">
          <button className="btn ghost" onClick={() => setOpen(false)}>
            Cancel
          </button>
          <button
            className="btn primary"
            onClick={submit}
            disabled={saving || !form.name || !form.specialty}
          >
            {saving ? "Saving…" : "Save doctor"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
