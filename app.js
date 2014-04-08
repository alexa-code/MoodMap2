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
	consumer_key : process.env.consumer_key,
	consumer_secret : process.env.consumer_secret,
	access_token_key : process.env.access_token_key,
	access_token_secret : process.env.access_token_secret
}),
s = null;

io.sockets.on('connection', function (socket) {
	socket.on("start tweets", function() {
		if (s == null) {
			twit.stream('statuses/filter', { 'locations':'-124.9, 24.4, -66.9, 49.4' }, function(stream) {
				s = stream;
				stream.on('data', function(data) {
					var polarity = analyze(data.text).score;
					// Adding to the sentimental analysis
					if (data.coordinates && polarity !== 0 && !((data.text).match(/@|http/g))) {
						if ((data.text).match(/sad|hate|sick|tired|no good|stfu|irritat|annoy|hurt|giving up|i hate|:\(/g)) {
							polarity = -5;
						} 
						if ((data.text).match(/:\//g)) {
							polarity = -4;
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