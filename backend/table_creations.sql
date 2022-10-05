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


-- Create the 'nft_thumbnails' table, where 'root_nft' is not unique, the same ID can exist on each contract. 'uniq_id' is contract+root_nft
-- 'thumbnail' is base64 encoded image
CREATE TABLE nft_thumbnails(
  uniq_id VARCHAR(512) PRIMARY KEY,
  contract VARCHAR(255) NOT NULL,
  root_nft VARCHAR(255) NOT NULL,
  thumbnail VARCHAR(32768) NOT NULL
);

-- Create the 'collaborators' table, where 'root_nft' is not unique, the same ID can exist on each contract. 'uniq_id' is contract+root_nft
-- 'collab_list' is stringified JSON, inside which there is an array of artists, like in artistsLists.json
CREATE TABLE collaborators(
  uniq_id VARCHAR(512) PRIMARY KEY,
  contract VARCHAR(255) NOT NULL,
  root_nft VARCHAR(255) NOT NULL,
  collab_list VARCHAR(4096) NOT NULL
);

-- We insert the lines manually, because this is a temporary solution
INSERT INTO collaborators (uniq_id, contract, root_nft, collab_list)
VALUES ('nft.soundsplash.nearfono-root-0', 'nft.soundsplash.near', 'fono-root-0', '"[{\"name\":\"vandal\",\"twitter\":\"https://twitter.com\",\"insta\":\"https://instagram.com\"}]"');