import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import MenuSection from "../components/menu/MenuSection.jsx";

const API_BASE = import.meta.env.VITE_API_BASE || "/api";
const STORE_ID = (() => {
  const queryValue = new URLSearchParams(window.location.search).get("storeId");
  if (queryValue) return queryValue;
  if (import.meta.env.VITE_STORE_ID) return import.meta.env.VITE_STORE_ID;
  return window.location.hostname;
})();

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 }
};

const menuRequestCache = new Map();

function getCookieValue(name) {
  if (typeof document === "undefined") return "";
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = document.cookie.match(new RegExp(`(?:^|; )${escaped}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : "";
}

function setCookie(name, value, maxAgeSeconds) {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${maxAgeSeconds}; Path=/; SameSite=Lax${secure}`;
}

async function fetchMenuData(storeId, skipPageView) {
  const cacheKey = `${storeId}:${skipPageView ? "1" : "0"}`;
  if (!menuRequestCache.has(cacheKey)) {
    const request = fetch(`${API_BASE}/public/menu/${storeId}`, {
      credentials: "include",
      headers: skipPageView ? { "X-Skip-Pageview": "1" } : undefined
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Falha ao carregar cardápio");
        }
        return res.json();
      })
      .catch((err) => {
        menuRequestCache.delete(cacheKey);
        throw err;
      });
    menuRequestCache.set(cacheKey, request);
  }

  return menuRequestCache.get(cacheKey);
}

export default function Home() {
  const [menuSections, setMenuSections] = useState([]);
  const [menuStatus, setMenuStatus] = useState("Carregando cardápio...");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!STORE_ID) {
      setMenuSections([]);
      setMenuStatus(
        "Não foi possível identificar o domínio para carregar o cardápio."
      );
      return;
    }

    let active = true;
    async function loadMenu() {
      try {
        const accessCookieName = `store_access_${STORE_ID}`;
        const hasAccessCookie = Boolean(getCookieValue(accessCookieName));
        const data = await fetchMenuData(STORE_ID, hasAccessCookie);
        if (!active) return;
        if (!hasAccessCookie) {
          setCookie(accessCookieName, "1", 24 * 60 * 60);
        }
        const activeFlag = data?.active !== false;
        setIsActive(activeFlag);
        if (!activeFlag) {
          setMenuSections([]);
          setMenuStatus("Site fora do ar");
          return;
        }
        setMenuSections(Array.isArray(data.sections) ? data.sections : []);
        setMenuStatus("");
      } catch (err) {
        if (!active) return;
        setMenuSections([]);
        console.log(err)
        setMenuStatus("Cardápio indisponível no momento.");
      }
    }

    loadMenu();
    return () => {
      active = false;
    };
  }, []);

  if (!isActive) {
    return (
      <section className="mx-auto flex min-h-[60vh] max-w-6xl items-center justify-center px-6 py-20">
        <motion.div
          variants={fadeUp}
          initial="initial"
          animate="animate"
          transition={{ duration: 0.5 }}
          className="rounded-3xl border border-white/10 bg-white/70 p-10 text-center"
        >
          <h2 className="font-display text-3xl font-semibold text-rose-900">
            Site fora do ar
          </h2>
          <p className="mt-3 text-sm text-rose-700/80">
            Esta loja está indisponível no momento. Tente novamente mais tarde.
          </p>
        </motion.div>
      </section>
    );
  }

  return (
    <section id="cardapio" className="mx-auto max-w-6xl px-6 py-20">
      <motion.div
        variants={fadeUp}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="space-y-10"
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-rose-700">
              Nosso cardápio
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold">
              Seções configuradas para sua vitrine
            </h2>
            <p className="mt-3 max-w-2xl text-sm text-rose-800">
              Monte o catálogo ideal para destacar seus produtos e apresentar
              cada categoria com o layout que combina com sua marca.
            </p>
          </div>
          <a
            href="/sobre#pedido"
            className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-wide"
          >
            Fazer pedido
          </a>
        </div>

        {menuSections.length === 0 ? (
          <p className="text-sm text-rose-700">
            {menuStatus || "Nenhuma seção configurada ainda."}
          </p>
        ) : (
          <div className="space-y-12">
            {menuSections.map((section) => (
              <MenuSection key={section.id || section.name} section={section} />
            ))}
          </div>
        )}
      </motion.div>
    </section>
  );
}
