import { useEffect, useState } from "react";
import { api, type Stats } from "../api";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .stats()
      .then(setStats)
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div>
      <header className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="muted">Overview of hospital activity</p>
        </div>
      </header>

      {error && <div className="alert error">{error}</div>}

      <div className="stat-grid">
        <StatCard label="Patients" value={stats?.patients} tone="blue" />
        <StatCard label="Doctors" value={stats?.doctors} tone="green" />
        <StatCard label="Appointments" value={stats?.appointments} tone="purple" />
        <StatCard label="Scheduled" value={stats?.scheduled} tone="amber" />
      </div>

      <section className="card">
        <div className="card-header">
          <h2>Upcoming appointments</h2>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>When</th>
              <th>Patient</th>
              <th>Doctor</th>
              <th>Specialty</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>
            {stats?.upcoming.length ? (
              stats.upcoming.map((a) => (
                <tr key={a.id}>
                  <td>{formatDate(a.scheduled_at)}</td>
                  <td>{a.patient_name}</td>
                  <td>{a.doctor_name}</td>
                  <td>
                    <span className="badge">{a.specialty}</span>
                  </td>
                  <td className="muted">{a.reason}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="muted center">
                  {stats ? "No upcoming appointments" : "Loading…"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | undefined;
  tone: string;
}) {
  return (
    <div className={`stat-card tone-${tone}`}>
      <div className="stat-value">{value ?? "—"}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
