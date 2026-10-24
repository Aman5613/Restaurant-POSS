import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  ShieldCheck,
  Building2,
  Users,
  Store,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  QrCode,
  Phone,
  Mail,
  MapPin,
  Lock,
  PowerOff,
  X,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

export function SuperAdminPage() {
  const [stats, setStats] = useState({
    totalTenants: 0,
    totalOutlets: 0,
    totalOwners: 0,
    activeOwners: 0,
  });
  const [owners, setOwners] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [notification, setNotification] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const [formData, setFormData] = useState({
    restaurantName: '',
    legalName: '',
    ownerName: '',
    phone: '',
    email: '',
    password: '',
    pin: '',
    upiId: '',
    line1: '',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400050',
  });

  const notify = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, ownersRes] = await Promise.all([
        apiClient.get('/v1/super-admin/stats').catch(() => null),
        apiClient.get('/v1/super-admin/owners').catch(() => null),
      ]);

      const rawStats = statsRes?.data?.data || statsRes?.data?.stats || statsRes?.data;
      if (rawStats && typeof rawStats === 'object' && !Array.isArray(rawStats)) {
        setStats((prev) => ({ ...prev, ...rawStats }));
      }

      const rawOwners = Array.isArray(ownersRes?.data)
        ? ownersRes.data
        : Array.isArray(ownersRes?.data?.data)
        ? ownersRes.data.data
        : Array.isArray(ownersRes?.data?.owners)
        ? ownersRes.data.owners
        : null;

      if (rawOwners && rawOwners.length > 0) {
        setOwners(rawOwners);
      } else {
        setOwners([]);
      }
    } catch (_err) {
      notify('Unable to load super-admin data', 'warning');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleStatus = async (owner) => {
    const ownerId = owner._id || owner.id;
    if (!ownerId) return;
    try {
      const updated = await apiClient.patch(`/v1/super-admin/owners/${ownerId}/status`, {
        isActive: !owner.isActive,
      });
      if (updated?.data) {
        setOwners((prev) =>
          (Array.isArray(prev) ? prev : []).map((o) =>
            o._id === ownerId || o.id === ownerId ? { ...o, isActive: !o.isActive } : o
          )
        );
        notify(`Owner "${owner.name}" status updated to ${!owner.isActive ? 'Active' : 'Suspended'}`);
      }
    } catch (_err) {
      // Local fallback for offline mode
      setOwners((prev) =>
        (Array.isArray(prev) ? prev : []).map((o) =>
          o._id === ownerId || o.id === ownerId ? { ...o, isActive: !o.isActive } : o
        )
      );
      notify(`Status toggled locally for "${owner.name}"`);
    }
  };

  const handleCreateOwner = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.restaurantName.trim() || !formData.ownerName.trim() || !formData.phone.trim()) {
      setFormError('Restaurant Name, Owner Name, and Mobile Phone are required.');
      return;
    }

    if (formData.phone.trim().length < 10) {
      setFormError('Please enter a valid 10-digit phone number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiClient.post('/v1/super-admin/owners', {
        ...formData,
        legalName: formData.legalName || formData.restaurantName,
        password: formData.password || 'Admin@1234',
        pin: formData.pin || '1111',
      });

      if (res?.data) {
        notify(`Restaurant "${formData.restaurantName}" provisioned successfully!`);
        setIsModalOpen(false);
        setFormData({
          restaurantName: '',
          legalName: '',
          ownerName: '',
          phone: '',
          email: '',
          password: '',
          pin: '',
          upiId: '',
          line1: '',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400050',
        });
        loadData();
      }
    } catch (err) {
      setFormError(err.message || 'Failed to create owner account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const ownersList = Array.isArray(owners) ? owners : [];
  const filteredOwners = ownersList.filter((o) => {
    const q = search.toLowerCase();
    const matchQuery =
      o.name?.toLowerCase().includes(q) ||
      o.phone?.includes(q) ||
      o.outlet?.name?.toLowerCase().includes(q) ||
      o.outlet?.upiId?.toLowerCase().includes(q);
    const matchStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && o.isActive) ||
      (statusFilter === 'SUSPENDED' && !o.isActive);
    return matchQuery && matchStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 select-none">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold shadow-lg border animate-in fade-in ${
            notification.type === 'warning'
              ? 'bg-amber-50 text-amber-900 border-amber-300'
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-200">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900">
                  Platform Super-Admin
                </h1>
                <Badge className="bg-indigo-600 text-white text-[10px] uppercase font-bold tracking-wider">
                  Root Control
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Multi-tenant restaurant provisioning, owner credential management, and UPI configurations
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            size="sm"
            variant="outline"
            className="h-9 px-3 text-xs border-slate-200 hover:bg-slate-50"
            onClick={loadData}
            disabled={isLoading}
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            size="sm"
            className="h-9 px-4 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Provision Restaurant Owner
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-xs bg-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase">Tenant Brands</p>
              <p className="text-xl font-black text-slate-900">{stats.totalTenants || 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs bg-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase">Total Outlets</p>
              <p className="text-xl font-black text-slate-900">{stats.totalOutlets || 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs bg-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase">Restaurant Owners</p>
              <p className="text-xl font-black text-slate-900">{stats.totalOwners || 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs bg-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase">Active Accounts</p>
              <p className="text-xl font-black text-emerald-600">{stats.activeOwners || 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border-slate-200 shadow-xs bg-white">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3 justify-between items-center">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by restaurant, owner, phone, or UPI..."
              className="pl-9 h-9 text-xs border-slate-200"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {['ALL', 'ACTIVE', 'SUSPENDED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === st
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Registered Owners Table */}
      <Card className="border-slate-200 shadow-xs overflow-hidden bg-white">
        <CardHeader className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex justify-between items-center">
            <CardTitle className="text-sm font-bold text-slate-900">
              Restaurant Owners Directory ({filteredOwners.length})
            </CardTitle>
            <span className="text-[11px] text-slate-500">
              Linked Tenant & Outlet Profiles
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filteredOwners.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Store className="w-8 h-8 mx-auto mb-2 stroke-1" />
              <p className="text-xs">No restaurant owners match the current filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 font-bold text-slate-700">
                    <th className="py-3 px-4">Restaurant & Outlet</th>
                    <th className="py-3 px-4">Owner Profile</th>
                    <th className="py-3 px-4">UPI Payment ID</th>
                    <th className="py-3 px-4">Address / City</th>
                    <th className="py-3 px-4">Account Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOwners.map((owner, idx) => (
                    <tr key={owner._id || owner.id || `owner-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <Store className="w-3.5 h-3.5 text-indigo-600" />
                          {owner.outlet?.name || owner.tenant?.name || 'Main Restaurant'}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Code: {owner.outlet?.code || 'OUT-01'} • Tenant: {owner.tenant?.name || 'Default Group'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{owner.name}</div>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {owner.phone}
                          </span>
                          {owner.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3 text-slate-400" />
                              {owner.email}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {owner.outlet?.upiId ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 font-mono font-bold text-[11px]">
                            <QrCode className="w-3 h-3 text-emerald-600" />
                            {owner.outlet.upiId}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Not configured</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1 text-[11px] text-slate-700">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {owner.outlet?.address?.city || 'Mumbai'}, {owner.outlet?.address?.state || 'MH'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <Badge
                          variant="outline"
                          className={
                            owner.isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }
                        >
                          {owner.isActive ? 'Active' : 'Suspended'}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleToggleStatus(owner)}
                          className={`h-7 px-2.5 text-[11px] font-semibold border ${
                            owner.isActive
                              ? 'border-rose-200 text-rose-700 hover:bg-rose-50'
                              : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                          }`}
                        >
                          <PowerOff className="w-3 h-3 mr-1" />
                          {owner.isActive ? 'Suspend' : 'Activate'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Provision New Owner Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto no-scrollbar animate-in zoom-in-95">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Provision Restaurant Owner</h3>
                  <p className="text-[11px] text-slate-500">Creates Tenant, Outlet, and Owner Admin Account</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateOwner} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Outlet Branding */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5 text-indigo-600" />
                  Restaurant Information
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Restaurant / Display Name *
                    </label>
                    <Input
                      required
                      placeholder="e.g. Royal Biryani Palace"
                      value={formData.restaurantName}
                      onChange={(e) => setFormData({ ...formData, restaurantName: e.target.value })}
                      className="text-xs h-9"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Legal Business Name
                    </label>
                    <Input
                      placeholder="e.g. Royal Foods Pvt Ltd"
                      value={formData.legalName}
                      onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                      className="text-xs h-9"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    UPI ID for Dynamic QR Payments
                  </label>
                  <div className="relative">
                    <QrCode className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input
                      placeholder="e.g. royalpalace@okhdfcbank"
                      value={formData.upiId}
                      onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                      className="pl-8 text-xs h-9 font-mono"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Used to generate GPay / PhonePe / Paytm scan-and-pay QR on cashier bills
                  </p>
                </div>
              </div>

              {/* Owner Credentials */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-indigo-600" />
                  Owner Administrator Credentials
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Owner Full Name *
                    </label>
                    <Input
                      required
                      placeholder="e.g. Rajesh Kumar"
                      value={formData.ownerName}
                      onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                      className="text-xs h-9"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Mobile Phone (Login) *
                    </label>
                    <Input
                      required
                      type="tel"
                      placeholder="10-digit mobile number"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="text-xs h-9 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Email Address
                    </label>
                    <Input
                      type="email"
                      placeholder="owner@restaurant.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="text-xs h-9"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Password
                    </label>
                    <Input
                      type="password"
                      placeholder="Default: Admin@1234"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="text-xs h-9"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      4-Digit Quick PIN
                    </label>
                    <Input
                      maxLength={4}
                      placeholder="1111"
                      value={formData.pin}
                      onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                      className="text-xs h-9 font-mono text-center tracking-widest font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Location Details */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                  Outlet Location
                </p>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Street Address
                  </label>
                  <Input
                    placeholder="Shop 4, Linking Road"
                    value={formData.line1}
                    onChange={(e) => setFormData({ ...formData, line1: e.target.value })}
                    className="text-xs h-9"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    placeholder="City"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="text-xs h-9"
                  />
                  <Input
                    placeholder="State"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="text-xs h-9"
                  />
                  <Input
                    placeholder="Pincode"
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    className="text-xs h-9 font-mono"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="text-xs h-9"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting}
                  className="text-xs h-9 font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {isSubmitting ? 'Provisioning...' : 'Complete Registration'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default SuperAdminPage;
