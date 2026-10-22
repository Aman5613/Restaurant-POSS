import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Layers, Plus, Edit2, Trash2, UtensilsCrossed, X } from 'lucide-react';
import { usePosStore } from '@/stores/pos-store';
import { apiClient } from '@/lib/api-client';

export function ManagerCategoriesTab({ onNotify }) {
  const { menuCategories, menuItems, addMenuCategory, updateMenuCategory, deleteMenuCategory } =
    usePosStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  const [categoryName, setCategoryName] = useState('');
  const [categoryCode, setCategoryCode] = useState('');

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setCategoryName('');
    setCategoryCode('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat) => {
    setEditingCategory(cat);
    setCategoryName(cat.name || '');
    setCategoryCode(cat.code || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!categoryName.trim()) return;

    const payload = {
      name: categoryName.trim(),
      code: categoryCode.trim() || categoryName.substring(0, 3).toUpperCase(),
    };

    if (editingCategory) {
      const targetId = editingCategory._id || editingCategory.id;
      try {
        if (editingCategory._id) {
          await apiClient.put(`/v1/menu/categories/${editingCategory._id}`, payload);
        }
      } catch (_err) {
        // Fallback
      }
      updateMenuCategory(targetId, payload);
      onNotify(`Category "${payload.name}" updated!`);
    } else {
      const newCat = {
        id: `cat_${Date.now()}`,
        ...payload,
      };
      try {
        const res = await apiClient.post('/v1/menu/categories', payload).catch(() => null);
        if (res?.data?._id) newCat._id = res.data._id;
      } catch (_err) {
        // Fallback
      }
      addMenuCategory(newCat);
      onNotify(`Category "${payload.name}" created!`);
    }

    setIsModalOpen(false);
    setEditingCategory(null);
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;
    const targetId = categoryToDelete._id || categoryToDelete.id;

    try {
      if (categoryToDelete._id) {
        await apiClient.delete(`/v1/menu/categories/${categoryToDelete._id}`);
      }
    } catch (_err) {
      // Fallback
    }

    deleteMenuCategory(targetId);
    onNotify(`Category "${categoryToDelete.name}" deleted.`);
    setIsDeleteModalOpen(false);
    setCategoryToDelete(null);
  };

  return (
    <div className="space-y-6">
      <Card className="border-slate-200 shadow-xs bg-white">
        <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-slate-900">
                Menu Categories ({menuCategories.length})
              </CardTitle>
              <p className="text-[11px] text-slate-500">
                Group items into Starters, Mains, Breads, Desserts, and Bar sections
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={handleOpenAdd}
            className="text-xs h-8 bg-purple-600 hover:bg-purple-700 text-white font-semibold"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add Category
          </Button>
        </CardHeader>

        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {menuCategories.map((cat) => {
              const count = (menuItems || []).filter(
                (it) => it.categoryId === cat.id || it.categoryId === cat._id
              ).length;
              return (
                <div
                  key={cat.id || cat._id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between"
                >
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">{cat.name}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {count} items cataloged
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleOpenEdit(cat)}
                      className="h-7 w-7 p-0 text-slate-500 hover:text-slate-900"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setCategoryToDelete(cat);
                        setIsDeleteModalOpen(true);
                      }}
                      className="h-7 w-7 p-0 text-rose-500 hover:text-rose-700"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* MODAL: ADD / EDIT CATEGORY */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <Card className="w-full max-w-sm bg-white border-slate-200 shadow-2xl animate-in zoom-in-95">
            <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold text-slate-900">
                {editingCategory ? 'Edit Menu Category' : 'Add New Category'}
              </CardTitle>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </CardHeader>

            <form onSubmit={handleSave} className="p-4 space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Category Name *
                </label>
                <Input
                  required
                  placeholder="e.g. Starters & Appetizers"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="text-xs h-9 font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Category Code (Optional)
                </label>
                <Input
                  placeholder="e.g. STR"
                  value={categoryCode}
                  onChange={(e) => setCategoryCode(e.target.value)}
                  className="text-xs h-9 font-mono"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  className="text-xs h-8"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="text-xs h-8 bg-purple-600 hover:bg-purple-700 text-white font-bold"
                >
                  {editingCategory ? 'Save Changes' : 'Create Category'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* MODAL: DELETE CATEGORY */}
      {isDeleteModalOpen && categoryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <Card className="w-full max-w-xs bg-white border-slate-200 shadow-2xl animate-in zoom-in-95">
            <CardHeader className="p-4 text-center pb-2">
              <div className="h-10 w-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-2 mx-auto">
                <Trash2 className="w-5 h-5" />
              </div>
              <CardTitle className="text-sm font-bold text-slate-900">Delete Category?</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 text-center text-xs text-slate-600">
              Are you sure you want to delete <strong className="text-slate-900">"{categoryToDelete.name}"</strong>?
            </CardContent>
            <div className="p-4 border-t border-slate-100 flex justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDeleteModalOpen(false)}
                className="text-xs h-8"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmDelete}
                className="text-xs h-8 bg-rose-600 hover:bg-rose-700 text-white font-bold"
              >
                Yes, Delete
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

export default ManagerCategoriesTab;
