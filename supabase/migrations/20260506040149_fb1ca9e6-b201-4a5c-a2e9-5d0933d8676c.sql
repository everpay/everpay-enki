CREATE TABLE public.kyb_review_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  doc_id uuid NOT NULL,
  merchant_id uuid,
  user_id uuid,
  doc_type text,
  file_name text,
  status text NOT NULL DEFAULT 'pending',
  read_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_kyb_notif_unread ON public.kyb_review_notifications (created_at DESC) WHERE read_at IS NULL;
CREATE UNIQUE INDEX idx_kyb_notif_doc ON public.kyb_review_notifications (doc_id);

ALTER TABLE public.kyb_review_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view kyb notifications"
  ON public.kyb_review_notifications FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Admins can update kyb notifications"
  ON public.kyb_review_notifications FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Admins can delete kyb notifications"
  ON public.kyb_review_notifications FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role));

ALTER TABLE public.kyb_review_notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.kyb_review_notifications;

-- Allow admin role to insert audit logs on behalf of others via proxy-issued JWT
-- (service role bypasses RLS so no policy change needed there).