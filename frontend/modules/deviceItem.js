export const devices = new Map();
export const deviceLocales = {};

import { loadMappedBinds } from "../bindingPage.js";

export default (parent, {productName, vendorId, productId, connected=false, locales={}} = {}) => {
    if (!vendorId || !productId) return;

    const key = `${vendorId}_${productId}`;
    if (devices.has(key)) return;

    deviceLocales[key] = locales;

    const div = document.createElement("div");
    const name = document.createElement("div");

    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.setAttribute("viewBox", "0 -960 960 960");
    icon.setAttribute("fill", "currentColor");
    icon.innerHTML = `<path d="M189-160q-60 0-102.5-43T42-307q0-9 1-18t3-18l84-336q14-54 57-87.5t98-33.5h390q55 0 98 33.5t57 87.5l84 336q2 9 3.5 18.5T919-306q0 61-43.5 103.5T771-160q-42 0-78-22t-54-60l-28-58q-5-10-15-15t-21-5H385q-11 0-21 5t-15 15l-28 58q-18 38-54 60t-78 22Zm3-80q19 0 34.5-10t23.5-27l28-57q15-31 44-48.5t63-17.5h190q34 0 63 18t45 48l28 57q8 17 23.5 27t34.5 10q28 0 48-18.5t21-46.5q0 1-2-19l-84-335q-7-27-28-44t-49-17H285q-28 0-49.5 17T208-659l-84 335q-2 6-2 18 0 28 20.5 47t49.5 19Zm376.5-291.5Q580-543 580-560t-11.5-28.5Q557-600 540-600t-28.5 11.5Q500-577 500-560t11.5 28.5Q523-520 540-520t28.5-11.5Zm80-80Q660-623 660-640t-11.5-28.5Q637-680 620-680t-28.5 11.5Q580-657 580-640t11.5 28.5Q603-600 620-600t28.5-11.5Zm0 160Q660-463 660-480t-11.5-28.5Q637-520 620-520t-28.5 11.5Q580-497 580-480t11.5 28.5Q603-440 620-440t28.5-11.5Zm80-80Q740-543 740-560t-11.5-28.5Q717-600 700-600t-28.5 11.5Q660-577 660-560t11.5 28.5Q683-520 700-520t28.5-11.5Zm-367 63Q370-477 370-490v-40h40q13 0 21.5-8.5T440-560q0-13-8.5-21.5T410-590h-40v-40q0-13-8.5-21.5T340-660q-13 0-21.5 8.5T310-630v40h-40q-13 0-21.5 8.5T240-560q0 13 8.5 21.5T270-530h40v40q0 13 8.5 21.5T340-460q13 0 21.5-8.5ZM480-480Z"></path>`;

    name.textContent = productName;

    div.className = "card";
    if (connected) div.classList.add("connected");

    div.appendChild(icon);
    div.appendChild(name);
    parent.appendChild(div);


    createButtons(div, [
        {label: L("device_create_locale"), name: "cl"},
        {label: L("device_load_locale"), name: "ll"},
        {label: L("device_remove"), name: "remove"},
    ], async (name) => {
        switch (name) {
            case "remove": {
                let success = await window.CoreAPI.removeDevice({productId, vendorId}).catch(() => null);
                if (!success) return;
                devices.delete(key);
                div.remove();
            }; break;
            case "ll": window.CoreAPI.send("deiveLoadLocales", {productId, vendorId}); break;
            case "cl": window.CoreAPI.send("deiveCreateLocales", {productId, vendorId}); break;
        }

        await new Promise(p => setTimeout(p, 1000));
    });

    devices.set(key, div);
}


window.CoreAPI.on("server:onDeviceConnection", (event, data) => {
    const card = devices.get(`${data.vendorId}_${data.productId}`);
    if (card) card.classList.toggle("connected", data.connected);
});

window.CoreAPI.on("server:onDeviceConnection", (event, data) => {
    deviceLocales[`${data.vendorId}_${data.productId}`] = data.locales;
})

window.CoreAPI.on("server:deviceLocales", (event, {vendorId, productId, locales, maps}={}) => {
    if (!vendorId || !productId || !locales) return;
    deviceLocales[`${vendorId}_${productId}`] = locales;

    if (maps) loadMappedBinds(maps);
});



function createButtons(parent, data, callback) {
    for (const csub of data) {
        const button = document.createElement("button");
        button.textContent = csub.label;
        button.dataset.name = csub.name;
        parent.appendChild(button);


        button.onclick = async () => {
            if (button.disabled) return;
            button.disabled = true;

            await callback(csub.name)
            button.disabled = false;
        }
    }
}

