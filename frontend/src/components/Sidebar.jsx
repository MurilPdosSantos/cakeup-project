import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";

const links = [
  { label: "Métricas", to: "/app/metrics" },
  { label: "Cardápio", to: "/app/menu" },
  { label: "Produtos", to: "/app/products" },
  { label: "Montagem", to: "/app/assembly" },
  { label: "Faturas", to: "/app/invoices" }
];

export default function Sidebar() {
  return (
    <aside className="min-h-screen w-64 border-r border-[#F48FB1] bg-white p-6">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mb-10"
      >
        <div className="text-xs uppercase text-[#4A2C2A]">CakeUp</div>
        <div className="text-xl font-semibold">Admin</div>
      </motion.div>

      <nav className="space-y-2">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              [
                "block rounded-lg px-4 py-2 text-sm transition",
                isActive
                  ? "bg-white/15 text-[#4A2C2A]"
                  : "text-[#4A2C2A] hover:bg-[#FFCCBC]"
              ].join(" ")
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
