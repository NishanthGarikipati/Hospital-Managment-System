import Database from "better-sqlite3";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { mkdirSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));

const dataDir = process.env.DB_DIR ?? join(__dirname, "..", "data");
mkdirSync(dataDir, { recursive: true });

const dbPath = process.env.DB_PATH ?? join(dataDir, "hospital.db");

export const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

export function initSchema(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS patients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      age INTEGER NOT NULL,
      gender TEXT NOT NULL,
      phone TEXT NOT NULL DEFAULT '',
      address TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS doctors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      specialty TEXT NOT NULL,
      phone TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
      doctor_id INTEGER NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
      scheduled_at TEXT NOT NULL,
      reason TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'Scheduled',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

export function isSeeded(): boolean {
  const row = db.prepare("SELECT COUNT(*) AS n FROM patients").get() as { n: number };
  return row.n > 0;
}

export function seed(force = false): void {
  initSchema();
  if (isSeeded() && !force) return;

  const wipe = db.transaction(() => {
    db.exec("DELETE FROM appointments; DELETE FROM doctors; DELETE FROM patients;");
    db.exec("DELETE FROM sqlite_sequence WHERE name IN ('appointments','doctors','patients');");
  });
  wipe();

  const insertPatient = db.prepare(
    "INSERT INTO patients (name, age, gender, phone, address) VALUES (?, ?, ?, ?, ?)"
  );
  const insertDoctor = db.prepare(
    "INSERT INTO doctors (name, specialty, phone, email) VALUES (?, ?, ?, ?)"
  );
  const insertAppt = db.prepare(
    "INSERT INTO appointments (patient_id, doctor_id, scheduled_at, reason, status) VALUES (?, ?, ?, ?, ?)"
  );

  const tx = db.transaction(() => {
    const patients = [
      ["Alice Johnson", 34, "Female", "555-0101", "12 Maple St"],
      ["Robert Chen", 52, "Male", "555-0102", "88 Oak Ave"],
      ["Maria Garcia", 27, "Female", "555-0103", "5 Pine Rd"],
      ["James Wilson", 45, "Male", "555-0104", "301 Birch Blvd"],
      ["Fatima Noor", 61, "Female", "555-0105", "77 Cedar Ln"],
    ];
    const patientIds = patients.map((p) => Number(insertPatient.run(...(p as [string, number, string, string, string])).lastInsertRowid));

    const doctors = [
      ["Dr. Sarah Patel", "Cardiology", "555-0201", "s.patel@hospital.org"],
      ["Dr. Daniel Okafor", "Pediatrics", "555-0202", "d.okafor@hospital.org"],
      ["Dr. Emily Nguyen", "Orthopedics", "555-0203", "e.nguyen@hospital.org"],
      ["Dr. Marcus Lee", "General Medicine", "555-0204", "m.lee@hospital.org"],
    ];
    const doctorIds = doctors.map((d) => Number(insertDoctor.run(...(d as [string, string, string, string])).lastInsertRowid));

    const now = new Date();
    const day = (offset: number, hour: number) => {
      const d = new Date(now);
      d.setDate(d.getDate() + offset);
      d.setHours(hour, 0, 0, 0);
      return d.toISOString();
    };

    const appts: [number, number, string, string, string][] = [
      [patientIds[0], doctorIds[0], day(1, 9), "Routine heart checkup", "Scheduled"],
      [patientIds[1], doctorIds[0], day(1, 11), "Chest pain follow-up", "Scheduled"],
      [patientIds[2], doctorIds[1], day(2, 10), "Child vaccination", "Scheduled"],
      [patientIds[3], doctorIds[2], day(-1, 14), "Knee X-ray review", "Completed"],
      [patientIds[4], doctorIds[3], day(3, 13), "Annual physical", "Scheduled"],
    ];
    for (const a of appts) insertAppt.run(...a);
  });
  tx();
}
