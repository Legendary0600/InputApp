window.addEventListener("DOMContentLoaded", () => {
    Notification.container.className = "cnotifications";
    document.body.appendChild(Notification.container);
});

class Notification {
    static container = document.createElement("div");
    static delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    constructor (options = {}) {
        const {message, duration=5, color} = options;

        const elm = document.createElement("div");
        const inner = document.createElement("div");
        const cleft = document.createElement("div");
        const ccontent = document.createElement("div");
        const cbar = document.createElement("div");
        const cbar2 = document.createElement("div");

        elm.className = "container";
        cleft.className = "cleft";
        ccontent.className = "content";
        cbar.className = "bar";
        cbar2.className = "bar";
        inner.className = "inner";


        this.duration = duration;

        if (color) elm.style.setProperty("--nbgcs", color);
        elm.style.setProperty("--trans", `${this.duration}s`);


        cleft.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="currentColor"><path d="M440-280h80v-240h-80v240Zm68.5-331.5Q520-623 520-640t-11.5-28.5Q497-680 480-680t-28.5 11.5Q440-657 440-640t11.5 28.5Q463-600 480-600t28.5-11.5ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/></svg>`;
        cleft.style.color = "#00a8ff";
        ccontent.innerHTML = message;

        inner.appendChild(cleft);
        inner.appendChild(ccontent);
        elm.append(cbar2);
        elm.appendChild(inner);
        elm.append(cbar);

        this.elm = elm;

        this.timeout;
        
        Notification.container.appendChild(this.elm);
    }

    play() {
        if (!this.sound) {
            this.sound = new Audio("static/sounds/navigation.mp3");
            this.sound.volume = .25;
        };

        this.sound.play();
    }

    remove () {
        if (this.timeout) clearTimeout(this.timeout);
        this.elm.classList.add("hide");
        setTimeout(() => this.elm.remove(), 350);
        this.timeout = null;
    }

    load () {
        requestAnimationFrame(async () => {
            this.play();
            this.elm.classList.add("show");
            await Notification.delay(1000);
            
            this.elm.classList.add("active");

            this.timeout = setTimeout(() => this.remove(), (this.duration * 1000)-200);
        })
    }
}
