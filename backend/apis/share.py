# Copyright (C) 2021 Charles All rights reserved.
# Author: @Charles-1414
# License: GNU General Public License v3.0

from fastapi import Request, HTTPException
import os, sys, time
import json

from app import app, config
from db import newconn
from functions import *
import sessions

##########
# Share API

@app.post("/api/share")
async def apiShareBook(request: Request):
    form = await request.form()
    conn = newconn()
    cur = conn.cursor()
    if not "userId" in form.keys() or not "token" in form.keys() or "userId" in form.keys() and (not form["userId"].isdigit() or int(form["userId"]) < 0):
        raise HTTPException(status_code=401)

    userId = int(form["userId"])
    token = form["token"]
    if not validateToken(userId, token):
        raise HTTPException(status_code=401)
    
    op = form["operation"]

    if op == "list":
        ret = []
        i2n = {}
        cur.execute(f"SELECT bookId, shareCode, importCount, createTS FROM BookShare WHERE userId = {userId} AND shareType = 0")
        d = cur.fetchall()
        for dd in d:
            name = ""
            if dd[0] in i2n.keys():
                name = i2n[dd[0]]
            else:
                cur.execute(f"SELECT name FROM Book WHERE bookId = {dd[0]}")
                t = cur.fetchall()
                if len(t) == 0:
                    continue
                name = decode(t[0][0])
                i2n[dd[0]] = name
            
            ret.append({"bookId": dd[0], "name": name, "shareCode": "!" + dd[1], "importCount": dd[2], "timestamp": dd[3]})
        
        del i2n

        return ret

    elif op == "create":
        bookId = int(form["bookId"])

        cur.execute(f"SELECT * FROM Book WHERE userId = {userId} AND bookId = {bookId}")
        if len(cur.fetchall()) == 0:
            return {"success": False, "msg": "Book not found!"}
        
        cur.execute(f"SELECT shareCode FROM BookShare WHERE userId = {userId} AND bookId = {bookId} AND shareType = 0")
        t = cur.fetchall()
        if len(t) >= 20:
            return {"success": False, "msg": "You can create at most 20 shares for one book!"}
        else:
            shareCode = genCode(8)
            cur.execute(f"SELECT shareCode FROM BookShare WHERE shareCode = '{shareCode}'")
            if len(cur.fetchall()) != 0: # conflict
                for _ in range(30):
                    shareCode = genCode(8)
                    cur.execute(f"SELECT shareCode FROM Book WHERE shareCode = '{shareCode}'")
                    if len(cur.fetchall()) == 0:
                        break
                cur.execute(f"SELECT shareCode FROM Book WHERE shareCode = '{shareCode}'")
                if len(cur.fetchall()) != 0:
                    return {"success": False, "msg": "Unable to generate an unique share code..."}
                    
            cur.execute(f"INSERT INTO BookShare VALUES ({userId}, {bookId}, '{shareCode}', 0, {int(time.time())}, 0)")
            conn.commit()

            return {"success": True, "msg": "A new book share has been created!", "shareCode": "!" + shareCode}

    elif op == "remove":
        code = form["shareCode"]
        code = code.replace("!","").replace("@","")

        if not code.isalnum():
            return {"success": False, "msg": "Invalid share code!"}

        cur.execute(f"SELECT bookId FROM BookShare WHERE userId = {userId} AND shareType = 0 AND shareCode = '{code}'")
        t = cur.fetchall()
        if len(t) == 0:
            return {"success": False, "msg": "Invalid share code!"}
        else:
            cur.execute(f"DELETE FROM BookShare WHERE userId = {userId} AND bookId = {t[0][0]} AND shareCode = '{code}'")
            conn.commit()
            return {"success": True, "msg": "Book unshared!"}