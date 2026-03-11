import { Outlet, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Sidebar from "../components/Sidebar.jsx";

export default function DashboardLayout({ authKey }) {
  const navigate = useNavigate();

  function handleLogout() {
    localStorage.removeItem(authKey);
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-white text-[#4A2C2A]">
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase text-[#4A2C2A]">CakeUp Admin</p>
              <h1 className="text-2xl font-semibold">Painel da Loja</h1>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-md border border-[#F48FB1] px-4 py-2 text-sm hover:border-[#F48FB1]"
            >
              Sair
            </button>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}
