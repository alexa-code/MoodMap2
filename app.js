var express = require('express')
 , twitter = require('twitter')
 , app = express()
 , http = require('http')
 , server = http.createServer(app)
 , util = require('util')
 , io = require('socket.io').listen(server)
 , analyze = require('Sentimental').analyze;

server.listen(process.env.PORT || 8080);

app.use(express.static(__dirname + '/public'));

var twit = new twitter({ 
	consumer_key : 'uckEwH7JW2hmn8HUy832c2lL6',
	consumer_secret : '0VY37XlTPhaIiLqxW9LEigWlEf1htQw1IZabjnq9opge9T4RAf',
	access_token_key : '833597569-OSncEQxKCqSEX7zSkQGyEfGLFKowdCMXc7PVDL3R',
	access_token_secret : '9iXc0mn58yKUS5Q2OBN9yMwtyiHWc7g9YBKTIfWaqh5I6'
}),
s = null;

io.configure(function() {
	io.set("transports", ["xhr-polling"]);
	io.set("polling duration", 10);
});

io.sockets.on('connection', function (socket) {
	socket.on("start tweets", function() {
		if (s == null) {
			twit.stream('statuses/filter', { 'locations':'-124.9, 24.4, -66.9, 49.4' }, function(stream) {
				s = stream;
				stream.on('data', function(data) {
					var polarity = analyze(data.text).score;
					// Adding to the sentimental analysis
					if (data.coordinates && polarity !== 0 && !((data.text).match(/@|http/g))) {
						if ((data.text).match(/:\/|stupid|ughh/g)) {
							polarity = -4;
						}
						if ((data.text).match(/sad|hate|sick|tired|no good|stfu|irritat|annoy|hurt|giving up|i hate|:\(/g)) {
							polarity = -5;
						} 
						if ((data.text).match(/:\)|love|yay|:D|\(:/g)) {
							polarity = 5;
						}
						var tweet = { "text" : data.text, "location" : data.coordinates.coordinates,
							"polarity" : polarity};
						socket.broadcast.emit('twitter-stream', tweet);
						socket.emit('twitter-stream', tweet);
					}
				});
				stream.on('error', function(error, code) {
					console.log("Error: " + error + ", Code: " + code);
				});
			});
		}
	});
	socket.emit('connected');
});