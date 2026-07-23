class contextElement {
    static currentMenu = null;

    constructor() {
        this.items = [];
        this.submitCallback = null;
        this.cancelCallback = null;
        this.menu = null;
        this.descriptionDiv = null;
        this.margin = 15; // Abstand zu allen Seiten
        this.clickX = 0;
        this.clickY = 0;
    }

    add(items) { this.items = items; }
    submit(callback) { this.submitCallback = callback; }
    onCancel(callback) { this.cancelCallback = callback; }

    open(x, y) {
        if (contextElement.currentMenu) contextElement.currentMenu.destroy();
        contextElement.currentMenu = this;
        const topDocument = this.getTopDocument();

        this.clickX = x;
        this.clickY = y;

        // Menü erzeugen
        this.menu = topDocument.createElement("div");
        this.menu.className = "custom-context-menu";
        topDocument.body.appendChild(this.menu);

        this.descriptionDiv = topDocument.createElement("div");
        this.descriptionDiv.className = "context-description";
        this.descriptionDiv.textContent = "";
        this.menu.appendChild(this.descriptionDiv);

        const renderItems = (items, parent) => {
            items.forEach(item => {
                const li = topDocument.createElement("li");
                const button = topDocument.createElement("div");
                button.className = "context-button";
                button.textContent = item.label || item.name;
                li.appendChild(button);

                button.addEventListener("mouseenter", () => {
                    this.descriptionDiv.textContent = item.description || "";
                    this.adjustMenuPosition(); // Dynamisch prüfen, Description sichtbar
                });

                if (item.dropdown) {
                    const dropdown = topDocument.createElement("ul");
                    dropdown.className = "context-dropdown";
                    renderItems(item.dropdown, dropdown);

                    button.addEventListener("click", (e) => {
                        e.stopPropagation();
                        dropdown.classList.toggle("open");
                        this.adjustMenuPosition();
                    });

                    li.appendChild(dropdown);
                } else {
                    button.addEventListener("click", (e) => {
                        e.stopPropagation();
                        this.submitCallback?.(item.name);
                        this.destroy();
                    });
                }

                parent.appendChild(li);
            });
        };

        const list = topDocument.createElement("ul");
        list.className = "context-list";
        renderItems(this.items, list);
        list.addEventListener("mouseleave", () => { this.descriptionDiv.textContent = ""; });

        this.menu.insertBefore(list, this.descriptionDiv);

        // Initial Position
        this.menu.style.left = x + "px";
        this.menu.style.top = y + "px";

        this.adjustMenuPosition();

        this.registerGlobalClickHandler(() => {
            this.cancelCallback?.();
            this.destroy();
        });
    }

    registerGlobalClickHandler(callback) {
        const handledDocuments = new Set();

        const attach = (doc) => {
            if (!doc || handledDocuments.has(doc)) return;
            handledDocuments.add(doc);

            doc.addEventListener("mousedown", (e) => {
                if (!this.menu || !this.menu.contains(e.target)) {
                    callback();
                }
            });

            // Alle Iframes dieses Dokuments prüfen
            for (let i = 0; i < doc.defaultView.frames.length; i++) {
                try {
                    const frameDoc = doc.defaultView.frames[i].document;
                    attach(frameDoc);
                } catch (err) {
                    // Cross-Origin ignorieren
                }
            }
        };

        // Starte beim Top-Dokument und gehe durch alle Frames
        let topWin = window;
        while (topWin.parent && topWin.parent !== topWin) {
            topWin = topWin.parent;
        }

        attach(topWin.document);
    }


    adjustMenuPosition() {
        if (!this.menu) return;
        const menuRect = this.menu.getBoundingClientRect();
        const winHeight = window.innerHeight;
        const winWidth = window.innerWidth;
        const maxHeight = winHeight * 0.8;
        this.menu.style.maxHeight = maxHeight + "px";

        let top = parseInt(this.menu.style.top);
        let left = parseInt(this.menu.style.left);

        const descHeight = this.descriptionDiv.offsetHeight || 0;

        // Rechts und unten berücksichtigen
        if (menuRect.right > winWidth - this.margin) left -= menuRect.right - (winWidth - this.margin);
        if (menuRect.bottom > winHeight - this.margin) top -= menuRect.bottom - (winHeight - this.margin) + descHeight;

        // Oben und links
        if (top < this.margin) top = this.margin;
        if (left < this.margin) left = this.margin;

        this.menu.style.top = top + "px";
        this.menu.style.left = left + "px";
    }

    destroy() {
        if (this.menu) this.menu.remove();
        this.menu = null;
        this.descriptionDiv = null;
        if (contextElement.currentMenu === this) contextElement.currentMenu = null;
    }

    getTopDocument() {
        let win = window;
        while (win.parent && win.parent !== win) win = win.parent;
        return win.document;
    }
}