let express = require('express');
let socket = require('socket.io');
let https = require('https');
var querystring = require('querystring');
var sd = require('string_decoder').StringDecoder;

// App setup
let app = express();
let server = app.listen(4000, () => {
    console.log('Listening on 4000');
});


//Static files
app.use(express.static('public'));
//app.use(express.static('/public/img/*'));
app.get('/', function (req, res) {
    res.sendFile(__dirname + '/view/index.html');
});

//
let userList = new Array();


//setup socket
let io = socket(server);
io.on('connection', (socket) => {
    console.log('Socket connection', socket.id);

    //Events
    socket.on('chat', (data) => {
        console.log(data);
        io.sockets.emit('chat', data);

        // 
        //httpGet(urlTr);
/*         translateMessageGet(data.message, { 'from': 'en', 'to': data.langTo }).then(result => {
            data.message = result;
            io.sockets.emit('chat', data);
        }); */
    });

    socket.on('typing', (data) => {
        socket.broadcast.emit('typing', data);
    });
    
    socket.on('online', (data) => {
        data.socketId = socket.id;
        userList.push(data);
        console.log(`ONLINE USER LIST: ${userList}`);

        io.sockets.emit('online', userList);
        console.log("ONLINE " + socket.id);
    }); 
      
    socket.on('disconnect', (data) => {
        userList = userList.filter(function( obj ) {
            return obj.socketId !== socket.id;
        });
        
        console.log(`USER LIST: ${userList}`);
        io.sockets.emit('userOffline', userList );

        console.log("OFFLINE " + socket.id);
    }); 

});




function translateMessageGet(message, langPair) {
    return new Promise((resolve, reject) => {
        let from = langPair.from;
        let to = langPair.to;
        if (from === to) {
            resolve(message);
        } else {
            let urlTr = `https://api.mymemory.translated.net/get?q=${message}&langpair=${from}|${to}`;

            https.get(urlTr, (resp) => {
                let data = '';
                // A chunk of data has been recieved.
                resp.on('data', (chunk) => {
                    data += chunk;
                });
                // The whole response has been received. Print out the result.
                resp.on('end', () => {
                    console.log(JSON.stringify(data));
                    resolve(JSON.parse(data).responseData.translatedText);
                });
            }).on("error", (err) => {
                console.log("Error: " + err.message);
                reject(`Translation error: ${message}`);
            });
        }
    });
}
module.exports.https = https;