-- =============================================================================
-- GuideStride Demo Account Population Script
-- Paste into Supabase SQL Editor after creating the demo account
-- Replace 'YOUR_USER_ID_HERE' with the UUID from Authentication → Users
-- =============================================================================

DO $$
DECLARE
  gid uuid := 'YOUR_USER_ID_HERE'::uuid;

  -- Clients
  c01 uuid := gen_random_uuid(); -- Mark Johnson
  c02 uuid := gen_random_uuid(); -- Tom Williams
  c03 uuid := gen_random_uuid(); -- Dave Peterson
  c04 uuid := gen_random_uuid(); -- Chris Anderson
  c05 uuid := gen_random_uuid(); -- Ryan Thompson
  c06 uuid := gen_random_uuid(); -- Mike Davis
  c07 uuid := gen_random_uuid(); -- Steve Wilson
  c08 uuid := gen_random_uuid(); -- Jim Miller
  c09 uuid := gen_random_uuid(); -- Dan Moore
  c10 uuid := gen_random_uuid(); -- Kevin Taylor
  c11 uuid := gen_random_uuid(); -- Brian Harris
  c12 uuid := gen_random_uuid(); -- Scott Martin

  -- Packages
  ts1 uuid := gen_random_uuid(); -- Half Day
  ts2 uuid := gen_random_uuid(); -- Full Day
  ts3 uuid := gen_random_uuid(); -- Trophy Musky

  -- 2025 Trips
  t01 uuid := gen_random_uuid(); t02 uuid := gen_random_uuid(); t03 uuid := gen_random_uuid();
  t04 uuid := gen_random_uuid(); t05 uuid := gen_random_uuid(); t06 uuid := gen_random_uuid();
  t07 uuid := gen_random_uuid(); t08 uuid := gen_random_uuid(); t09 uuid := gen_random_uuid();
  t10 uuid := gen_random_uuid(); t11 uuid := gen_random_uuid(); t12 uuid := gen_random_uuid();
  t13 uuid := gen_random_uuid(); t14 uuid := gen_random_uuid(); t15 uuid := gen_random_uuid();
  t16 uuid := gen_random_uuid(); t17 uuid := gen_random_uuid(); t18 uuid := gen_random_uuid();
  t19 uuid := gen_random_uuid(); t20 uuid := gen_random_uuid(); t21 uuid := gen_random_uuid();
  t22 uuid := gen_random_uuid(); t23 uuid := gen_random_uuid(); t24 uuid := gen_random_uuid();
  t25 uuid := gen_random_uuid(); t26 uuid := gen_random_uuid(); t27 uuid := gen_random_uuid();
  t28 uuid := gen_random_uuid(); t29 uuid := gen_random_uuid(); t30 uuid := gen_random_uuid();
  t31 uuid := gen_random_uuid(); t32 uuid := gen_random_uuid(); t33 uuid := gen_random_uuid();
  t34 uuid := gen_random_uuid(); t35 uuid := gen_random_uuid(); t36 uuid := gen_random_uuid();
  t37 uuid := gen_random_uuid(); t38 uuid := gen_random_uuid(); t39 uuid := gen_random_uuid();
  t40 uuid := gen_random_uuid();

  -- 2026 Trips
  t41 uuid := gen_random_uuid(); t42 uuid := gen_random_uuid(); t43 uuid := gen_random_uuid();
  t44 uuid := gen_random_uuid(); t45 uuid := gen_random_uuid(); t46 uuid := gen_random_uuid();
  t47 uuid := gen_random_uuid(); t48 uuid := gen_random_uuid(); t49 uuid := gen_random_uuid();
  t50 uuid := gen_random_uuid(); t51 uuid := gen_random_uuid(); t52 uuid := gen_random_uuid();
  t53 uuid := gen_random_uuid(); t54 uuid := gen_random_uuid(); t55 uuid := gen_random_uuid();
  t56 uuid := gen_random_uuid(); t57 uuid := gen_random_uuid(); t58 uuid := gen_random_uuid();
  t59 uuid := gen_random_uuid(); t60 uuid := gen_random_uuid(); t61 uuid := gen_random_uuid();
  t62 uuid := gen_random_uuid();

BEGIN

-- =============================================================================
-- GUIDE PROFILE
-- =============================================================================
UPDATE public.guides SET
  name        = 'Jake Rivers',
  location    = 'Chippewa Flowage, WI',
  species_presets = ARRAY['Musky','Walleye','Largemouth Bass','Smallmouth Bass','Northern Pike','Panfish'],
  lure_presets    = ARRAY['Bucktail Spinner','Jerkbait','Crankbait','Soft Plastics','Live Sucker','Topwater Frog','Spinnerbait']
WHERE id = gid;

