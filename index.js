var express  = require('express')
var app = express();
var http = require('http').Server(app);
var go = require('sync-request');
var bodyParser = require('body-parser');
var multer = require('multer'); // v1.0.5
var upload = multer(); // for parsing multipart/form-data

app.use(express.static('public'));

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

var users = {};
var messages = [];
var mentions = {};

function getGiphyImage(search){
	var http = go('GET','http://api.giphy.com/v1/gifs/search?q='+search+'&api_key=dc6zaTOxFJmzC').getBody('utf8');
	var response = JSON.parse(http).data[0].images.original.url;
	return response;
}

app.post('/api', function (req, res) {

	var userMentions = [];

	if( mentions[req.body.username] && mentions[req.body.username].length > 0 ){
		userMentions = mentions[req.body.username];
		mentions[req.body.username] = [];
	}

  res.send({
		users,
		messages,
		mentions: userMentions
	});
});

app.post('/send', function (req, res) {

	if( req.body.username == '' ){
		return;
	}

	var message = { id: messages.length, user: req.body.username, msg: req.body.message };

	if( !users[message.user] ){
		users[message.user] = {
			status: 'online'
		};
		mentions[message.user] = [];
	}

	users[message.user].lastSeen = new Date;


	if( message.msg.startsWith('/') ){
		var args = message.msg.split(' ');
		if( args[0] == '/giphy' ){
			args[0] = '';
			message.msg = '';
			message.image = getGiphyImage(args.join('+'));
		}
	}

	if( message.msg.split('@').length > 1 ){
		var re = /@([^\s]*)/g;
		var m;

		while ((m = re.exec(message.msg)) !== null) {
		    if (m.index === re.lastIndex) {
		        re.lastIndex++;
		    }
				if( mentions[m[1]] ){
					mentions[m[1]].push(message);
				}
		}
	}

	messages.push(message);

	res.send('OK');

});

http.listen(3000, function(){
	console.log('Listening on *:3000');
});
