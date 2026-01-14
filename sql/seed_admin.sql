-- Seed: create admin user with bcrypt-hashed password using pgcrypto (gen_salt('bf'))
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
DECLARE
  admin_email TEXT := 'admin@selfcare.local';
  admin_password TEXT := 'ChangeMe123!';
  exists_count INT;
BEGIN
  SELECT COUNT(1) INTO exists_count FROM users WHERE lower(email) = lower(admin_email);
  IF exists_count = 0 THEN
    INSERT INTO users (name, email, password_hash, role, created_at)
    VALUES (
      'Initial Admin',
      admin_email,
      crypt(admin_password, gen_salt('bf')),
      'admin',
      now()
    );
    RAISE NOTICE 'Admin user created: % (password: %)', admin_email, admin_password;
  ELSE
    RAISE NOTICE 'Admin user already exists: %', admin_email;
  END IF;
END$$;
