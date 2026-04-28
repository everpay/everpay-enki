import { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { externalProxy } from '@/hooks/useExternalData';
import { Search, MoreHorizontal, Trash2, Power, PowerOff } from 'lucide-react';
import { NewSinceBadge } from '@/components/admin/NewSinceBadge';
import { SyncNowButton } from '@/components/admin/SyncNowButton';
import { useNewSinceLastVisit } from '@/hooks/useNewSinceLastVisit';

interface User {
  id: string;
  user_id: string;
  display_name?: string;
  email?: string;
  created_at: string;
  role?: string;
  status?: string;
}

const ALL_ROLES = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'merchant', label: 'Merchant' },
  { value: 'reseller', label: 'Reseller' },
  { value: 'agent', label: 'Agent' },
  { value: 'user', label: 'User' },
];

export default function AdminUsers() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const { countNew, markVisited } = useNewSinceLastVisit('admin-users');
  const newCount = countNew(users);

  useEffect(() => { fetchUsers(); }, []);

  // Mark visited once data has rendered, so the badge resets next visit.
  useEffect(() => {
    if (!loading && users.length) {
      const t = setTimeout(() => markVisited(), 1500);
      return () => clearTimeout(t);
    }
  }, [loading, users.length, markVisited]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const result = await externalProxy({ action: 'list_users' });
      setUsers((result.data || []).map((u: any) => ({
        ...u,
        role: u.role || 'user',
        status: u.status || 'active',
      })));
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load users', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleUpdate = async (userId: string, newRole: string) => {
    try {
      await externalProxy({ action: 'update_user_role', user_id: userId, new_role: newRole });
      setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, role: newRole } : u));
      toast({ title: 'Success', description: 'User role updated' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update role', variant: 'destructive' });
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'deactivated' : 'active';
    try {
      await externalProxy({ action: 'toggle_user_status', user_id: userId, status: newStatus });
      setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, status: newStatus } : u));
      toast({ title: 'Success', description: `User ${newStatus === 'active' ? 'activated' : 'deactivated'}` });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update user status', variant: 'destructive' });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await externalProxy({ action: 'delete_user', user_id: userId });
      setUsers(prev => prev.filter(u => u.user_id !== userId));
      toast({ title: 'Success', description: 'User removed' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete user', variant: 'destructive' });
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = (u.display_name || '').toLowerCase().includes(searchTerm.toLowerCase()) || u.user_id.toLowerCase().includes(searchTerm.toLowerCase()) || (u.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'super_admin': return 'default' as const;
      case 'admin': return 'destructive' as const;
      case 'merchant': return 'secondary' as const;
      case 'reseller': return 'outline' as const;
      case 'agent': return 'outline' as const;
      default: return 'outline' as const;
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
              <NewSinceBadge count={newCount} label="new signups" />
            </div>
            <p className="text-muted-foreground">Manage user accounts, roles, and permissions</p>
          </div>
          <SyncNowButton onSynced={fetchUsers} />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
            <CardDescription>A list of all users with their roles and status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search users..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-8" />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filter by role" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {ALL_ROLES.map(r => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {loading ? <div className="text-center py-8">Loading users...</div> : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>User ID</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Change Role</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map(u => (
                      <TableRow key={u.id} className={u.status === 'deactivated' ? 'opacity-60' : ''}>
                        <TableCell className="font-medium">{u.display_name || 'N/A'}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{u.email || '—'}</TableCell>
                        <TableCell className="text-muted-foreground font-mono text-xs">{u.user_id.slice(0, 12)}...</TableCell>
                        <TableCell><Badge variant={getRoleBadgeVariant(u.role || 'user')}>{u.role || 'user'}</Badge></TableCell>
                        <TableCell>
                          <Badge
                            variant={u.status === 'active' ? 'outline' : 'destructive'}
                            className={u.status === 'active' ? 'border-emerald-500/30 text-emerald-600' : ''}
                          >
                            {u.status === 'active' ? 'Active' : 'Deactivated'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Select value={u.role || 'user'} onValueChange={v => handleRoleUpdate(u.user_id, v)}>
                            <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {ALL_ROLES.map(r => (
                                <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleToggleStatus(u.user_id, u.status || 'active')}>
                                {u.status === 'active'
                                  ? <><PowerOff className="h-4 w-4 mr-2" />Deactivate</>
                                  : <><Power className="h-4 w-4 mr-2" />Activate</>}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={e => e.preventDefault()}>
                                    <Trash2 className="h-4 w-4 mr-2" />Delete User
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>This will permanently remove this user's profile and role assignments.</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteUser(u.user_id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </DropdownMenuContent>
                          </DropdownMenu>
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
