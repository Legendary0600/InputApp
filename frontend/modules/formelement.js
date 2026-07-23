class formElement {
  constructor() {
    this.form = document.createElement("form");
    this.form.classList.add("fem-form");
    this.submitCallback = null;
    this.cancelCallback = null;

    // Wrapper für die Formularfelder
    this.fieldsWrapper = document.createElement("div");
    this.fieldsWrapper.classList.add("fem-fields");
    this.form.appendChild(this.fieldsWrapper);

    // Buttonbereich
    const buttonWrapper = document.createElement("div");
    buttonWrapper.classList.add("fem-buttons");

    this.submitButton = document.createElement("button");
    this.submitButton.type = "submit";
    this.submitButton.textContent = "Bestätigen";
    this.submitButton.classList.add("fem-submit");

    this.cancelButton = document.createElement("button");
    this.cancelButton.type = "button";
    this.cancelButton.textContent = "Abbrechen";
    this.cancelButton.classList.add("fem-cancel");

    buttonWrapper.appendChild(this.submitButton);
    buttonWrapper.appendChild(this.cancelButton);
    this.form.appendChild(buttonWrapper);

    // Eigenes Wrapper-Element (nicht Body direkt beeinflussen)
    this.wrapper = document.createElement("div");
    this.wrapper.classList.add("fem-wrapper");
    this.wrapper.appendChild(this.form);
    document.body.appendChild(this.wrapper);

    // Cancel-Event
    this.cancelButton.addEventListener("click", () => {
      if (this.cancelCallback) this.cancelCallback();
      this._removeForm();
    });

    // Submit-Event mit Required-Überprüfung
    this.form.addEventListener("submit", (e) => {
      e.preventDefault();

      const invalidFields = [];
      this.form.querySelectorAll("[required]").forEach((field) => {
        const val = field.value == null ? "" : String(field.value);
        if (!val.trim()) {
          invalidFields.push(field);
          field.classList.add("invalid");
        } else {
          field.classList.remove("invalid");
        }
      });

      if (invalidFields.length > 0) {
        invalidFields[0].focus();
        return;
      }

      if (this.submitCallback) {
        const formData = new FormData(this.form);
        const values = Object.fromEntries(formData.entries());

        for (const key in values) {
          const str = values[key].trim();

          // Prüfen, ob es nach JSON aussieht (z.B. Objekt oder Array)
          if ((str.startsWith("{") && str.endsWith("}")) || (str.startsWith("[") && str.endsWith("]"))) {
            try {
              // JSON parse ohne große Zahlen zu Number zu machen
              values[key] = JSON.parse(str, (k, v) => {
                // Alle Numbers größer als 2^53-1 als String belassen
                if (typeof v === "number" && !Number.isSafeInteger(v)) return String(v);
                return v;
              });
            } catch (e) {
              // Wenn fehlerhaftes JSON, einfach als String belassen
              values[key] = str;
            }
          } else {
            // Normale Strings unverändert lassen
            values[key] = str;
          }
        }

        this.submitCallback(values);
      }
        this._removeForm();
    });
  }

  // Placeholder-Fallback
  _placeholderOrDefault(placeholder, fallback) {
    if (placeholder === undefined || placeholder === null || String(placeholder).trim() === "") {
      return fallback;
    }
    return String(placeholder);
  }

  remove() {
    this.wrapper.remove();
    this.destroyCallback?.();
  }
  

  _removeForm() {
    this.wrapper.classList.add("fade-out");
    setTimeout(() => this.remove(), 300);
  }

  // Feld hinzufügen
   /**
   * Fügt dem Formular ein Eingabefeld hinzu.
   * 
   * @param {Object} config - Konfiguration für das Eingabefeld.
   * @param {"text"|"textarea"|"select"|"delay"|"number"|"time"} [config.type="text"] - Typ des Eingabefelds.
   * @param {string} [config.label=""] - Beschriftung des Feldes.
   * @param {string} [config.name=""] - Name des Eingabefelds (wird für FormData verwendet).
   * @param {boolean} [config.required=false] - Gibt an, ob das Feld ein Pflichtfeld ist.
   * @param {string} [config.placeholder=""] - Platzhaltertext für das Eingabefeld.
   * @param {Array<Object|string>} [config.options=[]] - Nur für `select` relevant. 
   *   Bei Objekten: `{ value: string, label: string }`
   * @param {{ field: string, values: string[] } | null} [config.dependsOn=null] - Definiert Abhängigkeiten:
   *   Das Feld wird nur angezeigt, wenn ein anderes Feld (`field`) einen der angegebenen Werte hat.
   * 
   * @returns {{
   *   onInput: (cb: (update: (value: string|number) => void, value: string|number) => void) => any,
   *   onChange: (cb: (update: (value: string|number) => void, value: string|number) => void) => any
   * }} Objekt mit Callback-Methoden für Input- und Change-Events.
   */
  
  add({ type = "text", label = "", name = "", required = false, placeholder = "", options = [], dependsOn = null }) {
    const fieldWrapper = document.createElement("div");
    fieldWrapper.classList.add("fem-field");

    const labelEl = document.createElement("label");
    labelEl.textContent = label;
    labelEl.htmlFor = name;
    if (required) labelEl.setAttribute("data-required", "true");
    fieldWrapper.appendChild(labelEl);

    let input;


    switch (type) {
      case "textarea":
        input = document.createElement("textarea");
        input.placeholder = this._placeholderOrDefault(placeholder, "");
        break;

      case "select":
        input = document.createElement("select");

        // Placeholder als disabled Option
        const ph = this._placeholderOrDefault(placeholder, "");
        if (ph !== "") {
          const opt = document.createElement("option");
          opt.textContent = ph;
          opt.value = "";
          opt.disabled = true;
          opt.selected = true;
          input.appendChild(opt);
        }

        // Optionen einfügen
        if (Array.isArray(options)) {
          options.forEach((opt) => {
            const optionEl = document.createElement("option");
            if (typeof opt === "string") {
              optionEl.value = opt;
              optionEl.textContent = opt;
            } else {
              optionEl.value = opt.value ?? opt.label ?? "";
              optionEl.textContent = opt.label ?? opt.value ?? "Unbenannt";
            }
            input.appendChild(optionEl);
          });
        }
        break;

      case "delay":
        input = document.createElement("input");
        input.type = "text";
        input.placeholder = this._placeholderOrDefault(placeholder, "1d 2h 30m 10s");
        input.pattern = "^\\s*(\\d+d)?\\s*(\\d+h)?\\s*(\\d+m)?\\s*(\\d+s)?\\s*$";
        input.title = "Format: d h m s (z. B. 1d 2h 30m 10s)";
        input.inputMode = "text";
        input.autocomplete = "off";
        break;

      case "number":
        input = document.createElement("input");
        input.type = "number";
        input.placeholder = this._placeholderOrDefault(placeholder, "");
        break;

      case "time":
        input = document.createElement("input");
        input.type = "time";
        input.placeholder = this._placeholderOrDefault(placeholder, "");
        break;

      default:
        input = document.createElement("input");
        input.type = type;
        input.placeholder = this._placeholderOrDefault(placeholder, "");
        break;
    }

    input.name = name;
    input.setAttribute("autocomplete", "off");
    input.setAttribute("autocapitalize", "off");
    input.setAttribute("autocorrect", "off");
    input.setAttribute("spellcheck", "false");
    
    if (required) input.required = true;

    const inputCallbacks = {};
    const callbackInterface = {
      onInput: (cb) => {
        inputCallbacks.onInput = cb;
        return callbackInterface;
      },
      onChange: (cb) => {
        inputCallbacks.onChange = cb;
        return callbackInterface;
      }
    }

    input.addEventListener("input", (event) => {
      if (inputCallbacks.onInput) {
        inputCallbacks.onInput((newValue) => {
          if (typeof newValue === "string" || typeof newValue === "number") {
            input.value = newValue;
          }
        }, input.value);
      }
    });

    input.addEventListener("change", (event) => {
      if (inputCallbacks.onChange) {
        inputCallbacks.onChange((newValue) => {
          if (typeof newValue === "string" || typeof newValue === "number") {
            input.value = newValue;
          }
        }, input.value);
      }
    });

    fieldWrapper.appendChild(input);
    this.fieldsWrapper.appendChild(fieldWrapper);

    
    // Sichtbarkeits-Logik für Abhängigkeiten
    if (dependsOn && dependsOn.field && Array.isArray(dependsOn.values)) {
      const relatedSelect = this.form.querySelector(`[name="${dependsOn.field}"]`);
      const updateVisibility = () => {
        if (relatedSelect && dependsOn.values.includes(relatedSelect.value)) {
          fieldWrapper.style.display = "";
          input.disabled = false;
        } else {
          fieldWrapper.style.display = "none";
          input.disabled = true;
        }
      };
      updateVisibility();
      if (relatedSelect) relatedSelect.addEventListener("change", updateVisibility);
    }

    
    return callbackInterface;
  }

  // Callback für Submit
  submit(callback) {
    this.submitCallback = callback;
  }

  // Callback für Cancel
  cancel(callback) {
    this.cancelCallback = callback;
  }

  onDestroy(callback) {
    this.destroyCallback = callback;
  }
}

