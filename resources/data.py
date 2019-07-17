#import pymysql
import sqlite3
import sys

profs = sys.argv[1]
#profs = ['uWu-111', 'uWu-222', 'uWu-333']
profs = profs.split(',')

conn = sqlite3.connect(r'resources\PRIS\database\Person.db')
#conn = pymysql.connect(host='127.0.0.1', port=3306, user='root', passwd='password', db='person')

cur = conn.cursor()
cur.execute('SELECT MAX(poiid) from POI')
row = cur.fetchone()
cur.close()
conn.commit()

if row[0]:
    row = row[0]
    row = row+1

else:
    row = 1

for prof in profs:
    # this one is for sqlite.
    cur = conn.cursor()
    cur.execute('INSERT INTO POI (poiid, profileid) VALUES(?, ?)', (row, prof))
    cur.close()
    conn.commit()
    # this one is for mysql.
    #cur.execute('INSERT INTO POI (poiid, profileid) VALUES(%s, %s)', [row, prof])