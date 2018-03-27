#!/usr/bin/env python
# -*- coding: utf-8 -*-

import psycopg2
import sys
from psycopg2.extensions import AsIs


con = None

def update(filename):
    con = psycopg2.connect(database="steamdb", user="lf")
    cur = con.cursor()
    with open(filename, "r") as f:
        for i in f.readlines():
            i = i.split("\t")
            tup = (i[0], i[1])
            try:
                cur.execute("""CREATE TABLE %s(Asset BIGINT PRIMARY KEY, Listing BIGINT, Rungame VARCHAR(40), Market_Index INT)""" %AsIs(i[0]))
                con.commit()
                print "created %s" %i[0]
            except psycopg2.DatabaseError, e:
                #print "Error %s" % e
                con.rollback()
                continue
    con.close()
    print "done", filename

files = ["sites.txt", "skins_backup.txt"]
for i in files:
    update(i)

#con = psycopg2.connect(database="steamdb", user="lf")
#cur = con.cursor()
#cur.execute("""CREATE TABLE float(Asset BIGINT PRIMARY KEY, float VARCHAR(40), Market_Index INT DEFAULT 0, datetime TIMESTAMP)""")
#con.commit()
#con.close()
