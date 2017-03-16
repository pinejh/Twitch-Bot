var tmi = require("tmi.js");
var jsonfile = require("jsonfile");
var pointsfile = "./points.json";
var points = [];

var options = {
  options: {
    debug: true
  },
  connection: {
    cluster: "aws",
    reconnect: true
  },
  identity: {
    username: "CodingBot",
    password: "oauth:nnp1p3aq1eeiy04haoc3yq937hyu86"
  },
  channels: ["jcodedev"]
};

var client = new tmi.client(options);
client.connect();

client.on('connecting', function(address, port) {
  jsonfile.readFile(pointsfile, function(err, obj) {
    console.log(obj);
    points = obj;
  });
  for(player of points) {
    player.isHere = false;
  }
});

client.on('connected', function(address, port) {
  console.log("Address: " + address + ":" + port);

  client.on("join", function (channel, username, self) {
    console.log(username + " connected.");
    if (self) return;
    for(player of points) {
      if(player.name == username) return;
    }
    console.log('got this far...');
    points.push({name:username, points: 1, isHere: true});
    console.log(points);
  });

  client.on("part", function (channel, username, self) {
    for(player of points) {
      if(player.name == username) {
        player.isHere = false;
      }
    }
  });

  client.on("chat", function(channel, userstate, message, self) {
    if(message.substring(0, 1) == "!") {
      command(channel, userstate, message);
    }
  });

});

client.on("disconnected", function(reason) {
  for(player of points) {
    player.isHere = false;
  }
  savePoints(false);
  console.log("disconnected");
});

function command(channel, userstate, message) {
  if(message == "!points") {
    var pts = -1;
    for(player of points) {
      if(player.name == userstate["display-name"]) {
        pts = player.points;
      }
    }
    if(pts != -1) {
      client.say(channel, userstate["display-name"]+" has "+pts+" points.");
    } else {
      client.say(channel, userstate["display-name"]+" has no tracked points. Please refresh page to make sure you receive points in the future.");
    }
  } else if (message == "!shutdown" && userstate["display-name"] == "jcodedev") {
    client.disconnect();
  } else {
    client.say(channel, "Command unrecognized... Probably just isn't implemented yet.");
  }
}

function savePoints(log) {
  jsonfile.writeFile(pointsfile, points, function (err) {
    if(log) console.error(err)
  });
}

function awardPoints() {
  console.log("points given");
  for(player of points) {
    if(player.isHere) player.points++;
  }
  savePoints(false);
}

setInterval(awardPoints, 60 * 1000 / 2);
