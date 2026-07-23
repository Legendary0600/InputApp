const Index = {}
const Config = {};

import { deviceLocales } from "./modules/deviceItem.js";


let Items = {};
let ItemsBox = {};

let lastIcs="";

let InSelect = false;
window.addEventListener("DOMContentLoaded", async () => {
    Index.page = document.querySelector(".InputManager");
    Index.imp = Index.page.querySelector(".inputmapps");

    const deviceSelect = document.querySelector(".device-select");
    const devicesLoading = deviceSelect.querySelector(".loading");
    const deviceList = deviceSelect.querySelector(".inner");
    const deviceCancel = deviceSelect.querySelector("button");


    const closeDeviceSelector = () => {
        deviceList.innerHTML = "";
        deviceSelect.classList.remove("show");
        devicesLoading.classList.remove("show");
    }

    deviceCancel.addEventListener("click", closeDeviceSelector, {passive: true});

    
    const selectDevice = document.querySelector(".add-device");
    selectDevice?.addEventListener("click", async (e) => {
        if (selectDevice.disabled) return;
        selectDevice.disabled = true;

        deviceSelect.classList.add("show");
        devicesLoading.classList.add("show");

        deviceList.innerHTML = "";
        await window.CoreAPI.requestData("devices").then((resp) => {
            for (const i of resp) {
                const div = document.createElement("div");
                div.textContent = i.productName;
                deviceList.appendChild(div);

                div.addEventListener("click", () => {
                    closeDeviceSelector();
                    window.CoreAPI.selectDevice(i);
                });
            }

        }).catch(() => closeDeviceSelector());

        
        selectDevice.disabled = false;
        devicesLoading.classList.remove("show");

    }, {passive: true});
});


export const load = async () => {    
    await window.CoreAPI.requestData("Inputs").then(resp => {
        loadIndexItems(resp);
    });


    await window.CoreAPI.requestData("currentMappings").then(resp => {
        if (resp) loadMappedBinds(resp);
    });

    const buttonSelect = (keyCode, InpuType, percent, mapping, data) => {
        if (!ItemsBox[keyCode]) return;

        switch (InpuType) {
            case "button": {
                if (mapping.slotId == 1) Items[mapping.mapName].FieldOne.card.InputPress(percent, mapping, data);
                if (mapping.slotId == 2) Items[mapping.mapName].FieldTwo.card.InputPress(percent, mapping, data);
            }; break;
            case "axis": {
                if (mapping.slotId == 1) Items[mapping.mapName].FieldOne.card.InputAxis(percent, mapping, data);
                if (mapping.slotId == 2) Items[mapping.mapName].FieldTwo.card.InputAxis(percent, mapping, data);
            }; break;
            case "hat": {
                if (mapping.slotId == 1) Items[mapping.mapName].FieldOne.card.hatSwitch(false, percent, mapping, data);
                if (mapping.slotId == 2) Items[mapping.mapName].FieldTwo.card.hatSwitch(false, percent, mapping, data);
            }; break;
            case "hatbutton": {
                if (mapping.slotId == 1) Items[mapping.mapName].FieldOne.card.hatSwitch(true, percent, mapping, data);
                if (mapping.slotId == 2) Items[mapping.mapName].FieldTwo.card.hatSwitch(true, percent, mapping, data);
            }; break;
        };
    };
    


    window.CoreAPI.on("server:onDeviceInput:hat", (event, data) => {
        buttonSelect(`${data.vendorId}:${data.productId}:${data.name}`, "hat", data.value, data.mapping, data);
    });

    window.CoreAPI.on("server:onDeviceInput:axis", (event, data) => {
        buttonSelect(`${data.vendorId}:${data.productId}:${data.name}`, "axis", data.percent, data.mapping, data);
    });
    
    window.CoreAPI.on("server:onDeviceInput:keyPress", (event, data) => {
        buttonSelect(`${data.vendorId}:${data.productId}:${data.name}`, "button", 100, data.mapping, data);
    });
    window.CoreAPI.on("server:onDeviceInput:keyRelease", (event, data) => {
        buttonSelect(`${data.vendorId}:${data.productId}:${data.name}`, "button", 0, data.mapping, data);
    });
    window.CoreAPI.on("server:onDeviceInput:hatbutton", (event, data) => {
        buttonSelect(`${data.vendorId}:${data.productId}:${data.name}`, "hatbutton", data.pressed, data.mapping, data);
    });

    
};


    

