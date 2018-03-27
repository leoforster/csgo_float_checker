collection of scripts I used in summer 2016 to query csgo item floats from steam market links

floats are queried from steam market by the js script and stored in a local SQL database using the python helper scripts. the database should have tables for each queried skin, with the format:

CREATE TABLE ak_black_mw (
    asset bigint NOT NULL,
    listing bigint,
    rungame character varying(40),
    market_index integer
);

ALTER TABLE ONLY ak_black_mw
    ADD CONSTRAINT ak_black_mw_pkey PRIMARY KEY (asset);

