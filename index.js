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

app.get('/chat', function (req, res) {
    let chatId = req.query.id;
    if (chatsMap.has(chatId)) {
        res.render('index', { chatId: chatId });
        return;
    }
    else {
        res.sendFile(__dirname + '/views/login.html');
    }
});

//setup socket
let io = socket(server);
io.on('connection', (socket) => {
    console.log('Socket connection', socket.id);

    socket.on('online', (data) => {
        console.log("ONLINE USER" + data);

        let id = data.chatId;
        user = data.user;
        if(chatsMap.has(id)){
            if(!chatsMap.get(id).usersMap.has(user.id)){
                chatsMap.get(id).usersMap.set(user.id, user);
            }
            //usersMap.set(data);
            io.sockets.emit('online', Array.from(chatsMap.get(id).usersMap));
        }
        console.log("ONLINE " + socket.id);
    });


});



// app.get('/', function (req, res) {
//     res.sendFile(__dirname + '/views/login.html');
// });
// app.get('/chat', function (req, res) {
//     let chatId = req.query.id;
//     for (let i = 0; i < chatList.length; i++) {
//         if (chatList[i].chatId == chatId && i < chatList.length) {
//             res.render('index',{chatId: chatId});
//             //res.render('index',{chatId: JSON.stringify(chatList[i])});
//             return;
//         } else {
//             res.sendFile(__dirname + '/views/login.html');
//         }
//     }

// });
// app.post('/chat', urlencodeParser, function (req, res) {
//     let data = '';
//     try {
//         data = JSON.parse(req.body.data);

//         user = new User(data.id, data.nick ? data.nick : 'Incognito', data.lang, 'online', '');
//         let userList = new Array();
//         userList.push(user);
//         chatList.push(new Chat(data.id, userList));
//         //{"chatId":"2c7b654c-7c07-455b-ae30-f8ca6ad48dcd","user":{"id":"2c7b654c-7c07-455b-ae30-f8ca6ad48dcd","name":"ЕРШ","lang":"en","status":"online","socketId":""}}
//         let response = `{"chatId":"${data.id}","user":${JSON.stringify(user)}}`;
//         console.log(response);
//         res.end(response);
//         /* if (chatList.length <= 0) {
//         } else {
//             for (let i = 0; i < chatList.length; i++) {
//                 if (chatList[i].chatId == data.id && i < chatList.length) {
//                     user = new User(userObj.id, userObj.nick ? userObj.nick : 'Incognito', userObj.lang, 'online', '');
//                     console.log(user);
//                     userList.push(user);
//                 }
//             }
//         } */
//         console.log(data);
//     } catch (error) {

//     }
// });

// //

// /* app.get('/chat', function (req, res) {
//     let userObj = req.query;
//     user = new User(userObj.id, userObj.nick ? userObj.nick : 'Incognito', userObj.lang, 'online', '');
//     console.log(user);
//     userList.push(user);
//     res.sendFile(__dirname + '/view/index.html');
// }); */

// //setup socket
// let io = socket(server);
// io.on('connection', (socket) => {
//     console.log('Socket connection', socket.id);
//     /*     if (user) {
//             socket.emit('newUser', user);
//         } */
//     //Events
//     socket.on('chat', (data) => {
//         console.log(data);
//         io.sockets.emit('chat', data);
//     });

//     socket.on('typing', (data) => {
//         socket.broadcast.emit('typing', data);
//     });

//     socket.on('online', (data) => {
//         data.socketId = socket.id;
//         userList.push(data);
//         console.log(`ONLINE USER LIST: ${userList}`);

//         io.sockets.emit('online', userList);
//         console.log("ONLINE " + socket.id);
//     });

//     socket.on('start', (data) => {
//         for (let i = 0; i < chatList.length; i++) {
//             if (chatList[i].chatId == data.chatId) {
//                 let uList =  chatList[i].userList;
//                 for (let n = 0; n < uList.length; n++) {
//                     const elem = uList[n];
//                     if(elem.id == data.user.id){
//                         break;
//                     } else if (n == uList.length -1){
//                         chatList[i].userList.push(data.user);
//                     }
//                 }
//             }
//             data = {
//                 chatId: chatList[i].chatId,
//                 user: chatList[i].userList
//             };
//             io.sockets.emit('start', data);
//         }
//        // userList.push(data);
//        // console.log(`ONLINE USER LIST: ${chatList[i].userList}`);
//     });

//   /*   socket.on('disconnect', (data) => {
//         userList = userList.filter(function (obj) {
//             return obj.socketId !== socket.id;
//         });

//         console.log(`USER LIST: ${userList}`);
//         io.sockets.emit('userOffline', userList);

//         console.log("OFFLINE " + socket.id);
//     }); */
//     });




// function translateMessageGet(message, langPair) {
//     return new Promise((resolve, reject) => {
//         let from = langPair.from;
//         let to = langPair.to;
//         if (from === to) {
//             resolve(message);
//         } else {
//             let urlTr = `https://api.mymemory.translated.net/get?q=${message}&langpair=${from}|${to}`;

//             https.get(urlTr, (resp) => {
//                 let data = '';
//                 // A chunk of data has been recieved.
//                 resp.on('data', (chunk) => {
//                     data += chunk;
//                 });
//                 // The whole response has been received. Print out the result.
//                 resp.on('end', () => {
//                     console.log(JSON.stringify(data));
//                     resolve(JSON.parse(data).responseData.translatedText);
//                 });
//             }).on("error", (err) => {
//                 console.log("Error: " + err.message);
//                 reject(`Translation error: ${message}`);
//             });
//         }
//     });
// }
// //module.exports.https = https;
