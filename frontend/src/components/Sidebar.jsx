import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { useModules } from "../hooks/useModules.js";

const allLinks = [
  { label: "Métricas", to: "/app/metrics", module: "METRICS" },
  { label: "Cardápio", to: "/app/menu", module: "MENU" },
  { label: "Produtos", to: "/app/products", module: "PRODUCTS" },
  { label: "Montagem", to: "/app/assembly", module: "ASSEMBLY" },
  { label: "Faturas", to: "/app/invoices", module: "INVOICES" }
];

export default function Sidebar() {
  const modules = useModules();

  const links = allLinks.filter((link) => modules.includes(link.module));

  return (
    <aside className="min-h-screen w-64 border-r border-[#1A6F4A] bg-[#1B3D2F] p-6">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mb-10"
      >
        <div className="text-xs uppercase text-white/60">CakeUp</div>
        <div className="text-xl font-semibold text-white">Admin</div>
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
                  ? "bg-white/20 text-white"
                  : "text-white/80 hover:bg-white/10"
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
