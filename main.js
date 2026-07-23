import "./modules/console.js";
process.on("uncaughtException", err => {
    console.error(`Uncaught Exception: ${err?.stack || err}`);
});

process.on("unhandledRejection", err => {
    console.error(`Unhandled Rejection: ${err?.stack || err}`);
});

import sdl from "@kmamal/sdl";

import * as ccg from "./modules/config.js";
import {app, ipcMain, BrowserWindow, Notification, shell} from "electron";
import updater from "electron-updater";
import * as wsframes from "./modules/wframes.js";
import * as wss from "./modules/wss.js";
import * as DiscordRPC from "./modules/discord_rpc.js";
import deviceInteraction from "./modules/InputDevice.js";
import path from "node:path";
import os from "os";
import loadJson from "./modules/loadjson.js";

const {autoUpdater} = updater;

autoUpdater.on("checking-for-update", () => {
    console.log("Suche nach Updates...");
});

autoUpdater.on("update-available", (info) => {
    console.log("Update gefunden:", info.version);
});

autoUpdater.on("update-not-available", () => {
    console.log("Keine Updates verfügbar");
});

autoUpdater.on("error", (err) => {
    console.error("Updater Fehler:", err);
});

autoUpdater.forceDevUpdateConfig = true;
autoUpdater.checkForUpdates();


let mainWindow;

ipcMain.on("system:reloadUI", () => {
    mainWindow.reload();
});

ipcMain.on("system:restart", () => {
    app.relaunch();
    app.exit(0);
});

ipcMain.handle("requestData", (event, name, options) => {
    switch (name) {
        case "locales": return ccg.locales;
        case "Inputs": return ccg.InputFields;
        case "Stadia": return Config.Stadia;

        case "currentDevices": return deviceInteraction.currentDevices();
        case "currentMappings": return ccg.Mapping.preset.getMapping();

        case "devices": {
            return sdl.joystick.devices.map(device => ({
                productName: device.name,
                vendorId: device.vendor,
                productId: device.product,
            }));
        }

        case "getLocales": return {
            lang: Config.lang,
            data: ccg.locales
        }
    }
});


ipcMain.handle("removeDevice", (event, data) => {
    const {vendorId, productId} = data;
    const device = deviceInteraction.findDevice(vendorId, productId);
    if (!device) return false;

    device.close();
    ccg.deviceList.remove(vendorId, productId);
    return true;
});


ipcMain.handle("bindingEvent", (_, name, Interaction, slotId, data) => {
    switch(name) {
        case "Delete": return ccg.Mapping.remove(Interaction, slotId);
        case "Place": return ccg.Mapping.add(Interaction, slotId, data.vendorId, data.productId, data.keyCode, data.options);
        case "Update": return ccg.Mapping.update(Interaction, slotId, data)
    }

    return true;
});


ipcMain.on("selectDevice", async (event, data) => {
    const device = sdl.joystick.devices.find((device) => (
        device.product == data.productId &&
        device.vendor == data.vendorId
    ));



    if (!device) return;
    const deviceConfig = {
        vendorId: device.vendor,
        productId: device.product,
        productName: device.name,
    };

    RegisterDevice(deviceConfig);
    ccg.deviceList.add(deviceConfig);
});



ipcMain.on("setLang", (event, lang) => {
    let l = Config.lang;
    Config.lang = lang ||="en-US";
    if (Config.lang === l) return;
    console.log(`Config updated from ${l} to ${Config.lang}`);

    ccg.saveConfig();
    app.relaunch();
    app.exit(0);
});

app.on("window-all-closed", () => {
    // macOS Ausnahme
    if (process.platform !== "darwin") {
        app.quit();
    };
});

ipcMain.on("openExternal", (event, url) => {
    shell.openExternal(url);
});

let lastdetectInput = null;

ipcMain.on("canceldI", () => {});
ipcMain.on("deletedI", (event, data) => {});

ipcMain.handle("detectInput", async (event, name) => {
    if (lastdetectInput === name) {
        lastdetectInput = null;
        dct.clean();
        return {type: "cancel"}
    };

    const active = []
    cDevice.Slots.forEach((entry, slot) => {
        if (!entry?.device) return;
        active.push({slot, device: entry.device, info: entry.info});
    });

    if (!active.length) return { type: "error", error: L("detectInputE0") };

    const resp = await dct.detectInput3(active);
    if (lastdetectInput === name) {
        lastdetectInput = null;
    };

    if (!resp) return { type: "error", error: L("detectInputE1") };
    const sl = cDevice.Slots[resp.slot]
    if (!sl) return { type: "error", error: L("detectInputE2") };
    
    ccg.setMapping({
        productId: sl.info.productId,
        vendorId: sl.info.vendorId,
        key: resp.key,
        name
    })

    return {
        type: "success",
        name: resp?.name
    }
});


app.on("before-quit", (e) => {
    // cDevice.Slots.forEach((entry, slot) => {
    //     if (!entry?.device) return;
    //     entry.device.removeAllListeners("data");
    //     entry.device.close();
    // });
});

