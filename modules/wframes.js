import {app, BrowserWindow, Menu} from "electron";

app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
})

export const main = () => {
    const screen = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: app.getAppPath() + '/preload.js',
            contextIsolation: true
        },
        show: false
    });

    screen.loadFile('index.html');
    if (Config.devmode) screen.webContents.openDevTools();
    return screen;
}

export const loading = () => {
    const screen = new BrowserWindow({
        width: 400,
        height: 300,
        frame: false,
        show: false
    });

    screen.loadFile("loading.html");

    screen.on("ready-to-show", () => {
        screen.show();
    });
    return screen;
}