-- =============================================================================
-- PACKAGES
-- =============================================================================
INSERT INTO public.guide_time_slots (id, guide_id, label, start_time, end_time, price, sort_order) VALUES
  (ts1, gid, 'Half Day',     '06:00', '12:00', 275, 1),
  (ts2, gid, 'Full Day',     '06:00', '14:00', 450, 2),
  (ts3, gid, 'Trophy Musky', '05:30', '16:00', 625, 3);

-- =============================================================================
-- CLIENTS
-- =============================================================================
INSERT INTO public.clients (id, guide_id, name, phone, email, address) VALUES
  (c01, gid, 'Mark Johnson',  '(218) 555-0142', 'mark.johnson@email.com',   'Duluth, MN'),
  (c02, gid, 'Tom Williams',  '(612) 555-0187', 'tom.williams@email.com',   'Minneapolis, MN'),
  (c03, gid, 'Dave Peterson', '(715) 555-0234', 'dave.peterson@email.com',  'Eau Claire, WI'),
  (c04, gid, 'Chris Anderson','(312) 555-0391', 'chris.anderson@email.com', 'Chicago, IL'),
  (c05, gid, 'Ryan Thompson', '(920) 555-0156', 'ryan.thompson@email.com',  'Green Bay, WI'),
  (c06, gid, 'Mike Davis',    '(414) 555-0278', 'mike.davis@email.com',     'Milwaukee, WI'),
  (c07, gid, 'Steve Wilson',  '(651) 555-0312', 'steve.wilson@email.com',   'St. Paul, MN'),
  (c08, gid, 'Jim Miller',    '(608) 555-0445', 'jim.miller@email.com',     'Madison, WI'),
  (c09, gid, 'Dan Moore',     '(507) 555-0198', 'dan.moore@email.com',      'Rochester, MN'),
  (c10, gid, 'Kevin Taylor',  '(715) 555-0367', 'kevin.taylor@email.com',   'Wausau, WI'),
  (c11, gid, 'Brian Harris',  '(608) 555-0489', 'brian.harris@email.com',   'La Crosse, WI'),
  (c12, gid, 'Scott Martin',  '(715) 555-0523', 'scott.martin@email.com',   'Superior, WI');

