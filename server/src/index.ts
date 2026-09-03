import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import { db, initSchema, seed } from "./db.js";

initSchema();
seed();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = Number(process.env.PORT ?? 4000);

function asyncErrors(handler: (req: Request, res: Response) => void) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      handler(req, res);
    } catch (err) {
      next(err);
    }
  };
}

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

app.get(
  "/api/stats",
  asyncErrors((_req, res) => {
    const patients = (db.prepare("SELECT COUNT(*) AS n FROM patients").get() as { n: number }).n;
    const doctors = (db.prepare("SELECT COUNT(*) AS n FROM doctors").get() as { n: number }).n;
    const appointments = (db.prepare("SELECT COUNT(*) AS n FROM appointments").get() as { n: number }).n;
    const scheduled = (
      db.prepare("SELECT COUNT(*) AS n FROM appointments WHERE status = 'Scheduled'").get() as { n: number }
    ).n;
    const upcoming = db
      .prepare(
        `SELECT a.id, a.scheduled_at, a.reason, a.status,
                p.name AS patient_name, d.name AS doctor_name, d.specialty
         FROM appointments a
         JOIN patients p ON p.id = a.patient_id
         JOIN doctors d ON d.id = a.doctor_id
         WHERE a.status = 'Scheduled'
         ORDER BY a.scheduled_at ASC
         LIMIT 5`
      )
      .all();
    res.json({ patients, doctors, appointments, scheduled, upcoming });
  })
);

// ---- Patients ----
app.get(
  "/api/patients",
  asyncErrors((_req, res) => {
    res.json(db.prepare("SELECT * FROM patients ORDER BY created_at DESC, id DESC").all());
  })
);

app.post(
  "/api/patients",
  asyncErrors((req, res) => {
    const { name, age, gender, phone, address } = req.body ?? {};
    if (!name || age === undefined || age === null || !gender) {
      res.status(400).json({ error: "name, age and gender are required" });
      return;
    }
    const info = db
      .prepare("INSERT INTO patients (name, age, gender, phone, address) VALUES (?, ?, ?, ?, ?)")
      .run(String(name), Number(age), String(gender), String(phone ?? ""), String(address ?? ""));
    res.status(201).json(db.prepare("SELECT * FROM patients WHERE id = ?").get(info.lastInsertRowid));
  })
);

app.put(
  "/api/patients/:id",
  asyncErrors((req, res) => {
    const { name, age, gender, phone, address } = req.body ?? {};
    const existing = db.prepare("SELECT * FROM patients WHERE id = ?").get(req.params.id) as
      | Record<string, unknown>
      | undefined;
    if (!existing) {
      res.status(404).json({ error: "patient not found" });
      return;
    }
    db.prepare("UPDATE patients SET name=?, age=?, gender=?, phone=?, address=? WHERE id=?").run(
      String(name ?? existing.name),
      Number(age ?? existing.age),
      String(gender ?? existing.gender),
      String(phone ?? existing.phone),
      String(address ?? existing.address),
      req.params.id
    );
    res.json(db.prepare("SELECT * FROM patients WHERE id = ?").get(req.params.id));
  })
);

app.delete(
  "/api/patients/:id",
  asyncErrors((req, res) => {
    const info = db.prepare("DELETE FROM patients WHERE id = ?").run(req.params.id);
    if (info.changes === 0) {
      res.status(404).json({ error: "patient not found" });
      return;
    }
    res.status(204).end();
  })
);

// ---- Doctors ----
app.get(
  "/api/doctors",
  asyncErrors((_req, res) => {
    res.json(db.prepare("SELECT * FROM doctors ORDER BY created_at DESC, id DESC").all());
  })
);

app.post(
  "/api/doctors",
  asyncErrors((req, res) => {
    const { name, specialty, phone, email } = req.body ?? {};
    if (!name || !specialty) {
      res.status(400).json({ error: "name and specialty are required" });
      return;
    }
    const info = db
      .prepare("INSERT INTO doctors (name, specialty, phone, email) VALUES (?, ?, ?, ?)")
      .run(String(name), String(specialty), String(phone ?? ""), String(email ?? ""));
    res.status(201).json(db.prepare("SELECT * FROM doctors WHERE id = ?").get(info.lastInsertRowid));
  })
);

