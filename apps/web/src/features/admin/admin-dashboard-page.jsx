import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  Users,
  Store,
  UserPlus,
  Save,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Phone,
  Mail,
  MapPin,
  Lock,
  ChefHat,
  Receipt,
  Grid3X3,
  ShieldCheck,
  PowerOff,
  Image as ImageIcon,
  KeyRound,
  RefreshCw,
  X,
} from 'lucide-react';
import { ROLES } from '@pos/shared';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';
import { usePosStore } from '@/stores/pos-store';

export function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState('outlet'); // 'outlet' | 'staff'
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState(null);

  // Outlet State
  const [outlet, setOutlet] = useState({
    name: '',
    legalName: '',
    gstin: '',
    fssaiNumber: '',
    logoUrl: '',
    phone: '',
    email: '',
    upiId: '',
    operatingHours: {
      openTime: '09:00',
      closeTime: '23:00',
    },
    address: {
      line1: '',
      city: '',
      state: '',
      stateCode: '27',
      pincode: '',
    },
  });

  // Staff State
  const [staffList, setStaffList] = useState([]);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [staffError, setStaffError] = useState('');

  const [newStaff, setNewStaff] = useState({
    name: '',
    phone: '',
    role: ROLES.CAPTAIN,
    pin: '',
    password: '',
    email: '',
  });

  const notify = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [profileRes, usersRes] = await Promise.all([
        apiClient.get('/v1/outlet/profile').catch(() => null),
        apiClient.get('/v1/users').catch(() => null),
      ]);

      if (profileRes?.data || profileRes?.outlet) {
        const data = profileRes?.data?.outlet || profileRes?.data?.data || profileRes?.data || profileRes?.outlet;
        if (data && typeof data === 'object') {
          setOutlet({
            name: data.name || '',
            legalName: data.legalName || '',
            gstin: data.gstin || '',
            fssaiNumber: data.fssaiNumber || data.fssai || '',
            logoUrl: data.logoUrl || '',
            phone: data.phone || '',
            email: data.email || '',
            upiId: data.upiId || '',
            operatingHours: {
              openTime: data.operatingHours?.openTime || '09:00',
              closeTime: data.operatingHours?.closeTime || '23:00',
            },
            address: {
              line1: data.address?.line1 || '',
              city: data.address?.city || '',
              state: data.address?.state || '',
              stateCode: data.address?.stateCode || '27',
              pincode: data.address?.pincode || '',
            },
          });
        }
      }

      const rawUsers = Array.isArray(usersRes?.data)
        ? usersRes.data
        : Array.isArray(usersRes?.data?.data)
        ? usersRes.data.data
        : Array.isArray(usersRes?.data?.users)
        ? usersRes.data.users
        : Array.isArray(usersRes?.users)
        ? usersRes.users
        : null;

      if (rawUsers && rawUsers.length > 0) {
        setStaffList(rawUsers);
      } else {
        // Fallback default team if API empty
        setStaffList([
          {
            _id: 'usr_man',
            name: 'Rajesh Verma',
            phone: '9777777777',
            role: ROLES.MANAGER,
            isActive: true,
            hasPin: true,
          },
          {
            _id: 'usr_bil',
            name: 'Deepak Sharma',
            phone: '9666666666',
            role: ROLES.BILLER,
            isActive: true,
            hasPin: true,
          },
          {
            _id: 'usr_cap',
            name: 'Sunil Kumar',
            phone: '9555555555',
            role: ROLES.CAPTAIN,
            isActive: true,
            hasPin: true,
          },
          {
            _id: 'usr_coo',
            name: 'Chef Vikas',
            phone: '9444444444',
            role: ROLES.COOK,
            isActive: true,
            hasPin: true,
          },
        ]);
      }
    } catch (_err) {
      notify('Failed to load profile details', 'warning');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveOutlet = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        name: outlet.name?.trim(),
        legalName: outlet.legalName?.trim() || undefined,
        phone: outlet.phone?.trim(),
        email: outlet.email?.trim() || undefined,
        gstin: outlet.gstin?.trim() || undefined,
        fssaiNumber: outlet.fssaiNumber?.trim() || undefined,
        logoUrl: outlet.logoUrl?.trim() || undefined,
        upiId: outlet.upiId?.trim() || undefined,
        operatingHours: {
          openTime: outlet.operatingHours?.openTime || '09:00',
          closeTime: outlet.operatingHours?.closeTime || '23:00',
        },
        address: {
          line1: outlet.address?.line1 || 'Main Street',
          city: outlet.address?.city || 'City',
          state: outlet.address?.state || 'State',
          stateCode: outlet.address?.stateCode || '27',
          pincode: outlet.address?.pincode || '400001',
        },
      };
      const res = await apiClient.put('/v1/outlet/profile', payload);
      const updated = res?.data?.outlet || res?.data || payload;
      notify('Outlet profile and configurations saved successfully!');
      useAuthStore.getState().updateUser({ outletName: updated.name });
      usePosStore.getState().setOutlet(updated);
      loadData();
    } catch (err) {
      notify(err.data?.message || err.message || 'Updated locally (offline mode)', 'info');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegisterStaff = async (e) => {
    e.preventDefault();
    setStaffError('');

    if (!newStaff.name.trim() || !newStaff.phone.trim()) {
      setStaffError('Staff Name and Mobile Phone are required.');
      return;
    }

    if (newStaff.phone.trim().length < 10) {
      setStaffError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setIsAddingStaff(true);
    try {
      const payload = {
        name: newStaff.name.trim(),
        phone: newStaff.phone.trim(),
        role: newStaff.role,
        email: newStaff.email.trim() || undefined,
        pin: newStaff.pin || undefined,
        password: newStaff.password || 'Staff@1234',
      };

      const res = await apiClient.post('/v1/users', payload);
      const created = res?.data || {
        _id: `usr_${Date.now()}`,
        ...payload,
        isActive: true,
        hasPin: Boolean(newStaff.pin),
      };

      setStaffList((prev) => [created, ...prev]);
      notify(`Staff member "${newStaff.name}" registered successfully!`);
      setIsStaffModalOpen(false);
      setNewStaff({
        name: '',
        phone: '',
        role: ROLES.CAPTAIN,
        pin: '',
        password: '',
        email: '',
      });
    } catch (err) {
      setStaffError(err.message || 'Failed to register team member');
    } finally {
      setIsAddingStaff(false);
    }
  };

  const handleToggleStaffStatus = async (staffMember) => {
    const targetId = staffMember._id || staffMember.id;
    const newStatus = !staffMember.isActive;

    try {
      await apiClient.put(`/v1/users/${targetId}`, { isActive: newStatus });
    } catch (_err) {
      // Local fallback
    }

    setStaffList((prev) =>
      prev.map((s) => (s._id === targetId || s.id === targetId ? { ...s, isActive: newStatus } : s))
    );
    notify(`"${staffMember.name}" marked ${newStatus ? 'Active' : 'Inactive'}`);
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case ROLES.MANAGER:
        return <Badge className="bg-purple-50 text-purple-700 border-purple-200">Manager</Badge>;
      case ROLES.BILLER:
        return <Badge className="bg-blue-50 text-blue-700 border-blue-200">Biller</Badge>;
      case ROLES.CAPTAIN:
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Captain</Badge>;
      case ROLES.COOK:
        return <Badge className="bg-amber-50 text-amber-700 border-amber-200">Chef / Cook</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 select-none">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold shadow-lg border animate-in fade-in ${
            notification.type === 'warning'
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-50 text-rose-700 rounded-xl border border-rose-200">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900">
                  {outlet.name || 'Restaurant Owner Hub'}
                </h1>
                <Badge className="bg-rose-600 text-white text-[10px] uppercase font-bold tracking-wider">
                  Owner Admin
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage restaurant profile, logo, UPI QR payment IDs, and provision staff (Manager, Biller, Captain, Cook)
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-9 px-3 text-xs border-slate-200 hover:bg-slate-50"
            onClick={loadData}
            disabled={isLoading}
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            Sync
          </Button>

          {activeTab === 'staff' && (
            <Button
              size="sm"
              className="h-9 px-4 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
              onClick={() => setIsStaffModalOpen(true)}
            >
              <UserPlus className="w-4 h-4 mr-1.5" />
              Register Staff
            </Button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('outlet')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'outlet'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Restaurant Profile & UPI Payments
        </button>

        <button
          onClick={() => setActiveTab('staff')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'staff'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          Staff & Role Provisioning ({staffList.length})
        </button>
      </div>

      {/* Tab 1: Outlet Profile & Branding */}
      {activeTab === 'outlet' && (
        <form onSubmit={handleSaveOutlet} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Form Fields */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-slate-200 shadow-xs bg-white">
                <CardHeader className="p-4 border-b border-slate-100">
                  <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Store className="w-4 h-4 text-rose-600" />
                    Branding & Legal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Restaurant Display Name *
                      </label>
                      <Input
                        required
                        value={outlet.name}
                        onChange={(e) => setOutlet({ ...outlet, name: e.target.value })}
                        placeholder="e.g. Spice Garden — Bandra West"
                        className="text-xs h-9"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Legal Business Name
                      </label>
                      <Input
                        value={outlet.legalName}
                        onChange={(e) => setOutlet({ ...outlet, legalName: e.target.value })}
                        placeholder="e.g. Spice Garden Hospitality Pvt Ltd"
                        className="text-xs h-9"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        GSTIN (15 Digits)
                      </label>
                      <Input
                        value={outlet.gstin}
                        onChange={(e) => setOutlet({ ...outlet, gstin: e.target.value.toUpperCase() })}
                        placeholder="27AAAAA0000A1Z5"
                        maxLength={15}
                        className="text-xs h-9 font-mono uppercase"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        FSSAI License (14 Digits)
                      </label>
                      <Input
                        value={outlet.fssaiNumber}
                        onChange={(e) => setOutlet({ ...outlet, fssaiNumber: e.target.value })}
                        placeholder="11521034000123"
                        maxLength={14}
                        className="text-xs h-9 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Opening Time
                      </label>
                      <Input
                        type="time"
                        value={outlet.operatingHours?.openTime || '09:00'}
                        onChange={(e) =>
                          setOutlet({
                            ...outlet,
                            operatingHours: { ...outlet.operatingHours, openTime: e.target.value },
                          })
                        }
                        className="text-xs h-9 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Closing Time
                      </label>
                      <Input
                        type="time"
                        value={outlet.operatingHours?.closeTime || '23:00'}
                        onChange={(e) =>
                          setOutlet({
                            ...outlet,
                            operatingHours: { ...outlet.operatingHours, closeTime: e.target.value },
                          })
                        }
                        className="text-xs h-9 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Logo URL (Image Link)
                    </label>
                    <div className="flex gap-2">
                      <Input
                        value={outlet.logoUrl}
                        onChange={(e) => setOutlet({ ...outlet, logoUrl: e.target.value })}
                        placeholder="https://example.com/logo.png"
                        className="text-xs h-9"
                      />
                      {outlet.logoUrl && (
                        <div className="h-9 w-9 rounded-lg border border-slate-200 overflow-hidden flex-shrink-0 bg-slate-50 flex items-center justify-center">
                          <img
                            src={outlet.logoUrl}
                            alt="Logo preview"
                            className="h-full w-full object-cover"
                            onError={(e) => (e.target.style.display = 'none')}
                          />
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Appears on printable customer receipts and order screens
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Dynamic UPI & Payment Settings */}
              <Card className="border-slate-200 shadow-xs bg-white">
                <CardHeader className="p-4 border-b border-slate-100">
                  <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-emerald-600" />
                    UPI ID & Dynamic QR Payment Gateway
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Restaurant UPI Virtual Payment Address (VPA) *
                    </label>
                    <div className="relative">
                      <QrCode className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <Input
                        required
                        value={outlet.upiId}
                        onChange={(e) => setOutlet({ ...outlet, upiId: e.target.value })}
                        placeholder="e.g. spicegarden@okaxis or 9876543210@upi"
                        className="pl-9 text-xs h-9 font-mono font-bold text-emerald-700"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1.5">
                      Bills generated at cashier counter embed this UPI ID with order exact total into a dynamic QR code. Customers can scan via Google Pay, PhonePe, Paytm, or BHIM.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Contact & Address */}
              <Card className="border-slate-200 shadow-xs bg-white">
                <CardHeader className="p-4 border-b border-slate-100">
                  <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-indigo-600" />
                    Contact & Physical Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Contact Phone Number
                      </label>
                      <Input
                        value={outlet.phone}
                        onChange={(e) => setOutlet({ ...outlet, phone: e.target.value })}
                        className="text-xs h-9 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Support Email
                      </label>
                      <Input
                        type="email"
                        value={outlet.email}
                        onChange={(e) => setOutlet({ ...outlet, email: e.target.value })}
                        className="text-xs h-9"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Street Address
                    </label>
                    <Input
                      value={outlet.address.line1}
                      onChange={(e) =>
                        setOutlet({ ...outlet, address: { ...outlet.address, line1: e.target.value } })
                      }
                      className="text-xs h-9"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">City</label>
                      <Input
                        value={outlet.address.city}
                        onChange={(e) =>
                          setOutlet({ ...outlet, address: { ...outlet.address, city: e.target.value } })
                        }
                        className="text-xs h-9"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">State</label>
                      <Input
                        value={outlet.address.state}
                        onChange={(e) =>
                          setOutlet({ ...outlet, address: { ...outlet.address, state: e.target.value } })
                        }
                        className="text-xs h-9"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Pincode</label>
                      <Input
                        value={outlet.address.pincode}
                        onChange={(e) =>
                          setOutlet({ ...outlet, address: { ...outlet.address, pincode: e.target.value } })
                        }
                        className="text-xs h-9 font-mono"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold h-10 px-6 text-xs shadow-xs"
                >
                  <Save className="w-4 h-4 mr-1.5" />
                  {isSaving ? 'Saving Changes...' : 'Save Outlet Configurations'}
                </Button>
              </div>
            </div>

            {/* Right 1 Col: Live Invoice / UPI Preview */}
            <div className="space-y-4">
              <Card className="border-slate-200 shadow-xs bg-slate-50/50 sticky top-6">
                <CardHeader className="p-4 border-b border-slate-200/60">
                  <CardTitle className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Receipt Header Preview
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 text-center space-y-2">
                  <div className="w-12 h-12 mx-auto rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xl shadow-xs">
                    {outlet.logoUrl ? (
                      <img src={outlet.logoUrl} alt="Logo" className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      '🍽️'
                    )}
                  </div>
                  <h3 className="font-bold text-slate-900 text-base">{outlet.name || 'Restaurant Name'}</h3>
                  <p className="text-[11px] text-slate-500 font-medium">{outlet.legalName}</p>
                  <p className="text-[11px] text-slate-500">
                    {outlet.address.line1}, {outlet.address.city} - {outlet.address.pincode}
                  </p>
                  <p className="text-[11px] text-slate-500">Ph: {outlet.phone}</p>

                  <div className="pt-4 border-t border-dashed border-slate-300 mt-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                      Scan & Pay UPI QR
                    </p>
                    <div className="p-3 bg-white border border-slate-200 rounded-xl inline-block shadow-xs">
                      {outlet.upiId ? (
                        <div className="space-y-1">
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=upi://pay?pa=${encodeURIComponent(
                              outlet.upiId
                            )}%26pn=${encodeURIComponent(outlet.name || 'Restaurant')}`}
                            alt="UPI QR Preview"
                            className="w-32 h-32 mx-auto"
                          />
                          <p className="text-[10px] font-mono font-bold text-slate-600 truncate max-w-[140px]">
                            {outlet.upiId}
                          </p>
                        </div>
                      ) : (
                        <div className="w-32 h-32 flex items-center justify-center text-slate-400 text-xs">
                          Configure UPI ID
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      )}

      {/* Tab 2: Staff Provisioning */}
      {activeTab === 'staff' && (
        <div className="space-y-6">
          {/* Quick Stats on Roles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="border-slate-200 shadow-xs bg-white p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-50 text-purple-700">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-500">Managers</p>
                <p className="text-xl font-bold text-slate-900">
                  {staffList.filter((s) => s.role === ROLES.MANAGER).length}
                </p>
              </div>
            </Card>

            <Card className="border-slate-200 shadow-xs bg-white p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-500">Billers / Cashiers</p>
                <p className="text-xl font-bold text-slate-900">
                  {staffList.filter((s) => s.role === ROLES.BILLER).length}
                </p>
              </div>
            </Card>

            <Card className="border-slate-200 shadow-xs bg-white p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
                <Grid3X3 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-500">Captains</p>
                <p className="text-xl font-bold text-slate-900">
                  {staffList.filter((s) => s.role === ROLES.CAPTAIN).length}
                </p>
              </div>
            </Card>

            <Card className="border-slate-200 shadow-xs bg-white p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700">
                <ChefHat className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-500">Kitchen Cooks</p>
                <p className="text-xl font-bold text-slate-900">
                  {staffList.filter((s) => s.role === ROLES.COOK).length}
                </p>
              </div>
            </Card>
          </div>

          {/* Staff Table */}
          <Card className="border-slate-200 shadow-xs overflow-hidden bg-white">
            <CardHeader className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900">Outlet Staff Directory</CardTitle>
                <p className="text-[11px] text-slate-500">
                  Team members authorized for order punching, billing, day ops, and kitchen KOT queue
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => setIsStaffModalOpen(true)}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs h-8"
              >
                <UserPlus className="w-3.5 h-3.5 mr-1" />
                Add Staff Member
              </Button>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600 border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 font-bold text-slate-700">
                      <th className="py-3 px-4">Staff Member</th>
                      <th className="py-3 px-4">Contact Phone</th>
                      <th className="py-3 px-4">Assigned Role</th>
                      <th className="py-3 px-4">4-Digit PIN</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {staffList.map((member) => (
                      <tr key={member._id || member.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{member.name}</div>
                          {member.email && (
                            <div className="text-[11px] text-slate-400">{member.email}</div>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono font-medium text-slate-700">
                          {member.phone}
                        </td>
                        <td className="py-3 px-4">{getRoleBadge(member.role)}</td>
                        <td className="py-3 px-4">
                          {member.hasPin !== false ? (
                            <Badge variant="outline" className="font-mono text-[10px] bg-slate-50 text-slate-600">
                              <KeyRound className="w-3 h-3 mr-1 text-slate-400" />
                              Configured
                            </Badge>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">No PIN</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            variant="outline"
                            className={
                              member.isActive !== false
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }
                          >
                            {member.isActive !== false ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleToggleStaffStatus(member)}
                            className={`h-7 px-2.5 text-[11px] font-semibold border ${
                              member.isActive !== false
                                ? 'border-rose-200 text-rose-700 hover:bg-rose-50'
                                : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                            }`}
                          >
                            <PowerOff className="w-3 h-3 mr-1" />
                            {member.isActive !== false ? 'Deactivate' : 'Activate'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Register Staff Modal */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md animate-in zoom-in-95">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-rose-50 text-rose-600">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Register Team Member</h3>
                  <p className="text-[11px] text-slate-500">Create login credentials and fast 4-digit PIN</p>
                </div>
              </div>
              <button
                onClick={() => setIsStaffModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRegisterStaff} className="p-4 space-y-3.5">
              {staffError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{staffError}</span>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Full Name *</label>
                <Input
                  required
                  placeholder="e.g. Vikas Patel"
                  value={newStaff.name}
                  onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                  className="text-xs h-9"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Mobile Phone *
                  </label>
                  <Input
                    required
                    type="tel"
                    placeholder="10-digit mobile"
                    value={newStaff.phone}
                    onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                    className="text-xs h-9 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Role *</label>
                  <select
                    value={newStaff.role}
                    onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                    className="w-full h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                  >
                    <option value={ROLES.MANAGER}>Manager (Day ops & menu)</option>
                    <option value={ROLES.BILLER}>Biller (Counter & settlement)</option>
                    <option value={ROLES.CAPTAIN}>Captain (Floor orders)</option>
                    <option value={ROLES.COOK}>Cook / Kitchen Chef (KOT Queue)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    4-Digit Fast PIN
                  </label>
                  <Input
                    maxLength={4}
                    placeholder="e.g. 5555"
                    value={newStaff.pin}
                    onChange={(e) => setNewStaff({ ...newStaff, pin: e.target.value })}
                    className="text-xs h-9 font-mono text-center tracking-widest font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Password (Optional)
                  </label>
                  <Input
                    type="password"
                    placeholder="Staff@1234"
                    value={newStaff.password}
                    onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                    className="text-xs h-9"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Email Address (Optional)
                </label>
                <Input
                  type="email"
                  placeholder="staff@restaurant.com"
                  value={newStaff.email}
                  onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                  className="text-xs h-9"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsStaffModalOpen(false)}
                  disabled={isAddingStaff}
                  className="text-xs h-8"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isAddingStaff}
                  className="text-xs h-8 font-bold bg-rose-600 hover:bg-rose-700 text-white"
                >
                  {isAddingStaff ? 'Registering...' : 'Register Member'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboardPage;
