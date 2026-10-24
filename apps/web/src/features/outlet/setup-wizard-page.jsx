import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  Building,
  LayoutGrid,
  UtensilsCrossed,
  Users,
  Percent,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Clock,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';
import { usePosStore } from '@/stores/pos-store';

export function SetupWizardPage() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();
  const { switchOutlet } = usePosStore();

  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);

  // Step 1: Store Profile & Timings
  const [profile, setProfile] = useState({
    name: '',
    legalName: '',
    phone: '',
    email: '',
    gstin: '',
    fssaiNumber: '',
    upiId: '',
    line1: '',
    city: '',
    state: '',
    stateCode: '27',
    pincode: '',
    openTime: '09:00',
    closeTime: '23:00',
  });

  // Step 2: Floor & Tables
  const [floorPlan, setFloorPlan] = useState({
    seedFloor: true,
    areasCount: 3,
    tablesCount: 14,
  });

  // Step 3: Menu & Categories
  const [menuSetup, setMenuSetup] = useState({
    seedStarterMenu: true,
    categoriesCount: 4,
    itemsCount: 8,
  });

  // Step 4: Staff Users & PINs
  const [staffList, setStaffList] = useState([
    { role: 'biller', name: 'Cashier / Biller', phone: '', pin: '3333', enabled: true },
    { role: 'captain', name: 'Service Captain', phone: '', pin: '4444', enabled: true },
    { role: 'cook', name: 'Head Chef / Cook', phone: '', pin: '5555', enabled: true },
  ]);

  // Step 5: Charges & Taxes
  const [serviceCharge, setServiceCharge] = useState({
    enabled: true,
    rate: 5,
  });

  const [packagingCharge, setPackagingCharge] = useState({
    enabled: true,
    rate: 20,
  });

  const [taxGroups, setTaxGroups] = useState([]);

  // Fetch existing outlet details on mount
  useEffect(() => {
    let isMounted = true;
    async function loadInitialData() {
      setIsLoading(true);
      setError(null);
      try {
        const [profileRes, taxesRes] = await Promise.all([
          apiClient.get('/v1/outlet/profile').catch(() => null),
          apiClient.get('/v1/outlet/tax-groups').catch(() => null),
        ]);

        if (!isMounted) return;

        if (profileRes?.data?.outlet || profileRes?.data) {
          const o = profileRes.data.outlet || profileRes.data;
          setProfile((prev) => ({
            ...prev,
            name: o.name || prev.name,
            legalName: o.legalName || o.name || prev.legalName,
            phone: o.phone || user?.phone || prev.phone,
            email: o.email || user?.email || prev.email,
            gstin: o.gstin || prev.gstin,
            fssaiNumber: o.fssaiNumber || prev.fssaiNumber,
            upiId: o.upiId || prev.upiId,
            line1: o.address?.line1 || prev.line1,
            city: o.address?.city || prev.city,
            state: o.address?.state || prev.state,
            stateCode: o.address?.stateCode || prev.stateCode,
            pincode: o.address?.pincode || prev.pincode,
            openTime: o.operatingHours?.openTime || '09:00',
            closeTime: o.operatingHours?.closeTime || '23:00',
          }));
        }

        const taxes = Array.isArray(taxesRes?.data?.taxes)
          ? taxesRes.data.taxes
          : Array.isArray(taxesRes?.data)
          ? taxesRes.data
          : [];
        setTaxGroups(taxes);
      } catch (err) {
        if (isMounted) setError(err.message || 'Failed to load existing outlet details.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadInitialData();
    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleFinishWizard = async () => {
    try {
      setIsSubmitting(true);
      setError(null);

      // 1. Update outlet profile & timings
      await apiClient.put('/v1/outlet/profile', {
        name: profile.name || 'My Restaurant',
        legalName: profile.legalName || profile.name || 'My Restaurant F&B',
        phone: profile.phone || '9999999999',
        email: profile.email || undefined,
        gstin: profile.gstin || undefined,
        fssaiNumber: profile.fssaiNumber || undefined,
        upiId: profile.upiId || undefined,
        operatingHours: {
          openTime: profile.openTime || '09:00',
          closeTime: profile.closeTime || '23:00',
        },
        address: {
          line1: profile.line1?.trim() || 'Main Market Road',
          city: profile.city?.trim() || 'City Center',
          state: profile.state?.trim() || 'State',
          stateCode: profile.stateCode?.trim() || '27',
          pincode: profile.pincode?.trim() || '400001',
        },
        isSetupCompleted: true,
      });

      // 2. Pre-seed default taxes, payment modes, series
      await apiClient.post('/v1/outlet/seed-defaults', {}).catch(() => {});

      // 3. Seed Floor & Tables if selected
      if (floorPlan.seedFloor) {
        await apiClient.post('/v1/tables/seed-demo', {}).catch(() => {});
      }

      // 4. Seed Menu & Categories if selected
      if (menuSetup.seedStarterMenu) {
        await apiClient.post('/v1/menu/seed-demo', {}).catch(() => {});
      }

      // 5. Create Staff Users with PINs
      for (const staff of staffList) {
        if (staff.enabled && staff.pin) {
          const generatedPhone = staff.phone?.trim() || `9${Math.floor(100000000 + Math.random() * 900000000)}`;
          await apiClient
            .post('/v1/users', {
              name: staff.name,
              phone: generatedPhone,
              role: staff.role,
              pin: staff.pin,
              password: 'StaffPassword@123',
            })
            .catch(() => {});
        }
      }

      // 6. Create Service Charge if enabled
      if (serviceCharge.enabled && serviceCharge.rate > 0) {
        await apiClient
          .post('/v1/outlet/charges', {
            name: 'Service Charge',
            type: 'SERVICE',
            rate: serviceCharge.rate,
            isPercentage: true,
            applicableOrderTypes: ['DINE_IN'],
          })
          .catch(() => {});
      }

      // 7. Create Packaging Fee if enabled
      if (packagingCharge.enabled && packagingCharge.rate > 0) {
        await apiClient
          .post('/v1/outlet/charges', {
            name: 'Parcel / Packaging Fee',
            type: 'PACKAGING',
            rate: packagingCharge.rate,
            isPercentage: false,
            applicableOrderTypes: ['TAKEAWAY', 'DELIVERY'],
          })
          .catch(() => {});
      }

      // 8. Update client auth state and switch POS store to current outlet
      updateUser({ isSetupCompleted: true, outletName: profile.name });
      if (user?.outletId) {
        switchOutlet(user.outletId);
      }

      setNotification('Store setup completed successfully! Launching your POS...');
      setTimeout(() => navigate('/admin'), 1000);
    } catch (err) {
      setError(err.data?.message || err.message || 'Setup completion failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { id: 1, title: 'Store & Timings', icon: Building },
    { id: 2, title: 'Floor & Tables', icon: LayoutGrid },
    { id: 3, title: 'Menu Categories', icon: UtensilsCrossed },
    { id: 4, title: 'Staff & PINs', icon: Users },
    { id: 5, title: 'Taxes & Charges', icon: Percent },
  ];

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
        {notification && (
          <div className="bg-emerald-600 text-white text-xs font-bold px-4 py-2.5 text-center animate-in fade-in flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            {notification}
          </div>
        )}

        <CardHeader className="border-b border-slate-100 pb-4 bg-slate-50/70">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold text-slate-900">New Store Onboarding & Setup</CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Step {currentStep} of {steps.length} — {steps[currentStep - 1].title}
              </CardDescription>
            </div>
            <Badge variant="outline" className="font-mono text-xs bg-rose-50 text-rose-700 border-rose-200">
              Required Setup
            </Badge>
          </div>

          {/* Stepper Progress */}
          <div className="flex items-center justify-between pt-4 overflow-x-auto pb-1 gap-2">
            {steps.map((s) => (
              <div key={s.id} className="flex items-center gap-2 shrink-0">
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    currentStep === s.id
                      ? 'bg-rose-600 text-white ring-4 ring-rose-100'
                      : currentStep > s.id
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {currentStep > s.id ? <CheckCircle2 className="h-4 w-4" /> : s.id}
                </div>
                <span className="text-xs font-medium hidden sm:inline text-slate-700">{s.title}</span>
              </div>
            ))}
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isLoading ? (
            <div className="py-16 text-center text-slate-500 space-y-2">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-rose-600" />
              <p className="text-xs font-semibold">Loading store configuration...</p>
            </div>
          ) : (
            <>
              {/* STEP 1: Store Profile & Timings */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <Building className="w-4 h-4 text-rose-600" />
                    Store Profile & Operating Timings
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700">Restaurant / Outlet Name *</label>
                      <Input
                        value={profile.name}
                        placeholder="e.g. Spice Garden Restaurant"
                        className="text-xs h-9 mt-1"
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700">Legal Entity Name</label>
                      <Input
                        value={profile.legalName}
                        placeholder="e.g. Spice Garden Hospitality LLP"
                        className="text-xs h-9 mt-1"
                        onChange={(e) => setProfile({ ...profile, legalName: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700">Contact Phone Number *</label>
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
                        placeholder="manager@spicegarden.com"
                        className="text-xs h-9 mt-1"
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500" /> Opening Time
                      </label>
                      <Input
                        type="time"
                        value={profile.openTime}
                        className="text-xs h-9 mt-1 font-mono"
                        onChange={(e) => setProfile({ ...profile, openTime: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500" /> Closing Time
                      </label>
                      <Input
                        type="time"
                        value={profile.closeTime}
                        className="text-xs h-9 mt-1 font-mono"
                        onChange={(e) => setProfile({ ...profile, closeTime: e.target.value })}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs font-bold text-slate-700">Street Address</label>
                      <Input
                        value={profile.line1}
                        placeholder="Shop No. 4, Ground Floor, Linking Road"
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
                      <label className="text-xs font-bold text-slate-700">UPI ID for Direct QR Payments</label>
                      <Input
                        value={profile.upiId}
                        placeholder="merchant@upi"
                        className="text-xs h-9 mt-1 font-mono"
                        onChange={(e) => setProfile({ ...profile, upiId: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Floor & Table Setup */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                        <LayoutGrid className="w-4 h-4 text-rose-600" />
                        Dining Floor & Table Setup
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Configure dining areas and table layout for your floor view.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 border-2 border-dashed border-rose-200 bg-rose-50/40 rounded-xl space-y-3">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="seedFloorCheck"
                        checked={floorPlan.seedFloor}
                        onChange={(e) => setFloorPlan({ ...floorPlan, seedFloor: e.target.checked })}
                        className="mt-1 rounded border-slate-300 text-rose-600 focus:ring-rose-500 h-4 w-4"
                      />
                      <div>
                        <label htmlFor="seedFloorCheck" className="font-bold text-sm text-slate-900 cursor-pointer">
                          Auto-generate Standard Dining Floor Layout
                        </label>
                        <p className="text-xs text-slate-600 mt-0.5">
                          Automatically generates 3 zoned sections with 14 dining tables ready for immediate service:
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 pl-7">
                      <div className="p-3 bg-white border border-slate-200 rounded-lg">
                        <div className="text-xs font-bold text-slate-800">Ground Floor (AC Hall)</div>
                        <div className="text-[11px] text-slate-500 mt-1">7 Tables (T1 to T7)</div>
                        <Badge variant="secondary" className="mt-2 text-[10px]">Family & Standard</Badge>
                      </div>
                      <div className="p-3 bg-white border border-slate-200 rounded-lg">
                        <div className="text-xs font-bold text-slate-800">Rooftop Garden</div>
                        <div className="text-[11px] text-slate-500 mt-1">4 Tables (R1 to R4)</div>
                        <Badge variant="secondary" className="mt-2 text-[10px]">Outdoor / Scenic</Badge>
                      </div>
                      <div className="p-3 bg-white border border-slate-200 rounded-lg">
                        <div className="text-xs font-bold text-slate-800">Bar & High Stools</div>
                        <div className="text-[11px] text-slate-500 mt-1">3 Tables (B1 to B3)</div>
                        <Badge variant="secondary" className="mt-2 text-[10px]">Cocktails & Quick</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Menu & Categories */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <UtensilsCrossed className="w-4 h-4 text-rose-600" />
                      Menu Categories & Items
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Set up your menu catalogue with categories and starters.
                    </p>
                  </div>

                  <div className="p-4 border-2 border-dashed border-rose-200 bg-rose-50/40 rounded-xl space-y-3">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="seedMenuCheck"
                        checked={menuSetup.seedStarterMenu}
                        onChange={(e) => setMenuSetup({ ...menuSetup, seedStarterMenu: e.target.checked })}
                        className="mt-1 rounded border-slate-300 text-rose-600 focus:ring-rose-500 h-4 w-4"
                      />
                      <div>
                        <label htmlFor="seedMenuCheck" className="font-bold text-sm text-slate-900 cursor-pointer">
                          Seed Starter Menu Catalogue (Categories & Popular Items)
                        </label>
                        <p className="text-xs text-slate-600 mt-0.5">
                          Populates your store with standard F&B categories and bestseller dishes:
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 pl-7">
                      <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                        <div className="text-xs font-bold text-slate-800">Appetizers</div>
                        <div className="text-[11px] text-slate-500">Paneer Tikka, Malai Tikka</div>
                      </div>
                      <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                        <div className="text-xs font-bold text-slate-800">Main Course</div>
                        <div className="text-[11px] text-slate-500">Dal Makhani, Butter Chicken</div>
                      </div>
                      <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                        <div className="text-xs font-bold text-slate-800">Breads & Rice</div>
                        <div className="text-[11px] text-slate-500">Butter Naan, Biryani</div>
                      </div>
                      <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                        <div className="text-xs font-bold text-slate-800">Beverages</div>
                        <div className="text-[11px] text-slate-500">Mojito, Fresh Lime Soda</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: Staff Users & Device PINs */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <Users className="w-4 h-4 text-rose-600" />
                      Staff Roles & Quick PIN Login Setup
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Configure initial staff users and assign fast 4-digit PINs for tablet and KDS terminals:
                    </p>
                  </div>

                  <div className="space-y-3">
                    {staffList.map((staff, idx) => (
                      <div
                        key={staff.role}
                        className="p-3.5 border border-slate-200 rounded-xl bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs uppercase">
                            {staff.role[0]}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900 capitalize flex items-center gap-2">
                              {staff.role} Terminal Account
                              <Badge variant="secondary" className="text-[10px] py-0 uppercase">
                                {staff.role === 'cook' ? 'KDS Screen' : staff.role === 'captain' ? 'Order Taking' : 'Billing'}
                              </Badge>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              {staff.role === 'cook'
                                ? 'Kitchen cook sees live KOT cards & acknowledges preparation'
                                : staff.role === 'captain'
                                ? 'Waitstaff takes table orders & fires tickets'
                                : 'Cashier handles settlements, discounts, and print bills'}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1.5">
                            <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-xs font-bold text-slate-600">PIN:</span>
                            <Input
                              value={staff.pin}
                              maxLength={4}
                              className="w-16 h-8 text-center text-xs font-mono font-bold"
                              onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '');
                                const next = [...staffList];
                                next[idx].pin = val;
                                setStaffList(next);
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 5: Taxes & Charges */}
              {currentStep === 5 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <Percent className="w-4 h-4 text-rose-600" />
                      Taxes, Service Charges & Packaging
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Configure mandatory Indian GST slabs and optional restaurant service fee:
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 border border-slate-200 rounded-lg bg-slate-50/70">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-sm text-slate-900">GST 5% (Standard Restaurant)</span>
                        <Badge className="bg-emerald-600 text-white text-[10px]">CGST 2.5% + SGST 2.5%</Badge>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Default slab for all F&B food & beverage orders</p>
                    </div>

                    <div className="p-3 border border-slate-200 rounded-lg bg-slate-50/70">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-sm text-slate-900">GST 18% (Outdoor / Hotel)</span>
                        <Badge className="bg-slate-700 text-white text-[10px]">CGST 9% + SGST 9%</Badge>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Applicable for star hotels & outdoor events</p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between p-3.5 border border-slate-200 rounded-xl bg-slate-50/50">
                      <div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="scToggle"
                            checked={serviceCharge.enabled}
                            onChange={(e) => setServiceCharge({ ...serviceCharge, enabled: e.target.checked })}
                            className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 h-4 w-4"
                          />
                          <label htmlFor="scToggle" className="font-bold text-sm text-slate-900 cursor-pointer">
                            Service Charge (Dine In)
                          </label>
                        </div>
                        <p className="text-xs text-slate-500 pl-6 mt-0.5">Percentage added to dine-in subtotal</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Input
                          type="number"
                          className="w-20 text-center h-8 text-xs font-bold"
                          value={serviceCharge.rate}
                          disabled={!serviceCharge.enabled}
                          onChange={(e) => setServiceCharge({ ...serviceCharge, rate: Number(e.target.value) })}
                        />
                        <span className="text-sm font-bold text-slate-700">%</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3.5 border border-slate-200 rounded-xl bg-slate-50/50">
                      <div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="pkgToggle"
                            checked={packagingCharge.enabled}
                            onChange={(e) => setPackagingCharge({ ...packagingCharge, enabled: e.target.checked })}
                            className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 h-4 w-4"
                          />
                          <label htmlFor="pkgToggle" className="font-bold text-sm text-slate-900 cursor-pointer">
                            Parcel / Packaging Fee
                          </label>
                        </div>
                        <p className="text-xs text-slate-500 pl-6 mt-0.5">Fixed fee per takeaway or delivery order</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-slate-700">₹</span>
                        <Input
                          type="number"
                          className="w-20 text-center h-8 text-xs font-bold"
                          value={packagingCharge.rate}
                          disabled={!packagingCharge.enabled}
                          onChange={(e) => setPackagingCharge({ ...packagingCharge, rate: Number(e.target.value) })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>

        <CardFooter className="flex justify-between border-t border-slate-100 p-4 bg-slate-50/70">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
            disabled={currentStep === 1 || isSubmitting || isLoading}
            className="text-xs"
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Previous
          </Button>

          {currentStep < steps.length ? (
            <Button
              type="button"
              size="sm"
              disabled={isLoading}
              onClick={() => setCurrentStep((prev) => Math.min(steps.length, prev + 1))}
              className="text-xs bg-rose-600 hover:bg-rose-700 text-white font-semibold"
            >
              Continue
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
              onClick={handleFinishWizard}
              disabled={isSubmitting || isLoading}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  Finalizing Store Setup...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 mr-1.5" />
                  Complete Setup & Launch POS
                </>
              )}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