export function loadMappedBinds(data, removedList=[]) {
    removeMappedBinds();

    if (typeof data !== "object") return;
    for (const key in data) {
        const {keyItem, keyName} = data[key];
        const [slotName, slotId] = key.split(":");
        const [vendorId, productId] = keyItem.split(":");

        if (!Items[slotName]) continue;

        const cdName = deviceLocales[`${vendorId}_${productId}`]?.[keyName] || keyName;
        if (slotId == 1) {
            Items[slotName].FieldOne.card.setKeybind(cdName, keyItem, data[key]);
            if (data[key].IsHatButton) Items[slotName].FieldOne.hatToggler.dataset.active = true;
        }
        if (slotId == 2) {
            Items[slotName].FieldTwo.card.setKeybind(cdName, keyItem, data[key]);
            if (data[key].IsHatButton) Items[slotName].FieldTwo.hatToggler.dataset.active = true;
        }
    }
}

export function removeMappedBinds() {
    for (const keyName in Items) {
        Items[keyName].FieldOne.card.removeKeybind();
        Items[keyName].FieldTwo.card.removeKeybind();
        
        Items[keyName].FieldOne.card.stopHatToggle();
        Items[keyName].FieldTwo.card.stopHatToggle();
        Items[keyName].hatSwitch.clean();

        for (const i in Items[keyName].FieldOne.Buttons || {}) {
            Items[keyName].FieldOne.Buttons[i].classList.remove("active");
        };
        
        for (const i in Items[keyName].FieldTwo.Buttons || {}) {
            Items[keyName].FieldTwo.Buttons[i].classList.remove("active");
        };
    }
}

function loadIndexItems(data) {
    for (const main of data ?? []) {
        const headline = createHeadLine();

        const div = document.createElement("div");
        const cdiv = document.createElement("div");
        const ldiv = document.createElement("div");

        div.className = "stlcmd";
        cdiv.className = "stlcmdc";
        ldiv.className = "stlcmdl";
        
        ldiv.dataset.locale = main.locale;
        ldiv.textContent = main.locale?.translate?.();


        cdiv.appendChild(headline);
        
        div.appendChild(ldiv);
        div.appendChild(cdiv);
        Index.imp.appendChild(div);

        createInformIcon(ldiv, main);
        for (const group of main.group ?? []) {
            const cd = document.createElement("div");
            const dname = document.createElement("div");


            cd.className = "Selector";
            cd.dataset.name = group.name;

            cd.gName = group.locale?.translate?.() || group.label;
            dname.className = "name xp927";

            cd.classList.toggle("c360", !!group.signed);
            
            dname.dataset.locale = group.locale;
            dname.textContent = cd.gName;


            cd.appendChild(dname);


            const FieldOne = createSelector(cd, 1, group.name);
            const FieldTwo = createSelector(cd, 2, group.name);
            const hatSwitch = createHatDisplay(cd, group);
            createInformIcon(dname, group)



            const kp = (event) => {switch (event.key) {
                case "Escape": return window.CoreAPI.send("canceldI");
                case "Delete": return window.CoreAPI.send("deletedI");
            }};


            const onSelect = async (e, Item, slotId) => {
                if (InSelect) return;
                InSelect = true;

                Item.card.classList.add("pending");

                const that = Item.hatToggler;


                
                for (const [name, csub] of Object.entries(Items)) {
                    csub.main.classList.add("disabled-action");
                }

                const Index = {};

                Index.Unsubscribe = window.CoreAPI.OnDeviceInput(async (eventName, data) => {
                    Index.cleanSubscriptions();
                    let cdname = data.name;
                    const options = {};

                    switch (eventName) {
                        case "hat": {
                            if (that.dataset.active) {
                                cdname = `${data.name}:${data.value}`;
                                options.IsHatButton = true;
                            };
                        }; break;
                    };
                    
                    if (data.name) {
                        const resp = await window.CoreAPI.bindingEvent("Place", group.name, slotId, {
                            vendorId: data.vendorId,
                            productId: data.productId,
                            keyCode: cdname,
                            options
                        }).catch(() => null);

                        if (resp.maps) loadMappedBinds(resp.maps, resp.removed ?? []);
                    }

                    Index.cleanUp();
                });

                Index.KeyPress = async (event) => {
                    switch (event.key) {
                        case "Escape": {
                            Index.cleanUp();
                        }; break;
                        case "Delete": {
                            Index.cleanSubscriptions();
                            const response = await window.CoreAPI.bindingEvent("Delete", group.name, slotId).catch(() => null);
                            if (response) loadMappedBinds(response.maps, response.removed ?? []);
                            Index.cleanUp();
                        }; break;
                    }
                }

                Index.cleanSubscriptions = () => {
                    Index.Unsubscribe();
                    window.removeEventListener("keyup", Index.KeyPress);
                }

                Index.cleanUp = () => {
                    Index.Unsubscribe();
                    window.removeEventListener("keyup", Index.KeyPress);
                    InSelect = false;
                    
                    Item.card.classList.remove("pending");

                    for (const [name, csub] of Object.entries(Items)) {
                        csub.main.classList.remove("disabled-action");
                    }
                };

                window.addEventListener("keyup", Index.KeyPress);
            }

            FieldOne.main.addEventListener("click", (e) => onSelect(e, FieldOne, 1));
            FieldTwo.main.addEventListener("click", (e) => onSelect(e, FieldTwo, 2));

            Items[group.name] = {
                main: cd,
                FieldOne: FieldOne,
                FieldTwo: FieldTwo,
                hatSwitch: hatSwitch,
                labelDiv: dname,
            };
            cdiv.appendChild(cd);
        };
    }
};


