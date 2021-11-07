# Copyright (C) 2021 Charles All rights reserved.
# Author: @Charles-1414
# License: GNU General Public License v3.0

from flask import request, abort
import os, sys, time, math
import json
import validators
import sqlite3

from app import app, config
from functions import *
import sessions
import tempdb

##########
# Discovery API

@app.route("/api/discovery", methods = ['GET','POST'])
def apiDiscovery():
    cur = conn.cursor()
    cur.execute(f"SELECT discoveryId, title, description, publisherId, type FROM Discovery")
    d = cur.fetchall()
    dis = []
    for dd in d:
        publisher = "Unknown User"
        cur.execute(f"SELECT username FROM UserInfo WHERE userId = {dd[3]}")
        t = cur.fetchall()
        if len(t) != 0:
            publisher = t[0][0]
            if publisher == "@deleted":
                publisher = "Deleted Account"

        # update views
        cur.execute(f"SELECT count FROM DiscoveryClick WHERE discoveryId = {dd[0]}")
        views = 0
        t = cur.fetchall()
        if len(t) > 0:
            views = t[0][0]
        
        # get views and likes
        cur.execute(f"SELECT COUNT(like) FROM DiscoveryLike WHERE discoveryId = {dd[0]}")
        likes = 0
        t = cur.fetchall()
        if len(t) > 0:
            likes = t[0][0]

        dis.append({"discoveryId": dd[0], "title": decode(dd[1]), "description": decode(dd[2]), "publisher": publisher, "type": dd[4], "views": views, "likes": likes})
    
    return json.dumps(dis)

@app.route("/api/discovery/<int:discoveryId>", methods = ['GET', 'POST'])
def apiDiscoveryData(discoveryId):
    cur = conn.cursor()

    userId = 0

    if request.method == "POST":
        loggedin = False
        if not "userId" in request.form.keys() or not "token" in request.form.keys() or "userId" in request.form.keys() and (not request.form["userId"].isdigit() or int(request.form["userId"]) < 0):
            loggedin = False
        else:
            loggedin = True
        
        if loggedin:
            loggedin = False
            userId = int(request.form["userId"])
            token = request.form["token"]
            if validateToken(userId, token):
                loggedin = True
        
        if not loggedin:
            userId = 0
    
    cur.execute(f"SELECT publisherId, bookId, title, description, type FROM Discovery WHERE discoveryId = {discoveryId}")
    d = cur.fetchall()
    if len(d) == 0:
        return json.dumps({"success": False, "msg": "Post not found!"})
    d = d[0]

    uid = d[0]
    bookId = d[1]
    title = decode(d[2])
    description = decode(d[3])
    distype = d[4]
    
    # Check share existence
    if distype == 1:
        cur.execute(f"SELECT * FROM Book WHERE userId = {uid} AND bookId = {bookId}")
        t = cur.fetchall()
        if len(t) == 0:
            cur.execute(f"DELETE FROM Discovery WHERE discoveryId = {discoveryId}")
            conn.commit()
            return json.dumps({"success": False, "msg": "Book not found!"})
    
    elif distype == 2:
        cur.execute(f"SELECT * FROM GroupInfo WHERE groupId = {bookId}")
        t = cur.fetchall()
        if len(t) == 0:
            cur.execute(f"DELETE FROM Discovery WHERE discoveryId = {discoveryId}")
            conn.commit()
            return json.dumps({"success": False, "msg": "Group not found!"})

    
    # Check share status as books must be shared before being imported
    # Do not clear discovery status as publisher may just want to close it temporarily
    shareCode = ""
    if distype == 1:
        cur.execute(f"SELECT shareCode FROM BookShare WHERE userId = {uid} AND bookId = {bookId}")
        t = cur.fetchall()
        if len(t) != 0:
            shareCode = "!"+t[0][0]

        if shareCode == "":
            return json.dumps({"success": False, "msg": "Book not shared! Maybe the publisher just closed it temporarily."})

    elif distype == 2:
        groupId = -1
        cur.execute(f"SELECT groupId FROM GroupBind WHERE userId = {uid} AND bookId = {bookId}")
        t = cur.fetchall()
        if len(t) != 0:
            groupId = t[0][0]
        if groupId != -1:
            cur.execute(f"SELECT groupCode FROM GroupInfo WHERE groupId = {groupId}")
            t = cur.fetchall()
            if len(t) != 0:
                shareCode = "@"+t[0][0]

        if shareCode == "" or shareCode == "@pvtgroup":
            return json.dumps({"success": False, "msg": "Group not open to public! Maybe the publisher just closed it temporarily."})

    # Get discovery publisher username
    publisher = "Unknown User"
    cur.execute(f"SELECT username FROM UserInfo WHERE userId = {uid}")
    t = cur.fetchall()
    if len(t) != 0:
        publisher = t[0][0]
        if publisher == "@deleted":
            publisher = "Deleted Account"
    
    isPublisher = False
    if uid == userId:
        isPublisher = True
    
    # get questions
    questions = []
    if distype == 1:
        cur.execute(f"SELECT questionId FROM BookData WHERE userId = {uid} AND bookId = {bookId}")
        p = cur.fetchall()
        for pp in p:
            cur.execute(f"SELECT question, answer FROM QuestionList WHERE userId = {uid} AND questionId = {pp[0]}")
            t = cur.fetchall()
            if len(t) == 0:
                continue
            questions.append({"question": decode(t[0][0]), "answer": decode(t[0][1])})
    elif distype == 2:
        cur.execute(f"SELECT question, answer FROM GroupQuestion WHERE groupId = {bookId}")
        t = cur.fetchall()
        for tt in t:
            questions.append({"question": decode(tt[0]), "answer": decode(tt[1])})

    # update views
    cur.execute(f"SELECT count FROM DiscoveryClick WHERE discoveryId = {discoveryId}")
    views = 1
    t = cur.fetchall()
    if len(t) > 0:
        views = t[0][0] + 1
        cur.execute(f"UPDATE DiscoveryClick SET count = count + 1 WHERE discoveryId = {discoveryId}")
    else:
        cur.execute(f"INSERT INTO DiscoveryClick VALUES ({discoveryId}, 1)")
    conn.commit()
    
    # get views and likes
    cur.execute(f"SELECT COUNT(like) FROM DiscoveryLike WHERE discoveryId = {discoveryId}")
    likes = 0
    t = cur.fetchall()
    if len(t) > 0:
        likes = t[0][0]
    
    # get user liked
    cur.execute(f"SELECT like FROM DiscoveryLike WHERE discoveryId = {discoveryId} AND userId = {userId}")
    liked = False
    t = cur.fetchall()
    if len(t) > 0:
        liked = True
    
    return json.dumps({"title": title, "description": description, "questions": questions, "publisher": publisher, "shareCode": shareCode, "type": distype, "isPublisher": isPublisher, "views": views, "likes": likes, "liked": liked})

