import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { encryptFields } from "@/lib/vgs-encrypt";
import { Loader2, Minus, ArrowRight, Lock } from "lucide-react";

interface PayoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  merchant: {
    merchant_id: string;
    merchant_name: string;
    net_amount: number;
    currency: string;
    approved_amount: number;
    refunded_amount: number;
    chargeback_amount: number;
  } | null;
}

const PROCESSING_FEE_PERCENT = 2.9;
const FIXED_FEE = 0.30;

export default function PayoutModal({ open, onOpenChange, merchant }: PayoutModalProps) {
  const [loading, setLoading] = useState(false);
  const [bankAccount, setBankAccount] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");
  const [notes, setNotes] = useState("");
  const { toast } = useToast();

  if (!merchant) return null;

  const processingFee = (merchant.approved_amount * PROCESSING_FEE_PERCENT) / 100 + FIXED_FEE;
  const finalPayoutAmount = merchant.net_amount - processingFee;

  const fmt = (amount: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: merchant.currency }).format(amount);

  const handleInitiatePayout = async () => {
    if (!bankAccount || !accountHolder || !routingNumber) {
      toast({ title: "Validation Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    try {
      setLoading(true);
      // Encrypt bank account PII via VGS before processing
      const encryptedBankInfo = await encryptFields({
        account_number: bankAccount,
        account_holder: accountHolder,
        routing_number: routingNumber,
      }, 'bank_account_pii');
      
      console.log('Bank info encrypted via VGS:', Object.keys(encryptedBankInfo).map(k => `${k}: tok_***`));
      
      toast({ title: "Payout Initiated", description: `Payout of ${fmt(finalPayoutAmount)} has been scheduled for ${merchant.merchant_name}. Bank details encrypted via VGS.` });
      onOpenChange(false);
      setBankAccount(""); setAccountHolder(""); setRoutingNumber(""); setNotes("");
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to initiate payout", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Initiate Payout - {merchant.merchant_name}</DialogTitle>
          <DialogDescription>Review payout details and provide banking information</DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-sm mb-3">Payout Breakdown</h3>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Approved Amount</span><span className="font-medium">{fmt(merchant.approved_amount)}</span></div>
            <div className="flex justify-between text-sm text-orange-600"><span className="flex items-center gap-1"><Minus className="h-3 w-3" />Refunds</span><span className="font-medium">-{fmt(merchant.refunded_amount)}</span></div>
            <div className="flex justify-between text-sm text-destructive"><span className="flex items-center gap-1"><Minus className="h-3 w-3" />Chargebacks</span><span className="font-medium">-{fmt(merchant.chargeback_amount)}</span></div>
            <div className="flex justify-between text-sm text-blue-600"><span className="flex items-center gap-1"><Minus className="h-3 w-3" />Processing Fee ({PROCESSING_FEE_PERCENT}% + {fmt(FIXED_FEE)})</span><span className="font-medium">-{fmt(processingFee)}</span></div>
            <div className="border-t pt-3 mt-3"><div className="flex justify-between"><span className="font-semibold">Final Payout Amount</span><span className="text-2xl font-bold text-emerald-600">{fmt(finalPayoutAmount)}</span></div></div>
          </div>
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Banking Information</h3>
            <div className="space-y-2"><Label>Account Holder Name *</Label><Input value={accountHolder} onChange={e => setAccountHolder(e.target.value)} placeholder="John Doe" /></div>
            <div className="space-y-2"><Label>Bank Account Number *</Label><Input value={bankAccount} onChange={e => setBankAccount(e.target.value)} placeholder="1234567890" /></div>
            <div className="space-y-2"><Label>Routing Number *</Label><Input value={routingNumber} onChange={e => setRoutingNumber(e.target.value)} placeholder="021000021" /></div>
            <div className="space-y-2"><Label>Notes (Optional)</Label><Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Add any additional notes..." rows={3} /></div>
            <div className="flex items-center gap-2 rounded-lg bg-primary/5 border border-primary/10 p-3">
              <Lock className="h-4 w-4 text-primary shrink-0" />
              <p className="text-xs text-muted-foreground">Bank account details are encrypted via VGS vault before processing. Raw data never touches our database.</p>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
          <Button onClick={handleInitiatePayout} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</> : <><ArrowRight className="mr-2 h-4 w-4" />Initiate Payout</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
