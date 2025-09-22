-- Drop tables if they exist (in reverse order of creation to handle dependencies)
DO $$ 
BEGIN
    -- Drop tables with foreign key dependencies first
    DROP TABLE IF EXISTS organization_configurations CASCADE;
    DROP TABLE IF EXISTS system_configurations CASCADE;
    DROP TABLE IF EXISTS report_configurations CASCADE;
    DROP TABLE IF EXISTS message_recipients CASCADE;
    DROP TABLE IF EXISTS messages CASCADE;
    DROP TABLE IF EXISTS appointment_trips CASCADE;
    DROP TABLE IF EXISTS appointments CASCADE;
    DROP TABLE IF EXISTS driver_accessibility_capabilities CASCADE;
    DROP TABLE IF EXISTS driver_availability CASCADE;
    DROP TABLE IF EXISTS drivers CASCADE;
    DROP TABLE IF EXISTS client_accessibility_needs CASCADE;
    DROP TABLE IF EXISTS custom_form_values CASCADE;
    DROP TABLE IF EXISTS custom_form_definitions CASCADE;
    DROP TABLE IF EXISTS clients CASCADE;
    DROP TABLE IF EXISTS user_permissions CASCADE;
    DROP TABLE IF EXISTS user_roles CASCADE;
    DROP TABLE IF EXISTS users CASCADE;
    DROP TABLE IF EXISTS role_permissions CASCADE;
    DROP TABLE IF EXISTS permissions CASCADE;
    DROP TABLE IF EXISTS roles CASCADE;
    DROP TABLE IF EXISTS organization_audit_logs CASCADE;
    DROP TABLE IF EXISTS organizations CASCADE;
    DROP TABLE IF EXISTS system_audit_logs CASCADE;
    
    -- Drop functions and triggers
    DROP FUNCTION IF EXISTS update_timestamp() CASCADE;
END $$;

-- Enable UUID extension for generating unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- System-wide audit log
CREATE TABLE system_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    user_id UUID,
    details JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Organizations
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    logo_path VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Organization audit logs
CREATE TABLE organization_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    user_id UUID,
    details JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Roles
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, name)
);

-- Permissions
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    category VARCHAR(50)
);

-- Role permissions mapping
CREATE TABLE role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    password_hash VARCHAR(255),
    contact_preference VARCHAR(20) DEFAULT 'email',
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE
);

-- User roles mapping
CREATE TABLE user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- User direct permissions (overrides)
CREATE TABLE user_permissions (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    is_granted BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (user_id, permission_id)
);

-- Clients
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    contact_preference VARCHAR(20) DEFAULT 'phone',
    gender VARCHAR(30),
    address_street VARCHAR(255),
    address_city VARCHAR(100),
    address_state VARCHAR(50),
    address_zip VARCHAR(20),
    address_validated BOOLEAN DEFAULT FALSE,
    notes TEXT,
    is_driver BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Custom form fields
CREATE TABLE custom_form_definitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    form_type VARCHAR(50) NOT NULL, -- 'client', 'driver', 'appointment', etc.
    field_name VARCHAR(100) NOT NULL,
    field_type VARCHAR(50) NOT NULL, -- 'text', 'select', 'checkbox', etc.
    field_label VARCHAR(255) NOT NULL,
    field_options JSONB, -- For select/dropdown options
    field_default VARCHAR(255),
    field_placeholder VARCHAR(255),
    is_required BOOLEAN DEFAULT FALSE,
    display_order INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, form_type, field_name)
);

