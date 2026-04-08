
-- Remove overly permissive acquirers SELECT policy
DROP POLICY IF EXISTS "Anyone can view acquirers" ON public.acquirers;