-- =============================================================================
-- 2025 TRIPS (40 trips, March–October)
-- =============================================================================
INSERT INTO public.trips (id, guide_id, client_id, trip_date, location, status, price, deposit_paid, amount_collected, payment_method, time_slot_id, notes) VALUES
  -- March (3 trips)
  (t01, gid, c01, '2025-03-08', 'Chippewa Flowage',  'completed', 275, 100, 275, 'cash',   ts1, 'Early season walleye. Fish were holding in 12ft.'),
  (t02, gid, c02, '2025-03-15', 'Lake Namekagon',    'completed', 450, 150, 450, 'venmo',  ts2, 'Good walleye action all morning.'),
  (t03, gid, c03, '2025-03-22', 'St. Croix River',   'completed', 275, 100, 275, 'cash',   ts1, 'Slow start but picked up by 9am.'),
  -- April (5 trips)
  (t04, gid, c04, '2025-04-05', 'Chippewa Flowage',  'completed', 450, 150, 450, 'card',   ts2, 'Bass woke up. Client had a blast on topwater.'),
  (t05, gid, c05, '2025-04-12', 'Big Eau Pleine',    'completed', 275, 100, 275, 'zelle',  ts1, 'Walleye stacked on the rock point.'),
  (t06, gid, c06, '2025-04-19', 'Lake Namekagon',    'completed', 450, 150, 450, 'cash',   ts2, 'Best April bass trip in years.'),
  (t07, gid, c07, '2025-04-26', 'Chippewa Flowage',  'completed', 275, 100, 275, 'venmo',  ts1, 'Morning walleye bite was on fire.'),
  (t08, gid, c08, '2025-04-30', 'St. Croix River',   'completed', 450, 150, 400, 'cash',   ts2, 'Great trip, client owes $50 remainder.'),
  -- May (7 trips)
  (t09, gid, c01, '2025-05-03', 'Chippewa Flowage',  'completed', 450, 150, 450, 'card',   ts2, 'First musky of the year. Client pumped.'),
  (t10, gid, c02, '2025-05-10', 'Chippewa Flowage',  'completed', 625, 200, 625, 'zelle',  ts3, 'Two muskies boatside. Incredible day.'),
  (t11, gid, c09, '2025-05-17', 'Lake Namekagon',    'completed', 450, 150, 450, 'venmo',  ts2, 'Walleye and bass double. Client very happy.'),
  (t12, gid, c10, '2025-05-21', 'Flambeau River',    'completed', 275, 100, 275, 'cash',   ts1, 'Walleye on jigs in the current breaks.'),
  (t13, gid, c11, '2025-05-24', 'Chippewa Flowage',  'completed', 450, 150, 450, 'card',   ts2, 'Bass were explosive on topwater all morning.'),
  (t14, gid, c12, '2025-05-28', 'St. Croix River',   'completed', 275, 100, 250, 'venmo',  ts1, 'Solid half day, client still owes $25.'),
  (t15, gid, c04, '2025-05-31', 'Big Eau Pleine',    'completed', 450, 150, 450, 'cash',   ts2, 'Bass hitting everything we threw.'),
  -- June (8 trips)
  (t16, gid, c05, '2025-06-07', 'Chippewa Flowage',  'completed', 625, 200, 625, 'card',   ts3, 'Epic musky day. 3 fish over 40 inches.'),
  (t17, gid, c06, '2025-06-12', 'Lake Namekagon',    'completed', 450, 150, 450, 'zelle',  ts2, 'Bass and walleye mixed bag.'),
  (t18, gid, c01, '2025-06-14', 'Chippewa Flowage',  'completed', 450, 150, 450, 'venmo',  ts2, 'Mark''s third trip this year. Loyal customer.'),
  (t19, gid, c02, '2025-06-19', 'Flambeau River',    'completed', 275, 100, 275, 'cash',   ts1, 'Evening walleye bite.'),
  (t20, gid, c07, '2025-06-21', 'Chippewa Flowage',  'completed', 625, 200, 625, 'card',   ts3, '4 muskies. Best trophy trip of the season.'),
  (t21, gid, c08, '2025-06-26', 'Lake Namekagon',    'completed', 450, 150, 450, 'zelle',  ts2, 'Client brought his son. Both caught fish.'),
  (t22, gid, c09, '2025-06-28', 'St. Croix River',   'completed', 450, 150, 450, 'venmo',  ts2, 'River walleye were stacked.'),
  (t23, gid, c10, '2025-06-30', 'Big Eau Pleine',    'completed', 275, 100, 275, 'cash',   ts1, 'Good half day, left fish biting.'),
  -- July (6 trips)
  (t24, gid, c11, '2025-07-05', 'Chippewa Flowage',  'completed', 625, 200, 625, 'card',   ts3, 'Holiday weekend musky trip. 3 fish landed.'),
  (t25, gid, c12, '2025-07-12', 'Lake Namekagon',    'completed', 450, 150, 450, 'venmo',  ts2, 'Scott''s first guided trip. Loved it.'),
  (t26, gid, c04, '2025-07-16', 'Chippewa Flowage',  'completed', 450, 150, 450, 'cash',   ts2, 'Bass on fire in the shallow bays.'),
  (t27, gid, c05, '2025-07-19', 'Flambeau River',    'completed', 275, 100, 275, 'zelle',  ts1, 'Walleye limit by 10am.'),
  (t28, gid, c06, '2025-07-24', 'Chippewa Flowage',  'completed', 625, 200, 625, 'card',   ts3, 'Personal best musky for the client. 47 inches.'),
  (t29, gid, c01, '2025-07-31', 'St. Croix River',   'completed', 450, 150, 450, 'venmo',  ts2, 'Bass and walleye all day long.'),
  -- August (5 trips)
  (t30, gid, c02, '2025-08-02', 'Lake Namekagon',    'completed', 450, 150, 450, 'cash',   ts2, 'Summertime bass on structure.'),
  (t31, gid, c03, '2025-08-09', 'Chippewa Flowage',  'completed', 625, 200, 625, 'card',   ts3, 'Dave''s first musky ever. 38 inches.'),
  (t32, gid, c07, '2025-08-16', 'Chippewa Flowage',  'completed', 450, 150, 450, 'zelle',  ts2, 'Two muskies released plus bass.'),
  (t33, gid, c08, '2025-08-23', 'Flambeau River',    'completed', 275, 100, 275, 'venmo',  ts1, 'Afternoon walleye bite was solid.'),
  (t34, gid, c09, '2025-08-30', 'Lake Namekagon',    'completed', 450, 150, 450, 'cash',   ts2, 'Late summer bass on topwater.'),
  -- September (4 trips)
  (t35, gid, c10, '2025-09-06', 'Chippewa Flowage',  'completed', 625, 200, 625, 'card',   ts3, 'Fall transition. Musky on big bucktails.'),
  (t36, gid, c11, '2025-09-13', 'St. Croix River',   'completed', 450, 150, 450, 'zelle',  ts2, 'River walleye fall run started.'),
  (t37, gid, c12, '2025-09-20', 'Chippewa Flowage',  'completed', 625, 200, 625, 'cash',   ts3, 'Scott''s trophy trip. 5 muskies. Unreal.'),
  (t38, gid, c04, '2025-09-27', 'Lake Namekagon',    'completed', 450, 150, 450, 'venmo',  ts2, 'Walleye and bass fall combo.'),
  -- October (2 trips)
  (t39, gid, c05, '2025-10-11', 'Chippewa Flowage',  'completed', 625, 200, 625, 'card',   ts3, 'Prime fall musky. 4 fish over 44 inches.'),
  (t40, gid, c06, '2025-10-25', 'Chippewa Flowage',  'completed', 625, 200, 625, 'zelle',  ts3, 'Season closer. Mike''s trophy of the year — 51 inch musky.');

