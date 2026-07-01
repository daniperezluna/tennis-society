-- Seed: create a PLAYER user for each team that doesn't already have a user
INSERT INTO "AdminUser" (email, "passwordHash", name, role, "createdAt")
SELECT
  t.email,
  '$2b$12$9/4dnk.ucNnSzFyCN1ph3eyxzIbNqHIl7x4SDWW/ygx66j6fd2H7y',
  t.name,
  'PLAYER',
  NOW()
FROM "Team" t
WHERE t.email IS NOT NULL
  AND t.email <> ''
  AND NOT EXISTS (
    SELECT 1 FROM "AdminUser" u WHERE u.email = t.email
  );
