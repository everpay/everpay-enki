import { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Package, TrendingUp, AlertTriangle, ShoppingCart, Plus, Search, Grid, List, Edit, Trash2 } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { formatPrice, getStockStatus, filterProducts } from '@/components/product/ProductUtils';
import { Product } from '@/lib/product-types';
import { Skeleton } from '@/components/ui/skeleton';

function ProductForm({ onSuccess, defaultValues, id }: { onSuccess: () => void; defaultValues?: Partial<Product>; id?: string }) {
  const { user } = useAuth();
  const [name, setName] = useState(defaultValues?.name || '');
  const [description, setDescription] = useState(defaultValues?.description || '');
  const [price, setPrice] = useState(String(defaultValues?.price || ''));
  const [stock, setStock] = useState(String(defaultValues?.stock || '0'));
  const [category, setCategory] = useState(defaultValues?.category || '');
  const [productType, setProductType] = useState(defaultValues?.product_type || 'physical');
  const [sku, setSku] = useState(defaultValues?.sku || '');
  const [imageUrl, setImageUrl] = useState(defaultValues?.image_url || '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name || !price) return;
    setSaving(true);
    try {
      const { data: merchant } = await supabase.from('merchants').select('id').eq('user_id', user.id).single();
      if (!merchant) throw new Error('Merchant not found');

      const payload = {
        merchant_id: merchant.id,
        name, description,
        price: parseFloat(price),
        stock: parseInt(stock) || 0,
        category, product_type: productType, sku,
        image_url: imageUrl || null,
      };

      if (id) {
        const { error } = await supabase.from('products').update(payload as any).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('products').insert(payload as any);
        if (error) throw error;
      }
      toast.success(id ? 'Product updated' : 'Product created');
      onSuccess();
    } catch (err: any) {
      toast.error(err.message);
    } finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2"><Label>Name</Label><Input value={name} onChange={e => setName(e.target.value)} required /></div>
      <div className="space-y-2"><Label>Description</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} /></div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Price</Label><Input type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} required /></div>
        <div className="space-y-2"><Label>Stock</Label><Input type="number" value={stock} onChange={e => setStock(e.target.value)} /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Category</Label><Input value={category} onChange={e => setCategory(e.target.value)} /></div>
        <div className="space-y-2">
          <Label>Type</Label>
          <Select value={productType} onValueChange={setProductType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="physical">Physical</SelectItem>
              <SelectItem value="digital">Digital</SelectItem>
              <SelectItem value="subscription">Subscription</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>SKU</Label><Input value={sku} onChange={e => setSku(e.target.value)} /></div>
        <div className="space-y-2"><Label>Image URL</Label><Input value={imageUrl} onChange={e => setImageUrl(e.target.value)} /></div>
      </div>
      <Button type="submit" disabled={saving} className="w-full">{saving ? 'Saving...' : id ? 'Update Product' : 'Create Product'}</Button>
    </form>
  );
}

