import { app } from "electron";
import loadjson from "./loadjson.js";
import fs from "node:fs";
import path from "node:path";

export const frontendCfg = {};

const cdpaths = {};
cdpaths.docs = app.getPath("documents");
cdpaths.app = app.getAppPath()
cdpaths.mapping = path.join(cdpaths.docs, "HorizonMods", "InputHelper", "mapping.json");
cdpaths.devices = path.join(cdpaths.docs, "HorizonMods", "InputHelper", "devices.json");

cdpaths.config = path.join(cdpaths.docs, "HorizonMods", "InputHelper", "Config.json");
cdpaths.locales = path.join(cdpaths.docs, "HorizonMods", "InputHelper", "locales");
cdpaths.devLocales = path.join(cdpaths.docs, "HorizonMods", "InputHelper", "locales", "devices");
cdpaths.cInputs = path.join(cdpaths.app, "Config", "Intern", "Inputs.json");
cdpaths.dlocales = path.join(cdpaths.app, "Config", "locales");

export const Config = await loadjson(cdpaths.config, {});
Config.language ||= "en-US";
Config.cfx ??= {};
Config.cfx.port ??=3001;
Config.discordPresence??={};
Config.discordPresence.enable ??=true;
Config.discordPresence.notify ??=false;
Config.filteredDevices ??=true;
Config.Stadia ??= false;


export const saveConfig = () => {
    ensureFile(cdpaths.config);
    fs.writeFileSync(cdpaths.config, JSON.stringify(
        Config, null, 2
    ));
};


app.whenReady().then(saveConfig);

export const InputFields = loadjson(cdpaths.cInputs, []);
export const Mapping = {};
Mapping.data = await loadjson(cdpaths.mapping, {});
Mapping.data.presets ??= {};

Mapping.preset = {};
Mapping.preset.id = Mapping.data.id ?? false;

Mapping.LinkedData = {};

Mapping.save = () => {
    ensureFile(cdpaths.mapping);
    fs.writeFileSync(cdpaths.mapping, JSON.stringify(
        Mapping.data, null, 2
    ));
};

Mapping.getLinked = (vendorId, productId, ...keyNames) => {
    const preset = Mapping.getCurrentPreset();
    if (!preset) return;

    const result = [];
    for (const keyName of keyNames) {
        const keyItem = `${vendorId}:${productId}:${keyName}`;

        for (const id of (preset.inputs?.[keyItem] || [])) {
            const mapping = preset.mapping[id];
            if (mapping) result.push(mapping);
        };
    };
    return result;
};

Mapping.getCurrentPreset = () => {
    const id = Mapping.data.selectedPreset;
    return (id && Mapping.data.presets[id]) || null;
}

Mapping.remove = (name, slotId) => {
    const mapId = `${name}:${slotId}`

    const present = Mapping.getCurrentPreset();
    if (!present || !present.mapping[mapId]) return console.log("invalid");

    const keyItem = present.mapping[mapId].keyItem;

    present.inputs ??= {};
    if (present.inputs[keyItem]) {
        present.inputs[keyItem] = present.inputs[keyItem].filter(id => id !== mapId);
        if (present.inputs[keyItem].length === 0) {
            delete present.inputs[keyItem];
        };
    }

    delete present.mapping[mapId];
    Mapping.save();

    return {
        maps: present.mapping,
        removed: []
    }
};

Mapping.add = (name, slotId, vendorId, productId, keyName, options={}) => {
    const present = Mapping.getCurrentPreset();
    if (!present) return;
    
    const keyItem = `${vendorId}:${productId}:${keyName}`;
    const mapId = `${name}:${slotId}`;

    present.inputs ??= {};
    present.mapping[mapId] = {
        keyItem,
        keyName: keyName,
        slotId: slotId,
        Inverted: false,
        zeroInvert: false,
        Signed: false,
        Leverswitch: false,
        IsHatButton: options.IsHatButton==true,
        mapName: name
    };

    for (const input in present.inputs) {
        present.inputs[input] = present.inputs[input].filter(id => id !== mapId);
        if (present.inputs[input].length === 0) {
            delete present.inputs[input];
        };
    };

    present.inputs[keyItem] ??= [];
    if (!present.inputs[keyItem].includes(mapId)) {
        present.inputs[keyItem].push(mapId);
    }

    Mapping.save();

    return {
        keyItem, mapId,
        maps: present.mapping,
        removed: []
    }
};

