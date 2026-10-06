\set ON_ERROR_STOP on
-- DEMO ONLY. Password for all listed accounts: DemoBank!2026
-- Generated with Spring Security BCrypt (cost 10). Never use these credentials outside the simulation.
-- Run explicitly after schema.sql / upgrade_001_project.sql. Never runs on application startup.
BEGIN;
INSERT INTO role(role_name,description)
SELECT v.name,v.description FROM (VALUES
 ('Admin','System administration and audit'),('Customer','Customer banking'),
 ('Manager','Final loan approval'),('Employee','Customer service and loan review')) AS v(name,description)
WHERE NOT EXISTS(SELECT 1 FROM role r WHERE LOWER(r.role_name)=LOWER(v.name));

-- Resolve role IDs by actual names, including when their SERIAL values differ.
INSERT INTO users(role_id,username,password_hash,email,phone,status)
SELECT r.role_id,v.username,'$2a$10$mHPzdnVmdb2gM7Rb8arQK.dxmBhPd11I5Gv8g0NygrhTA3JW7mjiu',v.email,v.phone,'ACTIVE'
FROM (VALUES
 ('Customer','john_customer','customer@test.com','0711111111'),
 ('Customer','jane_customer','jane@test.com','0755555555'),
 ('Employee','bank_employee','employee@test.com','0722222222'),
 ('Manager','branch_manager','manager@test.com','0733333333'),
 ('Admin','system_admin','admin@test.com','0744444444')) AS v(role_name,username,email,phone)
JOIN role r ON LOWER(r.role_name)=LOWER(v.role_name)
ON CONFLICT(username) DO UPDATE SET role_id=EXCLUDED.role_id,password_hash=EXCLUDED.password_hash
WHERE users.email=EXCLUDED.email;

INSERT INTO customer(user_id,address)
SELECT u.user_id,'Colombo, Sri Lanka' FROM users u JOIN role r ON r.role_id=u.role_id
WHERE LOWER(r.role_name)='customer' AND NOT EXISTS(SELECT 1 FROM customer c WHERE c.user_id=u.user_id);
INSERT INTO employee(user_id,department,position,date_joined)
SELECT u.user_id,'Bank operations',r.role_name,CURRENT_DATE FROM users u JOIN role r ON r.role_id=u.role_id
WHERE LOWER(r.role_name) IN ('employee','manager') AND NOT EXISTS(SELECT 1 FROM employee e WHERE e.user_id=u.user_id);

INSERT INTO account(customer_id,account_number,account_type,balance,open_date,status)
SELECT c.customer_id,v.number,v.type,v.balance,CURRENT_DATE,'ACTIVE'
FROM (VALUES ('john_customer','1000000001','SAVINGS',250000.00),
 ('john_customer','1000000002','CURRENT',80000.00),
 ('jane_customer','2000000001','SAVINGS',175000.00)) AS v(username,number,type,balance)
JOIN users u ON u.username=v.username JOIN customer c ON c.user_id=u.user_id
ON CONFLICT(account_number) DO NOTHING;
-- Existing account balances are deliberately never overwritten by this fixture.

INSERT INTO beneficiary(customer_id,name,account_number,bank_name,relationship)
SELECT c.customer_id,'Jane (demo recipient)','2000000001','SERENDIB','Friend'
FROM customer c JOIN users u ON u.user_id=c.user_id WHERE u.username='john_customer'
AND NOT EXISTS(SELECT 1 FROM beneficiary b WHERE b.customer_id=c.customer_id AND b.account_number='2000000001' AND b.active);

INSERT INTO notification(user_id,title,message,status,created_at,event_type)
SELECT user_id,'Welcome to Serendib Smart Bank','This is an academic LKR banking simulation. All balances and rates are demonstration values.','UNREAD',CURRENT_TIMESTAMP,'WELCOME'
FROM users u WHERE username IN ('john_customer','jane_customer','bank_employee','branch_manager','system_admin')
AND NOT EXISTS(SELECT 1 FROM notification n WHERE n.user_id=u.user_id AND n.event_type='WELCOME');

INSERT INTO ai_assistant(name,version,status) SELECT 'Serendib AI','1.0','Active'
WHERE NOT EXISTS(SELECT 1 FROM ai_assistant WHERE name='Serendib AI');

-- Sample LKR 10,000.00 Cash Deposit to check transaction history
INSERT INTO transaction_record(to_account_id, amount, transaction_type, status, description, created_at, completed_at, initiated_by)
SELECT a.account_id, 10000.00, 'DEPOSIT', 'COMPLETED', 'Cash Deposit - Branch Counter #01', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, u.user_id
FROM account a
JOIN customer c ON c.customer_id = a.customer_id
JOIN users u ON u.user_id = c.user_id
WHERE a.account_number = '1000000001'
AND NOT EXISTS(SELECT 1 FROM transaction_record tr WHERE tr.to_account_id = a.account_id AND tr.amount = 10000.00 AND tr.transaction_type = 'DEPOSIT' AND tr.description = 'Cash Deposit - Branch Counter #01');

COMMIT;
