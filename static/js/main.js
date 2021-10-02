// Copyright (C) 2021 Charles All rights reserved.
// Author: @Charles-1414
// License: GNU General Public License v3.0

// Update text font (adding this directly to html does not work)
$("head").prepend(
    "<style> @font-face { font-family: 'Comic Sans MS'; src: url('/static/ComicSansMS3.ttf') format('truetype'); } </style>"
);

// Define canvas
var canvas = document.getElementById("canvas");
var ctx = canvas.getContext('2d');

// Check device
var isphone = 0;
if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
    isphone = 1;
}





// Prepare display settings for different types of devices

var fontSize = 40;
var smallfontSize = 20;
var largefontSize = 60;
var orgFontSize = 40;
var orgSmallFontSize = 20;
var orgLargeFontSize = 60;

var splitLine = 16;
var orgSplitLine = 16;

var btnMargin = 0.5;
var lineheight = 50;
var bottomOffset = 100;

var buttons = [];
var btncnt = 23;

if (isphone) {
    splitLine = 32;
    orgSplitLine = 32;

    btnMargin = 0.2;
    lineheight = 100;
    bottomOffset = 250;
}

var windowOrgW = 1536;
var windowOrgH = 864;
buttons[0]={name:"start",x:0,y:0,w:300,h:50,orgw:300,orgh:50},
buttons[6]={name:"tag",x:0,y:0,w:170,h:50,orgw:170,orgh:50},
buttons[11]={name:"remove",x:0,y:0,w:170,h:50,orgw:170,orgh:50},
buttons[1]={name:"previous",x:0,y:0,w:170,h:50,orgw:170,orgh:50},
buttons[2]={name:"next",x:0,y:0,w:170,h:50,orgw:170,orgh:50},
buttons[3]={name:"sound",x:0,y:0,w:50,h:50,orgw:50,orgh:50},
buttons[13]={name:"pauseap",x:0,y:0,w:170,h:50,orgw:170,orgh:50},
buttons[16]={name:"challengeyes",x:0,y:0,w:170,h:50,orgw:170,orgh:50},
buttons[17]={name:"challengeno",x:0,y:0,w:170,h:50,orgw:170,orgh:50},
buttons[15]={name:"mode0",x:0,y:0,w:250,h:50,orgw:250,orgh:50},
buttons[4]={name:"mode1",x:0,y:0,w:170,h:50,orgw:170,orgh:50},
buttons[5]={name:"mode2",x:0,y:0,w:170,h:50,orgw:170,orgh:50},
buttons[7]={name:"mode3",x:0,y:0,w:170,h:50,orgw:170,orgh:50},
buttons[10]={name:"mode4",x:0,y:0,w:170,h:50,orgw:170,orgh:50},
buttons[8]={name:"homepage",x:0,y:0,w:200,h:50,orgw:200,orgh:50},
buttons[14]={name:"settings",x:0,y:0,w:200,h:50,orgw:200,orgh:50},
buttons[20]={name:"account",x:0,y:0,w:200,h:50,orgw:200,orgh:50},
buttons[18]={name:"statistics",x:0,y:0,w:200,h:50,orgw:200,orgh:50},
buttons[22]={name:"list",x:0,y:0,w:200,h:50,orgw:200,orgh:50},
buttons[9]={name:"import",x:0,y:0,w:200,h:50,orgw:200,orgh:50},
buttons[12]={name:"export",x:0,y:0,w:200,h:50,orgw:200,orgh:50},
buttons[19]={name:"addword",x:0,y:0,w:300,h:50,orgw:300,orgh:50},
buttons[21]={name:"cleardeleted",x:0,y:0,w:500,h:50,orgw:500,orgh:50};

if (isphone) {
    for (var i = 0; i < btncnt; i++) {
        buttons[i].w = buttons[i].orgw * 2;
        buttons[i].h = buttons[i].orgw * 2;
    }
}


// Initialize button position

function btninit() {
    for (var i = 0; i < btncnt; i++) {
        buttons[i].x = canvas.width + 5000;
        buttons[i].y = canvas.height + 5000;
    }
}

function btnresize() {
    for (var i = 0; i < btncnt; i++) {
        buttons[i].w = Math.min(buttons[i].orgw, parseInt(buttons[i].orgw * window.innerWidth - 25 / windowOrgW * window.innerHeight - 25 / windowOrgH));
        buttons[i].h = Math.min(buttons[i].orgh, parseInt(buttons[i].orgh * window.innerHeight - 25 / windowOrgH * window.innerWidth - 25 / windowOrgW * 1.2));
    }
}

function fontresize() {
    fontSize = Math.min(orgFontSize, parseInt(orgFontSize * window.innerWidth - 25 / windowOrgW));
    largefontSize = Math.min(orgLargeFontSize, parseInt(orgLargeFontSize * window.innerWidth - 25 / windowOrgW));
    smallfontSize = Math.min(orgSmallFontSize, parseInt(orgSmallFontSize * window.innerWidth - 25 / windowOrgW));

    splitLine = Math.min(splitLine, parseInt(orgSplitLine * window.innerWidth - 25 / windowOrgW));
}
btninit();
btnresize();
fontresize();





// Fetch word list

$('#wordList').DataTable({
    "pagingType": "full_numbers"
});
$(".dataTables_scrollBody").css('width', '102%');
$(".dataTables_scrollHeader").css('width', '102%');
$("#wordList_wrapper").hide();
$("#wordList").show();

var wordList = JSON.parse(localStorage.getItem("wordList"));
if (wordList == null) {
    wordList = [];
    localStorage.setItem("wordList", JSON.stringify([]));
} else {
    table = $("#wordList").DataTable();

    table.clear();
    table.draw();

    l = ["", "Default", "Tagged", "Deleted"];
    for (var i = 0; i < wordList.length; i++) {
        table.row.add([
            [wordList[i].word],
            [wordList[i].translation],
            [l[wordList[i].status]]
        ]);
    }
    table.draw();
}

// Update word list each 10 minutes

function updateWordList() {
    $.ajax({
        url: "/api/getWordList",
        method: 'POST',
        async: true,
        dataType: "json",
        data: {
            userId: localStorage.getItem("userId"),
            token: localStorage.getItem("token")
        },
        success: function (r) {
            wordList = r;
            l = ["", "Default", "Tagged", "Deleted"];
            localStorage.setItem("wordList", JSON.stringify(wordList));
            table = $("#wordList").DataTable();
            table.clear();
            table.draw();
            for (var i = 0; i < wordList.length; i++) {
                table.row.add([
                    [wordList[i].word],
                    [wordList[i].translation],
                    [l[wordList[i].status]]
                ]);
            }
            table.draw();
        }
    });
}
updateWordList();
setInterval(updateWordList, 600000);





// Settings variables

var started = 0;
var random = localStorage.getItem("random");
if (random == null) {
    random = 0;
}
random = parseInt(random);
var swap = localStorage.getItem("swap");
if (swap == null) {
    swap = 0;
}
swap = parseInt(swap);
var showStatus = localStorage.getItem("showStatus"); //1: default (normal + tagged) | 2: tagged | 3: deleted
if (showStatus == null) {
    showStatus = 1;
}
showStatus = parseInt(showStatus);
var autoPlay = localStorage.getItem("autoPlay");
if (autoPlay == null) {
    autoPlay = 0; //0: none | 1: slow (8 sec) | 2:medium (5 sec) | 3.fast (3 sec)
}
autoPlay = parseInt(autoPlay);
var apinterval = -1;
var appaused = 0;

