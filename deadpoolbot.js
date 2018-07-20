const Discord = require("discord.js");
const client = new Discord.Client();

function template(strings, ...keys) {
  return (function(...values) {
    var dict = values[values.length - 1] || {};
    var result = [strings[0]];
    keys.forEach(function(key, i) {
      var value = Number.isInteger(key) ? values[key] : dict[key];
      result.push(value, strings[i + 1]);
    });
    return result.join('');
  });
}

var dpTemplate = template`ST1:\n1) ${0}\n2) ${1}\n3) ${2}\n4) ${3}\n5) ${4}\n6) ${5}\n7) ${6}\n8) ${7}\n\nST2:\n1) ${8}\n2) ${9}\n3) ${10}\n4) ${11}\n5) ${12}\n6) ${13}\n7) ${14}\n8) ${15}\n\nST3:\n1) ${16}\n2) ${17}\n3) ${18}\n4) ${19}\n5) ${20}\n6) ${21}\n7) ${22}\n8) ${23}`

var primeDpRaidArr = null;
var primeDpRaidMsg = null;
var centDpRaidArr = null;
var centDpRaidMsg = null;

function setDpRaidMsg(channel, message) {
  if (channel.name.includes('prime')) {
    primeDpRaidMsg = message;
  } else if (channel.name.includes('centurion')) {
    centDpRaidMsg = message;
  } else {
    console.error("Unknown team! Message obj not set");
  }
}

function getDpRaidMsg(channel) {
  if (channel.name.includes('prime')) {
    return primeDpRaidMsg;
  } else if (channel.name.includes('centurion')) {
    return centDpRaidMsg;
  } else {
    console.error("Unknown team!");
    return null;
  }
}

function initDpRaidArray(channel) {
  if (channel.name.includes('prime')) {
    primeDpRaidArr = Array(24);
  } else if (channel.name.includes('centurion')) {
    centDpRaidArr = Array(24);
  } else {
    console.error("Unknown team! Array not initialized");
  }
}

function getDpRaidArr(channel) {
  if (channel.name.includes('prime')) {
    return primeDpRaidArr;
  } else if (channel.name.includes('centurion')) {
    return centDpRaidArr;
  } else {
    console.error("Unknown team!");
    return null;
  }
}

function sendDpRaidArray(channel) {
  var dpRaidArr = getDpRaidArr(channel);
  var msg = dpTemplate.apply(null, dpRaidArr);
  channel.send(msg)
      .then(function(result) {
          console.log("Got the result back " + result.content);
          setDpRaidMsg(channel, result);
       });
}

function editDpRaidMsg(channel) {
  var dpRaidArr = getDpRaidArr(channel);
  var msg = dpTemplate.apply(null, dpRaidArr);
  getDpRaidMsg(channel).edit(msg);
}

function getSlotOffset(message) {
  var off = 0;
  if (message.channel.name.includes('prime')) {
    if (message.member.roles.has(primeSt1Role.id)) {
      off = -1;
    } else if (message.member.roles.has(primeSt2Role.id)) {
      off = 7;
    } else if (message.member.roles.has(primeSt3Role.id)) {
      off = 15;
    } else {
      message.channel.send(message.author+" Do you have the right role?");
    }
  } else if (message.channel.name.includes('centurion')) {
    if (message.member.roles.has(centurionSt1Role.id)) {
      off = -1;
    } else if (message.member.roles.has(centurionSt2Role.id)) {
      off = 7;
    } else if (message.member.roles.has(centurionSt3Role.id)) {
      off = 15;
    } else {
      message.channel.send(message.author+" Do you have the right role?");
    } 
  } else {
    console.error("Unknown team! Offset not set");
  }
  return off;
}

var novaCaptainRole = null;
var primeRole = null;
var primeSt1Role = null;
var primeSt2Role = null;
var primeSt3Role = null;
var centurionRole = null;
var centurionSt1Role = null;
var centurionSt2Role = null;
var centurionSt3Role = null;
function populateRoles() {
  var guild = client.guilds.find("name", "DeadpoolBotTest");
  novaCaptainRole = guild.roles.find("name", "Nova Captain");
  primeRole = guild.roles.find("name", "PRIME");
  primeSt1Role = guild.roles.find("name", "Prime: ST #1");
  primeSt2Role = guild.roles.find("name", "Prime: ST #2");
  primeSt3Role = guild.roles.find("name", "Prime: ST #3");
  centurionRole = guild.roles.find("name", "CENTURION");
  centurionSt1Role = guild.roles.find("name", "Centurion: ST #1");
  centurionSt2Role = guild.roles.find("name", "Centurion: ST #2");
  centurionSt3Role = guild.roles.find("name", "Centurion: ST #3");
}

