// Make connection here
let socket = io.connect('http://localhost:4000');

// DOM
let chatDiv = document.getElementById('chat-window');
let uName = document.getElementById('uName');
let message = document.getElementById('message');
let output = document.getElementById('output');
let btn = document.getElementById('send');
let feedback = document.getElementById('feedback');
let langSelect = document.getElementById('language');
let save = document.getElementById('save');
let onlineList = document.getElementById('onlineList');

let user = '';

//emit event
message.addEventListener("keyup", function (event) {
    if (event.key === "Enter") {
        emitChat();
        message.value = "";
        // uName.setAttribute('readonly', '');
    }
});

//Register User.
save.addEventListener('click', () => {
    user = new User(uName.value, langSelect.value, 'online');
    uName.setAttribute('readonly', '');
    langSelect.setAttribute('readonly', '');
    save.style = 'display:none';
    message.removeAttribute('disabled');
    btn.removeAttribute('disabled');

    socket.emit('online', user);
});

btn.addEventListener('click', () => {
    emitChat();
    message.value = "";
    //uName.setAttribute('readonly', '');
});

message.addEventListener('keypress', () => {
    socket.emit('typing', uName.value);
});

//listen for events
socket.on('online', (data) => {
    var node = document.createElement("LI");
    var textnode = document.createTextNode(data.name);
    node.appendChild(textnode);
    onlineList.appendChild(node);
});

/* socket.on('typing', (data) => {
    feedback.innerHTML = '<p><em>' + data + ' is typing a message ...</em></p>';
    chatDiv.scrollTop = chatDiv.scrollHeight;
});
 */

socket.on('chat', (data) => {
    translateMessageGet2(data.message, { 'from': data.langFrom, 'to': data.langTo }).then(result => {
        data.message = result;
        feedback.innerHTML = "";
        output.innerHTML += '<p><strong>'
            + data.nickName
            + ':</strong>'
            + data.message
            + '</p>';

        chatDiv.scrollTop = chatDiv.scrollHeight;
    });
});


socket.on('typing', (data) => {
    feedback.innerHTML = '<p><em>' + data + ' is typing a message ...</em></p>';
    chatDiv.scrollTop = chatDiv.scrollHeight;
});

let emitChat = function () {
    socket.emit('chat', {
        message: message.value,
        nickName: user.name,
        langFrom: user.lang
    }, user);
};

function User(name, lang, status) {
    this.name = name;
    this.lang = lang;
    this.status = status;
}

function translateMessageGet(message, langPair) {
    return new Promise((resolve, reject) => {
        let from = langPair.from;
        let to = user.lang;
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
function translateMessageGet2(message, langPair) {
    return new Promise((resolve, reject) => {
        let from = langPair.from;
        let to = user.lang;
        if (from === to) {
            resolve(message);
        } else {
            let urlTr = `https://api.mymemory.translated.net/get?q=${message}&langpair=${from}|${to}`;
            let xmlHttp = new XMLHttpRequest();
            xmlHttp.open("GET", urlTr, false); // false for synchronous request
            xmlHttp.send(null);
            //     return xmlHttp.responseText;
            resolve(JSON.parse(xmlHttp.responseText).responseData.translatedText);
        }
    });
}