-- =============================================================================
-- 2026 TRIPS (22 trips, March–June)
-- =============================================================================
INSERT INTO public.trips (id, guide_id, client_id, trip_date, location, status, price, deposit_paid, amount_collected, payment_method, time_slot_id, notes) VALUES
  -- March (3 trips)
  (t41, gid, c01, '2026-03-07', 'Chippewa Flowage', 'completed', 475, 150, 475, 'card',   ts2, 'Mark is back for year two. Early walleye bite.'),
  (t42, gid, c02, '2026-03-14', 'Lake Namekagon',   'completed', 475, 150, 475, 'venmo',  ts2, 'Walleye and pike. Cold morning but worth it.'),
  (t43, gid, c03, '2026-03-21', 'St. Croix River',  'completed', 295, 100, 295, 'cash',   ts1, 'Good half day on walleye.'),
  -- April (5 trips)
  (t44, gid, c04, '2026-04-05', 'Chippewa Flowage', 'completed', 475, 150, 475, 'zelle',  ts2, 'Chris is back. Bass on topwater already.'),
  (t45, gid, c05, '2026-04-11', 'Big Eau Pleine',   'completed', 475, 150, 475, 'card',   ts2, 'Walleye and bass double. Great April trip.'),
  (t46, gid, c06, '2026-04-17', 'Chippewa Flowage', 'completed', 650, 200, 650, 'venmo',  ts3, 'Mike going for early season musky. Got two.'),
  (t47, gid, c07, '2026-04-24', 'Lake Namekagon',   'completed', 475, 150, 475, 'cash',   ts2, 'Steve brought a buddy. Both caught well.'),
  (t48, gid, c08, '2026-04-29', 'Flambeau River',   'completed', 295, 100, 295, 'card',   ts1, 'River walleye on jigs.'),
  -- May (7 trips)
  (t49, gid, c01, '2026-05-03', 'Chippewa Flowage', 'completed', 650, 200, 650, 'zelle',  ts3, 'Mark upgraded to Trophy package. Three muskies.'),
  (t50, gid, c02, '2026-05-08', 'Lake Namekagon',   'completed', 475, 150, 475, 'venmo',  ts2, 'Bass and walleye. Best May trip yet.'),
  (t51, gid, c09, '2026-05-14', 'Chippewa Flowage', 'completed', 475, 150, 475, 'card',   ts2, 'Dan''s third year in a row. 10 bass landed.'),
  (t52, gid, c10, '2026-05-18', 'Flambeau River',   'completed', 295, 100, 295, 'cash',   ts1, 'Walleye limit before noon.'),
  (t53, gid, c11, '2026-05-22', 'Chippewa Flowage', 'completed', 650, 200, 650, 'card',   ts3, 'Brian''s first musky. 42 inches. He''s hooked.'),
  (t54, gid, c12, '2026-05-28', 'St. Croix River',  'completed', 475, 150, 475, 'zelle',  ts2, 'River run walleye. Action all morning.'),
  (t55, gid, c04, '2026-05-31', 'Big Eau Pleine',   'completed', 475, 150, 450, 'venmo',  ts2, 'Great trip. Chris owes $25 remainder.'),
  -- June (7 trips)
  (t56, gid, c05, '2026-06-01', 'Chippewa Flowage', 'completed', 650, 200, 650, 'card',   ts3, 'Ryan Trophy trip. 3 muskies over 40 inches.'),
  (t57, gid, c06, '2026-06-03', 'Lake Namekagon',   'completed', 475, 150, 475, 'cash',   ts2, 'Bass on topwater was electric this morning.'),
  (t58, gid, c01, '2026-06-05', 'Chippewa Flowage', 'completed', 475, 150, 475, 'zelle',  ts2, 'Mark''s 5th trip overall. Now a regular.'),
  (t59, gid, c02, '2026-06-06', 'Chippewa Flowage', 'completed', 650, 200, 650, 'card',   ts3, 'Tom''s first ever musky. Unforgettable.'),
  (t60, gid, c03, '2026-06-07', 'Flambeau River',   'completed', 475, 150, 475, 'venmo',  ts2, 'Dave is becoming a regular. Great walleye day.'),
  -- Upcoming scheduled trips
  (t61, gid, c07, '2026-06-14', 'Chippewa Flowage', 'scheduled', 475, 150, 0,   null,     ts2, 'Steve booked for summer bass trip.'),
  (t62, gid, c09, '2026-06-21', 'Chippewa Flowage', 'scheduled', 650, 200, 0,   null,     ts3, 'Dan going for his first musky trophy trip.');

