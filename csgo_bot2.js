var Steam = require("steam"),
    util = require("util"),
    fs = require("fs"),
    csgo = require("../node-csgo-master/index"),
    bot = new Steam.SteamClient(),
    steamUser = new Steam.SteamUser(bot),
    steamFriends = new Steam.SteamFriends(bot),
    steamGC = new Steam.SteamGameCoordinator(bot, 730);
    CSGOCli = new csgo.CSGOClient(steamUser, steamGC, false),
    readlineSync = require("readline-sync"),
    crypto = require("crypto");
var PythonShell = require("python-shell");
var mail = require("./node-gmail-api-master/lib/send_mail.js");

var urls = {};
function getUrl(callback){
    var pyshell = new PythonShell('urls.py');
    pyshell.on('message', function(message) {
        parse_line = message.split("),");
        parse_line.forEach(function(line){
            parse_val = line.split(",");
            item_name = parse_val[0].slice(3, parse_val[0].indexOf("\\"));
            url = parse_val[1].slice(2, -1);
            if (isNaN(url.slice(-2))){
                url = url.slice(0, -2);
            };
            urls[item_name] = url;
        });
        callback();
    });
};

var toFloat = function(unsign) {
    buf = new Buffer(4);
    buf.writeUInt32LE(+unsign, 0);
    return buf.readFloatLE(0).toString();
};

var onSteamLogOn = function onSteamLogOn(response, callback){
    if (response.eresult == Steam.EResult.OK) {
        util.log('Logged in!');
    } else {
        util.log('error, ', response);
        console.log(Steam.EResult);
        process.exit();
    };

    steamFriends.setPersonaState(Steam.EPersonaState.Offline);
    util.log("Logged on.");
    util.log("Current SteamID64: " + bot.steamID);
    util.log("Account ID: " + CSGOCli.ToAccountID(bot.steamID));

    CSGOCli.launch();
};

var authCode = readlineSync.question('Mobile AuthCode: ');
var logOnDetails = {
    "account_name": "",
    "password": "",
};

if (authCode !== "" && authCode != "x") {
    logOnDetails.two_factor_code = authCode;
}
// if (authCode == "x") { } else {
//     var mailAuth = readlineSync.question('Email AuthCode: ')
//     logOnDetails.auth_code = mailAuth;
// };

var track = {};
var item_names = null;
var currentname = 0;
var respcnt = 0;
var totalresp = 0;
bot.connect();
bot.on("logOnResponse", onSteamLogOn);
bot.on('connected', function(){
    steamUser.logOn(logOnDetails);
});


CSGOCli.on("ready", function(){
    getUrl(function(){
        item_names = Object.getOwnPropertyNames(urls);
        currentname = 0;
        CSGOCli.emit("crawlMarket");
    });
});

CSGOCli.on("crawlMarket", function(){
    console.log("[", currentname + 1, "/", item_names.length, "] crawling steam market for", item_names[currentname]);
    respcnt = 0;
    totalresp = 0;
    var options = {
        args: [item_names[currentname]]
    };
    PythonShell.run("steam_market.py", options, function(err, message){
        time = new Date().getTime();
        while (true){
            new_time = new Date().getTime();
            if (new_time - time > 1100){
                break;
            };
        };
        try {
            if (message[0] == "None"){
                track[item_names[currentname]] = {};
                track[item_names[currentname]]["count"] = 0;
    //             console.log("sending", track[item_names[currentname]]["count"], "of", item_names[currentname]);
                if (currentname + 1 == item_names.length){
                    CSGOCli.emit("allSent");
                    return;
                } else {
                    currentname += 1
                    CSGOCli.emit("crawlMarket");
                    return;
                };
            };
        } catch(err) {
            time = new Date().getTime();
            while (true){
                new_time = new Date().getTime();
                if (new_time - time > 10000){
                    break;
                };
            };
            CSGOCli.emit("crawlMarket");
            return;
        };

        parse_line = message[0].split("),");
        parse_line.forEach(function(line){
            parse_val = line.split(",");
            item_name = parse_val[0].slice(3, parse_val[0].indexOf("\\"));
            track[item_name] = {};
            track[item_name]["count"] = 0;
        });
        parse_line.forEach(function(line){
            parse_val = line.split(",");
            listing = String(parse_val[1].slice(1));
            item_name = parse_val[0].slice(3, parse_val[0].indexOf("\\"));
            best_float = parse_val[2].slice(2, parse_val[2].indexOf("\\"));
            listingid = parse_val[3].slice(2, parse_val[3].indexOf("\\"));
            assetid = parse_val[4].slice(2, parse_val[4].indexOf("\\"));
            rungameid = parse_val[5].slice(2, parse_val[5].indexOf("\\"));

            if (isNaN(rungameid.slice(-2))){
                rungameid = rungameid.slice(0, -2);
            };

            track[item_name]["count"] += 1;
            track[item_name]["floats"] = [];
            track[item_name]["best_float"] = best_float;
            track[item_name][listing] = {};
            track[item_name][listing]["param_m"] = listingid;
            track[item_name][listing]["param_a"] = assetid;
            track[item_name][listing]["param_d"] = rungameid;
        });
        console.log("sending", track[item_names[currentname]]["count"], "of", item_names[currentname]);
        CSGOCli.emit("sendNext", respcnt);
        return;
    });
});

