import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Utensils, AlertCircle } from 'lucide-react';
import { formatPaiseToRupees } from '@pos/shared';

export function MenuPage() {
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [search, setSearch] = useState('');
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);

  const [categories] = useState([
    { id: 'cat_1', name: 'Starters & Appetizers', count: 4 },
    { id: 'cat_2', name: 'Main Course', count: 6 },
    { id: 'cat_3', name: 'Breads & Rice', count: 4 },
    { id: 'cat_4', name: 'Beverages', count: 3 },
  ]);

  const [items, setItems] = useState([
    {
      id: 'it_1',
      categoryId: 'cat_1',
      name: 'Paneer Tikka',
      code: 'STR-01',
      basePrice: 28000,
      isVeg: true,
      isAvailable: true,
      categoryName: 'Starters & Appetizers',
    },
    {
      id: 'it_2',
      categoryId: 'cat_1',
      name: 'Chicken Tikka',
      code: 'STR-02',
      basePrice: 32000,
      isVeg: false,
      isAvailable: true,
      categoryName: 'Starters & Appetizers',
    },
    {
      id: 'it_3',
      categoryId: 'cat_2',
      name: 'Butter Chicken',
      code: 'MAIN-01',
      basePrice: 38000,
      isVeg: false,
      isAvailable: true,
      categoryName: 'Main Course',
    },
    {
      id: 'it_4',
      categoryId: 'cat_2',
      name: 'Dal Makhani',
      code: 'MAIN-02',
      basePrice: 26000,
      isVeg: true,
      isAvailable: true,
      categoryName: 'Main Course',
    },
    {
      id: 'it_5',
      categoryId: 'cat_3',
      name: 'Butter Naan',
      code: 'BRD-01',
      basePrice: 6000,
      isVeg: true,
      isAvailable: true,
      categoryName: 'Breads & Rice',
    },
    {
      id: 'it_6',
      categoryId: 'cat_3',
      name: 'Chicken Dum Biryani',
      code: 'BRD-02',
      basePrice: 34000,
      isVeg: false,
      isAvailable: false, // Out of stock example
      categoryName: 'Breads & Rice',
    },
    {
      id: 'it_7',
      categoryId: 'cat_4',
      name: 'Fresh Lime Soda',
      code: 'BEV-01',
      basePrice: 9000,
      isVeg: true,
      isAvailable: true,
      categoryName: 'Beverages',
    },
  ]);

  const [newItem, setNewItem] = useState({
    name: '',
    code: '',
    categoryId: 'cat_1',
    basePrice: 250,
    isVeg: true,
  });

  const toggleAvailability = (id) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, isAvailable: !it.isAvailable } : it))
    );
  };

  const handleCreateItem = (e) => {
    e.preventDefault();
    if (!newItem.name) return;

    const matchedCat = categories.find((c) => c.id === newItem.categoryId);
    setItems([
      ...items,
      {
        id: `it_${Date.now()}`,
        name: newItem.name,
        code: newItem.code || `ITM-${items.length + 1}`,
        categoryId: newItem.categoryId,
        basePrice: Math.round(newItem.basePrice * 100),
        isVeg: newItem.isVeg,
        isAvailable: true,
        categoryName: matchedCat ? matchedCat.name : 'General',
      },
    ]);
    setIsAddItemOpen(false);
    setNewItem({ name: '', code: '', categoryId: 'cat_1', basePrice: 250, isVeg: true });
  };

  const filteredItems = items.filter((it) => {
    const matchesCategory = selectedCategory === 'ALL' || it.categoryId === selectedCategory;
    const matchesSearch =
      it.name.toLowerCase().includes(search.toLowerCase()) ||
      it.code.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Menu & Price Management</h1>
          <p className="text-sm text-muted-foreground">
            Configure dishes, prices, categories, and instant 86 out-of-stock toggles
          </p>
        </div>

        <Button onClick={() => setIsAddItemOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          Add Menu Item
        </Button>
      </div>

      {/* Category Pills & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search items by name or shortcode (e.g. Biryani, STR-01)..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1">
          <Button
            variant={selectedCategory === 'ALL' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('ALL')}
            className="text-xs"
          >
            All Items ({items.length})
          </Button>
          {categories.map((c) => (
            <Button
              key={c.id}
              variant={selectedCategory === c.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(c.id)}
              className="text-xs whitespace-nowrap"
            >
              {c.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => (
          <Card
            key={item.id}
            className={`transition-all border ${
              !item.isAvailable ? 'opacity-60 bg-muted/20 border-dashed' : 'bg-card'
            }`}
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {/* Veg / Non-Veg Indicator */}
                    <span
                      className={`h-4 w-4 rounded-sm border flex items-center justify-center p-0.5 ${
                        item.isVeg ? 'border-emerald-600' : 'border-rose-600'
                      }`}
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${
                          item.isVeg ? 'bg-emerald-600' : 'bg-rose-600'
                        }`}
                      />
                    </span>
                    <CardTitle className="text-base font-semibold leading-tight">
                      {item.name}
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0">
                      {item.code}
                    </Badge>
                    <span>{item.categoryName}</span>
                  </div>
                </div>

                <span className="font-bold text-base text-foreground">
                  {formatPaiseToRupees(item.basePrice)}
                </span>
              </div>
            </CardHeader>

            <CardContent className="pt-2 flex items-center justify-between border-t mt-2">
              <div className="flex items-center gap-2">
                {item.isAvailable ? (
                  <Badge variant="default" className="text-[10px] bg-emerald-600">
                    In Stock
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="text-[10px]">
                    <AlertCircle className="h-3 w-3 mr-1" /> 86 (Out of Stock)
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-8"
                  onClick={() => toggleAvailability(item.id)}
                >
                  {item.isAvailable ? 'Mark 86' : 'Restore'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Item Modal */}
      {isAddItemOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md bg-card border shadow-2xl">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Utensils className="h-5 w-5 text-primary" />
                Add Menu Item
              </CardTitle>
            </CardHeader>
            <form onSubmit={handleCreateItem}>
              <CardContent className="space-y-3.5">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Dish / Item Name</label>
                  <Input
                    placeholder="e.g. Mutton Rogan Josh"
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Item Shortcode</label>
                    <Input
                      placeholder="e.g. CURRY-01"
                      value={newItem.code}
                      onChange={(e) => setNewItem({ ...newItem, code: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Price in Rupees (₹)</label>
                    <Input
                      type="number"
                      placeholder="e.g. 350"
                      value={newItem.basePrice}
                      onChange={(e) => setNewItem({ ...newItem, basePrice: Number(e.target.value) })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground">Category</label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={newItem.categoryId}
                    onChange={(e) => setNewItem({ ...newItem, categoryId: e.target.value })}
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <label className="text-xs font-medium text-muted-foreground">Food Type:</label>
                  <Button
                    type="button"
                    size="sm"
                    variant={newItem.isVeg ? 'default' : 'outline'}
                    className={`text-xs ${newItem.isVeg ? 'bg-emerald-600' : ''}`}
                    onClick={() => setNewItem({ ...newItem, isVeg: true })}
                  >
                    🟢 Vegetarian
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={!newItem.isVeg ? 'destructive' : 'outline'}
                    className="text-xs"
                    onClick={() => setNewItem({ ...newItem, isVeg: false })}
                  >
                    🔴 Non-Vegetarian
                  </Button>
                </div>
              </CardContent>

              <div className="flex justify-end gap-2 border-t p-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddItemOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Save Dish</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