displayMode = localStorage.getItem("displayMode");
if (displayMode == null) {
    displayMode = 0;
}
displayMode = parseInt(displayMode);

var wordId = localStorage.getItem("wordId");

var word = "";
var translation = "";
var status = 0;

var lastpage = 0;
var currentpage = 0; // 0: homepage, 1: wordpage, 2: settings, 3: addword
var statson = 0; // statistics ondisplay
var speaker = window.speechSynthesis;

var displayingAnswer = 0;

var challengeStatus = 0;





// Prepare word to show

if (wordId != null && localStorage.getItem("token") != null && localStorage.getItem("token") != "") {
    // Get the word to start from
    $.ajax({
        url: '/api/getWord',
        method: 'POST',
        async: false,
        dataType: "json",
        data: {
            splitLine: splitLine,
            wordId: wordId,
            userId: localStorage.getItem("userId"),
            token: localStorage.getItem("token")
        },
        success: function (r) {
            word = r.word;
            translation = r.translation;
            status = r.status;
        },
        error: function (r) {
            if (r.status == 401) {
                alert("Login session expired! Please login again!");
                localStorage.removeItem("userId");
                localStorage.removeItem("token");
                window.location.href = "/user";
            }
        }
    });
}

// Word does not exist
if (word == "") { // Then show a random word to start from
    if (localStorage.getItem("token") != null && localStorage.getItem("token") != "") {
        $.ajax({
            url: '/api/getNext',
            method: 'POST',
            async: false,
            dataType: "json",
            data: {
                status: showStatus,
                moveType: 0,
                splitLine: splitLine,
                userId: localStorage.getItem("userId"),
                token: localStorage.getItem("token")
            },
            success: function (r) {
                wordId = r.wordId;
                word = r.word;
                translation = r.translation;
                status = r.status;
            },
            error: function (r) {
                if (r.status == 401) {
                    alert("Login session expired! Please login again!");
                    localStorage.removeItem("userId");
                    localStorage.removeItem("token");
                    window.location.href = "/user";
                }
            }
        });
    }
}

lastInputChange = 0;

function displayRandomWord() {
    if(wordList != []){
        wordId = parseInt(Math.random()*1050);
        word = wordList[wordId].word;
        translation = wordList[wordId].translation;
        status = wordList[wordId].status;
        $("#startfrom").val(word);
        
        // In backend database, wordId starts from 1
        // But in frontend array, wordId starts from 0
        wordId += 1;
    }
}

$('#startfrom').on('input', function () {
    lastInputChange = Date.now();
});
var randomDisplayer = setInterval(displayRandomWord, 5000);

// Get word count
var wordcount = wordList.length;




// Start rendering

// Render home page on canvas
function renderHomePage() {
    btninit();
    $("#wordList_wrapper").hide();
    // Get page width & height
    canvas.width = window.innerWidth - 25;
    canvas.height = window.innerHeight - 25;

    // Clear existing canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Render buttons
    // Title
    ctx.textAlign = "center";

    ctx.font = largefontSize + "px Comic Sans MS";
    ctx.fillStyle = getRndColor(10, 100)
    ctx.fillText("Word Memo", canvas.width / 2, canvas.height / 2 - 100);

    // Content
    buttons[0].x = canvas.width / 2 - buttons[0].w / 2;
    buttons[0].y = canvas.height / 2 + buttons[0].h;
    ctx.fillStyle = getRndColor(160, 250);
    ctx.roundRect(buttons[0].x, buttons[0].y, buttons[0].w, buttons[0].h);
    ctx.font = fontSize + "px Comic Sans MS";

    ctx.fillStyle = getRndColor(10, 100);
    ctx.fillText("Start", buttons[0].x + buttons[0].w / 2, buttons[0].y + buttons[0].h / 1.4);
    if (displayMode == 0) {
        ctx.fillText("Practice Mode", buttons[0].x + buttons[0].w / 2, buttons[0].y + buttons[0].h * 2.2);
    } else if (displayMode == 1) {
        ctx.fillText("Challenge Mode", buttons[0].x + buttons[0].w / 2, buttons[0].y + buttons[0].h * 2.2);
    }
    ////
    buttons[20].x = canvas.width - buttons[20].w * 1.2;
    buttons[20].y = buttons[20].h * 0.2;
    ctx.fillStyle = getRndColor(160, 250);
    ctx.roundRect(buttons[20].x, buttons[20].y, buttons[20].w, buttons[20].h);

    ctx.font = fontSize + "px Comic Sans MS";
    ctx.fillStyle = getRndColor(10, 100);
    ctx.fillText("Account", buttons[20].x + buttons[20].w / 2, buttons[20].y + buttons[20].h / 1.4);
    ////
    buttons[14].x = canvas.width - buttons[14].w * 1.2;
    buttons[14].y = buttons[14].h * 1.5;
    ctx.fillStyle = getRndColor(160, 250);
    ctx.roundRect(buttons[14].x, buttons[14].y, buttons[14].w, buttons[14].h);

    ctx.font = fontSize * 0.9 + "px Comic Sans MS";
    ctx.fillStyle = getRndColor(10, 100);
    ctx.fillText("Settings", buttons[14].x + buttons[14].w / 2, buttons[14].y + buttons[14].h / 1.4);
    ////
    buttons[22].x = buttons[22].w * 0.2;
    buttons[22].y = buttons[22].h * 0.2;
    ctx.fillStyle = getRndColor(160, 250);
    ctx.roundRect(buttons[22].x, buttons[22].y, buttons[22].w, buttons[22].h);

    ctx.font = fontSize + "px Comic Sans MS";
    ctx.fillStyle = getRndColor(10, 100);
    ctx.fillText("List", buttons[22].x + buttons[22].w / 2, buttons[22].y + buttons[22].h / 1.4);

    // Render the input box "Start from"
    $("#startfrom").attr("style", "position:absolute;left:" + (buttons[0].x + 15) + ";top:" + (buttons[0].y - buttons[0].h - 20) + ";height:" + (buttons[0].h) + ";width:" + (buttons[0].w - 14) + ";font-size:" + fontSize * 0.6 + ";font-family:Comic Sans MS");
    if (displayMode == 1) {
        $("#startfrom").attr("disabled", "disabled");
    } else {
        $("#startfrom").removeAttr("disabled");
    }
    if (randomDisplayer == -1) {
        randomDisplayer = setInterval(displayRandomWord, 5000);
    }
}

