import fs from "fs";
import path from "path";
import { app } from "electron";

let logFile;

(async function Inject () {
    const logDir = path.join(app.getPath("temp"), "HorizonMods", "InputHelper");
    fs.mkdirSync(logDir, { recursive: true });

    const safeDate = new Date().toISOString().replace(/[:.]/g, "-");
    logFile = path.join(logDir, `${safeDate}.log`);
    fs.writeFileSync(logFile, "");
})().catch(() => {});

globalThis.writeLog = (type="", ...args) => {
    if (!logFile) return;
    const time = new Date().toISOString();

    const message = args.map(a => {
        if (typeof a === "object") {
            try {return JSON.stringify(a, null, 1) + "\n\n"}
            catch (error) {return "[Object]"}
        };
        return a;
    }).join(" ");


    ensureFile(logFile);
    fs.appendFileSync(logFile, `[${time}] ${type} ${message}\n`);
}

const originalLog = console.log;
const originalWarn = console.warn;
const originalError = console.error;

console.log = (...args) => {
    originalLog(...args);
    writeLog("[LOG]:", args);
};

console.warn = (...args) => {
    originalWarn(...args);
    writeLog("[WARN]:", args);
};

console.error = (...args) => {
    originalError(...args);
    writeLog("[ERROR]:", args);
};

globalThis.ensureFile = function(name) {
    const dir = path.dirname(name);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}