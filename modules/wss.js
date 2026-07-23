import {WebSocketServer} from "ws";
import {saveConfig} from "./config.js";

var wss = null;
var Sockets = [];

export const emit = (data) => {

    const payload = JSON.stringify(data);

    Sockets.forEach(({ws}) => {
        if (ws.readyState === ws.OPEN) {
            ws.send(payload);
        }
    })
}

export function startServer() {
    stopServer();

    if (typeof Config.cfx.port !== "number") {
        Config.cfx.port = 3001;
        saveConfig();
    };

    wss = new WebSocketServer({ port: Config.cfx.port });
    wss.on("connection", (ws) => {
        const clientId = Date.now();
        Sockets.push({clientId, ws});

        console.log("client connected (fivem?)", clientId);

        ws.on("close", () => {
            Sockets = Sockets.filter(e => e.clientId !== clientId);
        });
    });

    wss.on("error", (err) => {
        switch (err.code) {
            case "EADDRINUSE": console.warn(`Port [${Config.cfx.port}] is already in use`); break;
        }
    });

    wss.on("close", () => {
        console.log("wss closed, fivem disconnect?");
    });

    wss.on("listening", () => {
        console.log(`wss is now online on Port [${Config.cfx.port}]`);
    });
}

export function stopServer() {
    if (!wss) return;
    wss.close?.();
    wss = null;
    Sockets.forEach(({ws}) => ws.close());
}