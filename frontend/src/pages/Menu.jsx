import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE || "/api";
const AUTH_KEY = "cakeup_auth";
const DISPLAY_TYPES = [
  { value: "grid", label: "Grid" },
  { value: "list", label: "Lista" },
  { value: "carousel", label: "Carrossel" },
  { value: "featured", label: "Destaque" }
];

const DEFAULT_CONFIG = {
  columns_desktop: 3,
  columns_mobile: 1,
  show_price: true,
  show_description: true,
  show_image: true,
  show_button: true,
  button_text: "Pedir agora"
};

function normalizeConfig(config) {
  return {
    ...DEFAULT_CONFIG,
    ...(config && typeof config === "object" ? config : {})
  };
}

export default function Menu() {
  const navigate = useNavigate();
  const [sections, setSections] = useState([]);
  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState("Carregando seções...");
  const [formStatus, setFormStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedSectionId, setSelectedSectionId] = useState(null);
  const [newProductId, setNewProductId] = useState("");
  const [linkStatus, setLinkStatus] = useState("");
  const [isSavingLinks, setIsSavingLinks] = useState(false);
  const [linkItems, setLinkItems] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    displayType: "grid",
    config: { ...DEFAULT_CONFIG }
  });

  function handleUnauthorized() {
    localStorage.removeItem(AUTH_KEY);
    navigate("/login");
  }

  async function loadData() {
    try {
      const [sectionsRes, productsRes] = await Promise.all([
        fetch(`${API_BASE}/menu/sections`, { credentials: "include" }),
        fetch(`${API_BASE}/products`, { credentials: "include" })
      ]);

      if (sectionsRes.status === 401 || productsRes.status === 401) {
        handleUnauthorized();
        return;
      }
      if (!sectionsRes.ok || !productsRes.ok) {
        throw new Error("Falha ao carregar dados do cardápio");
      }

      const sectionsData = await sectionsRes.json();
      const productsData = await productsRes.json();

      const incomingSections = Array.isArray(sectionsData.sections)
        ? sectionsData.sections
        : [];
      const incomingProducts = Array.isArray(productsData.products)
        ? productsData.products
        : [];

      setSections(incomingSections);
      setProducts(incomingProducts);
      setStatus("");

      if (!selectedSectionId && incomingSections.length > 0) {
        setSelectedSectionId(incomingSections[0].id);
      }
    } catch (err) {
      setSections([]);
      setProducts([]);
      setStatus("Não foi possível carregar as seções.");
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const section = sections.find((item) => item.id === selectedSectionId);
    if (!section) {
      setLinkItems([]);
      return;
    }
    const items = (section.products || []).map((entry) => {
      const product = products.find((item) => item.id === entry.productId);
      return {
        productId: entry.productId,
        name: product?.name || "Produto não encontrado",
        position: Number(entry.position) || 0,
        featured: Boolean(entry.featured),
        visible: entry.visible !== false
      };
    });
    items.sort((a, b) => a.position - b.position);
    setLinkItems(items);
  }, [sections, products, selectedSectionId]);

  const availableProducts = useMemo(() => {
    const used = new Set(linkItems.map((item) => item.productId));
    return products.filter((product) => !used.has(product.id));
  }, [products, linkItems]);

  function resetForm() {
    setEditingId(null);
    setFormData({
      name: "",
      displayType: "grid",
      config: { ...DEFAULT_CONFIG }
    });
    setFormStatus("");
  }

  function startEdit(section) {
    setEditingId(section.id);
    setFormData({
      name: section.name || "",
      displayType: section.displayType || "grid",
      config: normalizeConfig(section.config)
    });
  }

  async function handleSectionSubmit(event) {
    event.preventDefault();
    if (!formData.name.trim()) {
      setFormStatus("Nome da seção é obrigatório.");
      return;
    }

    setIsSubmitting(true);
    setFormStatus("Salvando...");
    try {
      const payload = {
        name: formData.name.trim(),
        display_type: formData.displayType,
        config: {
          ...formData.config,
          columns_desktop: Number(formData.config.columns_desktop) || 1,
          columns_mobile: Number(formData.config.columns_mobile) || 1
        }
      };
      const endpoint = editingId
        ? `${API_BASE}/menu/sections/${editingId}`
        : `${API_BASE}/menu/sections`;
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(endpoint, {
        method,
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
        throw new Error(errorData?.message || "Falha ao salvar seção");
      }

      resetForm();
      await loadData();
    } catch (err) {
      setFormStatus(err.message || "Falha ao salvar seção");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteSection(sectionId) {
    const confirm = window.confirm(
      "Excluir esta seção? Os produtos vinculados também serão removidos."
    );
    if (!confirm) return;
    try {
      const res = await fetch(`${API_BASE}/menu/sections/${sectionId}`, {
        method: "DELETE",
        credentials: "include"
      });
      if (res.status === 401) {
        handleUnauthorized();
        return;
      }
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.message || "Falha ao excluir seção");
      }
      if (selectedSectionId === sectionId) {
        setSelectedSectionId(null);
      }
      await loadData();
    } catch (err) {
      setFormStatus(err.message || "Falha ao excluir seção");
    }
  }

  function addProductToSection() {
    if (!newProductId) return;
    const product = products.find((item) => item.id === newProductId);
    if (!product) return;
    const maxPosition = linkItems.reduce(
      (acc, item) => Math.max(acc, item.position),
      0
    );
    setLinkItems((prev) => [
      ...prev,
      {
        productId: product.id,
        name: product.name,
        position: maxPosition + 1,
        featured: false,
        visible: true
      }
    ]);
    setNewProductId("");
  }

  function updateLinkItem(productId, changes) {
    setLinkItems((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, ...changes } : item
      )
    );
  }

  async function saveLinks() {
    if (!selectedSectionId) return;
    setIsSavingLinks(true);
    setLinkStatus("Salvando produtos...");
    try {
      const payload = {
        products: linkItems.map((item) => ({
          product_id: item.productId,
          position: Number(item.position) || 0,
          featured: Boolean(item.featured),
          visible: Boolean(item.visible)
        }))
      };
      const res = await fetch(
        `${API_BASE}/menu/sections/${selectedSectionId}/products`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }
      );
      if (res.status === 401) {
        handleUnauthorized();
        return;
      }
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.message || "Falha ao salvar produtos");
      }
      setLinkStatus("Produtos atualizados.");
      await loadData();
    } catch (err) {
      setLinkStatus(err.message || "Falha ao salvar produtos");
    } finally {
      setIsSavingLinks(false);
    }
  }

  const selectedSection = sections.find((item) => item.id === selectedSectionId);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold">Cardápio</h2>
        <p className="text-sm text-[#4A2C2A]">
          Crie seções e organize os produtos exibidos na landing Template.
        </p>
      </div>

      <div className="rounded-2xl border border-[#F48FB1] bg-white p-6">
        <h3 className="text-sm font-semibold uppercase text-[#4A2C2A]">
          {editingId ? "Editar seção" : "Nova seção"}
        </h3>
        <form onSubmit={handleSectionSubmit} className="mt-4 grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs uppercase text-[#4A2C2A]">Nome</label>
              <input
                className="w-full rounded-md bg-[#FFCCBC] px-3 py-2 text-sm"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Ex: Lanches"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase text-[#4A2C2A]">
                Tipo de exibição
              </label>
              <select
                className="w-full rounded-md bg-[#FFCCBC] px-3 py-2 text-sm"
                value={formData.displayType}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    displayType: e.target.value
                  }))
                }
              >
                {DISPLAY_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-xs uppercase text-[#4A2C2A]">
                Colunas desktop
              </label>
              <input
                type="number"
                min="1"
                max="6"
                className="w-full rounded-md bg-[#FFCCBC] px-3 py-2 text-sm"
                value={formData.config.columns_desktop}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    config: {
                      ...prev.config,
                      columns_desktop: e.target.value
                    }
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase text-[#4A2C2A]">
                Colunas mobile
              </label>
              <input
                type="number"
                min="1"
                max="4"
                className="w-full rounded-md bg-[#FFCCBC] px-3 py-2 text-sm"
                value={formData.config.columns_mobile}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    config: {
                      ...prev.config,
                      columns_mobile: e.target.value
                    }
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase text-[#4A2C2A]">
                Texto do botão
              </label>
              <input
                className="w-full rounded-md bg-[#FFCCBC] px-3 py-2 text-sm"
                value={formData.config.button_text}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    config: { ...prev.config, button_text: e.target.value }
                  }))
                }
              />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            {[
              { key: "show_price", label: "Mostrar preço" },
              { key: "show_description", label: "Mostrar descrição" },
              { key: "show_image", label: "Mostrar imagem" },
              { key: "show_button", label: "Mostrar botão" }
            ].map((item) => (
              <label
                key={item.key}
                className="flex items-center gap-2 text-sm text-[#4A2C2A]"
              >
                <input
                  type="checkbox"
                  checked={Boolean(formData.config[item.key])}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      config: {
                        ...prev.config,
                        [item.key]: e.target.checked
                      }
                    }))
                  }
                />
                {item.label}
              </label>
            ))}
          </div>

          {formStatus && (
            <div className="text-sm text-[#4A2C2A]">{formStatus}</div>
          )}
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-white0 px-4 py-2 text-sm font-medium disabled:opacity-60"
            >
              {editingId ? "Atualizar seção" : "Criar seção"}
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
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <div className="rounded-2xl border border-[#F48FB1] bg-white p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase text-[#4A2C2A]">
              Seções existentes
            </h3>
            <span className="text-xs text-[#4A2C2A]">
              {sections.length} seção(ões)
            </span>
          </div>
          {sections.length === 0 ? (
            <p className="mt-4 text-sm text-[#4A2C2A]">
              {status || "Nenhuma seção criada ainda."}
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {sections.map((section) => (
                <div
                  key={section.id}
                  className={[
                    "rounded-xl border px-4 py-3 text-sm",
                    selectedSectionId === section.id
                      ? "border-[#F48FB1]/60 bg-white/10"
                      : "border-[#F48FB1] bg-white/90"
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{section.name}</p>
                      <p className="text-xs text-[#4A2C2A]">
                        Layout: {section.displayType}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <button
                        onClick={() => setSelectedSectionId(section.id)}
                        className="text-[#4A2C2A] hover:text-[#4A2C2A]"
                      >
                        Gerenciar
                      </button>
                      <button
                        onClick={() => startEdit(section)}
                        className="text-[#4A2C2A] hover:text-[#4A2C2A]"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteSection(section.id)}
                        className="text-red-300 hover:text-red-200"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-[#F48FB1] bg-white p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase text-[#4A2C2A]">
              Produtos da seção
            </h3>
            <span className="text-xs text-[#4A2C2A]">
              {selectedSection ? selectedSection.name : "Nenhuma seção"}
            </span>
          </div>

          {!selectedSection ? (
            <p className="mt-4 text-sm text-[#4A2C2A]">
              Selecione uma seção para configurar os produtos.
            </p>
          ) : (
            <>
              <div className="mt-4 flex flex-wrap gap-3">
                <select
                  className="min-w-[220px] rounded-md bg-[#FFCCBC] px-3 py-2 text-sm"
                  value={newProductId}
                  onChange={(e) => setNewProductId(e.target.value)}
                >
                  <option value="">Adicionar produto...</option>
                  {availableProducts.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={addProductToSection}
                  className="rounded-md border border-[#F48FB1] px-4 py-2 text-sm"
                >
                  Inserir
                </button>
              </div>

              {linkItems.length === 0 ? (
                <p className="mt-4 text-sm text-[#4A2C2A]">
                  Nenhum produto vinculado ainda.
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {linkItems.map((item) => (
                    <div
                      key={item.productId}
                      className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#F48FB1] bg-white/90 px-4 py-3 text-sm"
                    >
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-[#4A2C2A]">
                          {item.productId}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <input
                          type="number"
                          className="w-20 rounded-md bg-[#FFCCBC] px-2 py-1 text-xs"
                          value={item.position}
                          onChange={(e) =>
                            updateLinkItem(item.productId, {
                              position: e.target.value
                            })
                          }
                        />
                        <label className="flex items-center gap-2 text-xs text-[#4A2C2A]">
                          <input
                            type="checkbox"
                            checked={item.featured}
                            onChange={(e) =>
                              updateLinkItem(item.productId, {
                                featured: e.target.checked
                              })
                            }
                          />
                          Destaque
                        </label>
                        <label className="flex items-center gap-2 text-xs text-[#4A2C2A]">
                          <input
                            type="checkbox"
                            checked={item.visible}
                            onChange={(e) =>
                              updateLinkItem(item.productId, {
                                visible: e.target.checked
                              })
                            }
                          />
                          Visível
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {linkStatus && (
                <div className="mt-4 text-sm text-[#4A2C2A]">{linkStatus}</div>
              )}
              <div className="mt-4">
                <button
                  type="button"
                  disabled={isSavingLinks}
                  onClick={saveLinks}
                  className="rounded-md bg-white0 px-4 py-2 text-sm font-medium disabled:opacity-60"
                >
                  Salvar produtos da seção
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
