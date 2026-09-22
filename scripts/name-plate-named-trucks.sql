-- Certified trucks seeded by seed-hr-trucks.js were named after their number
-- plate ("HR 38 W 2162"). Rename them "<year> <brand> <model>" from their own
-- columns. "Ashok" is written out as "Ashok Leyland", as the browse page does.
--
-- Previous names, for reverting:
--   57 HR 38 W 2162   58 HR 38 W 2263   59 HR 38 W 3426   60 HR 55 X 0025
--   61 HR 55 X 0253   62 HR 55 X 1147   63 HR 55 X 2071   64 HR 55 X 4498
update trucks
set name = concat_ws(' ', year,
             case when manufacturer ~* '^ashok$' then 'Ashok Leyland' else trim(manufacturer) end,
             trim(model)),
    updated_at = now()
where certified
  and replace(upper(name), ' ', '') = upper(registration_number)
returning id, name;
