DO $$
BEGIN
    DROP TABLE IF EXISTS settings CASCADE;
    DROP TABLE IF EXISTS operating_hours CASCADE;
    DROP TABLE IF EXISTS audit_logs CASCADE;
    DROP TABLE IF EXISTS users CASCADE;
    DROP TABLE IF EXISTS permissions CASCADE;
    DROP TABLE IF EXISTS roles CASCADE;
    DROP TABLE IF EXISTS role_permissions CASCADE;
    DROP TABLE IF EXISTS user_permissions CASCADE;
    DROP TABLE IF EXISTS user_unavailability CASCADE;
    DROP TABLE IF EXISTS clients CASCADE;
    DROP TABLE IF EXISTS client_contacts CASCADE;
    DROP TABLE IF EXISTS custom_form_elements CASCADE;
    DROP TABLE IF EXISTS custom_forms CASCADE;
    DROP TABLE IF EXISTS appointments CASCADE;
    DROP TABLE IF EXISTS locations CASCADE;
    DROP TABLE IF EXISTS reports CASCADE;
    DROP TABLE IF EXISTS notifications CASCADE;
    DROP TABLE IF EXISTS messages CASCADE;
    DROP TABLE IF EXISTS message_recipients CASCADE;

    DROP FUNCTION IF EXISTS set_updated_at() CASCADE;

    DROP DOMAIN IF EXISTS phone_e164 CASCADE;

    DROP TYPE IF EXISTS contact_preference CASCADE;
    DROP TYPE IF EXISTS audit_action CASCADE;
    DROP TYPE IF EXISTS gender_options CASCADE;
END $$;

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Set updated at trigger
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Domain types

CREATE DOMAIN phone_e164 AS TEXT CHECK (VALUE ~ '^\+[1-9]\d{1,14}$');

-- Enum types
CREATE TYPE contact_preference AS ENUM ('email', 'phone');
CREATE TYPE audit_action AS ENUM ('auth', 'add', 'change', 'delete', 'error');
CREATE TYPE permission_action AS ENUM ('read', 'create', 'update', 'delete', 'export');
CREATE TYPE gender_options AS ENUM ('Male', 'Female', 'Other');
CREATE TYPE message_type AS ENUM ('email', 'text-message');
CREATE TYPE message_status AS ENUM ('sent', 'pending', 'failed');
-- Might want to change appointment_status to a table if they want user defined portion of it?
CREATE TYPE appointment_status ENUM ('Unassigned', 'Scheduled', 'Cancelled', 'Completed', 'Withdrawn');
CREATE TYPE donation_type ENUM ('Cash', 'Check', 'Envelope', 'Electronic', 'None');

-- Settings
-- Not sure how to implement this since some of this 
-- information is in the system database

-- Operating hours
-- Not sure how to implement this since some of this 

-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email CITEXT NOT NULL UNIQUE,
    phone phone_e164,
    contact_preference contact_preference NOT NULL DEFAULT 'email',
    password_hash VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER users_set_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Audit logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    object_id UUID,
    action_type audit_action NOT NULL,
    action_message TEXT,
    action_details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_object ON audit_logs (object_id);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_logs (created_at);
CREATE INDEX IF NOT EXISTS idx_audit_action_type ON audit_logs (action_type);
CREATE INDEX IF NOT EXISTS idx_audit_details_gin ON audit_logs USING GIN (action_details);

-- Permissions
CREATE DOMAIN slug_key AS TEXT
    CHECK (VALUE ~ '^[a-z0-9][a-z0-9.-]*$');

CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    perm_key slug_key NOT NULL UNIQUE,
    resource slug_key NOT NULL,
    action permission_action NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    CONSTRAINT permissions_perm_key_format CHECK (perm_key = resource || '.' || action)
);

CREATE INDEX idx_permissions_resource_action ON permissions(resource, action);
CREATE INDEX idx_permissions_category ON permissions(category);

-- Roles
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_key slug_key NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER roles_set_updated_at
    BEFORE UPDATE ON roles
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Role Permissions
CREATE TABLE role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    grant_access BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (role_id, permission_id)
);

-- User Permissions
CREATE TABLE user_permissions (
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    grant_access BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (permission_id, user_id)
);

-- User Unavailability
-- Complexity that we need to go over !!! TODO

-- Locations
CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alias_name VARCHAR(255),
    address_line_1 VARCHAR(255) NOT NULL,
    address_line_2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VHARCHAR(50) NOT NULL,
    zip VARCHAR(20) NOT NULL,
    country VARCHAR(100) NOT NULL,
    address_validated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS locations_city_state_idx ON locations (city, state);
