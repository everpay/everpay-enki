
-- Add Elektropay PSP route for azmirshabib1@gmail.com
INSERT INTO psp_routes (merchant_id, processor, priority, active)
SELECT m.id, 'elektropay', 15, true
FROM merchants m JOIN auth.users u ON u.id = m.user_id
WHERE u.email = 'azmirshabib1@gmail.com'
AND NOT EXISTS (
  SELECT 1 FROM psp_routes pr WHERE pr.merchant_id = m.id AND pr.processor = 'elektropay'
);

-- Add Elektropay Crypto routing rule
INSERT INTO routing_rules (merchant_id, name, priority, target_provider, fallback_provider, active, currency_match)
SELECT m.id, 'Elektropay Crypto', 15, 'elektropay', 'shieldhub', true, '{}'
FROM merchants m JOIN auth.users u ON u.id = m.user_id
WHERE u.email = 'azmirshabib1@gmail.com'
AND NOT EXISTS (
  SELECT 1 FROM routing_rules rr WHERE rr.merchant_id = m.id AND rr.name = 'Elektropay Crypto'
);
