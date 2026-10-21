import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Building, Percent, CreditCard, Receipt, ArrowRight, ArrowLeft } from 'lucide-react';

export function SetupWizardPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [profile, setProfile] = useState({
    name: 'Spice Garden — Bandra',
    legalName: 'Spice Garden Food & Beverage Pvt Ltd',
    phone: '9876543210',
    email: 'contact@spicegarden.com',
    gstin: '27AAPFU0939F1ZV',
    fssaiNumber: '11521034000123',
    line1: '12 Linking Road, Bandra West',
    city: 'Mumbai',
    state: 'Maharashtra',
    stateCode: '27',
    pincode: '400050',
  });

  const [serviceCharge, setServiceCharge] = useState({
    enabled: true,
    rate: 5,
  });

  const [packagingCharge, setPackagingCharge] = useState({
    enabled: true,
    rate: 20, // 20 INR
  });

  const handleFinishWizard = async () => {
    try {
      setIsSubmitting(true);

      // 1. Update outlet profile
      await fetch('/v1/outlet/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profile.name,
          legalName: profile.legalName,
          phone: profile.phone,
          email: profile.email,
          gstin: profile.gstin,
          fssaiNumber: profile.fssaiNumber,
          address: {
            line1: profile.line1,
            city: profile.city,
            state: profile.state,
            stateCode: profile.stateCode,
            pincode: profile.pincode,
          },
          isSetupCompleted: true,
        }),
      });

      // 2. Pre-seed default taxes, payment modes, numbering series
      await fetch('/v1/outlet/seed-defaults', { method: 'POST' });

      // 3. Create service charge if enabled
      if (serviceCharge.enabled) {
        await fetch('/v1/outlet/charges', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Service Charge',
            type: 'SERVICE',
            rate: serviceCharge.rate,
            isPercentage: true,
            applicableOrderTypes: ['DINE_IN'],
          }),
        });
      }

      navigate('/');
    } catch (err) {
      console.error('Wizard error:', err);
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
      <Card className="w-full max-w-2xl bg-card border shadow-2xl">
        <CardHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold">Outlet Initial Setup Wizard</CardTitle>
              <CardDescription>Step {currentStep} of {steps.length} — Configure your store fundamentals</CardDescription>
            </div>
            <Badge variant="secondary" className="font-mono text-xs">Phase 1</Badge>
          </div>

          {/* Stepper Progress */}
          <div className="flex items-center justify-between pt-4">
            {steps.map((s) => (
              <div key={s.id} className="flex items-center gap-2">
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    currentStep === s.id
                      ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                      : currentStep > s.id
                      ? 'bg-emerald-600 text-white'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {currentStep > s.id ? <CheckCircle2 className="h-4 w-4" /> : s.id}
                </div>
                <span className="text-xs font-medium hidden sm:inline">{s.title}</span>
              </div>
            ))}
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-4">
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Restaurant Profile & Government Registrations</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Outlet Display Name</label>
                  <Input
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Legal Business Name</label>
                  <Input
                    value={profile.legalName}
                    onChange={(e) => setProfile({ ...profile, legalName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">GSTIN (15 Digits)</label>
                  <Input
                    value={profile.gstin}
                    onChange={(e) => setProfile({ ...profile, gstin: e.target.value.toUpperCase() })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">FSSAI License (14 Digits)</label>
                  <Input
                    value={profile.fssaiNumber}
                    onChange={(e) => setProfile({ ...profile, fssaiNumber: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Contact Phone</label>
                  <Input
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Email Address</label>
                  <Input
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-muted-foreground">Address</label>
                  <Input
                    value={profile.line1}
                    onChange={(e) => setProfile({ ...profile, line1: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">City</label>
                  <Input
                    value={profile.city}
                    onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Pincode</label>
                  <Input
                    value={profile.pincode}
                    onChange={(e) => setProfile({ ...profile, pincode: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Indian GST Slabs Configuration</h3>
              <p className="text-xs text-muted-foreground">
                Standard Indian food and beverage tax slabs will automatically be provisioned:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 border rounded-lg bg-muted/40">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sm">GST 5% (Standard F&B)</span>
                    <Badge variant="default">Included</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">CGST 2.5% + SGST 2.5% (Restaurants)</p>
                </div>
                <div className="p-3 border rounded-lg bg-muted/40">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sm">GST 18% (Outdoor / Hotel)</span>
                    <Badge variant="default">Included</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">CGST 9% + SGST 9%</p>
                </div>
                <div className="p-3 border rounded-lg bg-muted/40">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sm">GST 12%</span>
                    <Badge variant="secondary">Optional</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">CGST 6% + SGST 6%</p>
                </div>
                <div className="p-3 border rounded-lg bg-muted/40">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sm">GST Exempt (0%)</span>
                    <Badge variant="secondary">Included</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Water, unbranded staples</p>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Operational Charges & Packaging</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">Service Charge (Dine In)</p>
                    <p className="text-xs text-muted-foreground">Percentage added to dine-in subtotal</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      className="w-20 text-center"
                      value={serviceCharge.rate}
                      onChange={(e) => setServiceCharge({ ...serviceCharge, rate: Number(e.target.value) })}
                    />
                    <span className="text-sm font-semibold">%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">Parcel / Packaging Container Charge</p>
                    <p className="text-xs text-muted-foreground">Fixed fee per takeaway packaging</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">₹</span>
                    <Input
                      type="number"
                      className="w-20 text-center"
                      value={packagingCharge.rate}
                      onChange={(e) => setPackagingCharge({ ...packagingCharge, rate: Number(e.target.value) })}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Tender & Payment Modes</h3>
              <p className="text-xs text-muted-foreground">Select active settlement methods for billing:</p>
              <div className="grid grid-cols-2 gap-2.5">
                {['Cash (Auto-open drawer)', 'Dynamic UPI / QR', 'Credit & Debit Card', 'Customer Dues (Khata)', 'Complimentary / Tasting'].map((mode, i) => (
                  <div key={i} className="flex items-center gap-2 p-3 border rounded-lg bg-muted/20">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span className="text-xs font-medium">{mode}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between border-t p-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
            disabled={currentStep === 1 || isSubmitting}
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Previous
          </Button>

          {currentStep < steps.length ? (
            <Button
              type="button"
              onClick={() => setCurrentStep((prev) => Math.min(steps.length, prev + 1))}
            >
              Continue
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          ) : (
            <Button
              type="button"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleFinishWizard}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Finalizing Setup...' : 'Complete & Launch POS'}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
