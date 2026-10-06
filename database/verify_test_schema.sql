\set ON_ERROR_STOP on
-- Validation probes for an explicitly disposable test database. Always rolled back.
BEGIN;
DO $$ BEGIN
 IF current_database() NOT LIKE 'serendib_qa_%' THEN RAISE EXCEPTION 'Disposable QA database required'; END IF;
 IF (SELECT count(*) FROM pg_constraint WHERE connamespace='public'::regnamespace AND contype='f')<>27 THEN RAISE EXCEPTION 'Unexpected foreign key inventory'; END IF;
 IF EXISTS(SELECT 1 FROM pg_constraint WHERE connamespace='public'::regnamespace AND NOT convalidated) THEN RAISE EXCEPTION 'Unvalidated constraint'; END IF;
 IF EXISTS(SELECT 1 FROM pg_index i JOIN pg_class t ON t.oid=i.indrelid WHERE t.relnamespace='public'::regnamespace AND NOT(indisvalid AND indisready)) THEN RAISE EXCEPTION 'Invalid index'; END IF;
END $$;
CREATE FUNCTION pg_temp.must_reject(statement text, expected_state text) RETURNS void LANGUAGE plpgsql AS $$
DECLARE state text;
BEGIN
 BEGIN
  EXECUTE statement;
 EXCEPTION WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS state=RETURNED_SQLSTATE;
  IF state=expected_state THEN RETURN; END IF;
  RAISE EXCEPTION 'Wrong SQLSTATE %, expected %',state,expected_state;
 END;
 RAISE EXCEPTION 'Invalid data was accepted';
END $$;
SELECT pg_temp.must_reject('UPDATE account SET balance=-1 WHERE account_number=''1000000001''','23514');
SELECT pg_temp.must_reject('UPDATE account SET balance=NULL WHERE account_number=''1000000001''','23502');
SELECT pg_temp.must_reject('UPDATE account SET customer_id=-1 WHERE account_number=''1000000001''','23503');
SELECT pg_temp.must_reject('UPDATE account SET status=''INVALID'' WHERE account_number=''1000000001''','23514');
SELECT pg_temp.must_reject('INSERT INTO role(role_name) VALUES (''CUSTOMER'')','23505');
SELECT pg_temp.must_reject('UPDATE users SET status=''INVALID'' WHERE username=''john_customer''','23514');
SELECT pg_temp.must_reject('UPDATE users SET email=''CUSTOMER@TEST.COM'' WHERE username=''jane_customer''','23505');
SELECT pg_temp.must_reject('UPDATE notification SET status=''INVALID'' WHERE user_id=(SELECT user_id FROM users WHERE username=''john_customer'')','23514');
SELECT pg_temp.must_reject('INSERT INTO transaction_record(amount,transaction_type,status) VALUES(1,''TRANSFER'',''COMPLETED'')','23514');
SELECT pg_temp.must_reject('INSERT INTO beneficiary(customer_id,name,account_number,bank_name) SELECT customer_id,name,account_number,bank_name FROM beneficiary WHERE active LIMIT 1','23505');
SELECT pg_temp.must_reject('INSERT INTO feedback(customer_id,subject,message,status,feedback_type,rating) SELECT customer_id,''Bad review'',''Fixture'',''APPROVED'',''REVIEW'',NULL FROM customer LIMIT 1','23514');
SELECT pg_temp.must_reject('INSERT INTO loan(customer_id,loan_type,amount,status) SELECT customer_id,''PERSONAL'',0,''SUBMITTED'' FROM customer LIMIT 1','23514');
SELECT pg_temp.must_reject('INSERT INTO card(account_id,card_type,status) SELECT account_id,''DEBIT'',''INVALID'' FROM account LIMIT 1','23514');
SELECT pg_temp.must_reject('INSERT INTO audit_log(actor_type,action) VALUES(''USER'',''Fixture'')','23514');
SELECT 'PASS: metadata and 14 negative constraint probes' AS result;
ROLLBACK;
