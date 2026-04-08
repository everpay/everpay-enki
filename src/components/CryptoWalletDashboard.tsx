import { useState } from 'react';
import { Bitcoin, Wallet, RefreshCw, ArrowUpRight, ArrowDownLeft, Copy, ExternalLink, Loader2, Plus, QrCode, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useElektropayWallets, useElektropayWithdrawals, useSyncElektropayBalances, useCreateCryptoWithdrawal, useProvisionCryptoWallet } from '@/hooks/useElektropay';
import { formatDate } from '@/lib/format';
import { toast } from 'sonner';

const CRYPTO_ICONS: Record<string, string> = {
  'BTC': '₿', 'ETH': 'Ξ', 'USDT': '₮', 'USDC': '$', 'LTC': 'Ł', 'TRX': '◈', 'MATIC': '⬡', 'POL': '⬡',
};

export function CryptoWalletDashboard() {
  const { data: wallets = [], isLoading } = useElektropayWallets();
  const { data: withdrawals = [] } = useElektropayWithdrawals();
  const syncBalances = useSyncElektropayBalances();
  const createWithdrawal = useCreateCryptoWithdrawal();
  const provisionWallet = useProvisionCryptoWallet();

  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [withdrawAsset, setWithdrawAsset] = useState('');
  const [provisionOpen, setProvisionOpen] = useState(false);
  const [provisionAsset, setProvisionAsset] = useState('USDT.TRC20');

  const totalUsdBalance = wallets.reduce((sum: number, w: any) => sum + parseFloat(w.base_balance || '0'), 0);

  const handleWithdraw = async () => {
    if (!withdrawAmount || !withdrawAddress || !withdrawAsset) {
      toast.error('Please fill in all fields'); return;
    }
    await createWithdrawal.mutateAsync({
      amount: parseFloat(withdrawAmount),
      asset_id: withdrawAsset,
      address: withdrawAddress,
    });
    setWithdrawOpen(false);
    setWithdrawAmount('');
    setWithdrawAddress('');
  };

  const handleProvision = async () => {
    await provisionWallet.mutateAsync({
      asset_id: provisionAsset,
      payer_email: '',
      payer_name: '',
    });
    setProvisionOpen(false);
  };

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast.success('Address copied');
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-primary/10"><Bitcoin className="h-5 w-5 text-primary" /></div>
              <span className="text-sm text-muted-foreground">Total Crypto (USD eq.)</span>
            </div>
            <p className="font-heading text-2xl font-bold text-foreground">
              ${totalUsdBalance.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-success/10"><Wallet className="h-5 w-5 text-success" /></div>
              <span className="text-sm text-muted-foreground">Active Wallets</span>
            </div>
            <p className="font-heading text-2xl font-bold text-foreground">{wallets.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 flex flex-col justify-between h-full">
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="gap-1.5 flex-1" onClick={() => syncBalances.mutate()}>
                <RefreshCw className={`h-3.5 w-3.5 ${syncBalances.isPending ? 'animate-spin' : ''}`} />
                Sync
              </Button>
              <Dialog open={provisionOpen} onOpenChange={setProvisionOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1.5 flex-1"><Plus className="h-3.5 w-3.5" /> New Wallet</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Provision Crypto Wallet</DialogTitle>
                    <DialogDescription>Create a dedicated address for receiving crypto payments.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Cryptocurrency</Label>
                      <Select value={provisionAsset} onValueChange={setProvisionAsset}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USDT.TRC20">USDT (TRC-20)</SelectItem>
                          <SelectItem value="USDT.ERC20">USDT (ERC-20)</SelectItem>
                          <SelectItem value="USDC.ERC20">USDC (ERC-20)</SelectItem>
                          <SelectItem value="BTC">Bitcoin</SelectItem>
                          <SelectItem value="ETH">Ethereum</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button className="w-full" onClick={handleProvision} disabled={provisionWallet.isPending}>
                      {provisionWallet.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Create Wallet
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Wallet Cards */}
      {isLoading ? (
        <div className="flex items-center justify-center p-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : wallets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12">
            <div className="p-4 rounded-full bg-muted mb-4"><Bitcoin className="h-8 w-8 text-muted-foreground" /></div>
            <p className="text-muted-foreground mb-2">No crypto wallets yet</p>
            <p className="text-sm text-muted-foreground mb-4">Create a wallet to start receiving crypto payments</p>
            <Button onClick={() => setProvisionOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" /> Create Wallet
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {wallets.map((wallet: any) => {
            const ticker = wallet.currency || wallet.asset_id?.split('.')[0];
            const icon = CRYPTO_ICONS[ticker] || '💰';
            return (
              <Card key={wallet.id} className="hover:border-primary/50 transition-colors">
                <CardContent className="pt-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{icon}</span>
                      <div>
                        <h3 className="font-heading font-bold text-foreground">{wallet.asset_id}</h3>
                        <p className="text-xs text-muted-foreground">{wallet.crypto_network_name || wallet.crypto_network}</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs">Elektropay</Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Balance</span>
                      <span className="font-mono font-bold">{parseFloat(wallet.balance || '0').toFixed(8)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Available</span>
                      <span className="font-mono text-success">{parseFloat(wallet.available || '0').toFixed(8)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">USD Value</span>
                      <span className="font-mono">${parseFloat(wallet.base_balance || '0').toFixed(2)}</span>
                    </div>
                  </div>

                  {wallet.wallet_address && (
                    <div className="mt-3 rounded-lg bg-muted/50 p-2">
                      <div className="flex items-center gap-1">
                        <code className="text-[10px] font-mono truncate flex-1">{wallet.wallet_address}</code>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => copyAddress(wallet.wallet_address)}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => {
                      setWithdrawAsset(wallet.asset_id);
                      setWithdrawOpen(true);
                    }}>
                      <Send className="h-3.5 w-3.5" /> Withdraw
                    </Button>
                    {wallet.wallet_address && (
                      <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => copyAddress(wallet.wallet_address)}>
                        <QrCode className="h-3.5 w-3.5" /> Deposit
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Withdrawal Dialog */}
      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Withdraw Crypto</DialogTitle>
            <DialogDescription>Send crypto to an external wallet address.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Asset</Label>
              <Select value={withdrawAsset} onValueChange={setWithdrawAsset}>
                <SelectTrigger><SelectValue placeholder="Select asset" /></SelectTrigger>
                <SelectContent>
                  {wallets.map((w: any) => (
                    <SelectItem key={w.asset_id} value={w.asset_id}>{w.asset_id} (Avail: {parseFloat(w.available || '0').toFixed(8)})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input type="number" placeholder="0.00" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} step="0.00000001" />
            </div>
            <div className="space-y-2">
              <Label>Destination Address</Label>
              <Input placeholder="Enter wallet address" value={withdrawAddress} onChange={e => setWithdrawAddress(e.target.value)} />
            </div>
            <Button className="w-full" onClick={handleWithdraw} disabled={createWithdrawal.isPending}>
              {createWithdrawal.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
              Withdraw
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Recent Withdrawals */}
      {withdrawals.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Recent Withdrawals</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {withdrawals.slice(0, 10).map((w: any) => (
                  <TableRow key={w.id}>
                    <TableCell className="font-mono">{w.asset_id}</TableCell>
                    <TableCell className="font-mono">{parseFloat(w.amount).toFixed(8)}</TableCell>
                    <TableCell><code className="text-xs">{w.destination_address?.slice(0, 12)}...</code></TableCell>
                    <TableCell>
                      <Badge variant={w.status === 'complete' ? 'default' : w.status === 'cancel' ? 'destructive' : 'secondary'}>
                        {w.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDate(w.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
