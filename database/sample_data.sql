-- INSERT SAMPLE DATA TO THE CREATED TABLES

--ROLES
INSERT INTO role(role_name, description)
VALUES
    ('Admin', 'Administrator with full access'),
    ('Customer', 'Bank customer with account access'),
    ('Manager', 'Bank manager with elevated access'),
    ('Employee', 'Bank employee with limited access');


--AI ASSISTANT
INSERT INTO ai_assistant(name, version, status)
VALUES
    ('Serendib AI', '1.0', 'Active');


--USERS
INSERT INTO users
    (role_id, username, password_hash, email, phone, status)
VALUES
    (1,'john_customer','hash123','customer@test.com','0711111111','ACTIVE'),
    (2,'bank_employee','hash123','employee@test.com','0722222222','ACTIVE'),
    (3,'branch_manager','hash123','manager@test.com','0733333333','ACTIVE'),
    (4,'system_admin','hash123','admin@test.com','0744444444','ACTIVE');