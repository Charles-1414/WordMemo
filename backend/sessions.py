# Copyright (C) 2021 Charles All rights reserved.
# Author: @Charles-1414
# License: GNU General Public License v3.0

import os, time, uuid
from app import app, config
import db

import MySQLdb
import sqlite3
conn = None

def updateconn():
    global conn
    if config.database == "mysql":
        if app.config["DB_ENABLED"]:
            conn = MySQLdb.connect(host = app.config["MYSQL_HOST"], user = app.config["MYSQL_USER"], \
                passwd = app.config["MYSQL_PASSWORD"], db = app.config["MYSQL_DB"])
    elif config.database == "sqlite":
        if app.config["DB_ENABLED"]:
            conn = sqlite3.connect("database.db", check_same_thread = False)

updateconn()

# Unexpected errors often happen
# So automatically restart the program when there are 5 errors
errcnt = 0

def validateToken(userId, token):
    try:
        updateconn()
        cur = conn.cursor()
        if not token.replace("-","").isalnum():
            return False

        cur.execute(f"SELECT loginTime, expireTime FROM ActiveUserLogin WHERE userId = {userId} AND token = '{token}'")
        d = cur.fetchall()
        if len(d) == 0:
            return False

        loginTime = d[0][0]
        expireTime = d[0][1]

        if expireTime <= int(time.time()):
            ip = ""
            cur.execute(f"SELECT ip FROM ActiveUserLogin WHERE userId = {userId} AND token = '{token}'")
            t = cur.fetchall()
            if len(t) > 0:
                ip = t[0][0]
            cur.execute(f"INSERT INTO UserSessionHistory VALUES ({userId}, {loginTime}, {expireTime}, 1, '{ip}')")
            cur.execute(f"DELETE FROM ActiveUserLogin WHERE userId = {userId} AND token = '{token}'")
            conn.commit()
            return False
        
        else:
            return True

    except:
        global errcnt
        errcnt += 1

def login(userId, ua, ip):
    try:
        updateconn()
        cur = conn.cursor()
        token = str(userId).zfill(9) + "-" + str(uuid.uuid4())
        loginTime = int(time.time())
        expireTime = loginTime + 21600 # 6 hours

        cur.execute(f"INSERT INTO ActiveUserLogin VALUES ({userId}, '{token}', {loginTime}, {expireTime}, '{ua}', '{ip}')")
        conn.commit()

        return token
    
    except:
        global errcnt
        errcnt += 1

def logout(userId, token):
    try:
        updateconn()
        cur = conn.cursor()
        if not validateToken(userId, token):
            return True
        
        cur.execute(f"SELECT loginTime FROM ActiveUserLogin WHERE userId = {userId} AND token = '{token}'")
        d = cur.fetchall()
        loginTime = d[0][0]
        ip = ""
        cur.execute(f"SELECT ip FROM ActiveUserLogin WHERE userId = {userId} AND token = '{token}'")
        t = cur.fetchall()
        if len(t) > 0:
            ip = t[0][0]
        cur.execute(f"INSERT INTO UserSessionHistory VALUES ({userId}, {loginTime}, {expireTime}, 1, '{ip}')")
        cur.execute(f"DELETE FROM ActiveUserLogin WHERE userId = {userId} AND token = '{token}'")
        conn.commit()

        return True

    except:
        global errcnt
        errcnt += 1

def logoutAll(userId):
    try: 
        updateconn()
        cur = conn.cursor()
        cur.execute(f"SELECT * FROM ActiveUserLogin WHERE userId = {userId}")
        d = cur.fetchall()
        for dd in d:
            ip = ""
            cur.execute(f"SELECT ip FROM ActiveUserLogin WHERE userId = {userId} AND token = '{token}'")
            t = cur.fetchall()
            if len(t) > 0:
                ip = t[0][0]
            cur.execute(f"INSERT INTO UserSessionHistory VALUES ({userId}, {loginTime}, {expireTime}, 1, '{ip}')")
        cur.execute(f"DELETE FROM ActiveUserLogin WHERE userId = {userId}")
        conn.commit()

        return True
        
    except:
        global errcnt
        errcnt += 1

def getPasswordTrialCount(userId):
    try:
        updateconn()
        cur = conn.cursor()
        cur.execute(f"SELECT count, lastts FROM PasswordTrial WHERE userId = {userId}")
        t = cur.fetchall()
        if len(t) == 0:
            return (0, 0)
        else:
            return (t[0][0], t[0][1])

    except:
        global errcnt
        errcnt += 1

def updatePasswordTrialCount(userId, to, ts):
    try:
        updateconn()
        cur = conn.cursor()
        cur.execute(f"SELECT count FROM PasswordTrial WHERE userId = {userId}")
        t = cur.fetchall()
        if len(t) == 0:
            if to == 0:
                return
            cur.execute(f"INSERT INTO PasswordTrial VALUES ({userId}, {to}, {ts})")
            conn.commit()
        else:
            if to == 0:
                cur.execute(f"DELETE FROM PasswordTrial WHERE userId = {userId}")
                conn.commit()
            else:
                cur.execute(f"UPDATE PasswordTrial SET count = {to} WHERE userId = {userId}")
                cur.execute(f"UPDATE PasswordTrial SET lastts = {ts} WHERE userId = {userId}")
                conn.commit()

    except:
        global errcnt
        errcnt += 1
    

def deleteData(userId):
    try:
        updateconn()
        cur = conn.cursor()
        cur.execute(f"DELETE FROM ActiveUserLogin WHERE userId = {userId}")
        cur.execute(f"DELETE FROM UserSessionHistory WHERE userId = {userId}")
        cur.execute(f"DELETE FROM PendingAccountDeletion WHERE userId = {userId}")
        
    except:
        global errcnt
        errcnt += 1

def markDeletion(userId):
    try:
        updateconn()
        cur = conn.cursor()
        cur.execute(f"INSERT INTO PendingAccountDeletion VALUES ({userId}, {int(time.time()+86401*14)})")
        conn.commit()
        
    except:
        global errcnt
        errcnt += 1

def checkDeletionMark(userId):
    try:
        updateconn()
        cur = conn.cursor()
        cur.execute(f"SELECT * FROM PendingAccountDeletion WHERE userId = {userId}")
        if len(cur.fetchall()) > 0:
            return True
        else:
            return False
        
    except:
        global errcnt
        errcnt += 1

def removeDeletionMark(userId):
    try:
        updateconn()
        cur = conn.cursor()
        cur.execute(f"DELETE FROM PendingAccountDeletion WHERE userId = {userId}")
        conn.commit()
        
    except:
        global errcnt
        errcnt += 1

def DeleteAccountNow(userId):
    try:
        updateconn()
        cur = conn.cursor()

        cur.execute(f"SELECT userId FROM PendingAccountDeletion WHERE userId = {userId}")
        if len(cur.fetchall()) == 0:
            return -1
            
        deleteData(userId)
        conn.commit()
        
        return 0

    except:
        global errcnt
        errcnt += 1

def CheckDeletionMark(userId):
    try:
        updateconn()
        cur = conn.cursor()

        cur.execute(f"SELECT userId FROM PendingAccountDeletion WHERE userId = {userId}")
        if len(cur.fetchall()) != 0:
            return 1
        
        return 0

    except:
        global errcnt
        errcnt += 1

def CountDeletionMark():
    try:
        updateconn()
        cur = conn.cursor()

        cur.execute(f"SELECT COUNT(*) FROM PendingAccountDeletion")
        d = cur.fetchall()
        if len(d) == 0:
            return 0
        
        return d[0][0]

    except:
        global errcnt
        errcnt += 1