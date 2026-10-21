import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ShieldAlert,
  Search,
  Filter,
  Clock,
  User,
  FileText,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api-client';

const EVENT_COLORS = {
  VOID_BILL: 'destructive',
  CANCEL_LINE: 'destructive',
  REPRINT_KOT: 'secondary',
  DISCOUNT_OVERRIDE: 'default',
  DAY_OPEN: 'outline',
  DAY_CLOSE: 'outline',
};

export function AuditLogPage() {
  const [selectedEvent, setSelectedEvent] = useState('');
  const [search, setSearch] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['audit-logs', selectedEvent],
    queryFn: async () => {
      const res = await apiClient.get('/v1/audit-logs', {
        params: selectedEvent ? { event: selectedEvent } : {},
      });
      return res.data?.data || [];
    },
  });

  const logs = data || [];
  const filteredLogs = logs.filter((log) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      log.event?.toLowerCase().includes(s) ||
      log.resource?.toLowerCase().includes(s) ||
      log.resourceId?.toLowerCase().includes(s) ||
      log.userId?.name?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-primary" />
            Security & Exception Audit Trail
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Immutable log of supervisor overrides, bill cancellations, line voids, and day operations.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-1.5" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by event, resource ID, or staff..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          {[
            { id: '', label: 'All Events' },
            { id: 'VOID_BILL', label: 'Bill Voids' },
            { id: 'CANCEL_LINE', label: 'Item Cancels' },
            { id: 'REPRINT_KOT', label: 'KOT Reprints' },
            { id: 'DISCOUNT_OVERRIDE', label: 'Overrides' },
            { id: 'DAY_OPEN', label: 'Day Opens' },
            { id: 'DAY_CLOSE', label: 'Day Closes' },
          ].map((ev) => (
            <button
              key={ev.id}
              onClick={() => setSelectedEvent(ev.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedEvent === ev.id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted'
              }`}
            >
              {ev.label}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-muted/50 border-b text-xs text-muted-foreground uppercase font-medium">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Event Type</th>
                  <th className="py-3 px-4">Operator</th>
                  <th className="py-3 px-4">Target Resource</th>
                  <th className="py-3 px-4">Details / Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground text-xs">
                      Loading audit events...
                    </td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground text-xs">
                      No security or override events found matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log._id || log.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5 font-mono">
                          <Clock className="h-3 w-3" />
                          {new Date(log.createdAt).toLocaleString('en-IN', {
                            dateStyle: 'short',
                            timeStyle: 'medium',
                          })}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={EVENT_COLORS[log.event] || 'secondary'}
                          className="font-mono text-[11px]"
                        >
                          {log.event}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-xs text-foreground">
                          {log.userId?.name || 'System'}
                        </div>
                        {log.userId?.role && (
                          <div className="text-[10px] text-muted-foreground uppercase">
                            {log.userId.role}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-xs font-mono text-foreground">{log.resource}</div>
                        {log.resourceId && (
                          <div className="text-[11px] text-muted-foreground font-mono truncate max-w-xs">
                            ID: {log.resourceId}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs font-mono text-muted-foreground max-w-md">
                        {log.metadata ? (
                          <pre className="text-[11px] bg-muted/60 p-1.5 rounded overflow-x-auto whitespace-pre-wrap">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        ) : (
                          '—'
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
