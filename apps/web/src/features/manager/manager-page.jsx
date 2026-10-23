import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  UtensilsCrossed,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Grid3X3,
  CalendarDays,
  Receipt,
  Users,
  BarChart3,
  ChefHat,
  X,
  RefreshCw,
  SlidersHorizontal,
  DollarSign,
  AlertTriangle,
  Layers,
} from 'lucide-react';
import { formatPaiseToRupees } from '@pos/shared';
import { usePosStore } from '@/stores/pos-store';
import { useAuthStore } from '@/stores/auth-store';
import { apiClient } from '@/lib/api-client';
import { ManagerFloorsTablesTab } from './components/manager-floors-tables-tab';
import { ManagerDayOpsTab } from './components/manager-dayops-tab';
import { ManagerCategoriesTab } from './components/manager-categories-tab';

export function ManagerPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    tables,
    orders,
    kots,
    invoices,
    dayOps,
    menuItems: storeMenuItems,
    menuCategories: storeCategories,
    setMenuItems,
    setMenuCategories,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    toggleItemAvailability,
  } = usePosStore();

  const [activeTab, setActiveTab] = useState('items'); // 'dashboard' | 'items' | 'watchlist'
  const [items, setItems] = useState(storeMenuItems || []);
  const [categories, setCategories] = useState(storeCategories || []);
  const [stations, setStations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [dietFilter, setDietFilter] = useState('ALL'); // ALL, VEG, NON_VEG
  const [stockFilter, setStockFilter] = useState('ALL'); // ALL, IN_STOCK, OUT_OF_STOCK

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formPriceRupees, setFormPriceRupees] = useState('');
  const [formIsVeg, setFormIsVeg] = useState(true);
  const [formStationId, setFormStationId] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formVariants, setFormVariants] = useState([]);
  const [formAddons, setFormAddons] = useState([]);

  const showNotification = (msg, type = 'success') => {
    setNotification({ message: msg, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // Load menu items, categories, and stations from API
  const loadMenuData = async () => {
    setIsLoading(true);
    try {
      const [itemsRes, catsRes, stationsRes] = await Promise.all([
        apiClient.get('/v1/menu/items').catch(() => null),
        apiClient.get('/v1/menu/categories').catch(() => null),
        apiClient.get('/v1/menu/stations').catch(() => null),
      ]);

      if (stationsRes?.stations) {
        setStations(stationsRes.stations);
      }

      if (catsRes?.categories?.length) {
        const formattedCats = catsRes.categories.map((c) => ({
          id: c._id || c.id,
          name: c.name,
        }));
        setCategories(formattedCats);
        setMenuCategories(formattedCats);
        if (!formCategoryId && formattedCats[0]) {
          setFormCategoryId(formattedCats[0].id);
        }
      }

      if (itemsRes?.items?.length) {
        const normalized = itemsRes.items.map((it) => ({
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
          stationName: typeof it.stationId === 'object' ? it.stationId?.name : '',
          description: it.description || '',
          variants: it.variants || [],
          addons: it.addons || [],
        }));
        setItems(normalized);
        setMenuItems(normalized);
      } else if (storeMenuItems?.length) {
        setItems(storeMenuItems);
      }
    } catch (_err) {
      if (storeMenuItems?.length) setItems(storeMenuItems);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMenuData();
  }, []);

  // Sync when store items change
  useEffect(() => {
    if (storeMenuItems && storeMenuItems.length > 0) {
      setItems(storeMenuItems);
    }
  }, [storeMenuItems]);

  // Operational Dashboard Metrics
  const dashboardStats = useMemo(() => {
    // 1. Live revenue from settled invoices in POS store
    const invoiceList = Object.values(invoices || {});
    const posRevenuePaise = invoiceList.reduce((sum, inv) => sum + (inv.totalAmountPaise || 0), 0);
    const posInvoiceCount = invoiceList.length;

    // 2. Table occupancy
    const totalTables = tables?.length || 8;
    const occupiedTables = (tables || []).filter((t) => t.status === 'OCCUPIED' || t.status === 'BILLED').length;
    const occupancyRate = totalTables > 0 ? Math.round((occupiedTables / totalTables) * 100) : 0;

    // 3. Active KOTs
    const pendingKots = (kots || []).filter((k) => k.status === 'QUEUED' || k.status === 'PRINTING' || k.status === 'SENT').length;

    // 4. Items breakdown
    const totalItems = items.length;
    const outOfStockItems = items.filter((it) => !it.isAvailable);
    const vegCount = items.filter((it) => it.isVeg).length;
    const nonVegCount = totalItems - vegCount;

    return {
      revenuePaise: posRevenuePaise,
      invoiceCount: posInvoiceCount,
      totalTables,
      occupiedTables,
      occupancyRate,
      pendingKots,
      totalItems,
      outOfStockCount: outOfStockItems.length,
      outOfStockList: outOfStockItems,
      vegCount,
      nonVegCount,
    };
  }, [invoices, tables, kots, items]);

  // Filtered Items for Management List
  const filteredItems = useMemo(() => {
    return items.filter((it) => {
      const matchesSearch =
        it.name.toLowerCase().includes(search.toLowerCase()) ||
        (it.code && it.code.toLowerCase().includes(search.toLowerCase()));

      const matchesCategory = selectedCategory === 'ALL' || it.categoryId === selectedCategory;

      const matchesDiet =
        dietFilter === 'ALL' ||
        (dietFilter === 'VEG' && it.isVeg) ||
        (dietFilter === 'NON_VEG' && !it.isVeg);

      const matchesStock =
        stockFilter === 'ALL' ||
        (stockFilter === 'IN_STOCK' && it.isAvailable) ||
        (stockFilter === 'OUT_OF_STOCK' && !it.isAvailable);

      return matchesSearch && matchesCategory && matchesDiet && matchesStock;
    });
  }, [items, search, selectedCategory, dietFilter, stockFilter]);

  // Open Add Modal
  const handleOpenAddModal = () => {
    setFormName('');
    setFormCode(`ITM-${items.length + 1}`);
    setFormCategoryId(categories[0]?.id || 'cat_1');
    setFormPriceRupees('');
    setFormIsVeg(true);
    setFormStationId(stations[0]?._id || '');
    setFormDescription('');
    setFormVariants([]);
    setFormAddons([]);
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (item) => {
    setItemToEdit(item);
    setFormName(item.name || '');
    setFormCode(item.code || '');
    setFormCategoryId(item.categoryId || categories[0]?.id || 'cat_1');
    setFormPriceRupees(item.basePrice ? (item.basePrice / 100).toString() : '0');
    setFormIsVeg(item.isVeg !== false);
    setFormStationId(item.stationId || '');
    setFormDescription(item.description || '');
    setFormVariants(
      (item.variants || []).map((v, i) => ({
        id: v.id || v._id || `v_${Date.now()}_${i}`,
        name: v.name || '',
        price: v.price !== undefined ? (v.price / 100).toString() : '0',
      }))
    );
    setFormAddons(
      (item.addons || []).map((a, i) => ({
        id: a.id || a._id || `a_${Date.now()}_${i}`,
        name: a.name || '',
        price: a.price !== undefined ? (a.price / 100).toString() : '0',
      }))
    );
    setIsEditModalOpen(true);
  };

  // Open Delete Modal
  const handleOpenDeleteModal = (item) => {
    setItemToDelete(item);
    setIsDeleteModalOpen(true);
  };

  // Submit Add Item
  const handleSaveNewItem = async (e) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const parsedVariants = formVariants
      .filter((v) => v.name.trim() && v.price !== '')
      .map((v, idx) => ({
        id: v.id || `v_${Date.now()}_${idx}`,
        name: v.name.trim(),
        price: Math.round(parseFloat(v.price) * 100),
        isAvailable: true,
      }));

    const parsedAddons = formAddons
      .filter((a) => a.name.trim())
      .map((a, idx) => ({
        id: a.id || `a_${Date.now()}_${idx}`,
        name: a.name.trim(),
        price: a.price ? Math.round(parseFloat(a.price) * 100) : 0,
        isAvailable: true,
      }));

    let pricePaise = 0;
    if (formPriceRupees) {
      pricePaise = Math.round(parseFloat(formPriceRupees) * 100);
    } else if (parsedVariants.length > 0) {
      pricePaise = parsedVariants[0].price;
    }

    const matchedCategory = categories.find((c) => c.id === formCategoryId);
    const matchedStation = stations.find((s) => s._id === formStationId);

    const payload = {
      name: formName.trim(),
      code: formCode.trim() || `ITM-${items.length + 1}`,
      categoryId: formCategoryId || categories[0]?.id || 'cat_1',
      basePrice: pricePaise,
      isVeg: formIsVeg,
      isAvailable: true,
      description: formDescription.trim() || undefined,
      stationId: formStationId || undefined,
      variants: parsedVariants,
      addons: parsedAddons,
    };

    try {
      const res = await apiClient.post('/v1/menu/items', payload);
      const createdItem = res?.item;
      const finalItem = {
        id: createdItem?._id || `it_${Date.now()}`,
        _id: createdItem?._id,
        name: payload.name,
        code: payload.code,
        categoryId: payload.categoryId,
        categoryName: matchedCategory?.name || 'General',
        basePrice: payload.basePrice,
        isVeg: payload.isVeg,
        isAvailable: true,
        stationId: payload.stationId,
        stationName: matchedStation?.name || '',
        description: payload.description || '',
        variants: parsedVariants,
        addons: parsedAddons,
      };

      addMenuItem(finalItem);
      setItems((prev) => [finalItem, ...prev]);
      setIsAddModalOpen(false);
      showNotification(`"${payload.name}" has been added to the menu!`);
    } catch (_err) {
      // Fallback local creation
      const localItem = {
        id: `it_${Date.now()}`,
        name: payload.name,
        code: payload.code,
        categoryId: payload.categoryId,
        categoryName: matchedCategory?.name || 'General',
        basePrice: payload.basePrice,
        isVeg: payload.isVeg,
        isAvailable: true,
        stationId: payload.stationId,
        stationName: matchedStation?.name || '',
        description: payload.description || '',
        variants: parsedVariants,
        addons: parsedAddons,
      };
      addMenuItem(localItem);
      setItems((prev) => [localItem, ...prev]);
      setIsAddModalOpen(false);
      showNotification(`"${payload.name}" added locally.`);
    }
  };

  // Submit Edit Item
  const handleSaveEditItem = async (e) => {
    e.preventDefault();
    if (!itemToEdit || !formName.trim()) return;

    const parsedVariants = formVariants
      .filter((v) => v.name.trim() && v.price !== '')
      .map((v, idx) => ({
        id: v.id || `v_${Date.now()}_${idx}`,
        name: v.name.trim(),
        price: Math.round(parseFloat(v.price) * 100),
        isAvailable: true,
      }));

    const parsedAddons = formAddons
      .filter((a) => a.name.trim())
      .map((a, idx) => ({
        id: a.id || `a_${Date.now()}_${idx}`,
        name: a.name.trim(),
        price: a.price ? Math.round(parseFloat(a.price) * 100) : 0,
        isAvailable: true,
      }));

    let pricePaise = 0;
    if (formPriceRupees) {
      pricePaise = Math.round(parseFloat(formPriceRupees) * 100);
    } else if (parsedVariants.length > 0) {
      pricePaise = parsedVariants[0].price;
    }

    const matchedCategory = categories.find((c) => c.id === formCategoryId);
    const matchedStation = stations.find((s) => s._id === formStationId);

    const payload = {
      name: formName.trim(),
      code: formCode.trim(),
      categoryId: formCategoryId,
      basePrice: pricePaise,
      isVeg: formIsVeg,
      description: formDescription.trim(),
      stationId: formStationId || undefined,
      variants: parsedVariants,
      addons: parsedAddons,
    };

    const targetId = itemToEdit._id || itemToEdit.id;

    try {
      if (itemToEdit._id) {
        await apiClient.put(`/v1/menu/items/${itemToEdit._id}`, payload);
      }
    } catch (_err) {
      // Handled in store
    }

    const updatedData = {
      ...payload,
      categoryName: matchedCategory?.name || itemToEdit.categoryName,
      stationName: matchedStation?.name || '',
      variants: parsedVariants,
      addons: parsedAddons,
    };

    updateMenuItem(targetId, updatedData);
    setItems((prev) =>
      prev.map((it) => (it.id === targetId || it._id === targetId ? { ...it, ...updatedData } : it))
    );
    setIsEditModalOpen(false);
    setItemToEdit(null);
    showNotification(`"${payload.name}" updated successfully.`);
  };

  // Confirm Delete Item
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    const targetId = itemToDelete._id || itemToDelete.id;

    try {
      if (itemToDelete._id) {
        await apiClient.delete(`/v1/menu/items/${itemToDelete._id}`);
      }
    } catch (_err) {
      // Handled in store
    }

    deleteMenuItem(targetId);
    setItems((prev) => prev.filter((it) => it.id !== targetId && it._id !== targetId));
    setIsDeleteModalOpen(false);
    showNotification(`"${itemToDelete.name}" removed from menu.`, 'info');
    setItemToDelete(null);
  };

  // Toggle Stock Availability (86 / Restore)
  const handleToggleStock = async (item) => {
    const targetId = item._id || item.id;
    const newStatus = !item.isAvailable;

    try {
      if (item._id) {
        await apiClient.patch(`/v1/menu/items/${item._id}/availability`, {
          isAvailable: newStatus,
        });
      }
    } catch (_err) {
      // Local fallback
    }

    toggleItemAvailability(targetId);
    setItems((prev) =>
      prev.map((it) => (it.id === targetId || it._id === targetId ? { ...it, isAvailable: newStatus } : it))
    );

    showNotification(
      newStatus
        ? `"${item.name}" restored to stock.`
        : `"${item.name}" marked 86 (Out of Stock).`,
      newStatus ? 'success' : 'warning'
    );
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12 select-none">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold shadow-lg border transition-all animate-in fade-in slide-in-from-top-2 ${notification.type === 'warning'
              ? 'bg-amber-50 text-amber-900 border-amber-300'
              : notification.type === 'info'
                ? 'bg-slate-900 text-white border-slate-800'
                : 'bg-emerald-50 text-emerald-900 border-emerald-300'
            }`}
        >
          {notification.type === 'warning' ? (
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header & Quick Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Manager Control Center</h1>
            <Badge variant="outline" className="text-[11px] font-bold uppercase tracking-wider text-rose-700 bg-rose-50 border-rose-200">
              {user?.role || 'STORE MANAGER'}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time floor summary, revenue tracking, and menu catalog management (Add, Edit, Delete dishes)
          </p>
        </div>

        {/* Tab Switcher & Refresh */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-8 px-2.5 text-xs text-slate-600 border-slate-200 hover:bg-slate-50"
            onClick={loadMenuData}
            disabled={isLoading}
            title="Refresh menu from API"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            Sync
          </Button>

          <Button
            size="sm"
            onClick={handleOpenAddModal}
            className="h-8 px-3 text-xs bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add Menu Item
          </Button>
        </div>
      </div>

      {/* Primary Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('items')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'items'
              ? 'bg-rose-50 text-rose-700 border border-rose-200 shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
        >
          <UtensilsCrossed className="w-4 h-4" />
          Menu Items ({items.length})
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'categories'
              ? 'bg-rose-50 text-rose-700 border border-rose-200 shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
        >
          <Layers className="w-4 h-4" />
          Categories ({categories.length})
        </button>

        <button
          onClick={() => setActiveTab('floors-tables')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'floors-tables'
              ? 'bg-rose-50 text-rose-700 border border-rose-200 shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
        >
          <Grid3X3 className="w-4 h-4" />
          Floors & Tables ({tables.length})
        </button>

        <button
          onClick={() => setActiveTab('day-ops')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'day-ops'
              ? 'bg-rose-50 text-rose-700 border border-rose-200 shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
        >
          <CalendarDays className="w-4 h-4" />
          Day Ops & Register ({dayOps?.status || 'OPEN'})
        </button>

        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'dashboard'
              ? 'bg-rose-50 text-rose-700 border border-rose-200 shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
        >
          <TrendingUp className="w-4 h-4" />
          Manager Overview
        </button>

        <button
          onClick={() => setActiveTab('watchlist')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'watchlist'
              ? 'bg-rose-50 text-rose-700 border border-rose-200 shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
        >
          <AlertCircle className="w-4 h-4" />
          86 Out of Stock ({dashboardStats.outOfStockCount})
        </button>
      </div>

      {/* TAB 1: MANAGER DASHBOARD OVERVIEW */}
      {activeTab === 'dashboard' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-white border-slate-200 shadow-xs">
              <CardContent className="p-4">
                <div className="flex items-center justify-between pb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Today's Revenue</span>
                  <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {formatPaiseToRupees(dashboardStats.revenuePaise)}
                </div>
                <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 font-medium">
                  <Receipt className="w-3.5 h-3.5 text-slate-400" />
                  {dashboardStats.invoiceCount} invoices settled today
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200 shadow-xs">
              <CardContent className="p-4">
                <div className="flex items-center justify-between pb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Floor Occupancy</span>
                  <div className="h-8 w-8 rounded-lg bg-sky-50 text-sky-600 border border-sky-200 flex items-center justify-center">
                    <Grid3X3 className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {dashboardStats.occupancyRate}%
                </div>
                <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 font-medium">
                  {dashboardStats.occupiedTables} of {dashboardStats.totalTables} tables active
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200 shadow-xs">
              <CardContent className="p-4">
                <div className="flex items-center justify-between pb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active KOT Tickets</span>
                  <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
                    <ChefHat className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {dashboardStats.pendingKots}
                </div>
                <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 font-medium">
                  Pending orders in kitchen
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200 shadow-xs">
              <CardContent className="p-4">
                <div className="flex items-center justify-between pb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Menu Catalog</span>
                  <div className="h-8 w-8 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center">
                    <UtensilsCrossed className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {dashboardStats.totalItems} Items
                </div>
                <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-2 font-medium">
                  <span className="text-emerald-700 font-bold">{dashboardStats.vegCount} Veg</span>
                  <span>•</span>
                  <span className="text-rose-700 font-bold">{dashboardStats.nonVegCount} Non-Veg</span>
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Operational Shortcuts */}
          <Card className="bg-white border-slate-200 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-slate-600" />
                Manager Operational Shortcuts
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Button
                  variant="outline"
                  className="h-14 flex flex-col items-center justify-center gap-1 border-slate-200 hover:border-rose-300 hover:bg-rose-50/50"
                  onClick={handleOpenAddModal}
                >
                  <Plus className="w-4 h-4 text-rose-600" />
                  <span className="text-xs font-bold text-slate-800">Add Menu Dish</span>
                </Button>

                <Button
                  variant="outline"
                  className="h-14 flex flex-col items-center justify-center gap-1 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  onClick={() => navigate('/day-ops')}
                >
                  <CalendarDays className="w-4 h-4 text-slate-700" />
                  <span className="text-xs font-bold text-slate-800">Shift & Register</span>
                </Button>

                <Button
                  variant="outline"
                  className="h-14 flex flex-col items-center justify-center gap-1 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  onClick={() => navigate('/reports')}
                >
                  <BarChart3 className="w-4 h-4 text-slate-700" />
                  <span className="text-xs font-bold text-slate-800">Sales Reports</span>
                </Button>

                <Button
                  variant="outline"
                  className="h-14 flex flex-col items-center justify-center gap-1 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  onClick={() => navigate('/tables')}
                >
                  <Grid3X3 className="w-4 h-4 text-slate-700" />
                  <span className="text-xs font-bold text-slate-800">Table Floor View</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Out of Stock Alert Summary */}
          {dashboardStats.outOfStockCount > 0 ? (
            <Card className="bg-amber-50/60 border-amber-200 shadow-xs">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-amber-900 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>86 Out-of-Stock Items Alert ({dashboardStats.outOfStockCount} items)</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs border-amber-300 text-amber-800 hover:bg-amber-100"
                    onClick={() => setActiveTab('watchlist')}
                  >
                    View Watchlist
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-2 pt-2">
                  {dashboardStats.outOfStockList.slice(0, 8).map((it) => (
                    <div
                      key={it.id}
                      className="inline-flex items-center gap-2 px-2.5 py-1 bg-white border border-amber-200 rounded-lg text-xs font-medium text-slate-800"
                    >
                      <span className={`w-2 h-2 rounded-full ${it.isVeg ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      <span>{it.name}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-5 px-1.5 text-[10px] text-emerald-700 hover:bg-emerald-50 font-bold"
                        onClick={() => handleToggleStock(it)}
                      >
                        Restock
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-emerald-50/60 border-emerald-200 shadow-xs">
              <CardContent className="p-4 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-emerald-900">100% In-Stock Catalog</h4>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    All dishes are currently available for ordering on POS & captains' devices.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* TAB 2: CURRENT ITEMS & MANAGEMENT (ADD / EDIT / DELETE) */}
      {activeTab === 'items' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Search & Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search dishes by name or shortcode (e.g. Biryani, STR-01)..."
                  className="pl-9 h-9 text-xs bg-slate-50 border-slate-200 focus:bg-white"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {/* Diet Filter */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                <button
                  onClick={() => setDietFilter('ALL')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${dietFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                    }`}
                >
                  All Food
                </button>
                <button
                  onClick={() => setDietFilter('VEG')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${dietFilter === 'VEG' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600'
                    }`}
                >
                  🟢 Veg
                </button>
                <button
                  onClick={() => setDietFilter('NON_VEG')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${dietFilter === 'NON_VEG' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-600'
                    }`}
                >
                  🔴 Non-Veg
                </button>
              </div>

              {/* Stock Filter */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                <button
                  onClick={() => setStockFilter('ALL')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${stockFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                    }`}
                >
                  All Stock
                </button>
                <button
                  onClick={() => setStockFilter('IN_STOCK')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${stockFilter === 'IN_STOCK' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600'
                    }`}
                >
                  In Stock
                </button>
                <button
                  onClick={() => setStockFilter('OUT_OF_STOCK')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${stockFilter === 'OUT_OF_STOCK' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-600'
                    }`}
                >
                  86 (Out)
                </button>
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
              <button
                onClick={() => setSelectedCategory('ALL')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${selectedCategory === 'ALL'
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : 'text-slate-600 hover:bg-slate-100'
                  }`}
              >
                All Categories ({items.length})
              </button>
              {categories.map((c) => {
                const count = items.filter((it) => it.categoryId === c.id).length;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCategory(c.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${selectedCategory === c.id
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'text-slate-600 hover:bg-slate-100'
                      }`}
                  >
                    {c.name} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Current Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredItems.map((item) => (
              <Card
                key={item.id}
                className={`bg-white border transition-all ${!item.isAvailable
                    ? 'border-dashed border-rose-200 bg-rose-50/20 opacity-80'
                    : 'border-slate-200 hover:border-slate-300 shadow-xs'
                  }`}
              >
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {/* Food Type Indicator */}
                        <span
                          className={`h-3.5 w-3.5 rounded-sm border flex items-center justify-center p-0.5 flex-shrink-0 ${item.isVeg ? 'border-emerald-600' : 'border-rose-600'
                            }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${item.isVeg ? 'bg-emerald-600' : 'bg-rose-600'
                              }`}
                          />
                        </span>
                        <h3 className="font-bold text-sm text-slate-900 leading-tight truncate">
                          {item.name}
                        </h3>
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                        {item.code && (
                          <span className="font-mono bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded text-[10px] font-semibold">
                            {item.code}
                          </span>
                        )}
                        <span>{item.categoryName || 'General'}</span>
                        {item.stationName && (
                          <>
                            <span>•</span>
                            <span className="text-slate-400">{item.stationName}</span>
                          </>
                        )}
                      </div>

                      {item.variants?.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1.5">
                          {item.variants.map((v, i) => (
                            <span key={i} className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-medium">
                              {v.name}: {formatPaiseToRupees(v.price)}
                            </span>
                          ))}
                        </div>
                      )}

                      {item.addons?.length > 0 && (
                        <p className="text-[10px] text-emerald-700 font-medium pt-1">
                          +{item.addons.length} Add-on{item.addons.length > 1 ? 's' : ''} ({item.addons.map((a) => a.name).join(', ')})
                        </p>
                      )}
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="font-black text-sm text-slate-900">
                        {item.variants?.length > 0
                          ? `From ${formatPaiseToRupees(item.variants[0].price)}`
                          : formatPaiseToRupees(item.basePrice)}
                      </span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-4 pt-2 border-t border-slate-100 mt-2 flex items-center justify-between">
                  {/* Status Badge */}
                  <div>
                    {item.isAvailable ? (
                      <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 font-bold">
                        In Stock
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="text-[10px] font-bold">
                        86 Out of Stock
                      </Badge>
                    )}
                  </div>

                  {/* Actions: Toggle Stock, Edit, Delete */}
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      className={`h-7 px-2 text-xs font-semibold ${item.isAvailable
                          ? 'border-slate-200 text-slate-600 hover:text-rose-700 hover:bg-rose-50'
                          : 'border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                        }`}
                      onClick={() => handleToggleStock(item)}
                      title={item.isAvailable ? 'Mark as Out of Stock (86)' : 'Restore to stock'}
                    >
                      {item.isAvailable ? 'Mark 86' : 'Restock'}
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      onClick={() => handleOpenEditModal(item)}
                      title="Edit Item"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-rose-600 hover:text-rose-800 hover:bg-rose-50"
                      onClick={() => handleOpenDeleteModal(item)}
                      title="Delete Item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredItems.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
              <UtensilsCrossed className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-800">No menu items found</h4>
              <p className="text-xs text-slate-500 mt-1">
                Try adjusting your search query or category filters.
              </p>
              <Button
                size="sm"
                onClick={handleOpenAddModal}
                className="mt-3 text-xs bg-rose-600 hover:bg-rose-700 text-white"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add New Dish
              </Button>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: 86 OUT OF STOCK WATCHLIST */}
      {activeTab === 'watchlist' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Out-of-Stock (86) Management Watchlist</h3>
              <p className="text-xs text-slate-500">
                Single-click restock as soon as kitchen supplies or inventory are replenished.
              </p>
            </div>
            <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
              {dashboardStats.outOfStockCount} items currently unavailable
            </span>
          </div>

          {dashboardStats.outOfStockCount === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-800">All items are in stock!</h4>
              <p className="text-xs text-slate-500 mt-1">
                There are no 86 (out-of-stock) items at the moment.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {dashboardStats.outOfStockList.map((item) => (
                <Card key={item.id} className="bg-white border-amber-200 shadow-xs">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`h-3 w-3 rounded-full ${item.isVeg ? 'bg-emerald-500' : 'bg-rose-500'
                              }`}
                          />
                          <h4 className="font-bold text-sm text-slate-900">{item.name}</h4>
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          {item.categoryName} • {formatPaiseToRupees(item.basePrice)}
                        </div>
                      </div>
                      <Badge variant="destructive" className="text-[10px]">
                        86 Out
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-2 border-t border-slate-100 mt-2 flex justify-end">
                    <Button
                      size="sm"
                      className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                      onClick={() => handleToggleStock(item)}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                      Restock to Menu
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: MENU CATEGORIES */}
      {activeTab === 'categories' && (
        <div className="animate-in fade-in duration-200">
          <ManagerCategoriesTab onNotify={showNotification} />
        </div>
      )}

      {/* TAB 5: FLOORS & TABLES */}
      {activeTab === 'floors-tables' && (
        <div className="animate-in fade-in duration-200">
          <ManagerFloorsTablesTab onNotify={showNotification} />
        </div>
      )}

      {/* TAB 6: BUSINESS DAY & CASH FLOAT */}
      {activeTab === 'day-ops' && (
        <div className="animate-in fade-in duration-200">
          <ManagerDayOpsTab onNotify={showNotification} />
        </div>
      )}

      {/* MODAL 1: ADD MENU ITEM */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white border-slate-200 shadow-2xl animate-in zoom-in-95 duration-150">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between sticky top-0 bg-white z-10">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UtensilsCrossed className="w-4 h-4 text-rose-600" />
                Add New Menu Dish
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-slate-400 hover:text-slate-700"
                onClick={() => setIsAddModalOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>

            <form onSubmit={handleSaveNewItem}>
              <CardContent className="p-5 space-y-3.5 text-xs">
                <div>
                  <label className="font-semibold text-slate-700">Dish Name *</label>
                  <Input
                    placeholder="e.g. Mutton Rogan Josh"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    required
                    className="h-9 mt-1 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700">
                      Base Price in Rupees (₹) {formVariants.length > 0 ? '(Optional)' : '*'}
                    </label>
                    <Input
                      type="number"
                      step="any"
                      min="0"
                      placeholder={formVariants.length > 0 ? 'From portion' : 'e.g. 380'}
                      value={formPriceRupees}
                      onChange={(e) => setFormPriceRupees(e.target.value)}
                      required={formVariants.length === 0}
                      className="h-9 mt-1 text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700">Shortcode</label>
                    <Input
                      placeholder="e.g. MAIN-09"
                      value={formCode}
                      onChange={(e) => setFormCode(e.target.value)}
                      className="h-9 mt-1 text-xs"
                    />
                  </div>
                </div>

                {/* Portion / Size Variants (Half Plate / Full Plate) */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-rose-600" />
                        Portion / Size Variants (Half & Full Plate)
                      </span>
                      <p className="text-[11px] text-slate-500">
                        Add portion sizes if dish is served in half/full plates with separate prices.
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {formVariants.length === 0 && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-[11px] font-semibold text-rose-600 border-rose-200 hover:bg-rose-50"
                          onClick={() => {
                            const base = parseFloat(formPriceRupees) || 280;
                            const half = Math.round(base * 0.6);
                            setFormVariants([
                              { id: `v_half_${Date.now()}`, name: 'Half Plate', price: half.toString() },
                              { id: `v_full_${Date.now()}`, name: 'Full Plate', price: base.toString() },
                            ]);
                            if (!formPriceRupees) setFormPriceRupees(base.toString());
                          }}
                        >
                          + Half & Full
                        </Button>
                      )}
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-[11px] font-semibold text-slate-700 border-slate-300 hover:bg-slate-100"
                        onClick={() => {
                          setFormVariants((prev) => [
                            ...prev,
                            { id: `v_${Date.now()}`, name: '', price: '' },
                          ]);
                        }}
                      >
                        + Add Portion
                      </Button>
                    </div>
                  </div>

                  {formVariants.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      {formVariants.map((v, idx) => (
                        <div key={v.id || idx} className="flex items-center gap-2">
                          <Input
                            placeholder="Portion Name (e.g. Half Plate, Full Plate, 4 Pcs)"
                            value={v.name}
                            onChange={(e) => {
                              const next = [...formVariants];
                              next[idx].name = e.target.value;
                              setFormVariants(next);
                            }}
                            className="h-8 text-xs bg-white border-slate-200 flex-1"
                            required
                          />
                          <div className="relative w-28 shrink-0">
                            <span className="absolute left-2.5 top-2 text-slate-400 font-bold text-xs">₹</span>
                            <Input
                              type="number"
                              step="any"
                              min="0"
                              placeholder="Price"
                              value={v.price}
                              onChange={(e) => {
                                const next = [...formVariants];
                                next[idx].price = e.target.value;
                                setFormVariants(next);
                                if (idx === 0 && !formPriceRupees) {
                                  setFormPriceRupees(e.target.value);
                                }
                              }}
                              className="h-8 text-xs bg-white border-slate-200 pl-6 font-bold"
                              required
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 shrink-0"
                            onClick={() => {
                              setFormVariants(formVariants.filter((_, i) => i !== idx));
                            }}
                            title="Remove portion"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Pre-configured Add-ons & Extras */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <Plus className="w-3.5 h-3.5 text-emerald-600" />
                        Pre-configured Add-ons & Extras
                      </span>
                      <p className="text-[11px] text-slate-500">
                        Optional customer add-ons (e.g. Extra Butter, Mint Chutney, Rumali Roti).
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-[11px] font-semibold text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                      onClick={() => {
                        setFormAddons((prev) => [
                          ...prev,
                          { id: `a_${Date.now()}`, name: '', price: '0' },
                        ]);
                      }}
                    >
                      + Add Extra
                    </Button>
                  </div>

                  {formAddons.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      {formAddons.map((a, idx) => (
                        <div key={a.id || idx} className="flex items-center gap-2">
                          <Input
                            placeholder="Add-on Name (e.g. Extra Butter, Mint Chutney)"
                            value={a.name}
                            onChange={(e) => {
                              const next = [...formAddons];
                              next[idx].name = e.target.value;
                              setFormAddons(next);
                            }}
                            className="h-8 text-xs bg-white border-slate-200 flex-1"
                            required
                          />
                          <div className="relative w-28 shrink-0">
                            <span className="absolute left-2.5 top-2 text-slate-400 font-bold text-xs">₹</span>
                            <Input
                              type="number"
                              step="any"
                              min="0"
                              placeholder="Price"
                              value={a.price}
                              onChange={(e) => {
                                const next = [...formAddons];
                                next[idx].price = e.target.value;
                                setFormAddons(next);
                              }}
                              className="h-8 text-xs bg-white border-slate-200 pl-6 font-bold"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 shrink-0"
                            onClick={() => {
                              setFormAddons(formAddons.filter((_, i) => i !== idx));
                            }}
                            title="Remove add-on"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Category *</label>
                  <select
                    className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 mt-1 focus:outline-hidden focus:ring-1 focus:ring-rose-500"
                    value={formCategoryId}
                    onChange={(e) => setFormCategoryId(e.target.value)}
                    required
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3 items-end">
                  <div>
                    <label className="font-semibold text-slate-700">Kitchen Station</label>
                    <select
                      className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 mt-1 focus:outline-hidden focus:ring-1 focus:ring-rose-500"
                      value={formStationId}
                      onChange={(e) => setFormStationId(e.target.value)}
                    >
                      <option value="">Default Kitchen</option>
                      {stations.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block pb-1">Food Diet</label>
                    <div className="flex gap-1.5">
                      <Button
                        type="button"
                        size="sm"
                        variant={formIsVeg ? 'default' : 'outline'}
                        className={`h-9 flex-1 text-xs ${formIsVeg ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'border-slate-200'
                          }`}
                        onClick={() => setFormIsVeg(true)}
                      >
                        🟢 Veg
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={!formIsVeg ? 'default' : 'outline'}
                        className={`h-9 flex-1 text-xs ${!formIsVeg ? 'bg-rose-600 hover:bg-rose-700 text-white' : 'border-slate-200'
                          }`}
                        onClick={() => setFormIsVeg(false)}
                      >
                        🔴 Non-Veg
                      </Button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Description (Optional)</label>
                  <Input
                    placeholder="Short description or preparation note..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="h-9 mt-1 text-xs"
                  />
                </div>
              </CardContent>

              <div className="flex justify-end gap-2 border-t border-slate-100 p-4 bg-slate-50 rounded-b-2xl">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs border-slate-200"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="h-8 text-xs bg-rose-600 hover:bg-rose-700 text-white font-semibold"
                >
                  Save Menu Dish
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* MODAL 2: EDIT MENU ITEM */}
      {isEditModalOpen && itemToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white border-slate-200 shadow-2xl animate-in zoom-in-95 duration-150">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between sticky top-0 bg-white z-10">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-slate-700" />
                Edit Menu Item
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-slate-400 hover:text-slate-700"
                onClick={() => setIsEditModalOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>

            <form onSubmit={handleSaveEditItem}>
              <CardContent className="p-5 space-y-3.5 text-xs">
                <div>
                  <label className="font-semibold text-slate-700">Dish Name *</label>
                  <Input
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    required
                    className="h-9 mt-1 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700">
                      Base Price in Rupees (₹) {formVariants.length > 0 ? '(Optional)' : '*'}
                    </label>
                    <Input
                      type="number"
                      step="any"
                      min="0"
                      value={formPriceRupees}
                      onChange={(e) => setFormPriceRupees(e.target.value)}
                      required={formVariants.length === 0}
                      className="h-9 mt-1 text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700">Shortcode</label>
                    <Input
                      value={formCode}
                      onChange={(e) => setFormCode(e.target.value)}
                      className="h-9 mt-1 text-xs"
                    />
                  </div>
                </div>

                {/* Portion / Size Variants (Half Plate / Full Plate) */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-rose-600" />
                        Portion / Size Variants (Half & Full Plate)
                      </span>
                      <p className="text-[11px] text-slate-500">
                        Configure different plate sizes with their own prices.
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {formVariants.length === 0 && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-[11px] font-semibold text-rose-600 border-rose-200 hover:bg-rose-50"
                          onClick={() => {
                            const base = parseFloat(formPriceRupees) || 280;
                            const half = Math.round(base * 0.6);
                            setFormVariants([
                              { id: `v_half_${Date.now()}`, name: 'Half Plate', price: half.toString() },
                              { id: `v_full_${Date.now()}`, name: 'Full Plate', price: base.toString() },
                            ]);
                          }}
                        >
                          + Half & Full
                        </Button>
                      )}
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-[11px] font-semibold text-slate-700 border-slate-300 hover:bg-slate-100"
                        onClick={() => {
                          setFormVariants((prev) => [
                            ...prev,
                            { id: `v_${Date.now()}`, name: '', price: '' },
                          ]);
                        }}
                      >
                        + Add Portion
                      </Button>
                    </div>
                  </div>

                  {formVariants.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      {formVariants.map((v, idx) => (
                        <div key={v.id || idx} className="flex items-center gap-2">
                          <Input
                            placeholder="Portion Name (e.g. Half Plate, Full Plate, 4 Pcs)"
                            value={v.name}
                            onChange={(e) => {
                              const next = [...formVariants];
                              next[idx].name = e.target.value;
                              setFormVariants(next);
                            }}
                            className="h-8 text-xs bg-white border-slate-200 flex-1"
                            required
                          />
                          <div className="relative w-28 shrink-0">
                            <span className="absolute left-2.5 top-2 text-slate-400 font-bold text-xs">₹</span>
                            <Input
                              type="number"
                              step="any"
                              min="0"
                              placeholder="Price"
                              value={v.price}
                              onChange={(e) => {
                                const next = [...formVariants];
                                next[idx].price = e.target.value;
                                setFormVariants(next);
                              }}
                              className="h-8 text-xs bg-white border-slate-200 pl-6 font-bold"
                              required
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 shrink-0"
                            onClick={() => {
                              setFormVariants(formVariants.filter((_, i) => i !== idx));
                            }}
                            title="Remove portion"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Pre-configured Add-ons & Extras */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <Plus className="w-3.5 h-3.5 text-emerald-600" />
                        Pre-configured Add-ons & Extras
                      </span>
                      <p className="text-[11px] text-slate-500">
                        Optional customer add-ons (e.g. Extra Butter, Mint Chutney, Rumali Roti).
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-[11px] font-semibold text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                      onClick={() => {
                        setFormAddons((prev) => [
                          ...prev,
                          { id: `a_${Date.now()}`, name: '', price: '0' },
                        ]);
                      }}
                    >
                      + Add Extra
                    </Button>
                  </div>

                  {formAddons.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      {formAddons.map((a, idx) => (
                        <div key={a.id || idx} className="flex items-center gap-2">
                          <Input
                            placeholder="Add-on Name (e.g. Extra Butter, Mint Chutney)"
                            value={a.name}
                            onChange={(e) => {
                              const next = [...formAddons];
                              next[idx].name = e.target.value;
                              setFormAddons(next);
                            }}
                            className="h-8 text-xs bg-white border-slate-200 flex-1"
                            required
                          />
                          <div className="relative w-28 shrink-0">
                            <span className="absolute left-2.5 top-2 text-slate-400 font-bold text-xs">₹</span>
                            <Input
                              type="number"
                              step="any"
                              min="0"
                              placeholder="Price"
                              value={a.price}
                              onChange={(e) => {
                                const next = [...formAddons];
                                next[idx].price = e.target.value;
                                setFormAddons(next);
                              }}
                              className="h-8 text-xs bg-white border-slate-200 pl-6 font-bold"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 shrink-0"
                            onClick={() => {
                              setFormAddons(formAddons.filter((_, i) => i !== idx));
                            }}
                            title="Remove add-on"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Category *</label>
                  <select
                    className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 mt-1 focus:outline-hidden focus:ring-1 focus:ring-rose-500"
                    value={formCategoryId}
                    onChange={(e) => setFormCategoryId(e.target.value)}
                    required
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3 items-end">
                  <div>
                    <label className="font-semibold text-slate-700">Kitchen Station</label>
                    <select
                      className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 mt-1 focus:outline-hidden focus:ring-1 focus:ring-rose-500"
                      value={formStationId}
                      onChange={(e) => setFormStationId(e.target.value)}
                    >
                      <option value="">Default Kitchen</option>
                      {stations.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block pb-1">Food Diet</label>
                    <div className="flex gap-1.5">
                      <Button
                        type="button"
                        size="sm"
                        variant={formIsVeg ? 'default' : 'outline'}
                        className={`h-9 flex-1 text-xs ${formIsVeg ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'border-slate-200'
                          }`}
                        onClick={() => setFormIsVeg(true)}
                      >
                        🟢 Veg
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={!formIsVeg ? 'default' : 'outline'}
                        className={`h-9 flex-1 text-xs ${!formIsVeg ? 'bg-rose-600 hover:bg-rose-700 text-white' : 'border-slate-200'
                          }`}
                        onClick={() => setFormIsVeg(false)}
                      >
                        🔴 Non-Veg
                      </Button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Description (Optional)</label>
                  <Input
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="h-9 mt-1 text-xs"
                  />
                </div>
              </CardContent>

              <div className="flex justify-end gap-2 border-t border-slate-100 p-4 bg-slate-50 rounded-b-2xl">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs border-slate-200"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="h-8 text-xs bg-slate-900 hover:bg-slate-800 text-white font-semibold"
                >
                  Update Dish
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* MODAL 3: DELETE CONFIRMATION */}
      {isDeleteModalOpen && itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <Card className="w-full max-w-sm bg-white border-slate-200 shadow-2xl animate-in zoom-in-95 duration-150">
            <CardHeader className="pb-2">
              <div className="h-10 w-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-2 mx-auto">
                <Trash2 className="w-5 h-5" />
              </div>
              <CardTitle className="text-base font-bold text-center text-slate-900">
                Delete Menu Item?
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 text-center text-xs text-slate-600">
              Are you sure you want to permanently delete{' '}
              <strong className="text-slate-900">"{itemToDelete.name}"</strong>?
              This item will be removed from POS screens and the restaurant catalog.
            </CardContent>
            <div className="flex items-center justify-center gap-2 p-4 border-t border-slate-100 mt-2 bg-slate-50 rounded-b-2xl">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs border-slate-200"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="h-8 text-xs bg-rose-600 hover:bg-rose-700 text-white font-semibold"
                onClick={handleConfirmDelete}
              >
                Yes, Delete Item
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
