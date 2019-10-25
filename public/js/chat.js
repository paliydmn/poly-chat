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
let onlineList = document.getElementById('listOnline');

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
    user = new User(uuidv4(), uName.value, langSelect.value, 'online', '');
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
    console.log(data);
    onlineList.innerHTML='';
    data.forEach(index => {
        var node = document.createElement("LI");
        node.id = index.socketId;
        var textnode = document.createTextNode(index.name);
        node.appendChild(textnode);
        onlineList.appendChild(node);
    });
});

socket.on('userOffline', (data) => {
    onlineList.innerHTML='';
    data.forEach(index => {
        var node = document.createElement("LI");
        node.id = index.socketId;
        var textnode = document.createTextNode(index.name);
        node.appendChild(textnode);
        onlineList.appendChild(node);
    });
});


/* socket.on('typing', (data) => {
    feedback.innerHTML = '<p><em>' + data + ' is typing a message ...</em></p>';
    chatDiv.scrollTop = chatDiv.scrollHeight;
});
 */



socket.on('chat', (data) => {
    translateMessageGet2(data.message, { 'from': data.user.lang, 'to': user.lang }).then(result => {
        feedback.innerHTML = "";
        if (data.user.id === user.id) {
            output.innerHTML += `
                <div id="uName" align="right">
                    <div id="name">${user.name}</div>
                    <div id="translate" style="background-color:#d0ffea; margin-right: 35px;">${data.message}</div>
                </div>`;
        } else {
            output.innerHTML += `
            <div id="uName">
                <div id="name">${data.user.name}</div>
                <div id="translate">${result}</div>
                <div id="original">
                    <strong>${data.user.lang}: </strong>    
                ${data.message}</div>
            </div>`;
        }
        /*         data.message = result;
                feedback.innerHTML = "";
                output.innerHTML += '<p><strong>'
                    + data.user.name
                    + ':</strong>'
                    + data.message
                    + '</p>';
         */
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
        user: user
    });
};

function User(id, name, lang, status, socketId) {
    this.id = id;
    this.name = name;
    this.lang = lang;
    this.status = status;
    this.socketId = socketId;
}

function uuidv4() {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
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
        let to = langPair.to;
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