class confirmElement {

  constructor(message = "Bist du dir sicher?") {
    this.message = message;
    this.submitCallback = null;
    this.cancelCallback = null;

    // Wrapper
    this.wrapper = document.createElement("div");
    this.wrapper.classList.add("fcm-wrapper");

    // Box
    this.box = document.createElement("div");
    this.box.classList.add("fcm-box");

    // Text
    const textEl = document.createElement("div");
    textEl.classList.add("fcm-text");
    textEl.textContent = this.message;

    // Buttons
    const btnWrapper = document.createElement("div");
    btnWrapper.classList.add("fcm-buttons");

    const btnConfirm = document.createElement("button");
    btnConfirm.classList.add("fcm-btn", "fcm-btn-confirm");
    btnConfirm.textContent = "Bestätigen";

    const btnCancel = document.createElement("button");
    btnCancel.classList.add("fcm-btn", "fcm-btn-cancel");
    btnCancel.textContent = "Abbrechen";

    btnWrapper.appendChild(btnConfirm);
    btnWrapper.appendChild(btnCancel);

    this.box.appendChild(textEl);
    this.box.appendChild(btnWrapper);
    this.wrapper.appendChild(this.box);
    document.body.appendChild(this.wrapper);

    //Sound Registrieren und abspielen;
    const sound = new Audio("static/sounds/pop1.mp3")
    sound.volume = 0.25;
    sound.play();

    // Animation einblenden
    requestAnimationFrame(() => {
      this.wrapper.classList.add("show");
    });


    // Events
    btnConfirm.addEventListener("click", () => {
      if (this.submitCallback) this.submitCallback();
      this._close();
    });

    btnCancel.addEventListener("click", () => {
      if (this.cancelCallback) this.cancelCallback();
      this._close();
    });


  }

