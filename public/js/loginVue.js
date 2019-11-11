var app = new Vue({
    el: '#login',
    data: {
        message: 'Create a new Poly-Chat thread here:',
        nickname: '',
        uuid: '',
        langs: [
            { val: "en", descr: "English" },
            { val: "ukr", descr: "Ukraine", },
            { val: "ru", descr: "Russian", },
            { val: "spa", descr: "Spanish", },
            { val: "ita", descr: "Italian", }
        ],
        selected: 'en',
        showUrl: false,
        url: '',
        counter: 0,
        isValid: 0

    },
    methods: {
        createChat() {
            this.showUrl = true;
            console.log("Create Chat");
            this.uuid = this.setUuidv4;

            let value = encodeURI(`data={"id":"${this.uuid}","nick":"${this.nickname}","lang":"${this.selected}"}`);

            var xhr = new XMLHttpRequest();
            xhr.addEventListener("readystatechange", function () {
                if (this.readyState === 4) {
                    console.log(this.responseText);
                    window.localStorage.setItem("chat", this.responseText);
                }
            });
            xhr.open("POST", "http://10.0.0.7:4000/chat", true);
            xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
            xhr.send(value);

            this.url = `http://10.0.0.7:4000/chat?id=${this.uuid}`;
            //return this.url;
        },
        varifyNick(nick) {
            console.log(nick);
            if (nick.length >= 3 && this.selected != '') {
                this.isValid = 1;
            }
        },
        copyToClip() {
            console.log("copy");
            //            console.log(this.$refs.chatId);
            this.$refs.chatId.select();
            document.execCommand("copy");
            var x = document.getElementById("snackbar");
            x.className = "show";
            setTimeout(function () { x.className = x.className.replace("show", ""); }, 3000);

        }
    },
    computed: {
        setUuidv4() {
            return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
                (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
            );
        }

    }

});

/*
Vue.component('chatLink', {
    props: {
        url: '',
        counter: 0
    },
    computed: {
        generateUrl() {

        }
    },
    template: `<a v-show="showUrl" v-bind:href="url">Go to chat</a>`
}); */

/*
<option value="en">English</option>
<option value="ukr">Ukraine</option>
<option value="ru">Russian</option>
<option value="spa">Spanish</option>
<option value="ita">Italian</option>
*/