-- =============================================================================
-- TRIP CATCHES (trip_catches table — used by analytics)
-- =============================================================================
INSERT INTO public.trip_catches (trip_id, species, count) VALUES
  -- 2025 March
  (t01, 'Walleye', 3), (t01, 'Northern Pike', 1),
  (t02, 'Walleye', 7), (t02, 'Largemouth Bass', 2),
  (t03, 'Walleye', 4),
  -- 2025 April
  (t04, 'Largemouth Bass', 8), (t04, 'Walleye', 3),
  (t05, 'Walleye', 5), (t05, 'Panfish', 4),
  (t06, 'Largemouth Bass', 9), (t06, 'Northern Pike', 2),
  (t07, 'Walleye', 4), (t07, 'Largemouth Bass', 3),
  (t08, 'Largemouth Bass', 7), (t08, 'Walleye', 4),
  -- 2025 May
  (t09, 'Musky', 1), (t09, 'Largemouth Bass', 6),
  (t10, 'Musky', 2), (t10, 'Northern Pike', 1),
  (t11, 'Walleye', 8), (t11, 'Largemouth Bass', 5),
  (t12, 'Walleye', 6),
  (t13, 'Largemouth Bass', 9), (t13, 'Walleye', 3),
  (t14, 'Largemouth Bass', 5), (t14, 'Walleye', 2),
  (t15, 'Largemouth Bass', 11), (t15, 'Northern Pike', 3),
  -- 2025 June
  (t16, 'Musky', 3), (t16, 'Northern Pike', 2),
  (t17, 'Largemouth Bass', 8), (t17, 'Walleye', 5),
  (t18, 'Largemouth Bass', 10), (t18, 'Musky', 1),
  (t19, 'Walleye', 7),
  (t20, 'Musky', 4), (t20, 'Northern Pike', 1),
  (t21, 'Largemouth Bass', 9), (t21, 'Walleye', 4),
  (t22, 'Walleye', 8), (t22, 'Largemouth Bass', 5),
  (t23, 'Walleye', 5), (t23, 'Largemouth Bass', 3),
  -- 2025 July
  (t24, 'Musky', 3), (t24, 'Largemouth Bass', 2),
  (t25, 'Largemouth Bass', 12), (t25, 'Walleye', 3),
  (t26, 'Largemouth Bass', 11), (t26, 'Musky', 1),
  (t27, 'Walleye', 8),
  (t28, 'Musky', 5), (t28, 'Northern Pike', 2),
  (t29, 'Largemouth Bass', 9), (t29, 'Walleye', 6),
  -- 2025 August
  (t30, 'Largemouth Bass', 10), (t30, 'Walleye', 4),
  (t31, 'Musky', 4), (t31, 'Northern Pike', 1),
  (t32, 'Musky', 2), (t32, 'Largemouth Bass', 5), (t32, 'Smallmouth Bass', 3),
  (t33, 'Walleye', 6), (t33, 'Largemouth Bass', 2),
  (t34, 'Largemouth Bass', 9), (t34, 'Walleye', 5),
  -- 2025 September
  (t35, 'Musky', 3), (t35, 'Northern Pike', 2),
  (t36, 'Walleye', 9), (t36, 'Largemouth Bass', 4),
  (t37, 'Musky', 5), (t37, 'Northern Pike', 1),
  (t38, 'Walleye', 8), (t38, 'Largemouth Bass', 3),
  -- 2025 October
  (t39, 'Musky', 4), (t39, 'Northern Pike', 2),
  (t40, 'Musky', 6), (t40, 'Northern Pike', 1),
  -- 2026 March
  (t41, 'Walleye', 8), (t41, 'Largemouth Bass', 3),
  (t42, 'Walleye', 9), (t42, 'Northern Pike', 2),
  (t43, 'Walleye', 5),
  -- 2026 April
  (t44, 'Largemouth Bass', 10), (t44, 'Walleye', 4),
  (t45, 'Walleye', 7), (t45, 'Largemouth Bass', 5),
  (t46, 'Musky', 2), (t46, 'Northern Pike', 3),
  (t47, 'Largemouth Bass', 11), (t47, 'Walleye', 3),
  (t48, 'Walleye', 6), (t48, 'Largemouth Bass', 2),
  -- 2026 May
  (t49, 'Musky', 3), (t49, 'Largemouth Bass', 2),
  (t50, 'Largemouth Bass', 12), (t50, 'Walleye', 4),
  (t51, 'Largemouth Bass', 10), (t51, 'Musky', 1),
  (t52, 'Walleye', 7),
  (t53, 'Musky', 4), (t53, 'Northern Pike', 2),
  (t54, 'Walleye', 9), (t54, 'Largemouth Bass', 5),
  (t55, 'Largemouth Bass', 13), (t55, 'Walleye', 3),
  -- 2026 June
  (t56, 'Musky', 3), (t56, 'Northern Pike', 3),
  (t57, 'Largemouth Bass', 11), (t57, 'Walleye', 5),
  (t58, 'Largemouth Bass', 9), (t58, 'Musky', 2),
  (t59, 'Musky', 5), (t59, 'Northern Pike', 1),
  (t60, 'Walleye', 10), (t60, 'Largemouth Bass', 4);

