#!/usr/bin/env python
# -*- coding: utf-8 -*-

from lxml import html
import requests
import re
import datetime
import time
import sys
import psycopg2
from psycopg2.extensions import AsIs

def get_string(site, name, bestFloat):
    index = []
    try:
        page = requests.get(site)
        tree = html.fromstring(page.content)
        obj = tree.xpath("//div[@class='responsive_page_template_content']/script/text()")[1]
        start = obj.find("g_rgListingInfo" )
        end = obj.find("g_plotPriceHistory")
        assets = obj[start : end][18:-7]
        matches = re.findall('id":"(\d+)', assets, re.DOTALL)
        listingid = [x for x in matches if len(str(x))==18]
        assetid = [x for x in matches if len(str(x))==10 or len(str(x)) == 9]
        rungame = re.findall('assetid%(.{25})', assets, re.DOTALL)
        try:
            assert len(listingid) == len(assetid) == len(rungame)
        except:
            return None
        for i in range(len(listingid)):
            string = (name, i, bestFloat, listingid[i], assetid[i], rungame[i].split('"')[0][1:])
            index.append(string)
        return index
    except:
        return None

def updatedb(data):
    con = None
    con = psycopg2.connect(database="steamdb", user="lf")
    cur = con.cursor()
    try:
        query = "INSERT INTO %(table)s VALUES (%(asset)s, %(listing)s, %(rungame)s)"
        cur.execute(query, {"table": AsIs(data[0]), "asset": int(data[4]), "listing": int(data[3]), 
                            "rungame": data[5][:10]})
        #run update_table.py on failure here, incase entry doesnt have a db table
        con.commit()
    except psycopg2.IntegrityError:
        con.rollback()
    if con:
        con.close()

def checkdb(data):
    con = None
    try:
        con = psycopg2.connect(database="steamdb", user="lf")
        cur = con.cursor()
        query = "SELECT Asset FROM %(table)s WHERE Asset=%(asset)s"
        cur.execute(query, {"table": AsIs(data[0]), "asset": int(data[4])})
        ver = cur.fetchall()
        if len(ver) == 0:
            return True
        else:
            return False
    except psycopg2.DatabaseError, e:
        return True
    finally:
        if con:
            con.close()

def main():
    count = -1
    queries = []
    with open("sites.txt", "r") as f:
        for i in f.readlines():
            i = i.split("\t")
            if item == None or item == i[0]:
                count += 1
                queries = get_string(i[1], i[0], i[2].strip("\n"))
                if queries == None:
                    continue
                for i in queries:
                    if checkdb(i):
                        output.append(i)
                        updatedb(i)
                #time.sleep(1)

output = []
try:
    item = sys.argv[1]
except:
    item = None
main()
if len(output) > 0:
    print output
else:
    print "None"


