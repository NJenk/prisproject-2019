CREATE TABLE poi (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    poiid INTEGER,
    profileid varchar(12),
    CONSTRAINT profileid FOREIGN KEY(profileid),
    REFERENCES profiles(ID)
);
/* Use INSERT INTO poi VALUE (...) to add information to the table*/