client.on("ready", () => {
  populateRoles();
  console.log("Init complete!");
});

function handle_start_dp_raid(message) {
  if (message.channel.name.includes("deadpool")) {
    if (message.member.roles.has(novaCaptainRole.id)) {
      initDpRaidArray(message.channel);
      sendDpRaidArray(message.channel);
    } else {
      message.channel.send(message.author+" You don't have permission to start a raid!");
    }
  } else {
    message.channel.send(message.author+" Yo, I only start deadpool raids in deadpool rooms!")
  }
  message.delete();
}

function handle_end_dp_raid(message) {
  if (getDpRaidMsg(message.channel) != null) {
    if (message.member.roles.has(novaCaptainRole.id)) {
      console.log("Trying to end the raid...");
      getDpRaidMsg(message.channel).delete();
    }
    message.delete();
  }
}

function handle_modify_dp_lane(message, add) {
  if (getDpRaidMsg(message.channel) != null) {
    var slot = parseInt(message.content.split(' ')[1], 10);
    var slotOffset = getSlotOffset(message);
    if (slot < 1 || slot > 8) {
      message.channel.send(message.author+" Hey, dummy, you picked an invalid lane number!");
    } else if (slotOffset == 0) {
      console.error("Invalid offset, message already sent to user");
    } else {
      var dpRaidArr = getDpRaidArr(message.channel);
      if (add && dpRaidArr[slot+slotOffset] == null && dpRaidArr.indexOf(message.author) == -1) {
        console.log("Editing slot " + slot);
        dpRaidArr[slot+slotOffset] = message.author;
        editDpRaidMsg(message.channel);
      } else if (!add && dpRaidArr[slot+slotOffset] === message.author) {
        console.log("Releasing slot " + slot);
        dpRaidArr[slot+slotOffset] = null;
        editDpRaidMsg(message.channel);
      }
      message.delete();
    }
  }
}

function handle_modify_dp_lane_override(message) {
  if (getDpRaidMsg(message.channel) != null) {
    if (message.member.roles.has(novaCaptainRole.id)) {
      var args = message.content.split(' ');
      var slot = parseInt(args[2], 10) + 8 * (parseInt(args[1], 10) - 1) - 1;
      
      if (slot < 0 || slot > 23) {
        message.channel.send(message.author+" Did you have a correct st/lane combination? (command: .override [strike team] [lane] [member])")
      } else {
        console.log("Editing slot " + slot);
        var dpRaidArr = getDpRaidArr(message.channel);
        dpRaidArr[slot] = args[3];
        editDpRaidMsg(message.channel);
        message.delete();
      }
    } else {
      message.channel.send(message.author+" You don't have permission to override an assignment!");
    }
  }
}

client.on("message", (message) => {
  if (message.content.startsWith(".")) {
    console.log("Message received from "+message.author.username+" "+message.content);
  }
  if (message.content.startsWith(".start_dp_raid")) {
    handle_start_dp_raid(message);
  }
  else if (message.content.startsWith(".claim")) {
    handle_modify_dp_lane(message, true);
  }
  else if (message.content.startsWith(".release")) {
    handle_modify_dp_lane(message, false);
  }
  else if (message.content.startsWith(".override")) {
    handle_modify_dp_lane_override(message);
  }
  else if (message.content.startsWith(".end_raid")) {
    handle_end_dp_raid(message);
  }
});

var fs = require('fs'),
    path = require('path'),
    filePath = path.join('/etc/deadpoolbot', 'secret.txt');
var secret = "";

fs.readFile(filePath, {encoding: 'utf-8'}, function(err,data){
    if (!err) {
        console.log('received data: ' + data);
        secret = data;
    } else {
        console.log(err);
    }
});

client.login(secret);
