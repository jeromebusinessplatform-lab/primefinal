import React, { useState } from "react";
import { X, Plus, Edit2, Trash2, Tag, Check, AlertCircle } from "lucide-react";

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: string[];
  productCounts: Record<string, number>;
  onAddCategory: (name: string) => boolean;
  onEditCategory: (oldName: string, newName: string) => boolean;
  onRemoveCategory: (name: string) => boolean;
}

export function CategoryManagerModal({
  isOpen,
  onClose,
  categories,
  productCounts,
  onAddCategory,
  onEditCategory,
  onRemoveCategory,
}: CategoryManagerModalProps) {
  const [newCatName, setNewCatName] = useState("");
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editingVal, setEditingVal] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    const trimmed = newCatName.trim();
    if (!trimmed) return;
    if (categories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      setErrorMsg("Category already exists.");
      return;
    }
    const success = onAddCategory(trimmed);
    if (success) {
      setNewCatName("");
    }
  };

  const handleStartEdit = (cat: string) => {
    setEditingCat(cat);
    setEditingVal(cat);
    setErrorMsg("");
  };

  const handleSaveEdit = (oldCat: string) => {
    setErrorMsg("");
    const trimmed = editingVal.trim();
    if (!trimmed) {
      setEditingCat(null);
      return;
    }
    if (
      trimmed.toLowerCase() !== oldCat.toLowerCase() &&
      categories.some((c) => c.toLowerCase() === trimmed.toLowerCase())
    ) {
      setErrorMsg("Another category with this name already exists.");
      return;
    }
    onEditCategory(oldCat, trimmed);
    setEditingCat(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md border border-neutral-200 shadow-2xl p-5 space-y-4 max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center">
              <Tag size={16} />
            </div>
            <div>
              <h2
                className="text-base font-normal uppercase text-black"
                style={{ fontFamily: "'Roboto Condensed', sans-serif" }}
              >
                Manage Categories
              </h2>
              <p
                className="text-xs text-neutral-500 font-normal"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                Add, rename, or delete catalog product categories
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-black cursor-pointer p-1 rounded-lg hover:bg-neutral-100"
          >
            <X size={18} />
          </button>
        </div>

        {errorMsg && (
          <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-1.5 font-medium">
            <AlertCircle size={14} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Add Category Form */}
        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            type="text"
            placeholder="New category name (e.g. Smart Home)"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            className="flex-1 bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-xs outline-none focus:border-black font-normal"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "14px" }}
          />
          <button
            type="submit"
            disabled={!newCatName.trim()}
            className="bg-black hover:bg-neutral-800 disabled:bg-neutral-300 text-white px-3.5 py-2 rounded-xl text-xs font-normal flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            <Plus size={14} /> Add
          </button>
        </form>

        {/* Categories List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 divide-y divide-neutral-100">
          {categories.map((cat) => {
            const count = productCounts[cat] || 0;
            const isEditing = editingCat === cat;

            return (
              <div
                key={cat}
                className="pt-2 first:pt-0 flex items-center justify-between gap-2 group"
              >
                {isEditing ? (
                  <div className="flex-1 flex items-center gap-1.5">
                    <input
                      type="text"
                      value={editingVal}
                      onChange={(e) => setEditingVal(e.target.value)}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveEdit(cat);
                        if (e.key === "Escape") setEditingCat(null);
                      }}
                      className="flex-1 bg-neutral-50 border border-black rounded-lg px-2.5 py-1 text-xs outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(cat)}
                      className="p-1.5 bg-black text-white rounded-lg hover:bg-neutral-800 cursor-pointer"
                      title="Save"
                    >
                      <Check size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingCat(null)}
                      className="p-1.5 bg-neutral-100 text-neutral-600 rounded-lg hover:bg-neutral-200 cursor-pointer"
                      title="Cancel"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="text-sm font-medium text-neutral-900 truncate"
                        style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "15px" }}
                      >
                        {cat}
                      </span>
                      <span className="text-[10px] bg-neutral-100 text-neutral-600 font-mono px-1.5 py-0.2 rounded-full">
                        {count} item{count === 1 ? "" : "s"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(cat)}
                        className="p-1.5 text-neutral-400 hover:text-black hover:bg-neutral-100 rounded-lg cursor-pointer transition-colors"
                        title="Rename category"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            window.confirm(
                              `Are you sure you want to delete category "${cat}"? Products in this category will be moved to General.`
                            )
                          ) {
                            onRemoveCategory(cat);
                          }
                        }}
                        className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                        title="Delete category"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-neutral-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="bg-neutral-100 hover:bg-neutral-200 text-neutral-800 px-4 py-1.5 rounded-xl text-xs font-normal cursor-pointer"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
