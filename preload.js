const { contextBridge, ipcRenderer, shell } = require('electron');

let ocn = null;

contextBridge.exposeInMainWorld('CoreAPI', {
    bindingEvent: (...args) => ipcRenderer.invoke("bindingEvent", ...args),
    requestData: (...args) => ipcRenderer.invoke("requestData", ...args),
    removeDevice: (data) => ipcRenderer.invoke("removeDevice", data),
    

    sendReady: () => ipcRenderer.send("clientReady"),
    setInputType: (type) => ipcRenderer.send("setInputType", type),
    updatePage: (...args) => ipcRenderer.send("updatePage", ...args),

    send: (event, ...args) => ipcRenderer.send(event, ...args),
    invoke: (event, ...args) => ipcRenderer.invoke(event, ...args),
    openExternal: (url) => ipcRenderer.send("openExternal", url),

    selectDevice: (data) => ipcRenderer.send("selectDevice", data),

    on: (channel, callback, p2) => ipcRenderer.on(channel, callback),



    OnDeviceInput (callback) {
        const EventOne = (_, data) => callback("hat", data);
        const EventTwo = (_, data) => callback("axis", data);
        const EventThree = (_, data) => callback("keyPress", data);

        ipcRenderer.on("server:onDeviceInput:hat", EventOne);
        ipcRenderer.on("server:onDeviceInput:axis", EventTwo);
        ipcRenderer.on("server:onDeviceInput:keyPress", EventThree);

        return () => {
            ipcRenderer.off("server:onDeviceInput:hat", EventOne);
            ipcRenderer.off("server:onDeviceInput:axis", EventTwo);
            ipcRenderer.off("server:onDeviceInput:keyPress", EventThree);
        }
    },
});