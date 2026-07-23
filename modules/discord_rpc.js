import { app, Notification } from "electron";
import RPC from "discord-rpc";
import * as ccg from "./config.js";

const basePresence = {
    // details: "HorizonMods App",
    startTimestamp: Date.now(),
    largeImageKey: "icon",
    largeImageText: "HorizonMods",
    smallImageKey: "logo",
    buttons: [ // Maximal 2 Buttons sind erlaubt sonst fehler;
        // { label: "HomePage", url: "https://example.com" },
        { label: "Discord", url: "https://discord.gg/7nUv55Xfg8" }
    ]
}

const DiscordClientId = "1493909795160330240";

if (!app.requestSingleInstanceLock()) {
    app.quit();
};

let DiscordRPC = null;
let {enable: Enable, notify: canNotify} = Config.discordPresence;

function SetupDiscordRPC() {
    if (!Enable || DiscordRPC) return;
    if (DiscordRPC === undefined) return;
    DiscordRPC = undefined;

    const eventHandl = new RPC.Client({ transport: "ipc" });
    const destroy = () => DiscordRPC = null;
    
    eventHandl.on("ready", () => {
        if (canNotify) new Notification({ title: 'HorizonMods', body: 'DiscordRPC is now Ready' }).show();
        eventHandl.setActivity(basePresence);

        DiscordRPC = eventHandl;
    });
    
    const lg = eventHandl.login({clientId: DiscordClientId});
    lg.catch(err => {if (Enable) setTimeout(SetupDiscordRPC, 5000); destroy();})

    eventHandl.on("disconnected", () => {
        if (canNotify) new Notification({ title: 'HorizonMods', body: 'DiscordRPC Disconnected\nclosed' }).show();
        if (Enable) setTimeout(SetupDiscordRPC, 5000); destroy();
    });
}

app.whenReady().then(() => {
    RPC.register(DiscordClientId);
    SetupDiscordRPC();
});

function IsValid(name) {
    return typeof name === "string" && name.trim().length > 3;
}

export function setState(name) {
    if (!DiscordRPC) return;
    delete basePresence.state;
    if (IsValid(name)) basePresence.state = name;
    DiscordRPC.setActivity(basePresence); 
}

export function setDetails(name) {
    if (!DiscordRPC) return;
    delete basePresence.details;
    if (IsValid(name)) basePresence.details = name;
    DiscordRPC.setActivity(basePresence); 
}

export function setPresence(state, details) {
    if (!DiscordRPC) return;
    delete basePresence.state;
    delete basePresence.details;

    if (IsValid(state)) basePresence.state = state;
    if (IsValid(details)) basePresence.details = details;
    DiscordRPC.setActivity(basePresence); 
}

export function toggle(value) {
    Enable = !!value;

    if (Enable && !DiscordRPC) {
        SetupDiscordRPC();
    } else if (DiscordRPC && !Enable) {
        DiscordRPC.destroy();
    };
    

    Config.discordPresence.enable = Enable;
    ccg.save.Config();
}

app.on("before-quit", (e) => {
    if (DiscordRPC) {
        DiscordRPC.clearActivity();
        DiscordRPC = null;
    }
});