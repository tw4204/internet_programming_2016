var express = require('express');
var app = express();
var http = require('http').Server(app);
var request = require('request');
var io = require('socket.io')(http);
const fs = require('fs');
const saintLogin = require('./saint.js');
var bodyParser = require('body-parser');
var jsonParser = bodyParser.json();
var urlencodedParser = bodyParser.urlencoded({ extended: false });
var userid = "";var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');
var SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE) + '/.credentials/';
var TOKEN_PATH = TOKEN_DIR + 'calendar-nodejs-quickstart.json';

app.use(express.static(__dirname + '/public'));
app.get('/', function(req,res){
  res.sendFile(__dirname + '/public/pages/index.html');
});
app.get('/register',function(req,res){
});
app.get("/login",function(req,res){
  console.log(req.query);
  userid = req.query.uname;

  saintLogin(req.query.uname, req.query.psw).then(function(htmlstring){
    console.log(htmlstring);
    if(!htmlstring)
      res.sendFile( __dirname + "/public/pages/index.html");
    else
      res.sendFile( __dirname + "/public/pages/chat.html");
  });
});
io.on('connection', function(socket){
  console.log( socket.id , 'is connected');
  io.to(socket.id).emit('change name',userid);
  socket.on('sendmessage',function(name,text){
    var msg = name + ' : ' + text;
    console.log(msg);
    io.emit('receivemessage',msg);
  });

  socket.on('disconnect', function(){
    console.log(socket.id , 'is disconnected');
  });
});
http.listen(3000,function(){
  console.log('Running Server...');
});
app.get('/calendar' , function(req,res){

  fs.readFile('client_secret.json', function processClientSecrets(err, content) {
    if (err) {
      console.log('Error loading client secret file: ' + err);
      return;
    }
    authorize(res , req.query.code, JSON.parse(content), listEvents);
  });

});
function authorize(res ,code ,  credentials, callback) {
  var clientSecret = credentials.installed.client_secret;
  var clientId = credentials.installed.client_id;
  var redirectUrl = credentials.installed.redirect_uris[0];
  var auth = new googleAuth();
  var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);
  if( !code){
    var authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES
    });
    console.log('Authorize this app by visiting this url: ', authUrl);
    res.render(__dirname + "/public/pages/register.ejs" , { url: authUrl});
  }
  else{
    oauth2Client.getToken(code, function(err, token) {
      if (err) {
        console.log('Error while trying to retrieve access token', err);
        return;
      }
      oauth2Client.credentials = token;
      storeToken(token);
      callback(res, oauth2Client);
    });
  }
}

function storeToken(token) {
  try {
    fs.mkdirSync(TOKEN_DIR);
  } catch (err) {
    if (err.code != 'EEXIST') {
      throw err;
    }
  }
  fs.writeFile(TOKEN_PATH, JSON.stringify(token));
  console.log('Token stored to ' + TOKEN_PATH);
}
function listEvents(res ,auth) {
  var calendar = google.calendar('v3');
  calendar.events.list({
    auth: auth,
    calendarId: 'primary',
    timeMin: (new Date()).toISOString(),
    maxResults: 10,
    singleEvents: true,
    orderBy: 'startTime'
  }, function(err, response) {
    if (err) {
      console.log('The API returned an error: ' + err);
      return;
    }
    var events = response.items;
    var lists = "";
    if (events.length == 0) {
      lists = "No upcoming events found.";
    } else {
      for (var i = 0; i < events.length; i++) {
        var event = events[i];
        var start = event.start.dateTime || event.start.date;
        lists += ( start + ' - ' +  event.summary + '<br>');
      }
    }
    res.send(lists);
  });
}


