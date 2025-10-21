INSERT INTO candidates (name, aliases) VALUES
  ('Abhishek Singh', ARRAY['abhishek singh','abhishekji','abhi singh','#abhisheksingh'])
ON CONFLICT (name) DO NOTHING;

INSERT INTO candidates (name, aliases) VALUES
  ('Priya Sharma', ARRAY['priya sharma','priyaji','#priyaformla'])
ON CONFLICT (name) DO NOTHING;

INSERT INTO candidates (name, aliases) VALUES
  ('Ravi Kumar', ARRAY['ravi kumar','raviji','#ravikumar'])
ON CONFLICT (name) DO NOTHING;
