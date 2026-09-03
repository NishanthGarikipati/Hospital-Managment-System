import { useEffect, useState } from "react";
import { api, type Patient } from "../api";
import Modal from "../components/Modal";

const emptyForm = { name: "", age: "", gender: "Female", phone: "", address: "" };

export default function Patients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = () =>
    api
      .listPatients()
      .then(setPatients)
      .catch((e) => setError(e.message));

  useEffect(() => {
    load();
  }, []);

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      await api.createPatient({
        name: form.name,
        age: Number(form.age),
        gender: form.gender,
        phone: form.phone,
        address: form.address,
      });
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
    if (!confirm("Delete this patient? This also removes their appointments.")) return;
    await api.deletePatient(id);
    await load();
  };

  return (
    <div>
      <header className="page-header">
        <div>
          <h1>Patients</h1>
          <p className="muted">{patients.length} registered</p>
        </div>
        <button className="btn primary" onClick={() => setOpen(true)}>
          + New patient
        </button>
      </header>

      {error && <div className="alert error">{error}</div>}

      <section className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Age</th>
              <th>Gender</th>
              <th>Phone</th>
              <th>Address</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {patients.map((p) => (
              <tr key={p.id}>
                <td className="strong">{p.name}</td>
                <td>{p.age}</td>
                <td>{p.gender}</td>
                <td>{p.phone}</td>
                <td className="muted">{p.address}</td>
                <td className="right">
                  <button className="btn ghost danger" onClick={() => remove(p.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {patients.length === 0 && (
              <tr>
                <td colSpan={6} className="muted center">
                  No patients yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <Modal title="Register patient" open={open} onClose={() => setOpen(false)}>
        <div className="form-grid">
          <label>
            Full name
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Jane Doe"
            />
          </label>
          <label>
            Age
            <input
              type="number"
              value={form.age}
              onChange={(e) => setForm({ ...form, age: e.target.value })}
              placeholder="30"
            />
          </label>
          <label>
            Gender
            <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
              <option>Female</option>
              <option>Male</option>
              <option>Other</option>
            </select>
          </label>
          <label>
            Phone
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="555-0100"
            />
          </label>
          <label className="span-2">
            Address
            <input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="123 Main St"
            />
          </label>
        </div>
        <div className="modal-actions">
          <button className="btn ghost" onClick={() => setOpen(false)}>
            Cancel
          </button>
          <button className="btn primary" onClick={submit} disabled={saving || !form.name || !form.age}>
            {saving ? "Saving…" : "Save patient"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