-- Custom form values
CREATE TABLE custom_form_values (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    custom_field_id UUID NOT NULL REFERENCES custom_form_definitions(id),
    entity_id UUID NOT NULL, -- ID of the client, driver, appointment, etc.
    entity_type VARCHAR(50) NOT NULL, -- 'client', 'driver', 'appointment', etc.
    field_value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Client accessibility needs
CREATE TABLE client_accessibility_needs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    need_type VARCHAR(100) NOT NULL, -- 'wheelchair', 'service_animal', 'cane', etc.
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Drivers (extends users)
CREATE TABLE drivers (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    vehicle_type VARCHAR(100),
    vehicle_make VARCHAR(100),
    vehicle_model VARCHAR(100),
    vehicle_year INTEGER,
    vehicle_color VARCHAR(50),
    license_plate VARCHAR(20),
    max_passengers INTEGER DEFAULT 1,
    background_check_date DATE,
    driving_record_check_date DATE,
    insurance_verification_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Driver availability
CREATE TABLE driver_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID NOT NULL REFERENCES drivers(user_id) ON DELETE CASCADE,
    availability_type VARCHAR(20) NOT NULL, -- 'recurring', 'specific'
    day_of_week INTEGER, -- 0-6 for recurring (NULL for specific)
    specific_date DATE, -- NULL for recurring
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT TRUE, -- FALSE for blocking time off
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Driver accessibility capabilities
CREATE TABLE driver_accessibility_capabilities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID NOT NULL REFERENCES drivers(user_id) ON DELETE CASCADE,
    capability_type VARCHAR(100) NOT NULL, -- 'wheelchair', 'service_animal', 'cane', etc.
    can_accommodate BOOLEAN DEFAULT TRUE,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Appointments
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    client_id UUID NOT NULL REFERENCES clients(id),
    driver_id UUID REFERENCES drivers(user_id),
    created_by_id UUID REFERENCES users(id),
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME,
    status VARCHAR(50) NOT NULL DEFAULT 'scheduled', -- 'scheduled', 'completed', 'cancelled', etc.
    notes TEXT,
	actual_start_time TIMESTAMP WITH TIME ZONE,
    actual_end_time TIMESTAMP WITH TIME ZONE,
    total_miles DECIMAL(10, 2),
    total_hours DECIMAL(5, 2),
    donation_amount DECIMAL(10, 2),
    reported_by UUID REFERENCES users(id),
    reported_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Appointment trips (destinations)
CREATE TABLE appointment_trips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    sequence_number INTEGER NOT NULL,
    is_round_trip BOOLEAN DEFAULT FALSE,
    address_street VARCHAR(255) NOT NULL,
    address_street_2 VARCHAR(255),
    address_city VARCHAR(100) NOT NULL,
    address_state VARCHAR(50) NOT NULL,
    address_zip VARCHAR(20) NOT NULL,
    address_validated BOOLEAN DEFAULT FALSE,
    actual_distance DECIMAL(10, 2), -- in miles
    start_time TIME,
    end_time TIME,
    status VARCHAR(50) DEFAULT 'scheduled', -- 'scheduled', 'completed', 'cancelled', etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(appointment_id, sequence_number)
);

-- Messages
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    sender_id UUID REFERENCES users(id),
    message_type VARCHAR(20) NOT NULL, -- 'email', 'sms'
    subject VARCHAR(255),
    body TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending' -- 'pending', 'sent', 'failed'
);

-- Message recipients
CREATE TABLE message_recipients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    recipient_type VARCHAR(20) NOT NULL, -- 'user', 'client', 'driver'
    recipient_id UUID NOT NULL, -- ID of user, client, or driver
    message_type VARCHAR(20) NOT NULL -- 'email', 'sms'
);

-- Report configurations
CREATE TABLE report_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    query_type VARCHAR(20) NOT NULL, -- 'sql', 'visual'
    query_definition TEXT, -- SQL query or JSON definition for visual query
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- System configuration
CREATE TABLE system_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value TEXT,
    description TEXT,
    is_encrypted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Organization configurations
CREATE TABLE organization_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    config_key VARCHAR(100) NOT NULL,
    config_value TEXT,
    description TEXT,
    is_encrypted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, config_key)
);


-- ---------------------------------------------------------------------------------------------------------------------