-- =============================================================================
-- TRIP CONDITIONS (moon phase + pressure for fishing analytics)
-- =============================================================================
INSERT INTO public.trip_conditions (trip_id, moon_phase, pressure_trend, weather, temp_high) VALUES
  (t01, 'Waxing Crescent', 'rising',  'Partly Cloudy', 48),
  (t02, 'Full Moon',       'steady',  'Overcast',      52),
  (t03, 'Waning Gibbous',  'falling', 'Clear',         55),
  (t04, 'New Moon',        'rising',  'Partly Cloudy', 61),
  (t05, 'Waxing Crescent', 'rising',  'Clear',         64),
  (t06, 'First Quarter',   'steady',  'Overcast',      67),
  (t07, 'Full Moon',       'steady',  'Clear',         70),
  (t08, 'Waning Gibbous',  'falling', 'Cloudy',        66),
  (t09, 'New Moon',        'rising',  'Partly Cloudy', 68),
  (t10, 'Waxing Crescent', 'rising',  'Overcast',      72),
  (t11, 'First Quarter',   'steady',  'Clear',         75),
  (t12, 'Full Moon',       'steady',  'Clear',         78),
  (t13, 'Waning Gibbous',  'falling', 'Overcast',      74),
  (t14, 'New Moon',        'rising',  'Partly Cloudy', 71),
  (t15, 'Waxing Crescent', 'rising',  'Clear',         76),
  (t16, 'Full Moon',       'steady',  'Overcast',      79),
  (t17, 'Waning Gibbous',  'falling', 'Partly Cloudy', 82),
  (t18, 'New Moon',        'rising',  'Clear',         80),
  (t19, 'First Quarter',   'steady',  'Clear',         83),
  (t20, 'Full Moon',       'steady',  'Overcast',      81),
  (t21, 'Waning Gibbous',  'falling', 'Partly Cloudy', 77),
  (t22, 'Waxing Crescent', 'rising',  'Clear',         79),
  (t23, 'New Moon',        'rising',  'Clear',         85),
  (t24, 'Full Moon',       'steady',  'Partly Cloudy', 87),
  (t25, 'Waning Gibbous',  'falling', 'Clear',         84),
  (t26, 'Waxing Crescent', 'rising',  'Clear',         86),
  (t27, 'First Quarter',   'steady',  'Overcast',      82),
  (t28, 'Full Moon',       'steady',  'Partly Cloudy', 89),
  (t29, 'Waning Gibbous',  'rising',  'Clear',         85),
  (t30, 'New Moon',        'rising',  'Clear',         88),
  (t31, 'Waxing Crescent', 'rising',  'Overcast',      84),
  (t32, 'Full Moon',       'steady',  'Partly Cloudy', 82),
  (t33, 'Waning Gibbous',  'falling', 'Clear',         79),
  (t34, 'New Moon',        'rising',  'Clear',         81),
  (t35, 'Full Moon',       'steady',  'Overcast',      72),
  (t36, 'Waning Gibbous',  'falling', 'Partly Cloudy', 68),
  (t37, 'New Moon',        'rising',  'Clear',         65),
  (t38, 'First Quarter',   'steady',  'Clear',         67),
  (t39, 'Full Moon',       'steady',  'Overcast',      58),
  (t40, 'Waning Gibbous',  'falling', 'Clear',         54),
  (t41, 'New Moon',        'rising',  'Partly Cloudy', 44),
  (t42, 'Waxing Crescent', 'rising',  'Clear',         49),
  (t43, 'Full Moon',       'steady',  'Clear',         53),
  (t44, 'Waning Gibbous',  'falling', 'Overcast',      62),
  (t45, 'New Moon',        'rising',  'Partly Cloudy', 65),
  (t46, 'First Quarter',   'rising',  'Overcast',      68),
  (t47, 'Full Moon',       'steady',  'Clear',         72),
  (t48, 'Waning Gibbous',  'falling', 'Partly Cloudy', 69),
  (t49, 'New Moon',        'rising',  'Clear',         70),
  (t50, 'Waxing Crescent', 'rising',  'Overcast',      74),
  (t51, 'Full Moon',       'steady',  'Clear',         77),
  (t52, 'Waning Gibbous',  'falling', 'Clear',         79),
  (t53, 'New Moon',        'rising',  'Overcast',      75),
  (t54, 'First Quarter',   'steady',  'Clear',         78),
  (t55, 'Full Moon',       'steady',  'Partly Cloudy', 80),
  (t56, 'Waning Gibbous',  'rising',  'Clear',         82),
  (t57, 'New Moon',        'rising',  'Clear',         84),
  (t58, 'Waxing Crescent', 'rising',  'Partly Cloudy', 81),
  (t59, 'Full Moon',       'steady',  'Overcast',      83),
  (t60, 'Waning Gibbous',  'falling', 'Clear',         85);

