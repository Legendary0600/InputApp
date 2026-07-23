import EventEmitter from "node:events";
import sdl from "@kmamal/sdl";
import * as cfg from "./config.js";

export default class InputDevice extends EventEmitter {
    static devices = new Map();

    static getDevice(vendorId, productId) {
        sdl.joystick.devices.find(p => (
             p.vendor===vendorId &&
             p.product===productId
        ));
    }

    getDevice() {
        return sdl.joystick.devices.find(p => (
            p.vendor===this.vendorId &&
            p.product===this.productId
        ));
    };

    static currentDevices = () => [...InputDevice.devices.values()].map(device => ({
        vendorId: device.vendorId,
        productId: device.productId,
        productName: device.productName,
        connected: device.joystick?true:false,
        locales: device.locales
    }));

    
    static findDevice(vendorId, productId) { 
        return InputDevice.devices.get(`${vendorId}_${productId}`);
    }

    constructor(dev) {
        super();

        this.code = `${dev.vendorId}_${dev.productId}`;
        if (InputDevice.devices.has(this.code)) {
            const err = new Error(`Device already connected: ${this.code}`);
            err.code = 5;
            throw err;
        };

        this.productId   = dev.productId;
        this.vendorId    = dev.vendorId;
        this.productName = dev.productName;
        this.Initialised = false;
        this.callbacks = {};
        this.locales = {};

        InputDevice.devices.set(this.code, this);
        this.finalInit();
    };

    async finalInit() {
        await this.loadLocales().catch((err) => {
            console.error(err);
        });

        await this.connectDevice(this.getDevice()).catch(err => {
            console.error(err);
        });

        this.Initialised = true;
    }


    async disconnectDevice() {
        try {if (this.joystick) this.joystick.close();} catch {}

        this.joystick = null;
        this.emit("disconnected");
    }

    async connectDevice(device) {
        if (!device) return;
        if (this.joystick) return;

    
        try {
            this.joystick = sdl.joystick.openDevice(device);
            this.regitEvents();
            this.emit("connected");
        } catch (error) {
            this.joystick = null;
            console.log(`ERROR ON CONNECT ${error}`);
        }

    }

    close () {
        if (this.code) InputDevice.devices.delete(this.code);
        this.disconnectDevice();

    }

    getMapping(...args) {
        return cfg.Mapping.getLinked(this.vendorId, this.productId, ...args);
    }

    regitEvents() {
        this.joystick.on("close", (data) => {
            this.joystick = null;
        });

        this.joystick.on("buttonDown", (data) => {
            const name = `button_${data.button}`;
            const mappings = this.getMapping(name);
            if (!mappings.length) return this.emit("keyPress", name, null);
            for (const mapping of mappings) {
                this.emit("keyPress", name, mapping);
            };
        });
        this.joystick.on("buttonUp", (data) => {
            const name = `button_${data.button}`;
            const mappings = this.getMapping(name);
            if (!mappings.length) return this.emit("keyRelease", name, null);
            for (const mapping of mappings) {
                this.emit("keyRelease", name, mapping);
            };
        });

        const hatMotions = {}
        this.joystick.on("hatMotion", (data) => {
            const name = `hat_${data.hat}`;
            const subName = `${name}:${data.value}`;

            const mappings = this.getMapping(name, `${name}:${data.value}`, hatMotions[data.hat]);
            if (!mappings.length) {
                hatMotions[data.hat] = subName;
                return this.emit("hat", name, data.value, null);
            }

            let hasNormal = false;
            for (const mapping of mappings) {
                if (mapping.IsHatButton) {
                    let pressed = true;
                    if (hatMotions[data.hat] == mapping.keyName) {
                        pressed = false;
                    };

                    this.emit("hatbutton", mapping.keyName, pressed, mapping);
                    continue;
                };

                this.emit("hat", mapping.keyName, data.value, mapping);
                hasNormal = true;
            };

            if (!hasNormal) this.emit("hat", name, data.value, null);

            hatMotions[data.hat] = subName;
        });


        const lastValues = {}
        this.joystick.on("axisMotion", (data) => {
            const name = `axis_${data.axis}`;
            

            const value = Number(data.value.toFixed(2));
            if (lastValues[name] === value) return;
            lastValues[name] = value;

            const mappings = this.getMapping(name);
            if (!mappings.length) return this.emit("axis", name, value, value, this.getPercent(value), null);

            for (const mapping of mappings) {
                const normal = this.normalize(value, mapping);
                const percent = this.getPercent(normal, mapping);

                    
                console.log(normal, mapping.toSignedAxis, percent+"%");
                if (Number.isNaN(normal)) continue;
                this.emit("axis", name, normal, value, percent, mapping);
            };
        });

        this.joystick.on("powerUpdate", (data) => {
            // console.log(data);
        });

        this.joystick.on("ballMotion", (data) => {
            // console.log(data);
        });


        this.createLocales(true);
    }


    getPercent(value, config={}) {
        if (config.Signed) return Math.round(((value + 1) / 2) * 100);
        return Math.round(value * 100);
    }

    normalize(value, config) {
        if (!config) return value;

        let output = value;

        if (config.toSignedAxis) {
            output = (output * 2) - 1;
        };

        if (config.zeroInvert) {
            output = (output + 1) / 2;
        };


        if (config.Inverted) {
            if (config.Signed) {
                output = -output;
            } else {
                output = 1 - output;
            }
        }

        if (!config.Signed && !config.zeroInvert && !config.toSignedAxis) {
            output = (output + 1) / 2;
        }

        return Math.max(-1, Math.min(1, output));
    }

    createLocales(onlyupdated) {
        try {
            if (!this.joystick) return {
                error: "DEVICE_NOT_CONNECTED"
            };

            let changed = false;
            this.countInputs((name, id) => {
                const cname = `${name}_${id}`;

                if (!this.locales[cname]) {
                    this.locales[cname] = `${this.productName} - ${cname}`;
                    changed = true;
                };
            });

            if (!onlyupdated || changed) {
                cfg.saveDeviceLocale(this.code, this.locales);
            }
        } catch (error) {
            console.error(error);
        }

    };
    async loadLocales() {
        this.locales = await cfg.loadDeviceLocale(this.code, {});
    };

    countInputs(cb) {

        const axes = this.joystick.axes?.length ?? 0;
        const buttons = this.joystick.buttons?.length ?? 0;
        const hats = this.joystick.hats?.length ?? 0;
        const balls = this.joystick.hats?.balls ?? 0;
        const power = this.joystick.hats?.power ?? 0;

        const count = (max, callback) => {
            if (!max) return;
            for (let i = 0; i < max; i++) callback(i);
        };

        count(this.joystick.axes?.length, (i) => cb("axis", i));
        count(this.joystick.buttons?.length, (i) => cb("button", i));
        count(this.joystick.balls?.length, (i) => cb("ball", i));
        count(this.joystick.power?.length, (i) => cb("power", i));
    }
}


let IsScanning = false;
setInterval(async () => {
    if (IsScanning) return;
    IsScanning = true;


    try {

        const devices = sdl.joystick.devices;

        for (const [key, device] of InputDevice.devices) {
            const joystick = devices.find(j =>
                j.vendor === device.vendorId &&
                j.product === device.productId
            );

            if (!joystick && device.joystick) {
                device.disconnectDevice();
                continue;
            };

            // Gerät ist vorhanden aber nicht verbunden
            if (joystick && !device.joystick && joystick.Initialised) {
                device.connectDevice(joystick);
            };
        };

    } catch (err) {
        console.error(err);
    } finally {
        IsScanning = false;
    }
}, 1000);