  submit(callback) {
    this.submitCallback = callback;
  }

  cancel(callback) {
    this.cancelCallback = callback;
  }

  _close() {
    this.wrapper.classList.remove("show");
    this.wrapper.classList.add("hide");
    setTimeout(() => this.wrapper.remove(), 350);
  }
}

class CoordsParser {
  constructor(input) {
    this.input = input;
    this.coords = this.parse(input);
  }

  // Hauptmethode zum Parsen
  parse(input, asVector = false) {
    if (!input) return null;

    // 1️⃣ Objekt oder Array direkt übernehmen
    if (Array.isArray(input)) return this.createResult(input, asVector);
    if (typeof input === 'object' && 'x' in input && 'y' in input) {
      const arr = [input.x, input.y, input.z, input.w];
      return this.createResult(arr, asVector);
    }

    // 2️⃣ Alles in String umwandeln
    const text = String(input).replace(/\s+/g, '');

    // 3️⃣ Zahlen extrahieren
    let numbers = [];

    // 3a) Zahlen innerhalb Klammern
    const bracketMatch = text.match(/\(([^)]+)\)/);
    if (bracketMatch) {
      numbers = bracketMatch[1].match(/-?\d+(\.\d+)?/g)?.map(Number) || [];
    }

    // 3b) Zahlen ohne Klammern
    if (numbers.length === 0) {
      numbers = text.match(/-?\d+(\.\d+)?/g)?.map(Number) || [];
    }

    if (numbers.length < 2) return null;

    return this.createResult(numbers, asVector);
  }

  // Hilfsfunktion für Rückgabe
  createResult(numbers, asVector = false) {
    const [x, y, z, w] = numbers;
    const obj = {};
    if (x !== undefined) obj.x = x;
    if (y !== undefined) obj.y = y;
    if (z !== undefined) obj.z = z;
    if (w !== undefined) obj.w = w;

    if (!asVector) return obj;

    // Optional: Vector3/Vector4 für FiveM
    if (w !== undefined) return new Vector4(x, y, z, w);
    if (z !== undefined) return new Vector3(x, y, z);
    return new Vector3(x, y, 0);
  }

  // Direkt als Vector zurückgeben
  asVector() {
    return this.createResult(
      [this.coords.x, this.coords.y, this.coords.z, this.coords.w],
      true
    );
  }
}