-- =============================================================================
-- LIVE CATCHES (trip_live_catches — powers time-of-day analytics)
-- 2026 trips logged via Trip Mode. Morning dominates as expected.
-- =============================================================================
INSERT INTO public.trip_live_catches (trip_id, species, count, logged_at, caught_on) VALUES
  -- t49 May 3, 2026 — Trophy Musky
  (t49, 'Musky',          1, '2026-05-03 07:22:00-05', 'Bucktail Spinner'),
  (t49, 'Largemouth Bass',1, '2026-05-03 08:45:00-05', 'Topwater Frog'),
  (t49, 'Musky',          1, '2026-05-03 09:10:00-05', 'Jerkbait'),
  (t49, 'Largemouth Bass',1, '2026-05-03 10:30:00-05', 'Soft Plastics'),
  (t49, 'Musky',          1, '2026-05-03 13:15:00-05', 'Bucktail Spinner'),
  -- t50 May 8, 2026 — Full Day
  (t50, 'Largemouth Bass',1, '2026-05-08 06:55:00-05', 'Topwater Frog'),
  (t50, 'Largemouth Bass',1, '2026-05-08 07:30:00-05', 'Crankbait'),
  (t50, 'Walleye',        1, '2026-05-08 08:15:00-05', 'Jig'),
  (t50, 'Largemouth Bass',1, '2026-05-08 09:00:00-05', 'Soft Plastics'),
  (t50, 'Walleye',        1, '2026-05-08 09:45:00-05', 'Jig'),
  (t50, 'Largemouth Bass',1, '2026-05-08 10:20:00-05', 'Crankbait'),
  (t50, 'Walleye',        1, '2026-05-08 11:00:00-05', 'Jig'),
  (t50, 'Largemouth Bass',1, '2026-05-08 12:30:00-05', 'Soft Plastics'),
  (t50, 'Walleye',        1, '2026-05-08 13:45:00-05', 'Jig'),
  -- t51 May 14, 2026 — Full Day
  (t51, 'Largemouth Bass',1, '2026-05-14 06:30:00-05', 'Topwater Frog'),
  (t51, 'Largemouth Bass',1, '2026-05-14 07:10:00-05', 'Crankbait'),
  (t51, 'Largemouth Bass',1, '2026-05-14 07:55:00-05', 'Soft Plastics'),
  (t51, 'Largemouth Bass',1, '2026-05-14 08:30:00-05', 'Crankbait'),
  (t51, 'Musky',          1, '2026-05-14 09:15:00-05', 'Bucktail Spinner'),
  (t51, 'Largemouth Bass',1, '2026-05-14 10:05:00-05', 'Topwater Frog'),
  (t51, 'Largemouth Bass',1, '2026-05-14 11:20:00-05', 'Soft Plastics'),
  (t51, 'Largemouth Bass',1, '2026-05-14 12:45:00-05', 'Crankbait'),
  (t51, 'Largemouth Bass',1, '2026-05-14 13:30:00-05', 'Soft Plastics'),
  -- t53 May 22, 2026 — Trophy Musky
  (t53, 'Musky',          1, '2026-05-22 06:45:00-05', 'Bucktail Spinner'),
  (t53, 'Musky',          1, '2026-05-22 08:20:00-05', 'Jerkbait'),
  (t53, 'Northern Pike',  1, '2026-05-22 09:55:00-05', 'Spinnerbait'),
  (t53, 'Musky',          1, '2026-05-22 11:30:00-05', 'Bucktail Spinner'),
  (t53, 'Musky',          1, '2026-05-22 13:00:00-05', 'Jerkbait'),
  (t53, 'Northern Pike',  1, '2026-05-22 14:45:00-05', 'Spinnerbait'),
  -- t54 May 28, 2026 — Full Day
  (t54, 'Walleye',        1, '2026-05-28 06:15:00-05', 'Jig'),
  (t54, 'Walleye',        1, '2026-05-28 07:00:00-05', 'Crankbait'),
  (t54, 'Walleye',        1, '2026-05-28 07:45:00-05', 'Jig'),
  (t54, 'Largemouth Bass',1, '2026-05-28 08:30:00-05', 'Soft Plastics'),
  (t54, 'Walleye',        1, '2026-05-28 09:10:00-05', 'Jig'),
  (t54, 'Walleye',        1, '2026-05-28 10:00:00-05', 'Crankbait'),
  (t54, 'Largemouth Bass',1, '2026-05-28 11:15:00-05', 'Soft Plastics'),
  (t54, 'Walleye',        1, '2026-05-28 12:00:00-05', 'Jig'),
  (t54, 'Largemouth Bass',1, '2026-05-28 12:50:00-05', 'Crankbait'),
  (t54, 'Walleye',        1, '2026-05-28 13:30:00-05', 'Jig'),
  -- t56 June 1, 2026 — Trophy Musky
  (t56, 'Musky',          1, '2026-06-01 05:50:00-05', 'Bucktail Spinner'),
  (t56, 'Northern Pike',  1, '2026-06-01 07:10:00-05', 'Spinnerbait'),
  (t56, 'Musky',          1, '2026-06-01 08:30:00-05', 'Jerkbait'),
  (t56, 'Northern Pike',  1, '2026-06-01 10:15:00-05', 'Spinnerbait'),
  (t56, 'Musky',          1, '2026-06-01 12:00:00-05', 'Bucktail Spinner'),
  (t56, 'Northern Pike',  1, '2026-06-01 14:20:00-05', 'Spinnerbait'),
  -- t57 June 3, 2026 — Full Day
  (t57, 'Largemouth Bass',1, '2026-06-03 06:20:00-05', 'Topwater Frog'),
  (t57, 'Largemouth Bass',1, '2026-06-03 07:05:00-05', 'Crankbait'),
  (t57, 'Largemouth Bass',1, '2026-06-03 07:50:00-05', 'Topwater Frog'),
  (t57, 'Walleye',        1, '2026-06-03 08:35:00-05', 'Jig'),
  (t57, 'Largemouth Bass',1, '2026-06-03 09:20:00-05', 'Soft Plastics'),
  (t57, 'Walleye',        1, '2026-06-03 10:10:00-05', 'Crankbait'),
  (t57, 'Largemouth Bass',1, '2026-06-03 11:00:00-05', 'Topwater Frog'),
  (t57, 'Walleye',        1, '2026-06-03 11:50:00-05', 'Jig'),
  (t57, 'Largemouth Bass',1, '2026-06-03 12:40:00-05', 'Crankbait'),
  (t57, 'Walleye',        1, '2026-06-03 13:30:00-05', 'Jig'),
  (t57, 'Largemouth Bass',1, '2026-06-03 14:10:00-05', 'Soft Plastics'),
  -- t58 June 5, 2026 — Full Day
  (t58, 'Largemouth Bass',1, '2026-06-05 07:00:00-05', 'Topwater Frog'),
  (t58, 'Largemouth Bass',1, '2026-06-05 07:45:00-05', 'Crankbait'),
  (t58, 'Musky',          1, '2026-06-05 08:30:00-05', 'Bucktail Spinner'),
  (t58, 'Largemouth Bass',1, '2026-06-05 09:15:00-05', 'Soft Plastics'),
  (t58, 'Largemouth Bass',1, '2026-06-05 10:00:00-05', 'Crankbait'),
  (t58, 'Musky',          1, '2026-06-05 11:30:00-05', 'Jerkbait'),
  (t58, 'Largemouth Bass',1, '2026-06-05 12:15:00-05', 'Topwater Frog'),
  (t58, 'Largemouth Bass',1, '2026-06-05 13:00:00-05', 'Soft Plastics'),
  (t58, 'Largemouth Bass',1, '2026-06-05 13:45:00-05', 'Crankbait'),
  -- t59 June 6, 2026 — Trophy Musky
  (t59, 'Musky',          1, '2026-06-06 06:10:00-05', 'Bucktail Spinner'),
  (t59, 'Musky',          1, '2026-06-06 08:00:00-05', 'Jerkbait'),
  (t59, 'Musky',          1, '2026-06-06 09:45:00-05', 'Bucktail Spinner'),
  (t59, 'Northern Pike',  1, '2026-06-06 11:20:00-05', 'Spinnerbait'),
  (t59, 'Musky',          1, '2026-06-06 13:00:00-05', 'Jerkbait'),
  (t59, 'Musky',          1, '2026-06-06 14:50:00-05', 'Bucktail Spinner'),
  -- t60 June 7, 2026 — Full Day
  (t60, 'Walleye',        1, '2026-06-07 06:45:00-05', 'Jig'),
  (t60, 'Walleye',        1, '2026-06-07 07:30:00-05', 'Crankbait'),
  (t60, 'Largemouth Bass',1, '2026-06-07 08:20:00-05', 'Soft Plastics'),
  (t60, 'Walleye',        1, '2026-06-07 09:05:00-05', 'Jig'),
  (t60, 'Walleye',        1, '2026-06-07 09:50:00-05', 'Crankbait'),
  (t60, 'Largemouth Bass',1, '2026-06-07 10:35:00-05', 'Topwater Frog'),
  (t60, 'Walleye',        1, '2026-06-07 11:20:00-05', 'Jig'),
  (t60, 'Largemouth Bass',1, '2026-06-07 12:10:00-05', 'Soft Plastics'),
  (t60, 'Walleye',        1, '2026-06-07 13:00:00-05', 'Crankbait'),
  (t60, 'Largemouth Bass',1, '2026-06-07 13:45:00-05', 'Topwater Frog');

END $$;
