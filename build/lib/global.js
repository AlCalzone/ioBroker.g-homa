"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var object_polyfill_1 = require("./object-polyfill");
// ==================================
var colors = {
    red: "#db3340",
    yellow: "#ffa200",
    green: "#5bb12f",
    blue: "#0087cb",
};
var replacements = {
    bold: [/\*{2}(.*?)\*{2}/g, "<b>$1</b>"],
    italic: [/#{2}(.*?)#{2}/g, "<i>$1</i>"],
    underline: [/_{2}(.*?)_{2}/g, "<u>$1</u>"],
    strikethrough: [/\~{2}(.*?)\~{2}/g, "<s>$1</s>"],
    color: [/\{{2}(\w+)\|(.*?)\}{2}/, function (str, p1, p2) {
            var color = colors[p1];
            if (!color) {
                return str;
            }
            return "<span style=\"color: " + color + "\">" + p2 + "</span>";
        }],
    fullcolor: [/^\{{2}(\w+)\}{2}(.*?)$/, function (str, p1, p2) {
            var color = colors[p1];
            if (!color) {
                return str;
            }
            return "<span style=\"color: " + color + "\">" + p2 + "</span>";
        }],
};
var Global = /** @class */ (function () {
    function Global() {
    }
    Object.defineProperty(Global, "adapter", {
        get: function () { return Global._adapter; },
        set: function (adapter) {
            Global._adapter = adapter;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Global, "loglevel", {
        get: function () { return Global._loglevel; },
        set: function (value) { Global._loglevel = value; },
        enumerable: true,
        configurable: true
    });
    /*
        Formatierungen:
        **fett**, ##kursiv##, __unterstrichen__, ~~durchgestrichen~~
        schwarz{{farbe|bunt}}schwarz, {{farbe}}bunt
    */
    Global.log = function (message, _a) {
        var _b = _a === void 0 ? {} : _a, _c = _b.level, level = _c === void 0 ? Global.loglevels.on : _c, _d = _b.severity, severity = _d === void 0 ? Global.severity.normal : _d;
        if (!Global.adapter)
            return;
        if (level < Global._loglevel)
            return;
        // Warnstufe auswählen
        var logFn;
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
            for (var _i = 0, _e = object_polyfill_1.entries(replacements); _i < _e.length; _i++) {
                var _f = _e[_i], _g = _f[1], regex = _g[0], repl = _g[1];
                if (typeof repl === "string") {
                    message = message.replace(regex, repl);
                }
                else {
                    message = message.replace(regex, repl);
                }
            }
        }
        Global._adapter.log[logFn](message);
    };
    /**
     * Kurzschreibweise für die Ermittlung eines Objekts
     * @param id
     */
    Global.$ = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Global._adapter.getForeignObjectAsync(id)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Kurzschreibweise für die Ermittlung mehrerer Objekte
     * @param id
     */
    Global.$$ = function (pattern, type, role) {
        return __awaiter(this, void 0, void 0, function () {
            var objects;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Global._adapter.getForeignObjectsAsync(pattern, type)];
                    case 1:
                        objects = _a.sent();
                        if (role) {
                            return [2 /*return*/, object_polyfill_1.filter(objects, function (o) { return o.common.role === role; })];
                        }
                        else {
                            return [2 /*return*/, objects];
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    Global.loglevels = Object.freeze({ off: 0, on: 1, ridiculous: 2 });
    Global.severity = Object.freeze({ normal: 0, warn: 1, error: 2 });
    Global._loglevel = Global.loglevels.on;
    return Global;
}());
exports.Global = Global;
