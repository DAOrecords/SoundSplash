-- Create the 'contracts' table, which will keep track of the existing FonoRoot smart contract instances, and which DAO owns them
CREATE TABLE contracts(
  id SERIAL PRIMARY KEY,
  contract_name VARCHAR(255) NOT NULL UNIQUE,
  owner_dao VARCHAR(255)
);

--We insert the lines manually, because as of now this is something that does not happen very often.
INSERT INTO contracts (contract_name, owner_dao) VALUES ('test.near', 'the_dao.near');