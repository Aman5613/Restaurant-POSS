import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ShieldAlert,
  Search,
  Clock,
  RefreshCw,
  Building2,
  Store,
  FileCheck,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/stores/auth-store';
import { apiClient } from '@/lib/api-client';

const EVENT_COLORS = {
  OWNER_CREATED: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  OWNER_STATUS_CHANGED: 'bg-amber-100 text-amber-800 border-amber-300',
  TENANT_PROVISIONED: 'bg-blue-100 text-blue-800 border-blue-300',
  SUPER_ADMIN_LOGIN: 'bg-purple-100 text-purple-800 border-purple-300',
  OUTLET_UPI_CONFIGURED: 'bg-teal-100 text-teal-800 border-teal-300',
  VOID_BILL: 'bg-rose-100 text-rose-800 border-rose-300',
  CANCEL_LINE: 'bg-rose-100 text-rose-800 border-rose-300',
  REPRINT_KOT: 'bg-orange-100 text-orange-800 border-orange-300',
  DISCOUNT_OVERRIDE: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  DAY_OPEN: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  DAY_CLOSE: 'bg-slate-100 text-slate-800 border-slate-300',
};

const PLATFORM_FILTERS = [
  { id: '', label: 'All Platform Events' },
  { id: 'OWNER_CREATED', label: 'Owner Provisioned' },
  { id: 'OWNER_STATUS_CHANGED', label: 'Status Updates' },
  { id: 'TENANT_PROVISIONED', label: 'Tenant Onboarding' },
  { id: 'SUPER_ADMIN_LOGIN', label: 'Super Admin Access' },
  { id: 'OUTLET_UPI_CONFIGURED', label: 'UPI Gateways' },
];

const OUTLET_FILTERS = [
  { id: '', label: 'All Outlet Events' },
  { id: 'VOID_BILL', label: 'Bill Voids' },
  { id: 'CANCEL_LINE', label: 'Item Cancels' },
  { id: 'REPRINT_KOT', label: 'KOT Reprints' },
  { id: 'DISCOUNT_OVERRIDE', label: 'Overrides' },
  { id: 'DAY_OPEN', label: 'Day Opens' },
  { id: 'DAY_CLOSE', label: 'Day Closes' },
];

export function AuditLogPage() {
  const { user } = useAuthStore();
  const isSuperAdminUser = user?.role === 'super-admin';

  const [activeScope, setActiveScope] = useState(isSuperAdminUser ? 'platform' : 'outlet');
  const [selectedEvent, setSelectedEvent] = useState('');
  const [search, setSearch] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['audit-logs', activeScope, selectedEvent],
    queryFn: async () => {
      const res = await apiClient.get('/v1/audit-logs', {
        params: {
          scope: activeScope,
          ...(selectedEvent ? { event: selectedEvent } : {}),
        },
      });
      return res.data?.data || [];
    },
  });

  const logs = data || [];
  const filteredLogs = logs.filter((log) => {
    if (!search) return true;
    const s = search.toLowerCase();
    const eventMatch = log.event?.toLowerCase().includes(s);
    const resourceMatch = log.resource?.toLowerCase().includes(s);
    const resourceIdMatch = log.resourceId?.toLowerCase().includes(s);
    const userMatch =
      typeof log.userId === 'object'
        ? log.userId?.name?.toLowerCase().includes(s) || log.userId?.role?.toLowerCase().includes(s)
        : String(log.userId || '').toLowerCase().includes(s);
    const metaMatch = JSON.stringify(log.metadata || '').toLowerCase().includes(s);
    return eventMatch || resourceMatch || resourceIdMatch || userMatch || metaMatch;
  });

  const availableFilters = activeScope === 'platform' ? PLATFORM_FILTERS : OUTLET_FILTERS;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto select-none">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <ShieldAlert className="h-6 w-6 text-rose-600" />
            {activeScope === 'platform' ? 'Platform Security & Audit Trail' : 'Outlet Security & Operations Audit Trail'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {activeScope === 'platform'
              ? 'Immutable log of platform onboarding, restaurant owners, tenant configurations, and super-admin actions.'
              : 'Immutable log of supervisor overrides, bill cancellations, line voids, KOT reprints, and cash day operations.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Super Admin can toggle between Platform and Outlet scope */}
          {isSuperAdminUser && (
            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setActiveScope('platform');
                  setSelectedEvent('');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  activeScope === 'platform'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                Platform Logs
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveScope('outlet');
                  setSelectedEvent('');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  activeScope === 'outlet'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Store className="w-3.5 h-3.5" />
                Outlet Logs
              </button>
            </div>
          )}

          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Scope Badge & Active Context */}
      <div className="flex items-center gap-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 p-3 rounded-xl shadow-xs">
        <FileCheck className="w-4 h-4 text-emerald-600" />
        <span>Current View:</span>
        <Badge variant="outline" className="font-bold text-[11px] bg-slate-50">
          {activeScope === 'platform' ? 'ENTERPRISE / SUPER-ADMIN' : 'OUTLET: SPICE GARDEN — BANDRA WEST'}
        </Badge>
        <span className="text-slate-300">•</span>
        <span className="text-slate-500">
          Showing <span className="font-bold text-slate-800">{filteredLogs.length}</span> recorded audit events
        </span>
      </div>

      {/* Search & Event Type Filters */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by event, resource, ID, staff or metadata..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {availableFilters.map((ev) => (
            <button
              key={ev.id}
              onClick={() => setSelectedEvent(ev.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors border ${
                selectedEvent === ev.id
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {ev.label}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Table */}
      <Card className="shadow-xs border-slate-200 overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 uppercase font-bold text-[11px]">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Event Type</th>
                  <th className="py-3 px-4">Operator / Staff</th>
                  <th className="py-3 px-4">Target Resource</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4">Details & Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                      <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-slate-400" />
                      Loading audit records...
                    </td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                      No security or audit events found matching the criteria.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log._id || log.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-500">
                        <div className="flex items-center gap-1.5 font-mono">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          {new Date(log.createdAt).toLocaleString('en-IN', {
                            dateStyle: 'short',
                            timeStyle: 'medium',
                          })}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-mono font-bold border ${
                            EVENT_COLORS[log.event] || 'bg-slate-100 text-slate-800 border-slate-200'
                          }`}
                        >
                          {log.event}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">
                          {typeof log.userId === 'object' ? log.userId?.name || 'System' : 'System'}
                        </div>
                        {typeof log.userId === 'object' && log.userId?.role && (
                          <div className="text-[10px] text-slate-400 uppercase font-medium">
                            {log.userId.role}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">{log.resource}</div>
                        {log.resourceId && (
                          <div className="text-[11px] text-slate-400 font-mono truncate max-w-[180px]">
                            ID: {log.resourceId}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-400 whitespace-nowrap">
                        {log.ipAddress || '127.0.0.1'}
                      </td>

                      <td className="py-3.5 px-4 max-w-md">
                        {log.metadata && Object.keys(log.metadata).length > 0 ? (
                          <pre className="text-[11px] font-mono bg-slate-50 border border-slate-200/80 p-2 rounded-lg text-slate-700 whitespace-pre-wrap break-all">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        ) : (
                          <span className="text-slate-400 font-mono">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
