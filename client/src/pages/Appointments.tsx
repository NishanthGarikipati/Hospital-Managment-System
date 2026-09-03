import { useEffect, useMemo, useState } from "react";
import { api, type Appointment, type Doctor, type Patient } from "../api";
import Modal from "../components/Modal";

function toLocalInputValue(iso?: string): string {
  const d = iso ? new Date(iso) : new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const statuses = ["Scheduled", "Completed", "Cancelled"];

export default function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    patient_id: "",
    doctor_id: "",
    scheduled_at: toLocalInputValue(),
    reason: "",
  });

  const load = async () => {
    try {
      const [a, p, d] = await Promise.all([
        api.listAppointments(),
        api.listPatients(),
        api.listDoctors(),
      ]);
      setAppointments(a);
      setPatients(p);
      setDoctors(d);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const canSubmit = useMemo(
    () => form.patient_id && form.doctor_id && form.scheduled_at,
    [form]
  );

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      await api.createAppointment({
        patient_id: Number(form.patient_id),
        doctor_id: Number(form.doctor_id),
        scheduled_at: new Date(form.scheduled_at).toISOString(),
        reason: form.reason,
      });
      setForm({ patient_id: "", doctor_id: "", scheduled_at: toLocalInputValue(), reason: "" });
      setOpen(false);
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const setStatus = async (a: Appointment, status: string) => {
    await api.updateAppointment(a.id, { status });
    await load();
  };

  const remove = async (id: number) => {
    if (!confirm("Delete this appointment?")) return;
    await api.deleteAppointment(id);
    await load();
  };

  return (
    <div>
      <header className="page-header">
        <div>
          <h1>Appointments</h1>
          <p className="muted">{appointments.length} total</p>
        </div>
        <button
          className="btn primary"
          onClick={() => setOpen(true)}
          disabled={patients.length === 0 || doctors.length === 0}
        >
          + Schedule
        </button>
      </header>

      {error && <div className="alert error">{error}</div>}

      <section className="card">
        <table className="table">
          <thead>
            <tr>
              <th>When</th>
              <th>Patient</th>
              <th>Doctor</th>
              <th>Reason</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((a) => (
              <tr key={a.id}>
                <td>{formatDate(a.scheduled_at)}</td>
                <td className="strong">{a.patient_name}</td>
                <td>
                  {a.doctor_name} <span className="badge">{a.specialty}</span>
                </td>
                <td className="muted">{a.reason}</td>
                <td>
                  <select
                    className={`status status-${a.status.toLowerCase()}`}
                    value={a.status}
                    onChange={(e) => setStatus(a, e.target.value)}
                  >
                    {statuses.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </td>
                <td className="right">
                  <button className="btn ghost danger" onClick={() => remove(a.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {appointments.length === 0 && (
              <tr>
                <td colSpan={6} className="muted center">
                  No appointments scheduled
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <Modal title="Schedule appointment" open={open} onClose={() => setOpen(false)}>
        <div className="form-grid">
          <label>
            Patient
            <select
              value={form.patient_id}
              onChange={(e) => setForm({ ...form, patient_id: e.target.value })}
            >
              <option value="">Select patient…</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Doctor
            <select
              value={form.doctor_id}
              onChange={(e) => setForm({ ...form, doctor_id: e.target.value })}
            >
              <option value="">Select doctor…</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} — {d.specialty}
                </option>
              ))}
            </select>
          </label>
          <label>
            Date &amp; time
            <input
              type="datetime-local"
              value={form.scheduled_at}
              onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
            />
          </label>
          <label className="span-2">
            Reason
            <input
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="Consultation, follow-up, etc."
            />
          </label>
        </div>
        <div className="modal-actions">
          <button className="btn ghost" onClick={() => setOpen(false)}>
            Cancel
          </button>
          <button className="btn primary" onClick={submit} disabled={saving || !canSubmit}>
            {saving ? "Saving…" : "Schedule"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