// Render settings buttons on canvas
function renderSettings() {
    if (randomDisplayer != -1) {
        clearInterval(randomDisplayer);
        randomDisplayer = -1;
    }
    $("#startfrom").val("");
    $("#startfrom").hide();
    $("#addword_word").val("");
    $("#addword_word").hide();
    $("#addword_translation").val("");
    $("#addword_translation").hide();
    btninit();

    // Get page width & height
    canvas.width = window.innerWidth - 25;
    canvas.height = window.innerHeight - 25;

    // Clear existing canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Render buttons
    ctx.textAlign = "center";

    buttons[15].x = canvas.width / 2 + buttons[15].w / 2.5;
    buttons[15].y = buttons[15].h * 2;
    ctx.fillStyle = getRndColor(160, 250);
    ctx.roundRect(buttons[15].x, buttons[15].y, buttons[15].w, buttons[15].h);

    ctx.font = fontSize + "px Comic Sans MS";
    ctx.fillStyle = getRndColor(10, 100);
    ctx.fillText("Mode:", buttons[15].x - buttons[15].w * 0.7, buttons[15].y + buttons[15].h / 1.4);
    l = ["Practice", "Challenge"];
    ctx.fillText(l[displayMode], buttons[15].x + buttons[15].w / 2, buttons[15].y + buttons[15].h / 1.4);
    ////
    if (displayMode == 0) {
        buttons[4].x = canvas.width / 2 + buttons[4].w / 1.2;
        buttons[4].y = buttons[4].h * 3.5;
        ctx.fillStyle = getRndColor(160, 250);
        ctx.roundRect(buttons[4].x, buttons[4].y, buttons[4].w, buttons[4].h);

        ctx.font = fontSize + "px Comic Sans MS";
        ctx.fillStyle = getRndColor(10, 100);
        ctx.fillText("Display order: ", buttons[4].x - buttons[4].w * 1.2, buttons[4].y + buttons[4].h / 1.4);
        l = ["Sequence", "Random"]
        ctx.fillText(l[random], buttons[4].x + buttons[4].w / 2, buttons[4].y + buttons[4].h / 1.4);
        ////
        buttons[5].x = canvas.width / 2 + buttons[5].w / 1.2;
        buttons[5].y = buttons[5].h * 5;
        ctx.fillStyle = getRndColor(160, 250);
        ctx.roundRect(buttons[5].x, buttons[5].y, buttons[5].w, buttons[5].h);

        ctx.font = fontSize + "px Comic Sans MS";
        ctx.fillStyle = getRndColor(10, 100);
        ctx.fillText("Swap word & translation? ", buttons[5].x - buttons[5].w * 1.4, buttons[5].y + buttons[5].h / 1.4);
        l = ["No", "Yes"];
        ctx.fillText(l[swap], buttons[5].x + buttons[5].w / 2, buttons[5].y + buttons[5].h / 1.4);
        ////
        buttons[7].x = canvas.width / 2 + buttons[7].w / 1.2;
        buttons[7].y = buttons[7].h * 6.5;
        ctx.fillStyle = getRndColor(160, 250);
        ctx.roundRect(buttons[7].x, buttons[7].y, buttons[7].w, buttons[7].h);

        ctx.font = fontSize + "px Comic Sans MS";
        ctx.fillStyle = getRndColor(10, 100);
        ctx.fillText("What to show? ", buttons[7].x - buttons[7].w * 1.2, buttons[7].y + buttons[7].h / 1.4);
        l = ["", "All", "Tagged", "Deleted"];
        ctx.fillText(l[showStatus], buttons[7].x + buttons[7].w / 2, buttons[7].y + buttons[7].h / 1.4);
        ////
        buttons[10].x = canvas.width / 2 + buttons[10].w / 1.2;
        buttons[10].y = buttons[10].h * 8;
        ctx.fillStyle = getRndColor(160, 250);
        ctx.roundRect(buttons[10].x, buttons[10].y, buttons[10].w, buttons[10].h);

        ctx.font = fontSize + "px Comic Sans MS";
        ctx.fillStyle = getRndColor(10, 100);
        ctx.fillText("Auto play:", buttons[10].x - buttons[10].w * 1.2, buttons[10].y + buttons[10].h / 1.4);
        l = ["Disabled", "Slow", "Medium", "Fast"];
        ctx.fillText(l[autoPlay], buttons[10].x + buttons[10].w / 2, buttons[10].y + buttons[10].h / 1.4);

    } else if (displayMode == 1) {
        x = canvas.width / 2 + buttons[4].w / 1.2;
        y = buttons[4].h * 3.5;
        ctx.font = fontSize + "px Comic Sans MS";
        ctx.fillStyle = getRndColor(10, 100);
        ctx.fillText("Display order: ", x - buttons[4].w * 1.2, y + buttons[4].h / 1.4);
        ctx.fillText("Random", x + buttons[4].w / 2, y + buttons[4].h / 1.4);

        buttons[5].x = canvas.width / 2 + buttons[5].w / 1.2;
        buttons[5].y = buttons[5].h * 5;
        ctx.fillStyle = getRndColor(160, 250);
        ctx.roundRect(buttons[5].x, buttons[5].y, buttons[5].w, buttons[5].h);
        ctx.font = fontSize + "px Comic Sans MS";

        ctx.fillStyle = getRndColor(10, 100);
        ctx.fillText("Swap word & translation? ", buttons[5].x - buttons[5].w * 1.4, buttons[5].y + buttons[5].h / 1.4);
        l = ["No", "Yes"];
        ctx.fillText(l[swap], buttons[5].x + buttons[5].w / 2, buttons[5].y + buttons[5].h / 1.4);
        ////
        x = canvas.width / 2 + buttons[7].w / 1.2;
        y = buttons[7].h * 6.5;
        ctx.font = fontSize + "px Comic Sans MS";
        ctx.fillStyle = getRndColor(10, 100);
        ctx.fillText("What to show? ", x - buttons[7].w * 1.2, y + buttons[7].h / 1.4);
        ctx.fillText("Everything", x + buttons[7].w / 2, y + buttons[7].h / 1.4);
        ////
        x = canvas.width / 2 + buttons[10].w / 1.2;
        y = buttons[10].h * 8;
        ctx.font = fontSize + "px Comic Sans MS";
        ctx.fillStyle = getRndColor(10, 100);
        ctx.fillText("Auto play:", x - buttons[10].w * 1.2, y + buttons[10].h / 1.4);
        ctx.fillText("Disabled", x + buttons[10].w / 2, y + buttons[10].h / 1.4);
    }

    buttons[19].x = canvas.width / 2 - buttons[19].w / 2;
    buttons[19].y = canvas.height - buttons[19].h * 4;
    ctx.fillStyle = getRndColor(160, 250);
    ctx.roundRect(buttons[19].x, buttons[19].y, buttons[19].w, buttons[19].h);

    ctx.font = fontSize + "px Comic Sans MS";
    ctx.fillStyle = getRndColor(10, 100);
    ctx.fillText("Add Word", buttons[19].x + buttons[19].w / 2, buttons[19].y + buttons[19].h / 1.4);
    ////
    buttons[21].x = canvas.width / 2 - buttons[21].w / 2;
    buttons[21].y = canvas.height - buttons[21].h * 2.5;
    ctx.fillStyle = getRndColor(160, 250);
    ctx.roundRect(buttons[21].x, buttons[21].y, buttons[21].w, buttons[21].h);

    ctx.font = fontSize + "px Comic Sans MS";
    ctx.fillStyle = getRndColor(10, 100);
    ctx.fillText("Clear deleted words", buttons[21].x + buttons[21].w / 2, buttons[21].y + buttons[21].h / 1.4);
    ////
    buttons[9].x = canvas.width / 2 - buttons[9].w * (1 + btnMargin * 0.6);
    buttons[9].y = canvas.height - buttons[9].h * 1.2;
    ctx.fillStyle = getRndColor(160, 250);
    ctx.roundRect(buttons[9].x, buttons[9].y, buttons[9].w, buttons[9].h);

    ctx.font = fontSize + "px Comic Sans MS";
    ctx.fillStyle = getRndColor(10, 100);
    ctx.fillText("Import", buttons[9].x + buttons[9].w / 2, buttons[9].y + buttons[9].h / 1.4);
    ////
    buttons[12].x = canvas.width / 2 + buttons[12].w * btnMargin * 0.6;
    buttons[12].y = canvas.height - buttons[12].h * 1.2;
    ctx.fillStyle = getRndColor(160, 250);
    ctx.roundRect(buttons[12].x, buttons[12].y, buttons[12].w, buttons[12].h);

    ctx.font = fontSize + "px Comic Sans MS";
    ctx.fillStyle = getRndColor(10, 100);
    ctx.fillText("Export", buttons[12].x + buttons[12].w / 2, buttons[12].y + buttons[12].h / 1.4);

    if (lastpage != 1) {
        buttons[8].x = buttons[8].w * 0.2;
        buttons[8].y = buttons[8].h * 0.2;
        ctx.fillStyle = getRndColor(160, 250);
        ctx.roundRect(buttons[8].x, buttons[8].y, buttons[8].w, buttons[8].h);

        ctx.font = fontSize + "px Comic Sans MS";
        ctx.fillStyle = getRndColor(10, 100);
        ctx.fillText("Home", buttons[8].x + buttons[8].w / 2, buttons[8].y + buttons[8].h / 1.4);
    } else if (lastpage == 1) {
        buttons[0].x = buttons[8].w * 0.2;
        buttons[0].y = buttons[8].h * 0.2;
        ctx.fillStyle = getRndColor(160, 250);
        ctx.roundRect(buttons[0].x, buttons[0].y, buttons[8].w, buttons[8].h);

        ctx.font = fontSize + "px Comic Sans MS";
        ctx.fillStyle = getRndColor(10, 100);
        ctx.fillText("Resume", buttons[0].x + buttons[8].w / 2, buttons[0].y + buttons[8].h / 1.4);
    }

    // Add title
    ctx.fillText("Settings", canvas.width / 2, buttons[8].h * 0.2 + buttons[8].h / 1.4);
}

