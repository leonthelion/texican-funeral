texican-funeral
===============


CREATE TABLE posts
(
  postid serial NOT NULL,
  title character varying(255),
  content character varying(10000),
  day integer,
  month integer,
  year integer,
  CONSTRAINT postid PRIMARY KEY (postid)
)
WITH (
  OIDS=FALSE
);
ALTER TABLE posts
  OWNER TO test;
  

#####################


CREATE TABLE sessions
(
  sid character varying(255) NOT NULL,
  username character varying(255),
  csrf character varying(255),
  login timestamp without time zone,
  logout timestamp without time zone,
  CONSTRAINT sid PRIMARY KEY (sid)
)
WITH (
  OIDS=FALSE
);
ALTER TABLE sessions
  OWNER TO test;



#####################



CREATE TABLE users
(
  id serial NOT NULL,
  username character varying(255),
  password character varying(255),
  CONSTRAINT id PRIMARY KEY (id)
)
WITH (
  OIDS=FALSE
);
ALTER TABLE users
  OWNER TO test;
  
  

#####################



CREATE TABLE images
(
  id serial NOT NULL,
  path character varying(255),
  name character varying(255),
  CONSTRAINT images_pkey PRIMARY KEY (id)
)
WITH (
  OIDS=FALSE
);
ALTER TABLE images
  OWNER TO test;



postgresql rolename: test; password: test; dbname: test

