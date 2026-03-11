import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE || "/api";
const AUTH_KEY = "cakeup_auth";

export default function Products() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState("Carregando produtos...");
  const [showForm, setShowForm] = useState(false);
  const [formStatus, setFormStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    estimatedPrice: ""
  });
  const [files, setFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [currentMediaUrls, setCurrentMediaUrls] = useState([]);

  function handleUnauthorized() {
    localStorage.removeItem(AUTH_KEY);
    navigate("/login");
  }

  async function loadProducts() {
    try {
      const res = await fetch(`${API_BASE}/products`, {
        credentials: "include"
      });
      if (res.status === 401) {
        handleUnauthorized();
        return;
      }
      if (!res.ok) {
        throw new Error("Falha ao carregar produtos");
      }
      const data = await res.json();
      setProducts(Array.isArray(data.products) ? data.products : []);
      setStatus("");
    } catch (err) {
      setProducts([]);
      setStatus("Não há produtos para exibir.");
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  function handleFileChange(event) {
    const list = Array.from(event.target.files || []);
    previewUrls.forEach((url) => URL.revokeObjectURL(url));
    setFiles(list);
    setPreviewUrls(list.map((file) => URL.createObjectURL(file)));
  }

  function openEdit(product) {
    setEditingId(product.id);
    setFormData({
      name: product.name || "",
      description: product.description || "",
      estimatedPrice: product.estimatedPrice || ""
    });
    setCurrentMediaUrls(Array.isArray(product.mediaUrls) ? product.mediaUrls : []);
    previewUrls.forEach((url) => URL.revokeObjectURL(url));
    setFiles([]);
    setPreviewUrls([]);
    setFormStatus("");
    setShowForm(true);
  }

  function resetForm() {
    setEditingId(null);
    setFormData({ name: "", description: "", estimatedPrice: "" });
    previewUrls.forEach((url) => URL.revokeObjectURL(url));
    setFiles([]);
    setPreviewUrls([]);
    setCurrentMediaUrls([]);
    setFormStatus("");
  }

  function validateFiles(list) {
    const hasVideo = list.some((file) => file.type.startsWith("video/"));
    const hasImage = list.some((file) => file.type.startsWith("image/"));
    if (hasVideo && hasImage) {
      return "Envie apenas 1 vídeo ou até 4 fotos.";
    }
    if (hasVideo && list.length !== 1) {
      return "Envie apenas 1 vídeo.";
    }
    if (hasImage && list.length > 4) {
      return "Envie no máximo 4 fotos.";
    }
    return "";
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const validation = validateFiles(files);
    if (validation) {
      setFormStatus(validation);
      return;
    }
    if (!formData.name.trim()) {
      setFormStatus("Nome do produto é obrigatório.");
      return;
    }

    setIsSubmitting(true);
    setFormStatus("Enviando...");
    try {
      const payload = new FormData();
      payload.append("name", formData.name);
      if (formData.description) {
        payload.append("description", formData.description);
      }
      if (formData.estimatedPrice) {
        payload.append("estimatedPrice", formData.estimatedPrice);
      }
      files.forEach((file) => payload.append("files", file));

      const endpoint = editingId
        ? `${API_BASE}/products/${editingId}`
        : `${API_BASE}/products`;
      const res = await fetch(endpoint, {
        method: editingId ? "PUT" : "POST",
        credentials: "include",
        body: payload
      });
      if (res.status === 401) {
        handleUnauthorized();
        return;
      }
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.message || "Falha ao criar produto");
      }
      setFormStatus(
        editingId ? "Produto atualizado com sucesso." : "Produto criado com sucesso."
      );
      resetForm();
      await loadProducts();
      setShowForm(false);
    } catch (err) {
      setFormStatus(err.message || "Falha ao criar produto");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(product) {
    const confirm = window.confirm(
      `Excluir o produto "${product.name}"? Esta acao nao pode ser desfeita.`
    );
    if (!confirm) return;

    try {
      const res = await fetch(`${API_BASE}/products/${product.id}`, {
        method: "DELETE",
        credentials: "include"
      });
      if (res.status === 401) {
        handleUnauthorized();
        return;
      }
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.message || "Falha ao excluir produto");
      }
      await loadProducts();
    } catch (err) {
      setStatus(err.message || "Falha ao excluir produto");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Produtos</h2>
          <p className="text-sm text-[#4A2C2A]">
            Registre, edite e exclua produtos. Até 4 fotos ou 1 vídeo.
          </p>
        </div>
        <button
          onClick={() => setShowForm((prev) => !prev)}
          className="rounded-md bg-white0 px-4 py-2 text-sm font-medium"
        >
          Novo produto
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-[#F48FB1] bg-white p-6 space-y-4"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs uppercase text-[#4A2C2A]">Nome</label>
              <input
                className="w-full rounded-md bg-[#FFCCBC] px-3 py-2 text-sm"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Ex: Bolo Red Velvet"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase text-[#4A2C2A]">
                Preço estimado
              </label>
              <input
                className="w-full rounded-md bg-[#FFCCBC] px-3 py-2 text-sm"
                value={formData.estimatedPrice}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    estimatedPrice: e.target.value
                  }))
                }
                placeholder="Ex: 89.90"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase text-[#4A2C2A]">Descrição</label>
            <textarea
              className="w-full rounded-md bg-[#FFCCBC] px-3 py-2 text-sm"
              rows={3}
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value
                }))
              }
              placeholder="Detalhes do produto"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase text-[#4A2C2A]">
              Mídia (até 4 fotos ou 1 vídeo)
            </label>
            <input
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleFileChange}
              className="text-sm text-[#4A2C2A]"
            />
            {editingId && (
              <p className="text-xs text-[#4A2C2A]">
                Envie novos arquivos apenas se quiser substituir a mídia atual.
              </p>
            )}
            {editingId && currentMediaUrls.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {currentMediaUrls.map((url) =>
                  url.endsWith(".mp4") || url.endsWith(".webm") ? (
                    <video
                      key={url}
                      src={url}
                      className="h-16 w-24 rounded-md object-cover"
                      muted
                      playsInline
                      preload="metadata"
                    />
                  ) : (
                    <img
                      key={url}
                      src={url}
                      alt="Mídia atual"
                      className="h-16 w-16 rounded-md object-cover"
                    />
                  )
                )}
              </div>
            )}
            {files.length > 0 && (
              <p className="text-xs text-[#4A2C2A]">
                {files.length} arquivo(s) selecionado(s)
              </p>
            )}
            {previewUrls.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {files[0]?.type?.startsWith("video/") ? (
                  <video
                    src={previewUrls[0]}
                    className="h-20 w-32 rounded-md object-cover"
                    muted
                    playsInline
                    controls
                  />
                ) : (
                  previewUrls.map((url, idx) => (
                    <img
                      key={url}
                      src={url}
                      alt={`Prévia ${idx + 1}`}
                      className="h-20 w-20 rounded-md object-cover"
                    />
                  ))
                )}
              </div>
            )}
          </div>
          {formStatus && (
            <div className="text-sm text-[#4A2C2A]">{formStatus}</div>
          )}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-white0 px-4 py-2 text-sm font-medium disabled:opacity-60"
            >
              {editingId ? "Atualizar" : "Salvar"}
            </button>
            <button
              type="button"
              onClick={() => {
                resetForm();
                setShowForm(false);
              }}
              className="rounded-md border border-[#F48FB1] px-4 py-2 text-sm"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="rounded-2xl border border-[#F48FB1] bg-white">
        <div className="grid grid-cols-5 gap-4 border-b border-[#F48FB1] px-6 py-3 text-xs uppercase text-[#4A2C2A]">
          <span>Produto</span>
          <span>Status</span>
          <span>Mídia</span>
          <span>Prévia</span>
          <span>Ações</span>
        </div>
        {products.length === 0 ? (
          <div className="px-6 py-6 text-sm text-[#4A2C2A]">
            {status || "Não há produtos para exibir."}
          </div>
        ) : (
          products.map((product) => (
            <div
              key={product.id || product.name}
              className="grid grid-cols-5 gap-4 px-6 py-4 text-sm text-[#4A2C2A] items-center"
            >
              <span>{product.name}</span>
              <span>{product.status}</span>
              <span>
                {product.mediaCount}{" "}
                {product.mediaType === "video"
                  ? "vídeo"
                  : product.mediaCount === 1
                  ? "foto"
                  : "fotos"}
              </span>
              <div className="flex gap-2">
                {(product.mediaUrls || []).filter(Boolean).length === 0 ? (
                  <span className="text-xs text-[#4A2C2A]">Sem mídia</span>
                ) : product.mediaType === "video" ? (
                  <video
                    src={(product.mediaUrls || []).filter(Boolean)[0]}
                    className="h-10 w-16 rounded-md object-cover"
                    muted
                    playsInline
                    preload="metadata"
                  />
                ) : (
                  (product.mediaUrls || [])
                    .filter(Boolean)
                    .slice(0, 3)
                    .map((url) => (
                    <img
                      key={url}
                      src={url}
                      alt={product.name}
                      className="h-10 w-10 rounded-md object-cover"
                    />
                  ))
                )}
              </div>
              <div className="flex flex-col gap-2 text-sm">
                <button
                  onClick={() => openEdit(product)}
                  className="text-left text-[#4A2C2A] hover:text-[#4A2C2A]"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(product)}
                  className="text-left text-red-300 hover:text-red-200"
                >
                  Excluir
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
