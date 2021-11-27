# Copyright (C) 2021 Charles All rights reserved.
# Author: @Charles-1414
# License: GNU General Public License v3.0

from flask import request, abort
import os, sys, datetime, time
import random
import json

from app import app, config
import db
from functions import *
import sessions

import MySQLdb
import sqlite3
conn = None

def updateconn():
    global conn
    if config.database == "mysql":
        conn = MySQLdb.connect(host = app.config["MYSQL_HOST"], user = app.config["MYSQL_USER"], \
            passwd = app.config["MYSQL_PASSWORD"], db = app.config["MYSQL_DB"])
    elif config.database == "sqlite":
        conn = sqlite3.connect("database.db", check_same_thread = False)
    
updateconn()

##########
# Question API
# Modify (Add, Edit, Delete, Status Update)

duplicate = []
@app.route("/api/question/add", methods = ['POST'])
def apiAddQuestion():
    updateconn()
    cur = conn.cursor()
    if not "userId" in request.form.keys() or not "token" in request.form.keys() or "userId" in request.form.keys() and (not request.form["userId"].isdigit() or int(request.form["userId"]) < 0):
        abort(401)
        
    userId = int(request.form["userId"])
    token = request.form["token"]
    if not validateToken(userId, token):
        abort(401)
    
    bookId = int(request.form["addToBook"])
    groupId = -1
    if bookId != 0:
        cur.execute(f"SELECT groupId, isEditor FROM GroupMember WHERE userId = {userId} AND bookId = {bookId}")
        d = cur.fetchall()
        if len(d) != 0:
            groupId = d[0][0]
            isEditor = d[0][1]
            if isEditor == 0:
                return json.dumps({"success": False, "msg": "You are not allowed to edit this question in group as you are not an editor! Clone the book to edit!"})

    max_allow = config.max_question_per_user_allowed
    cur.execute(f"SELECT value FROM Privilege WHERE userId = {userId} AND item = 'question_limit'")
    pr = cur.fetchall()
    if len(pr) != 0:
        max_allow = pr[0][0]
    cur.execute(f"SELECT COUNT(*) FROM QuestionList WHERE userId = {userId}")
    d = cur.fetchall()
    if len(d) != 0 and max_allow != -1 and d[0][0] + 1 >= max_allow:
        return json.dumps({"success": False, "msg": f"You have reached your limit of maximum added questions {max_allow}. Remove some old questions or contact administrator for help."})

    question = request.form["question"].replace("\\n","\n")
    question = encode(question)

    if not (userId, question) in duplicate:
        cur.execute(f"SELECT * FROM QuestionList WHERE question = '{question}' AND userId = {userId}")
        if len(cur.fetchall()) != 0:
            duplicate.append((userId, question))
            return json.dumps({"success": False, "msg": "Question duplicated! Add again to ignore."})
    else:
        duplicate.remove((userId, question))

    answer = request.form["answer"].replace("\\n","\n")
    answer = encode(answer)

    questionId = 1
    cur.execute(f"SELECT nextId FROM IDInfo WHERE type = 2 AND userId = {userId}")
    d = cur.fetchall()
    if len(d) == 0:
        cur.execute(f"INSERT INTO IDInfo VALUES (2, {userId}, 2)")
    else:
        questionId = d[0][0]
        cur.execute(f"UPDATE IDInfo SET nextId = {questionId + 1} WHERE type = 2 AND userId = {userId}")

    if len(question) >= 40960:
        return json.dumps({"success": False, "msg": "Question too long!"})
    if len(answer) >= 40960:
        return json.dumps({"success": False, "msg": "Answer too long!"})

    cur.execute(f"INSERT INTO QuestionList VALUES ({userId},{questionId},'{question}','{answer}',1, 0)")
    cur.execute(f"INSERT INTO ChallengeData VALUES ({userId},{questionId},0,-1)")
    updateQuestionStatus(userId, questionId, -2) # -2 is website added question
    updateQuestionStatus(userId, questionId, 1)

    if bookId != -1:
        cur.execute(f"SELECT bookId FROM Book WHERE userId = {userId} AND bookId = {bookId}")
        if len(cur.fetchall()) != 0:
            appendBookData(userId, bookId, questionId)
    
    if groupId != -1:
        gquestionId = 1
        cur.execute(f"SELECT nextId FROM IDInfo WHERE type = 5 AND userId = {groupId}")
        d = cur.fetchall()
        if len(d) == 0:
            cur.execute(f"INSERT INTO IDInfo VALUES (5, {groupId}, 2)")
        else:
            gquestionId = d[0][0]
            cur.execute(f"UPDATE IDInfo SET nextId = {gquestionId + 1} WHERE type = 5 AND userId = {groupId}")
        
        cur.execute(f"INSERT INTO GroupQuestion VALUES ({groupId}, {gquestionId}, '{question}', '{answer}')")
        cur.execute(f"INSERT INTO GroupSync VALUES ({groupId}, {userId}, {questionId}, {gquestionId})")
        
        cur.execute(f"SELECT userId, bookId FROM GroupMember WHERE groupId = {groupId}")
        t = cur.fetchall()
        for tt in t:
            uid = tt[0]
            if uid == userId or uid < 0:
                continue
            wbid = tt[1]

            wid = 1
            cur.execute(f"SELECT nextId FROM IDInfo WHERE type = 2 AND userId = {uid}")
            d = cur.fetchall()
            if len(d) == 0:
                cur.execute(f"INSERT INTO IDInfo VALUES (2, {uid}, 2)")
            else:
                wid = d[0][0]
                cur.execute(f"UPDATE IDInfo SET nextId = {wid + 1} WHERE type = 2 AND userId = {uid}")

            if len(question) >= 40960:
                return json.dumps({"success": False, "msg": "Question too long!"})
            if len(answer) >= 40960:
                return json.dumps({"success": False, "msg": "Answer too long!"})

            cur.execute(f"INSERT INTO QuestionList VALUES ({uid}, {wid}, '{question}', '{answer}', 1, 0)")
            appendBookData(uid, wbid, wid)
            cur.execute(f"INSERT INTO ChallengeData VALUES ({uid},{wid},0,-1)")
            cur.execute(f"INSERT INTO GroupSync VALUES ({groupId}, {uid}, {wid}, {gquestionId})")
            updateQuestionStatus(uid, wid, -3) # -3 is group question
            updateQuestionStatus(uid, wid, 1) # 1 is default status

    conn.commit()

    return json.dumps({"success": True, "msg": "Question added!"})

