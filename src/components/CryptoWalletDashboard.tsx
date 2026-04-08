import { useState } from 'react';
import { Bitcoin, Wallet, RefreshCw, ArrowDownLeft, Copy, Loader2, Plus, QrCode, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useElektropayWallets, useElektropayWithdrawals, useElektropayPayments, useElektropayDeposits,
  useSyncElektropayBalances, useCreateCryptoWithdrawal, useProvisionCryptoWallet, useCreateCryptoDeposit,
} from '@/hooks/useElektropay';
import { formatDate } from '@/lib/format';
import { toast } from 'sonner';

const CRYPTO_ICONS: Record<string, string> = {
  'BTC': '₿', 'ETH': 'Ξ', 'USDT': '₮', 'USDC': '$', 'LTC': 'Ł', 'TRX': '◈', 'MATIC': '⬡', 'POL': '⬡',
};

export function CryptoWalletDashboard() {
  const { data: wallets = [], isLoading } = useElektropayWallets();
  const { data: withdrawals = [] } = useElektropayWithdrawals();
  const { data: payments = [] } = useElektropayPayments();
  const { data: deposits = [] } = useElektropayDeposits();
  const syncBalances = useSyncElektropayBalances();
  const createWithdrawal = useCreateCryptoWithdrawal();
  const provisionWallet = useProvisionCryptoWallet();
  const createDeposit = useCreateCryptoDeposit();

  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [withdrawAsset, setWithdrawAsset] = useState('');
  const [provisionOpen, setProvisionOpen] = useState(false);
  const [provisionAsset, setProvisionAsset] = useState('USDT.TRC20');
  const [depositOpen, setDepositOpen] = useState(false);
  const [depositAsset, setDepositAsset] = useState('USDT.TRC20');
  const [depositDescription, setDepositDescription] = useState('');
  const [depositTimeout, setDepositTimeout] = useState('24');

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

  const handleDeposit = async () => {
    await createDeposit.mutateAsync({
      crypto_currency: depositAsset,
      description: depositDescription,
      timeout: parseInt(depositTimeout) * 60,
    });
    setDepositOpen(false);
    setDepositDescription('');
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
            <p className="font-heading text-2xl font-bold text-foreground">${totalUsdBalance.toFixed(2)}</p>
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
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" variant="outline" className="gap-1.5 flex-1" onClick={() => syncBalances.mutate()}>
                <RefreshCw className={`h-3.5 w-3.5 ${syncBalances.isPending ? 'animate-spin' : ''}`} /> Sync
              </Button>
              <Dialog open={depositOpen} onOpenChange={setDepositOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="default" className="gap-1.5 flex-1"><ArrowDownLeft className="h-3.5 w-3.5" /> Deposit</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Deposit</DialogTitle>
                    <DialogDescription>Create a deposit address to receive crypto funds.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Crypto currency</Label>
                      <Select value={depositAsset} onValueChange={setDepositAsset}>
                        <SelectTrigger><SelectValue placeholder="Crypto currency" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USDT.TRC20">USDT (TRC-20)</SelectItem>
                          <SelectItem value="USDT.ERC20">USDT (ERC-20)</SelectItem>
                          <SelectItem value="USDC.ERC20">USDC (ERC-20)</SelectItem>
                          <SelectItem value="BTC">Bitcoin</SelectItem>
                          <SelectItem value="ETH">Ethereum</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea placeholder="Description" value={depositDescription} onChange={e => setDepositDescription(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Timeout (hours)</Label>
                      <Input type="number" value={depositTimeout} onChange={e => setDepositTimeout(e.target.value)} min="1" max="168" />
                    </div>
                    <div className="flex gap-2">
                      <Button className="flex-1" onClick={handleDeposit} disabled={createDeposit.isPending}>
                        {createDeposit.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Deposit
                      </Button>
                      <Button variant="outline" className="flex-1" onClick={() => setDepositOpen(false)}>Cancel</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Dialog open={provisionOpen} onOpenChange={setProvisionOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="gap-1.5 flex-1"><Plus className="h-3.5 w-3.5" /> New Wallet</Button>
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
            <Button onClick={() => setProvisionOpen(true)} className="gap-2"><Plus className="h-4 w-4" /> Create Wallet</Button>
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
                    <Button variant="default" size="sm" className="flex-1 gap-1.5" onClick={() => {
                      setDepositAsset(wallet.asset_id);
                      setDepositOpen(true);
                    }}>
                      <ArrowDownLeft className="h-3.5 w-3.5" /> Deposit
                    </Button>
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
            <DialogTitle>Withdraw</DialogTitle>
            <DialogDescription>Send crypto to an external wallet address.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Crypto currency</Label>
              <Select value={withdrawAsset} onValueChange={setWithdrawAsset}>
                <SelectTrigger><SelectValue placeholder="Crypto currency" /></SelectTrigger>
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
            <div className="flex gap-2">
              <Button className="flex-1" onClick={handleWithdraw} disabled={createWithdrawal.isPending}>
                {createWithdrawal.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                Withdraw
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => setWithdrawOpen(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transaction History Tabs */}
      <Tabs defaultValue="payments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="deposits">Deposits</TabsTrigger>
          <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="payments">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Payments</CardTitle>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">No records</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date and time</TableHead>
                      <TableHead>Payment ID</TableHead>
                      <TableHead>Order amount</TableHead>
                      <TableHead>Currency</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.filter((p: any) => p.payment_type !== 'DEPOSIT').slice(0, 20).map((p: any) => (
                      <TableRow key={p.id}>
                        <TableCell className="text-xs">{formatDate(p.created_at)}</TableCell>
                        <TableCell className="font-mono text-xs">{p.elektropay_payment_id?.slice(0, 12)}...</TableCell>
                        <TableCell className="font-mono">{parseFloat(p.fiat_amount).toFixed(2)}</TableCell>
                        <TableCell>{p.fiat_currency}</TableCell>
                        <TableCell><Badge variant={p.status === 'complete' ? 'default' : p.status === 'cancel' ? 'destructive' : 'secondary'}>{p.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deposits">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Deposits</CardTitle>
              <Button size="sm" variant="default" className="gap-1.5" onClick={() => setDepositOpen(true)}>
                <Plus className="h-3.5 w-3.5" /> Deposit
              </Button>
            </CardHeader>
            <CardContent>
              {deposits.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">No records</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date and time</TableHead>
                      <TableHead>Deposit ID</TableHead>
                      <TableHead>Amount in crypto</TableHead>
                      <TableHead>Currency</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deposits.slice(0, 20).map((d: any) => (
                      <TableRow key={d.id}>
                        <TableCell className="text-xs">{formatDate(d.created_at)}</TableCell>
                        <TableCell className="font-mono text-xs">{d.elektropay_payment_id?.slice(0, 12)}...</TableCell>
                        <TableCell className="font-mono">{parseFloat(d.crypto_amount || '0').toFixed(8)}</TableCell>
                        <TableCell>{d.crypto_currency}</TableCell>
                        <TableCell><Badge variant={d.status === 'complete' ? 'default' : d.status === 'cancel' ? 'destructive' : 'secondary'}>{d.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="withdrawals">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Withdrawals</CardTitle>
              <Button size="sm" variant="default" className="gap-1.5" onClick={() => setWithdrawOpen(true)}>
                <Plus className="h-3.5 w-3.5" /> Withdraw
              </Button>
            </CardHeader>
            <CardContent>
              {withdrawals.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">No records</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date and time</TableHead>
                      <TableHead>Withdraw ID</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {withdrawals.slice(0, 20).map((w: any) => (
                      <TableRow key={w.id}>
                        <TableCell className="text-xs">{formatDate(w.created_at)}</TableCell>
                        <TableCell className="font-mono text-xs">{w.elektropay_withdraw_id?.slice(0, 12)}...</TableCell>
                        <TableCell className="font-mono">{parseFloat(w.amount).toFixed(8)} {w.asset_id}</TableCell>
                        <TableCell><code className="text-xs">{w.destination_address?.slice(0, 12)}...</code></TableCell>
                        <TableCell><Badge variant={w.status === 'complete' ? 'default' : w.status === 'cancel' ? 'destructive' : 'secondary'}>{w.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader><CardTitle className="text-lg">History</CardTitle></CardHeader>
            <CardContent>
              {[...payments, ...withdrawals.map((w: any) => ({ ...w, payment_type: 'WITHDRAWAL' }))].length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">No records</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date and time</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Currency</TableHead>
                      <TableHead>Network</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      ...payments.map((p: any) => ({ ...p, _type: p.payment_type || 'PAYMENT', _date: p.created_at })),
                      ...withdrawals.map((w: any) => ({ ...w, _type: 'WITHDRAWAL', _date: w.created_at, crypto_currency: w.asset_id })),
                    ]
                      .sort((a, b) => new Date(b._date).getTime() - new Date(a._date).getTime())
                      .slice(0, 30)
                      .map((item: any, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-xs">{formatDate(item._date)}</TableCell>
                          <TableCell><Badge variant="outline" className="text-xs">{item._type}</Badge></TableCell>
                          <TableCell className="font-mono">{parseFloat(item.fiat_amount || item.amount || '0').toFixed(2)}</TableCell>
                          <TableCell>{item.crypto_currency || item.fiat_currency}</TableCell>
                          <TableCell className="text-xs">{item.crypto_network || '—'}</TableCell>
                          <TableCell><Badge variant={item.status === 'complete' ? 'default' : item.status === 'cancel' ? 'destructive' : 'secondary'}>{item.status}</Badge></TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