app.put(
  "/api/doctors/:id",
  asyncErrors((req, res) => {
    const { name, specialty, phone, email } = req.body ?? {};
    const existing = db.prepare("SELECT * FROM doctors WHERE id = ?").get(req.params.id) as
      | Record<string, unknown>
      | undefined;
    if (!existing) {
      res.status(404).json({ error: "doctor not found" });
      return;
    }
    db.prepare("UPDATE doctors SET name=?, specialty=?, phone=?, email=? WHERE id=?").run(
      String(name ?? existing.name),
      String(specialty ?? existing.specialty),
      String(phone ?? existing.phone),
      String(email ?? existing.email),
      req.params.id
    );
    res.json(db.prepare("SELECT * FROM doctors WHERE id = ?").get(req.params.id));
  })
);

app.delete(
  "/api/doctors/:id",
  asyncErrors((req, res) => {
    const info = db.prepare("DELETE FROM doctors WHERE id = ?").run(req.params.id);
    if (info.changes === 0) {
      res.status(404).json({ error: "doctor not found" });
      return;
    }
    res.status(204).end();
  })
);

// ---- Appointments ----
const appointmentSelect = `
  SELECT a.id, a.patient_id, a.doctor_id, a.scheduled_at, a.reason, a.status, a.created_at,
         p.name AS patient_name, d.name AS doctor_name, d.specialty
  FROM appointments a
  JOIN patients p ON p.id = a.patient_id
  JOIN doctors d ON d.id = a.doctor_id
`;

app.get(
  "/api/appointments",
  asyncErrors((_req, res) => {
    res.json(db.prepare(`${appointmentSelect} ORDER BY a.scheduled_at ASC`).all());
  })
);

app.post(
  "/api/appointments",
  asyncErrors((req, res) => {
    const { patient_id, doctor_id, scheduled_at, reason, status } = req.body ?? {};
    if (!patient_id || !doctor_id || !scheduled_at) {
      res.status(400).json({ error: "patient_id, doctor_id and scheduled_at are required" });
      return;
    }
    const patient = db.prepare("SELECT id FROM patients WHERE id = ?").get(patient_id);
    const doctor = db.prepare("SELECT id FROM doctors WHERE id = ?").get(doctor_id);
    if (!patient || !doctor) {
      res.status(400).json({ error: "unknown patient_id or doctor_id" });
      return;
    }
    const info = db
      .prepare(
        "INSERT INTO appointments (patient_id, doctor_id, scheduled_at, reason, status) VALUES (?, ?, ?, ?, ?)"
      )
      .run(
        Number(patient_id),
        Number(doctor_id),
        String(scheduled_at),
        String(reason ?? ""),
        String(status ?? "Scheduled")
      );
    res.status(201).json(db.prepare(`${appointmentSelect} WHERE a.id = ?`).get(info.lastInsertRowid));
  })
);

app.put(
  "/api/appointments/:id",
  asyncErrors((req, res) => {
    const { scheduled_at, reason, status } = req.body ?? {};
    const existing = db.prepare("SELECT * FROM appointments WHERE id = ?").get(req.params.id) as
      | Record<string, unknown>
      | undefined;
    if (!existing) {
      res.status(404).json({ error: "appointment not found" });
      return;
    }
    db.prepare("UPDATE appointments SET scheduled_at=?, reason=?, status=? WHERE id=?").run(
      String(scheduled_at ?? existing.scheduled_at),
      String(reason ?? existing.reason),
      String(status ?? existing.status),
      req.params.id
    );
    res.json(db.prepare(`${appointmentSelect} WHERE a.id = ?`).get(req.params.id));
  })
);

app.delete(
  "/api/appointments/:id",
  asyncErrors((req, res) => {
    const info = db.prepare("DELETE FROM appointments WHERE id = ?").run(req.params.id);
    if (info.changes === 0) {
      res.status(404).json({ error: "appointment not found" });
      return;
    }
    res.status(204).end();
  })
);

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "internal server error" });
});

app.listen(PORT, () => {
  console.log(`Hospital API listening on http://localhost:${PORT}`);
});
