import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Grid3X3,
  Plus,
  Edit2,
  Trash2,
  Users,
  Layers,
  Search,
  CheckCircle2,
  AlertTriangle,
  X,
} from 'lucide-react';
import { usePosStore } from '@/stores/pos-store';
import { apiClient } from '@/lib/api-client';
import { TABLE_STATUS } from '@pos/shared';

export function ManagerFloorsTablesTab({ onNotify }) {
  const {
    tables,
    areas,
    addTable,
    updateTable,
    deleteTable,
    addArea,
    updateArea,
    deleteArea,
  } = usePosStore();

  const [selectedAreaFilter, setSelectedAreaFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // Modals
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [isAreaModalOpen, setIsAreaModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [editingTable, setEditingTable] = useState(null);
  const [editingArea, setEditingArea] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null); // { type: 'table' | 'area', item }

  // Form states
  const [tableNumber, setTableNumber] = useState('');
  const [tableName, setTableName] = useState('');
  const [tableAreaId, setTableAreaId] = useState('');
  const [tableCapacity, setTableCapacity] = useState('4');

  const [areaName, setAreaName] = useState('');
  const [areaCode, setAreaCode] = useState('');

  // Open Table Modal
  const handleOpenAddTable = () => {
    setEditingTable(null);
    setTableNumber(`T-${String(tables.length + 1).padStart(2, '0')}`);
    setTableName(`Table ${tables.length + 1}`);
    setTableAreaId(areas[0]?.id || 'area_1');
    setTableCapacity('4');
    setIsTableModalOpen(true);
  };

  const handleOpenEditTable = (tbl) => {
    setEditingTable(tbl);
    setTableNumber(tbl.tableNumber || '');
    setTableName(tbl.name || '');
    setTableAreaId(tbl.areaId || areas[0]?.id || '');
    setTableCapacity(String(tbl.capacity || 4));
    setIsTableModalOpen(true);
  };

  // Save Table
  const handleSaveTable = async (e) => {
    e.preventDefault();
    if (!tableNumber.trim()) return;

    const payload = {
      tableNumber: tableNumber.trim(),
      name: tableName.trim() || `Table ${tableNumber.trim()}`,
      areaId: tableAreaId,
      capacity: parseInt(tableCapacity, 10) || 4,
    };

    if (editingTable) {
      const targetId = editingTable._id || editingTable.id;
      try {
        if (editingTable._id) {
          await apiClient.put(`/v1/tables/${editingTable._id}`, payload);
        }
      } catch (_err) {
        // Fallback local
      }
      updateTable(targetId, payload);
      onNotify(`Table "${payload.tableNumber}" updated successfully!`);
    } else {
      const newTable = {
        id: `tbl_${Date.now()}`,
        ...payload,
        status: TABLE_STATUS.VACANT,
        runningAmount: 0,
        elapsedMinutes: 0,
        currentOrderId: null,
      };
      try {
        const res = await apiClient.post('/v1/tables', payload).catch(() => null);
        if (res?.data?._id) newTable._id = res.data._id;
      } catch (_err) {
        // Fallback local
      }
      addTable(newTable);
      onNotify(`Table "${payload.tableNumber}" added to floor!`);
    }

    setIsTableModalOpen(false);
    setEditingTable(null);
  };

  // Open Area Modal
  const handleOpenAddArea = () => {
    setEditingArea(null);
    setAreaName('');
    setAreaCode('');
    setIsAreaModalOpen(true);
  };

  const handleOpenEditArea = (ar) => {
    setEditingArea(ar);
    setAreaName(ar.name || '');
    setAreaCode(ar.code || '');
    setIsAreaModalOpen(true);
  };

  // Save Area
  const handleSaveArea = async (e) => {
    e.preventDefault();
    if (!areaName.trim()) return;

    const payload = {
      name: areaName.trim(),
      code: areaCode.trim() || areaName.substring(0, 4).toUpperCase(),
    };

    if (editingArea) {
      const targetId = editingArea._id || editingArea.id;
      try {
        if (editingArea._id) {
          await apiClient.put(`/v1/tables/areas/${editingArea._id}`, payload);
        }
      } catch (_err) {
        // Fallback local
      }
      updateArea(targetId, payload);
      onNotify(`Floor "${payload.name}" updated successfully!`);
    } else {
      const newArea = {
        id: `area_${Date.now()}`,
        ...payload,
        sortOrder: areas.length + 1,
      };
      try {
        const res = await apiClient.post('/v1/tables/areas', payload).catch(() => null);
        if (res?.data?._id) newArea._id = res.data._id;
      } catch (_err) {
        // Fallback local
      }
      addArea(newArea);
      onNotify(`Floor area "${payload.name}" created!`);
    }

    setIsAreaModalOpen(false);
    setEditingArea(null);
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    if (itemToDelete.type === 'table') {
      const targetId = itemToDelete.item._id || itemToDelete.item.id;
      try {
        if (itemToDelete.item._id) {
          await apiClient.delete(`/v1/tables/${itemToDelete.item._id}`);
        }
      } catch (_err) {
        // Fallback
      }
      deleteTable(targetId);
      onNotify(`Table "${itemToDelete.item.tableNumber}" removed.`);
    } else if (itemToDelete.type === 'area') {
      const targetId = itemToDelete.item._id || itemToDelete.item.id;
      try {
        if (itemToDelete.item._id) {
          await apiClient.delete(`/v1/tables/areas/${itemToDelete.item._id}`);
        }
      } catch (_err) {
        // Fallback
      }
      deleteArea(targetId);
      onNotify(`Floor area "${itemToDelete.item.name}" removed.`);
    }

    setIsDeleteModalOpen(false);
    setItemToDelete(null);
  };

  const filteredTables = (tables || []).filter((tbl) => {
    const matchesArea = selectedAreaFilter === 'ALL' || tbl.areaId === selectedAreaFilter;
    const matchesSearch =
      (tbl.tableNumber || '').toLowerCase().includes(search.toLowerCase()) ||
      (tbl.name || '').toLowerCase().includes(search.toLowerCase());
    return matchesArea && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Floor Sections Header */}
      <Card className="border-slate-200 shadow-xs bg-white">
        <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-sky-50 text-sky-700">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-slate-900">
                Floor Sections & Dining Areas ({areas.length})
              </CardTitle>
              <p className="text-[11px] text-slate-500">
                Configure dining halls, terrace gardens, rooftops, and private dining rooms
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={handleOpenAddArea}
            className="text-xs h-8 bg-sky-600 hover:bg-sky-700 text-white font-semibold"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add Floor Section
          </Button>
        </CardHeader>

        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {areas.map((ar) => {
              const tableCount = (tables || []).filter((t) => t.areaId === ar.id || t.areaId === ar._id).length;
              return (
                <div
                  key={ar.id || ar._id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between"
                >
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">{ar.name}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Code: <span className="font-mono">{ar.code || 'AREA'}</span> • {tableCount} tables
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleOpenEditArea(ar)}
                      className="h-7 w-7 p-0 text-slate-500 hover:text-slate-900"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setItemToDelete({ type: 'area', item: ar });
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

      {/* Table Management Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search table number or name..."
              className="pl-9 h-8 text-xs border-slate-200"
            />
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setSelectedAreaFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                selectedAreaFilter === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Floors
            </button>
            {areas.map((ar) => (
              <button
                key={ar.id || ar._id}
                onClick={() => setSelectedAreaFilter(ar.id || ar._id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  selectedAreaFilter === (ar.id || ar._id)
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {ar.name}
              </button>
            ))}
          </div>
        </div>

        <Button
          size="sm"
          onClick={handleOpenAddTable}
          className="h-8 px-3 text-xs bg-rose-600 hover:bg-rose-700 text-white font-semibold"
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          Add Table
        </Button>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
        {filteredTables.map((tbl) => {
          const areaObj = areas.find((a) => a.id === tbl.areaId || a._id === tbl.areaId);
          return (
            <Card
              key={tbl.id || tbl._id}
              className="border-slate-200 bg-white hover:border-slate-300 transition-all shadow-xs flex flex-col justify-between"
            >
              <CardHeader className="p-3 pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-base font-black text-slate-900 tracking-tight">
                      {tbl.tableNumber}
                    </h4>
                    <p className="text-[11px] text-slate-500 font-medium truncate max-w-[100px]">
                      {tbl.name || tbl.tableNumber}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-bold bg-slate-50 text-slate-600">
                    <Users className="w-3 h-3 mr-0.5" />
                    {tbl.capacity || 4}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-3 pt-0 space-y-2">
                <div className="text-[10px] text-slate-500 flex items-center justify-between">
                  <span className="font-medium text-slate-600 truncate">{areaObj?.name || 'Main Area'}</span>
                  <span
                    className={`font-bold uppercase text-[9px] px-1.5 py-0.5 rounded ${
                      tbl.status === TABLE_STATUS.OCCUPIED
                        ? 'bg-sky-50 text-sky-700'
                        : tbl.status === TABLE_STATUS.BILLED
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {tbl.status || 'VACANT'}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleOpenEditTable(tbl)}
                    className="h-6 w-6 p-0 text-slate-500 hover:text-slate-900"
                    title="Edit Table"
                  >
                    <Edit2 className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setItemToDelete({ type: 'table', item: tbl });
                      setIsDeleteModalOpen(true);
                    }}
                    className="h-6 w-6 p-0 text-rose-500 hover:text-rose-700"
                    title="Delete Table"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredTables.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <Grid3X3 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-slate-800">No tables found</h4>
          <p className="text-xs text-slate-500 mt-1">Add a new table number or change selected floor filter.</p>
          <Button
            size="sm"
            onClick={handleOpenAddTable}
            className="mt-3 text-xs bg-rose-600 hover:bg-rose-700 text-white"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add Table
          </Button>
        </div>
      )}

      {/* MODAL: ADD / EDIT TABLE */}
      {isTableModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <Card className="w-full max-w-sm bg-white border-slate-200 shadow-2xl animate-in zoom-in-95">
            <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold text-slate-900">
                {editingTable ? 'Edit Table Settings' : 'Add New Floor Table'}
              </CardTitle>
              <button
                onClick={() => setIsTableModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </CardHeader>

            <form onSubmit={handleSaveTable} className="p-4 space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Table Number / Code *
                </label>
                <Input
                  required
                  placeholder="e.g. T-01 or VIP-2"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  className="text-xs h-9 font-bold font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Display Label</label>
                <Input
                  placeholder="e.g. Window Booth"
                  value={tableName}
                  onChange={(e) => setTableName(e.target.value)}
                  className="text-xs h-9"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Floor Section *
                  </label>
                  <select
                    value={tableAreaId}
                    onChange={(e) => setTableAreaId(e.target.value)}
                    className="w-full h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-rose-500"
                  >
                    {areas.map((ar) => (
                      <option key={ar.id || ar._id} value={ar.id || ar._id}>
                        {ar.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Seating Capacity *
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="50"
                    required
                    value={tableCapacity}
                    onChange={(e) => setTableCapacity(e.target.value)}
                    className="text-xs h-9 font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsTableModalOpen(false)}
                  className="text-xs h-8"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="text-xs h-8 bg-rose-600 hover:bg-rose-700 text-white font-bold"
                >
                  {editingTable ? 'Save Changes' : 'Create Table'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* MODAL: ADD / EDIT AREA */}
      {isAreaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <Card className="w-full max-w-sm bg-white border-slate-200 shadow-2xl animate-in zoom-in-95">
            <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold text-slate-900">
                {editingArea ? 'Edit Floor Area' : 'Add Floor Area'}
              </CardTitle>
              <button
                onClick={() => setIsAreaModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </CardHeader>

            <form onSubmit={handleSaveArea} className="p-4 space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Floor / Area Name *
                </label>
                <Input
                  required
                  placeholder="e.g. Terrace Lounge or Bar Counter"
                  value={areaName}
                  onChange={(e) => setAreaName(e.target.value)}
                  className="text-xs h-9"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Area Code</label>
                <Input
                  placeholder="e.g. TERR or BAR"
                  value={areaCode}
                  onChange={(e) => setAreaCode(e.target.value)}
                  className="text-xs h-9 font-mono"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAreaModalOpen(false)}
                  className="text-xs h-8"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="text-xs h-8 bg-sky-600 hover:bg-sky-700 text-white font-bold"
                >
                  {editingArea ? 'Update Floor' : 'Create Floor'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* MODAL: DELETE CONFIRMATION */}
      {isDeleteModalOpen && itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <Card className="w-full max-w-xs bg-white border-slate-200 shadow-2xl animate-in zoom-in-95">
            <CardHeader className="p-4 text-center pb-2">
              <div className="h-10 w-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-2 mx-auto">
                <Trash2 className="w-5 h-5" />
              </div>
              <CardTitle className="text-sm font-bold text-slate-900">
                Delete {itemToDelete.type === 'table' ? 'Table' : 'Floor Section'}?
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 text-center text-xs text-slate-600">
              Are you sure you want to delete{' '}
              <strong className="text-slate-900">
                "{itemToDelete.item.tableNumber || itemToDelete.item.name}"
              </strong>
              ?
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

export default ManagerFloorsTablesTab;