-- Create indexes for performance
CREATE INDEX idx_users_organization ON users(organization_id);
CREATE INDEX idx_clients_organization ON clients(organization_id);
CREATE INDEX idx_appointments_organization ON appointments(organization_id);
CREATE INDEX idx_appointments_client ON appointments(client_id);
CREATE INDEX idx_appointments_driver ON appointments(driver_id);
CREATE INDEX idx_appointments_date ON appointments(date);
CREATE INDEX idx_driver_availability_driver ON driver_availability(driver_id);
CREATE INDEX idx_custom_form_values_entity ON custom_form_values(entity_type, entity_id);
CREATE INDEX idx_organization_audit_logs_org ON organization_audit_logs(organization_id);
CREATE INDEX idx_messages_organization ON messages(organization_id);


-- ---------------------------------------------------------------------------------------------------------------------


-- Function to update timestamp on records
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- For triggers, first check if they exist before creating them
DO $$
BEGIN
    -- Check if the trigger already exists before creating it
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_organizations_timestamp' 
        AND tgrelid = 'organizations'::regclass
    ) THEN
        CREATE TRIGGER update_organizations_timestamp 
        BEFORE UPDATE ON organizations
        FOR EACH ROW EXECUTE FUNCTION update_timestamp();
    END IF;
    
    -- Repeat for other triggers
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_users_timestamp' 
        AND tgrelid = 'users'::regclass
    ) THEN
        CREATE TRIGGER update_users_timestamp 
        BEFORE UPDATE ON users
        FOR EACH ROW EXECUTE FUNCTION update_timestamp();
    END IF;
    
    -- Continue with other triggers using the same pattern...
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_clients_timestamp' 
        AND tgrelid = 'clients'::regclass
    ) THEN
        CREATE TRIGGER update_clients_timestamp 
        BEFORE UPDATE ON clients
        FOR EACH ROW EXECUTE FUNCTION update_timestamp();
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_appointments_timestamp' 
        AND tgrelid = 'appointments'::regclass
    ) THEN
        CREATE TRIGGER update_appointments_timestamp 
        BEFORE UPDATE ON appointments
        FOR EACH ROW EXECUTE FUNCTION update_timestamp();
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_custom_form_definitions_timestamp' 
        AND tgrelid = 'custom_form_definitions'::regclass
    ) THEN
        CREATE TRIGGER update_custom_form_definitions_timestamp 
        BEFORE UPDATE ON custom_form_definitions
        FOR EACH ROW EXECUTE FUNCTION update_timestamp();
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_custom_form_values_timestamp' 
        AND tgrelid = 'custom_form_values'::regclass
    ) THEN
        CREATE TRIGGER update_custom_form_values_timestamp 
        BEFORE UPDATE ON custom_form_values
        FOR EACH ROW EXECUTE FUNCTION update_timestamp();
    END IF;
    
END $$;


-- ---------------------------------------------------------------------------------------------------------------------


-- Insert default roles conditionally
DO $$
BEGIN
    -- System Administrator
    IF NOT EXISTS (SELECT 1 FROM roles WHERE name = 'System Administrator') THEN
        INSERT INTO roles (id, name, description)
        VALUES (uuid_generate_v4(), 'System Administrator', 'Has full access to all system features');
    END IF;
    
    -- Organization Administrator
    IF NOT EXISTS (SELECT 1 FROM roles WHERE name = 'Organization Administrator') THEN
        INSERT INTO roles (id, name, description)
        VALUES (uuid_generate_v4(), 'Organization Administrator', 'Has full access to organization features');
    END IF;
    
    -- Dispatcher
    IF NOT EXISTS (SELECT 1 FROM roles WHERE name = 'Dispatcher') THEN
        INSERT INTO roles (id, name, description)
        VALUES (uuid_generate_v4(), 'Dispatcher', 'Can manage appointments and clients');
    END IF;
    
    -- Driver
    IF NOT EXISTS (SELECT 1 FROM roles WHERE name = 'Driver') THEN
        INSERT INTO roles (id, name, description)
        VALUES (uuid_generate_v4(), 'Driver', 'Can view and update assigned rides');
    END IF;
    
    -- Client
    IF NOT EXISTS (SELECT 1 FROM roles WHERE name = 'Client') THEN
        INSERT INTO roles (id, name, description)
        VALUES (uuid_generate_v4(), 'Client', 'Can view and request rides');
    END IF;
