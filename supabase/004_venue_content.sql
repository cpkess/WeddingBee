-- =====================================================================
-- One-time content pass for the venues added via the "Add a venue" UI
-- that were still missing most fields, written to match the style of the
-- original seeded venues (see 002_venues.sql, especially "Beaches Turks
-- & Caicos").
--
-- "Hyatt Regency Aruba" (id `hyatt`) was already fully populated and is
-- left untouched. The three venues below (ids `manorhouse`,
-- `botanical-gardens`, `toledo-art-museum`) had only a placeholder name
-- and default color — this fills in the rest, including a more
-- descriptive `name`, and recomputes `num` from order_index.
-- =====================================================================

-- ---------------- Wildwood Manor House (id: manorhouse) ----------------
update public.venues set
  name = 'Wildwood Manor House',
  num = 'Venue ' || to_char(order_index, 'FM00'),
  location = 'Toledo, Ohio',
  theme = 'Storybook Estate Garden',
  vc = '#A8615A',
  vc_deep = '#7A3F38',
  search_term = 'Wildwood Manor House Toledo wedding',
  site_url = 'https://metroparkstoledo.com/features-and-rentals/the-manor-house/',
  site_label = 'metroparkstoledo.com',
  ig_url = 'https://www.instagram.com/metroparkstoledo/',
  ig_label = '@metroparkstoledo',
  one_liner = 'A 1937 Georgian-colonial mansion tucked inside 500 acres of Toledo parkland — elegant, intimate, and unmistakably ours.',
  lead = 'Set inside Wildwood Preserve Metropark, the Manor House is the 30,000-square-foot former Stranahan family estate — a manicured front lawn, garden patio and colonnaded porches that feel a world away from the city, just minutes from home.',
  why = 'It''s the closest thing to a destination wedding without leaving Toledo: a genuinely grand historic home and garden, an easy drive from the people we love most.',
  note = 'home turf, dressed up',
  moods = '["Elegant","Historic","Garden","Hometown"]'::jsonb,
  included = '[
    {"ic":"🏛","title":"A 1937 Georgian mansion","desc":"30,000 sq ft former Stranahan family estate, open for tours and private rentals year-round."},
    {"ic":"🌳","title":"Front lawn & garden patio","desc":"A gazebo on the manor lawn or the patio garden — both framed by century-old trees."},
    {"ic":"👰","title":"On-site bridal suite","desc":"A private getting-ready space inside the Manor House for the wedding party."},
    {"ic":"🥾","title":"Part of Wildwood Preserve","desc":"493 acres of trails, woods and the Ottawa River right outside the door for photos."},
    {"ic":"🪑","title":"Simple, flexible rentals","desc":"Day, room, or full-house-and-garden packages — bring your own caterer and vendors."},
    {"ic":"🏡","title":"Minutes from home","desc":"No flights, no hotel blocks required — an easy, familiar drive for everyone."}
  ]'::jsonb,
  updated_at = now()
where id = 'manorhouse';

-- ---------------- Toledo Botanical Garden (id: botanical-gardens) ----------------
update public.venues set
  name = 'Toledo Botanical Garden',
  num = 'Venue ' || to_char(order_index, 'FM00'),
  location = 'Toledo, Ohio',
  theme = 'Sixty Acres of Garden Romance',
  vc = '#4FA37D',
  vc_deep = '#2E7D5C',
  search_term = 'Toledo Botanical Garden wedding',
  site_url = 'https://metroparkstoledo.com/explore-your-parks/toledo-botanical-garden-metropark/rentals/',
  site_label = 'metroparkstoledo.com',
  ig_url = 'https://www.instagram.com/metroparkstoledo/',
  ig_label = '@metroparkstoledo',
  one_liner = 'Sixty acres of display gardens, tree-lined allées and quiet ponds — a green, blooming backdrop right in town.',
  lead = 'Toledo Botanical Garden is 60 acres of curated gardens, sculpture and tree-lined allées — from the Grand Allée''s silver lindens to the Pond Gazebo''s grassy knoll, there''s a green, growing backdrop for every part of the day.',
  why = 'It''s pure garden-party romance, with a different mood in every corner — and like Wildwood, it''s just minutes from the people we love most.',
  note = 'bring on the flowers (they''re already here)',
  moods = '["Garden","Romantic","Outdoor","Hometown"]'::jsonb,
  included = '[
    {"ic":"🌷","title":"60 acres of display gardens","desc":"Curated plant collections, sculpture and quiet corners throughout the grounds."},
    {"ic":"🌳","title":"The Grand Allée","desc":"A sweeping lawn bordered by silver linden trees — built for a processional."},
    {"ic":"⛲","title":"Pond Gazebo & Perennial Garden","desc":"An enchanting gazebo on a grassy knoll, or an intimate spot in full bloom."},
    {"ic":"🏛","title":"Crosby Conference Center","desc":"An indoor option for receptions, rain plans, or smaller gatherings."},
    {"ic":"🎨","title":"Small Park with Arches","desc":"A modern ceremony spot anchored by a steel sculpture archway."},
    {"ic":"🚗","title":"Bring your own vendors","desc":"Facility rental only — full freedom to choose caterers and decor."}
  ]'::jsonb,
  updated_at = now()
where id = 'botanical-gardens';

-- ---------------- Toledo Museum of Art (id: toledo-art-museum) ----------------
update public.venues set
  name = 'Toledo Museum of Art',
  num = 'Venue ' || to_char(order_index, 'FM00'),
  location = 'Toledo, Ohio',
  theme = 'World-Class Art, Hometown Address',
  vc = '#3E8EBF',
  vc_deep = '#2A6B94',
  search_term = 'Toledo Museum of Art wedding Peristyle Glass Pavilion',
  site_url = 'https://toledomuseum.org/about/host-an-event',
  site_label = 'toledomuseum.org',
  ig_url = 'https://www.instagram.com/toledomuseum/',
  ig_label = '@toledomuseum',
  one_liner = 'Marble columns, a Chihuly chandelier, and one of the country''s great art collections — as our wedding backdrop.',
  lead = 'The Toledo Museum of Art pairs two showstopping event spaces: the marble, two-story Peristyle, modeled on a Greek agora, and the glass-walled Crystal Corridor of the Glass Pavilion, glowing under a Chihuly chandelier.',
  why = 'It''s the unexpected-elegance pick — a genuinely world-class, free-to-the-public museum that happens to be minutes from home, for guests who''d love a little culture with their cocktails.',
  note = 'yes, that''s a real Chihuly',
  moods = '["Elegant","Artsy","Modern","Hometown"]'::jsonb,
  included = '[
    {"ic":"🏛","title":"The Peristyle","desc":"A two-story marble lobby modeled on a Greek agora, with columns and a painted frieze — ideal for ceremonies and dinners."},
    {"ic":"🔮","title":"Glass Pavilion''s Crystal Corridor","desc":"Curving glass-walled galleries under a Chihuly chandelier — a favorite for receptions, up to 250 guests."},
    {"ic":"🖼","title":"World-class galleries","desc":"An encyclopedic collection spanning ancient to contemporary art, free to the public."},
    {"ic":"🅿","title":"Ample on-site parking","desc":"Lots behind the Main Museum and beside the Glass Pavilion for all your guests."},
    {"ic":"🍷","title":"Full event services","desc":"The Museum''s events team handles space rental, setup and logistics for private celebrations."},
    {"ic":"🏡","title":"Right in our backyard","desc":"A genuinely world-class venue that''s also just minutes from where we live."}
  ]'::jsonb,
  updated_at = now()
where id = 'toledo-art-museum';
