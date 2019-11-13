// Make connection here
let socket = io.connect('http://10.0.0.7:4000');

// DOM
let notif = document.getElementById('notification');

let chatDiv = document.getElementById('chat-window');
let uName = document.getElementById('uName');
let message = document.getElementById('message');
let output = document.getElementById('output');

let btn = document.getElementById('send');
let feedback = document.getElementById('feedback');
let langSelect = document.getElementById('language');
let save = document.getElementById('save');
let onlineList = document.getElementById('listOnline');
let loadHistory = document.getElementById('history');

let onOffToggle = document.getElementById('onOffcheckbox');

let localUser = '';

let online = '';
let suspended = '';
let unsuspended = '';
let typing = '';
let chat = '';
let history = '';


function startChat() {
    if (window.localStorage.length != 0) {
        let chatId = window.localStorage.getItem('chatId');
        let chat = window.localStorage.getItem('chat');
        if (chat) {
            let data = JSON.parse(chat);
            chatId = data.chatId;
            localUser = data.user;
            let arr = document.getElementById('nickname').childNodes;
            arr.forEach(a => { try { a.setAttribute("disabled", "disabled"); } catch (err) { } });
            save.style.display = 'none';
            setListeners(chatId, localUser.id);
            console.log(`Emit New Listener: ${online}`);
            socket.emit(online, {
                chatId: chatId,
                user: localUser
            });
            uName.value = localUser.name;
            onOffToggle.setAttribute('checked','checked'); 
        } else {
            setListeners(chatId, '');
            notif.innerHTML = "Enter Nikname and select Language, Please.";
        }
    }
}
startChat();

function setListeners(id, uid) {
    online = `online_${id}`;
    suspended = `suspended_${id}`;
    unsuspended = `unsuspended_${id}`;
    typing = `typing_${id}`;
    chat = `chat_${id}`;
    history = `history_${id}`;
}

onOffToggle.addEventListener('click', () => {
    let isOff = document.getElementById('onOffcheckbox').checked;
    console.log();
    let chat = window.localStorage.getItem('chat');
    if(!isOff){
       // startChat();
      //  socket.emit('connection',{});
        socket.emit('suspended', {
            chatId: JSON.parse(chat).chatId,
            user: localUser
        });
    } else {
        socket.emit('unsuspended', {
            chatId: JSON.parse(chat).chatId,
            user: localUser
        });
        //startChat();
        //document.getElementById(localUser.id).style = 'color: black;';
    }
});

socket.on(suspended, data => {
    console.log(data);
    document.getElementById(data.id).style = 'color: red;';
});

socket.on(unsuspended, data => {
    console.log(data);
    document.getElementById(data.id).style = 'color: black;';
});
save.addEventListener('click', () => {
    user = new User(uuidv4(), uName.value ? uName.value : 'Nemo', langSelect.value, 'online', '');
    uName.setAttribute('readonly', '');
    langSelect.setAttribute('readonly', '');
    save.style = 'display:none';
    message.removeAttribute('disabled');
    btn.removeAttribute('disabled');

    localUser = user;

    let chatId = window.localStorage.getItem('chatId');
    window.localStorage.removeItem('chatId');
    window.localStorage.setItem("chat", JSON.stringify({ 'chatId': chatId, 'user': localUser }));
    console.log(`Emit New Listener: ${online}`);

    socket.emit(online, {
        chatId: chatId,
        user: localUser
    });

    onOffToggle.setAttribute('checked','checked'); 
    notif.style = 'display:none;';

});

loadHistory.addEventListener('click', () => {

    socket.emit(history, { id: localUser.id });

    socket.on(history + localUser.id, (data) => {
        data.forEach(item => {
            let user = item.chatDataHis.user;
            let message = item.chatDataHis.message;
            feedback.innerHTML = "";
            if (localUser != "") {
                if (user.id === localUser.id) {
                    output.innerHTML += `
                <div id="uName" align="right">
                <div id="name">${localUser.name}</div>
                <div id="translate" style="background-color:#d0ffea; margin-right: 35px;">${message}
                <p>${getTime()}</p>
                </div>
                </div>`;
                } else {
                    if (user.lang === localUser.lang) {
                        output.innerHTML += `
                    <div id="uName">
                    <div id="name">${user.name}</div>
                    <div id="translate">${message}
                    <p>${getTime()}</p>
                    </div>
                    </div>`;
                    } else {
                        httpGetTranslateAsync(message, { 'from': user.lang, 'to': localUser.lang }, function (result) {
                            output.innerHTML += `
                        <div id="uName">
                        <div id="name">${user.name}</div>
                        <div id="translate">${result}
                        <p>${getTime()}</p>
                        </div>
                        <div id="original">
                        <strong>${user.lang}: </strong>    
                        ${message}</div>
                        </div>`;
                            chatDiv.scrollTop = chatDiv.scrollHeight + 100;
                        });
                    }
                }
                chatDiv.scrollTop = chatDiv.scrollHeight + 100;
            }
        });
    });
    loadHistory.style = 'display: none;';

});