@app.route("/api/discovery/publish", methods = ['POST'])
def apiDiscoveryPublish():
    cur = conn.cursor()
    if not "userId" in request.form.keys() or not "token" in request.form.keys() or "userId" in request.form.keys() and (not request.form["userId"].isdigit() or int(request.form["userId"]) < 0):
        abort(401)

    userId = int(request.form["userId"])
    token = request.form["token"]
    if not validateToken(userId, token):
        abort(401)

    if request.form["title"] == "" or request.form["description"] == "":
        return json.dumps({"success": False, "msg": "Both fields must be filled!"})
    
    bookId = int(request.form["bookId"])
    title = encode(request.form["title"])
    description = encode(request.form["description"])
    distype = int(request.form["type"])

    cur.execute(f"SELECT * FROM Discovery WHERE publisherId = {userId} AND bookId = {bookId} AND type = {distype}")
    if len(cur.fetchall()) != 0:
        if distype == 1:
            return json.dumps({"success": False, "msg": "Book already published!"})
        else:
            return json.dumps({"success": False, "msg": "Group already published!"})

    # get share code
    shareCode = ""
    if distype == 1:
        cur.execute(f"SELECT shareCode FROM BookShare WHERE userId = {userId} AND bookId = {bookId}")
        t = cur.fetchall()
        if len(t) != 0:
            shareCode = "!"+t[0][0]

        if shareCode == "":
            return json.dumps({"success": False, "msg": "Book must be shared first before publishing it on Discovery!"})

    elif distype == 2:
        groupId = bookId
        cur.execute(f"SELECT groupCode, owner FROM GroupInfo WHERE groupId = {groupId}")
        t = cur.fetchall()
        if len(t) != 0:
            # check if user is group owner
            if t[0][1] != userId:
                return json.dumps({"success": False, "msg": "Only the group owner can publish the group on discovery!"})

            shareCode = "@"+t[0][0]
    
        if shareCode == "" or shareCode == "@pvtgroup":
            return json.dumps({"success": False, "msg": "Group must be open to public before publishing it on Discovery!"})
    

    discoveryId = 1
    cur.execute(f"SELECT nextId FROM IDInfo WHERE type = 6")
    t = cur.fetchall()
    if len(t) > 0:
        discoveryId = t[0][0]
    cur.execute(f"UPDATE IDInfo SET nextId = {discoveryId + 1} WHERE type = 6")
    
    cur.execute(f"INSERT INTO Discovery VALUES ({discoveryId}, {userId}, {bookId}, '{title}', '{description}', {distype})")
    conn.commit()

    msg = "Book published to Discovery. People will be able to find it and import it. All your updates made within this book will be synced to Discovery."
    if distype == 2:
        msg = "Group published to Discovery. People will be able to find it and join it. All your updates made within this group will be synced to Discovery."
    
    return json.dumps({"success": True, "msg": msg, "discoveryId": discoveryId})