function createSelector(parent, slotId, groupName, device) {
    const div = document.createElement("div");
    div.className = "action";
    div.setAttribute("slotId", slotId);

    const container = document.createElement("div");
    container.className = "container";

    
    const fieldOne = document.createElement("span");
    const fieldTwo = document.createElement("span");

    
    const mainParent = document.createElement("div");
    mainParent.className = "mainparent";

    const subParent = document.createElement("div");
    subParent.className = "subparent";

    fieldTwo.className = "progress";
    fieldOne.className = "x8746";

    
    mainParent.appendChild(fieldOne);
    mainParent.appendChild(fieldTwo);


    container.appendChild(mainParent);
    container.appendChild(subParent);

    
    const hatToggler = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    hatToggler.innerHTML = `<path d="M480-654Zm174 174Zm-348 0Zm174 174Zm0-234L360-660v-220h240v220L480-540Zm180 180L540-480l120-120h220v240H660Zm-580 0v-240h220l120 120-120 120H80ZM360-80v-220l120-120 120 120v220H360Zm120-574 40-40v-106h-80v106l40 40ZM160-440h106l40-40-40-40H160v80Zm280 280h80v-106l-40-40-40 40v106Zm254-280h106v-80H694l-40 40 40 40Z"/>`;
    hatToggler.setAttribute("viewBox", "0 -960 960 960");
    hatToggler.setAttribute("fill", "currentColor");
    hatToggler.setAttribute("class", "hat-toggler");
    hatToggler.dataset.tooltip=true;
    hatToggler.tooltipText=L("tooltip_hatToggler");

    hatToggler.addEventListener("click", () => {
        (
            hatToggler.dataset.active
            ? delete hatToggler.dataset.active
            : hatToggler.dataset.active = true
        );
    });


    div.appendChild(hatToggler);
    div.appendChild(container);
    parent.appendChild(div);


    const Buttons = createInteractIcons(subParent);
    const textInput = document.createElement("div");
    textInput.className = "ov-hidden ovtelp";
    fieldOne.appendChild(textInput);


    for (const btnName in Buttons) {
        const btn = Buttons[btnName];
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();

            if (btn.dataset.disabled) return;
            if (!div.dataset.keybind) return;

            const has = !btn.classList.contains("active");

            const options = {};
            options[btnName] = has;

            window.CoreAPI.bindingEvent("Update", groupName, slotId, options).catch(() => null).then(resp => {
                if (resp) loadMappedBinds(resp);
            });
        });
    }


    div.setKeybind = (text, kb, cdata) => {
        textInput.textContent = text;
        div.dataset.keybind = kb;

        ItemsBox[kb] = div;
        
        for (const bName in Buttons) {
            delete Buttons[bName].dataset.disabled;
            Buttons[bName].classList.toggle("active", !!cdata[bName]);
        };
    };

    div.removeKeybind = () => {
        textInput.textContent = "";
        let kb = div.dataset.keybind;
        delete div.dataset.keybind;
        delete ItemsBox[kb];

        div.classList.remove("cs360");
        div.style.setProperty("--cwinputs", "");
        div.style.setProperty("--translatex", "");

        for (const bName in Buttons) {
            Buttons[bName].dataset.disabled=true;
        };
    };

    div.InputPress = (percent, mapping, data) => {
        div.style.setProperty("--cwinputs", `${percent}%`);
        div.classList.remove("cs360");
    };

    div.InputAxis = (percent, mapping, data) => {
        const value = data.value;
        const raw = data.raw;

        if (mapping.Signed || mapping.toSignedAxis) {
            div.style.setProperty("--cwinputs", `${Math.abs((value / 2) * 100)}%`);
            div.style.setProperty("--translatex", value >= 0 ? "50%" : "-50%");
            div.classList.add("cs360");
            return;
        }
        
        div.style.setProperty("--cwinputs", `${percent}%`);
        div.style.setProperty("--translatex", "0%");
    };


    div.hatSwitch = (IsHatButton, value, mapping, data) => {

        if (!IsHatButton) return Items[groupName].hatSwitch.set(value);
        div.style.setProperty("--cwinputs", `${value ? 100 : 0}%`);
        div.classList.remove("cs360");

        if (!value) return Items[groupName].hatSwitch.clean();
        const [, name] = mapping.keyName.split(":");
        Items[groupName].hatSwitch.set(name);
    };


    div.stopHatToggle = () => {
        delete hatToggler.dataset.active;
    };

    return {
        card: div,
        main: mainParent,
        Buttons,
        hatToggler,
    };
}

