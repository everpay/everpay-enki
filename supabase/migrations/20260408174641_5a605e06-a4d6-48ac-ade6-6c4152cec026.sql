
-- Add MakaPay route (priority 0) for azmirshabib1@gmail.com merchant
INSERT INTO psp_routes (merchant_id, processor, priority, active)
SELECT m.id, 'makapay', 0, true
FROM merchants m JOIN auth.users u ON u.id = m.user_id
WHERE u.email = 'azmirshabib1@gmail.com'
AND NOT EXISTS (
  SELECT 1 FROM psp_routes pr WHERE pr.merchant_id = m.id AND pr.processor = 'makapay'
);

-- Add Paygate10 route (priority 5, PK) for azmirshabib1@gmail.com merchant
INSERT INTO psp_routes (merchant_id, processor, priority, active, country)
SELECT m.id, 'paygate10', 5, true, 'PK'
FROM merchants m JOIN auth.users u ON u.id = m.user_id
WHERE u.email = 'azmirshabib1@gmail.com'
AND NOT EXISTS (
  SELECT 1 FROM psp_routes pr WHERE pr.merchant_id = m.id AND pr.processor = 'paygate10'
);

-- Demote ShieldHub route to priority 10
UPDATE psp_routes SET priority = 10, updated_at = now()
WHERE processor = 'shieldhub'
AND merchant_id = (
  SELECT m.id FROM merchants m JOIN auth.users u ON u.id = m.user_id WHERE u.email = 'azmirshabib1@gmail.com'
);

-- Add MakaPay Primary routing rule
INSERT INTO routing_rules (merchant_id, name, priority, target_provider, fallback_provider, active, currency_match)
SELECT m.id, 'MakaPay Primary', 0, 'makapay', 'shieldhub', true, '{}'
FROM merchants m JOIN auth.users u ON u.id = m.user_id
WHERE u.email = 'azmirshabib1@gmail.com'
AND NOT EXISTS (
  SELECT 1 FROM routing_rules rr WHERE rr.merchant_id = m.id AND rr.name = 'MakaPay Primary'
);

-- Add PG10 Pakistan PKR routing rule
INSERT INTO routing_rules (merchant_id, name, priority, target_provider, fallback_provider, active, currency_match)
SELECT m.id, 'PG10 Pakistan PKR', 5, 'paygate10', 'shieldhub', true, '{PKR}'
FROM merchants m JOIN auth.users u ON u.id = m.user_id
WHERE u.email = 'azmirshabib1@gmail.com'
AND NOT EXISTS (
  SELECT 1 FROM routing_rules rr WHERE rr.merchant_id = m.id AND rr.name = 'PG10 Pakistan PKR'
);

-- Demote Default ShieldHub routing rule to priority 50
UPDATE routing_rules SET priority = 50, updated_at = now()
WHERE name = 'Default ShieldHub'
AND merchant_id = (
  SELECT m.id FROM merchants m JOIN auth.users u ON u.id = m.user_id WHERE u.email = 'azmirshabib1@gmail.com'
);
