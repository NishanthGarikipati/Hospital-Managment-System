export interface Patient {
  id: number;
  name: string;
  age: number;
  gender: string;
  phone: string;
  address: string;
  created_at: string;
}

export interface Doctor {
  id: number;
  name: string;
  specialty: string;
  phone: string;
  email: string;
  created_at: string;
}

export interface Appointment {
  id: number;
  patient_id: number;
  doctor_id: number;
  scheduled_at: string;
  reason: string;
  status: string;
  created_at: string;
  patient_name: string;
  doctor_name: string;
  specialty: string;
}

export interface Stats {
  patients: number;
  doctors: number;
  appointments: number;
  scheduled: number;
  upcoming: Array<{
    id: number;
    scheduled_at: string;
    reason: string;
    status: string;
    patient_name: string;
    doctor_name: string;
    specialty: string;
  }>;
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  stats: () => request<Stats>("/api/stats"),

  listPatients: () => request<Patient[]>("/api/patients"),
  createPatient: (data: Partial<Patient>) =>
    request<Patient>("/api/patients", { method: "POST", body: JSON.stringify(data) }),
  deletePatient: (id: number) => request<void>(`/api/patients/${id}`, { method: "DELETE" }),

  listDoctors: () => request<Doctor[]>("/api/doctors"),
  createDoctor: (data: Partial<Doctor>) =>
    request<Doctor>("/api/doctors", { method: "POST", body: JSON.stringify(data) }),
  deleteDoctor: (id: number) => request<void>(`/api/doctors/${id}`, { method: "DELETE" }),

  listAppointments: () => request<Appointment[]>("/api/appointments"),
  createAppointment: (data: Partial<Appointment>) =>
    request<Appointment>("/api/appointments", { method: "POST", body: JSON.stringify(data) }),
  updateAppointment: (id: number, data: Partial<Appointment>) =>
    request<Appointment>(`/api/appointments/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteAppointment: (id: number) => request<void>(`/api/appointments/${id}`, { method: "DELETE" }),
};