function createHeadLine() {
    const div = document.createElement("div");
    div.className = "cdheader";
    
    const fieldOne = document.createElement("div");
    const fieldTwo = document.createElement("div");
    const fieldThree = document.createElement("div");

    fieldOne.textContent = "Interaktion";
    fieldTwo.textContent = "Primär Button";
    fieldThree.textContent = "Sekundär Button";

    div.appendChild(fieldOne);
    div.appendChild(fieldTwo);
    div.appendChild(fieldThree);

    return div;
}

function createInteractIcons(parent) {

    const buttons = {};
    buttons.Inverted = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    buttons.Inverted.name = "Inverted";
    buttons.Inverted.dataset.disabled=true;
    buttons.Inverted.dataset.tooltip=true;
    buttons.Inverted.tooltipText=L("tooltip_Inverted");
    buttons.Inverted.setAttribute("viewBox", "0 -960 960 960");
    buttons.Inverted.setAttribute("fill", "currentColor");
    buttons.Inverted.innerHTML = `<path d="M339.5-108.5q-65.5-28.5-114-77t-77-114Q120-365 120-440h80q0 117 81.5 198.5T480-160q117 0 198.5-81.5T760-440q0-117-81.5-198.5T480-720h-6l62 62-56 58-160-160 160-160 56 58-62 62h6q75 0 140.5 28.5t114 77q48.5 48.5 77 114T840-440q0 75-28.5 140.5t-77 114q-48.5 48.5-114 77T480-80q-75 0-140.5-28.5Z"/>`;
    parent.appendChild(buttons.Inverted);
    
    buttons.Signed = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    buttons.Signed.name = "Signed";
    buttons.Signed.dataset.disabled=true;
    buttons.Signed.dataset.tooltip=true;
    buttons.Signed.tooltipText=L("tooltip_Signed");
    buttons.Signed.setAttribute("viewBox", "0 -960 960 960");
    buttons.Signed.setAttribute("fill", "currentColor");
    buttons.Signed.innerHTML = `<path d="m424-296 282-282-56-56-226 226-114-114-56 56 170 170Zm56 216q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/>`;
    parent.appendChild(buttons.Signed);
    
    buttons.zeroInvert = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    buttons.zeroInvert.name = "zeroInvert";
    buttons.zeroInvert.dataset.disabled=true;
    buttons.zeroInvert.dataset.tooltip=true;
    buttons.zeroInvert.tooltipText=L("tooltip_zeroSigned");
    buttons.zeroInvert.setAttribute("viewBox", "0 -960 960 960");
    buttons.zeroInvert.setAttribute("fill", "currentColor");
    buttons.zeroInvert.innerHTML = `<path d="M320-279.5Q260-359 260-480t60-200.5Q380-760 480-760t160 79.5Q700-601 700-480t-60 200.5Q580-200 480-200t-160-79.5ZM579-342q33-60 33-138t-33-138q-33-60-99-60t-99 60q-33 60-33 138t33 138q33 60 99 60t99-60Z"/>`;
    parent.appendChild(buttons.zeroInvert);
    
    buttons.toSignedAxis = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    buttons.toSignedAxis.name = "toSignedAxis";
    buttons.toSignedAxis.dataset.disabled=true;
    buttons.toSignedAxis.dataset.tooltip=true;
    buttons.toSignedAxis.tooltipText=L("tooltip_toSignedAxis");
    buttons.toSignedAxis.setAttribute("viewBox", "0 -960 960 960");
    buttons.toSignedAxis.setAttribute("fill", "currentColor");
    buttons.toSignedAxis.innerHTML = `<path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"/>`;
    parent.appendChild(buttons.toSignedAxis);

    buttons.Leverswitch = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    buttons.Leverswitch.name = "Leverswitch";
    buttons.Leverswitch.dataset.disabled=true;
    buttons.Leverswitch.dataset.tooltip=true;
    buttons.Leverswitch.tooltipText=L("tooltip_Leverswitch");
    buttons.Leverswitch.setAttribute("viewBox", "0 -960 960 960");
    buttons.Leverswitch.setAttribute("fill", "currentColor");
    buttons.Leverswitch.innerHTML = `<path d="M320-440v-287L217-624l-57-56 200-200 200 200-57 56-103-103v287h-80ZM600-80 400-280l57-56 103 103v-287h80v287l103-103 57 56L600-80Z"/>`;
    parent.appendChild(buttons.Leverswitch);

    return buttons;
}


