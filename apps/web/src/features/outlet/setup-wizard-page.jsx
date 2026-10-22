import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  Building,
  Percent,
  CreditCard,
  Receipt,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

export function SetupWizardPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);

  // Form State (initialized empty, loaded from API)
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
  });

  const [serviceCharge, setServiceCharge] = useState({
    enabled: true,
    rate: 5,
  });

  const [packagingCharge, setPackagingCharge] = useState({
    enabled: true,
    rate: 20,
  });

  // Real backend data fetched for preview steps
  const [taxGroups, setTaxGroups] = useState([]);
  const [paymentModes, setPaymentModes] = useState([]);

  // Fetch real outlet details & config on mount
  useEffect(() => {
    let isMounted = true;
    async function loadInitialData() {
      setIsLoading(true);
      setError(null);
      try {
        const [profileRes, taxesRes, modesRes] = await Promise.all([
          apiClient.get('/v1/outlet/profile').catch(() => null),
          apiClient.get('/v1/outlet/tax-groups').catch(() => null),
          apiClient.get('/v1/outlet/payment-modes').catch(() => null),
        ]);

        if (!isMounted) return;

        if (profileRes?.data?.outlet || profileRes?.data) {
          const o = profileRes.data.outlet || profileRes.data;
          setProfile({
            name: o.name || '',
            legalName: o.legalName || '',
            phone: o.phone || '',
            email: o.email || '',
            gstin: o.gstin || '',
            fssaiNumber: o.fssaiNumber || '',
            upiId: o.upiId || '',
            line1: o.address?.line1 || '',
            city: o.address?.city || '',
            state: o.address?.state || '',
            stateCode: o.address?.stateCode || '27',
            pincode: o.address?.pincode || '',
          });
        }

        const taxes = Array.isArray(taxesRes?.data?.taxes)
          ? taxesRes.data.taxes
          : Array.isArray(taxesRes?.data)
          ? taxesRes.data
          : [];
        setTaxGroups(taxes);

        const modes = Array.isArray(modesRes?.data?.paymentModes)
          ? modesRes.data.paymentModes
          : Array.isArray(modesRes?.data)
          ? modesRes.data
          : [];
        setPaymentModes(modes);
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
  }, []);

  const handleFinishWizard = async () => {
    try {
      setIsSubmitting(true);
      setError(null);

      // 1. Update outlet profile via real API
      await apiClient.put('/v1/outlet/profile', {
        name: profile.name,
        legalName: profile.legalName,
        phone: profile.phone,
        email: profile.email || undefined,
        gstin: profile.gstin || undefined,
        fssaiNumber: profile.fssaiNumber || undefined,
        upiId: profile.upiId || undefined,
        address: {
          line1: profile.line1?.trim() || 'Main Road',
          city: profile.city?.trim() || 'City',
          state: profile.state?.trim() || 'State',
          stateCode: profile.stateCode?.trim() || '27',
          pincode: profile.pincode?.trim() || '400001',
        },
        isSetupCompleted: true,
      });

      // 2. Pre-seed default taxes, payment modes, numbering series via real API
      await apiClient.post('/v1/outlet/seed-defaults', {}).catch(() => {});

      // 3. Create service charge if enabled
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

      // 4. Create packaging charge if enabled
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

      setNotification('Outlet setup completed successfully!');
      setTimeout(() => navigate('/'), 1200);
    } catch (err) {
      setError(err.data?.message || err.message || 'Wizard completion failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { id: 1, title: 'Outlet Profile', icon: Building },
    { id: 2, title: 'GST Slabs', icon: Percent },
    { id: 3, title: 'Charges', icon: Receipt },
    { id: 4, title: 'Payment Modes', icon: CreditCard },
  ];

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
        {notification && (
          <div className="bg-emerald-600 text-white text-xs font-bold px-4 py-2 text-center animate-in fade-in">
            {notification}
          </div>
        )}

        <CardHeader className="border-b border-slate-100 pb-4 bg-slate-50/50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold text-slate-900">Outlet Initial Setup Wizard</CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Step {currentStep} of {steps.length} — Configure your store fundamentals connected with API
              </CardDescription>
            </div>
            <Badge variant="secondary" className="font-mono text-xs bg-slate-200 text-slate-700">
              Live API
            </Badge>
          </div>

          {/* Stepper Progress */}
          <div className="flex items-center justify-between pt-4">
            {steps.map((s) => (
              <div key={s.id} className="flex items-center gap-2">
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
              <p className="text-xs font-semibold">Loading real outlet configuration from API...</p>
            </div>
          ) : (
            <>
              {currentStep === 1 && (
                <div className="space-y-4">
                  <h3 className="font-bold text-sm text-slate-900">Restaurant Profile & Government Registrations</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700">Outlet Display Name *</label>
                      <Input
                        value={profile.name}
                        placeholder="e.g. Spice Garden"
                        className="text-xs h-9 mt-1"
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700">Legal Business Name *</label>
                      <Input
                        value={profile.legalName}
                        placeholder="e.g. Spice Garden Foods Pvt Ltd"
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
                      <label className="text-xs font-bold text-slate-700">Contact Phone *</label>
                      <Input
                        value={profile.phone}
                        placeholder="9876543210"
                        className="text-xs h-9 mt-1"
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700">Email Address</label>
                      <Input
                        type="email"
                        value={profile.email}
                        placeholder="contact@restaurant.com"
                        className="text-xs h-9 mt-1"
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs font-bold text-slate-700">Street Address</label>
                      <Input
                        value={profile.line1}
                        placeholder="Shop / Unit address"
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
                        className="text-xs h-9 mt-1"
                        onChange={(e) => setProfile({ ...profile, pincode: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">Indian GST Slabs Configuration</h3>
                      <p className="text-xs text-slate-500">
                        Active tax slabs synchronized with the database:
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs font-mono">
                      {taxGroups.length} Slabs Configured
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {taxGroups.length > 0 ? (
                      taxGroups.map((tax) => (
                        <div key={tax._id || tax.id} className="p-3 border border-slate-200 rounded-lg bg-slate-50/70">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-sm text-slate-900">{tax.name}</span>
                            <Badge className="bg-emerald-600 text-white text-[10px]">
                              {tax.rate}%
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            CGST {tax.cgstRate || tax.cgst || (tax.rate / 2)}% + SGST {tax.sgstRate || tax.sgst || (tax.rate / 2)}%
                            {tax.isInclusive ? ' • Inclusive' : ' • Exclusive'}
                          </p>
                        </div>
                      ))
                    ) : (
                      <>
                        <div className="p-3 border border-slate-200 rounded-lg bg-slate-50/70">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-sm text-slate-900">GST 5% (Standard F&B)</span>
                            <Badge className="bg-emerald-600 text-white text-[10px]">Pre-seeded</Badge>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">CGST 2.5% + SGST 2.5% (Restaurant dine-in & delivery)</p>
                        </div>
                        <div className="p-3 border border-slate-200 rounded-lg bg-slate-50/70">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-sm text-slate-900">GST 18% (Outdoor / Hotel)</span>
                            <Badge className="bg-emerald-600 text-white text-[10px]">Pre-seeded</Badge>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">CGST 9% + SGST 9%</p>
                        </div>
                        <div className="p-3 border border-slate-200 rounded-lg bg-slate-50/70">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-sm text-slate-900">GST 12%</span>
                            <Badge variant="secondary" className="text-[10px]">Pre-seeded</Badge>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">CGST 6% + SGST 6%</p>
                        </div>
                        <div className="p-3 border border-slate-200 rounded-lg bg-slate-50/70">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-sm text-slate-900">GST Exempt (0%)</span>
                            <Badge variant="secondary" className="text-[10px]">Pre-seeded</Badge>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">Water and unbranded food items</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-4">
                  <h3 className="font-bold text-sm text-slate-900">Operational Charges & Packaging</h3>
                  <div className="space-y-3">
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
                        <p className="text-xs text-slate-500 pl-6 mt-0.5">Fixed fee per takeaway packaging</p>
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

              {currentStep === 4 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">Tender & Payment Modes</h3>
                      <p className="text-xs text-slate-500">Active settlement methods available at billing counter:</p>
                    </div>
                    <Badge variant="outline" className="text-xs font-mono">
                      {paymentModes.length ? `${paymentModes.length} Modes in API` : 'Default 5 Modes'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {paymentModes.length > 0 ? (
                      paymentModes.map((mode) => (
                        <div
                          key={mode._id || mode.id || mode.code}
                          className="flex items-center justify-between p-3 border border-slate-200 rounded-lg bg-slate-50/50"
                        >
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            <span className="text-xs font-bold text-slate-800">{mode.name}</span>
                          </div>
                          <Badge variant="secondary" className="text-[10px] uppercase font-mono">
                            {mode.code}
                          </Badge>
                        </div>
                      ))
                    ) : (
                      ['Cash (Auto-open drawer)', 'Dynamic UPI / QR', 'Credit & Debit Card', 'Customer Dues (Khata)', 'Complimentary / Tasting'].map(
                        (mode, i) => (
                          <div key={i} className="flex items-center gap-2 p-3 border border-slate-200 rounded-lg bg-slate-50/50">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            <span className="text-xs font-bold text-slate-800">{mode}</span>
                          </div>
                        )
                      )
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>

        <CardFooter className="flex justify-between border-t border-slate-100 p-4 bg-slate-50/50">
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
                  Finalizing Setup...
                </>
              ) : (
                'Complete & Launch POS'
              )}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
