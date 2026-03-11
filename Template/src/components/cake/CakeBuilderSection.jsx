import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "/api";
const STORE_ID = (() => {
  const queryValue = new URLSearchParams(window.location.search).get("storeId");
  if (queryValue) return queryValue;
  if (import.meta.env.VITE_STORE_ID) return import.meta.env.VITE_STORE_ID;
  return window.location.hostname;
})();

const FILLING_COLORS = [
  "#ec4899",
  "#f472b6",
  "#fb7185",
  "#f9a8d4",
  "#f43f5e",
  "#f97316",
  "#e11d48",
  "#fb7185",
  "#fda4af"
];

const layerVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 }
};

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(value);
}

function formatWeight(value) {
  const numeric = Number(value);
  if (Number.isNaN(numeric) || numeric <= 0) return "";
  return `${numeric.toFixed(2).replace(".", ",")}kg`;
}

function isValidCpf(value) {
  if (!value) return false;
  const digits = value.replace(/\D/g, "");
  return digits.length === 11;
}

function isValidPhone(value) {
  if (!value) return false;
  const digits = value.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 11;
}

function sanitizePhone(value) {
  return (value || "").replace(/\D/g, "");
}

function getOption(options, value) {
  if (!options || options.length === 0) {
    return { value: "", label: "", price: 0, color: "#fbcfe8" };
  }
  return options.find((option) => option.value === value) || options[0];
}

function getFilling(options, optionValue) {
  return getOption(options, optionValue);
}

function LayerConfiguration({ index, layer, onChange, fillingOptions }) {
  return (
    <motion.div
      key={index}
      variants={layerVariants}
      initial="hidden"
      animate="show"
      className="rounded-2xl border border-rose-300 bg-white p-4 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase text-rose-700">
          Camada {index + 1}
        </h3>
        <span className="text-xs text-rose-700/70">2 combinações</span>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs uppercase text-rose-700/80">Combinação 1</label>
          <select
            value={layer.comb1}
            onChange={(event) => onChange({ ...layer, comb1: event.target.value })}
            className="w-full rounded-md border border-rose-300 bg-white px-3 py-2 text-sm"
          >
            {fillingOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label} (+{formatCurrency(option.price)})
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-xs uppercase text-rose-700/80">Combinação 2</label>
          <select
            value={layer.comb2}
            onChange={(event) => onChange({ ...layer, comb2: event.target.value })}
            className="w-full rounded-md border border-rose-300 bg-white px-3 py-2 text-sm"
          >
            {fillingOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label} (+{formatCurrency(option.price)})
              </option>
            ))}
          </select>
        </div>
      </div>
    </motion.div>
  );
}

function CakePreview({ layers, visibleLayers, fillingOptions }) {
  const renderedLayers = layers.slice(0, visibleLayers).map((layer) => {
    const filling1 = getFilling(fillingOptions, layer.comb1);
    const filling2 = getFilling(fillingOptions, layer.comb2);
    return {
      gradient: `linear-gradient(135deg, ${filling1.color}, ${filling2.color})`
    };
  });

  return (
    <div className="relative flex flex-col items-center justify-end rounded-3xl border border-rose-300 bg-white p-8 shadow-sm">
      <div className="mb-6 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-rose-700/70">
          Prévia do bolo
        </p>
        <h3 className="mt-2 text-xl font-semibold text-rose-900">
          Camadas personalizadas
        </h3>
      </div>
      <div className="flex w-full flex-col items-center gap-3">
        <div className="h-5 w-32 rounded-full bg-rose-200 shadow-inner" />
        <AnimatePresence>
          {renderedLayers
            .slice()
            .reverse()
            .map((layer, index) => (
              <motion.div
                key={`layer-${index}`}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.98 }}
                transition={{ duration: 0.3 }}
                className="h-12 w-52 rounded-3xl shadow-md"
                style={{ background: layer.gradient }}
              />
            ))}
        </AnimatePresence>
        <div className="h-4 w-56 rounded-full bg-rose-300 shadow-inner" />
        <div className="h-5 w-64 rounded-full bg-rose-400 shadow-inner" />
      </div>
      <div className="mt-6 text-xs text-rose-700/70">
        Camadas exibidas: {visibleLayers}
      </div>
    </div>
  );
}

function TotalPriceDisplay({ total }) {
  return (
    <div className="rounded-2xl border border-rose-300 bg-white p-5 text-center shadow-sm">
      <p className="text-xs uppercase tracking-[0.3em] text-rose-700/70">
        Valor estimado
      </p>
      <p className="mt-2 text-3xl font-semibold text-rose-900">
        {formatCurrency(total)}
      </p>
      <p className="mt-2 text-xs text-rose-700/70">
        Baseado nas escolhas atuais.
      </p>
    </div>
  );
}

