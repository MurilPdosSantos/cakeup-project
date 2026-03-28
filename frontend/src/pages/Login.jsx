import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const API_BASE = "/api";

export default function Login({ authKey }) {
  const navigate = useNavigate();
  const [domain, setDomain] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setIsLoading(true);
    setStatus("Autenticando...");
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ domain, password })
      });

      if (!res.ok) {
        setStatus("Falha no login");
        return;
      }

      localStorage.setItem(authKey, "true");
      setStatus("Login ok");
      navigate("/app/metrics");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F5F3] p-6 text-[#2E2E2C]">
      <motion.div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <h1 className="text-2xl font-semibold">CakeUp</h1>
        <p className="text-sm text-[#2E2E2C]">Acesso do administrador</p>

        <form onSubmit={handleLogin} className="mt-6 space-y-3">
          <input
            className="w-full rounded-md bg-[#E8F5EE] px-3 py-2 text-sm"
            placeholder="Domínio da loja"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
          />
          <input
            type="password"
            className="w-full rounded-md bg-[#E8F5EE] px-3 py-2 text-sm"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            disabled={isLoading}
            className="w-full rounded-md bg-[#1A6F4A] py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            Entrar
          </button>
        </form>

        {status && (
          <div className="mt-4 text-sm text-[#2E2E2C]">{status}</div>
        )}

        {isLoading && (
          <div className="mt-4 flex items-center gap-2 text-sm text-[#2E2E2C]">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#1A6F4A] border-t-transparent" />
            Carregando...
          </div>
        )}
      </motion.div>
    </div>
  );
}
