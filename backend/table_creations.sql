-- Create the 'contracts' table, which will keep track of the existing FonoRoot smart contract instances, and which DAO owns them
CREATE TABLE contracts(
  id SERIAL PRIMARY KEY,
  contract_name VARCHAR(255) NOT NULL UNIQUE,
  owner_dao VARCHAR(255)
);

--We insert the lines manually, because as of now this is something that does not happen very often.
INSERT INTO contracts (contract_name, owner_dao) VALUES ('test.near', 'the_dao.near');


-- Create the 'nfts_by_owner' table, where 'nft_id' is not unique, the same ID can exist on each contract. 'uniq_id' is contract+nft_id
CREATE TABLE nfts_by_owner(
  uniq_id VARCHAR(512) PRIMARY KEY,
  owner_account VARCHAR(255) NOT NULL,
  contract VARCHAR(255) NOT NULL,
  nft_id VARCHAR(255) NOT NULL
);