function renderAddWord() {
    // Get page width & height
    canvas.width = window.innerWidth - 25;
    canvas.height = window.innerHeight - 25;

    // Clear existing canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Create addword textarea box
    ctx.textAlign = "center";

    ctx.font = fontSize + "px Comic Sans MS";
    ctx.fillStyle = getRndColor(10, 100);
    ctx.fillText("Word: ", canvas.width / 2 - buttons[0].w / 2, canvas.height / 2 - 100);
    $("#addword_word").attr("style", "position:absolute;left:" + (canvas.width / 2) + ";top:" + (canvas.height / 2 - 118) + ";font-size:" + fontSize * 0.4 + ";font-family:Comic Sans MS");

    ctx.fillText("Translation: ", canvas.width / 2 - buttons[0].w / 2, canvas.height / 2 - 50);
    $("#addword_translation").attr("style", "position:absolute;left:" + (canvas.width / 2) + ";top:" + (canvas.height / 2 - 68) + ";font-size:" + fontSize * 0.4 + ";font-family:Comic Sans MS");

    // Add buttons
    buttons[14].x = canvas.width - buttons[14].w * 1.2;
    buttons[14].y = buttons[14].h * 0.2;
    ctx.fillStyle = getRndColor(160, 250);
    ctx.roundRect(buttons[14].x, buttons[14].y, buttons[14].w, buttons[14].h);

    ctx.font = fontSize * 0.9 + "px Comic Sans MS";
    ctx.fillStyle = getRndColor(10, 100);
    ctx.fillText("Settings", buttons[14].x + buttons[14].w / 2, buttons[14].y + buttons[14].h / 1.4);
    ////
    buttons[19].x = canvas.width / 2 - buttons[19].w / 2;
    buttons[19].y = canvas.height - buttons[19].h * 3;
    ctx.fillStyle = getRndColor(160, 250);
    ctx.roundRect(buttons[19].x, buttons[19].y, buttons[19].w, buttons[19].h);
    ////
    ctx.font = fontSize + "px Comic Sans MS";
    ctx.fillStyle = getRndColor(10, 100);
    ctx.fillText("Add", buttons[19].x + buttons[19].w / 2, buttons[19].y + buttons[19].h / 1.4);

    // Add title
    ctx.font = fontSize + "px Comic Sans MS";
    ctx.fillStyle = getRndColor(10, 100);
    ctx.fillText("Add Word", canvas.width / 2, buttons[8].h * 0.2 + buttons[8].h / 1.4);
}