@app.route("/api/question/edit", methods = ['POST'])
def apiEditQuestion():
    updateconn()
    cur = conn.cursor()
    if not "userId" in request.form.keys() or not "token" in request.form.keys() or "userId" in request.form.keys() and (not request.form["userId"].isdigit() or int(request.form["userId"]) < 0):
        abort(401)
        
    userId = int(request.form["userId"])
    token = request.form["token"]
    if not validateToken(userId, token):
        abort(401)

    questionId = int(request.form["questionId"])

    groupId = -1
    cur.execute(f"SELECT groupId FROM GroupSync WHERE userId = {userId} AND questionIdOfUser = {questionId}")
    d = cur.fetchall()
    if len(d) != 0:
        groupId = d[0][0]
        isEditor = 0
        cur.execute(f"SELECT isEditor FROM GroupMember WHERE groupId = {groupId} AND userId = {userId}")
        tt = cur.fetchall()
        if len(tt) > 0:
            isEditor = tt[0][0]
        if isEditor == 0:
            return json.dumps({"success": False, "msg": "You are not allowed to edit this question in group as you are not an editor! Clone the book to edit!"})

    question = encode(request.form["question"].replace("\\n","\n"))
    answer = encode(request.form["answer"].replace("\\n","\n"))

    cur.execute(f"SELECT * FROM QuestionList WHERE questionId = {questionId} AND userId = {userId}")
    if len(cur.fetchall()) == 0:
        return json.dumps({"success": False, "msg": "Question does not exist!"})
    
    if len(question) >= 40960:
        return json.dumps({"success": False, "msg": "Question too long!"})
    if len(answer) >= 40960:
        return json.dumps({"success": False, "msg": "Answer too long!"})

    cur.execute(f"UPDATE QuestionList SET question = '{question}' WHERE questionId = {questionId} AND userId = {userId}")
    cur.execute(f"UPDATE QuestionList SET answer = '{answer}' WHERE questionId = {questionId} AND userId = {userId}")

    if groupId != -1:
        cur.execute(f"SELECT questionIdOfGroup FROM GroupSync WHERE userId = {userId} AND questionIdOfUser = {questionId}")
        tt = cur.fetchall()
        if len(tt) != 0:
            gquestionId = tt[0][0]
            cur.execute(f"UPDATE GroupQuestion SET question = '{question}' WHERE groupId = {groupId} AND groupQuestionId = {gquestionId}")
            cur.execute(f"UPDATE GroupQuestion SET answer = '{answer}' WHERE groupId = {groupId} AND groupQuestionId = {gquestionId}")
            cur.execute(f"SELECT userId, questionIdOfUser FROM GroupSync WHERE groupId = {groupId} AND questionIdOfGroup = {gquestionId}")
            t = cur.fetchall()
            for tt in t:
                uid = tt[0]
                if uid == userId or uid < 0:
                    continue
                wid = tt[1]
                
                if len(question) >= 40960:
                    return json.dumps({"success": False, "msg": "Question too long!"})
                if len(answer) >= 40960:
                    return json.dumps({"success": False, "msg": "Answer too long!"})

                cur.execute(f"UPDATE QuestionList SET question = '{question}' WHERE userId = {uid} AND questionId = {wid}")
                cur.execute(f"UPDATE QuestionList SET answer = '{answer}' WHERE userId = {uid} AND questionId = {wid}")

    conn.commit()

    return json.dumps({"success":True})

