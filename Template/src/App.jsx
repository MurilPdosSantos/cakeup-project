import { BrowserRouter, Link, Outlet, Route, Routes } from "react-router-dom";
import About from "./pages/About.jsx";
import Home from "./pages/Home.jsx";
import Montagem from "./pages/Montagem.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="sobre" element={<About />} />
          <Route path="montagem" element={<Montagem />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

function Layout() {
  return (
    <div className="min-h-screen bg-white text-rose-900">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="text-lg font-semibold">CakeUp</div>
          <nav className="hidden items-center gap-6 text-sm md:flex">
            <a href="/#inicio" className="hover:text-rose-900">
              Início
            </a>
            <a href="/#cardapio" className="hover:text-rose-900">
              Cardápio
            </a>
            <Link to="/sobre" className="hover:text-rose-900">
              Sobre nós
            </Link>
            <Link to="/montagem" className="hover:text-rose-900">
              Monte seu bolo
            </Link>
            <a href="/#pedido" className="hover:text-rose-900">
              Encomendar Pedido
            </a>
            <a
              href="/#contato"
              className="rounded-full border border-white/20 px-4 py-2"
            >
              Contato
            </a>
          </nav>
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="border-t border-white/10 py-8 text-center text-xs text-rose-700">
        CakeUp © 2026. Todos os direitos reservados.
      </footer>
    </div>
  );
}
