import { NavLink, Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import Doctors from "./pages/Doctors";
import Appointments from "./pages/Appointments";

const navItems = [
  { to: "/", label: "Dashboard", icon: "grid", end: true },
  { to: "/patients", label: "Patients", icon: "user", end: false },
  { to: "/doctors", label: "Doctors", icon: "stethoscope", end: false },
  { to: "/appointments", label: "Appointments", icon: "calendar", end: false },
];

function Icon({ name }: { name: string }) {
  return <span className={`icon icon-${name}`} aria-hidden="true" />;
}

export default function App() {
  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">+</span>
          <div>
            <div className="brand-name">MediCare</div>
            <div className="brand-sub">Hospital System</div>
          </div>
        </div>
        <nav className="nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">v1.0 &middot; Demo</div>
      </aside>
      <main className="content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/patients" element={<Patients />} />
          <Route path="/doctors" element={<Doctors />} />
          <Route path="/appointments" element={<Appointments />} />
        </Routes>
      </main>
    </div>
  );
}