function CustomerInfoStep({ values, onChange, onNext }) {
  const [errors, setErrors] = useState({});

  function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = {};
    if (!values.name.trim()) nextErrors.name = "Informe o nome completo.";
    if (!isValidPhone(values.phone)) {
      nextErrors.phone = "Telefone inválido. Use DDD.";
    }
    if (!isValidCpf(values.cpf)) {
      nextErrors.cpf = "CPF inválido. Use 11 dígitos.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) {
      onNext();
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border border-rose-300 bg-white p-6 shadow-sm"
    >
      <h2 className="text-xl font-semibold text-rose-900">
        Antes de começar
      </h2>
      <p className="mt-2 text-sm text-rose-700/80">
        Preencha seus dados para personalizar seu bolo. Não salvamos essas
        informações.
      </p>
      <div className="mt-6 grid gap-4">
        <label className="text-sm">
          <span className="text-xs uppercase text-rose-700/80">
            Nome completo
          </span>
          <input
            value={values.name}
            onChange={(event) => onChange({ ...values, name: event.target.value })}
            className="mt-2 w-full rounded-md border border-rose-300 bg-white px-3 py-2 text-sm"
            placeholder="Ex: Maria Oliveira"
          />
          {errors.name && (
            <span className="mt-1 block text-xs text-rose-700">{errors.name}</span>
          )}
        </label>
        <label className="text-sm">
          <span className="text-xs uppercase text-rose-700/80">Telefone</span>
          <input
            value={values.phone}
            onChange={(event) => onChange({ ...values, phone: event.target.value })}
            className="mt-2 w-full rounded-md border border-rose-300 bg-white px-3 py-2 text-sm"
            placeholder="(11) 99999-0000"
          />
          {errors.phone && (
            <span className="mt-1 block text-xs text-rose-700">{errors.phone}</span>
          )}
        </label>
        <label className="text-sm">
          <span className="text-xs uppercase text-rose-700/80">CPF</span>
          <input
            value={values.cpf}
            onChange={(event) => onChange({ ...values, cpf: event.target.value })}
            className="mt-2 w-full rounded-md border border-rose-300 bg-white px-3 py-2 text-sm"
            placeholder="000.000.000-00"
          />
          {errors.cpf && (
            <span className="mt-1 block text-xs text-rose-700">{errors.cpf}</span>
          )}
        </label>
      </div>
      <button
        type="submit"
        className="mt-6 w-full rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white"
      >
        Continuar para montagem
      </button>
    </form>
  );
}

function CakeConfigurationInputs({
  mass,
  weight,
  layers,
  visibleLayers,
  massOptions,
  fillingOptions,
  onMassChange,
  onWeightChange,
  onLayerChange,
  onRevealLayer
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-rose-300 bg-white p-4 shadow-sm">
        <label className="text-xs uppercase text-rose-700/80">Massa</label>
        <select
          value={mass}
          onChange={(event) => onMassChange(event.target.value)}
          className="mt-2 w-full rounded-md border border-rose-300 bg-white px-3 py-2 text-sm"
        >
          {massOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label} (+{formatCurrency(option.price)})
            </option>
          ))}
        </select>
      </div>
      <div className="rounded-2xl border border-rose-300 bg-white p-4 shadow-sm">
        <label className="text-xs uppercase text-rose-700/80">Peso</label>
        <input
          type="number"
          min="0.5"
          step="0.1"
          value={weight}
          onChange={(event) => onWeightChange(Number(event.target.value))}
          className="mt-2 w-full rounded-md border border-rose-300 bg-white px-3 py-2 text-sm"
          placeholder="Ex: 1.5"
        />
        <p className="mt-2 text-xs text-rose-700/70">
          Informe o peso em kg.
        </p>
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {layers.slice(0, visibleLayers).map((layer, index) => (
            <LayerConfiguration
              key={`layer-${index}`}
              index={index}
              layer={layer}
              fillingOptions={fillingOptions}
              onChange={(nextLayer) => onLayerChange(index, nextLayer)}
            />
          ))}
        </AnimatePresence>
      </div>

      {visibleLayers < 3 && (
        <button
          type="button"
          onClick={onRevealLayer}
          className="w-full rounded-full border border-rose-400 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100"
        >
          Customizar próxima camada
        </button>
      )}
    </div>
  );
}

