-- Insert test bonus codes
INSERT INTO bonus_codes (code, credits, max_uses, is_active, expires_at) VALUES 
('WELCOME50', 50, 100, true, '2025-12-31 23:59:59+00'),
('TEST10', 10, 50, true, '2025-12-31 23:59:59+00'),
('PREMIUM100', 100, 25, true, '2025-12-31 23:59:59+00')
ON CONFLICT (code) DO NOTHING;