-- Demo values for listing columns no form answer or report supplies.
-- Certified trucks only; only empty values. Values are the truck page's own
-- fallbacks and its default quality report.
update public.trucks set
  gearbox                = coalesce(gearbox, '6-Speed Manual'),
  insurance_date         = coalesce(insurance_date, date '2025-12-31'),
  ownership_number       = coalesce(ownership_number, 1),
  tyres                  = coalesce(tyres, 6),
  payload_capacity_net   = coalesce(payload_capacity_net, 10000),
  payload_capacity_gross = coalesce(payload_capacity_gross, 16200),
  payload_capacity_ft    = coalesce(payload_capacity_ft, 20),
  manufactured_on        = coalesce(manufactured_on, '01/' || year),
  emission_norm          = coalesce(emission_norm, 'BS-VI'),
  quality_scores         = coalesce(quality_scores, '[
    {"group":"Core Systems","score":8,"items":[{"name":"Engine","score":8},{"name":"Transmission","score":8},{"name":"Drivetrain","score":9}]},
    {"group":"Loading Systems","score":8,"items":[{"name":"Hydraulics","score":8},{"name":"Cargo Bed","score":7},{"name":"Tipping Mechanism","score":7}]},
    {"group":"Cabin & Interiors","score":8,"items":[{"name":"Seats & Upholstering","score":9},{"name":"Dashboard & Controls","score":8}]},
    {"group":"Exterior & Body","score":9,"items":[{"name":"Body Panels","score":9},{"name":"Paint & Finish","score":9},{"name":"Light & Mirrors","score":9}]},
    {"group":"Safety & Brakes","score":9,"items":[{"name":"Brake System","score":9},{"name":"ABS Module","score":9},{"name":"Safety Features","score":8}]}
  ]'::jsonb)
where certified
  and (gearbox is null or insurance_date is null or ownership_number is null or tyres is null
       or payload_capacity_net is null or payload_capacity_gross is null or payload_capacity_ft is null
       or manufactured_on is null or emission_norm is null or quality_scores is null)
returning id;
