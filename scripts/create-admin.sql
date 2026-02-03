-- Create Admin User for Testing
-- Email: admin@lexoffice.at
-- This user will have the Administrator role with all permissions

DO $$
DECLARE
    admin_user_id text;
    admin_role_id uuid;
BEGIN
    -- Insert admin user if not exists
    INSERT INTO users (id, name, email, email_verified, role, status, created_at, updated_at)
    VALUES (
        gen_random_uuid()::text,
        'Admin User',
        'admin@lexoffice.at',
        NOW(),
        'employee',
        'active',
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO NOTHING
    RETURNING id INTO admin_user_id;

    -- Get the user ID if already exists
    IF admin_user_id IS NULL THEN
        SELECT id INTO admin_user_id FROM users WHERE email = 'admin@lexoffice.at';
    END IF;

    -- Get Administrator role ID
    SELECT id INTO admin_role_id FROM roles WHERE name = 'Administrator';

    -- Assign Administrator role to user if not already assigned
    INSERT INTO user_roles (id, user_id, role_id, assigned_at)
    VALUES (
        gen_random_uuid(),
        admin_user_id,
        admin_role_id,
        NOW()
    )
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Admin user created/updated: %', admin_user_id;
    RAISE NOTICE 'Email: admin@lexoffice.at';
    RAISE NOTICE 'To login, use the magic link authentication with this email';
END $$;
