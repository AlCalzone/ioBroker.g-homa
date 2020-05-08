"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const object_polyfill_1 = require("./object-polyfill");
// ==================================
const colors = {
    red: "#db3340",
    yellow: "#ffa200",
    green: "#5bb12f",
    blue: "#0087cb",
};
const replacements = {
    bold: [/\*{2}(.*?)\*{2}/g, "<b>$1</b>"],
    italic: [/#{2}(.*?)#{2}/g, "<i>$1</i>"],
    underline: [/_{2}(.*?)_{2}/g, "<u>$1</u>"],
    strikethrough: [/\~{2}(.*?)\~{2}/g, "<s>$1</s>"],
    color: [/\{{2}(\w+)\|(.*?)\}{2}/, (str, p1, p2) => {
            const color = colors[p1];
            if (!color) {
                return str;
            }
            return `<span style="color: ${color}">${p2}</span>`;
        }],
    fullcolor: [/^\{{2}(\w+)\}{2}(.*?)$/, (str, p1, p2) => {
            const color = colors[p1];
            if (!color) {
                return str;
            }
            return `<span style="color: ${color}">${p2}</span>`;
        }],
};
class Global {
    static get adapter() { return Global._adapter; }
    static set adapter(adapter) {
        Global._adapter = adapter;
    }
    static get loglevel() { return Global._loglevel; }
    static set loglevel(value) { Global._loglevel = value; }
    /*
        Formatierungen:
        **fett**, ##kursiv##, __unterstrichen__, ~~durchgestrichen~~
        schwarz{{farbe|bunt}}schwarz, {{farbe}}bunt
    */
    static log(message, { level = Global.loglevels.on, severity = Global.severity.normal } = {}) {
        if (!Global.adapter)
            return;
        if (level < Global._loglevel)
            return;
        // Warnstufe auswählen
        let logFn;
        switch (severity) {
            case Global.severity.warn:
                logFn = "warn";
                break;
            case Global.severity.error:
                logFn = "error";
                break;
            case Global.severity.normal:
            default:
                logFn = "info";
        }
        if (message) {
            // Farben und Formatierungen
            for (const [/*key*/ , [regex, repl]] of object_polyfill_1.entries(replacements)) {
                if (typeof repl === "string") {
                    message = message.replace(regex, repl);
                }
                else {
                    message = message.replace(regex, repl);
                }
            }
        }
        Global._adapter.log[logFn](message);
    }
    /**
     * Kurzschreibweise für die Ermittlung eines Objekts
     * @param id
     */
    static $(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield Global._adapter.getForeignObjectAsync(id);
        });
    }
    /**
     * Kurzschreibweise für die Ermittlung mehrerer Objekte
     * @param id
     */
    static $$(pattern, type, role) {
        return __awaiter(this, void 0, void 0, function* () {
            const objects = yield Global._adapter.getForeignObjectsAsync(pattern, type);
            if (role) {
                return object_polyfill_1.filter(objects, (o) => o.common.role === role);
            }
            else {
                return objects;
            }
        });
    }
}
exports.Global = Global;
Global.loglevels = Object.freeze({ off: 0, on: 1, ridiculous: 2 });
Global.severity = Object.freeze({ normal: 0, warn: 1, error: 2 });
Global._loglevel = Global.loglevels.on;