function createInformIcon(parent, data) {
    if (!data?.tooltip) return;

    const InformIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    InformIcon.setAttribute("class", "informicon");

    InformIcon.dataset.tooltip=true;
    InformIcon.tooltipText=L(data.tooltip);
    InformIcon.setAttribute("viewBox", "0 -960 960 960");
    InformIcon.setAttribute("fill", "currentColor");
    InformIcon.innerHTML = `<path d="M440-280h80v-240h-80v240Zm68.5-331.5Q520-623 520-640t-11.5-28.5Q497-680 480-680t-28.5 11.5Q440-657 440-640t11.5 28.5Q463-600 480-600t28.5-11.5ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/>`;
    parent.appendChild(InformIcon);
}


function createHatDisplay(parent, data) {
    const Items = {};
    const main = document.createElement("div");
    main.className = "hat-switch";

    const InputListHat = [
        "leftup", "up", "rightup",
        "left", "centered", "right",
        "leftdown", "down", "rightdown"
    ];

    for (const input of InputListHat) {
        Items[input] = document.createElement("div");
        Items[input].className = "hat-item";
        Items[input].dataset.name = input;
        main.appendChild(Items[input]);
    }

    parent.appendChild(main);
    const clean = () => {
        for (const inputName in Items) {
            Items[inputName].classList.remove("active");
        };
    };

    const set = (name) => {
        clean();
        if (!Items[name]) return;
        Items[name].classList.add("active");
    }

    return {clean, set};
}