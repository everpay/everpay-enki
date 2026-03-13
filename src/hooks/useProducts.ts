import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Product } from '@/lib/product-types';

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      if (!user) { setProducts([]); setLoading(false); return; }

      const { data: merchant } = await supabase
        .from('merchants')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!merchant) { setProducts([]); setLoading(false); return; }

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('merchant_id', merchant.id)
        .order('created_at', { ascending: false });

      if (error) {
        toast.error(error.message);
        setProducts([]);
      } else {
        setProducts((data as unknown as Product[]) || []);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) fetchProducts();
    else setLoading(false);
  }, [user, fetchProducts]);

  return { products, loading, fetchProducts };
};