@app.route("/api/discovery/unpublish", methods = ['POST'])
def apiDiscoveryUnpublish():
    cur = conn.cursor()
    if not "userId" in request.form.keys() or not "token" in request.form.keys() or "userId" in request.form.keys() and (not request.form["userId"].isdigit() or int(request.form["userId"]) < 0):
        abort(401)

    userId = int(request.form["userId"])
    token = request.form["token"]
    if not validateToken(userId, token):
        abort(401)
    
    discoveryId = int(request.form["discoveryId"])

    cur.execute(f"SELECT * FROM Discovery WHERE discoveryId = {discoveryId}")
    if len(cur.fetchall()) == 0:
        return json.dumps({"success": False, "msg": "Book not published!"})
    
    # allow admin to unpublish
    cur.execute(f"SELECT userId FROM AdminList WHERE userId = {userId}")
    if len(cur.fetchall()) == 0:
        cur.execute(f"SELECT publisherId FROM Discovery WHERE discoveryId = {discoveryId}")
        publisherId = 0
        t = cur.fetchall()
        if len(t) > 0:
            publisherId = t[0][0]
        if publisherId != userId:
            return json.dumps({"success": False, "msg": "You are not the publisher of this post!"})


    cur.execute(f"DELETE FROM Discovery WHERE discoveryId = {discoveryId}")
    conn.commit()

    return json.dumps({"success": True, "msg": "Book unpublished!"})

@app.route("/api/discovery/update", methods = ['POST'])
def apiDiscoveryUpdate():
    cur = conn.cursor()
    if not "userId" in request.form.keys() or not "token" in request.form.keys() or "userId" in request.form.keys() and (not request.form["userId"].isdigit() or int(request.form["userId"]) < 0):
        abort(401)

    userId = int(request.form["userId"])
    token = request.form["token"]
    if not validateToken(userId, token):
        abort(401)
    
    discoveryId = int(request.form["discoveryId"])
    title = encode(request.form["title"])
    description = encode(request.form["description"])

    if request.form["title"] == "" or request.form["description"] == "":
        return json.dumps({"success": False, "msg": "Both fields must be filled!"})

    # allow admin to update
    cur.execute(f"SELECT userId FROM AdminList WHERE userId = {userId}")
    if len(cur.fetchall()) == 0:
        cur.execute(f"SELECT publisherId FROM Discovery WHERE discoveryId = {discoveryId}")
        publisherId = 0
        t = cur.fetchall()
        if len(t) > 0:
            publisherId = t[0][0]
        if publisherId != userId:
            return json.dumps({"success": False, "msg": "You are not the publisher of this post!"})

    cur.execute(f"UPDATE Discovery SET title = '{title}' WHERE discoveryId = {discoveryId}")
    cur.execute(f"UPDATE Discovery SET description = '{description}' WHERE discoveryId = {discoveryId}")
    conn.commit()
    
    return json.dumps({"success": True, "msg": "Success! Discovery post updated!"})

@app.route("/api/discovery/like", methods = ['POST'])
def apiDiscoveryLike():
    cur = conn.cursor()
    if not "userId" in request.form.keys() or not "token" in request.form.keys() or "userId" in request.form.keys() and (not request.form["userId"].isdigit() or int(request.form["userId"]) < 0):
        abort(401)

    userId = int(request.form["userId"])
    token = request.form["token"]
    if not validateToken(userId, token):
        abort(401)
    
    discoveryId = int(request.form["discoveryId"])
    
    cur.execute(f"SELECT publisherId, bookId FROM Discovery WHERE discoveryId = {discoveryId}")
    d = cur.fetchall()
    if len(d) == 0:
        return json.dumps({"success": False, "msg": "Book not found!"})
    
    cur.execute(f"SELECT * FROM DiscoveryLike WHERE discoveryId = {discoveryId} AND userId = {userId} AND like = 1")
    if len(cur.fetchall()) != 0:
        cur.execute(f"DELETE FROM DiscoveryLike WHERE discoveryId = {discoveryId} AND userId = {userId} AND like = 1")
        conn.commit()
        return json.dumps({"success": True, "msg": "Unliked!", "liked": False})
    else:
        cur.execute(f"INSERT INTO DiscoveryLike VALUES ({discoveryId}, {userId}, 1)")
        conn.commit()
        return json.dumps({"success": True, "msg": "Liked!", "liked": True})