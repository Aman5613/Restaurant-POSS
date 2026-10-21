import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Search, Shield, KeyRound, Trash2 } from 'lucide-react';
import { ROLES } from '@pos/shared';

export function UsersPage() {
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Mock list for UI presentation in Phase 1
  const [users, setUsers] = useState([
    {
      id: 'u1',
      name: 'Aman Sharma',
      phone: '9999999999',
      role: ROLES.ADMIN,
      isActive: true,
      hasPin: true,
    },
    {
      id: 'u2',
      name: 'Rohan Mehra',
      phone: '8888888888',
      role: ROLES.MANAGER,
      isActive: true,
      hasPin: true,
    },
    {
      id: 'u3',
      name: 'Suresh Kumar',
      phone: '7777777777',
      role: ROLES.BILLER,
      isActive: true,
      hasPin: true,
    },
    {
      id: 'u4',
      name: 'Vikas Patel',
      phone: '6666666666',
      role: ROLES.CAPTAIN,
      isActive: true,
      hasPin: true,
    },
  ]);

  const [newUser, setNewUser] = useState({
    name: '',
    phone: '',
    role: ROLES.CAPTAIN,
    pin: '',
    password: '',
  });

  const handleAddUser = (e) => {
    e.preventDefault();
    if (!newUser.name || !newUser.phone) return;

    setUsers([
      ...users,
      {
        id: `u_${Date.now()}`,
        name: newUser.name,
        phone: newUser.phone,
        role: newUser.role,
        isActive: true,
        hasPin: Boolean(newUser.pin),
      },
    ]);

    setNewUser({ name: '', phone: '', role: ROLES.CAPTAIN, pin: '', password: '' });
    setIsAddModalOpen(false);
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.phone.includes(search);
    const matchesRole = selectedRole === 'ALL' || u.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Staff & Roles Management</h1>
          <p className="text-sm text-muted-foreground">
            Configure access control, operator PINs, and employee permissions
          </p>
        </div>

        <Button onClick={() => setIsAddModalOpen(true)}>
          <UserPlus className="h-4 w-4 mr-1.5" />
          Add Team Member
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or phone..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {['ALL', ROLES.ADMIN, ROLES.MANAGER, ROLES.BILLER, ROLES.CAPTAIN].map((r) => (
            <Button
              key={r}
              variant={selectedRole === r ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedRole(r)}
              className="text-xs uppercase"
            >
              {r}
            </Button>
          ))}
        </div>
      </div>

      {/* User Table Card */}
      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{user.name}</span>
                      <Badge
                        variant={
                          user.role === ROLES.ADMIN
                            ? 'default'
                            : user.role === ROLES.MANAGER
                            ? 'secondary'
                            : 'outline'
                        }
                        className="text-xs capitalize"
                      >
                        {user.role}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      <span>📱 {user.phone}</span>
                      {user.hasPin && (
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                          <KeyRound className="h-3 w-3" /> Quick PIN Active
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="text-xs">
                    Edit
                  </Button>
                  {user.role !== ROLES.ADMIN && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => setUsers(users.filter((u) => u.id !== user.id))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Role Permission Matrix Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Standard Permission Matrix (Overview)
          </CardTitle>
          <CardDescription className="text-xs">
            Role capabilities configured per Restaurant POS MVP specification
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="p-2.5 font-semibold">Permission Action</th>
                  <th className="p-2.5 font-semibold text-center">Admin</th>
                  <th className="p-2.5 font-semibold text-center">Manager</th>
                  <th className="p-2.5 font-semibold text-center">Biller</th>
                  <th className="p-2.5 font-semibold text-center">Captain</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="p-2.5 font-medium">Take & Punch Orders</td>
                  <td className="p-2.5 text-center text-emerald-600">✓</td>
                  <td className="p-2.5 text-center text-emerald-600">✓</td>
                  <td className="p-2.5 text-center text-emerald-600">✓</td>
                  <td className="p-2.5 text-center text-emerald-600">✓</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-medium">Generate Bills & Settle Payment</td>
                  <td className="p-2.5 text-center text-emerald-600">✓</td>
                  <td className="p-2.5 text-center text-emerald-600">✓</td>
                  <td className="p-2.5 text-center text-emerald-600">✓</td>
                  <td className="p-2.5 text-center text-muted-foreground">—</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-medium">Cancel Item After KOT Punch</td>
                  <td className="p-2.5 text-center text-emerald-600">✓</td>
                  <td className="p-2.5 text-center text-amber-600">Override Only</td>
                  <td className="p-2.5 text-center text-muted-foreground">—</td>
                  <td className="p-2.5 text-center text-muted-foreground">—</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-medium">Void Paid Bill / Issue Credit Note</td>
                  <td className="p-2.5 text-center text-emerald-600">✓</td>
                  <td className="p-2.5 text-center text-amber-600">Override Only</td>
                  <td className="p-2.5 text-center text-muted-foreground">—</td>
                  <td className="p-2.5 text-center text-muted-foreground">—</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-medium">Configure Menu, Prices & Slabs</td>
                  <td className="p-2.5 text-center text-emerald-600">✓</td>
                  <td className="p-2.5 text-center text-emerald-600">✓</td>
                  <td className="p-2.5 text-center text-muted-foreground">—</td>
                  <td className="p-2.5 text-center text-muted-foreground">—</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md bg-card border shadow-2xl">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Add Team Member</CardTitle>
              <CardDescription className="text-xs">
                Create user credentials for terminal and handheld access
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleAddUser}>
              <CardContent className="space-y-3.5">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Full Name</label>
                  <Input
                    placeholder="e.g. Rahul Sharma"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Phone Number (10 Digits)</label>
                  <Input
                    placeholder="9876543210"
                    value={newUser.phone}
                    onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Assigned Role</label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  >
                    <option value={ROLES.CAPTAIN}>Captain / Floor Waiter</option>
                    <option value={ROLES.BILLER}>Biller / Counter Cashier</option>
                    <option value={ROLES.MANAGER}>Store Manager</option>
                    <option value={ROLES.ADMIN}>Admin / Outlet Owner</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Quick 4-Digit PIN</label>
                  <Input
                    type="password"
                    maxLength={6}
                    placeholder="e.g. 1234"
                    value={newUser.pin}
                    onChange={(e) => setNewUser({ ...newUser, pin: e.target.value })}
                  />
                </div>
              </CardContent>
              <div className="flex justify-end gap-2 border-t p-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Save User</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
