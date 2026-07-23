const statusText  = document.querySelector(".status");
const progressbar = document.querySelector(".progressbar");

const progress  =   progressbar.querySelector(".bar");
const percent   =   document.getElementById("percent");
const download  =   document.getElementById("download");
const version   =   document.querySelector(".version");




function setProgress(value, current="", total=""){
    value=Math.max(0, Math.min(100,value));
    progress.style.width=value+"%";
    percent.textContent=Math.round(value)+"%";

    if(current!==""&&total!==""){
        download.textContent=current+" / "+total;
    }
}

window.CoreSplash.on("status", (event, state) => {
    statusText.textContent=state;
});

window.CoreSplash.on("version", (event, v) => {
    version.textContent=`Version ${v}`;
});

window.CoreSplash.on("progress", (event, percent, show) => {
    progressbar.classList.toggle("show", show);
    if (percent) setProgress(percent);
});

window.CoreSplash.on("launch", () => {
    statusText.textContent = "Launching HorizonMods . . .";
});