END $$;

-- Insert default permissions conditionally
DO $$
DECLARE
    perm_id UUID;
BEGIN
    -- User management permissions
    IF NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'manage_users') THEN
        INSERT INTO permissions (id, name, description, category)
        VALUES (uuid_generate_v4(), 'manage_users', 'Create, edit, and deactivate users', 'users');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'view_users') THEN
        INSERT INTO permissions (id, name, description, category)
        VALUES (uuid_generate_v4(), 'view_users', 'View user details', 'users');
    END IF;
    
    -- Client management permissions
    IF NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'manage_clients') THEN
        INSERT INTO permissions (id, name, description, category)
        VALUES (uuid_generate_v4(), 'manage_clients', 'Create, edit, and deactivate clients', 'clients');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'view_clients') THEN
        INSERT INTO permissions (id, name, description, category)
        VALUES (uuid_generate_v4(), 'view_clients', 'View client details', 'clients');
    END IF;
    
    -- Driver management permissions
    IF NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'manage_drivers') THEN
        INSERT INTO permissions (id, name, description, category)
        VALUES (uuid_generate_v4(), 'manage_drivers', 'Create, edit, and deactivate drivers', 'drivers');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'view_drivers') THEN
        INSERT INTO permissions (id, name, description, category)
        VALUES (uuid_generate_v4(), 'view_drivers', 'View driver details', 'drivers');
    END IF;
    
    -- Appointment management permissions
    IF NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'manage_appointments') THEN
        INSERT INTO permissions (id, name, description, category)
        VALUES (uuid_generate_v4(), 'manage_appointments', 'Create, edit, and cancel appointments', 'appointments');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'view_appointments') THEN
        INSERT INTO permissions (id, name, description, category)
        VALUES (uuid_generate_v4(), 'view_appointments', 'View appointment details', 'appointments');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'report_trip_details') THEN
        INSERT INTO permissions (id, name, description, category)
        VALUES (uuid_generate_v4(), 'report_trip_details', 'Report trip completion details', 'appointments');
    END IF;
    
    -- Organization management permissions
    IF NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'manage_organization_settings') THEN
        INSERT INTO permissions (id, name, description, category)
        VALUES (uuid_generate_v4(), 'manage_organization_settings', 'Edit organization settings', 'organization');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'manage_roles') THEN
        INSERT INTO permissions (id, name, description, category)
        VALUES (uuid_generate_v4(), 'manage_roles', 'Create and edit roles', 'organization');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'view_audit_logs') THEN
        INSERT INTO permissions (id, name, description, category)
        VALUES (uuid_generate_v4(), 'view_audit_logs', 'View audit logs', 'organization');
    END IF;
    
    -- System management permissions
    IF NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'manage_system_settings') THEN
        INSERT INTO permissions (id, name, description, category)
        VALUES (uuid_generate_v4(), 'manage_system_settings', 'Edit system settings', 'system');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'manage_organizations') THEN
        INSERT INTO permissions (id, name, description, category)
        VALUES (uuid_generate_v4(), 'manage_organizations', 'Create and edit organizations', 'system');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'view_system_logs') THEN
        INSERT INTO permissions (id, name, description, category)
        VALUES (uuid_generate_v4(), 'view_system_logs', 'View system logs', 'system');
    END IF;
END $$;

-- Set up default role permissions
DO $$
DECLARE
    sys_admin_role_id UUID;
    org_admin_role_id UUID;
    dispatcher_role_id UUID;
    driver_role_id UUID;
    client_role_id UUID;
    
    -- Permission IDs
    perm_manage_users UUID;
    perm_view_users UUID;
    perm_manage_clients UUID;
    perm_view_clients UUID;
    perm_manage_drivers UUID;
    perm_view_drivers UUID;
    perm_manage_appointments UUID;
    perm_view_appointments UUID;
    perm_report_trip_details UUID;
    perm_manage_org_settings UUID;
    perm_manage_roles UUID;
    perm_view_audit_logs UUID;
    perm_manage_sys_settings UUID;
    perm_manage_orgs UUID;
    perm_view_sys_logs UUID;