// Render word information on canvas
function renderWord(showSwapped = 0, cancelSpeaker = 0) {
    if (randomDisplayer != -1) {
        clearInterval(randomDisplayer);
        randomDisplayer = -1;
    }

    btninit();
    // Get page width & height
    canvas.width = window.innerWidth - 25;
    canvas.height = window.innerHeight - 25;

    // Clear existing canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update word id
    localStorage.setItem("wordId", wordId);

    // Display word or translation
    ctx.font = fontSize + "px Comic Sans MS";
    ctx.textAlign = "center";
    ctx.fillStyle = "#000000";
    if (swap == 0 || swap == 1 && showSwapped == 1 || swap == 1 && challengeStatus == 1 || swap == 1 && challengeStatus == 3 || displayMode == 1 && wordId == -1) {
        ctx.fillText(word, canvas.width / 2, canvas.height / 2 - 200);
    }
    if (swap == 1 || swap == 0 && showSwapped == 1 || swap == 0 && challengeStatus == 1 || swap == 0 && challengeStatus == 3 || displayMode == 1 && wordId == -1) {
        var lines = translation.split('\n');
        for (var i = 0; i < lines.length; i++)
            ctx.fillText(lines[i], canvas.width / 2, canvas.height / 2 - 100 + (i * lineheight));
    }
    $("#startfrom").val(word);

    // Get random color
    rectcolor = getRndColor(160, 250);
    textcolor = getRndColor(10, 100);

    if ((swap == 0 || swap == 1 && showSwapped == 1 || displayMode == 1 && challengeStatus > 0) && wordId != -1) {
        buttons[3].x = canvas.width / 2 - buttons[3].w / 2;
        buttons[3].y = canvas.height - bottomOffset;
        ctx.fillStyle = rectcolor;
        ctx.roundRect(buttons[3].x, buttons[3].y, buttons[3].w, buttons[3].h);

        ctx.font = fontSize + "px Comic Sans MS";
        ctx.fillStyle = textcolor;
        ctx.fillText("🔈", buttons[3].x + buttons[3].w / 2, buttons[3].y + buttons[3].h / 1.4);
    }

    if (displayMode == 0) { // Practice mode
        ctx.fillText("Practice Mode", canvas.width / 2, buttons[0].h * 0.2 + buttons[0].h / 1.4);

        // Render buttons
        buttons[1].x = canvas.width / 2 - buttons[1].w * (1 + btnMargin);
        buttons[1].y = canvas.height - bottomOffset;
        ctx.fillStyle = rectcolor;
        ctx.roundRect(buttons[1].x, buttons[1].y, buttons[1].w, buttons[1].h);

        ctx.font = fontSize + "px Comic Sans MS";
        ctx.fillStyle = textcolor;
        ctx.fillText("Previous", buttons[1].x + buttons[1].w / 2, buttons[1].y + buttons[1].h / 1.4);
        ////
        buttons[2].x = canvas.width / 2 + buttons[2].w * btnMargin;
        buttons[2].y = canvas.height - bottomOffset;
        ctx.fillStyle = rectcolor;
        ctx.roundRect(buttons[2].x, buttons[2].y, buttons[2].w, buttons[2].h);

        ctx.font = fontSize + "px Comic Sans MS";
        ctx.fillStyle = textcolor;
        ctx.fillText("Next", buttons[2].x + buttons[2].w / 2, buttons[2].y + buttons[2].h / 1.4);
        ////
        buttons[6].x = canvas.width / 2 - buttons[6].w * (1 + btnMargin);
        buttons[6].y = canvas.height - bottomOffset - buttons[6].h * 1.5;
        ctx.fillStyle = rectcolor;
        ctx.roundRect(buttons[6].x, buttons[6].y, buttons[6].w, buttons[6].h);

        ctx.font = fontSize + "px Comic Sans MS";
        ctx.fillStyle = textcolor;
        if (status == 2)
            ctx.fillText("Untag", buttons[6].x + buttons[6].w / 2, buttons[6].y + buttons[6].h / 1.4);
        else
            ctx.fillText("Tag", buttons[6].x + buttons[6].w / 2, buttons[6].y + buttons[6].h / 1.4);
        ////
        buttons[11].x = canvas.width / 2 + buttons[11].w * btnMargin;
        buttons[11].y = canvas.height - bottomOffset - buttons[11].h * 1.5;
        ctx.fillStyle = rectcolor;
        ctx.roundRect(buttons[11].x, buttons[11].y, buttons[11].w, buttons[11].h);

        ctx.font = fontSize + "px Comic Sans MS";
        ctx.fillStyle = textcolor;
        if (status == 3) {
            ctx.font = (fontSize * 0.9) + "px Comic Sans MS";
            ctx.fillText("Undelete", buttons[11].x + buttons[11].w / 2, buttons[11].y + buttons[11].h / 1.4);
        } else
            ctx.fillText("Delete", buttons[11].x + buttons[11].w / 2, buttons[11].y + buttons[11].h / 1.4);

    } else if (displayMode == 1) { // Challenge mode
        ctx.fillText("Challenge Mode", canvas.width / 2, buttons[0].h * 0.2 + buttons[0].h / 1.4);

        if (wordId != -1) {
            if (challengeStatus != 3) {
                buttons[16].x = canvas.width / 2 - buttons[16].w * (1 + btnMargin);
                buttons[16].y = canvas.height - bottomOffset - buttons[16].h * 1.5;
                ctx.fillStyle = rectcolor;
                ctx.roundRect(buttons[16].x, buttons[16].y, buttons[16].w, buttons[16].h);

                ctx.font = fontSize + "px Comic Sans MS";
                ctx.fillStyle = textcolor;
                ctx.fillText("Yes", buttons[16].x + buttons[16].w / 2, buttons[16].y + buttons[16].h / 1.4);
            }

            ctx.textAlign = "center";
            if (challengeStatus == 0) {
                ctx.fillText("Do you remember it?", canvas.width / 2, buttons[16].y - buttons[16].h / 1.4);
            } else if (challengeStatus == 1) {
                ctx.fillText("Are you correct?", canvas.width / 2, buttons[16].y - buttons[16].h / 1.4);
            } else if (challengeStatus == 3) {
                x = canvas.width / 2 - buttons[16].w * (1 + btnMargin);
                y = canvas.height - bottomOffset - buttons[16].h * 1.5;
                ctx.fillText("Try to memorize it!", canvas.width / 2, y - buttons[16].h / 1.4);
            }
            ////
            buttons[17].x = canvas.width / 2 + buttons[17].w * btnMargin;
            buttons[17].y = canvas.height - bottomOffset - buttons[17].h * 1.5;
            ctx.fillStyle = rectcolor;
            ctx.roundRect(buttons[17].x, buttons[17].y, buttons[17].w, buttons[17].h);

            ctx.font = fontSize + "px Comic Sans MS";
            ctx.fillStyle = textcolor;
            if (challengeStatus != 3) {
                ctx.fillText("No", buttons[17].x + buttons[17].w / 2, buttons[17].y + buttons[17].h / 1.4);
            } else {
                ctx.fillText("Next", buttons[17].x + buttons[17].w / 2, buttons[17].y + buttons[17].h / 1.4);
            }
            ////
            buttons[6].x = canvas.width / 2 - buttons[6].w * (1 + btnMargin);
            buttons[6].y = canvas.height - bottomOffset;
            ctx.fillStyle = rectcolor;
            ctx.roundRect(buttons[6].x, buttons[6].y, buttons[6].w, buttons[6].h);

            ctx.font = fontSize + "px Comic Sans MS";
            ctx.fillStyle = textcolor;
            if (status == 2)
                ctx.fillText("Untag", buttons[6].x + buttons[6].w / 2, buttons[6].y + buttons[6].h / 1.4);
            else
                ctx.fillText("Tag", buttons[6].x + buttons[6].w / 2, buttons[6].y + buttons[6].h / 1.4);
            ////
            buttons[11].x = canvas.width / 2 + buttons[11].w * btnMargin;
            buttons[11].y = canvas.height - bottomOffset;
            ctx.fillStyle = rectcolor;
            ctx.roundRect(buttons[11].x, buttons[11].y, buttons[11].w, buttons[11].h);

            ctx.font = fontSize + "px Comic Sans MS";
            ctx.fillStyle = textcolor;
            if (status == 3) {
                ctx.font = (fontSize * 0.9) + "px Comic Sans MS";
                ctx.fillText("Undelete", buttons[11].x + buttons[11].w / 2, buttons[11].y + buttons[11].h / 1.4);
            } else
                ctx.fillText("Delete", buttons[11].x + buttons[11].w / 2, buttons[11].y + buttons[11].h / 1.4);
        }
    }

    // If autoplayer is on, then autoplay
    if (autoPlay != 0) {
        buttons[13].x = canvas.width / 2 - buttons[13].w * (1 + btnMargin);
        buttons[13].y = canvas.height - bottomOffset - buttons[13].h * 3;
        ctx.fillStyle = rectcolor;
        ctx.roundRect(buttons[13].x, buttons[13].y, buttons[13].w, buttons[13].h);

        ctx.font = fontSize + "px Comic Sans MS";
        ctx.fillStyle = textcolor;
        if (appaused)
            ctx.fillText("Play", buttons[13].x + buttons[13].w / 2, buttons[13].y + buttons[13].h / 1.4);
        else
            ctx.fillText("Pause", buttons[13].x + buttons[13].w / 2, buttons[13].y + buttons[13].h / 1.4);
    }

    if (autoPlay != 0 && !appaused && !cancelSpeaker) {
        if (swap == 0) {
            speaker.cancel();
            msg = new SpeechSynthesisUtterance(word);
            speaker.speak(msg);
        }
    }

    buttons[18].x = canvas.width - buttons[18].w * 1.2;
    buttons[18].y = buttons[18].h * 1.5;
    ctx.fillStyle = getRndColor(160, 250);
    ctx.roundRect(buttons[18].x, buttons[18].y, buttons[18].w, buttons[18].h);

    ctx.font = fontSize * 0.9 + "px Comic Sans MS";
    ctx.fillStyle = getRndColor(10, 100);
    ctx.fillText("Statistics", buttons[18].x + buttons[18].w / 2, buttons[18].y + buttons[18].h / 1.4);
    ////
    buttons[8].x = buttons[8].w * 0.2;
    buttons[8].y = buttons[8].h * 0.2;
    ctx.fillStyle = getRndColor(160, 250);
    ctx.roundRect(buttons[8].x, buttons[8].y, buttons[8].w, buttons[8].h);

    ctx.font = fontSize + "px Comic Sans MS";
    ctx.fillStyle = getRndColor(10, 100);
    ctx.fillText("Home", buttons[8].x + buttons[8].w / 2, buttons[8].y + buttons[8].h / 1.4);
    ////
    buttons[14].x = canvas.width - buttons[14].w * 1.2;
    buttons[14].y = buttons[14].h * 0.2;
    ctx.fillStyle = getRndColor(160, 250);
    ctx.roundRect(buttons[14].x, buttons[14].y, buttons[14].w, buttons[14].h);

    ctx.font = fontSize * 0.9 + "px Comic Sans MS";
    ctx.fillStyle = getRndColor(10, 100);
    ctx.fillText("Settings", buttons[14].x + buttons[14].w / 2, buttons[14].y + buttons[14].h / 1.4);

    lastpage = 1;
}

