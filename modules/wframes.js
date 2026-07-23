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
    if (!app.isPackaged) {
        screen.webContents.openDevTools();
    };

    screen.on("ready-to-show", () => {
        screen.show();
    });

    return screen;
}

export const splashScreen = () => {
    const screen = new BrowserWindow({
        width: 800,
        height: 400,
        frame: false,
        show: false,
        webPreferences: {
            preload: app.getAppPath() + '/static/loading/preload.js',
            contextIsolation: true
        }
    });

    screen.loadFile("loading.html");
    screen.on("ready-to-show", () => {
        screen.show();
    });

    screen.webContents.on("did-fail-load", (event, errorCode, errorDescription, validatedURL) => {
        console.error(
            "Load Fehler:",
            errorCode,
            errorDescription,
            validatedURL
        );
    });

    return screen;
}