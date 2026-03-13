export interface Product {
  id: string;
  merchant_id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  image_url?: string;
  product_type: string;
  cost_price?: number;
  sku?: string;
  category?: string;
  tags?: string[];
  dimensions?: Record<string, any>;
  metadata?: any;
  created_at: string;
  updated_at: string;
  barcode?: string;
}
