#!/usr/bin/env python
# -*- coding: utf-8 -*-

urls = []
with open("sites.txt", "r") as f:
    for i in f.readlines():
        i = i.split("\t")
        tup = (i[0], i[1])
        urls.append(tup)

print urls
