const container = document.querySelector(".preset-selector");
const summary = container.querySelector("summary");
const addPreset = container.querySelector(".new-preset");
const presetList = container.querySelector(".preset-list");

import { loadMappedBinds, removeMappedBinds } from "../bindingPage.js";

export function removeSelected() {
    presetList.querySelectorAll(".preset-row").forEach(elm => {
        elm.classList.remove("active");
    });
}

export function createPreset(id, name="new preset", selected) {
    if (!id) return;

    const div = document.createElement("div");
    div.className = "preset-row";
    if (selected) div.classList.add("active");

    const child_name = document.createElement("div");
    child_name.className = "name";

    const nameText = document.createElement("div");
    const nameIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    nameIcon.innerHTML = `<path d="M106-386q-6-6-6-14t6-14q6-6 14-6t14 6q6 6 6 14t-6 14q-6 6-14 6t-14-6Zm0-160q-6-6-6-14t6-14q6-6 14-6t14 6q6 6 6 14t-6 14q-6 6-14 6t-14-6Zm105.5 334.5Q200-223 200-240t11.5-28.5Q223-280 240-280t28.5 11.5Q280-257 280-240t-11.5 28.5Q257-200 240-200t-28.5-11.5Zm0-160Q200-383 200-400t11.5-28.5Q223-440 240-440t28.5 11.5Q280-417 280-400t-11.5 28.5Q257-360 240-360t-28.5-11.5Zm0-160Q200-543 200-560t11.5-28.5Q223-600 240-600t28.5 11.5Q280-577 280-560t-11.5 28.5Q257-520 240-520t-28.5-11.5Zm0-160Q200-703 200-720t11.5-28.5Q223-760 240-760t28.5 11.5Q280-737 280-720t-11.5 28.5Q257-680 240-680t-28.5-11.5Zm146 334Q340-375 340-400t17.5-42.5Q375-460 400-460t42.5 17.5Q460-425 460-400t-17.5 42.5Q425-340 400-340t-42.5-17.5Zm0-160Q340-535 340-560t17.5-42.5Q375-620 400-620t42.5 17.5Q460-585 460-560t-17.5 42.5Q425-500 400-500t-42.5-17.5Zm14 306Q360-223 360-240t11.5-28.5Q383-280 400-280t28.5 11.5Q440-257 440-240t-11.5 28.5Q417-200 400-200t-28.5-11.5Zm0-480Q360-703 360-720t11.5-28.5Q383-760 400-760t28.5 11.5Q440-737 440-720t-11.5 28.5Q417-680 400-680t-28.5-11.5ZM386-106q-6-6-6-14t6-14q6-6 14-6t14 6q6 6 6 14t-6 14q-6 6-14 6t-14-6Zm0-720q-6-6-6-14t6-14q6-6 14-6t14 6q6 6 6 14t-6 14q-6 6-14 6t-14-6Zm131.5 468.5Q500-375 500-400t17.5-42.5Q535-460 560-460t42.5 17.5Q620-425 620-400t-17.5 42.5Q585-340 560-340t-42.5-17.5Zm0-160Q500-535 500-560t17.5-42.5Q535-620 560-620t42.5 17.5Q620-585 620-560t-17.5 42.5Q585-500 560-500t-42.5-17.5Zm14 306Q520-223 520-240t11.5-28.5Q543-280 560-280t28.5 11.5Q600-257 600-240t-11.5 28.5Q577-200 560-200t-28.5-11.5Zm0-480Q520-703 520-720t11.5-28.5Q543-760 560-760t28.5 11.5Q600-737 600-720t-11.5 28.5Q577-680 560-680t-28.5-11.5ZM546-106q-6-6-6-14t6-14q6-6 14-6t14 6q6 6 6 14t-6 14q-6 6-14 6t-14-6Zm0-720q-6-6-6-14t6-14q6-6 14-6t14 6q6 6 6 14t-6 14q-6 6-14 6t-14-6Zm145.5 614.5Q680-223 680-240t11.5-28.5Q703-280 720-280t28.5 11.5Q760-257 760-240t-11.5 28.5Q737-200 720-200t-28.5-11.5Zm0-160Q680-383 680-400t11.5-28.5Q703-440 720-440t28.5 11.5Q760-417 760-400t-11.5 28.5Q737-360 720-360t-28.5-11.5Zm0-160Q680-543 680-560t11.5-28.5Q703-600 720-600t28.5 11.5Q760-577 760-560t-11.5 28.5Q737-520 720-520t-28.5-11.5Zm0-160Q680-703 680-720t11.5-28.5Q703-760 720-760t28.5 11.5Q760-737 760-720t-11.5 28.5Q737-680 720-680t-28.5-11.5ZM826-386q-6-6-6-14t6-14q6-6 14-6t14 6q6 6 6 14t-6 14q-6 6-14 6t-14-6Zm0-160q-6-6-6-14t6-14q6-6 14-6t14 6q6 6 6 14t-6 14q-6 6-14 6t-14-6Z"/>`;
    nameIcon.setAttribute("viewBox", "0 -960 960 960");
    nameIcon.setAttribute("fill", "currentColor");


    const child_remove = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    child_remove.innerHTML = `<path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/>`;
    child_remove.setAttribute("viewBox", "0 -960 960 960");
    child_remove.setAttribute("fill", "currentColor");
    child_remove.setAttribute("class", "option remove");

    const child_edit = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    child_edit.innerHTML = `<path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z"/>`;
    child_edit.setAttribute("viewBox", "0 -960 960 960");
    child_edit.setAttribute("fill", "currentColor");
    child_edit.setAttribute("class", "option edit");



    nameText.textContent = name || "new preset";
    child_name.appendChild(nameIcon);
    child_name.appendChild(nameText);
    div.appendChild(child_name);
    div.appendChild(child_edit);
    div.appendChild(child_remove);
    presetList.appendChild(div);

    
    const disableItem = (val) => {
        if (val) {
            child_edit.dataset.disabled = true;
            child_remove.dataset.disabled = true;
            return;
        };

        delete child_edit.dataset.disabled;
        delete child_remove.dataset.disabled;
    };


    child_edit.addEventListener("click", () => {
        if (container.dataset.disabled) return;
        if (child_edit.dataset.disabled) return;
        disableItem(true);

        const form = new formElement()
        form.add({type: "text", label: L("PRESET_INPUT_NEW_NAME"), required: true, name: "name"});
        form.cancel(() => disableItem(false));
        form.submit((submit) => {
            disableItem(false);
            nameText.textContent = submit.name;
            presentCallback({action: "updateName", id, name: submit.name});


            if (container.dataset.id === id) {
                summary.textContent = submit.name;
            };
        });
    });

    child_remove.addEventListener("click", () => {
        if (container.dataset.disabled) return;
        if (child_remove.dataset.disabled) return;
        disableItem(true);

        const resp = new confirmElement(L("PRESET_INPUT_DELETE_CONFIRM", null, {name: nameText.textContent}));
        resp.cancel(() => disableItem(false));

        resp.submit(async () => {
            presentCallback({action: "remove", id});
            disableItem(false);
            div.remove();


            if (container.dataset.id === id) {
                summary.textContent = L("PRESET_NOT_SELECTED");
                delete container.dataset.id;
                removeMappedBinds();
            };

        });
    });



    child_name.addEventListener("click", async () => {
        if (child_name.disabled) return;
        child_name.disabled = true;

        removeSelected();
        div.classList.add("active");

        const response = await presentCallback({action: "selectPreset", id});
        summary.textContent = nameText.textContent;
        container.dataset.id = id;
        delete child_name.disabled;
        if (response?.mapping) loadMappedBinds(response.mapping);
    });
}



addPreset.addEventListener("click", () => {
    if (container.dataset.disabled) return;
    container.dataset.disabled = true;
    
    const form = new formElement()
    form.add({type: "text", label: L("PRESET_INPUT_NAME"), name: "name"});
    form.cancel(() => delete container.dataset.disabled);
    form.submit(async (submit) => {
        const resp = await presentCallback({
            action: "add",
            name: submit.name
        });
        if (resp?.id) createPreset(resp.id, resp.name);
        delete container.dataset.disabled;
    });
});


async function presentCallback(options) {
    return await window.CoreAPI.invoke("presets", options).catch(() => null);
}


export async function loadPresets() {
    summary.textContent = L("PRESET_NOT_SELECTED");

    const response = await presentCallback({action: "loadIdNames"});
    if (!response) return;


    const {currentId, data} = response;
    for (const {id, name} of response.data || {}) {
        createPreset(id, name, (currentId === id));
        if (currentId !== id) continue;

        summary.textContent = name;
        container.dataset.id = id;
    }
}