CSGOCli.on("sendNext", function(count){
    var count_s = String(count);
    try {
        param = {
            param_s: "0",
            param_m: track[item_names[currentname]][count_s]["param_m"],
            param_a: track[item_names[currentname]][count_s]["param_a"],
            param_d: track[item_names[currentname]][count_s]["param_d"],
        };
        respcnt = count;
        CSGOCli.getFloat(param);
    } catch(err) {
        if (count == 9){
            currentname += 1;
            CSGOCli.emit("crawlMarket");
            return;
        } else {
            count += 1
            CSGOCli.emit("sendNext", count);
            return;
        };
    };
});

CSGOCli.on("floatResponse", function(floatData){
    totalresp += 1;
    var float = toFloat(floatData.iteminfo.paintwear);

    track[item_names[currentname]][respcnt]["float"] = float;
    track[item_names[currentname]]["floats"].push(float);
    var itemurl = urls[item_names[currentname]] + "#buylisting|" + track[item_name][respcnt]["param_m"] +
                    "|730|2|" + track[item_name][respcnt]["param_a"];
    if (float - Number(track[item_names[currentname]]["best_float"]) <= 0.01){
        console.log("******************************************");
//         console.log(itemurl);

        var temp_currentname = currentname;
        mail.getOAuth2Client(function(err, oauth2Client) {
            if (err) {
                console.log('email auth err:', err);
            } else {
                var mailheader = "csgobot_updates: " + item_names[temp_currentname] + " " + float;
                mail.sendSampleMail(oauth2Client, mailheader, itemurl, function(err, results) {
                    if (err) {console.log('email send err:', err)};
                });
            }
        });
    };

//     respcnt += 1;
    if (respcnt >= 9){
        console.log(respcnt + 1, "--", float);
    } else {
        console.log(respcnt + 1, "---", float);
    };

    if (float - Number(track[item_names[currentname]]["best_float"]) <= 0.01){ console.log("******************************************") };

    var time = new Date().getTime();
    while (totalresp < track[item_names[currentname]]["count"]){
        var new_time = new Date().getTime();
        if (new_time - time > Math.floor(Math.random()*51) + 901){
            CSGOCli.emit("sendNext", respcnt + 1, currentname);
            break;
        };
    };

//     console.log(totalresp, totalresp === track[item_names[currentname]]["count"]);
    if (totalresp === track[item_names[currentname]]["count"]){
        if (currentname === item_names.length-1){
            CSGOCli.emit("allSent");
            return;
        };
        totalresp = 0;
        var time = new Date().getTime();
        while (true){
            var new_time = new Date().getTime();
            if (new_time - time > Math.floor(Math.random()*51) + 901){
                currentname += 1;
                CSGOCli.emit("crawlMarket");
                break;
            };
        };
    };
});

CSGOCli.on("allSent", function(){
    var time = new Date();
    var e_text = "";
    item_names.forEach(function(name){
        if (track[name]["count"] > 0){
            for (var i = 0; i < 10; i++){
                try {
                    var f = track[name][String(i)]["float"];
                    var a = track[name][String(i)]["param_a"];
                } catch(err) {
                    continue;
                };
                var num = i + 1;
                fs.appendFile("steamdb.log", a + "\t" + f + "\t" + num + "\n");
            };
        };
    });

    CSGOCli.exit();

    var dbupdate = new PythonShell('steam_db.py');
    dbupdate.on('message', function(message) {
        console.log(message);
    });

    if (process.argv[2] > 0){
        var min_delay = Number(process.argv[2]);
    } else {
        var min_delay = 3;
    };

    var timeout = min_delay;
    time.setMinutes(time.getMinutes() + timeout);
    console.log("trying again in", timeout, "minutes ---", time.toLocaleString());
    setTimeout(function(){
        CSGOCli.launch();
    }, timeout*60000);
});