export default function CakeBuilderSection() {
  const [step, setStep] = useState("info");
  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    cpf: ""
  });
  const storeWhatsapp = import.meta.env.VITE_STORE_WHATSAPP_PHONE || "";
  const [massOptions, setMassOptions] = useState([]);
  const [fillingOptions, setFillingOptions] = useState([]);
  const [optionsStatus, setOptionsStatus] = useState("idle");
  const [mass, setMass] = useState("");
  const [weight, setWeight] = useState(0);
  const [visibleLayers, setVisibleLayers] = useState(1);
  const [layers, setLayers] = useState([
    { comb1: "", comb2: "" },
    { comb1: "", comb2: "" },
    { comb1: "", comb2: "" }
  ]);

  useEffect(() => {
    let active = true;
    async function loadOptions() {
      if (!STORE_ID) {
        setOptionsStatus("error");
        return;
      }
      setOptionsStatus("loading");
      try {
        const res = await fetch(`${API_BASE}/public/assembly/${STORE_ID}`);
        if (!res.ok) throw new Error("Falha ao carregar preços");
        const data = await res.json();
        if (!active) return;
        const massas = Array.isArray(data.massas) ? data.massas : [];
        const recheios = Array.isArray(data.recheios) ? data.recheios : [];
        const nextMassOptions = massas.map((item) => ({
          value: item.id,
          label: item.name,
          price: Number(item.pricePerKg) || 0
        }));
        const nextFillingOptions = recheios.map((item, index) => ({
          value: item.id,
          label: item.name,
          price: Number(item.pricePerKg) || 0,
          color: FILLING_COLORS[index % FILLING_COLORS.length]
        }));
        setMassOptions(nextMassOptions);
        setFillingOptions(nextFillingOptions);
        setOptionsStatus("ready");
      } catch (err) {
        if (!active) return;
        setMassOptions([]);
        setFillingOptions([]);
        setOptionsStatus("error");
      }
    }
    loadOptions();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!massOptions.length || !fillingOptions.length) return;
    setMass((prev) =>
      massOptions.some((option) => option.value === prev)
        ? prev
        : massOptions[0].value
    );
    setLayers((prev) => {
      const first = fillingOptions[0].value;
      const second = fillingOptions[1]?.value || first;
      return prev.map((layer) => ({
        comb1: fillingOptions.some((option) => option.value === layer.comb1)
          ? layer.comb1
          : first,
        comb2: fillingOptions.some((option) => option.value === layer.comb2)
          ? layer.comb2
          : second
      }));
    });
  }, [massOptions, fillingOptions]);

  const total = useMemo(() => {
    const massPrice = getOption(massOptions, mass).price;
    const layersTotal = layers.reduce((acc, layer) => {
      const comb1 = getFilling(fillingOptions, layer.comb1).price;
      const comb2 = getFilling(fillingOptions, layer.comb2).price;
      return acc + comb1 + comb2;
    }, 0);
    return weight * (massPrice + layersTotal);
  }, [mass, weight, layers, massOptions, fillingOptions]);

  function handleLayerChange(index, nextLayer) {
    setLayers((prev) => prev.map((layer, idx) => (idx === index ? nextLayer : layer)));
  }

  function handleConfirmOrder() {
    const phone = sanitizePhone(storeWhatsapp);
    if (!phone) return;
    const massLabel = getOption(massOptions, mass).label;
    const layerLines = layers.map((layer, index) => {
      const comb1 = getFilling(fillingOptions, layer.comb1).label;
      const comb2 = getFilling(fillingOptions, layer.comb2).label;
      return `Camada ${index + 1}: ${comb1} + ${comb2}`;
    });
    const message = [
      "Nova comanda - Montagem de bolo",
      "",
      `Nome: ${customer.name}`,
      `Telefone: ${customer.phone}`,
      `CPF: ${customer.cpf}`,
      "",
      `Massa: ${massLabel}`,
      `Peso: ${formatWeight(weight) || `${weight}kg`}`,
      ...layerLines,
      "",
      `Total estimado: ${formatCurrency(total)}`
    ].join("\n");
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  const canConfirm =
    sanitizePhone(storeWhatsapp).length >= 10 &&
    weight > 0 &&
    Boolean(customer.name) &&
    Boolean(customer.phone) &&
    Boolean(customer.cpf);

  return (
    <section id="montagem" className="mx-auto max-w-6xl px-6 py-20">
      <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          {step === "info" ? (
            <CustomerInfoStep
              values={customer}
              onChange={setCustomer}
              onNext={() => setStep("builder")}
            />
          ) : (
            <>
              <CakeConfigurationInputs
                mass={mass}
                weight={weight}
                layers={layers}
                visibleLayers={visibleLayers}
                massOptions={massOptions}
                fillingOptions={fillingOptions}
                onMassChange={setMass}
                onWeightChange={setWeight}
                onLayerChange={handleLayerChange}
                onRevealLayer={() => setVisibleLayers((prev) => Math.min(prev + 1, 3))}
              />
              <TotalPriceDisplay total={total} />
              <button
                type="button"
                onClick={handleConfirmOrder}
                disabled={!canConfirm}
                className="w-full rounded-full bg-rose-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                Confirmar pedido no WhatsApp
              </button>
              {!sanitizePhone(storeWhatsapp) && (
                <p className="text-xs text-rose-700/70">
                  Defina VITE_STORE_WHATSAPP_PHONE para receber a comanda.
                </p>
              )}
            </>
          )}
        </div>

        <div className="space-y-6">
          <CakePreview
            layers={layers}
            visibleLayers={visibleLayers}
            fillingOptions={fillingOptions}
          />
        </div>
      </div>
    </section>
  );
}