// Render word list using html table
function renderWordList() {
    btninit();
    // Get page width & height
    canvas.width = window.innerWidth - 25;
    canvas.height = window.innerHeight - 25;

    // Clear existing canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    $("#startfrom").hide();

    // Render buttons
    ctx.textAlign = "center";

    buttons[8].x = buttons[8].w * 0.2;
    buttons[8].y = buttons[8].h * 0.2;
    ctx.fillStyle = getRndColor(160, 250);
    ctx.roundRect(buttons[8].x, buttons[8].y, buttons[8].w, buttons[8].h);

    ctx.font = fontSize + "px Comic Sans MS";
    ctx.fillStyle = getRndColor(10, 100);
    ctx.fillText("Home", buttons[8].x + buttons[8].w / 2, buttons[8].y + buttons[8].h / 1.4);

    // Render table
    $('#wordList').DataTable().destroy();
    $('#wordList').DataTable({
        "pagingType": "full_numbers"
    });
    $("#wordList_wrapper").show();
    $("#wordList_wrapper").attr("style", "test-align:center;position:absolute;\
    left:" + (buttons[0].w * 0.5) + ";top:" + (buttons[8].x + buttons[8].h) + ";\
    height:" + (window.innerHeight - 25 * 0.6) + ";width:" + (window.innerWidth - 25 - buttons[0].w) + ";\
    font-size:" + fontSize * 0.6 + ";font-family:Comic Sans MS");
    $("#wordList").attr("style", "width:100%;font-size:" + fontSize * 0.6 + ";font-family:Comic Sans MS");

    // Add title
    ctx.fillText("Word List", canvas.width / 2, buttons[8].h * 0.2 + buttons[8].h / 1.4);
}

// Render current page
function renderCurrentPage() {
    btnresize();
    fontresize();
    sleep(50).then(() => {
        if (currentpage == 0) {
            renderHomePage();
        } else if (currentpage == 1) {
            renderWord();
        } else if (currentpage == 2) {
            renderSettings();
        } else if (currentpage == 3) {
            renderAddWord();
        } else if (currentpage == 4) {
            renderWordList();
        }
    })
}

// Update canvas when page resizes to prevent content floating out of the page
if (!isphone) {
    window.onresize = renderCurrentPage;
}


// Auto word player
apdelay = [99999, 8, 5, 3];

function autoPlayer() { // = auto next button presser + sound maker
    console.log("auto player running");

    moveType = 1 - random;

    // Get next word
    $.ajax({
        url: "/api/getNext",
        method: 'POST',
        async: true,
        dataType: "json",
        data: {
            wordId: wordId,
            splitLine: splitLine,
            status: showStatus,
            moveType: moveType,
            userId: localStorage.getItem("userId"),
            token: localStorage.getItem("token")
        },
        success: function (r) {
            word = r.word;
            translation = r.translation;
            status = r.status;
            wordId = r.wordId;
            displayingAnswer = 0;
            renderWord();
        },
        error: function (r, textStatus, errorThrown) {
            if (r.status == 401) {
                alert("Login session expired! Please login again!");
                localStorage.removeItem("userId");
                localStorage.removeItem("token");
                window.location.href = "/user";
            } else {
                word = r.status + " " + errorThrown;
                translation = "Maybe change the settings?\nOr check your connection?";
                renderWord(1, 1);
            }
        }
    });
}

function startfunc() {
    if (displayMode == 0) { // Practice mode
        // If autoplayer is on, then autoplay
        if ($("#startfrom").val() != "") {
            startword = $("#startfrom").val();
            // User decided a word to start from
            // Get its word id
            $.ajax({
                url: '/api/getWordId',
                method: 'POST',
                async: false,
                dataType: "json",
                data: {
                    word: startword,
                    userId: localStorage.getItem("userId"),
                    token: localStorage.getItem("token")
                },
                success: function (r) {
                    lastpage = currentpage;
                    currentpage = 1;
                    wordId = r.wordId;
                    started = 1;
                    btninit();
                    $("#startfrom").hide();
                    $("#startfrom").val("");

                    // Word exist and get info of the word
                    $.ajax({
                        url: '/api/getWord',
                        method: 'POST',
                        async: false,
                        dataType: "json",
                        data: {
                            splitLine: splitLine,
                            wordId: wordId,
                            userId: localStorage.getItem("userId"),
                            token: localStorage.getItem("token")
                        },
                        success: function (r) {
                            word = r.word;
                            translation = r.translation;
                            status = r.status;
                            wordId = r.wordId;
                            renderWord();
                        },
                        error: function (r) {
                            if (r.status == 401) {
                                alert("Login session expired! Please login again!");
                                localStorage.removeItem("userId");
                                localStorage.removeItem("token");
                                window.location.href = "/user";
                            }
                        }
                    });

                    if (apinterval == -1 && autoPlay != 0) {
                        apinterval = setInterval(autoPlayer, apdelay[autoPlay] * 1000);
                    }
                },

                // Word doesn't exist then start from default
                error: function (r) {
                    if (r.status == 404) {
                        $("#startfrom").val("Not found!");
                    } else if (r.status == 401) {
                        alert("Login session expired! Please login again!");
                        localStorage.removeItem("userId");
                        localStorage.removeItem("token");
                        window.location.href = "/user";
                    }
                }
            });
        } else {
            $.ajax({
                url: '/api/getNext',
                method: 'POST',
                async: false,
                dataType: "json",
                data: {
                    status: showStatus,
                    moveType: 0,
                    splitLine: splitLine,
                    userId: localStorage.getItem("userId"),
                    token: localStorage.getItem("token")
                },
                success: function (r) {
                    lastpage = currentpage;
                    currentpage = 1;
                    wordId = r.wordId;
                    started = 1;
                    btninit();
                    $("#startfrom").hide();
                    $("#startfrom").val("");

                    word = r.word;
                    translation = r.translation;
                    status = r.status;

                    renderWord();
                },
                error: function (r) {
                    if (r.status == 401) {
                        alert("Login session expired! Please login again!");
                        localStorage.removeItem("userId");
                        localStorage.removeItem("token");
                        window.location.href = "/user";
                    }
                }
            });
        }
    } else if (displayMode == 1) { // Challenge mode
        started = 1;
        lastpage = currentpage;
        currentpage = 1;
        $.ajax({
            url: '/api/getNextChallenge',
            method: 'POST',
            async: false,
            dataType: "json",
            data: {
                splitLine: splitLine,
                userId: localStorage.getItem("userId"),
                token: localStorage.getItem("token")
            },
            success: function (r) {
                $("#startfrom").hide();
                word = r.word;
                $("#startfrom").val(word);
                translation = r.translation;
                status = r.status;
                wordId = r.wordId;
                btninit();
                renderWord();
            },
            error: function (r) {
                if (r.status == 401) {
                    alert("Login session expired! Please login again!");
                    localStorage.removeItem("userId");
                    localStorage.removeItem("token");
                    window.location.href = "/user";
                }
            }
        });
    }
}

