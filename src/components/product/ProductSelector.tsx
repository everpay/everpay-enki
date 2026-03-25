import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Package, Search, Plus, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatPrice } from '@/components/product/ProductUtils';
import { Product } from '@/lib/product-types';

interface SelectedProduct {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
}

interface ProductSelectorProps {
  selectedProducts: SelectedProduct[];
  onProductsChange: (products: SelectedProduct[]) => void;
  currency?: string;
}

export function ProductSelector({ selectedProducts, onProductsChange, currency = 'USD' }: ProductSelectorProps) {
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    fetchProducts();
  }, [open]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: merchant } = await supabase.from('merchants').select('id').eq('user_id', user.id).single();
      if (!merchant) return;
      const { data } = await supabase.from('products').select('*').eq('merchant_id', merchant.id).order('name');
      setProducts((data as unknown as Product[]) || []);
    } catch { /* ignore */ }
    setLoading(false);
  };

  const filtered = products.filter(p => {
    const q = search.toLowerCase();
    return !q || p.name.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q);
  });

  const addProduct = (product: Product) => {
    const existing = selectedProducts.find(p => p.id === product.id);
    if (existing) {
      onProductsChange(selectedProducts.map(p => p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p));
    } else {
      onProductsChange([...selectedProducts, { id: product.id, name: product.name, price: product.price, quantity: 1, image_url: product.image_url }]);
    }
  };

  const removeProduct = (productId: string) => {
    onProductsChange(selectedProducts.filter(p => p.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) return removeProduct(productId);
    onProductsChange(selectedProducts.map(p => p.id === productId ? { ...p, quantity } : p));
  };

  const total = selectedProducts.reduce((sum, p) => sum + p.price * p.quantity, 0);

  return (
    <div className="space-y-3">
      {selectedProducts.length > 0 && (
        <div className="space-y-2">
          {selectedProducts.map(p => (
            <div key={p.id} className="flex items-center gap-3 rounded-lg border border-border p-2.5">
              {p.image_url ? (
                <img src={p.image_url} alt="" className="h-8 w-8 rounded object-cover" />
              ) : (
                <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                  <Package className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{p.name}</p>
                <p className="text-xs text-muted-foreground">{formatPrice(p.price)} × {p.quantity}</p>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQuantity(p.id, p.quantity - 1)}>−</Button>
                <span className="text-sm w-6 text-center">{p.quantity}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQuantity(p.id, p.quantity + 1)}>+</Button>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeProduct(p.id)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
          <div className="flex justify-between text-sm font-medium px-1">
            <span className="text-muted-foreground">Total</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 w-full">
            <Package className="h-4 w-4" />
            {selectedProducts.length > 0 ? 'Add More Products' : 'Add Products'}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Select Products</DialogTitle>
          </DialogHeader>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} className="pl-9" placeholder="Search products..." />
          </div>
          <div className="overflow-y-auto max-h-[50vh] space-y-1">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No products found</p>
              </div>
            ) : filtered.map(product => {
              const isSelected = selectedProducts.some(p => p.id === product.id);
              return (
                <button
                  key={product.id}
                  type="button"
                  className={`w-full flex items-center gap-3 rounded-lg p-3 text-left transition-colors hover:bg-muted/50 ${isSelected ? 'bg-primary/5 border border-primary/20' : 'border border-transparent'}`}
                  onClick={() => addProduct(product)}
                >
                  {product.image_url ? (
                    <img src={product.image_url} alt="" className="h-10 w-10 rounded-lg object-cover" />
                  ) : (
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                      <Package className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{product.name}</p>
                    <p className="text-xs text-muted-foreground">{product.category || 'Uncategorized'} {product.sku && `· ${product.sku}`}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold">{formatPrice(product.price)}</p>
                    {product.stock > 0 ? (
                      <Badge variant="secondary" className="text-[10px]">{product.stock} in stock</Badge>
                    ) : (
                      <Badge variant="destructive" className="text-[10px]">Out of stock</Badge>
                    )}
                  </div>
                  {isSelected && <Plus className="h-4 w-4 text-primary rotate-45" />}
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
