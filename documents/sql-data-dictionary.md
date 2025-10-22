# SQL Data Dictionary

## Table of Contents
- [System Tables](#system-tables)
  - [system_audit_logs](#system_audit_logs)
  - [system_configurations](#system_configurations)
- [Organization Management](#organization-management)
  - [organizations](#organizations)
  - [organization_audit_logs](#organization_audit_logs)
  - [organization_configurations](#organization_configurations)
- [User Management](#user-management)
  - [users](#users)
  - [roles](#roles)
  - [permissions](#permissions)
  - [role_permissions](#role_permissions)
  - [user_roles](#user_roles)
  - [user_permissions](#user_permissions)
- [Client Management](#client-management)
  - [clients](#clients)
  - [client_accessibility_needs](#client_accessibility_needs)
  - [custom_form_definitions](#custom_form_definitions)
  - [custom_form_values](#custom_form_values)
- [Driver Management](#driver-management)
  - [drivers](#drivers)
  - [driver_availability](#driver_availability)
  - [driver_accessibility_capabilities](#driver_accessibility_capabilities)
- [Appointment Management](#appointment-management)
  - [appointments](#appointments)
  - [appointment_trips](#appointment_trips)
- [Communication](#communication)
  - [messages](#messages)
  - [message_recipients](#message_recipients)
- [Reporting](#reporting)
  - [report_configurations](#report_configurations)

## System Tables

### system_audit_logs
System-wide audit logging table to track all significant actions.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier for the audit log entry |
| action | VARCHAR(255) | NOT NULL | Type of action performed (create, update, delete, etc.) |
| entity_type | VARCHAR(50) | NOT NULL | Type of entity being acted upon |
| entity_id | UUID | | Identifier of the entity being acted upon |
| user_id | UUID | | Identifier of the user who performed the action |
| details | JSONB | | Additional details about the action in JSON format |
| timestamp | TIMESTAMP WITH TIME ZONE | DEFAULT CURRENT_TIMESTAMP | When the action occurred |

### system_configurations
Global system configuration settings.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier for the configuration |
| config_key | VARCHAR(100) | NOT NULL, UNIQUE | Configuration parameter name |
| config_value | TEXT | | Configuration parameter value |
| description | TEXT | | Description of the configuration parameter |
| is_encrypted | BOOLEAN | DEFAULT FALSE | Indicates if the value is stored encrypted |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT CURRENT_TIMESTAMP | When the configuration was created |
| updated_at | TIMESTAMP WITH TIME ZONE | DEFAULT CURRENT_TIMESTAMP | When the configuration was last updated |

## Organization Management

### organizations
Core table for organizations within the system.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier for the organization |
| name | VARCHAR(255) | NOT NULL | Organization name |
| logo_path | VARCHAR(255) | | Path to the organization's logo file |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT CURRENT_TIMESTAMP | When the organization was created |
| updated_at | TIMESTAMP WITH TIME ZONE | DEFAULT CURRENT_TIMESTAMP | When the organization was last updated |
| is_active | BOOLEAN | DEFAULT TRUE | Whether the organization is active |

### organization_audit_logs
Organization-specific audit logs for tracking actions within an organization.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier for the audit log entry |
| organization_id | UUID | NOT NULL, REFERENCES organizations(id) | Organization identifier |
| action | VARCHAR(255) | NOT NULL | Type of action performed |
| entity_type | VARCHAR(50) | NOT NULL | Type of entity being acted upon |
| entity_id | UUID | | Identifier of the entity being acted upon |
| user_id | UUID | | Identifier of the user who performed the action |
| details | JSONB | | Additional details about the action in JSON format |
| timestamp | TIMESTAMP WITH TIME ZONE | DEFAULT CURRENT_TIMESTAMP | When the action occurred |

### organization_configurations
Organization-specific configuration settings.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier for the configuration |
| organization_id | UUID | NOT NULL, REFERENCES organizations(id) | Organization identifier |
| config_key | VARCHAR(100) | NOT NULL | Configuration parameter name |
| config_value | TEXT | | Configuration parameter value |
| description | TEXT | | Description of the configuration parameter |
| is_encrypted | BOOLEAN | DEFAULT FALSE | Indicates if the value is stored encrypted |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT CURRENT_TIMESTAMP | When the configuration was created |
| updated_at | TIMESTAMP WITH TIME ZONE | DEFAULT CURRENT_TIMESTAMP | When the configuration was last updated |
| | | UNIQUE(organization_id, config_key) | Each organization can have only one value per config key |

## User Management

### users
User accounts in the system.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier for the user |
| organization_id | UUID | REFERENCES organizations(id) | Organization the user belongs to |
| first_name | VARCHAR(100) | NOT NULL | User's first name |
| last_name | VARCHAR(100) | NOT NULL | User's last name |
| email | VARCHAR(255) | UNIQUE | User's email address |
| phone | VARCHAR(20) | | User's phone number |
| password_hash | VARCHAR(255) | | Hashed password for authentication |
| contact_preference | VARCHAR(20) | DEFAULT 'email' | Preferred contact method |
| is_active | BOOLEAN | DEFAULT TRUE | Whether the user account is active |
| notes | TEXT | | Additional notes about the user |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT CURRENT_TIMESTAMP | When the user was created |
| updated_at | TIMESTAMP WITH TIME ZONE | DEFAULT CURRENT_TIMESTAMP | When the user was last updated |
| last_login | TIMESTAMP WITH TIME ZONE | | When the user last logged in |

### roles
Roles for permission grouping.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier for the role |
| organization_id | UUID | REFERENCES organizations(id) | Organization the role belongs to |
| name | VARCHAR(100) | NOT NULL | Role name |
| description | TEXT | | Description of the role |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT CURRENT_TIMESTAMP | When the role was created |
| updated_at | TIMESTAMP WITH TIME ZONE | DEFAULT CURRENT_TIMESTAMP | When the role was last updated |
| | | UNIQUE(organization_id, name) | Each organization can have only one role with a given name |

### permissions
System permissions that can be assigned to roles or users.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier for the permission |
| name | VARCHAR(100) | NOT NULL, UNIQUE | Permission name |
| description | TEXT | | Description of the permission |
| category | VARCHAR(50) | | Category for grouping permissions |

### role_permissions
Junction table mapping roles to permissions.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| role_id | UUID | NOT NULL, REFERENCES roles(id) ON DELETE CASCADE | Role identifier |
| permission_id | UUID | NOT NULL, REFERENCES permissions(id) ON DELETE CASCADE | Permission identifier |
| | | PRIMARY KEY (role_id, permission_id) | Composite primary key |

### user_roles
Junction table mapping users to roles.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| user_id | UUID | NOT NULL, REFERENCES users(id) ON DELETE CASCADE | User identifier |
| role_id | UUID | NOT NULL, REFERENCES roles(id) ON DELETE CASCADE | Role identifier |
| | | PRIMARY KEY (user_id, role_id) | Composite primary key |

### user_permissions
Direct user-to-permission mappings for overriding role-based permissions.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| user_id | UUID | NOT NULL, REFERENCES users(id) ON DELETE CASCADE | User identifier |
| permission_id | UUID | NOT NULL, REFERENCES permissions(id) ON DELETE CASCADE | Permission identifier |
| is_granted | BOOLEAN | NOT NULL, DEFAULT TRUE | Whether to grant or deny the permission |
| | | PRIMARY KEY (user_id, permission_id) | Composite primary key |

## Client Management

### clients
Client information for those receiving services.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier for the client |
| organization_id | UUID | NOT NULL, REFERENCES organizations(id) | Organization the client belongs to |
| first_name | VARCHAR(100) | NOT NULL | Client's first name |
| last_name | VARCHAR(100) | NOT NULL | Client's last name |
| email | VARCHAR(255) | | Client's email address |
| phone | VARCHAR(20) | | Client's phone number |
| contact_preference | VARCHAR(20) | DEFAULT 'phone' | Preferred contact method |
| gender | VARCHAR(30) | | Client's gender |
| address_street | VARCHAR(255) | | Street address |
| address_city | VARCHAR(100) | | City |
| address_state | VARCHAR(50) | | State or province |
| address_zip | VARCHAR(20) | | ZIP or postal code |
| address_validated | BOOLEAN | DEFAULT FALSE | Whether the address has been validated |
| notes | TEXT | | Additional notes about the client |
| is_driver | BOOLEAN | DEFAULT TRUE | Whether the client can also be a driver |
| is_active | BOOLEAN | DEFAULT TRUE | Whether the client is active |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT CURRENT_TIMESTAMP | When the client was created |
| updated_at | TIMESTAMP WITH TIME ZONE | DEFAULT CURRENT_TIMESTAMP | When the client was last updated |

### client_accessibility_needs
Special accessibility requirements for clients.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier for the accessibility need |
| client_id | UUID | NOT NULL, REFERENCES clients(id) ON DELETE CASCADE | Client identifier |
| need_type | VARCHAR(100) | NOT NULL | Type of accessibility need (wheelchair, service_animal, etc.) |
| details | TEXT | | Additional details about the need |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT CURRENT_TIMESTAMP | When the record was created |
| updated_at | TIMESTAMP WITH TIME ZONE | DEFAULT CURRENT_TIMESTAMP | When the record was last updated |

### custom_form_definitions
Definitions for custom form fields that can be added to various entity types.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier for the form field definition |
| organization_id | UUID | NOT NULL, REFERENCES organizations(id) | Organization the form field belongs to |
| form_type | VARCHAR(50) | NOT NULL | Entity type the field applies to (client, driver, etc.) |
| field_name | VARCHAR(100) | NOT NULL | Technical field name |
| field_type | VARCHAR(50) | NOT NULL | Field type (text, select, checkbox, etc.) |
| field_label | VARCHAR(255) | NOT NULL | Display label for the field |
| field_options | JSONB | | Options for select/dropdown fields |
| field_default | VARCHAR(255) | | Default value for the field |
| field_placeholder | VARCHAR(255) | | Placeholder text |
| is_required | BOOLEAN | DEFAULT FALSE | Whether the field is required |
| display_order | INTEGER | NOT NULL | Order to display the field in forms |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT CURRENT_TIMESTAMP | When the field was created |
| updated_at | TIMESTAMP WITH TIME ZONE | DEFAULT CURRENT_TIMESTAMP | When the field was last updated |
| | | UNIQUE(organization_id, form_type, field_name) | Each organization can have only one field with a given name per form type |

### custom_form_values
Values for custom form fields.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier for the form field value |
| custom_field_id | UUID | NOT NULL, REFERENCES custom_form_definitions(id) | Form field definition identifier |
| entity_id | UUID | NOT NULL | Identifier of the entity the value belongs to |
| entity_type | VARCHAR(50) | NOT NULL | Type of entity the value belongs to |
| field_value | TEXT | | Value of the field |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT CURRENT_TIMESTAMP | When the value was created |
| updated_at | TIMESTAMP WITH TIME ZONE | DEFAULT CURRENT_TIMESTAMP | When the value was last updated |

## Driver Management

### drivers
Extended information for users who are drivers.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| user_id | UUID | PRIMARY KEY, REFERENCES users(id) ON DELETE CASCADE | User identifier |
| vehicle_type | VARCHAR(100) | | Type of vehicle |
| vehicle_make | VARCHAR(100) | | Vehicle manufacturer |
| vehicle_model | VARCHAR(100) | | Vehicle model |
| vehicle_year | INTEGER | | Year the vehicle was manufactured |
| vehicle_color | VARCHAR(50) | | Vehicle color |
| license_plate | VARCHAR(20) | | Vehicle license plate number |
| max_passengers | INTEGER | DEFAULT 1 | Maximum number of passengers the vehicle can accommodate |
| background_check_date | DATE | | Date of the most recent background check |
| driving_record_check_date | DATE | | Date of the most recent driving record check |
| insurance_verification_date | DATE | | Date of the most recent insurance verification |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT CURRENT_TIMESTAMP | When the driver record was created |
| updated_at | TIMESTAMP WITH TIME ZONE | DEFAULT CURRENT_TIMESTAMP | When the driver record was last updated |

### driver_availability
Driver availability scheduling.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier for the availability entry |
| driver_id | UUID | NOT NULL, REFERENCES drivers(user_id) ON DELETE CASCADE | Driver identifier |
| availability_type | VARCHAR(20) | NOT NULL | Type of availability (recurring, specific) |
| day_of_week | INTEGER | | Day of week for recurring availability (0-6) |
| specific_date | DATE | | Specific date for non-recurring availability |
| start_time | TIME | NOT NULL | Start time of availability |
| end_time | TIME | NOT NULL | End time of availability |
| is_available | BOOLEAN | DEFAULT TRUE | Whether this is availability or time off |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT CURRENT_TIMESTAMP | When the record was created |
| updated_at | TIMESTAMP WITH TIME ZONE | DEFAULT CURRENT_TIMESTAMP | When the record was last updated |

### driver_accessibility_capabilities
Accessibility accommodations that drivers can provide.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier for the capability entry |
| driver_id | UUID | NOT NULL, REFERENCES drivers(user_id) ON DELETE CASCADE | Driver identifier |
| capability_type | VARCHAR(100) | NOT NULL | Type of accessibility capability |
| can_accommodate | BOOLEAN | DEFAULT TRUE | Whether the driver can accommodate this need |
| details | TEXT | | Additional details about the capability |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT CURRENT_TIMESTAMP | When the record was created |
| updated_at | TIMESTAMP WITH TIME ZONE | DEFAULT CURRENT_TIMESTAMP | When the record was last updated |

## Appointment Management

### appointments
Transportation appointments.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier for the appointment |
| organization_id | UUID | NOT NULL, REFERENCES organizations(id) | Organization identifier |
| client_id | UUID | NOT NULL, REFERENCES clients(id) | Client identifier |
| driver_id | UUID | REFERENCES drivers(user_id) | Driver identifier |
| created_by_id | UUID | REFERENCES users(id) | User who created the appointment |
| date | DATE | NOT NULL | Date of the appointment |
| start_time | TIME | NOT NULL | Scheduled start time |
| end_time | TIME | | Scheduled end time |
| status | VARCHAR(50) | NOT NULL, DEFAULT 'scheduled' | Appointment status |
| notes | TEXT | | Additional notes |
| actual_start_time | TIMESTAMP WITH TIME ZONE | | Actual start time |
| actual_end_time | TIMESTAMP WITH TIME ZONE | | Actual end time |
| total_miles | DECIMAL(10, 2) | | Total miles driven |
| total_hours | DECIMAL(5, 2) | | Total hours spent |
| donation_amount | DECIMAL(10, 2) | | Optional donation amount |
| reported_by | UUID | REFERENCES users(id) | User who reported the completion |
| reported_at | TIMESTAMP WITH TIME ZONE | DEFAULT CURRENT_TIMESTAMP | When the completion was reported |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT CURRENT_TIMESTAMP | When the appointment was created |
| updated_at | TIMESTAMP WITH TIME ZONE | DEFAULT CURRENT_TIMESTAMP | When the appointment was last updated |

### appointment_trips
Individual destinations within an appointment.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier for the trip |
| appointment_id | UUID | NOT NULL, REFERENCES appointments(id) ON DELETE CASCADE | Appointment identifier |
| sequence_number | INTEGER | NOT NULL | Order of this trip within the appointment |
| is_round_trip | BOOLEAN | DEFAULT FALSE | Whether this is a round trip |
| address_street | VARCHAR(255) | NOT NULL | Street address |
| address_street_2 | VARCHAR(255) | | Additional address line |
| address_city | VARCHAR(100) | NOT NULL | City |
| address_state | VARCHAR(50) | NOT NULL | State or province |
| address_zip | VARCHAR(20) | NOT NULL | ZIP or postal code |
| address_validated | BOOLEAN | DEFAULT FALSE | Whether the address has been validated |
| actual_distance | DECIMAL(10, 2) | | Actual distance traveled in miles |
| start_time | TIME | | Scheduled start time |
| end_time | TIME | | Scheduled end time |
| status | VARCHAR(50) | DEFAULT 'scheduled' | Trip status |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT CURRENT_TIMESTAMP | When the trip was created |
| updated_at | TIMESTAMP WITH TIME ZONE | DEFAULT CURRENT_TIMESTAMP | When the trip was last updated |
| | | UNIQUE(appointment_id, sequence_number) | Each appointment can have only one trip with a given sequence number |

## Communication

### messages
Messages sent within the system.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier for the message |
| organization_id | UUID | NOT NULL, REFERENCES organizations(id) | Organization identifier |
| sender_id | UUID | REFERENCES users(id) | User who sent the message |
| message_type | VARCHAR(20) | NOT NULL | Type of message (email, sms) |
| subject | VARCHAR(255) | | Message subject (for emails) |
| body | TEXT | NOT NULL | Message content |
| sent_at | TIMESTAMP WITH TIME ZONE | DEFAULT CURRENT_TIMESTAMP | When the message was sent |
| status | VARCHAR(20) | DEFAULT 'pending' | Message status (pending, sent, failed) |

### message_recipients
Recipients of messages.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier for the recipient entry |
| message_id | UUID | NOT NULL, REFERENCES messages(id) ON DELETE CASCADE | Message identifier |
| recipient_type | VARCHAR(20) | NOT NULL | Type of recipient (user, client, driver) |
| recipient_id | UUID | NOT NULL | Identifier of the recipient |
| message_type | VARCHAR(20) | NOT NULL | How the message was delivered to this recipient |

## Reporting

### report_configurations
Saved report configurations.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier for the report |
| organization_id | UUID | NOT NULL, REFERENCES organizations(id) | Organization identifier |
| name | VARCHAR(255) | NOT NULL | Report name |
| description | TEXT | | Report description |
| query_type | VARCHAR(20) | NOT NULL | Type of query (sql, visual) |
| query_definition | TEXT | | Query definition (SQL or JSON) |
| created_by | UUID | REFERENCES users(id) | User who created the report |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT CURRENT_TIMESTAMP | When the report was created |
| updated_at | TIMESTAMP WITH TIME ZONE | DEFAULT CURRENT_TIMESTAMP | When the report was last updated |
