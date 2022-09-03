-- Create the 'contracts' table, which will keep track of the existing FonoRoot smart contract instances, and which DAO owns them
CREATE TABLE contracts(
  id SERIAL PRIMARY KEY,
  contract_name VARCHAR(255) NOT NULL UNIQUE,
  owner_dao VARCHAR(255)
);