CREATE INDEX IF NOT EXISTS locations_state_idx ON locations (state);
CREATE INDEX IF NOT EXISTS locations_zip_idx ON locations (zip);

CREATE UNIQUE INDEX IF NOT EXISTS locations_address_unique
    ON locations (
        lower(address_line_1),
        COALESCE(lower(address_line_2), ''),
        lower(city),
        lower(state),
        lower(zip),
        lower(country)
    );

CREATE INDEX IF NOT EXISTS locations_alias_trgm_idx
    ON locations USING GIN (alias_name gin_trgm_ops);

CREATE TRIGGER locations_set_updated_at
    BEFORE UPDATE ON locations
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Clients
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email CITEXT,
    phone phone_e164 NOT NULL UNIQUE,
    phone_is_cell BOOLEAN NOT NULL DEFAULT FALSE,
    secondary_phone phone_e164,
    secondary_phone_is_cell BOOLEAN NOT NULL DEFAULT FALSE,
    contact_preference contact_preference NOT NULL DEFAULT 'phone',
    allow_messages BOOLEAN NOT NULL DEFAULT FALSE,
    gender gender_options NOT NULL,
    birth_year INT
        CHECK (
            birth_year IS NULL OR birth_year BETWEEN 1900 AND EXTRACT(YEAR FROM CURRENT_DATE)::INT
        ),
    birth_month INT
        CHECK (birth_month IS NULL OR (birth_month BETWEEN 1 AND 12)),
    lives_alone BOOLEAN NOT NULL,
    address_location UUID NOT NULL REFERENCES location(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT phones_not_same CHECK (secondary_phone IS NULL OR secondary_phone <> phone)
);

CREATE INDEX IF NOT EXISTS clients_address_idx ON clients (address); 
CREATE INDEX IF NOT EXISTS clients_active_true ON clients (id) WHERE is_active;
CREATE INDEX IF NOT EXISTS clients_created_at_idx ON clients (created_at DESC);

-- Case-insensitive unique email, but only when present
CREATE UNIQUE INDEX IF NOT EXISTS clients_email_uq
    ON clients (email)
    WHERE email IS NOT NULL;

-- Fast lookups by last name / full name (ILIKE/search)
CREATE INDEX IF NOT EXISTS clients_last_name_trgm_idx
    ON clients USING GIN (last_name gin_trgm_ops);

-- Searching by full name; concat + trigram helper "John Do"/"Jon Doe"
CREATE INDEX IF NOT EXISTS clients_full_name_trgm_idx
    ON clients USING GIN ((first_name || ' ' || last_name) gin_trgm_ops);

-- search emails with ILIKE
CREATE INDEX IF NOT EXISTS clients_email_trgm_idx
    ON clients USING GIN (email gin_trgm_ops);

-- filter “cell only”
CREATE INDEX IF NOT EXISTS clients_cell_only_idx
    ON clients (phone) WHERE phone_is_cell;

-- Client call log types
CREATE TABLE call_log_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(50) NOT NULL
)

-- Client call log
CREATE TABLE call_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by_user_id UUID NOT NULL REFERENCES users(id),
    date DATE NOT NULL,
    call_type UUID NOT NULL REFERENCES call_log_types(id),
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    phone_number phone_e164 NOT NULL,
    message TEXT,
    notes TEXT,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Custom forms
CREATE TABLE custom_forms (

);

-- Custom form field submissions
CREATE TABLE custom_form_field_submissions (

);

-- Appointments
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id),
    driver_id UUID REFERENCES users(id),
    dispatcher_id UUID NOT NULL REFERENCES users(id),
    created_by_user_id UUID NOT NULL REFERENCES users(id),
    status appointment_status NOT NULL DEFAULT 'Unassigned',
    start_date DATE NOT NULL,
    start_time TIME NOT NULL,
    estimated_duration_minutes INT,
    pickup_location UUID NOT NULL REFERENCES locations(id),
    destination_location UUID NOT NULL REFERENCES locations(id),
    trip_count INT NOT NULL DEFAULT 1,
    trip_purpose TEXT,
    notes TEXT,
    donation_type donation_type NOT NULL DEFAULT 'None',
    donation_amount MONEY,
    miles_driven INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Custom reports
CREATE TABLE custom_reports (

);

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    title VARCHAR(255) NOT NULL,
    descripton TEXT,
    is_dismissed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Messages

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES users(id),
    message_type message_type NOT NULL DEFAULT 'email',
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status message_status NOT NULL DEFAULT 'pending'
);

-- Message recipients
CREATE TABLE message_recipients (
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (message_id, user_id)
);

