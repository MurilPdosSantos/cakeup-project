import { Navigate } from "react-router-dom";
import { useModules } from "../hooks/useModules.js";

export function ModuleRoute({ module, children }) {
  const modules = useModules();

  if (modules.length === 0) return null;

  if (!modules.includes(module)) {
    return <Navigate to="/app" replace />;
  }

  return children;
}
