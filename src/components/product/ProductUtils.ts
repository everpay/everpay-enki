import { Product } from '@/lib/product-types';

export const getBarcodeFromMetadata = (product: Product): string => {
  if (!product.metadata) return '';
  try {
    const metadata = typeof product.metadata === 'string' ? JSON.parse(product.metadata) : product.metadata;
    return metadata.barcode || '';
  } catch { return ''; }
};

export const formatPrice = (price: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);

export const getStockStatus = (product: Product) => {
  if (!product.stock || product.stock <= 0) return { status: 'out-of-stock' as const, color: 'destructive' as const };
  if (product.stock <= 5) return { status: 'low-stock' as const, color: 'warning' as const };
  return { status: 'in-stock' as const, color: 'success' as const };
};

export const filterProducts = (products: Product[], searchTerm: string): Product[] => {
  if (!searchTerm) return products;
  const lower = searchTerm.toLowerCase();
  return products.filter(p =>
    p.name.toLowerCase().includes(lower) ||
    (p.description && p.description.toLowerCase().includes(lower)) ||
    (p.sku && p.sku.toLowerCase().includes(lower)) ||
    (p.category && p.category.toLowerCase().includes(lower))
  );
};
