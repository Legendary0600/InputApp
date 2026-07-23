let locales = {};

globalThis.L = getLocale;
String.prototype.translate = function(alt, params) {
    return getLocale(this, alt, params)
};


function getLocale(key, alt, params = {}) {
    let text = locales?.[key] || alt || `{{${key}}}`;

    
    return text.replace(/\{\{(\w+)\}\}/g, (_, name) => {
        const value = Object.entries(params)
            .find(([k]) => k.toLowerCase() === name.toLowerCase())?.[1];

        return value ?? `{${name}}`;
    });
}

export default async () => {
    const Index = await window.CoreAPI.requestData("getLocales");

    locales = Index?.data ?? {}
    const lang = Index.lang || "en-US";

    const rd = document.getElementById("slang");
    rd.value = lang;

    rd.addEventListener("change", () => {
        window.CoreAPI.send("setLang", rd.value);
    });

    document.querySelectorAll("[data-locale]").forEach(elm => {
        const b = elm.dataset.locale;
        if(b) elm.innerHTML = b.translate();
    });
}