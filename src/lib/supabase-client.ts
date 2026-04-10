import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dhobjuetzkvnkdoqeavy.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRob2JqdWV0emt2bmtkb3FlYXZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNjYxNTcsImV4cCI6MjA4ODk0MjE1N30.TF_YpDnD0a6jXcH6FqhGGgSkWXLN_9vc94_cCNX-9Z8';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
