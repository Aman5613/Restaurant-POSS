import React, { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Send,
  Pause,
  Receipt,
  UtensilsCrossed,
  ChefHat,
  ShoppingBag,
  Truck,
  IndianRupee,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';
import { formatPaiseToRupees, ORDER_TYPES } from '@pos/shared';

export function OrderScreenPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialTableId = searchParams.get('tableId');
  const initialTableName = searchParams.get('tableName') || 'Counter';

  const [orderType, setOrderType] = useState(initialTableId ? ORDER_TYPES.DINE_IN : ORDER_TYPES.TAKEAWAY);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [search, setSearch] = useState('');
  const [guestCount, setGuestCount] = useState(2);
  const [orderLines, setOrderLines] = useState([
    {
      id: 'ln_1',
      itemId: 'it_1',
      name: 'Paneer Tikka',
      variantName: 'Standard',
      quantity: 1,
      unitPrice: 28000,
      addons: [{ name: 'Extra Mint Chutney', price: 2000 }],
      notes: 'Make it spicy',
      course: 'starter',
      status: 'SENT',
    },
  ]);

  const [activeItemForCustomization, setActiveItemForCustomization] = useState(null);
  const [cancelModalLine, setCancelModalLine] = useState(null);
  const [cancelReason, setCancelReason] = useState('Customer changed mind');
  const [notification, setNotification] = useState(null);

  const categories = [
    { id: 'cat_1', name: 'Starters' },
    { id: 'cat_2', name: 'Main Course' },
    { id: 'cat_3', name: 'Breads & Rice' },
    { id: 'cat_4', name: 'Beverages' },
    { id: 'cat_5', name: 'Desserts' },
  ];

  const menuCatalog = [
    {
      id: 'it_1',
      categoryId: 'cat_1',
      name: 'Paneer Tikka',
      code: 'STR-01',
      basePrice: 28000,
      isVeg: true,
      variants: [
        { id: 'v1', name: 'Half (4 pcs)', price: 16000 },
        { id: 'v2', name: 'Full (8 pcs)', price: 28000 },
      ],
      addons: [{ id: 'a1', name: 'Extra Mint Chutney', price: 2000 }],
    },
    {
      id: 'it_2',
      categoryId: 'cat_1',
      name: 'Chicken Malai Tikka',
      code: 'STR-02',
      basePrice: 34000,
      isVeg: false,
      variants: [
        { id: 'v3', name: 'Half (4 pcs)', price: 20000 },
        { id: 'v4', name: 'Full (8 pcs)', price: 34000 },
      ],
      addons: [{ id: 'a2', name: 'Rumali Roti (1 pc)', price: 3000 }],
    },
    {
      id: 'it_3',
      categoryId: 'cat_2',
      name: 'Dal Makhani',
      code: 'MAIN-01',
      basePrice: 26000,
      isVeg: true,
      variants: [],
      addons: [{ id: 'a3', name: 'Extra Butter Dollop', price: 2500 }],
    },
    {
      id: 'it_4',
      categoryId: 'cat_2',
      name: 'Butter Chicken',
      code: 'MAIN-02',
      basePrice: 39000,
      isVeg: false,
      variants: [
        { id: 'v5', name: 'Boneless', price: 42000 },
        { id: 'v6', name: 'Regular Bone-in', price: 39000 },
      ],
      addons: [],
    },
    {
      id: 'it_5',
      categoryId: 'cat_3',
      name: 'Butter Naan',
      code: 'BRD-01',
      basePrice: 6500,
      isVeg: true,
      variants: [],
      addons: [{ id: 'a4', name: 'Garlic Butter Topping', price: 1500 }],
    },
    {
      id: 'it_6',
      categoryId: 'cat_3',
      name: 'Jeera Rice',
      code: 'BRD-02',
      basePrice: 18000,
      isVeg: true,
      variants: [],
      addons: [],
    },
    {
      id: 'it_7',
      categoryId: 'cat_4',
      name: 'Masala Chaas',
      code: 'BEV-01',
      basePrice: 7000,
      isVeg: true,
      variants: [],
      addons: [],
    },
    {
      id: 'it_8',
      categoryId: 'cat_5',
      name: 'Gulab Jamun (2 pcs)',
      code: 'DES-01',
      basePrice: 12000,
      isVeg: true,
      variants: [],
      addons: [{ id: 'a5', name: 'With Vanilla Ice Cream', price: 4000 }],
    },
  ];

  const filteredCatalog = useMemo(() => {
    return menuCatalog.filter((item) => {
      const matchesCategory = selectedCategory === 'ALL' || item.categoryId === selectedCategory;
      const matchesSearch =
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.code.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, search]);

  const handleAddItem = (item) => {
    if (item.variants?.length > 0 || item.addons?.length > 0) {
      setActiveItemForCustomization({
        ...item,
        selectedVariant: item.variants[0] || null,
        selectedAddons: [],
        notes: '',
        quantity: 1,
      });
      return;
    }

    setOrderLines((prev) => [
      ...prev,
      {
        id: `ln_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        itemId: item.id,
        name: item.name,
        variantName: null,
        quantity: 1,
        unitPrice: item.basePrice,
        addons: [],
        notes: '',
        course: 'general',
        status: 'DRAFT',
      },
    ]);
  };

  const handleConfirmCustomization = () => {
    if (!activeItemForCustomization) return;
    const item = activeItemForCustomization;
    const price = item.selectedVariant ? item.selectedVariant.price : item.basePrice;

    setOrderLines((prev) => [
      ...prev,
      {
        id: `ln_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        itemId: item.id,
        name: item.name,
        variantName: item.selectedVariant?.name || null,
        quantity: item.quantity,
        unitPrice: price,
        addons: item.selectedAddons || [],
        notes: item.notes || '',
        course: 'general',
        status: 'DRAFT',
      },
    ]);
    setActiveItemForCustomization(null);
  };

  const handleUpdateQuantity = (lineId, delta) => {
    setOrderLines((prev) =>
      prev
        .map((line) => {
          if (line.id === lineId) {
            const nextQty = line.quantity + delta;
            return nextQty > 0 ? { ...line, quantity: nextQty } : null;
          }
          return line;
        })
        .filter(Boolean)
    );
  };

  const handleSendToKitchen = () => {
    const draftCount = orderLines.filter((l) => l.status === 'DRAFT').length;
    if (draftCount === 0) {
      setNotification('No new items to send to the kitchen!');
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    setOrderLines((prev) =>
      prev.map((l) => (l.status === 'DRAFT' ? { ...l, status: 'SENT' } : l))
    );

    setNotification(`KOT generated successfully! ${draftCount} items dispatched to kitchen stations.`);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleCancelLine = () => {
    if (!cancelModalLine) return;
    setOrderLines((prev) =>
      prev.map((l) =>
        l.id === cancelModalLine.id
          ? { ...l, status: 'CANCELLED', cancelReason }
          : l
      )
    );
    setCancelModalLine(null);
    setNotification('Line cancelled and cancel slip dispatched.');
    setTimeout(() => setNotification(null), 3000);
  };

  // Billing calculations
  const activeLines = orderLines.filter((l) => l.status !== 'CANCELLED');
  const subtotal = activeLines.reduce((acc, line) => {
    const addonsTotal = (line.addons || []).reduce((sum, a) => sum + (a.price || 0), 0);
    return acc + (line.unitPrice + addonsTotal) * line.quantity;
  }, 0);

  const cgstAmount = Math.round((subtotal * 2.5) / 100);
  const sgstAmount = Math.round((subtotal * 2.5) / 100);
  const grandTotal = subtotal + cgstAmount + sgstAmount;

  const hasDraftItems = orderLines.some((l) => l.status === 'DRAFT');

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col lg:flex-row gap-4 overflow-hidden">
      {/* LEFT PANEL: Menu Catalog */}
      <div className="flex-1 flex flex-col bg-slate-900/70 border border-slate-800 rounded-xl p-4 overflow-hidden">
        {/* Order Type & Table Selection Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 gap-2">
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setOrderType(ORDER_TYPES.DINE_IN)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                orderType === ORDER_TYPES.DINE_IN
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UtensilsCrossed className="w-3.5 h-3.5" />
              Dine-In {initialTableName ? `(${initialTableName})` : ''}
            </button>
            <button
              onClick={() => setOrderType(ORDER_TYPES.TAKEAWAY)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                orderType === ORDER_TYPES.TAKEAWAY
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              Takeaway
            </button>
            <button
              onClick={() => setOrderType(ORDER_TYPES.DELIVERY)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                orderType === ORDER_TYPES.DELIVERY
                  ? 'bg-purple-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              Delivery
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Guests:</span>
            <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded border border-slate-800">
              <button
                className="text-slate-400 hover:text-white text-xs px-1"
                onClick={() => setGuestCount(Math.max(1, guestCount - 1))}
              >
                -
              </button>
              <span className="text-xs font-bold text-white w-4 text-center">{guestCount}</span>
              <button
                className="text-slate-400 hover:text-white text-xs px-1"
                onClick={() => setGuestCount(guestCount + 1)}
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Search & Category Pills */}
        <div className="py-3 space-y-2 border-b border-slate-800">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <Input
              placeholder="Search food item or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 bg-slate-950 border-slate-800 text-sm"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === 'ALL'
                  ? 'bg-slate-200 text-slate-950 font-bold'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              All Items
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  selectedCategory === c.id
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Items Grid */}
        <div className="flex-1 overflow-y-auto pt-3 pr-1 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5">
          {filteredCatalog.map((item) => (
            <Card
              key={item.id}
              onClick={() => handleAddItem(item)}
              className="bg-slate-950/80 border-slate-800 hover:border-emerald-500/80 hover:bg-slate-900 transition-all cursor-pointer group"
            >
              <CardContent className="p-3 flex flex-col justify-between h-full space-y-2">
                <div className="flex items-start justify-between gap-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        item.isVeg ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                    />
                    <span className="text-[10px] text-slate-500 font-mono">{item.code}</span>
                  </div>
                  {(item.variants?.length > 0 || item.addons?.length > 0) && (
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                      Customize
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="font-semibold text-sm text-slate-200 group-hover:text-emerald-400 transition-colors line-clamp-1">
                    {item.name}
                  </h4>
                  <p className="text-xs font-bold text-white pt-1">
                    ₹{formatPaiseToRupees(item.basePrice)}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* RIGHT PANEL: Active Order Cart & KOT Engine */}
      <div className="w-full lg:w-[420px] flex flex-col bg-slate-900 border border-slate-800 rounded-xl p-4 overflow-hidden">
        {/* Cart Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-emerald-400" />
              Active Order Ticket
            </h2>
            <p className="text-xs text-slate-400">
              {orderType} • {initialTableName} • {activeLines.length} items
            </p>
          </div>
          {hasDraftItems ? (
            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/40">
              Unsent Items
            </Badge>
          ) : (
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40">
              Sent to KOT
            </Badge>
          )}
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2 pr-1">
          {orderLines.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2">
              <UtensilsCrossed className="w-8 h-8 stroke-[1.5]" />
              <p className="text-sm">Tap menu items to add to order</p>
            </div>
          ) : (
            orderLines.map((line) => {
              const isCancelled = line.status === 'CANCELLED';
              const isSent = line.status === 'SENT';
              const addonsTotal = (line.addons || []).reduce((acc, a) => acc + (a.price || 0), 0);
              const lineTotal = (line.unitPrice + addonsTotal) * line.quantity;

              return (
                <div
                  key={line.id}
                  className={`p-2.5 rounded-lg border transition-all ${
                    isCancelled
                      ? 'bg-rose-950/20 border-rose-900/40 opacity-50'
                      : isSent
                      ? 'bg-slate-950/80 border-slate-800'
                      : 'bg-emerald-950/20 border-emerald-800/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-sm text-white">{line.name}</span>
                        {line.variantName && (
                          <span className="text-[10px] bg-slate-800 text-slate-300 px-1 rounded">
                            {line.variantName}
                          </span>
                        )}
                        <span
                          className={`text-[9px] px-1 py-0.5 rounded font-bold uppercase ${
                            isCancelled
                              ? 'bg-rose-500/20 text-rose-400'
                              : isSent
                              ? 'bg-blue-500/20 text-blue-400'
                              : 'bg-emerald-500/20 text-emerald-400'
                          }`}
                        >
                          {line.status}
                        </span>
                      </div>

                      {line.addons?.length > 0 && (
                        <p className="text-[11px] text-slate-400 pt-0.5">
                          + {line.addons.map((a) => a.name).join(', ')}
                        </p>
                      )}

                      {line.notes && (
                        <p className="text-[11px] text-amber-400/90 italic pt-0.5">
                          Note: {line.notes}
                        </p>
                      )}

                      {line.cancelReason && (
                        <p className="text-[11px] text-rose-400 italic pt-0.5">
                          Reason: {line.cancelReason}
                        </p>
                      )}
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-bold text-white">
                        ₹{formatPaiseToRupees(lineTotal)}
                      </p>
                    </div>
                  </div>

                  {!isCancelled && (
                    <div className="flex items-center justify-between pt-2 mt-1 border-t border-slate-800/60">
                      <div className="flex items-center gap-1 bg-slate-900 rounded border border-slate-800">
                        <button
                          disabled={isSent}
                          onClick={() => handleUpdateQuantity(line.id, -1)}
                          className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-bold text-white">{line.quantity}</span>
                        <button
                          disabled={isSent}
                          onClick={() => handleUpdateQuantity(line.id, 1)}
                          className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => {
                          if (isSent) {
                            setCancelModalLine(line);
                          } else {
                            setOrderLines((prev) => prev.filter((l) => l.id !== line.id));
                          }
                        }}
                        className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        {isSent ? 'Cancel (KOT Sent)' : 'Remove'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Cart Calculation & Summary */}
        <div className="border-t border-slate-800 pt-3 space-y-1.5">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Subtotal</span>
            <span>₹{formatPaiseToRupees(subtotal)}</span>
          </div>
          <div className="flex justify-between text-xs text-slate-400">
            <span>CGST (2.5%) + SGST (2.5%)</span>
            <span>₹{formatPaiseToRupees(cgstAmount + sgstAmount)}</span>
          </div>
          <div className="flex justify-between text-sm font-bold text-white pt-1 border-t border-slate-800">
            <span>Estimated Total</span>
            <span className="text-emerald-400 text-base">₹{formatPaiseToRupees(grandTotal)}</span>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <Button
              className="bg-emerald-600 hover:bg-emerald-500 font-semibold gap-1.5 h-11 text-sm"
              disabled={!hasDraftItems}
              onClick={handleSendToKitchen}
            >
              <Send className="w-4 h-4" />
              Send to Kitchen (KOT)
            </Button>

            <Button
              variant="secondary"
              className="font-semibold gap-1.5 h-11 text-sm bg-slate-800 hover:bg-slate-700 text-white"
              onClick={() => navigate('/billing')}
            >
              <Receipt className="w-4 h-4 text-emerald-400" />
              Generate Bill
            </Button>
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-emerald-500 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-medium">{notification}</span>
        </div>
      )}

      {/* Item Customization Modal */}
      {activeItemForCustomization && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md bg-slate-900 border-slate-800">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">
                  Customize {activeItemForCustomization.name}
                </h3>
                <button
                  onClick={() => setActiveItemForCustomization(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Variants */}
              {activeItemForCustomization.variants?.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Choose Portion/Size:</label>
                  <div className="grid grid-cols-2 gap-2">
                    {activeItemForCustomization.variants.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() =>
                          setActiveItemForCustomization({
                            ...activeItemForCustomization,
                            selectedVariant: v,
                          })
                        }
                        className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
                          activeItemForCustomization.selectedVariant?.id === v.id
                            ? 'bg-emerald-600/20 border-emerald-500 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <p className="font-bold text-white">{v.name}</p>
                        <p className="text-[11px] text-emerald-400 font-mono">
                          ₹{formatPaiseToRupees(v.price)}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Addons */}
              {activeItemForCustomization.addons?.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Add-ons & Extras:</label>
                  <div className="space-y-1.5">
                    {activeItemForCustomization.addons.map((a) => {
                      const isSelected = activeItemForCustomization.selectedAddons.some(
                        (sel) => sel.id === a.id
                      );
                      return (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => {
                            const next = isSelected
                              ? activeItemForCustomization.selectedAddons.filter((x) => x.id !== a.id)
                              : [...activeItemForCustomization.selectedAddons, a];
                            setActiveItemForCustomization({
                              ...activeItemForCustomization,
                              selectedAddons: next,
                            });
                          }}
                          className={`w-full p-2 rounded-lg border flex items-center justify-between text-xs transition-all ${
                            isSelected
                              ? 'bg-emerald-600/20 border-emerald-500 text-white'
                              : 'bg-slate-950 border-slate-800 text-slate-400'
                          }`}
                        >
                          <span>{a.name}</span>
                          <span className="text-emerald-400">+₹{formatPaiseToRupees(a.price)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Special Note */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Chef Cooking Instruction:</label>
                <Input
                  placeholder="e.g. Less spicy, no onion garlic..."
                  value={activeItemForCustomization.notes}
                  onChange={(e) =>
                    setActiveItemForCustomization({
                      ...activeItemForCustomization,
                      notes: e.target.value,
                    })
                  }
                  className="bg-slate-950 border-slate-800 text-xs h-9"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <Button variant="ghost" onClick={() => setActiveItemForCustomization(null)}>
                  Cancel
                </Button>
                <Button className="bg-emerald-600 hover:bg-emerald-500" onClick={handleConfirmCustomization}>
                  Add to Cart
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Line Cancel Reason Modal */}
      {cancelModalLine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md bg-slate-900 border-slate-800">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-400" />
                <h3 className="text-lg font-bold text-white">Cancel Sent Line</h3>
              </div>
              <p className="text-xs text-slate-400">
                This item has already been sent to the kitchen ({cancelModalLine.name}). A cancellation slip will be printed for the kitchen station.
              </p>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">Cancellation Reason:</label>
                <div className="space-y-1">
                  {[
                    'Customer changed mind',
                    'Accidental entry by captain',
                    'Item out of stock / ingredient finished',
                    'Delay in kitchen preparation',
                  ].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setCancelReason(r)}
                      className={`w-full p-2 text-left rounded text-xs transition-all border ${
                        cancelReason === r
                          ? 'bg-rose-500/20 border-rose-500 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <Button variant="ghost" onClick={() => setCancelModalLine(null)}>
                  Keep Item
                </Button>
                <Button variant="destructive" onClick={handleCancelLine}>
                  Confirm Cancellation Slip
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
