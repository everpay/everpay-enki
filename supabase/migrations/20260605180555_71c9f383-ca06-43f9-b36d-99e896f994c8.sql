
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_provider_check;
ALTER TABLE public.transactions
  ADD CONSTRAINT transactions_provider_check
  CHECK (provider IN ('mondo','stripe','shieldhub','moneto','paygate10','ofa','makapay','payok','lipad','prometeo','matrix','dcbank','plgin','circoflows','valenspay'))
  NOT VALID;