let pcd829 = Date.now();
app.whenReady().then(async () => {
    const wsf = wsframes.loading();

    new Notification({
        title: 'HorizonMods',
        body: 'Welcome on our Skys' + (Config.devmode ? '\n you are running a Development BUILD' : `\nyou are running version ${Config.version}`)
    }).show();


    let pcd830 = Date.now();
    try {mainWindow = wsframes.main();}
    catch (error) {console.error("mainWindow", error);}
    // mainWindow.show();


    mainWindow.webContents.on("did-fail-load", (e, code, desc) => {
        console.error("Load Fehler:", code, desc);
    });
    

    ipcMain.once("clientReady", () => {
        let rd = Date.now();

        wsf.destroy();
        mainWindow.show();

        if (Config.devmode) new Notification({
            title: 'HorizonMods',
            body: `INTER: ${(rd - pcd829)}ms - Init: ${(rd - pcd830)}ms`
        }).show();
    });
    
    for (const [, device] of Object.entries(ccg.deviceList.data)) {
        RegisterDevice(device);
    }

    if (Config.devmode) new Notification({
        title: 'HorizonMods',
        body: `CLReady: ${(Date.now() - pcd829)}ms`
    }).show();

    try {wss.startServer()}
    catch {};
});

function RegisterDevice(dev) {
    try {
        const con = new deviceInteraction(dev);

        con.on("disconnected", () => {
            console.log("Gerät Entfernt", dev.productName);
            
            if (mainWindow) mainWindow.webContents.send("server:onDeviceConnection", {
                vendorId: dev.vendorId,
                productId: dev.productId,
                locales: con.locales,
                connected: false
            });
        });
        con.on("connected", () => {
            console.log("Gerät Verbunden", dev.productName);

            if (mainWindow) mainWindow.webContents.send("server:onDeviceConnection", {
                vendorId: dev.vendorId,
                productId: dev.productId,
                locales: con.locales,
                connected: false
            });
        });

        con.on("keyPress", (name, mapping) => {
            if (mainWindow) mainWindow.webContents.send("server:onDeviceInput:keyPress", {
                name, mapping,
                vendorId: dev.vendorId,
                productId: dev.productId
            });
            
            if (Config.Stadia && mapping) wss.emit({
                name: mapping.mapName,
                type: "keyPress"
            });
        });

        con.on("keyRelease", (name, mapping) => {
            if (mainWindow) mainWindow.webContents.send("server:onDeviceInput:keyRelease", {
                name, mapping,
                vendorId: dev.vendorId,
                productId: dev.productId
            });
            
            if (Config.Stadia && mapping) wss.emit({
                name: mapping.mapName,
                type: "keyRelease"
            });
        });

        con.on("axis", (name, value, raw, percent, mapping) => {
            // console.log(`name: ${name}; value: ${value}; raw:${raw}; percent: ${percent}%; ${mapping}`);
            if (mainWindow) mainWindow.webContents.send("server:onDeviceInput:axis", {
                name, value, raw, mapping, percent,
                vendorId: dev.vendorId,
                productId: dev.productId,
            });

            if (Config.Stadia && mapping) wss.emit({
                name: mapping.mapName,
                type: "axis",
                value, raw, mapping, percent
            });
        });

        con.on("hat", (name, value, mapping) => {
            if (mainWindow) mainWindow.webContents.send("server:onDeviceInput:hat", {
                name, value, mapping,
                vendorId: dev.vendorId,
                productId: dev.productId,
            });
            
            if (Config.Stadia && mapping) wss.emit({
                name: mapping.mapName,
                type: "hat",
                key: name,
                value, mapping
            });
        });

        con.on("hatbutton", (name, pressed, mapping) => {
            if (mainWindow) mainWindow.webContents.send("server:onDeviceInput:hatbutton", {
                name, mapping, pressed,
                vendorId: dev.vendorId,
                productId: dev.productId,
            });
            
            if (Config.Stadia && mapping) wss.emit({
                name: mapping.mapName,
                type: "hatbutton",
                key: name,
                pressed, mapping
            });
        });

        if (!mainWindow) return console.log("no Screen");

        mainWindow.webContents.send("server:deviceStatus", {
            vendorId: dev.vendorId,
            productId: dev.productId,
            productName: dev.product || dev.productName,
            connected: con.joystick ? true : false,
            locales: con.locales
        });

    } catch (error) {
        console.error(error?.code ?? error);
    }
}


ipcMain.on("deiveCreateLocales", async (event, dev) => {
    const device = deviceInteraction.findDevice(dev.vendorId, dev.productId);
    if (!device) return;
    device.createLocales(false);
});

ipcMain.on("deiveLoadLocales", async (event, dev) => {
    const device = deviceInteraction.findDevice(dev.vendorId, dev.productId);
    if (!device) return;
    await device.loadLocales();

    if (mainWindow) mainWindow.webContents.send("server:deviceLocales", {
        vendorId: dev.vendorId,
        productId: dev.productId,
        locales: device.locales,
        maps: ccg.Mapping.data
    });
});


ipcMain.handle("presets", (event, data) => {
    switch (data.action) {
        case "add": return ccg.Mapping.preset.add(data.name);
        case "remove": return ccg.Mapping.preset.remove(data.id);
        case "updateName": return ccg.Mapping.preset.updateName(data.id, data.name);
        case "loadIdNames": return ccg.Mapping.preset.getIdNames();
        case "selectPreset": return ccg.Mapping.preset.select(data.id);
    }
});

ipcMain.on("stadiaUpdate", (event, state) => {
    console.log("state", state);


    Config.Stadia = state;
    ccg.saveConfig();
});