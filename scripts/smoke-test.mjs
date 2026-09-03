// Minimal end-to-end API smoke test for the Hospital Management System.
// Verifies health, stats, and a full patient + appointment create/delete cycle.
// Usage: node scripts/smoke-test.mjs  (server must be running on API_BASE)

const API_BASE = process.env.API_BASE ?? "http://localhost:4000";

let passed = 0;
let failed = 0;

function check(name, condition, detail) {
  if (condition) {
    passed++;
    console.log(`  PASS  ${name}`);
  } else {
    failed++;
    console.error(`  FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

async function json(path, options) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const body = res.status === 204 ? null : await res.json().catch(() => null);
  return { status: res.status, body };
}

async function main() {
  console.log(`Running API smoke test against ${API_BASE}\n`);

  const health = await json("/api/health");
  check("GET /api/health returns ok", health.status === 200 && health.body?.status === "ok");

  const stats = await json("/api/stats");
  check("GET /api/stats has counts", stats.status === 200 && typeof stats.body?.patients === "number");

  const created = await json("/api/patients", {
    method: "POST",
    body: JSON.stringify({ name: "Smoke Test", age: 41, gender: "Other", phone: "555-7777" }),
  });
  check("POST /api/patients creates patient", created.status === 201 && created.body?.id > 0, JSON.stringify(created.body));
  const patientId = created.body?.id;

  const doctors = await json("/api/doctors");
  check("GET /api/doctors returns list", doctors.status === 200 && Array.isArray(doctors.body) && doctors.body.length > 0);
  const doctorId = doctors.body?.[0]?.id;

  const appt = await json("/api/appointments", {
    method: "POST",
    body: JSON.stringify({
      patient_id: patientId,
      doctor_id: doctorId,
      scheduled_at: new Date(Date.now() + 86400000).toISOString(),
      reason: "Smoke test visit",
    }),
  });
  check(
    "POST /api/appointments joins names",
    appt.status === 201 && appt.body?.patient_name === "Smoke Test" && !!appt.body?.doctor_name,
    JSON.stringify(appt.body)
  );

  const updated = await json(`/api/appointments/${appt.body?.id}`, {
    method: "PUT",
    body: JSON.stringify({ status: "Completed" }),
  });
  check("PUT /api/appointments updates status", updated.status === 200 && updated.body?.status === "Completed");

  const delAppt = await json(`/api/appointments/${appt.body?.id}`, { method: "DELETE" });
  check("DELETE /api/appointments removes appointment", delAppt.status === 204);

  const delPatient = await json(`/api/patients/${patientId}`, { method: "DELETE" });
  check("DELETE /api/patients removes patient", delPatient.status === 204);

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error("Smoke test crashed:", err);
  process.exit(1);
});