@app.route("/api/question/delete", methods = ['POST'])
def apiDeleteQuestion():
    updateconn()
    cur = conn.cursor()
    if not "userId" in request.form.keys() or not "token" in request.form.keys() or "userId" in request.form.keys() and (not request.form["userId"].isdigit() or int(request.form["userId"]) < 0):
        abort(401)
        
    userId = int(request.form["userId"])
    token = request.form["token"]
    if not validateToken(userId, token):
        abort(401)

    questions = json.loads(request.form["questions"])

    for questionId in questions:
        groupId = -1
        cur.execute(f"SELECT groupId FROM GroupSync WHERE userId = {userId} AND questionIdOfUser = {questionId}")
        d = cur.fetchall()
        if len(d) != 0:
            groupId = d[0][0]
            isEditor = 0
            cur.execute(f"SELECT isEditor FROM GroupMember WHERE groupId = {groupId} AND userId = {userId}")
            tt = cur.fetchall()
            if len(tt) > 0:
                isEditor = tt[0][0]
            if isEditor == 0:
                return json.dumps({"success": False, "msg": "You are not allowed to edit this question in group as you are not an editor! Clone the book to edit!"})

        cur.execute(f"SELECT questionId, question, answer, status FROM QuestionList WHERE userId = {userId} AND questionId = {questionId}")
        d = cur.fetchall()
        if len(d) > 0: # make sure question not deleted
            ts = int(time.time())
            dd = d[0]
            cur.execute(f"DELETE FROM QuestionList WHERE userId = {userId} AND questionId = {questionId}")
            removeBookData(userId, -1, questionId)
            
        if groupId != -1:
            cur.execute(f"SELECT questionIdOfGroup FROM GroupSync WHERE userId = {userId} AND questionIdOfUser = {questionId}")
            tt = cur.fetchall()
            if len(tt) == 0:
                continue # sync data lost, skip sync
            gquestionId = tt[0][0] 
            cur.execute(f"DELETE FROM GroupQuestion WHERE groupId = {groupId} AND groupQuestionId = {gquestionId}")
            cur.execute(f"SELECT userId, questionIdOfUser FROM GroupSync WHERE groupId = {groupId} AND questionIdOfGroup = {gquestionId}")
            t = cur.fetchall()
            for tt in t:
                uid = tt[0]
                if uid == userId or uid < 0:
                    continue
                wid = tt[1]
                cur.execute(f"DELETE FROM QuestionList WHERE userId = {uid} AND questionId = {wid}")
                removeBookData(uid, -1, wid)
            cur.execute(f"DELETE FROM GroupSync WHERE groupId = {groupId} AND questionIdOfGroup = {gquestionId}")
            cur.execute(f"DELETE FROM GroupQuestion WHERE groupQuestionId = {gquestionId}")

    conn.commit()

    return json.dumps({"success": True})

@app.route("/api/question/clearDeleted", methods = ['POST'])
def apiClearDeleted():
    updateconn()
    cur = conn.cursor()
    if not "userId" in request.form.keys() or not "token" in request.form.keys() or "userId" in request.form.keys() and (not request.form["userId"].isdigit() or int(request.form["userId"]) < 0):
        abort(401)
        
    userId = int(request.form["userId"])
    token = request.form["token"]
    if not validateToken(userId, token):
        abort(401)

    cur.execute(f"SELECT questionId, question, answer, status FROM QuestionList WHERE userId = {userId} AND status = 3")
    d = cur.fetchall()
    ts = int(time.time())
    cur.execute(f"DELETE FROM QuestionList WHERE userId = {userId} AND status = 3")
    for dd in d:
        removeBookData(userId, -1, dd[0])
    conn.commit()

    return json.dumps({"success": True})
    
@app.route("/api/question/status/update", methods = ['POST'])
def apiUpdateQuestionStatus():
    updateconn()
    cur = conn.cursor()
    if not "userId" in request.form.keys() or not "token" in request.form.keys() or "userId" in request.form.keys() and (not request.form["userId"].isdigit() or int(request.form["userId"]) < 0):
        abort(401)
        
    userId = int(request.form["userId"])
    token = request.form["token"]
    if not validateToken(userId, token):
        abort(401)

    questions = json.loads(request.form["questions"])
    status = int(request.form["status"])

    if status < 1 or status > 3:
        return json.dumps({"success": False, "msg": "Invalid status code!"})

    for questionId in questions:
        cur.execute(f"SELECT question FROM QuestionList WHERE questionId = {questionId} AND userId = {userId}")
        if len(cur.fetchall()) == 0:
            return json.dumps({"succeed": False, "msg": "Question not found!"})

        cur.execute(f"UPDATE QuestionList SET status = {status} WHERE questionId = {questionId} AND userId = {userId}")

        updateQuestionStatus(userId, questionId, status)

    conn.commit()

    return json.dumps({"succeed": True})