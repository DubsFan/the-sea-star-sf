-- Add role and display_name to admin_users
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'crew';
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Update Alicia as admin
UPDATE admin_users SET role = 'admin', display_name = 'Alicia' WHERE username = 'alicia';

-- Create wine_items table
CREATE TABLE IF NOT EXISTS wine_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price TEXT NOT NULL,
  description TEXT,
  tag TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed wines (only if empty)
INSERT INTO wine_items (name, price, description, tag, sort_order)
SELECT * FROM (VALUES
  ('Rosato Prosecco', '$14 / $48', 'Sparkling rosé from the Veneto region with delicate notes of strawberry and cream.', 'Glass / Bottle', 1),
  ('Grüner Veltliner', '$14 / $48', 'Crisp Austrian white with white pepper, green apple, and a mineral finish.', 'Glass / Bottle', 2),
  ('Catarratto Pinot Grigio', '$14 / $48', 'Sicilian white blend with citrus, pear, and a bright acidity.', 'Glass / Bottle', 3),
  ('Côtes du Rhône Rouge', '$16 / $56', 'Southern Rhône red with dark fruit, garrigue herbs, and smooth tannins.', 'Glass / Bottle', 4),
  ('Malbec', '$14 / $48', 'Argentine classic with plum, blackberry, and a hint of vanilla oak.', 'Glass / Bottle', 5),
  ('Brut Rosé', '$16 / $56', 'Elegant sparkling rosé with fine bubbles and notes of red currant and brioche.', 'Glass / Bottle', 6)
) AS v(name, price, description, tag, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM wine_items);
