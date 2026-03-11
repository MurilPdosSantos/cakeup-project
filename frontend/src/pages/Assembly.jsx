import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE || "/api";
const AUTH_KEY = "cakeup_auth";

export default function Assembly() {
  const navigate = useNavigate();
  const [activeType, setActiveType] = useState("MASSA");
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: "", pricePerKg: "" });
  const [formStatus, setFormStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sections, setSections] = useState([
    { title: "Massas", items: [] },
    { title: "Recheios", items: [] },
    { title: "Doces/Acompanhamentos", items: [] }
  ]);

  function handleUnauthorized() {
    localStorage.removeItem(AUTH_KEY);
    navigate("/login");
  }

  async function load() {
    try {
      const res = await fetch(`${API_BASE}/assembly`, {
        credentials: "include"
      });
      if (res.status === 401) {
        handleUnauthorized();
        return;
      }
      if (!res.ok) {
        throw new Error("Falha ao carregar montagem");
      }
      const data = await res.json();
      setSections([
        { title: "Massas", items: Array.isArray(data.massas) ? data.massas : [] },
        {
          title: "Recheios",
          items: Array.isArray(data.recheios) ? data.recheios : []
        },
        {
          title: "Doces/Acompanhamentos",
          items: Array.isArray(data.doces) ? data.doces : []
        }
      ]);
    } catch (err) {
      setSections([
        { title: "Massas", items: [] },
        { title: "Recheios", items: [] },
        { title: "Doces/Acompanhamentos", items: [] }
      ]);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function resetForm() {
    setEditingId(null);
    setFormData({ name: "", pricePerKg: "" });
    setFormStatus("");
  }

  function openEdit(item, type) {
    setEditingId(item.id);
    setActiveType(type);
    setFormData({
      name: item.name || "",
      pricePerKg: item.pricePerKg ? String(item.pricePerKg) : ""
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormStatus("Nome é obrigatório.");
      return;
    }
    setIsSubmitting(true);
    setFormStatus("Salvando...");
    try {
      const payload = {
        name: formData.name,
        pricePerKg: formData.pricePerKg,
        type: activeType
      };
      const endpoint = editingId
        ? `${API_BASE}/assembly/items/${editingId}`
        : `${API_BASE}/assembly/items`;
      const res = await fetch(endpoint, {
        method: editingId ? "PUT" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.status === 401) {
        handleUnauthorized();
        return;
      }
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.message || "Falha ao salvar item");
      }
      resetForm();
      await load();
    } catch (err) {
      setFormStatus(err.message || "Falha ao salvar item");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(itemId) {
    const confirm = window.confirm(
      "Excluir este item? Esta acao nao pode ser desfeita."
    );
    if (!confirm) return;
    try {
      const res = await fetch(`${API_BASE}/assembly/items/${itemId}`, {
        method: "DELETE",
        credentials: "include"
      });
      if (res.status === 401) {
        handleUnauthorized();
        return;
      }
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.message || "Falha ao excluir item");
      }
      await load();
    } catch (err) {
      setFormStatus(err.message || "Falha ao excluir item");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Montagem</h2>
        <p className="text-sm text-[#4A2C2A]">
          Gerencie opções de massas, recheios e acompanhamentos.
        </p>
      </div>

      <div className="rounded-2xl border border-[#F48FB1] bg-white p-6">
        <div className="flex flex-wrap items-center gap-3">
          {[
            { label: "Massas", value: "MASSA" },
            { label: "Recheios", value: "RECHEIO" },
            { label: "Doces/Acompanhamentos", value: "DOCE" }
          ].map((type) => (
            <button
              key={type.value}
              onClick={() => {
                setActiveType(type.value);
                resetForm();
              }}
              className={[
                "rounded-full px-4 py-2 text-xs uppercase tracking-wide",
                activeType === type.value
                  ? "bg-white0 text-white"
                  : "border border-[#F48FB1] text-[#4A2C2A]"
              ].join(" ")}
            >
              {type.label}
            </button>
          ))}
        </div>
        <form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="space-y-2 md:col-span-1">
            <label className="text-xs uppercase text-[#4A2C2A]">Nome</label>
            <input
              className="w-full rounded-md bg-[#FFCCBC] px-3 py-2 text-sm"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Ex: Baunilha"
            />
          </div>
          <div className="space-y-2 md:col-span-1">
            <label className="text-xs uppercase text-[#4A2C2A]">
              Preço por Kg
            </label>
            <input
              className="w-full rounded-md bg-[#FFCCBC] px-3 py-2 text-sm"
              value={formData.pricePerKg}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, pricePerKg: e.target.value }))
              }
              placeholder="Ex: 45.00"
            />
          </div>
          <div className="flex items-end gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-white0 px-4 py-2 text-sm font-medium disabled:opacity-60"
            >
              {editingId ? "Atualizar" : "Criar"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="rounded-md border border-[#F48FB1] px-4 py-2 text-sm"
            >
              Limpar
            </button>
          </div>
        </form>
        {formStatus && (
          <div className="mt-3 text-sm text-[#4A2C2A]">{formStatus}</div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {sections.map((section) => (
          <div
            key={section.title}
            className="rounded-2xl border border-[#F48FB1] bg-white p-6"
          >
            <h3 className="text-sm font-semibold uppercase text-[#4A2C2A]">
              {section.title}
            </h3>
            {section.items.length === 0 ? (
              <p className="mt-4 text-sm text-[#4A2C2A]">
                Não há itens para exibir.
              </p>
            ) : (
              <ul className="mt-4 space-y-2 text-sm">
                {section.items.map((item) => (
                  <li
                    key={item.name}
                    className="flex items-center justify-between rounded-lg bg-[#FFCCBC] px-3 py-2"
                  >
                    <div>
                      <p>{item.name}</p>
                      <p className="text-xs text-[#4A2C2A]">
                        R$ {item.pricePerKg?.toFixed(2) ?? "0.00"} / Kg
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2 text-xs">
                      <button
                        onClick={() =>
                          openEdit(
                            item,
                            section.title === "Massas"
                              ? "MASSA"
                              : section.title === "Recheios"
                              ? "RECHEIO"
                              : "DOCE"
                          )
                        }
                        className="text-[#4A2C2A] hover:text-[#4A2C2A]"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-red-300 hover:text-red-200"
                      >
                        Excluir
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
