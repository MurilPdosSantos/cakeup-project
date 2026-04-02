import { Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/Login.jsx";
import LpCakeup from "./pages/LpCakeup.jsx";
import DashboardLayout from "./layouts/DashboardLayout.jsx";
import Metrics from "./pages/Metrics.jsx";
import Products from "./pages/Products.jsx";
import Assembly from "./pages/Assembly.jsx";
import Invoices from "./pages/Invoices.jsx";
import Menu from "./pages/Menu.jsx";
import { ModuleRoute } from "./components/ModuleRoute.jsx";

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
      <Route path="/lp-cakeup" element={<LpCakeup />} />
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
        <Route path="metrics" element={<ModuleRoute module="METRICS"><Metrics /></ModuleRoute>} />
        <Route path="menu" element={<ModuleRoute module="MENU"><Menu /></ModuleRoute>} />
        <Route path="products" element={<ModuleRoute module="PRODUCTS"><Products /></ModuleRoute>} />
        <Route path="assembly" element={<ModuleRoute module="ASSEMBLY"><Assembly /></ModuleRoute>} />
        <Route path="invoices" element={<ModuleRoute module="INVOICES"><Invoices /></ModuleRoute>} />
      </Route>
      <Route
        path="*"
        element={<Navigate to={isAuthenticated() ? "/app" : "/login"} replace />}
      />
    </Routes>
  );
}