Mapping.update = (name, slotId, data) => {
    const mapId = `${name}:${slotId}`;
    const present = Mapping.getCurrentPreset();
    if (!present || !present.mapping[mapId]) return;

    for (const key in data) switch (key) {
        case "Inverted":        present.mapping[mapId][key] = data[key]==true; break;
        case "zeroInvert":      present.mapping[mapId][key] = data[key]==true; break;
        case "Signed":          present.mapping[mapId][key] = data[key]==true; break;
        case "Leverswitch":     present.mapping[mapId][key] = data[key]==true; break;
        case "toSignedAxis":    present.mapping[mapId][key] = data[key]==true; break;
        default:                present.mapping[mapId][key] = data[key]; break;
    };

    Mapping.save();
    return present.mapping;
};


Mapping.preset.getIdNames = () => ({
    currentId: Mapping.data.selectedPreset,
    data: Object.entries(Mapping.data.presets).map(([id, value]) => ({
        id, name: value.name
    }))
});

Mapping.preset.select = (id) => {
    const data = Mapping.data.presets[id];

    Mapping.data.selectedPreset = data ? id : false;
    Mapping.save();

    if (!data) return;
    return {mapping: data.mapping, id, name: data.name};
}

Mapping.preset.getMapping = () => {
    const selected = Mapping.data.selectedPreset;
    return (selected && Mapping.data.presets[selected]?.mapping) || null;
};

Mapping.preset.add = (presetName) => {
    const Id = String(getNextStringId(Mapping.data.presets));
    let name = presetName || "present " + Id;
    Mapping.data.presets[Id] = {
        name,
        mapping: {},
    };

    Mapping.save();
    return {id: Id, name};
};

Mapping.preset.remove = (id) => {
    if (!Mapping.data.presets[id]) return;
    delete Mapping.data.presets[id];
    Mapping.save();
};

Mapping.preset.updateName = (id, presetName) => {
    if (!Mapping.data.presets[id] || !presetName) return;
    Mapping.data.presets[id].name = presetName;
    Mapping.save();
};


export const deviceList = {};
deviceList.data = await loadjson(cdpaths.devices, {});

deviceList.save = () => {
    ensureFile(cdpaths.devices);
    fs.writeFileSync(cdpaths.devices, JSON.stringify(
        deviceList.data, null, 2
    ));
};

deviceList.add = (device) => {
    const code = `${device.vendorId}:${device.productId}`;
    if (deviceList.data[code]) return;

    deviceList.data[code] = {
        vendorId: device.vendorId,
        productId: device.productId,
        productName: device.product || device.productName
    };

    deviceList.save();
};
deviceList.remove = (vendorId, productId) => {
    const code = `${vendorId}:${productId}`;
    if (!deviceList.data[code]) return;
    delete deviceList.data[code];
    deviceList.save();
};



const localeData =  await Promise.all([
    loadjson(path.join(cdpaths.locales, `${Config.language}.json`), {}),
    loadjson(path.join(cdpaths.dlocales, `${Config.language}.json`), {})
]);


const reGenerateDir = (location) => {
    if (!fs.existsSync(location)) {
        fs.mkdirSync(location, { recursive: true });
    }
}

(function() {
    reGenerateDir(cdpaths.locales);
    reGenerateDir(cdpaths.devLocales);
    for (const file of fs.readdirSync(cdpaths.dlocales)) {
        fs.copyFileSync(
            path.join(cdpaths.dlocales, file),
            path.join(cdpaths.locales, file)
        );
    };
})();

export const locales = {
    ...localeData[1],
    ...localeData[0]
}

async function mergeJSON(srcPath, destPath) {
    const response = await Promise.all([
        loadjson(srcPath, {}),
        loadjson(destPath, {}),
    ]);

    fs.writeFileSync(destPath, JSON.stringify({
        ...response[0],
        ...response[1]
    }, null, 2));
}

function getLocale(key, alt, params = {}) {
    let text = locales?.[key] || alt || `{{${key}}}`;

    return text.replace(/\{\{(\w+)\}\}/g, (_, name) => {
        const value = Object.entries(params)
            .find(([k]) => k.toLowerCase() === name.toLowerCase())?.[1];

        return value ?? `{${name}}`;
    });
}

globalThis.L = getLocale;
String.prototype.translate = function(alt) {
    return getLocale(this, alt)
};


export function saveDeviceLocale (name, data) {
    const fileName = path.join(cdpaths.devLocales, `${name}.json`);
    ensureFile(fileName);
    fs.writeFileSync(fileName, JSON.stringify(data, null, 2));
};

export async function loadDeviceLocale(name, alt) {
    return loadjson(path.join(cdpaths.devLocales, `${name}.json`), alt);
};




export function getNextStringId(data) {
    if (!data) return 1;
    const ids = Object.keys(data).map(Number);
    return ids.length > 0 ? Math.max(...ids) + 1 : 1;
}