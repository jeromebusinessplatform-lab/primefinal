import React, { useState } from "react";
import { useProducts } from "@/hooks/useProducts.ts";
import { Package, Plus, Trash2, Edit2, X, Check, ShoppingBag } from "lucide-react";
import { type Product } from "@/data/products.ts";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils.ts";

export default function AdminProductsPage() {
  const { products, addProduct, updateProduct, removeProduct } = useProducts();
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    subname: "",
    category: "Audio",
    description: "",
    price: 99.99,
    salePrice: "",
    stock: 50,
    badge: "" as "" | "NEW" | "SALE" | "LOW_STOCK",
    image: "",
  });

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      subname: "",
      category: "Audio",
      description: "",
      price: 99.99,
      salePrice: "",
      stock: 50,
      badge: "NEW",
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80",
    });
    setShowForm(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      subname: p.subname ?? "",
      category: p.category ?? "Audio",
      description: p.description ?? "",
      price: p.price,
      salePrice: p.salePrice ? String(p.salePrice) : "",
      stock: p.stock,
      badge: (p.badge ?? "") as "" | "NEW" | "SALE" | "LOW_STOCK",
      image: p.image ?? "",
    });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingProduct) {
      updateProduct(editingProduct._id, {
        name: formData.name.trim(),
        subname: formData.subname.trim() || undefined,
        category: formData.category,
        description: formData.description.trim() || undefined,
        price: Number(formData.price),
        salePrice: formData.salePrice ? Number(formData.salePrice) : undefined,
        stock: Number(formData.stock),
        badge: formData.badge ? formData.badge : undefined,
        image: formData.image.trim() || undefined,
      });
      toast.success(`Updated "${formData.name}"`);
    } else {
      addProduct({
        name: formData.name.trim(),
        subname: formData.subname.trim() || undefined,
        category: formData.category,
        description: formData.description.trim() || undefined,
        price: Number(formData.price),
        salePrice: formData.salePrice ? Number(formData.salePrice) : undefined,
        stock: Number(formData.stock),
        available: true,
        badge: formData.badge ? formData.badge : undefined,
        image: formData.image.trim() || undefined,
        sortOrder: products.length + 1,
      });
      toast.success(`Added new product "${formData.name}"`);
    }

    setShowForm(false);
  };

  const handleDelete = (id: string, name: string) => {
    removeProduct(id);
    toast.success(`Removed product "${name}"`);
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-black text-2xl font-normal tracking-wide uppercase"
            style={{ fontFamily: "'Roboto Condensed', sans-serif" }}
          >
            Product Catalog
          </h1>
          <p className="text-neutral-500 text-xs mt-0.5 font-normal" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
            Add, update inventory, manage pricing discounts, and feature badges.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="bg-black hover:bg-neutral-800 text-white px-4 py-2 rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-xs font-normal"
          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
        >
          <Plus size={15} /> Add New Product
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
          <form
            onSubmit={handleSubmit}
            className="bg-white p-6 rounded-2xl w-full max-w-lg space-y-4 shadow-xl border border-neutral-200 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
              <h2 className="text-lg font-normal text-black uppercase" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
                {editingProduct ? "Edit Product" : "Add New Product"}
              </h2>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-neutral-400 hover:text-black cursor-pointer p-1"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 font-normal text-xs" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "14px" }}>
              <div>
                <label className="text-neutral-600 uppercase block mb-1">Product Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Wireless Pro Earbuds"
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-black"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-neutral-600 uppercase block mb-1">Sub-label / Tagline</label>
                  <input
                    type="text"
                    placeholder="e.g. Active Noise Cancelling"
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-black"
                    value={formData.subname}
                    onChange={(e) => setFormData({ ...formData, subname: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-neutral-600 uppercase block mb-1">Category</label>
                  <select
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-black"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="Audio">Audio</option>
                    <option value="Smart Wearables">Smart Wearables</option>
                    <option value="Cameras">Cameras</option>
                    <option value="Accessories">Accessories</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-neutral-600 uppercase block mb-1">Price (₱)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-black"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  />
                </div>

                <div>
                  <label className="text-neutral-600 uppercase block mb-1">Sale Price (₱)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Optional"
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-black"
                    value={formData.salePrice}
                    onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-neutral-600 uppercase block mb-1">Stock Count</label>
                  <input
                    type="number"
                    min="0"
                    required
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-black"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-neutral-600 uppercase block mb-1">Highlight Badge</label>
                  <select
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-black"
                    value={formData.badge}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value as "" | "NEW" | "SALE" | "LOW_STOCK" })}
                  >
                    <option value="">None</option>
                    <option value="NEW">NEW</option>
                    <option value="SALE">SALE</option>
                    <option value="LOW_STOCK">LOW STOCK</option>
                  </select>
                </div>

                <div>
                  <label className="text-neutral-600 uppercase block mb-1">Image URL</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-black"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-xl text-xs text-neutral-600 hover:bg-neutral-100 cursor-pointer"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-black text-white px-5 py-2 rounded-xl text-xs cursor-pointer hover:bg-neutral-800 shadow-xs"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                {editingProduct ? "Save Changes" : "Create Product"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((product) => (
          <div
            key={product._id}
            className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-2xs flex flex-col justify-between"
          >
            <div className="flex items-start gap-3">
              <div className="w-16 h-16 rounded-xl bg-neutral-50 border border-neutral-100 p-1 flex-shrink-0 flex items-center justify-center overflow-hidden">
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <ShoppingBag size={24} className="text-neutral-300" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3
                  className="font-normal text-black text-base truncate"
                  style={{ fontFamily: "'Roboto Condensed', sans-serif" }}
                >
                  {product.name}
                </h3>
                <div className="text-xs text-neutral-500 font-normal" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                  {product.category ?? "General"} • {product.stock} in stock
                </div>

                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-black font-semibold text-base" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                    {formatCurrency(product.salePrice ?? product.price)}
                  </span>
                  {product.salePrice && (
                    <span className="text-xs text-red-500 line-through">
                      {formatCurrency(product.price)}
                    </span>
                  )}
                  {product.badge && (
                    <span className="text-[10px] bg-neutral-100 text-neutral-800 px-2 py-0.5 rounded-full font-medium">
                      {product.badge}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-neutral-100">
              <button
                onClick={() => handleOpenEdit(product)}
                className="flex items-center gap-1 text-xs text-neutral-700 hover:text-black border border-neutral-200 px-3 py-1.5 rounded-lg hover:bg-neutral-50 cursor-pointer"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                <Edit2 size={13} /> Edit
              </button>
              <button
                onClick={() => handleDelete(product._id, product.name)}
                className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 cursor-pointer"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                <Trash2 size={13} /> Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
