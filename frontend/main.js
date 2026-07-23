import "./tooltip.js";
import * as presents from "./modules/presets.js";
import loadLocales from "./locales.js";
import * as bindingPage from "./bindingPage.js";
import deviceItem from "./modules/deviceItem.js";




window.addEventListener("DOMContentLoaded", async () => {
    await loadLocales();

    await presents.loadPresets().catch(console.error);
    await bindingPage.load().catch(console.error);
    setTimeout(() => window.CoreAPI.sendReady(), 2000);

    const stadia = document.getElementById("stadia");
    stadia.dataset.tooltip=true;
    stadia.tooltipText=L("tooltip_stadia");
    stadia.addEventListener("click", (e) => {
        const Enabled = !stadia.classList.contains("active");
        stadia.classList.toggle("active", Enabled);
        window.CoreAPI.send("stadiaUpdate", Enabled);
    });

    window.CoreAPI.requestData("Stadia").then((state) => {
        stadia.classList.toggle("active", !!state);
    });
});

window.addEventListener("DOMContentLoaded", () => {
    const InputManager = document.querySelector(".InputManager");
    const devicelist = InputManager.querySelector(".devices>.list");
    
    devicelist.innerHTML = "";
    window.CoreAPI.on("server:deviceStatus", (_, data) => {
        deviceItem(devicelist, data);
    });
    
    window.CoreAPI.requestData("currentDevices").then((resp) => {
        for (const item of resp) deviceItem(devicelist, item);
    });
});