export default function Products() {
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const { products, loading, fetchProducts } = useProducts();

  const filtered = filterProducts(products, searchTerm);
  const totalProducts = products.length;
  const totalInventoryValue = products.reduce((s, p) => s + p.price * p.stock, 0);
  const lowStockProducts = products.filter(p => p.stock > 0 && p.stock <= 5).length;
  const outOfStockProducts = products.filter(p => p.stock <= 0).length;

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('Product deleted'); fetchProducts(); }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">Products</h1>
            <p className="mt-1 text-sm text-muted-foreground">Manage your product inventory and track stock levels.</p>
          </div>
          <Button onClick={() => { setEditProduct(null); setOpenDialog(true); }}><Plus className="mr-2 h-4 w-4" /> Add Product</Button>
        </div>

        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" placeholder="Search products..." />
          </div>
          <div className="flex items-center gap-2">
            <Button variant={view === 'grid' ? 'default' : 'outline'} size="icon" onClick={() => setView('grid')}><Grid className="h-4 w-4" /></Button>
            <Button variant={view === 'list' ? 'default' : 'outline'} size="icon" onClick={() => setView('list')}><List className="h-4 w-4" /></Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Products</CardTitle><Package className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{totalProducts}</div></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Inventory Value</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{formatPrice(totalInventoryValue)}</div></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Low Stock</CardTitle><AlertTriangle className="h-4 w-4 text-warning" /></CardHeader><CardContent><div className="text-2xl font-bold">{lowStockProducts}</div></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Out of Stock</CardTitle><ShoppingCart className="h-4 w-4 text-destructive" /></CardHeader><CardContent><div className="text-2xl font-bold">{outOfStockProducts}</div></CardContent></Card>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => <Card key={i}><CardHeader><Skeleton className="h-6 w-3/4" /><Skeleton className="h-4 w-full mt-2" /></CardHeader><CardContent><Skeleton className="h-24 w-full" /></CardContent></Card>)}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="py-12">
            <CardContent className="flex flex-col items-center justify-center">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">{searchTerm ? 'No products match your search' : 'No products yet'}</p>
            </CardContent>
          </Card>
        ) : view === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(product => {
              const stockStatus = getStockStatus(product);
              return (
                <Card key={product.id} className="flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{product.name}</CardTitle>
                      <Badge variant={stockStatus.status === 'out-of-stock' ? 'destructive' : stockStatus.status === 'low-stock' ? 'secondary' : 'default'} className="text-xs">
                        {stockStatus.status === 'out-of-stock' ? 'Out of Stock' : stockStatus.status === 'low-stock' ? `Low (${product.stock})` : `In Stock (${product.stock})`}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-4">
                    {product.image_url && <div className="aspect-video rounded-lg overflow-hidden bg-muted"><img src={product.image_url} alt={product.name} className="object-cover w-full h-full" /></div>}
                    <div className="flex justify-between items-center">
                      <p className="text-xl font-bold">{formatPrice(product.price)}</p>
                      {product.product_type && <Badge variant="outline" className="capitalize text-xs">{product.product_type}</Badge>}
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm"><span className="text-muted-foreground">Stock</span><span>{product.stock} units</span></div>
                      <Progress value={Math.min(product.stock / 20 * 100, 100)} className="h-2" />
                    </div>
                  </CardContent>
                  <div className="flex justify-between p-4 pt-0">
                    <Button variant="outline" size="sm" onClick={() => { setEditProduct(product); setOpenDialog(true); }}><Edit className="mr-1 h-4 w-4" /> Edit</Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild><Button variant="outline" size="sm" className="text-destructive"><Trash2 className="mr-1 h-4 w-4" /> Delete</Button></AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Delete product?</AlertDialogTitle><AlertDialogDescription>This will permanently delete "{product.name}".</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(product.id)}>Delete</AlertDialogAction></AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-card">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Product</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Price</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Stock</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-border">
                {filtered.map(product => {
                  const stockStatus = getStockStatus(product);
                  return (
                    <tr key={product.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3"><div className="flex items-center gap-3">{product.image_url ? <img src={product.image_url} alt="" className="w-10 h-10 rounded-lg object-cover" /> : <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center"><Package className="h-5 w-5 text-muted-foreground" /></div>}<div><p className="font-medium">{product.name}</p><p className="text-xs text-muted-foreground line-clamp-1">{product.description}</p></div></div></td>
                      <td className="px-4 py-3"><Badge variant="outline" className="capitalize">{product.category || 'Uncategorized'}</Badge></td>
                      <td className="px-4 py-3 font-medium">{formatPrice(product.price)}</td>
                      <td className="px-4 py-3">{product.stock} units</td>
                      <td className="px-4 py-3"><Badge variant={stockStatus.status === 'out-of-stock' ? 'destructive' : stockStatus.status === 'low-stock' ? 'secondary' : 'default'}>{stockStatus.status === 'out-of-stock' ? 'Out of Stock' : stockStatus.status === 'low-stock' ? 'Low Stock' : 'In Stock'}</Badge></td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditProduct(product); setOpenDialog(true); }}><Edit className="h-4 w-4" /></Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><Trash2 className="h-4 w-4 text-destructive" /></Button></AlertDialogTrigger>
                            <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete?</AlertDialogTitle><AlertDialogDescription>Delete "{product.name}"?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(product.id)}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader><DialogTitle>{editProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle></DialogHeader>
            <ProductForm defaultValues={editProduct || undefined} id={editProduct?.id} onSuccess={() => { setOpenDialog(false); fetchProducts(); }} />
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