// Handle user click
function clickHandler(e) {
    // Get mouse position
    var relativeX = e.clientX - canvas.offsetLeft;
    var relativeY = e.clientY - canvas.offsetTop;
    var btntriggered = 0;
    for (var i = 0; i < btncnt; i++) {
        if (relativeX >= buttons[i].x && relativeX <= buttons[i].x + buttons[i].w && relativeY >= buttons[i].y &&
            relativeY <= buttons[i].y + buttons[i].h) {
            btntriggered = 1;
            // A button has been triggered
            console.log(buttons[i].name + " button triggered");
            // Start memorizing mode
            if (buttons[i].name == "start") {
                sleep(50).then(() => {
                    startfunc();
                })
            } else if (started && (buttons[i].name == "previous" || buttons[i].name == "next")) {
                // Go to previous / next word
                t = wordId;
                if (random) {
                    t = Math.floor(wordcount * Math.random());
                }

                moveType = 0;
                if (buttons[i].name == "previous") {
                    moveType = -1;
                } else if (buttons[i].name == "next") {
                    moveType = 1;
                }

                displayingAnswer = 0;

                $.ajax({
                    url: '/api/getNext',
                    method: 'POST',
                    async: true,
                    dataType: "json",
                    data: {
                        wordId: t,
                        status: showStatus,
                        moveType: moveType,
                        splitLine: splitLine,
                        userId: localStorage.getItem("userId"),
                        token: localStorage.getItem("token")
                    },
                    success: function (r) {
                        word = r.word;
                        translation = r.translation;
                        status = r.status;
                        wordId = r.wordId;
                        renderWord();
                    },
                    error: function (r, textStatus, errorThrown) {
                        if (r.status == 401) {
                            alert("Login session expired! Please login again!");
                            localStorage.removeItem("userId");
                            localStorage.removeItem("token");
                            window.location.href = "/user";
                        } else {
                            word = r.status + " " + errorThrown;
                            translation = "Maybe change the settings?\nOr check your connection?";
                            renderWord(1, 1);
                        }
                    }
                });
            } else if (started && (buttons[i].name == "tag" || buttons[i].name == "remove")) {
                // Update word status
                if (buttons[i].name == "tag") {
                    if (status == 2) status = 1;
                    else if (status == 1 || status == 3) status = 2;
                } else if (buttons[i].name == "remove") {
                    if (status == 3) status = 1;
                    else if (status == 1 || status == 2) status = 3;
                }
                $.ajax({
                    url: '/api/updateWordStatus',
                    method: 'POST',
                    async: true,
                    dataType: "json",
                    data: {
                        wordId: wordId,
                        status: status,
                        userId: localStorage.getItem("userId"),
                        token: localStorage.getItem("token")
                    },
                    success: function (r) {
                        ctx.fillStyle = rectcolor;
                        ctx.roundRect(buttons[6].x, buttons[6].y, buttons[6].w, buttons[6].h);
                        ctx.font = fontSize + "px Comic Sans MS";
                        ctx.fillStyle = textcolor;
                        if (status == 2)
                            ctx.fillText("Untag", buttons[6].x + buttons[6].w / 2, buttons[6].y +
                                buttons[6].h / 1.4);
                        else
                            ctx.fillText("Tag", buttons[6].x + buttons[6].w / 2, buttons[6].y + buttons[
                                6].h / 1.4);

                        ctx.fillStyle = rectcolor;
                        ctx.roundRect(buttons[11].x, buttons[11].y, buttons[11].w, buttons[11].h);
                        ctx.font = fontSize + "px Comic Sans MS";
                        ctx.fillStyle = textcolor;
                        if (status == 3) {
                            ctx.font = (fontSize * 0.9) + "px Comic Sans MS";
                            ctx.fillText("Undelete", buttons[11].x + buttons[11].w / 2, buttons[11].y +
                                buttons[11].h / 1.4);
                        } else
                            ctx.fillText("Delete", buttons[11].x + buttons[11].w / 2, buttons[11].y +
                                buttons[11].h / 1.4);
                    },
                    error: function (r) {
                        if (r.status == 401) {
                            alert("Login session expired! Please login again!");
                            localStorage.removeItem("userId");
                            localStorage.removeItem("token");
                            window.location.href = "/user";
                        }
                    }
                });
            } else if (started && buttons[i].name == "sound" && !speaker.speaking) {
                msg = new SpeechSynthesisUtterance(word);
                speaker.speak(msg);
            } else if (buttons[i].name == "challengeyes") {
                if (challengeStatus == 0) {
                    challengeStatus = 1;
                    renderWord();
                } else if (challengeStatus == 1) {
                    $.ajax({
                        url: '/api/updateChallengeRecord',
                        method: 'POST',
                        async: true,
                        dataType: "json",
                        data: {
                            wordId: wordId,
                            memorized: 1,
                            getNext: 1,
                            splitLine: splitLine,
                            userId: localStorage.getItem("userId"),
                            token: localStorage.getItem("token")
                        },
                        success: function (r) {
                            challengeStatus = 0;
                            word = r.word;
                            translation = r.translation;
                            status = r.status;
                            wordId = r.wordId;
                            renderWord();
                        },
                        error: function (r) {
                            if (r.status == 401) {
                                alert("Login session expired! Please login again!");
                                localStorage.removeItem("userId");
                                localStorage.removeItem("token");
                                window.location.href = "/user";
                            }
                        }
                    });
                }
            } else if (buttons[i].name == "challengeno") {
                if (challengeStatus == 0 || challengeStatus == 1) {
                    challengeStatus = 3;
                    $.ajax({
                        url: '/api/updateChallengeRecord',
                        method: 'POST',
                        async: true,
                        dataType: "json",
                        data: {
                            wordId: wordId,
                            memorized: 0,
                            getNext: 0,
                            userId: localStorage.getItem("userId"),
                            token: localStorage.getItem("token")
                        },
                    });
                    renderWord();
                } else if (challengeStatus == 3) {
                    $.ajax({
                        url: '/api/getNextChallenge',
                        method: 'POST',
                        async: true,
                        dataType: "json",
                        data: {
                            splitLine: splitLine,
                            userId: localStorage.getItem("userId"),
                            token: localStorage.getItem("token")
                        },
                        success: function (r) {
                            challengeStatus = 0;
                            word = r.word;
                            translation = r.translation;
                            status = r.status;
                            wordId = r.wordId;
                            renderWord();
                        },
                        error: function (r) {
                            if (r.status == 401) {
                                alert("Login session expired! Please login again!");
                                localStorage.removeItem("userId");
                                localStorage.removeItem("token");
                                window.location.href = "/user";
                            }
                        }
                    });
                }
            } else if (buttons[i].name == "homepage") {
                lastpage = currentpage;
                currentpage = 0;
                started = 0;
                appaused = 0;
                clearInterval(apinterval);
                apinterval = -1;
                speaker.cancel();
                sleep(50).then(() => {
                    renderCurrentPage();
                })
            } else if (buttons[i].name == "settings") {
                lastpage = currentpage;
                currentpage = 2;
                started = 0;
                appaused = 0;
                clearInterval(apinterval);
                apinterval = -1;
                speaker.cancel();
                sleep(50).then(() => {
                    renderCurrentPage();
                })
            } else if (buttons[i].name == "list") {
                lastpage = currentpage;
                currentpage = 4;
                started = 0;
                appaused = 0;
                clearInterval(apinterval);
                apinterval = -1;
                speaker.cancel();
                sleep(50).then(() => {
                    renderCurrentPage();
                })
            } else if (buttons[i].name == "account") {
                window.location.href = "/user";
            } else if (buttons[i].name == "addword") {
                if (currentpage == 3) {
                    ctx.font = fontSize + "px Comic Sans MS";
                    ctx.textAlign = "center";

                    word = $("#addword_word").val();
                    translation = $("#addword_translation").val();
                    if (word == "" || translation == "") {
                        ctx.fillStyle = "white";
                        ctx.roundRect(0, buttons[19].y - buttons[19].h * 2.5, canvas.width, buttons[19].h * 1.5 + 5);
                        ctx.fillStyle = "red";
                        ctx.fillText("Both fields must be filled!", canvas.width / 2, buttons[19].y - buttons[19].h * 1.5);
                        return;
                    }

                    ctx.fillStyle = "white";
                    ctx.roundRect(0, buttons[19].y - buttons[19].h * 2.5, canvas.width, buttons[19].h * 1.5 + 5);
                    ctx.fillStyle = "blue";
                    ctx.fillText("Submitting...", canvas.width / 2, buttons[19].y - buttons[19].h * 1.5);

                    $.ajax({
                        url: '/api/addWord',
                        method: 'POST',
                        async: true,
                        dataType: "json",
                        data: {
                            word: word,
                            translation: translation,
                            userId: localStorage.getItem("userId"),
                            token: localStorage.getItem("token")
                        },
                        success: function (r) {
                            ctx.fillStyle = "white";
                            ctx.roundRect(0, buttons[19].y - buttons[19].h * 2.5, canvas.width, buttons[19].h * 1.5 + 5);
                            if (r.duplicate == true) {
                                ctx.fillStyle = "red";
                                ctx.fillText("Word duplicated! Add again to ignore.", canvas.width / 2, buttons[19].y - buttons[19].h * 1.5);
                            } else {
                                ctx.fillStyle = "green";
                                ctx.fillText("Word added!", canvas.width / 2, buttons[19].y - buttons[19].h * 1.5);
                            }
                        },
                        error: function (r) {
                            if (r.status == 401) {
                                alert("Login session expired! Please login again!");
                                localStorage.removeItem("userId");
                                localStorage.removeItem("token");
                                window.location.href = "/user";
                            }
                        }
                    });
                } else if (currentpage == 2) {
                    lastpage = currentpage;
                    currentpage = 3;
                    $("#addword_word").val("");
                    $("#addword_translation").val("");
                    renderCurrentPage();
                }
            } else if (buttons[i].name == "cleardeleted") {
                if (confirm('Are you sure to delete all the words that are marked as "Deleted" permanently? This operation cannot be undone!')) {
                    $.ajax({
                        url: '/api/clearDeleted',
                        method: 'POST',
                        async: true,
                        dataType: "json",
                        data: {
                            userId: localStorage.getItem("userId"),
                            token: localStorage.getItem("token")
                        },
                        success: function (r) {
                            alert("Done");
                        },
                        error: function (r) {
                            if (r.status == 401) {
                                alert("Login session expired! Please login again!");
                                localStorage.removeItem("userId");
                                localStorage.removeItem("token");
                                window.location.href = "/user";
                            }
                        }
                    });
                } else {
                    alert("Canceled");
                }
            } else if (buttons[i].name == "statistics") {
                statson = 1;
                statistics = "[Failed to fetch statistics]"
                $.ajax({
                    url: '/api/getWordStat',
                    method: 'POST',
                    async: true,
                    dataType: "json",
                    data: {
                        wordId: wordId,
                        userId: localStorage.getItem("userId"),
                        token: localStorage.getItem("token")
                    },
                    success: function (r) {
                        statistics = r.msg;
                        ctx.fillStyle = getRndColor(10, 100);
                        ctx.roundRect(buttons[6].x - 5, canvas.height / 2 - 240 - 5, buttons[11].x - buttons[6].x + buttons[11].w + 10, canvas.height - bottomOffset - (canvas.height / 2 - 220) + 50);
                        ctx.fillStyle = getRndColor(160, 250);
                        ctx.roundRect(buttons[6].x, canvas.height / 2 - 240, buttons[11].x - buttons[6].x + buttons[11].w, canvas.height - bottomOffset - (canvas.height / 2 - 220) + 40);
                        ctx.font = smallfontSize + "px Comic Sans MS";
                        ctx.fillStyle = getRndColor(10, 100);
                        ctx.textAlign = "center";
                        var lines = statistics.split('\n');
                        var lineheight = smallfontSize + 5;
                        for (var i = 0; i < lines.length; i++)
                            ctx.fillText(lines[i], canvas.width / 2, canvas.height / 2 - 220 + (i * lineheight));
                    },
                    error: function (r) {
                        if (r.status == 401) {
                            alert("Login session expired! Please login again!");
                            localStorage.removeItem("userId");
                            localStorage.removeItem("token");
                            window.location.href = "/user";
                        }
                    }
                });
            } else if (buttons[i].name == "mode1") {
                random = 1 - random;
                localStorage.setItem("random", random);
                renderCurrentPage();
            } else if (buttons[i].name == "mode2") {
                swap = 1 - swap;
                localStorage.setItem("swap", swap);
                renderCurrentPage();
            } else if (buttons[i].name == "mode3") {
                showStatus += 1;
                if (showStatus == 4) showStatus = 1;
                localStorage.setItem("showStatus", showStatus);
                renderCurrentPage();
            } else if (buttons[i].name == "mode4") {
                autoPlay += 1;
                if (autoPlay == 4) autoPlay = 0;
                localStorage.setItem("autoPlay", autoPlay);
                renderCurrentPage();
            } else if (buttons[i].name == "mode0") {
                displayMode = 1 - displayMode;
                localStorage.setItem("displayMode", displayMode);
                renderCurrentPage();
            } else if (buttons[i].name == "pauseap") {
                if (appaused && apinterval == -1) apinterval = setInterval(autoPlayer, apdelay[autoPlay] * 1000);
                else {
                    clearInterval(apinterval);
                    apinterval = -1;
                }
                appaused = 1 - appaused;
                renderWord();
            } else if (buttons[i].name == "import") {
                window.location.href = "/importData";
            } else if (buttons[i].name == "export") {
                window.location.href = "/exportData";
            }
        }
    }

    if (!btntriggered && started) {
        if (statson == 0) {
            displayingAnswer = 1 - displayingAnswer;
        } else statson = 0;
        if (displayMode == 0)
            renderWord(displayingAnswer);
    }
}

$("#startfrom").on('keypress', function (e) {
    if (e.which == 13) {
        startfunc();
    }
});

document.addEventListener("click", clickHandler, false);

renderHomePage();