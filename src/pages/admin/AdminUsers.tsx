import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Search, UserPlus, MoreHorizontal, Trash2, Power, PowerOff } from 'lucide-react';

interface User { id: string; user_id: string; display_name?: string; created_at: string; role?: string; }

export default function AdminUsers() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const [profilesRes, rolesRes] = await Promise.all([
        supabase.from('profiles').select('id, user_id, display_name, created_at').order('created_at', { ascending: false }),
        supabase.from('user_roles').select('user_id, role'),
      ]);
      if (profilesRes.error) throw profilesRes.error;
      const roleMap = new Map(rolesRes.data?.map(r => [r.user_id, r.role]) || []);
      setUsers((profilesRes.data || []).map(p => ({ ...p, role: roleMap.get(p.user_id) || 'user' })));
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load users', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleUpdate = async (userId: string, newRole: string) => {
    try {
      await supabase.from('user_roles').delete().eq('user_id', userId);
      const { error } = await supabase.from('user_roles').insert({ user_id: userId, role: newRole as any });
      if (error) throw error;
      setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, role: newRole } : u));
      toast({ title: 'Success', description: 'User role updated' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update role', variant: 'destructive' });
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = (u.display_name || '').toLowerCase().includes(searchTerm.toLowerCase()) || u.user_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleBadgeVariant = (role: string) => {
    switch (role) { case 'super_admin': return 'default'; case 'admin': return 'destructive'; case 'merchant': return 'secondary'; default: return 'outline'; }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div><h1 className="text-3xl font-bold tracking-tight">User Management</h1><p className="text-muted-foreground">Manage user accounts, roles, and permissions</p></div>
        </div>
        <Card>
          <CardHeader><CardTitle>All Users</CardTitle><CardDescription>A list of all users with their roles</CardDescription></CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 mb-6">
              <div className="relative flex-1"><Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search users..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-8" /></div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filter by role" /></SelectTrigger>
                <SelectContent><SelectItem value="all">All Roles</SelectItem><SelectItem value="super_admin">Super Admin</SelectItem><SelectItem value="admin">Admin</SelectItem><SelectItem value="merchant">Merchant</SelectItem><SelectItem value="user">User</SelectItem></SelectContent>
              </Select>
            </div>
            {loading ? <div className="text-center py-8">Loading users...</div> : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>User ID</TableHead><TableHead>Role</TableHead><TableHead>Created</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {filteredUsers.map(u => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.display_name || 'N/A'}</TableCell>
                        <TableCell className="text-muted-foreground font-mono text-xs">{u.user_id.slice(0, 12)}...</TableCell>
                        <TableCell><Badge variant={getRoleBadgeVariant(u.role || 'user')}>{u.role || 'user'}</Badge></TableCell>
                        <TableCell className="text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Select value={u.role || 'user'} onValueChange={v => handleRoleUpdate(u.user_id, v)}>
                            <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="super_admin">Super Admin</SelectItem><SelectItem value="admin">Admin</SelectItem><SelectItem value="merchant">Merchant</SelectItem><SelectItem value="user">User</SelectItem></SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            {filteredUsers.length === 0 && !loading && <div className="text-center py-8 text-muted-foreground">No users found.</div>}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