message.addEventListener('keypress', () => {
    socket.emit(typing, uName.value);
});


//emit event
message.addEventListener("keyup", function (event) {
    if (event.key === "Enter") {
        emitChat();
        message.value = "";
    }
});

btn.addEventListener('click', () => {
    emitChat();
    message.value = "";
});

//listen for events
socket.on(online, (data) => {
    console.log(`Listen: ${online}`);
    let item = data[0];
    if (JSON.parse(window.localStorage.getItem('chat')).chatId == item[0]) {
        onlineList.innerHTML = '';
        data.forEach(user => {
            listUsers(user[1]);
        });
    }
});

function listUsers(user) {
    var nodeLi = document.createElement("LI");
    nodeLi.id = user.id;
    var textnode = document.createTextNode(`${user.lang} / ${user.name}`);
    nodeLi.appendChild(textnode);
    onlineList.appendChild(nodeLi);

    message.removeAttribute('disabled');
    btn.removeAttribute('disabled');
}

socket.on(typing, (data) => {
    feedback.innerHTML = '<p><em>' + data + ' is typing a message ...</em></p>';
    chatDiv.scrollTop = chatDiv.scrollHeight;
});

Date.prototype.timeNow = function () {
    return ((this.getHours() < 10) ? "0" : "") + this.getHours() + ":" + ((this.getMinutes() < 10) ? "0" : "") + this.getMinutes() + ":" + ((this.getSeconds() < 10) ? "0" : "") + this.getSeconds();
};

function getTime() {
    var now = new Date();
    return now.timeNow();
}

socket.on(chat, (data) => {
    feedback.innerHTML = "";
    if (localUser != "") {
        if (data.user.id === localUser.id) {
            output.innerHTML += `
            <div id="uName" align="right">
            <div id="name">${localUser.name}</div>
            <div id="translate" style="background-color:#d0ffea; margin-right: 35px;">${data.message}
            <p>${getTime()}</p>
            </div>
            </div>`;
        } else {
            if (data.user.lang === localUser.lang) {
                output.innerHTML += `
                <div id="uName">
                <div id="name">${data.user.name}</div>
                <div id="translate">${data.message}
                <p>${getTime()}</p>
                </div>
                </div>`;
            } else {
                httpGetTranslateAsync(data.message, { 'from': data.user.lang, 'to': localUser.lang }, function (result) {
                    output.innerHTML += `
                    <div id="uName">
                    <div id="name">${data.user.name}</div>
                    <div id="translate">${result}
                    <p>${getTime()}</p>
                    </div>
                    <div id="original">
                    <strong>${data.user.lang}: </strong>    
                    ${data.message}</div>
                    </div>`;
                    chatDiv.scrollTop = chatDiv.scrollHeight + 100;
                });
            }
        }
        chatDiv.scrollTop = chatDiv.scrollHeight + 100;
    }
});


let emitChat = function () {
    socket.emit(chat, {
        message: message.value,
        user: localUser
    });
    loadHistory.style = 'display: none;'
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

function httpGetTranslateAsync(message, langPair, callback) {
    let from = langPair.from;
    let to = langPair.to;
    let urlTr = `https://api.mymemory.translated.net/get?q=${message}&langpair=${from}|${to}`;
    if (from === to) {
        callback(message);
    } else {
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.onreadystatechange = function () {
            if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
                callback(JSON.parse(xmlHttp.responseText).responseData.translatedText);
        };
        xmlHttp.open("GET", urlTr, true); // true for asynchronous 
        xmlHttp.send(null);
    }
}
