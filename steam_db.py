#!/usr/bin/env python
# -*- coding: utf-8 -*-

import psycopg2
import sys

try:
    if sys.argv[1] == "force":
        force = True
except:
    force = False

con = None
errc = 0
upc = 0
with open("steamdb.log", "r") as f:
    for i in f.readlines()[::-1]:
        asset, fl, count = i.split("\t")

        con = psycopg2.connect(database="steamdb", user="lf")
        cur = con.cursor()
        try:
            cur.execute("""INSERT INTO float VALUES (%(asset)s, %(fl)s, %(count)s, now())""" 
                        %{"asset": int(asset), "fl": fl, "count": count.strip("\n")})
            con.commit()
            upc += 1
        except psycopg2.DatabaseError, e:
            errc += 1
            #print "Error %s" % e
            con.rollback()
            if force:
                continue
            with open("update_err.log", "a") as ff:
                ff.write(str(e) + "\n")
            break

con.close()

if force:
    print errc, "errors;", upc, "updates"
else:
    print upc, "updates"
