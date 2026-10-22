import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Building,
  Percent,
  Receipt,
  Printer,
  Smartphone,
  CreditCard,
  Hash,
  Save,
  Check,
  Plus,
  Trash2,
  RefreshCw,
  AlertCircle,
  Loader2,
  X,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

export function OutletSettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState(null);
  const [error, setError] = useState(null);

  // Real data states from API
  const [profile, setProfile] = useState({
    name: '',
    legalName: '',
    gstin: '',
    fssaiNumber: '',
    phone: '',
    email: '',
    upiId: '',
    line1: '',
    city: '',
    state: '',
    stateCode: '27',
    pincode: '',
  });

  const [taxGroups, setTaxGroups] = useState([]);
  const [charges, setCharges] = useState([]);
  const [numberingSeries, setNumberingSeries] = useState([]);
  const [printers, setPrinters] = useState([]);
  const [devices, setDevices] = useState([]);
  const [paymentModes, setPaymentModes] = useState([]);

  // Modals
  const [isAddTaxModalOpen, setIsAddTaxModalOpen] = useState(false);
  const [newTax, setNewTax] = useState({ name: '', rate: 5, isInclusive: true });

  const [isAddChargeModalOpen, setIsAddChargeModalOpen] = useState(false);
  const [newCharge, setNewCharge] = useState({
    name: '',
    type: 'SERVICE',
    rate: 5,
    isPercentage: true,
  });

  const [isAddPrinterModalOpen, setIsAddPrinterModalOpen] = useState(false);
  const [newPrinter, setNewPrinter] = useState({
    name: '',
    connectionType: 'NETWORK',
    ipAddress: '',
    port: 9100,
    paperWidth: '80mm',
    isReceiptPrinter: true,
    isKotPrinter: false,
  });

  const [isAddDeviceModalOpen, setIsAddDeviceModalOpen] = useState(false);
  const [newDevice, setNewDevice] = useState({
    name: '',
    deviceCode: '',
    deviceType: 'COUNTER_POS',
  });

  const notify = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // Fetch all real outlet configuration in parallel
  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [
        profileRes,
        taxesRes,
        chargesRes,
        seriesRes,
        printersRes,
        devicesRes,
        modesRes,
      ] = await Promise.all([
        apiClient.get('/v1/outlet/profile').catch(() => null),
        apiClient.get('/v1/outlet/tax-groups').catch(() => null),
        apiClient.get('/v1/outlet/charges').catch(() => null),
        apiClient.get('/v1/outlet/numbering-series').catch(() => null),
        apiClient.get('/v1/outlet/printers').catch(() => null),
        apiClient.get('/v1/outlet/devices').catch(() => null),
        apiClient.get('/v1/outlet/payment-modes').catch(() => null),
      ]);

      if (profileRes?.data?.outlet || profileRes?.data) {
        const o = profileRes.data.outlet || profileRes.data;
        setProfile({
          name: o.name || '',
          legalName: o.legalName || '',
          gstin: o.gstin || '',
          fssaiNumber: o.fssaiNumber || '',
          phone: o.phone || '',
          email: o.email || '',
          upiId: o.upiId || '',
          line1: o.address?.line1 || '',
          city: o.address?.city || '',
          state: o.address?.state || '',
          stateCode: o.address?.stateCode || '27',
          pincode: o.address?.pincode || '',
        });
      }

      setTaxGroups(
        Array.isArray(taxesRes?.data?.taxes)
          ? taxesRes.data.taxes
          : Array.isArray(taxesRes?.data)
          ? taxesRes.data
          : []
      );

      setCharges(
        Array.isArray(chargesRes?.data?.charges)
          ? chargesRes.data.charges
          : Array.isArray(chargesRes?.data)
          ? chargesRes.data
          : []
      );

      setNumberingSeries(
        Array.isArray(seriesRes?.data?.series)
          ? seriesRes.data.series
          : Array.isArray(seriesRes?.data)
          ? seriesRes.data
          : []
      );

      setPrinters(
        Array.isArray(printersRes?.data?.printers)
          ? printersRes.data.printers
          : Array.isArray(printersRes?.data)
          ? printersRes.data
          : []
      );

      setDevices(
        Array.isArray(devicesRes?.data?.devices)
          ? devicesRes.data.devices
          : Array.isArray(devicesRes?.data)
          ? devicesRes.data
          : []
      );

      setPaymentModes(
        Array.isArray(modesRes?.data?.paymentModes)
          ? modesRes.data.paymentModes
          : Array.isArray(modesRes?.data)
          ? modesRes.data
          : []
      );
    } catch (err) {
      setError(err.message || 'Failed to fetch outlet configuration from server.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Save Profile via API
  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        name: profile.name.trim(),
        legalName: profile.legalName.trim() || undefined,
        phone: profile.phone.trim(),
        email: profile.email.trim() || undefined,
        gstin: profile.gstin.trim() || undefined,
        fssaiNumber: profile.fssaiNumber.trim() || undefined,
        upiId: profile.upiId.trim() || undefined,
        address: {
          line1: profile.line1?.trim() || 'Main Road',
          city: profile.city?.trim() || 'City',
          state: profile.state?.trim() || 'State',
          stateCode: profile.stateCode?.trim() || '27',
          pincode: profile.pincode?.trim() || '400001',
        },
      };

      await apiClient.put('/v1/outlet/profile', payload);
      notify('Outlet profile updated successfully in database!');
    } catch (err) {
      notify(err.data?.message || err.message || 'Failed to update profile.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Tax Group Actions
  const handleCreateTaxGroup = async (e) => {
    e.preventDefault();
    try {
      const rateNum = Number(newTax.rate) || 0;
      const payload = {
        name: newTax.name.trim(),
        rate: rateNum,
        isInclusive: Boolean(newTax.isInclusive),
        cgstRate: rateNum / 2,
        sgstRate: rateNum / 2,
        igstRate: rateNum,
        isActive: true,
      };
      await apiClient.post('/v1/outlet/tax-groups', payload);
      notify(`Tax group "${newTax.name}" created!`);
      setIsAddTaxModalOpen(false);
      setNewTax({ name: '', rate: 5, isInclusive: true });
      fetchAllData();
    } catch (err) {
      notify(err.data?.message || err.message || 'Failed to add tax slab.', 'error');
    }
  };

  const handleDeleteTaxGroup = async (id, name) => {
    try {
      await apiClient.delete(`/v1/outlet/tax-groups/${id}`);
      notify(`Tax slab "${name}" removed.`);
      setTaxGroups((prev) => prev.filter((t) => (t._id || t.id) !== id));
    } catch (err) {
      notify(err.data?.message || err.message || 'Could not delete tax slab.', 'error');
    }
  };

  // Charge Actions
  const handleCreateCharge = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: newCharge.name.trim(),
        type: newCharge.type,
        rate: Number(newCharge.rate) || 0,
        isPercentage: Boolean(newCharge.isPercentage),
        applicableOrderTypes: ['DINE_IN', 'TAKEAWAY', 'DELIVERY'],
        isActive: true,
      };
      await apiClient.post('/v1/outlet/charges', payload);
      notify(`Charge "${newCharge.name}" configured!`);
      setIsAddChargeModalOpen(false);
      setNewCharge({ name: '', type: 'SERVICE', rate: 5, isPercentage: true });
      fetchAllData();
    } catch (err) {
      notify(err.data?.message || err.message || 'Failed to add charge.', 'error');
    }
  };

  const handleDeleteCharge = async (id, name) => {
    try {
      await apiClient.delete(`/v1/outlet/charges/${id}`);
      notify(`Charge "${name}" removed.`);
      setCharges((prev) => prev.filter((c) => (c._id || c.id) !== id));
    } catch (err) {
      notify(err.data?.message || err.message || 'Could not delete charge.', 'error');
    }
  };

  // Printer Actions
  const handleCreatePrinter = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: newPrinter.name.trim(),
        connectionType: newPrinter.connectionType,
        ipAddress: newPrinter.ipAddress.trim() || undefined,
        port: Number(newPrinter.port) || 9100,
        paperWidth: newPrinter.paperWidth,
        isReceiptPrinter: Boolean(newPrinter.isReceiptPrinter),
        isKotPrinter: Boolean(newPrinter.isKotPrinter),
        isActive: true,
      };
      await apiClient.post('/v1/outlet/printers', payload);
      notify(`Printer "${newPrinter.name}" registered!`);
      setIsAddPrinterModalOpen(false);
      setNewPrinter({
        name: '',
        connectionType: 'NETWORK',
        ipAddress: '',
        port: 9100,
        paperWidth: '80mm',
        isReceiptPrinter: true,
        isKotPrinter: false,
      });
      fetchAllData();
    } catch (err) {
      notify(err.data?.message || err.message || 'Failed to register printer.', 'error');
    }
  };

  const handleTestPrint = async (printerId, printerName) => {
    try {
      await apiClient.post(`/v1/outlet/printers/${printerId}/test`);
      notify(`Test print command sent to ${printerName}!`);
    } catch (err) {
      notify(err.data?.message || err.message || 'Test print dispatch failed.', 'error');
    }
  };

  // Device Actions
  const handleRegisterDevice = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: newDevice.name.trim(),
        deviceCode: newDevice.deviceCode.trim().toUpperCase(),
        deviceType: newDevice.deviceType,
        isActive: true,
      };
      await apiClient.post('/v1/outlet/devices', payload);
      notify(`Terminal "${newDevice.name}" registered!`);
      setIsAddDeviceModalOpen(false);
      setNewDevice({ name: '', deviceCode: '', deviceType: 'COUNTER_POS' });
      fetchAllData();
    } catch (err) {
      notify(err.data?.message || err.message || 'Failed to register device.', 'error');
    }
  };

  // Toggle Payment Mode
  const handleTogglePaymentMode = async (mode) => {
    const modeId = mode._id || mode.id;
    const newStatus = !mode.isEnabled;
    try {
      await apiClient.put(`/v1/outlet/payment-modes/${modeId}`, { isEnabled: newStatus });
      notify(`Payment mode "${mode.name}" ${newStatus ? 'enabled' : 'disabled'}.`);
      setPaymentModes((prev) =>
        prev.map((m) => ((m._id || m.id) === modeId ? { ...m, isEnabled: newStatus } : m))
      );
    } catch (err) {
      notify(err.data?.message || err.message || 'Failed to update payment mode.', 'error');
    }
  };

  const tabs = [
    { id: 'profile', name: 'Outlet Profile', icon: Building },
    { id: 'taxes', name: 'GST Slabs', icon: Percent },
    { id: 'charges', name: 'Charges', icon: Receipt },
    { id: 'numbering', name: 'Series & Codes', icon: Hash },
    { id: 'printers', name: 'Printers', icon: Printer },
    { id: 'devices', name: 'Terminals', icon: Smartphone },
    { id: 'payments', name: 'Payment Modes', icon: CreditCard },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold shadow-lg border animate-in fade-in ${
            notification.type === 'error'
              ? 'bg-rose-50 text-rose-900 border-rose-300'
              : 'bg-emerald-50 text-emerald-900 border-emerald-300'
          }`}
        >
          {notification.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          ) : (
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          )}
          <span>{notification.msg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Outlet Administration</h1>
          <p className="text-sm text-slate-500">
            Real store configuration, tax rules, hardware registries, and business parameters
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAllData}
            disabled={isLoading}
            className="text-xs h-9"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          {activeTab === 'profile' && (
            <Button
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 font-semibold"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5 mr-1.5" />
                  Save Configuration
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between font-medium">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <Button size="sm" variant="outline" onClick={fetchAllData} className="text-xs h-7">
            Retry
          </Button>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-2 pb-px">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold whitespace-nowrap border-b-2 transition-all ${
              activeTab === t.id
                ? 'border-rose-600 text-rose-700 bg-rose-50/50 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.name}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-slate-500 space-y-2">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-rose-600" />
          <p className="text-xs font-semibold">Loading real outlet settings from API...</p>
        </div>
      ) : (
        <>
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <Card className="border-slate-200 shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-base font-bold text-slate-900">Store Legal Details & Registrations</CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Data printed on customer tax invoices, bill slips, and KOT tickets
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-5">
                <div>
                  <label className="text-xs font-bold text-slate-700">Trade / Brand Name *</label>
                  <Input
                    value={profile.name}
                    placeholder="e.g. Spice Garden"
                    className="text-xs h-9 mt-1"
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Legal Company Name</label>
                  <Input
                    value={profile.legalName}
                    placeholder="e.g. Spice Garden F&B Pvt Ltd"
                    className="text-xs h-9 mt-1"
                    onChange={(e) => setProfile({ ...profile, legalName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">GSTIN (15 Digits)</label>
                  <Input
                    value={profile.gstin}
                    placeholder="27AAAAA0000A1Z5"
                    maxLength={15}
                    className="text-xs h-9 mt-1 uppercase font-mono"
                    onChange={(e) => setProfile({ ...profile, gstin: e.target.value.toUpperCase() })}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">FSSAI License (14 Digits)</label>
                  <Input
                    value={profile.fssaiNumber}
                    placeholder="11521034000123"
                    maxLength={14}
                    className="text-xs h-9 mt-1 font-mono"
                    onChange={(e) => setProfile({ ...profile, fssaiNumber: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Primary Contact Phone *</label>
                  <Input
                    value={profile.phone}
                    placeholder="9876543210"
                    className="text-xs h-9 mt-1"
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Official Email</label>
                  <Input
                    type="email"
                    value={profile.email}
                    placeholder="contact@spicegarden.com"
                    className="text-xs h-9 mt-1"
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Dynamic UPI ID (For Bill QR Codes)</label>
                  <Input
                    value={profile.upiId}
                    placeholder="restro@icici"
                    className="text-xs h-9 mt-1"
                    onChange={(e) => setProfile({ ...profile, upiId: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">State Code</label>
                  <Input
                    value={profile.stateCode}
                    placeholder="27"
                    maxLength={2}
                    className="text-xs h-9 mt-1 font-mono"
                    onChange={(e) => setProfile({ ...profile, stateCode: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700">Street Address</label>
                  <Input
                    value={profile.line1}
                    placeholder="12 Linking Road, Bandra West"
                    className="text-xs h-9 mt-1"
                    onChange={(e) => setProfile({ ...profile, line1: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">City</label>
                  <Input
                    value={profile.city}
                    placeholder="Mumbai"
                    className="text-xs h-9 mt-1"
                    onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Pincode</label>
                  <Input
                    value={profile.pincode}
                    placeholder="400050"
                    maxLength={6}
                    className="text-xs h-9 mt-1"
                    onChange={(e) => setProfile({ ...profile, pincode: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Taxes Tab */}
          {activeTab === 'taxes' && (
            <Card className="border-slate-200 shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900">Configured GST Tax Slabs</CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Real CGST, SGST and IGST rules assigned to menu categories
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  onClick={() => setIsAddTaxModalOpen(true)}
                  className="text-xs h-8 bg-rose-600 hover:bg-rose-700 text-white font-semibold"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add Tax Slab
                </Button>
              </CardHeader>
              <CardContent className="pt-4">
                {taxGroups.length === 0 ? (
                  <p className="py-8 text-center text-xs text-slate-500 font-medium">
                    No tax groups configured yet. Click "Add Tax Slab" to create one.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                    {taxGroups.map((t) => {
                      const taxId = t._id || t.id;
                      return (
                        <div key={taxId} className="p-4 flex items-center justify-between bg-white hover:bg-slate-50 transition-colors">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-slate-900">{t.name}</span>
                              <Badge className="bg-emerald-600 text-white text-[10px]">
                                {t.rate}%
                              </Badge>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                              CGST {t.cgstRate || t.cgst || (t.rate / 2)}% + SGST {t.sgstRate || t.sgst || (t.rate / 2)}%
                              {t.isInclusive ? ' • Price Inclusive' : ' • Price Exclusive'}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-rose-600 hover:bg-rose-50 h-8 w-8 p-0"
                            onClick={() => handleDeleteTaxGroup(taxId, t.name)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Charges Tab */}
          {activeTab === 'charges' && (
            <Card className="border-slate-200 shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900">Operational Charges & Levies</CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Service charge, takeaway packing fees, and delivery surcharges
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  onClick={() => setIsAddChargeModalOpen(true)}
                  className="text-xs h-8 bg-rose-600 hover:bg-rose-700 text-white font-semibold"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add Charge
                </Button>
              </CardHeader>
              <CardContent className="pt-4">
                {charges.length === 0 ? (
                  <p className="py-8 text-center text-xs text-slate-500 font-medium">
                    No charges configured yet. Click "Add Charge" to create one.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                    {charges.map((c) => {
                      const chargeId = c._id || c.id;
                      return (
                        <div key={chargeId} className="p-4 flex items-center justify-between bg-white hover:bg-slate-50 transition-colors">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-slate-900">{c.name}</span>
                              <Badge variant="outline" className="text-[10px] font-mono uppercase">
                                {c.type}
                              </Badge>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                              {c.isPercentage ? `${c.rate}% on subtotal` : `₹${c.rate} fixed fee`}
                              {c.applicableOrderTypes?.length ? ` • Applies to: ${c.applicableOrderTypes.join(', ')}` : ''}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-rose-600 hover:bg-rose-50 h-8 w-8 p-0"
                            onClick={() => handleDeleteCharge(chargeId, c.name)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Series & Numbering Tab */}
          {activeTab === 'numbering' && (
            <Card className="border-slate-200 shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-base font-bold text-slate-900">Document Numbering Series</CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Sequential serial generation for Orders, Bills/Invoices, and KOT tickets
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                {numberingSeries.length === 0 ? (
                  <p className="py-8 text-center text-xs text-slate-500 font-medium">
                    No custom series found. Default ORD, INV, KOT numbering in effect.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                    {numberingSeries.map((s) => {
                      const seriesId = s._id || s.id;
                      return (
                        <div key={seriesId} className="p-4 border border-slate-200 rounded-xl bg-slate-50/70 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-sm text-slate-900">{s.docType} Series</span>
                            <Badge className="bg-slate-900 text-white font-mono text-[10px]">
                              {s.prefix}-{String(s.currentNumber || 1).padStart(s.padding || 4, '0')}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-500 font-mono">
                            Prefix: <span className="font-bold text-slate-800">{s.prefix}</span> • Padding: {s.padding} digits
                          </p>
                          <p className="text-[11px] text-slate-400">
                            Reset frequency: {s.resetFrequency || 'DAILY'}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Printers Tab */}
          {activeTab === 'printers' && (
            <Card className="border-slate-200 shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900">Thermal Printer Registry</CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    ESC/POS network and local printers for customer bills and kitchen orders
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  onClick={() => setIsAddPrinterModalOpen(true)}
                  className="text-xs h-8 bg-rose-600 hover:bg-rose-700 text-white font-semibold"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add New Printer
                </Button>
              </CardHeader>
              <CardContent className="pt-4">
                {printers.length === 0 ? (
                  <p className="py-8 text-center text-xs text-slate-500 font-medium">
                    No hardware printers registered in database. Click "Add New Printer" to configure.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {printers.map((p) => {
                      const printerId = p._id || p.id;
                      return (
                        <div key={printerId} className="p-4 border border-slate-200 rounded-xl space-y-3 bg-white">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-slate-900">{p.name}</span>
                            <Badge variant={p.isReceiptPrinter ? 'default' : 'secondary'} className="text-[10px]">
                              {p.isReceiptPrinter ? 'RECEIPT' : 'KOT'}
                            </Badge>
                          </div>
                          <div className="text-xs text-slate-500 space-y-1 font-mono">
                            <p>Type: {p.connectionType}</p>
                            <p>Address: {p.ipAddress || '127.0.0.1'}:{p.port || 9100}</p>
                            <p>Width: {p.paperWidth || '80mm'}</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-xs h-8 font-semibold"
                            onClick={() => handleTestPrint(printerId, p.name)}
                          >
                            Dispatch Test Print
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Devices Tab */}
          {activeTab === 'devices' && (
            <Card className="border-slate-200 shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900">Active Terminals & Handhelds</CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Authorized billing counters, kitchen KDS screens, and waiter tablets
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  onClick={() => setIsAddDeviceModalOpen(true)}
                  className="text-xs h-8 bg-rose-600 hover:bg-rose-700 text-white font-semibold"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Register Device
                </Button>
              </CardHeader>
              <CardContent className="pt-4">
                {devices.length === 0 ? (
                  <p className="py-8 text-center text-xs text-slate-500 font-medium">
                    No registered hardware terminals found in API. Click "Register Device" to add.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                    {devices.map((d) => {
                      const deviceId = d._id || d.id;
                      return (
                        <div key={deviceId} className="p-4 flex items-center justify-between bg-white hover:bg-slate-50 transition-colors">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-slate-900">{d.name}</span>
                              <Badge variant="outline" className="font-mono text-xs uppercase">
                                {d.deviceCode}
                              </Badge>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">{d.deviceType}</p>
                          </div>
                          <Badge className={d.isActive !== false ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}>
                            {d.isActive !== false ? 'Online / Active' : 'Offline'}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Payment Modes Tab */}
          {activeTab === 'payments' && (
            <Card className="border-slate-200 shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-base font-bold text-slate-900">Accepted Settlement & Tender Methods</CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Toggle active payment modes available at POS billing checkout
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                {paymentModes.length === 0 ? (
                  <p className="py-8 text-center text-xs text-slate-500 font-medium">
                    No payment modes returned from API.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                    {paymentModes.map((m) => {
                      const modeId = m._id || m.id;
                      return (
                        <div key={modeId} className="p-4 flex items-center justify-between bg-white hover:bg-slate-50 transition-colors">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-slate-900">{m.name}</span>
                              <Badge variant="outline" className="text-[10px] font-mono uppercase">
                                {m.code}
                              </Badge>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Drawer trigger: {m.opensCashDrawer ? 'Yes (Cash Drawer Kicks)' : 'No drawer trigger'}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant={m.isEnabled ? 'outline' : 'secondary'}
                            className={`text-xs h-8 font-semibold ${
                              m.isEnabled ? 'border-emerald-300 text-emerald-800 bg-emerald-50/50' : 'text-slate-500'
                            }`}
                            onClick={() => handleTogglePaymentMode(m)}
                          >
                            {m.isEnabled ? 'Enabled' : 'Disabled'}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Add Tax Modal */}
      {isAddTaxModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <Card className="w-full max-w-sm bg-white border border-slate-200 shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">Add GST Tax Slab</CardTitle>
                <CardDescription className="text-xs text-slate-500">Configure Indian GST rule</CardDescription>
              </div>
              <button onClick={() => setIsAddTaxModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </CardHeader>
            <form onSubmit={handleCreateTaxGroup}>
              <CardContent className="space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-slate-700">Tax Group Name *</label>
                  <Input
                    placeholder="e.g. GST 5% (F&B)"
                    value={newTax.name}
                    required
                    onChange={(e) => setNewTax({ ...newTax, name: e.target.value })}
                    className="text-xs h-9 mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Tax Rate (%) *</label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    placeholder="5"
                    value={newTax.rate}
                    required
                    onChange={(e) => setNewTax({ ...newTax, rate: e.target.value })}
                    className="text-xs h-9 mt-1"
                  />
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="taxInc"
                    checked={newTax.isInclusive}
                    onChange={(e) => setNewTax({ ...newTax, isInclusive: e.target.checked })}
                    className="rounded border-slate-300 text-rose-600 h-4 w-4"
                  />
                  <label htmlFor="taxInc" className="text-xs font-semibold text-slate-700 cursor-pointer">
                    Price inclusive of this tax
                  </label>
                </div>
              </CardContent>
              <div className="flex justify-end gap-2 p-4 border-t border-slate-100">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsAddTaxModalOpen(false)} className="text-xs">
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="text-xs bg-rose-600 hover:bg-rose-700 text-white font-semibold">
                  Save Tax Slab
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Add Charge Modal */}
      {isAddChargeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <Card className="w-full max-w-sm bg-white border border-slate-200 shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">Add Operational Charge</CardTitle>
                <CardDescription className="text-xs text-slate-500">Service or packaging fee</CardDescription>
              </div>
              <button onClick={() => setIsAddChargeModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </CardHeader>
            <form onSubmit={handleCreateCharge}>
              <CardContent className="space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-slate-700">Charge Name *</label>
                  <Input
                    placeholder="e.g. Service Charge"
                    value={newCharge.name}
                    required
                    onChange={(e) => setNewCharge({ ...newCharge, name: e.target.value })}
                    className="text-xs h-9 mt-1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-slate-700">Type</label>
                    <select
                      value={newCharge.type}
                      onChange={(e) => setNewCharge({ ...newCharge, type: e.target.value })}
                      className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 mt-1 font-medium"
                    >
                      <option value="SERVICE">Service Charge</option>
                      <option value="PACKAGING">Packaging</option>
                      <option value="DELIVERY">Delivery</option>
                      <option value="CUSTOM">Custom</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700">Rate</label>
                    <Input
                      type="number"
                      step="0.5"
                      min="0"
                      value={newCharge.rate}
                      required
                      onChange={(e) => setNewCharge({ ...newCharge, rate: e.target.value })}
                      className="text-xs h-9 mt-1"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="isPercent"
                    checked={newCharge.isPercentage}
                    onChange={(e) => setNewCharge({ ...newCharge, isPercentage: e.target.checked })}
                    className="rounded border-slate-300 text-rose-600 h-4 w-4"
                  />
                  <label htmlFor="isPercent" className="text-xs font-semibold text-slate-700 cursor-pointer">
                    Percentage (%) instead of fixed ₹ fee
                  </label>
                </div>
              </CardContent>
              <div className="flex justify-end gap-2 p-4 border-t border-slate-100">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsAddChargeModalOpen(false)} className="text-xs">
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="text-xs bg-rose-600 hover:bg-rose-700 text-white font-semibold">
                  Save Charge
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Add Printer Modal */}
      {isAddPrinterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <Card className="w-full max-w-sm bg-white border border-slate-200 shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">Add Thermal Printer</CardTitle>
                <CardDescription className="text-xs text-slate-500">Register ESC/POS printer</CardDescription>
              </div>
              <button onClick={() => setIsAddPrinterModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </CardHeader>
            <form onSubmit={handleCreatePrinter}>
              <CardContent className="space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-slate-700">Printer Name *</label>
                  <Input
                    placeholder="e.g. Counter Bill Printer"
                    value={newPrinter.name}
                    required
                    onChange={(e) => setNewPrinter({ ...newPrinter, name: e.target.value })}
                    className="text-xs h-9 mt-1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-slate-700">Connection</label>
                    <select
                      value={newPrinter.connectionType}
                      onChange={(e) => setNewPrinter({ ...newPrinter, connectionType: e.target.value })}
                      className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 mt-1 font-medium"
                    >
                      <option value="NETWORK">Network (IP)</option>
                      <option value="USB">USB Cable</option>
                      <option value="BLUETOOTH">Bluetooth</option>
                      <option value="SYSTEM_DIALOG">Browser Dialog</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700">Paper Width</label>
                    <select
                      value={newPrinter.paperWidth}
                      onChange={(e) => setNewPrinter({ ...newPrinter, paperWidth: e.target.value })}
                      className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 mt-1 font-medium"
                    >
                      <option value="80mm">80mm (Standard)</option>
                      <option value="58mm">58mm (Compact)</option>
                    </select>
                  </div>
                </div>
                {newPrinter.connectionType === 'NETWORK' && (
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="text-xs font-bold text-slate-700">IP Address</label>
                      <Input
                        placeholder="192.168.1.100"
                        value={newPrinter.ipAddress}
                        onChange={(e) => setNewPrinter({ ...newPrinter, ipAddress: e.target.value })}
                        className="text-xs h-9 mt-1 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700">Port</label>
                      <Input
                        placeholder="9100"
                        value={newPrinter.port}
                        onChange={(e) => setNewPrinter({ ...newPrinter, port: e.target.value })}
                        className="text-xs h-9 mt-1 font-mono"
                      />
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-4 pt-1">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newPrinter.isReceiptPrinter}
                      onChange={(e) => setNewPrinter({ ...newPrinter, isReceiptPrinter: e.target.checked })}
                      className="rounded border-slate-300 text-rose-600 h-4 w-4"
                    />
                    Receipts
                  </label>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newPrinter.isKotPrinter}
                      onChange={(e) => setNewPrinter({ ...newPrinter, isKotPrinter: e.target.checked })}
                      className="rounded border-slate-300 text-rose-600 h-4 w-4"
                    />
                    Kitchen KOTs
                  </label>
                </div>
              </CardContent>
              <div className="flex justify-end gap-2 p-4 border-t border-slate-100">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsAddPrinterModalOpen(false)} className="text-xs">
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="text-xs bg-rose-600 hover:bg-rose-700 text-white font-semibold">
                  Register Printer
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Add Device Modal */}
      {isAddDeviceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <Card className="w-full max-w-sm bg-white border border-slate-200 shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">Register POS Terminal</CardTitle>
                <CardDescription className="text-xs text-slate-500">Authorize handheld tablet or desktop</CardDescription>
              </div>
              <button onClick={() => setIsAddDeviceModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </CardHeader>
            <form onSubmit={handleRegisterDevice}>
              <CardContent className="space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-slate-700">Device Name *</label>
                  <Input
                    placeholder="e.g. Captain Tab Floor 1"
                    value={newDevice.name}
                    required
                    onChange={(e) => setNewDevice({ ...newDevice, name: e.target.value })}
                    className="text-xs h-9 mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Device Code (Unique) *</label>
                  <Input
                    placeholder="e.g. TAB-01"
                    value={newDevice.deviceCode}
                    required
                    onChange={(e) => setNewDevice({ ...newDevice, deviceCode: e.target.value.toUpperCase() })}
                    className="text-xs h-9 mt-1 font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Terminal Type</label>
                  <select
                    value={newDevice.deviceType}
                    onChange={(e) => setNewDevice({ ...newDevice, deviceType: e.target.value })}
                    className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 mt-1 font-medium"
                  >
                    <option value="COUNTER_POS">Counter Desktop POS</option>
                    <option value="CAPTAIN_HANDHELD">Captain Waiter Handheld Tablet</option>
                    <option value="KITCHEN_DISPLAY">Kitchen Display System (KDS)</option>
                  </select>
                </div>
              </CardContent>
              <div className="flex justify-end gap-2 p-4 border-t border-slate-100">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsAddDeviceModalOpen(false)} className="text-xs">
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="text-xs bg-rose-600 hover:bg-rose-700 text-white font-semibold">
                  Register Terminal
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
