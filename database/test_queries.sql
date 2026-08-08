SELECT * FROM role;
SELECT * FROM users;
SELECT * FROM customer;
SELECT * FROM account;
SELECT * FROM loan;
SELECT * FROM transaction_record;

SELECT 
    u.username,
    r.role_name
FROM users u
JOIN role r ON u.role_id = r.role_id;