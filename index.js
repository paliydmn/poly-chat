let express = require('express');
let socket = require('socket.io');
let https = require('https');
let bodyParser = require('body-parser');
let urlencodeParser = bodyParser.urlencoded({ extended: false });

var querystring = require('querystring');
var sd = require('string_decoder').StringDecoder;
let crypto = require('crypto');

// App setup
let app = express();
app.set('view engine', 'ejs');
let server = app.listen(4000, () => {
    console.log('Listening on 4000');
});


//Static files
app.use(express.static('public'));
app.use(urlencodeParser);
//app.use(express.static('/public/img/*'));
/* app.get('/', function (req, res) {
    res.sendFile(__dirname + '/view/index.html');
});
 */
function Chat(chatId, usersMap) {
    this.chatId = chatId;
    this.usersMap = usersMap;
}

function User(id, name, lang, status, socketId) {
    this.id = id;
    this.name = name;
    this.lang = lang;
    this.status = status;
    this.socketId = socketId;
}


let chatsMap = new Map();

let usersMap; // = new Map();
let user;

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/views/login.html');
});

app.post('/chat', urlencodeParser, function (req, res) {
    let data = '';
    try {
        data = JSON.parse(req.body.data);
        let chatId = data.id;
        user = new User(data.id, data.nick ? data.nick : 'Incognito', data.lang, 'online', '');
        usersMap = new Map().set(user.id, user);

        chatsMap.set(chatId, new Chat(chatId, usersMap));

        let response = `{"chatId":"${data.id}","user":${JSON.stringify(user)}}`;
        console.log(response);
        res.end(response);

    } catch (error) {

    }
});


let listenIds = new Map();

app.get('/chat', function (req, res) {
    let chatId = req.query.id;
    if (chatsMap.has(chatId)) {
        res.render('index', { chatId: chatId });
        if (!listenIds.has(chatId))
            listenIds.set(chatId, false);
        return;
    }
    else {
        res.sendFile(__dirname + '/views/login.html');
    }
});


//setup socket
let io = socket(server);
io.on('connection', (socket) => {
    for (const [key, value] of listenIds.entries()) {
        let item = key;

        let online = `online_${item}`;
        let typing = `typing_${item}`;
        let chat = `chat_${item}`;

        socket.on(online, (data) => {
            let id = data.chatId;
            user = data.user;
            if (chatsMap.has(id)) {
                if (!chatsMap.get(id).usersMap.has(user.id)) {
                    chatsMap.get(id).usersMap.set(user.id, user);
                }
                //usersMap.set(data);
                io.sockets.emit(online, Array.from(chatsMap.get(id).usersMap));
                console.log(`Emit ${online}`);
            }
        });

        socket.on(typing, (data) => {
            socket.broadcast.emit(typing, data);
        });

        socket.on(chat, (data) => {
            console.log(data);
            io.sockets.emit(chat, data);
        });

        listenIds.set(key, true);
    }
});