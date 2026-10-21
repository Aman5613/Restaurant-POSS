import React, { useState } from 'react';
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
} from 'lucide-react';

export function OutletSettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Sample data states
  const [profile, setProfile] = useState({
    name: 'Main Outlet — Bandra West',
    legalName: 'Spice Garden Pvt Ltd',
    gstin: '27AAPFU0939F1ZV',
    fssaiNumber: '11521034000123',
    phone: '9876543210',
    email: 'bandra@spicegarden.com',
    line1: '12 Linking Road, Bandra West',
    city: 'Mumbai',
    state: 'Maharashtra',
    stateCode: '27',
    pincode: '400050',
  });

  const [taxGroups, setTaxGroups] = useState([
    { id: '1', name: 'GST 5% (Food & Beverage)', rate: 5, cgst: 2.5, sgst: 2.5, isInclusive: true },
    { id: '2', name: 'GST 18% (Outdoor Catering)', rate: 18, cgst: 9, sgst: 9, isInclusive: true },
    { id: '3', name: 'Exempt (0%)', rate: 0, cgst: 0, sgst: 0, isInclusive: true },
  ]);

  const [printers] = useState([
    { id: 'p1', name: 'Counter Receipt Printer', type: 'NETWORK', ip: '192.168.1.101', role: 'BILL_RECEIPT' },
    { id: 'p2', name: 'Main Kitchen KOT Printer', type: 'NETWORK', ip: '192.168.1.102', role: 'KOT' },
    { id: 'p3', name: 'Bar Counter KOT Printer', type: 'USB', ip: 'USB-001', role: 'KOT' },
  ]);

  const [devices] = useState([
    { id: 'd1', name: 'Cashier Terminal 1', code: 'POS-01', type: 'COUNTER_POS', status: 'Online' },
    { id: 'd2', name: 'Captain Tablet - Floor 1', code: 'TAB-01', type: 'CAPTAIN_HANDHELD', status: 'Online' },
    { id: 'd3', name: 'Captain Tablet - Terrace', code: 'TAB-02', type: 'CAPTAIN_HANDHELD', status: 'Idle' },
  ]);

  const [paymentModes, setPaymentModes] = useState([
    { id: 'm1', name: 'Cash', code: 'CASH', opensDrawer: true, enabled: true },
    { id: 'm2', name: 'Dynamic UPI / QR', code: 'UPI', opensDrawer: false, enabled: true },
    { id: 'm3', name: 'Credit / Debit Card', code: 'CARD', opensDrawer: false, enabled: true },
    { id: 'm4', name: 'Customer Due (Khata)', code: 'DUE', opensDrawer: false, enabled: true },
  ]);

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Outlet Administration</h1>
          <p className="text-sm text-muted-foreground">
            Manage tax regulations, hardware registries, and business parameters
          </p>
        </div>

        <Button
          onClick={handleSave}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          {savedSuccess ? (
            <>
              <Check className="h-4 w-4 mr-1.5" />
              Settings Saved
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-1.5" />
              Save Configuration
            </>
          )}
        </Button>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b overflow-x-auto gap-2 pb-px">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-all ${
              activeTab === t.id
                ? 'border-primary text-primary bg-primary/5 rounded-t-md'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30'
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.name}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Store Legal Details</CardTitle>
            <CardDescription className="text-xs">
              Printed on customer tax invoices and KOT slips
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Trade / Brand Name</label>
              <Input
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Legal Company Name</label>
              <Input
                value={profile.legalName}
                onChange={(e) => setProfile({ ...profile, legalName: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">GSTIN</label>
              <Input
                value={profile.gstin}
                onChange={(e) => setProfile({ ...profile, gstin: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">FSSAI License</label>
              <Input
                value={profile.fssaiNumber}
                onChange={(e) => setProfile({ ...profile, fssaiNumber: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Primary Contact Phone</label>
              <Input
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Official Email</label>
              <Input
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-muted-foreground">Street Address</label>
              <Input
                value={profile.line1}
                onChange={(e) => setProfile({ ...profile, line1: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">City & State</label>
              <Input
                value={`${profile.city}, ${profile.state} (${profile.stateCode})`}
                disabled
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Pincode</label>
              <Input
                value={profile.pincode}
                onChange={(e) => setProfile({ ...profile, pincode: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Taxes Tab */}
      {activeTab === 'taxes' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Configured Tax Groups</CardTitle>
              <CardDescription className="text-xs">
                CGST, SGST and IGST rules assigned to menu categories
              </CardDescription>
            </div>
            <Button size="sm">Add Tax Slab</Button>
          </CardHeader>
          <CardContent>
            <div className="divide-y border rounded-lg overflow-hidden">
              {taxGroups.map((t) => (
                <div key={t.id} className="p-4 flex items-center justify-between bg-card">
                  <div>
                    <p className="font-semibold text-sm">{t.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Rate: {t.rate}% (CGST {t.cgst}% + SGST {t.sgst}%) — {t.isInclusive ? 'Inclusive' : 'Exclusive'}
                    </p>
                  </div>
                  <Badge variant="secondary">Active</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Printers Tab */}
      {activeTab === 'printers' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Thermal Printer Registry</CardTitle>
              <CardDescription className="text-xs">
                ESC/POS network and local printers for bills and kitchen orders
              </CardDescription>
            </div>
            <Button size="sm">Add New Printer</Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {printers.map((p) => (
                <div key={p.id} className="p-4 border rounded-lg space-y-3 bg-card">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">{p.name}</span>
                    <Badge variant={p.role === 'BILL_RECEIPT' ? 'default' : 'secondary'}>
                      {p.role}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>Type: {p.type}</p>
                    <p>Address: {p.ip}</p>
                  </div>
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    Dispatch Test Print
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Devices Tab */}
      {activeTab === 'devices' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Active Terminals & Devices</CardTitle>
              <CardDescription className="text-xs">
                Authorised counter systems and waiter handheld tablets
              </CardDescription>
            </div>
            <Button size="sm">Register New Device</Button>
          </CardHeader>
          <CardContent>
            <div className="divide-y border rounded-lg overflow-hidden">
              {devices.map((d) => (
                <div key={d.id} className="p-4 flex items-center justify-between bg-card">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{d.name}</span>
                      <Badge variant="outline" className="font-mono text-xs">{d.code}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{d.type}</p>
                  </div>
                  <Badge variant={d.status === 'Online' ? 'default' : 'secondary'}>
                    {d.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Modes Tab */}
      {activeTab === 'payments' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Accepted Tender Methods</CardTitle>
            <CardDescription className="text-xs">
              Toggle payment modes available at POS counter
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="divide-y border rounded-lg overflow-hidden">
              {paymentModes.map((m) => (
                <div key={m.id} className="p-4 flex items-center justify-between bg-card">
                  <div>
                    <p className="font-semibold text-sm">{m.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Drawer trigger: {m.opensDrawer ? 'Yes (Cash Drawer Kicks)' : 'No'}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant={m.enabled ? 'outline' : 'secondary'}
                    onClick={() => {
                      setPaymentModes(
                        paymentModes.map((x) =>
                          x.id === m.id ? { ...x, enabled: !x.enabled } : x
                        )
                      );
                    }}
                  >
                    {m.enabled ? 'Enabled' : 'Disabled'}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
