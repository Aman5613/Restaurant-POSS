import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  UserPlus,
  Search,
  Shield,
  KeyRound,
  Trash2,
  Edit,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  Phone,
  Mail,
} from 'lucide-react';
import { ROLES } from '@pos/shared';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';

export function UsersPage() {
  const currentUser = useAuthStore((s) => s.user);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);

  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const [editingUser, setEditingUser] = useState(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState(null);

  // Add user form state
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phone: '',
    role: ROLES.CAPTAIN,
    pin: '',
    password: '',
  });

  const notify = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // Fetch real users from API
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/v1/users');
      const userList = Array.isArray(res?.data?.users)
        ? res.data.users
        : Array.isArray(res?.users)
        ? res.users
        : Array.isArray(res?.data)
        ? res.data
        : [];
      setUsers(userList);
    } catch (err) {
      setError(err.message || 'Failed to load staff list from server.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle Add User
  const handleAddUser = async (e) => {
    e.preventDefault();
    setFormError(null);

    const cleanPhone = newUser.phone.trim();
    if (!/^\d{10}$/.test(cleanPhone)) {
      setFormError('Phone number must be exactly 10 digits.');
      return;
    }

    if (newUser.pin && !/^\d{4,6}$/.test(newUser.pin.trim())) {
      setFormError('PIN must be 4 to 6 numeric digits.');
      return;
    }

    if (newUser.password && newUser.password.length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: newUser.name.trim(),
        phone: cleanPhone,
        role: newUser.role,
        outletId: currentUser?.outletId || undefined,
        isActive: true,
      };

      if (newUser.email?.trim()) {
        payload.email = newUser.email.trim();
      }
      if (newUser.pin?.trim()) {
        payload.pin = newUser.pin.trim();
      }
      if (newUser.password?.trim()) {
        payload.password = newUser.password.trim();
      }

      await apiClient.post('/v1/users', payload);
      notify(`Staff member "${newUser.name}" created successfully!`);
      setIsAddModalOpen(false);
      setNewUser({
        name: '',
        email: '',
        phone: '',
        role: ROLES.CAPTAIN,
        pin: '',
        password: '',
      });
      fetchUsers();
    } catch (err) {
      setFormError(err.data?.message || err.message || 'Failed to create user.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Edit User
  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    setFormError(null);

    const cleanPhone = editingUser.phone?.trim();
    if (cleanPhone && !/^\d{10}$/.test(cleanPhone)) {
      setFormError('Phone number must be exactly 10 digits.');
      return;
    }

    if (editingUser.pin && !/^\d{4,6}$/.test(editingUser.pin.trim())) {
      setFormError('PIN must be 4 to 6 numeric digits.');
      return;
    }

    if (editingUser.password && editingUser.password.trim().length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: editingUser.name.trim(),
        phone: cleanPhone,
        role: editingUser.role,
        isActive: editingUser.isActive !== false,
      };

      if (editingUser.email?.trim()) {
        payload.email = editingUser.email.trim();
      }
      if (editingUser.pin?.trim()) {
        payload.pin = editingUser.pin.trim();
      }
      if (editingUser.password?.trim()) {
        payload.password = editingUser.password.trim();
      }

      const userId = editingUser._id || editingUser.id;
      await apiClient.put(`/v1/users/${userId}`, payload);
      notify(`User "${editingUser.name}" updated successfully!`);
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      setFormError(err.data?.message || err.message || 'Failed to update user.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle user active status
  const handleToggleActive = async (user) => {
    const userId = user._id || user.id;
    const newStatus = !user.isActive;
    try {
      await apiClient.put(`/v1/users/${userId}`, { isActive: newStatus });
      notify(`User "${user.name}" ${newStatus ? 'activated' : 'deactivated'}.`);
      setUsers((prev) =>
        prev.map((u) => ((u._id || u.id) === userId ? { ...u, isActive: newStatus } : u))
      );
    } catch (err) {
      notify(err.data?.message || err.message || 'Action failed.', 'error');
    }
  };

  // Handle Delete User
  const handleDeleteUser = async () => {
    if (!deleteConfirmUser) return;
    const userId = deleteConfirmUser._id || deleteConfirmUser.id;
    setIsSubmitting(true);
    try {
      await apiClient.delete(`/v1/users/${userId}`);
      notify(`User "${deleteConfirmUser.name}" deleted.`);
      setDeleteConfirmUser(null);
      setUsers((prev) => prev.filter((u) => (u._id || u.id) !== userId));
    } catch (err) {
      notify(err.data?.message || err.message || 'Could not delete user.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Complete Data Isolation:
  // 1. Never show SUPER_ADMIN or super-admin in outlet employee view
  // 2. Strict tenant/outlet isolation: only show employees of the active outlet
  const filteredUsers = users.filter((u) => {
    if (u.role === ROLES.SUPER_ADMIN || u.role === 'super-admin') {
      return false;
    }

    if (currentUser?.outletId && u.outletId && u.outletId !== currentUser.outletId) {
      return false;
    }

    const q = search.toLowerCase();
    const matchesSearch =
      (u.name || '').toLowerCase().includes(q) ||
      (u.phone || '').includes(q) ||
      (u.email || '').toLowerCase().includes(q);
    const matchesRole = selectedRole === 'ALL' || u.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case ROLES.SUPER_ADMIN:
        return 'destructive';
      case ROLES.ADMIN:
        return 'default';
      case ROLES.MANAGER:
        return 'secondary';
      default:
        return 'outline';
    }
  };

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
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          )}
          <span>{notification.msg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Staff & Roles Management</h1>
          <p className="text-sm text-slate-500">
            Real staff data fetched from the API with PIN configuration and access control
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchUsers}
            disabled={isLoading}
            className="text-xs h-9"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setFormError(null);
              setIsAddModalOpen(true);
            }}
            className="text-xs h-9 bg-rose-600 hover:bg-rose-700 text-white font-semibold"
          >
            <UserPlus className="h-4 w-4 mr-1.5" />
            Add Team Member
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by name, phone or email..."
            className="pl-9 text-xs h-9 bg-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {['ALL', ROLES.ADMIN, ROLES.MANAGER, ROLES.BILLER, ROLES.CAPTAIN, ROLES.COOK].map((r) => (
            <Button
              key={r}
              variant={selectedRole === r ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedRole(r)}
              className={`text-xs uppercase whitespace-nowrap h-9 ${
                selectedRole === r ? 'bg-slate-900 text-white' : 'bg-white text-slate-700'
              }`}
            >
              {r}
            </Button>
          ))}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between font-medium">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <Button size="sm" variant="outline" onClick={fetchUsers} className="text-xs h-7">
            Retry
          </Button>
        </div>
      )}

      {/* Staff Table Card */}
      <Card className="border-slate-200 shadow-xs overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-16 text-center text-slate-500 space-y-2">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-rose-600" />
              <p className="text-xs font-semibold">Loading real staff members from API...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-16 text-center text-slate-500 space-y-2">
              <Shield className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-sm font-bold text-slate-800">No staff members found</p>
              <p className="text-xs text-slate-500">
                {search || selectedRole !== 'ALL'
                  ? 'No users match your search/filter criteria.'
                  : 'No users have been configured yet.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredUsers.map((user) => {
                const userId = user._id || user.id;
                const isSuper = user.role === ROLES.SUPER_ADMIN;
                const isAdmin = user.role === ROLES.ADMIN;

                return (
                  <div
                    key={userId}
                    className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-rose-100 text-rose-700 font-bold text-sm flex items-center justify-center shrink-0">
                        {(user.name || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-slate-900">{user.name}</span>
                          <Badge variant={getRoleBadgeVariant(user.role)} className="text-[10px] font-bold uppercase">
                            {user.role}
                          </Badge>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              user.isActive !== false
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-500 border border-slate-200'
                            }`}
                          >
                            {user.isActive !== false ? 'Active' : 'Inactive'}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap font-medium">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {user.phone}
                          </span>
                          {user.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3 text-slate-400" />
                              {user.email}
                            </span>
                          )}
                          {user.hasPin && (
                            <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                              <KeyRound className="h-3 w-3" /> Quick PIN Active
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-slate-600 hover:text-slate-900 h-8 gap-1"
                        onClick={() => {
                          setFormError(null);
                          setEditingUser({
                            ...user,
                            pin: '',
                          });
                        }}
                      >
                        <Edit className="w-3.5 h-3.5" />
                        Edit
                      </Button>

                      {!isSuper && !isAdmin && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-8"
                            onClick={() => handleToggleActive(user)}
                          >
                            {user.isActive !== false ? 'Deactivate' : 'Activate'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 h-8 w-8 p-0"
                            onClick={() => setDeleteConfirmUser(user)}
                            title="Delete user"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Role Permission Matrix Preview */}
      <Card className="border-slate-200 shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2 text-slate-900">
            <Shield className="h-4 w-4 text-rose-600" />
            Standard Role Permissions Matrix
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Operating capabilities enforced across POS terminals, Handheld tablets, and Management Hub
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b bg-slate-50 text-slate-700">
                  <th className="p-2.5 font-bold">Permission Action</th>
                  <th className="p-2.5 font-bold text-center">Admin</th>
                  <th className="p-2.5 font-bold text-center">Manager</th>
                  <th className="p-2.5 font-bold text-center">Biller</th>
                  <th className="p-2.5 font-bold text-center">Captain</th>
                  <th className="p-2.5 font-bold text-center">Cook</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                <tr>
                  <td className="p-2.5 font-semibold text-slate-800">Punch Table & Delivery Orders</td>
                  <td className="p-2.5 text-center text-emerald-600 font-bold">✓</td>
                  <td className="p-2.5 text-center text-emerald-600 font-bold">✓</td>
                  <td className="p-2.5 text-center text-emerald-600 font-bold">✓</td>
                  <td className="p-2.5 text-center text-emerald-600 font-bold">✓</td>
                  <td className="p-2.5 text-center text-slate-400">—</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-semibold text-slate-800">Generate Bills & Settle Payment</td>
                  <td className="p-2.5 text-center text-emerald-600 font-bold">✓</td>
                  <td className="p-2.5 text-center text-emerald-600 font-bold">✓</td>
                  <td className="p-2.5 text-center text-emerald-600 font-bold">✓</td>
                  <td className="p-2.5 text-center text-slate-400">—</td>
                  <td className="p-2.5 text-center text-slate-400">—</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-semibold text-slate-800">View Kitchen Display & Acknowledge KOTs</td>
                  <td className="p-2.5 text-center text-emerald-600 font-bold">✓</td>
                  <td className="p-2.5 text-center text-emerald-600 font-bold">✓</td>
                  <td className="p-2.5 text-center text-emerald-600 font-bold">✓</td>
                  <td className="p-2.5 text-center text-slate-400">—</td>
                  <td className="p-2.5 text-center text-emerald-600 font-bold">✓</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-semibold text-slate-800">Post-KOT Cancellation / Line Override</td>
                  <td className="p-2.5 text-center text-emerald-600 font-bold">✓</td>
                  <td className="p-2.5 text-center text-amber-600 font-bold">Override Only</td>
                  <td className="p-2.5 text-center text-slate-400">—</td>
                  <td className="p-2.5 text-center text-slate-400">—</td>
                  <td className="p-2.5 text-center text-slate-400">—</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-semibold text-slate-800">Manage Menu Catalog, Portions & Prices</td>
                  <td className="p-2.5 text-center text-emerald-600 font-bold">✓</td>
                  <td className="p-2.5 text-center text-emerald-600 font-bold">✓</td>
                  <td className="p-2.5 text-center text-slate-400">—</td>
                  <td className="p-2.5 text-center text-slate-400">—</td>
                  <td className="p-2.5 text-center text-slate-400">—</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <Card className="w-full max-w-md bg-white border border-slate-200 shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">Add Team Member</CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Create credentials for handheld terminal and POS access
                </CardDescription>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </CardHeader>
            <form onSubmit={handleAddUser}>
              <CardContent className="space-y-3.5">
                {formError && (
                  <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-slate-700">Full Name *</label>
                  <Input
                    placeholder="e.g. Rahul Sharma"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    required
                    className="text-xs h-9 mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-slate-700">Phone (10 Digits) *</label>
                    <Input
                      placeholder="9876543210"
                      value={newUser.phone}
                      maxLength={10}
                      onChange={(e) => setNewUser({ ...newUser, phone: e.target.value.replace(/\D/g, '') })}
                      required
                      className="text-xs h-9 mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700">Email (Optional)</label>
                    <Input
                      type="email"
                      placeholder="user@pos.internal"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      className="text-xs h-9 mt-1"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">Assigned Role *</label>
                  <select
                    className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 mt-1 focus:ring-1 focus:ring-rose-500 font-medium"
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  >
                    <option value={ROLES.CAPTAIN}>Captain / Floor Waiter</option>
                    <option value={ROLES.BILLER}>Biller / Counter Cashier</option>
                    <option value={ROLES.COOK}>Cook / Kitchen Chef</option>
                    <option value={ROLES.MANAGER}>Store Manager</option>
                    <option value={ROLES.ADMIN}>Admin / Outlet Owner</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-slate-700">Quick 4-6 Digit PIN</label>
                    <Input
                      type="password"
                      maxLength={6}
                      placeholder="e.g. 1234"
                      value={newUser.pin}
                      onChange={(e) => setNewUser({ ...newUser, pin: e.target.value.replace(/\D/g, '') })}
                      className="text-xs h-9 mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700">Password (Min 6 chars)</label>
                    <Input
                      type="password"
                      placeholder="Pos@12345"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      className="text-xs h-9 mt-1"
                    />
                  </div>
                </div>
              </CardContent>

              <div className="flex justify-end gap-2 border-t border-slate-100 p-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={isSubmitting}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting}
                  className="text-xs bg-rose-600 hover:bg-rose-700 text-white font-semibold"
                >
                  {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                  Save User
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <Card className="w-full max-w-md bg-white border border-slate-200 shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">Edit Team Member</CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Update role, phone, or set a new Quick PIN
                </CardDescription>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </CardHeader>
            <form onSubmit={handleUpdateUser}>
              <CardContent className="space-y-3.5">
                {formError && (
                  <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-slate-700">Full Name *</label>
                  <Input
                    value={editingUser.name || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                    required
                    className="text-xs h-9 mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-slate-700">Phone (10 Digits) *</label>
                    <Input
                      value={editingUser.phone || ''}
                      maxLength={10}
                      onChange={(e) =>
                        setEditingUser({ ...editingUser, phone: e.target.value.replace(/\D/g, '') })
                      }
                      required
                      className="text-xs h-9 mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700">Email</label>
                    <Input
                      type="email"
                      value={editingUser.email || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                      className="text-xs h-9 mt-1"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">Assigned Role</label>
                  <select
                    className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 mt-1 focus:ring-1 focus:ring-rose-500 font-medium"
                    value={editingUser.role}
                    disabled={editingUser.role === ROLES.SUPER_ADMIN}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                  >
                    <option value={ROLES.CAPTAIN}>Captain / Floor Waiter</option>
                    <option value={ROLES.BILLER}>Biller / Counter Cashier</option>
                    <option value={ROLES.COOK}>Cook / Kitchen Chef</option>
                    <option value={ROLES.MANAGER}>Store Manager</option>
                    <option value={ROLES.ADMIN}>Admin / Outlet Owner</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">
                    Reset Quick PIN (Leave blank to keep unchanged)
                  </label>
                  <Input
                    type="password"
                    maxLength={6}
                    placeholder="Enter new 4-6 digit PIN"
                    value={editingUser.pin || ''}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, pin: e.target.value.replace(/\D/g, '') })
                    }
                    className="text-xs h-9 mt-1"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">
                    Reset Password (Leave blank to keep unchanged)
                  </label>
                  <Input
                    type="password"
                    placeholder="Enter new password (min. 6 characters)"
                    value={editingUser.password || ''}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, password: e.target.value })
                    }
                    className="text-xs h-9 mt-1"
                  />
                </div>
              </CardContent>

              <div className="flex justify-end gap-2 border-t border-slate-100 p-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingUser(null)}
                  disabled={isSubmitting}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting}
                  className="text-xs bg-rose-600 hover:bg-rose-700 text-white font-semibold"
                >
                  {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                  Update User
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <Card className="w-full max-w-sm bg-white border border-slate-200 shadow-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold text-slate-900">Delete Team Member</CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Are you sure you want to delete <span className="font-bold text-slate-800">{deleteConfirmUser.name}</span>? This action cannot be undone.
              </CardDescription>
            </CardHeader>
            <div className="flex justify-end gap-2 p-4 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteConfirmUser(null)}
                disabled={isSubmitting}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                variant="destructive"
                disabled={isSubmitting}
                onClick={handleDeleteUser}
                className="text-xs bg-rose-600 hover:bg-rose-700 text-white font-semibold"
              >
                {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                Confirm Delete
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
