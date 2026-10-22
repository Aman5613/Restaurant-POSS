import React, { useState, useMemo, useEffect } from 'react';
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
  Receipt,
  UtensilsCrossed,
  ChefHat,
  ShoppingBag,
  Truck,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import { formatPaiseToRupees, ORDER_TYPES } from '@pos/shared';
import { usePosStore } from '@/stores/pos-store';
import { apiClient } from '@/lib/api-client';

export function OrderScreenPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tableId = searchParams.get('tableId') || 'tbl_1';
  const paramTableName = searchParams.get('tableName');

  const {
    getTableOrder,
    saveTableOrder,
    markOrderBilled,
    tables,
    sendKotToKitchen,
    saveCustomer,
    menuItems: storeMenuItems,
    menuCategories: storeCategories,
    setMenuItems,
    setMenuCategories,
  } = usePosStore();

  const currentTable = tables.find((t) => t.id === tableId);
  const tableName = paramTableName || currentTable?.name || 'Counter';

  const [orderType, setOrderType] = useState(tableId ? ORDER_TYPES.DINE_IN : ORDER_TYPES.TAKEAWAY);
  const [mobileTab, setMobileTab] = useState('menu');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [search, setSearch] = useState('');
  const [guestCount, setGuestCount] = useState(currentTable?.guestCount || 2);
  const [orderLines, setOrderLines] = useState([]);

  const [deliveryCustomer, setDeliveryCustomer] = useState({
    name: '',
    phone: '',
    address: '',
    notes: '',
  });
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);

  // Sync menu from API
  useEffect(() => {
    async function syncMenuCatalog() {
      try {
        const [itemsRes, catsRes] = await Promise.all([
          apiClient.get('/v1/menu/items').catch(() => null),
          apiClient.get('/v1/menu/categories').catch(() => null),
        ]);
        if (catsRes?.categories?.length) {
          setMenuCategories(
            catsRes.categories.map((c) => ({
              id: c._id || c.id,
              name: c.name,
            }))
          );
        }
        if (itemsRes?.items?.length) {
          setMenuItems(
            itemsRes.items.map((it) => ({
              id: it._id || it.id,
              _id: it._id,
              name: it.name,
              code: it.code || '',
              categoryId: typeof it.categoryId === 'object' ? it.categoryId?._id : it.categoryId,
              categoryName: typeof it.categoryId === 'object' ? it.categoryId?.name : '',
              basePrice: it.basePrice || 0,
              isVeg: it.isVeg !== false,
              isAvailable: it.isAvailable !== false,
              stationId: typeof it.stationId === 'object' ? it.stationId?._id : it.stationId,
              variants: it.variants || [],
              addons: it.addons || [],
            }))
          );
        }
      } catch {
        // use store catalog
      }
    }
    syncMenuCatalog();
  }, [setMenuItems, setMenuCategories]);

  // Load existing table order on mount or when tableId changes
  useEffect(() => {
    const existing = getTableOrder(tableId);
    if (existing && existing.lines?.length) {
      setOrderLines(existing.lines);
      if (existing.guestCount) setGuestCount(existing.guestCount);
      if (existing.orderType) setOrderType(existing.orderType);
      if (existing.customerName || existing.customerPhone) {
        setDeliveryCustomer({
          name: existing.customerName || '',
          phone: existing.customerPhone || '',
          address: existing.deliveryAddress || '',
          notes: '',
        });
      }
    } else {
      setOrderLines([]);
    }
  }, [tableId, getTableOrder]);

  const [activeItemForCustomization, setActiveItemForCustomization] = useState(null);
  const [cancelModalLine, setCancelModalLine] = useState(null);
  const [cancelReason, setCancelReason] = useState('Customer changed mind');
  const [notification, setNotification] = useState(null);

  const categories = storeCategories?.length ? storeCategories : [
    { id: 'cat_1', name: 'Starters' },
    { id: 'cat_2', name: 'Main Course' },
    { id: 'cat_3', name: 'Breads & Rice' },
    { id: 'cat_4', name: 'Beverages' },
    { id: 'cat_5', name: 'Desserts' },
  ];

  const menuCatalog = storeMenuItems?.length ? storeMenuItems : [
    {
      id: 'it_1',
      categoryId: 'cat_1',
      name: 'Paneer Tikka',
      code: 'STR-01',
      basePrice: 28000,
      isVeg: true,
      isAvailable: true,
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
      isAvailable: true,
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
      isAvailable: true,
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
      isAvailable: true,
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
      isAvailable: true,
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
      isAvailable: true,
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
      isAvailable: true,
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
      isAvailable: true,
      variants: [],
      addons: [{ id: 'a5', name: 'With Vanilla Ice Cream', price: 4000 }],
    },
  ];

  const filteredCatalog = useMemo(() => {
    return menuCatalog.filter((item) => {
      const matchesCategory = selectedCategory === 'ALL' || item.categoryId === selectedCategory;
      const matchesSearch =
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        (item.code && item.code.toLowerCase().includes(search.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [menuCatalog, selectedCategory, search]);

  const updateStore = (nextLines, nextGuests = guestCount, currentOrderType = orderType) => {
    setOrderLines(nextLines);
    saveTableOrder(tableId, {
      tableName,
      guestCount: nextGuests,
      orderType: currentOrderType,
      lines: nextLines,
      customerName: deliveryCustomer.name,
      customerPhone: deliveryCustomer.phone,
      deliveryAddress: deliveryCustomer.address,
    });
  };

  const handleSelectDelivery = () => {
    setOrderType(ORDER_TYPES.DELIVERY);
    updateStore(orderLines, guestCount, ORDER_TYPES.DELIVERY);
    if (!deliveryCustomer.name || !deliveryCustomer.phone) {
      setIsDeliveryModalOpen(true);
    }
  };

  const handleSaveDeliveryCustomer = async (e) => {
    e.preventDefault();
    if (!deliveryCustomer.name || !deliveryCustomer.phone) return;

    // 1. Add customer into customers page / posStore
    const customerRecord = {
      id: `cust_${Date.now()}`,
      name: deliveryCustomer.name.trim(),
      phone: deliveryCustomer.phone.trim(),
      address: deliveryCustomer.address.trim(),
      totalSpentPaise: 0,
      visitsCount: 1,
    };
    saveCustomer(customerRecord);

    // 2. Post to API in background
    try {
      await apiClient.post('/v1/customers', customerRecord);
    } catch {
      // Handled in store
    }

    // 3. Save to active order
    saveTableOrder(tableId, {
      tableName,
      guestCount,
      orderType: ORDER_TYPES.DELIVERY,
      lines: orderLines,
      customerName: deliveryCustomer.name.trim(),
      customerPhone: deliveryCustomer.phone.trim(),
      deliveryAddress: deliveryCustomer.address.trim(),
    });

    setIsDeliveryModalOpen(false);
    setNotification(`Delivery details saved for ${deliveryCustomer.name}! Customer added to Customers directory.`);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleAddItem = (item) => {
    if (item.isAvailable === false) {
      setNotification(`"${item.name}" is currently 86 (Out of Stock)!`);
      setTimeout(() => setNotification(null), 3000);
      return;
    }

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

    const existingIndex = orderLines.findIndex(
      (l) => l.itemId === item.id && l.status === 'DRAFT' && !l.variantName && !l.addons?.length
    );

    let nextLines;
    if (existingIndex >= 0) {
      nextLines = orderLines.map((l, idx) =>
        idx === existingIndex ? { ...l, quantity: l.quantity + 1 } : l
      );
    } else {
      nextLines = [
        ...orderLines,
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
      ];
    }

    updateStore(nextLines);
  };

  const handleConfirmCustomization = () => {
    if (!activeItemForCustomization) return;
    const item = activeItemForCustomization;
    const price = item.selectedVariant ? item.selectedVariant.price : item.basePrice;

    const nextLines = [
      ...orderLines,
      {
        id: `ln_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        itemId: item.id,
        name: item.name,
        variantName: item.selectedVariant?.name || null,
        quantity: item.quantity || 1,
        unitPrice: price,
        addons: item.selectedAddons || [],
        notes: item.notes || '',
        course: 'general',
        status: 'DRAFT',
      },
    ];

    updateStore(nextLines);
    setActiveItemForCustomization(null);
  };

  const handleUpdateQuantity = (lineId, delta) => {
    const nextLines = orderLines
      .map((line) => {
        if (line.id === lineId) {
          const nextQty = line.quantity + delta;
          return nextQty > 0 ? { ...line, quantity: nextQty } : null;
        }
        return line;
      })
      .filter(Boolean);

    updateStore(nextLines);
  };

  const handleSendToKitchen = () => {
    const draftCount = orderLines.filter((l) => l.status === 'DRAFT' || !l.status).length;
    if (draftCount === 0) {
      setNotification('All items have already been dispatched to KOT!');
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    const activeOrder = getTableOrder(tableId);
    const orderNo = activeOrder?.orderNo || `ORD-0001`;

    const kot = sendKotToKitchen({
      tableId,
      tableName,
      orderNo,
      lines: orderLines,
    });

    const nextLines = orderLines.map((l) =>
      l.status === 'DRAFT' || !l.status ? { ...l, status: 'SENT' } : l
    );

    updateStore(nextLines);
    setNotification(`${kot?.kotNo || 'KOT'} generated successfully! Dispatched to ${kot?.stationName || 'kitchen'}.`);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleCancelLine = () => {
    if (!cancelModalLine) return;
    const nextLines = orderLines.map((l) =>
      l.id === cancelModalLine.id
        ? { ...l, status: 'CANCELLED', cancelReason }
        : l
    );
    updateStore(nextLines);
    setCancelModalLine(null);
    setNotification('Line cancelled and kitchen slip dispatched.');
    setTimeout(() => setNotification(null), 3000);
  };

  const handleGenerateBill = () => {
    if (orderLines.length === 0) {
      setNotification('Cannot generate bill for an empty order!');
      setTimeout(() => setNotification(null), 3000);
      return;
    }
    // Mark as billed in store so floor view updates
    markOrderBilled(tableId);
    const custQuery = deliveryCustomer.name
      ? `&customerName=${encodeURIComponent(deliveryCustomer.name)}&customerPhone=${encodeURIComponent(deliveryCustomer.phone)}`
      : '';
    navigate(`/billing?tableId=${tableId}&tableName=${encodeURIComponent(tableName)}${custQuery}`);
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
    <div className="min-h-full lg:h-[calc(100vh-5.5rem)] flex flex-col lg:flex-row gap-4 overflow-visible lg:overflow-hidden max-w-7xl mx-auto pb-16 lg:pb-0">
      {/* Mobile Tab Switcher */}
      <div className="flex lg:hidden items-center bg-slate-200/80 p-1 rounded-xl">
        <button
          type="button"
          onClick={() => setMobileTab('menu')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
            mobileTab === 'menu'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <UtensilsCrossed className="w-3.5 h-3.5" />
          Menu Items ({filteredCatalog.length})
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('cart')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all relative ${
            mobileTab === 'cart'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ChefHat className="w-3.5 h-3.5" />
          Order Cart ({orderLines.length})
          {hasDraftItems && (
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse ml-0.5" />
          )}
        </button>
      </div>

      {/* LEFT PANEL: Menu Catalog */}
      <div
        className={`w-full flex-1 flex flex-col bg-white border border-slate-200 rounded-xl p-3 sm:p-4 shadow-xs overflow-visible lg:overflow-hidden ${
          mobileTab === 'menu' ? 'flex' : 'hidden lg:flex'
        }`}
      >
        {/* Order Type & Table Selection Header */}
        <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-slate-500 hover:text-slate-900"
              onClick={() => navigate('/tables')}
              title="Back to Tables"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Tables
            </Button>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setOrderType(ORDER_TYPES.DINE_IN)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  orderType === ORDER_TYPES.DINE_IN
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UtensilsCrossed className="w-3.5 h-3.5" />
                {tableName}
              </button>
              <button
                onClick={() => setOrderType(ORDER_TYPES.TAKEAWAY)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  orderType === ORDER_TYPES.TAKEAWAY
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                Takeaway
              </button>
              <button
                onClick={handleSelectDelivery}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  orderType === ORDER_TYPES.DELIVERY
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Truck className="w-3.5 h-3.5" />
                Delivery
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Guests:</span>
            <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded border border-slate-200">
              <button
                className="text-slate-500 hover:text-slate-900 text-xs px-1 font-bold"
                onClick={() => {
                  const next = Math.max(1, guestCount - 1);
                  setGuestCount(next);
                  updateStore(orderLines, next);
                }}
              >
                -
              </button>
              <span className="text-xs font-bold text-slate-800 w-4 text-center">{guestCount}</span>
              <button
                className="text-slate-500 hover:text-slate-900 text-xs px-1 font-bold"
                onClick={() => {
                  const next = guestCount + 1;
                  setGuestCount(next);
                  updateStore(orderLines, next);
                }}
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Delivery Customer Details Bar */}
        {orderType === ORDER_TYPES.DELIVERY && (
          <div className="mt-2.5 p-2.5 bg-rose-50/70 border border-rose-200 rounded-xl flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-7 w-7 rounded-lg bg-white border border-rose-200 flex items-center justify-center text-rose-600 flex-shrink-0 shadow-xs">
                <Truck className="w-4 h-4" />
              </div>
              {deliveryCustomer.name ? (
                <div className="truncate">
                  <span className="font-bold text-slate-900">{deliveryCustomer.name}</span>
                  <span className="text-slate-600 font-mono ml-2">({deliveryCustomer.phone})</span>
                  {deliveryCustomer.address && (
                    <span className="text-slate-500 ml-2 truncate hidden sm:inline">• {deliveryCustomer.address}</span>
                  )}
                </div>
              ) : (
                <span className="text-rose-800 font-semibold">Delivery requires customer details (Address & Phone)</span>
              )}
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2.5 text-xs font-semibold border-rose-300 text-rose-700 hover:bg-rose-100 flex-shrink-0"
              onClick={() => setIsDeliveryModalOpen(true)}
            >
              {deliveryCustomer.name ? 'Edit Details' : '+ Add Details'}
            </Button>
          </div>
        )}

        {/* Search & Category Tabs */}
        <div className="py-2.5 space-y-2 border-b border-slate-100">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <Input
              placeholder="Search food item or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs bg-slate-50 border-slate-200 focus:bg-white text-slate-800"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === 'ALL'
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              All Items
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === c.id
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Items Grid */}
        <div className="flex-1 overflow-y-auto pt-2.5 pr-0.5 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5 min-h-[300px]">
          {filteredCatalog.map((item) => (
            <div
              key={item.id}
              onClick={() => handleAddItem(item)}
              className={`bg-white border rounded-xl p-3 flex flex-col justify-between transition-all cursor-pointer group select-none ${
                item.isAvailable === false
                  ? 'opacity-60 border-dashed border-rose-200 bg-rose-50/20'
                  : 'border-slate-200 hover:border-slate-400 hover:shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between gap-1 pb-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      item.isVeg ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}
                  />
                  <span className="text-[10px] text-slate-400 font-mono">{item.code}</span>
                </div>
                {item.isAvailable === false ? (
                  <Badge variant="destructive" className="text-[9px] px-1 py-0 font-bold">
                    86 (Out)
                  </Badge>
                ) : (item.variants?.length > 0 || item.addons?.length > 0) ? (
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                    Options
                  </span>
                ) : null}
              </div>

              <div>
                <h4 className="font-bold text-xs text-slate-900 group-hover:text-rose-700 transition-colors line-clamp-1">
                  {item.name}
                </h4>
                <div className="flex items-center justify-between pt-1 gap-1">
                  <p className="text-xs font-bold text-slate-900">
                    {item.variants?.length > 0
                      ? `From ${formatPaiseToRupees(Math.min(...item.variants.map((v) => v.price)))}`
                      : formatPaiseToRupees(item.basePrice)}
                  </p>
                  {item.variants?.length > 0 && (
                    <span className="text-[10px] text-slate-500 font-medium truncate max-w-[100px]" title={item.variants.map((v) => v.name).join(' / ')}>
                      {item.variants.map((v) => v.name).join(' / ')}
                    </span>
                  )}
                </div>
                {item.addons?.length > 0 && (
                  <p className="text-[10px] text-emerald-700 font-semibold truncate pt-0.5">
                    +{item.addons.length} Add-on{item.addons.length > 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT PANEL: Active Order Cart & KOT Engine */}
      <div
        className={`w-full lg:w-[400px] flex flex-col bg-white border border-slate-200 rounded-xl p-3 sm:p-4 shadow-xs overflow-visible lg:overflow-hidden ${
          mobileTab === 'cart' ? 'flex' : 'hidden lg:flex'
        }`}
      >
        {/* Cart Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ChefHat className="w-4 h-4 text-slate-600" />
              Order: {tableName}
            </h2>
            <p className="text-[11px] font-medium text-slate-500">
              {orderType} • {activeLines.length} items
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="outline"
              className="lg:hidden text-xs h-7 px-2 border-slate-200 text-slate-700 hover:bg-slate-50 gap-1 font-semibold"
              onClick={() => setMobileTab('menu')}
            >
              <Plus className="w-3 h-3" />
              Add Items
            </Button>
            {hasDraftItems ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                Unsent Items
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Sent to KOT
              </span>
            )}
          </div>
        </div>

        {/* Cart Items List */}
        <div className="py-2.5 space-y-2 lg:flex-1 lg:overflow-y-auto min-h-0">
          {orderLines.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2 py-10">
              <UtensilsCrossed className="w-8 h-8 stroke-[1.5] text-slate-300" />
              <p className="text-xs font-medium">Tap menu items to add to order</p>
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
                  className={`p-2.5 rounded-xl border transition-all ${
                    isCancelled
                      ? 'bg-rose-50/40 border-rose-200 opacity-60'
                      : isSent
                      ? 'bg-slate-50/60 border-slate-200'
                      : 'bg-white border-slate-200 shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-slate-900">{line.name}</span>
                        {line.variantName && (
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1 rounded font-medium">
                            {line.variantName}
                          </span>
                        )}
                        <span
                          className={`text-[9px] px-1 py-0.2 rounded font-bold uppercase ${
                            isCancelled
                              ? 'bg-rose-100 text-rose-700'
                              : isSent
                              ? 'bg-sky-100 text-sky-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {line.status}
                        </span>
                      </div>

                      {line.addons?.length > 0 && (
                        <p className="text-[11px] text-slate-500 pt-0.5">
                          + {line.addons.map((a) => a.name).join(', ')}
                        </p>
                      )}

                      {line.notes && (
                        <p className="text-[11px] text-amber-700 italic pt-0.5">
                          Note: {line.notes}
                        </p>
                      )}

                      {line.cancelReason && (
                        <p className="text-[11px] text-rose-600 italic pt-0.5">
                          Reason: {line.cancelReason}
                        </p>
                      )}
                    </div>

                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-900">
                        {formatPaiseToRupees(lineTotal)}
                      </p>
                    </div>
                  </div>

                  {!isCancelled && (
                    <div className="flex items-center justify-between pt-2 mt-1.5 border-t border-slate-100">
                      <div className="flex items-center gap-1 bg-slate-100 rounded-md p-0.5">
                        <button
                          disabled={isSent}
                          onClick={() => handleUpdateQuantity(line.id, -1)}
                          className="p-1 text-slate-600 hover:text-slate-900 disabled:opacity-30"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-bold text-slate-900">{line.quantity}</span>
                        <button
                          disabled={isSent}
                          onClick={() => handleUpdateQuantity(line.id, 1)}
                          className="p-1 text-slate-600 hover:text-slate-900 disabled:opacity-30"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => {
                          if (isSent) {
                            setCancelModalLine(line);
                          } else {
                            const next = orderLines.filter((l) => l.id !== line.id);
                            updateStore(next);
                          }
                        }}
                        className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1"
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
        <div className="border-t border-slate-100 pt-3 space-y-1.5">
          <div className="flex justify-between text-xs text-slate-500">
            <span>Subtotal</span>
            <span>{formatPaiseToRupees(subtotal)}</span>
          </div>
          <div className="flex justify-between text-xs text-slate-500">
            <span>CGST (2.5%) + SGST (2.5%)</span>
            <span>{formatPaiseToRupees(cgstAmount + sgstAmount)}</span>
          </div>
          <div className="flex justify-between text-sm font-bold text-slate-900 pt-1.5 border-t border-slate-100">
            <span>Estimated Total</span>
            <span className="text-base font-bold text-slate-900">{formatPaiseToRupees(grandTotal)}</span>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <Button
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold gap-1.5 h-10 text-xs shadow-xs"
              disabled={!hasDraftItems}
              onClick={handleSendToKitchen}
            >
              <Send className="w-3.5 h-3.5" />
              Send to KOT
            </Button>

            <Button
              variant="outline"
              className="font-semibold gap-1.5 h-10 text-xs border-slate-300 text-slate-800 hover:bg-slate-100"
              onClick={handleGenerateBill}
            >
              <Receipt className="w-3.5 h-3.5 text-slate-700" />
              Generate Bill
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Cart Summary Bar */}
      {orderLines.length > 0 && mobileTab === 'menu' && (
        <div className="lg:hidden fixed bottom-4 left-4 right-4 z-40 bg-slate-900/95 backdrop-blur-md text-white p-3 rounded-xl shadow-2xl flex items-center justify-between border border-slate-800">
          <div className="min-w-0 pr-2">
            <p className="text-xs font-bold truncate">
              {orderLines.length} item{orderLines.length > 1 ? 's' : ''} in cart
              {hasDraftItems && <span className="ml-1.5 text-[10px] text-amber-400 font-semibold">• Unsent</span>}
            </p>
            <p className="text-sm font-extrabold text-white">{formatPaiseToRupees(grandTotal)}</p>
          </div>
          <Button
            size="sm"
            className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-3 py-1.5 h-8 gap-1.5 shadow-xs shrink-0"
            onClick={() => setMobileTab('cart')}
          >
            <span>View Cart</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}

      {/* Notification Toast */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-lg shadow-xl flex items-center gap-2 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Item Customization Modal */}
      {activeItemForCustomization && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-white border-slate-200 shadow-2xl">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900">
                  Customize {activeItemForCustomization.name}
                </h3>
                <button
                  onClick={() => setActiveItemForCustomization(null)}
                  className="text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Variants */}
              {activeItemForCustomization.variants?.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Portion / Size:</label>
                  <div className="grid grid-cols-2 gap-2">
                    {activeItemForCustomization.variants.map((v, idx) => {
                      const isVariantSelected = activeItemForCustomization.selectedVariant?.id && v.id
                        ? activeItemForCustomization.selectedVariant?.id === v.id
                        : activeItemForCustomization.selectedVariant?.name === v.name;

                      return (
                        <button
                          key={v.id || v.name || idx}
                          type="button"
                          onClick={() =>
                            setActiveItemForCustomization({
                              ...activeItemForCustomization,
                              selectedVariant: v,
                            })
                          }
                          className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
                            isVariantSelected
                              ? 'bg-rose-50 border-rose-400 text-rose-900 ring-1 ring-rose-400 font-medium'
                              : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <p className="font-bold text-slate-900">{v.name}</p>
                          <p className="text-[11px] font-semibold text-rose-700">
                            {formatPaiseToRupees(v.price)}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Addons */}
              {activeItemForCustomization.addons?.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Add-ons & Extras:</label>
                  <div className="space-y-1.5">
                    {activeItemForCustomization.addons.map((a, idx) => {
                      const isSelected = activeItemForCustomization.selectedAddons.some(
                        (sel) => (sel.id && a.id ? sel.id === a.id : sel.name === a.name)
                      );
                      return (
                        <button
                          key={a.id || a.name || idx}
                          type="button"
                          onClick={() => {
                            const next = isSelected
                              ? activeItemForCustomization.selectedAddons.filter((x) =>
                                  x.id && a.id ? x.id !== a.id : x.name !== a.name
                                )
                              : [...activeItemForCustomization.selectedAddons, a];
                            setActiveItemForCustomization({
                              ...activeItemForCustomization,
                              selectedAddons: next,
                            });
                          }}
                          className={`w-full p-2.5 rounded-lg border flex items-center justify-between text-xs transition-all ${
                            isSelected
                              ? 'bg-rose-50 border-rose-400 text-rose-900 font-semibold ring-1 ring-rose-400'
                              : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span
                              className={`w-3.5 h-3.5 rounded border flex items-center justify-center text-[10px] ${
                                isSelected ? 'bg-rose-600 border-rose-600 text-white' : 'border-slate-300'
                              }`}
                            >
                              {isSelected ? '✓' : ''}
                            </span>
                            <span>{a.name}</span>
                          </span>
                          <span className="font-bold text-slate-800">+{formatPaiseToRupees(a.price)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Special Note */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Kitchen Instructions:</label>
                <Input
                  placeholder="e.g. Less spicy, extra crisp..."
                  value={activeItemForCustomization.notes}
                  onChange={(e) =>
                    setActiveItemForCustomization({
                      ...activeItemForCustomization,
                      notes: e.target.value,
                    })
                  }
                  className="bg-slate-50 border-slate-200 text-xs h-8 text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-slate-600"
                  onClick={() => setActiveItemForCustomization(null)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
                  onClick={handleConfirmCustomization}
                >
                  Add to Cart
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Line Cancel Reason Modal */}
      {cancelModalLine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-white border-slate-200 shadow-2xl">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-600" />
                <h3 className="text-base font-bold text-slate-900">Cancel Sent Line</h3>
              </div>
              <p className="text-xs text-slate-500">
                This item has already been sent to the kitchen ({cancelModalLine.name}). A cancellation slip will be printed for the kitchen station.
              </p>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700">Reason for Cancellation:</label>
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
                      className={`w-full p-2 text-left rounded-lg text-xs transition-all border ${
                        cancelReason === r
                          ? 'bg-rose-50 border-rose-300 text-rose-900 font-semibold'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-slate-600"
                  onClick={() => setCancelModalLine(null)}
                >
                  Keep Item
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="text-xs font-semibold"
                  onClick={handleCancelLine}
                >
                  Confirm Cancellation Slip
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delivery Customer Details Modal */}
      {isDeliveryModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-white border-slate-200 shadow-2xl">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Truck className="w-4 h-4 text-rose-600" />
                Delivery Customer Details
              </h3>
              <button
                type="button"
                onClick={() => setIsDeliveryModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveDeliveryCustomer}>
              <div className="p-4 space-y-3">
                <p className="text-xs text-slate-500">
                  Customer will be automatically saved to your Customer Directory & Credit Ledger.
                </p>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Customer Name *</label>
                  <Input
                    placeholder="e.g. Anjali Gupta"
                    value={deliveryCustomer.name}
                    onChange={(e) => setDeliveryCustomer({ ...deliveryCustomer, name: e.target.value })}
                    className="mt-1 bg-slate-50 border-slate-200 text-xs h-9 text-slate-900"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Mobile Phone Number *</label>
                  <Input
                    placeholder="e.g. 9820012345"
                    value={deliveryCustomer.phone}
                    onChange={(e) => setDeliveryCustomer({ ...deliveryCustomer, phone: e.target.value })}
                    className="mt-1 bg-slate-50 border-slate-200 text-xs h-9 text-slate-900 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Full Delivery Address *</label>
                  <Input
                    placeholder="e.g. Flat 302, Sea View Apts, Bandra West"
                    value={deliveryCustomer.address}
                    onChange={(e) => setDeliveryCustomer({ ...deliveryCustomer, address: e.target.value })}
                    className="mt-1 bg-slate-50 border-slate-200 text-xs h-9 text-slate-900"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Landmark / Delivery Instructions</label>
                  <Input
                    placeholder="e.g. Near Mehboob Studio, Call upon arrival"
                    value={deliveryCustomer.notes}
                    onChange={(e) => setDeliveryCustomer({ ...deliveryCustomer, notes: e.target.value })}
                    className="mt-1 bg-slate-50 border-slate-200 text-xs h-9 text-slate-900"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 p-4 border-t border-slate-100">
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  className="text-xs text-slate-600"
                  onClick={() => setIsDeliveryModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button size="sm" type="submit" className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold">
                  Save & Assign to Delivery
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
