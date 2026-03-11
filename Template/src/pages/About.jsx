import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const config = {
  phone: "(11) 99999-0000",
  instagram: "@cakeup",
  address: "Rua das Flores, 123 - São Paulo",
  hours: "Seg a Sáb • 09:00 - 19:00"
};

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 }
};

export default function About() {
  return (
    <>
      <section id="inicio" className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(236,72,153,0.28),_transparent_55%)]" />
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-24 lg:grid-cols-2 lg:items-center">
          <motion.div
            variants={fadeUp}
            initial="initial"
            animate="animate"
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <p className="text-xs uppercase tracking-[0.3em] text-rose-700">
              Confeitaria artesanal
            </p>
            <h1 className="font-display text-4xl font-semibold leading-tight md:text-5xl">
              Experiências doces com design sofisticado e sabor memorável.
            </h1>
            <p className="text-rose-800">
              Montagens exclusivas, ingredientes premium e um cuidado impecável
              em cada detalhe. Transformamos momentos em celebrações.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="#pedido"
                className="rounded-full bg-white px-6 py-3 text-sm font-semibold"
              >
                Fazer pedido
              </a>
              <Link
                to="/"
                className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold"
              >
                Ver cardápio
              </Link>
            </div>
          </motion.div>

          <motion.div
            variants={fadeUp}
            initial="initial"
            animate="animate"
            transition={{ duration: 0.6, delay: 0.1 }}
            className="grid gap-4"
          >
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <p className="text-sm text-rose-800">Bolo assinatura do mês</p>
              <h3 className="mt-3 text-2xl font-semibold">
                Velvet com frutas vermelhas
              </h3>
              <p className="mt-4 text-sm text-rose-700">
                Camadas delicadas, creme artesanal e finalização elegante.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <p className="text-sm text-rose-800">Atendimento premium</p>
              <h3 className="mt-3 text-2xl font-semibold">
                Encomendas personalizadas
              </h3>
              <p className="mt-4 text-sm text-rose-700">
                Experiência completa do briefing à entrega.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="sobre" className="mx-auto max-w-6xl px-6 py-20">
        <motion.div
          variants={fadeUp}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]"
        >
          <div className="space-y-4">
            <h2 className="font-display text-3xl font-semibold">Sobre nós</h2>
            <p className="text-rose-800">
              Somos uma confeitaria focada em design, técnica e experiência. Cada
              receita é desenvolvida para surpreender no paladar e no visual, com
              processos que valorizam ingredientes frescos e acabamentos
              sofisticados.
            </p>
            <p className="text-rose-800">
              Nosso time acompanha de perto cada etapa do pedido para garantir que
              o resultado final seja único e memorável.
            </p>
          </div>
          <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
            <div>
              <p className="text-xs uppercase text-rose-700">Missão</p>
              <p className="text-sm text-rose-800">
                Encantar com confeitaria premium e atendimento impecável.
              </p>
            </div>
            <div>
              <p className="text-xs uppercase text-rose-700">Visão</p>
              <p className="text-sm text-rose-800">
                Ser referência em confeitaria autoral no Brasil.
              </p>
            </div>
            <div>
              <p className="text-xs uppercase text-rose-700">Valores</p>
              <p className="text-sm text-rose-800">
                Qualidade, criatividade, transparência e cuidado em cada detalhe.
              </p>
            </div>
          </div>
        </motion.div>
      </section>

      <section id="pedido" className="mx-auto max-w-6xl px-6 py-20">
        <motion.div
          variants={fadeUp}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="rounded-3xl border border-white/10 bg-gradient-to-r from-rose-300/70 to-pink-300/50 p-8"
        >
          <h2 className="font-display text-3xl font-semibold">
            Encomendar pedido
          </h2>
          <p className="mt-4 max-w-2xl text-rose-700">
            Conte sobre o evento, sabores preferidos e prazo desejado. Vamos
            montar uma proposta personalizada para você.
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <button className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-rose-900">
              Solicitar orçamento
            </button>
            <Link
              to="/#cardapio"
              className="rounded-full border border-white/40 px-6 py-3 text-sm font-semibold"
            >
              Ver cardápio
            </Link>
          </div>
        </motion.div>
      </section>

      <section id="contato" className="mx-auto max-w-6xl px-6 py-20">
        <motion.div
          variants={fadeUp}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="grid gap-8 rounded-3xl border border-white/10 bg-white/5 p-8 lg:grid-cols-3"
        >
          <div>
            <p className="text-xs uppercase text-rose-700">Contato</p>
            <h3 className="mt-2 text-xl font-semibold">{config.phone}</h3>
            <p className="mt-2 text-sm text-rose-800">
              Instagram: {config.instagram}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase text-rose-700">Endereço</p>
            <p className="mt-2 text-sm text-rose-800">{config.address}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-rose-700">Horários</p>
            <p className="mt-2 text-sm text-rose-800">{config.hours}</p>
          </div>
        </motion.div>
      </section>
    </>
  );
}
