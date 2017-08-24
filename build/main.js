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
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t;
    return { next: verb(0), "throw": verb(1), "return": verb(2) };
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
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
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var gHoma = require("g-homa");
var global_1 = require("./lib/global");
var network_1 = require("./lib/network");
var object_polyfill_1 = require("./lib/object-polyfill");
var utils_1 = require("./lib/utils");
var server;
var manager;
// tslint:disable-next-line:prefer-const
var discovery;
var ownIP = network_1.getOwnIpAddresses()[0];
var plugs = {};
var adapter = utils_1.default.adapter({
    name: "g-homa",
    ready: function () { return __awaiter(_this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // Adapter-Instanz global machen
                    adapter = global_1.Global.extend(adapter);
                    global_1.Global.adapter = adapter;
                    // redirect console output
                    console.log = function (msg) { return adapter.log.debug("STDOUT > " + msg); };
                    console.error = function (msg) { return adapter.log.error("STDERR > " + msg); };
                    // bekannte Plugs einlesen
                    return [4 /*yield*/, readPlugs()];
                case 1:
                    // bekannte Plugs einlesen
                    _a.sent();
                    // Server zuerst starten, damit wir den Port kennen
                    adapter.setState("info.connection", false, true);
                    adapter.log.info("starting server...");
                    server = new gHoma.Server();
                    server.once("server started", function (address) { return __awaiter(_this, void 0, void 0, function () {
                        var _this = this;
                        return __generator(this, function (_a) {
                            adapter.log.info("server started on port " + address.port);
                            adapter.setState("info.connection", true, true);
                            // Manager starten, um
                            manager = (new gHoma.Manager())
                                .once("ready", function () { return __awaiter(_this, void 0, void 0, function () {
                                var activePlugs, promises;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            adapter.log.info("searching plugs");
                                            return [4 /*yield*/, manager.findAllPlugs()];
                                        case 1:
                                            activePlugs = _a.sent();
                                            promises = activePlugs.map(function (addr) { return manager.configurePlug(addr.ip, ownIP, address.port); });
                                            return [4 /*yield*/, Promise.all(promises)];
                                        case 2:
                                            _a.sent();
                                            return [2 /*return*/];
                                    }
                                });
                            }); });
                            return [2 /*return*/];
                        });
                    }); });
                    // auf Events des Servers lauschen
                    server
                        .on("server closed", function () {
                        adapter.setState("info.connection", false, true);
                    })
                        .on("plug added", function (id) {
                        // vorerst nichts zu tun
                    })
                        .on("plug updated", function (plug) {
                        // Objekt merken
                        plugs[plug.id] = plug;
                        // und nach ioBroker exportieren
                        extendPlug(plug);
                    })
                        .on("plug dead", function (id) { return __awaiter(_this, void 0, void 0, function () {
                        var iobID, state;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    if (plugs[id])
                                        plugs[id].online = true;
                                    iobID = id + ".alive";
                                    return [4 /*yield*/, adapter.$getState(iobID)];
                                case 1:
                                    state = _a.sent();
                                    if (!(state && state.val != null)) return [3 /*break*/, 3];
                                    return [4 /*yield*/, adapter.$setState(iobID, false, true)];
                                case 2:
                                    _a.sent();
                                    _a.label = 3;
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); })
                        .on("plug alive", function (id) { return __awaiter(_this, void 0, void 0, function () {
                        var iobID, state;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    if (plugs[id])
                                        plugs[id].online = true;
                                    iobID = id + ".alive";
                                    return [4 /*yield*/, adapter.$getState(iobID)];
                                case 1:
                                    state = _a.sent();
                                    if (!(state && state.val != null)) return [3 /*break*/, 3];
                                    return [4 /*yield*/, adapter.$setState(iobID, true, true)];
                                case 2:
                                    _a.sent();
                                    _a.label = 3;
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    // watch states and objects
                    adapter.subscribeStates("*");
                    adapter.subscribeObjects("*");
                    return [2 /*return*/];
            }
        });
    }); },
    // is called if a subscribed object changes
    objectChange: function (id, obj) {
        // TODO: do we need this?
    },
    // is called if a subscribed state changes
    stateChange: function (id, state) { return __awaiter(_this, void 0, void 0, function () {
        var matches, switchId, obj;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(state && !state.ack)) return [3 /*break*/, 2];
                    if (!id.endsWith(".state")) return [3 /*break*/, 2];
                    matches = /([0-9A-Fa-f]{6})\.state$/.exec(id);
                    if (!(matches && matches.length)) return [3 /*break*/, 2];
                    switchId = matches[1];
                    return [4 /*yield*/, adapter.$getObject(switchId.toUpperCase())];
                case 1:
                    obj = _a.sent();
                    if (obj && obj.native.id) {
                        server.switchPlug(obj.native.id, state.val);
                    }
                    _a.label = 2;
                case 2: return [2 /*return*/];
            }
        });
    }); },
    // message: (obj) => {
    // },
    // is called when adapter shuts down - callback has to be called under any circumstances!
    unload: function (callback) {
        try {
            server.close();
            manager.close();
            callback();
        }
        catch (e) {
            callback();
        }
    },
});
function readPlugs() {
    return __awaiter(this, void 0, void 0, function () {
        var iobPlugs, _i, _a, _b, id, iobPlug, plug, state, e_1;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 9, , 10]);
                    adapter.log.info("enumerating known plugs...");
                    return [4 /*yield*/, global_1.Global.$$(adapter.namespace + ".*", "device")];
                case 1:
                    iobPlugs = _c.sent();
                    _i = 0, _a = object_polyfill_1.entries(iobPlugs);
                    _c.label = 2;
                case 2:
                    if (!(_i < _a.length)) return [3 /*break*/, 8];
                    _b = _a[_i], id = _b[0], iobPlug = _b[1];
                    plug = {
                        id: id,
                        ip: null,
                        port: null,
                        lastSeen: 0,
                        lastSwitchSource: "unknown",
                        shortmac: iobPlug.native.shortmac,
                        mac: iobPlug.native.mac,
                        online: false,
                        state: false,
                    };
                    plugs[id] = plug;
                    return [4 /*yield*/, adapter.$getState(id + ".lastSeen")];
                case 3:
                    state = _c.sent();
                    if (state && state.val != null)
                        plug.lastSeen = state.val;
                    return [4 /*yield*/, adapter.$getState(id + ".lastSwitchSource")];
                case 4:
                    state = _c.sent();
                    if (state && state.val != null)
                        plug.lastSwitchSource = state.val;
                    return [4 /*yield*/, adapter.$getState(id + ".ip")];
                case 5:
                    state = _c.sent();
                    if (state && state.val != null)
                        plug.ip = state.val;
                    return [4 /*yield*/, adapter.$getState(id + ".port")];
                case 6:
                    state = _c.sent();
                    if (state && state.val != null)
                        plug.port = state.val;
                    _c.label = 7;
                case 7:
                    _i++;
                    return [3 /*break*/, 2];
                case 8: return [3 /*break*/, 10];
                case 9:
                    e_1 = _c.sent();
                    return [3 /*break*/, 10];
                case 10: return [2 /*return*/];
            }
        });
    });
}
function extendPlug(plug) {
    return __awaiter(this, void 0, void 0, function () {
        var prefix, promises;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    prefix = plug.id.toUpperCase();
                    promises = [
                        // Gerät selbst
                        adapter.$setObjectNotExists("" + prefix, {
                            type: "device",
                            common: {
                                name: "G-Homa WiFi plug " + plug.id.toUpperCase(),
                            },
                            native: {
                                id: plug.id,
                                shortmac: plug.shortmac,
                                mac: plug.mac,
                            },
                        }),
                        // Info-Channel
                        adapter.$setObjectNotExists(prefix + ".info", {
                            type: "channel",
                            common: {
                                name: "Information über das Gerät",
                            },
                            native: {},
                        }),
                        // Kommunikation
                        adapter.$setObjectNotExists(prefix + ".info.alive", {
                            type: "state",
                            common: {
                                name: "Ob das Gerät erreichbar ist",
                                type: "boolean",
                                role: "indicator.reachable",
                                read: true,
                                write: false,
                            },
                            native: {},
                        }),
                        adapter.$setObjectNotExists(prefix + ".info.lastSeen", {
                            type: "state",
                            common: {
                                name: "Wann zuletzt eine Rückmeldung vom Gerät kam",
                                type: "number",
                                role: "value.time",
                                read: true,
                                write: false,
                            },
                            native: {},
                        }),
                        adapter.$setObjectNotExists(prefix + ".info.ip", {
                            type: "state",
                            common: {
                                name: "Letzte bekannte IP-Adresse",
                                type: "string",
                                role: "value",
                                read: true,
                                write: false,
                            },
                            native: {},
                        }),
                        adapter.$setObjectNotExists(prefix + ".info.port", {
                            type: "state",
                            common: {
                                name: "Letzter bekannter Port",
                                type: "number",
                                role: "value",
                                read: true,
                                write: false,
                            },
                            native: {},
                        }),
                        // Schalten des Geräts
                        adapter.$setObjectNotExists(prefix + ".lastSwitchSource", {
                            type: "state",
                            common: {
                                name: "Von wo das Gerät zuletzt geschaltet wurde (remote oder lokal)",
                                type: "string",
                                role: "text",
                                read: true,
                                write: false,
                            },
                            native: {},
                        }),
                        adapter.$setObjectNotExists(prefix + ".state", {
                            type: "state",
                            common: {
                                name: "Schaltzustand des Geräts",
                                type: "boolean",
                                role: "switch",
                                read: true,
                                write: true,
                            },
                            native: {},
                        }),
                    ];
                    // Sicherstellen, dass die Objekte existieren
                    return [4 /*yield*/, Promise.all(promises)];
                case 1:
                    // Sicherstellen, dass die Objekte existieren
                    _a.sent();
                    // Jetzt die Werte speichern
                    promises = [
                        adapter.$setState(prefix + ".info.alive", plug.online, true),
                        adapter.$setState(prefix + ".info.lastSeen", plug.lastSeen, true),
                        adapter.$setState(prefix + ".info.ip", plug.ip, true),
                        adapter.$setState(prefix + ".info.port", plug.port, true),
                        adapter.$setState(prefix + ".lastSwitchSource", plug.lastSwitchSource, true),
                        adapter.$setState(prefix + ".state", plug.state, true),
                    ];
                    return [4 /*yield*/, Promise.all(promises)];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
// Unbehandelte Fehler tracen
process.on("unhandledRejection", function (r) {
    adapter.log.error("unhandled promise rejection: " + r);
});
//# sourceMappingURL=main.js.map