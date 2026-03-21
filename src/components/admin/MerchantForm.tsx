import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Building, Mail, Phone, Globe, User } from "lucide-react";

const merchantFormSchema = z.object({
  business_name: z.string().trim().min(2).max(100),
  contact_name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(6).max(20),
  website: z.string().trim().url().optional().or(z.literal("")),
});

type MerchantFormValues = z.infer<typeof merchantFormSchema>;

interface MerchantFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function MerchantForm({ open, onOpenChange, onSuccess }: MerchantFormProps) {
  const [loading, setLoading] = useState(false);
  const form = useForm<MerchantFormValues>({
    resolver: zodResolver(merchantFormSchema),
    defaultValues: { business_name: "", contact_name: "", email: "", phone: "", website: "" },
  });

  const onSubmit = async (data: MerchantFormValues) => {
    try {
      setLoading(true);
      const { data: result, error } = await supabase.functions.invoke('create-merchant-user', {
        body: { business_name: data.business_name, contact_name: data.contact_name, email: data.email, phone: data.phone, website: data.website || null },
      });
      if (error) throw new Error(error.message);
      if (result?.error) throw new Error(result.error);
      toast({ title: "Merchant Added", description: `${data.business_name} has been added. An invitation will be sent to ${data.email}.` });
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast({ variant: "destructive", title: "Failed to Add Merchant", description: error instanceof Error ? error.message : "An unexpected error occurred" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader><DialogTitle className="text-xl font-semibold">Add New Merchant</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            {[
              { name: "business_name" as const, label: "Business Name", icon: Building, placeholder: "Business name" },
              { name: "contact_name" as const, label: "Contact Person", icon: User, placeholder: "Contact person name" },
              { name: "email" as const, label: "Contact Email", icon: Mail, placeholder: "Email address" },
              { name: "phone" as const, label: "Contact Phone", icon: Phone, placeholder: "Phone number" },
              { name: "website" as const, label: "Website (optional)", icon: Globe, placeholder: "https://example.com" },
            ].map(f => (
              <FormField key={f.name} control={form.control} name={f.name} render={({ field }) => (
                <FormItem>
                  <FormLabel>{f.label}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <f.icon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input placeholder={f.placeholder} className="pl-9" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            ))}
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
              <Button type="submit" disabled={loading}>{loading ? "Adding..." : "Add Merchant"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
