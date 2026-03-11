import { Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/Login.jsx";
import DashboardLayout from "./layouts/DashboardLayout.jsx";
import Metrics from "./pages/Metrics.jsx";
import Products from "./pages/Products.jsx";
import Assembly from "./pages/Assembly.jsx";
import Invoices from "./pages/Invoices.jsx";
import Menu from "./pages/Menu.jsx";

const AUTH_KEY = "cakeup_auth";

function isAuthenticated() {
  return localStorage.getItem(AUTH_KEY) === "true";
}

function ProtectedRoute({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login authKey={AUTH_KEY} />} />
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <DashboardLayout authKey={AUTH_KEY} />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="metrics" replace />} />
        <Route path="metrics" element={<Metrics />} />
        <Route path="menu" element={<Menu />} />
        <Route path="products" element={<Products />} />
        <Route path="assembly" element={<Assembly />} />
        <Route path="invoices" element={<Invoices />} />
      </Route>
      <Route
        path="*"
        element={<Navigate to={isAuthenticated() ? "/app" : "/login"} replace />}
      />
    </Routes>
  );
}