BEGIN
    -- Get role IDs
    SELECT id INTO sys_admin_role_id FROM roles WHERE name = 'System Administrator';
    SELECT id INTO org_admin_role_id FROM roles WHERE name = 'Organization Administrator';
    SELECT id INTO dispatcher_role_id FROM roles WHERE name = 'Dispatcher';
    SELECT id INTO driver_role_id FROM roles WHERE name = 'Driver';
    SELECT id INTO client_role_id FROM roles WHERE name = 'Client';
    
    -- Get permission IDs
    SELECT id INTO perm_manage_users FROM permissions WHERE name = 'manage_users';
    SELECT id INTO perm_view_users FROM permissions WHERE name = 'view_users';
    SELECT id INTO perm_manage_clients FROM permissions WHERE name = 'manage_clients';
    SELECT id INTO perm_view_clients FROM permissions WHERE name = 'view_clients';
    SELECT id INTO perm_manage_drivers FROM permissions WHERE name = 'manage_drivers';
    SELECT id INTO perm_view_drivers FROM permissions WHERE name = 'view_drivers';
    SELECT id INTO perm_manage_appointments FROM permissions WHERE name = 'manage_appointments';
    SELECT id INTO perm_view_appointments FROM permissions WHERE name = 'view_appointments';
    SELECT id INTO perm_report_trip_details FROM permissions WHERE name = 'report_trip_details';
    SELECT id INTO perm_manage_org_settings FROM permissions WHERE name = 'manage_organization_settings';
    SELECT id INTO perm_manage_roles FROM permissions WHERE name = 'manage_roles';
    SELECT id INTO perm_view_audit_logs FROM permissions WHERE name = 'view_audit_logs';
    SELECT id INTO perm_manage_sys_settings FROM permissions WHERE name = 'manage_system_settings';
    SELECT id INTO perm_manage_orgs FROM permissions WHERE name = 'manage_organizations';
    SELECT id INTO perm_view_sys_logs FROM permissions WHERE name = 'view_system_logs';
    
    -- Assign permissions to System Administrator
    IF sys_admin_role_id IS NOT NULL THEN
        -- System Administrator gets all permissions
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT sys_admin_role_id, id FROM permissions
        WHERE NOT EXISTS (
            SELECT 1 FROM role_permissions 
            WHERE role_id = sys_admin_role_id AND permission_id = permissions.id
        );
    END IF;
    
    -- Assign permissions to Organization Administrator
    IF org_admin_role_id IS NOT NULL THEN
        -- Organization level permissions only
        IF NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_id = org_admin_role_id AND permission_id = perm_manage_users) THEN
            INSERT INTO role_permissions (role_id, permission_id) VALUES (org_admin_role_id, perm_manage_users);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_id = org_admin_role_id AND permission_id = perm_view_users) THEN
            INSERT INTO role_permissions (role_id, permission_id) VALUES (org_admin_role_id, perm_view_users);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_id = org_admin_role_id AND permission_id = perm_manage_clients) THEN
            INSERT INTO role_permissions (role_id, permission_id) VALUES (org_admin_role_id, perm_manage_clients);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_id = org_admin_role_id AND permission_id = perm_view_clients) THEN
            INSERT INTO role_permissions (role_id, permission_id) VALUES (org_admin_role_id, perm_view_clients);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_id = org_admin_role_id AND permission_id = perm_manage_drivers) THEN
            INSERT INTO role_permissions (role_id, permission_id) VALUES (org_admin_role_id, perm_manage_drivers);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_id = org_admin_role_id AND permission_id = perm_view_drivers) THEN
            INSERT INTO role_permissions (role_id, permission_id) VALUES (org_admin_role_id, perm_view_drivers);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_id = org_admin_role_id AND permission_id = perm_manage_appointments) THEN
            INSERT INTO role_permissions (role_id, permission_id) VALUES (org_admin_role_id, perm_manage_appointments);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_id = org_admin_role_id AND permission_id = perm_view_appointments) THEN
            INSERT INTO role_permissions (role_id, permission_id) VALUES (org_admin_role_id, perm_view_appointments);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_id = org_admin_role_id AND permission_id = perm_manage_org_settings) THEN
            INSERT INTO role_permissions (role_id, permission_id) VALUES (org_admin_role_id, perm_manage_org_settings);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_id = org_admin_role_id AND permission_id = perm_manage_roles) THEN
            INSERT INTO role_permissions (role_id, permission_id) VALUES (org_admin_role_id, perm_manage_roles);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_id = org_admin_role_id AND permission_id = perm_view_audit_logs) THEN
            INSERT INTO role_permissions (role_id, permission_id) VALUES (org_admin_role_id, perm_view_audit_logs);
        END IF;
    END IF;
    
    -- Assign permissions to Dispatcher
    IF dispatcher_role_id IS NOT NULL THEN
        -- Client and appointment related permissions
        IF NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_id = dispatcher_role_id AND permission_id = perm_view_users) THEN
            INSERT INTO role_permissions (role_id, permission_id) VALUES (dispatcher_role_id, perm_view_users);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_id = dispatcher_role_id AND permission_id = perm_manage_clients) THEN
            INSERT INTO role_permissions (role_id, permission_id) VALUES (dispatcher_role_id, perm_manage_clients);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_id = dispatcher_role_id AND permission_id = perm_view_clients) THEN
            INSERT INTO role_permissions (role_id, permission_id) VALUES (dispatcher_role_id, perm_view_clients);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_id = dispatcher_role_id AND permission_id = perm_view_drivers) THEN
            INSERT INTO role_permissions (role_id, permission_id) VALUES (dispatcher_role_id, perm_view_drivers);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_id = dispatcher_role_id AND permission_id = perm_manage_appointments) THEN
            INSERT INTO role_permissions (role_id, permission_id) VALUES (dispatcher_role_id, perm_manage_appointments);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_id = dispatcher_role_id AND permission_id = perm_view_appointments) THEN
            INSERT INTO role_permissions (role_id, permission_id) VALUES (dispatcher_role_id, perm_view_appointments);
        END IF;
    END IF;
    
    -- Assign permissions to Driver
    IF driver_role_id IS NOT NULL THEN
        -- Only view appointments and report trip details
        IF NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_id = driver_role_id AND permission_id = perm_view_appointments) THEN
            INSERT INTO role_permissions (role_id, permission_id) VALUES (driver_role_id, perm_view_appointments);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_id = driver_role_id AND permission_id = perm_report_trip_details) THEN
            INSERT INTO role_permissions (role_id, permission_id) VALUES (driver_role_id, perm_report_trip_details);
        END IF;
    END IF;
    
    -- Assign permissions to Client
    IF client_role_id IS NOT NULL THEN
        -- Only view their own appointments
        IF NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_id = client_role_id AND permission_id = perm_view_appointments) THEN
            INSERT INTO role_permissions (role_id, permission_id) VALUES (client_role_id, perm_view_appointments);
        END IF;
    END IF;
END $$;

-- Create a default system configuration
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM system_configurations WHERE config_key = 'system_name') THEN
        INSERT INTO system_configurations (id, config_key, config_value, description)
        VALUES (uuid_generate_v4(), 'system_name', 'BAAAAM Ride Management System', 'Name of the system');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM system_configurations WHERE config_key = 'version') THEN
        INSERT INTO system_configurations (id, config_key, config_value, description)
        VALUES (uuid_generate_v4(), 'version', '1.0.0', 'Current system version');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM system_configurations WHERE config_key = 'default_pagination_limit') THEN
        INSERT INTO system_configurations (id, config_key, config_value, description)
        VALUES (uuid_generate_v4(), 'default_pagination_limit', '25', 'Default number of items per page');
    END IF;
END $$;