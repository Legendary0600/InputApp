let tooltip;
let hoverTimeout;

document.addEventListener("mouseover", (event) => {
    const element = event.target.closest("[data-tooltip]");
    if (!element) return;

    hoverTimeout = setTimeout(() => {
        tooltip = document.createElement("div");
        tooltip.className = "tooltip";
        tooltip.innerHTML = element.tooltipText ?? "";

        document.body.appendChild(tooltip);

    }, 1000); // 1 Sekunde
});

document.addEventListener("mouseout", (event) => {
    const element = event.target.closest("[data-tooltip]");
    if (!element) return;

    clearTimeout(hoverTimeout);
    if (!tooltip) return;
    tooltip.remove();
    tooltip = null;
});