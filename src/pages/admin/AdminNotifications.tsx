import { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Mail, Plus, Trash2, Loader2, Bell } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function AdminNotifications() {
  const queryClient = useQueryClient();
  const [newEmail, setNewEmail] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const { data: emails, isLoading } = useQuery({
    queryKey: ['admin-notification-emails'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_notification_emails')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const handleAdd = async () => {
    if (!newEmail) return;
    setIsAdding(true);
    try {
      const { error } = await supabase.from('admin_notification_emails').insert({
        email_address: newEmail.trim(),
      });
      if (error) throw error;
      toast.success('Email added');
      setNewEmail('');
      queryClient.invalidateQueries({ queryKey: ['admin-notification-emails'] });
    } catch {
      toast.error('Failed to add');
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggle = async (id: string, field: string, value: boolean) => {
    try {
      const { error } = await supabase
        .from('admin_notification_emails')
        .update({ [field]: value, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['admin-notification-emails'] });
    } catch {
      toast.error('Failed to update');
    }
  };

  const handleRemove = async (id: string) => {
    try {
      const { error } = await supabase.from('admin_notification_emails').delete().eq('id', id);
      if (error) throw error;
      toast.success('Removed');
      queryClient.invalidateQueries({ queryKey: ['admin-notification-emails'] });
    } catch {
      toast.error('Failed to remove');
    }
  };

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">Platform Notifications</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage email addresses for platform-wide webhook alerts</p>
      </div>

      <div className="max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Alert Email Addresses
            </CardTitle>
            <CardDescription>
              These emails receive alerts for payment failures, chargebacks, high-risk transactions, and refunds across all merchants.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="fraud-team@everpayinc.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="bg-background border-border"
              />
              <Button onClick={handleAdd} disabled={isAdding || !newEmail}>
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : !emails?.length ? (
              <p className="text-sm text-muted-foreground py-4">No notification emails configured yet.</p>
            ) : (
              <div className="space-y-3">
                {emails.map((e: any) => (
                  <div key={e.id} className="rounded-lg border border-border p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-foreground">{e.email_address}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={e.enabled}
                          onCheckedChange={(v) => handleToggle(e.id, 'enabled', v)}
                        />
                        <Button variant="ghost" size="sm" onClick={() => handleRemove(e.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { key: 'notify_on_success', label: 'Success' },
                        { key: 'notify_on_failure', label: 'Failure' },
                        { key: 'notify_on_refund', label: 'Refund' },
                        { key: 'notify_on_chargeback', label: 'Chargeback' },
                        { key: 'notify_on_high_risk', label: 'High Risk' },
                      ].map(({ key, label }) => (
                        <Badge
                          key={key}
                          variant={e[key] ? 'default' : 'outline'}
                          className="cursor-pointer"
                          onClick={() => handleToggle(e.id, key, !e[key])}
                        >
                          {label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
