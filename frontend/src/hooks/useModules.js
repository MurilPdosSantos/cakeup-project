import { useState, useEffect } from "react";

const STORAGE_KEY = "cakeup_modules";
const API_BASE = "/api";

export function useModules() {
  const [modules, setModules] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    let cancelled = false;

    fetch(`${API_BASE}/auth/me`, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data?.modules) return;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data.modules));
        setModules(data.modules);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  return modules;
}
