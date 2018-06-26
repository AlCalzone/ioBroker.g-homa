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
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var gHoma = require("g-homa");
var global_1 = require("./lib/global");
var network_1 = require("./lib/network");
var object_polyfill_1 = require("./lib/object-polyfill");
var utils_1 = require("./lib/utils");
var server;
var serverAddress;
var manager;
// tslint:disable-next-line:prefer-const
var discovery;
var inclusionOn = false;
var options;
var ownIP;
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
                    // Objekte zurücksetzen
                    return [4 /*yield*/, adapter.$setState("info.inclusionOn", false, true)];
                case 1:
                    // Objekte zurücksetzen
                    _a.sent();
                    // richtige IP-Adresse auswählen
                    options = {
                        networkInterfaceIndex: adapter.config.networkInterfaceIndex || 0,
                    };
                    ownIP = network_1.getOwnIpAddresses()[options.networkInterfaceIndex];
                    if (ownIP == null) {
                        adapter.log.error("Invalid network interface configured. Please check your configuration!");
                        return [2 /*return*/];
                    }
                    // bekannte Plugs einlesen
                    return [4 /*yield*/, readPlugs()];
                case 2:
                    // bekannte Plugs einlesen
                    _a.sent();
                    // Server zuerst starten, damit wir den Port kennen
                    adapter.setState("info.connection", false, true);
                    adapter.log.info("starting server...");
                    server = new gHoma.Server(adapter.config.serverPort);
                    server.once("server started", function (address) { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            serverAddress = address;
                            adapter.log.info("server started on port " + address.port);
                            adapter.setState("info.connection", true, true);
                            // aktive Plugs konfigurieren
                            configurePlugs();
                            return [2 /*return*/];
                        });
                    }); });
                    // auf Events des Servers lauschen
                    server
                        .on("server closed", function () {
                        adapter.setState("info.connection", false, true);
                        adapter.log.info("The local server was shut down");
                    })
                        .on("plug added", function (id) {
                        // vorerst nichts zu tun
                        adapter.log.info("Added plug with ID " + id);
                    })
                        .on("plug updated", function (plug) {
                        // Objekt merken
                        plugs[plug.id] = plug;
                        adapter.log.debug("Got updated info for Plug " + plug.id + ":\n  state: " + (plug.state ? "on" : "off") + "\n  switched from: " + plug.lastSwitchSource + "\n  type: " + plug.type);
                        var _a = plug.energyMeasurement, current = _a.current, power = _a.power, powerFactor = _a.powerFactor, voltage = _a.voltage;
                        if (voltage != null)
                            adapter.log.debug("  Voltage: " + voltage + " V");
                        if (current != null)
                            adapter.log.debug("  Current: " + current + " A");
                        if (power != null)
                            adapter.log.debug("  Power: " + power + " W");
                        if (powerFactor != null)
                            adapter.log.debug("  Power factor: " + powerFactor);
                        // und nach ioBroker exportieren
                        extendPlug(plug);
                    })
                        .on("plug dead", function (id) { return __awaiter(_this, void 0, void 0, function () {
                        var prefix, iobID, state;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    if (plugs[id])
                                        plugs[id].online = false;
                                    adapter.log.info("Plug " + id + " is now dead");
                                    prefix = id.toUpperCase();
                                    iobID = prefix + ".info.alive";
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
                        var prefix, iobID, state;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    if (plugs[id])
                                        plugs[id].online = true;
                                    adapter.log.info("Plug " + id + " is now alive");
                                    prefix = id.toUpperCase();
                                    iobID = prefix + ".info.alive";
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
                    if (!(state && !state.ack)) return [3 /*break*/, 4];
                    if (!id.endsWith(".state")) return [3 /*break*/, 3];
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
                case 2: return [3 /*break*/, 4];
                case 3:
                    if (id.match(/info\.inclusionOn/)) {
                        inclusionOn = state.val;
                    }
                    _a.label = 4;
                case 4: return [2 /*return*/];
            }
        });
    }); },
    message: function (obj) { return __awaiter(_this, void 0, void 0, function () {
        // responds to the adapter that sent the original message
        function respond(response) {
            if (obj.callback)
                adapter.sendTo(obj.from, obj.command, response, obj.callback);
        }
        // make required parameters easier
        function requireParams() {
            var params = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                params[_i] = arguments[_i];
            }
            if (!(params && params.length))
                return true;
            for (var _a = 0, params_1 = params; _a < params_1.length; _a++) {
                var param = params_1[_a];
                if (!(obj.message && obj.message.hasOwnProperty(param))) {
                    respond(responses.MISSING_PARAMETER(param));
                    return false;
                }
            }
            return true;
        }
        var responses, _a, addresses;
        var _this = this;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    responses = {
                        ACK: { error: null },
                        OK: { error: null, result: "ok" },
                        ERROR_UNKNOWN_COMMAND: { error: "Unknown command!" },
                        MISSING_PARAMETER: function (paramName) {
                            return { error: 'missing parameter "' + paramName + '"!' };
                        },
                        COMMAND_RUNNING: { error: "command running" },
                        RESULT: function (result) { return ({ error: null, result: result }); },
                        ERROR: function (error) { return ({ error: error }); },
                    };
                    if (!obj) return [3 /*break*/, 5];
                    _a = obj.command;
                    switch (_a) {
                        case "inclusion": return [3 /*break*/, 1];
                        case "getIPAddresses": return [3 /*break*/, 3];
                    }
                    return [3 /*break*/, 4];
                case 1:
                    if (!requireParams("psk")) {
                        respond(responses.MISSING_PARAMETER("psk"));
                        return [2 /*return*/];
                    }
                    if (inclusionOn) {
                        respond(responses.COMMAND_RUNNING);
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, adapter.$setState("info.inclusionOn", true, true)];
                case 2:
                    _b.sent();
                    discovery = new gHoma.Discovery(options);
                    discovery
                        .once("inclusion finished", function (devices) { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, adapter.$setState("info.inclusionOn", false, true)];
                                case 1:
                                    _a.sent();
                                    // do something with included devices
                                    discovery.close();
                                    if (devices && devices.length > 0) {
                                        configurePlugs(devices.map(function (d) { return d.ip; }));
                                    }
                                    return [2 /*return*/];
                            }
                        });
                    }); })
                        .once("ready", function () {
                        // start inclusion
                        discovery.beginInclusion(obj.message.psk);
                    });
                    respond(responses.ACK);
                    return [2 /*return*/];
                case 3:
                    {
                        addresses = network_1.getOwnIpAddresses();
                        respond(responses.RESULT(addresses));
                        return [2 /*return*/];
                    }
                    _b.label = 4;
                case 4:
                    respond(responses.ERROR_UNKNOWN_COMMAND);
                    return [2 /*return*/];
                case 5: return [2 /*return*/];
            }
        });
    }); },
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
function configurePlugs(ipAddresses) {
    var _this = this;
    manager = (new gHoma.Manager(options))
        .once("ready", function () { return __awaiter(_this, void 0, void 0, function () {
        var promises, activePlugs;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(ipAddresses && ipAddresses.length)) return [3 /*break*/, 1];
                    // configure specific plugs
                    promises = ipAddresses.map(function (ip) { return manager.configurePlug(ip, ownIP, serverAddress.port); });
                    return [3 /*break*/, 3];
                case 1:
                    // configure all plugs
                    adapter.log.info("searching plugs");
                    return [4 /*yield*/, manager.findAllPlugs()];
                case 2:
                    activePlugs = _a.sent();
                    // und zu konfigurieren
                    promises = activePlugs.map(function (addr) { return manager.configurePlug(addr.ip, ownIP, serverAddress.port); });
                    _a.label = 3;
                case 3: return [4 /*yield*/, Promise.all(promises)];
                case 4:
                    _a.sent();
                    manager.close();
                    return [2 /*return*/];
            }
        });
    }); });
}
function readPlugs() {
    return __awaiter(this, void 0, void 0, function () {
        var iobPlugs, _i, _a, _b, id, iobPlug, plugId, plug, state, e_1;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 10, , 11]);
                    adapter.log.info("enumerating known plugs...");
                    return [4 /*yield*/, global_1.Global.$$(adapter.namespace + ".*", "device")];
                case 1:
                    iobPlugs = _c.sent();
                    _i = 0, _a = object_polyfill_1.entries(iobPlugs);
                    _c.label = 2;
                case 2:
                    if (!(_i < _a.length)) return [3 /*break*/, 9];
                    _b = _a[_i], id = _b[0], iobPlug = _b[1];
                    plugId = id.substr(id.lastIndexOf(".") + 1).toLowerCase();
                    plug = {
                        id: plugId,
                        ip: null,
                        port: null,
                        type: iobPlug.native.type,
                        firmware: iobPlug.native.firmware,
                        lastSeen: 0,
                        lastSwitchSource: "unknown",
                        shortmac: iobPlug.native.shortmac,
                        mac: iobPlug.native.mac,
                        online: false,
                        state: false,
                        energyMeasurement: {},
                    };
                    plugs[plugId] = plug;
                    return [4 /*yield*/, adapter.$getState(id + ".info.lastSeen")];
                case 3:
                    state = _c.sent();
                    if (state && state.val != null)
                        plug.lastSeen = state.val;
                    return [4 /*yield*/, adapter.$getState(id + ".info.lastSwitchSource")];
                case 4:
                    state = _c.sent();
                    if (state && state.val != null)
                        plug.lastSwitchSource = state.val;
                    return [4 /*yield*/, adapter.$getState(id + ".info.ip")];
                case 5:
                    state = _c.sent();
                    if (state && state.val != null)
                        plug.ip = state.val;
                    return [4 /*yield*/, adapter.$getState(id + ".info.port")];
                case 6:
                    state = _c.sent();
                    if (state && state.val != null)
                        plug.port = state.val;
                    // nicht den Schaltzustand, der wird vom Gerät selbst verraten
                    // Erreichbarkeit prüfen
                    plug.online = (Date.now() - plug.lastSeen <= 60000);
                    return [4 /*yield*/, adapter.$setStateChanged(id + ".info.alive", plug.online, true)];
                case 7:
                    _c.sent();
                    global_1.Global.log("found plug with id " + plugId + " (" + (plug.online ? "online" : "offline") + ")");
                    _c.label = 8;
                case 8:
                    _i++;
                    return [3 /*break*/, 2];
                case 9: return [3 /*break*/, 11];
                case 10:
                    e_1 = _c.sent();
                    return [3 /*break*/, 11];
                case 11: return [2 /*return*/];
            }
        });
    });
}
function extendPlug(plug) {
    return __awaiter(this, void 0, void 0, function () {
        var prefix, promises, _i, _a, measurement;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    prefix = plug.id.toUpperCase();
                    promises = [
                        // Gerät selbst
                        adapter.$extendOrCreateObject("" + prefix, {
                            type: "device",
                            common: {
                                name: "G-Homa WiFi plug " + plug.id.toUpperCase(),
                            },
                            native: {
                                id: plug.id,
                                shortmac: plug.shortmac,
                                mac: plug.mac,
                                type: plug.type,
                                firmware: plug.firmware,
                            },
                        }),
                        // Info-Channel
                        adapter.$extendOrCreateObject(prefix + ".info", {
                            type: "channel",
                            common: {
                                name: "Information über das Gerät",
                            },
                            native: {},
                        }),
                        // Kommunikation
                        adapter.$extendOrCreateObject(prefix + ".info.alive", {
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
                        adapter.$extendOrCreateObject(prefix + ".info.lastSeen", {
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
                        adapter.$extendOrCreateObject(prefix + ".info.ip", {
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
                        adapter.$extendOrCreateObject(prefix + ".info.port", {
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
                        adapter.$extendOrCreateObject(prefix + ".lastSwitchSource", {
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
                        adapter.$extendOrCreateObject(prefix + ".state", {
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
                    // Alle benötigten Energiemessungs-Objekte erstellen
                    adapter.log.debug("extendPlug: type = " + plug.type + ", energyMeasurement != null: " + (plug.energyMeasurement != null));
                    if (plug.type === "withEnergyMeasurement" && plug.energyMeasurement != null) {
                        adapter.log.debug("current != null: " + (plug.energyMeasurement.current != null));
                        if (plug.energyMeasurement.current != null) {
                            promises.push(adapter.$extendOrCreateObject(prefix + ".current", {
                                type: "state",
                                common: {
                                    name: "Stromstärke",
                                    type: "number",
                                    role: "level.current",
                                    read: true,
                                    write: false,
                                    unit: "A",
                                },
                                native: {},
                            }));
                        }
                        adapter.log.debug("powerFactor != null: " + (plug.energyMeasurement.powerFactor != null));
                        if (plug.energyMeasurement.powerFactor != null) {
                            promises.push(adapter.$extendOrCreateObject(prefix + ".powerFactor", {
                                type: "state",
                                common: {
                                    name: "Wirkfaktor",
                                    type: "number",
                                    role: "level.powerFactor",
                                    read: true,
                                    write: false,
                                },
                                native: {},
                            }));
                        }
                        adapter.log.debug("power != null: " + (plug.energyMeasurement.power != null));
                        if (plug.energyMeasurement.power != null) {
                            promises.push(adapter.$extendOrCreateObject(prefix + ".power", {
                                type: "state",
                                common: {
                                    name: "Leistungaufnahme",
                                    type: "number",
                                    role: "level.power",
                                    read: true,
                                    write: false,
                                    unit: "W",
                                },
                                native: {},
                            }));
                        }
                        adapter.log.debug("voltage != null: " + (plug.energyMeasurement.voltage != null));
                        if (plug.energyMeasurement.voltage != null) {
                            promises.push(adapter.$extendOrCreateObject(prefix + ".voltage", {
                                type: "state",
                                common: {
                                    name: "Spannung",
                                    type: "number",
                                    role: "level.voltage",
                                    read: true,
                                    write: false,
                                    unit: "V",
                                },
                                native: {},
                            }));
                        }
                    }
                    // Sicherstellen, dass die Objekte existieren
                    return [4 /*yield*/, Promise.all(promises)];
                case 1:
                    // Sicherstellen, dass die Objekte existieren
                    _b.sent();
                    // Jetzt die Werte speichern
                    promises = [
                        adapter.$setState(prefix + ".info.alive", plug.online, true),
                        adapter.$setState(prefix + ".info.lastSeen", plug.lastSeen, true),
                        adapter.$setState(prefix + ".info.ip", plug.ip, true),
                        adapter.$setState(prefix + ".info.port", plug.port, true),
                        adapter.$setState(prefix + ".lastSwitchSource", plug.lastSwitchSource, true),
                        adapter.$setState(prefix + ".state", plug.state, true),
                    ];
                    // alle vorhandenen Energiemessungs-Werte speichern
                    for (_i = 0, _a = ["voltage", "current", "power", "powerFactor"]; _i < _a.length; _i++) {
                        measurement = _a[_i];
                        adapter.log.debug(measurement + " in plug.energyMeasurement => " + (measurement in plug.energyMeasurement));
                        if (measurement in plug.energyMeasurement) {
                            promises.push(adapter.$setState(prefix + "." + measurement, plug.energyMeasurement[measurement], true));
                        }
                    }
                    return [4 /*yield*/, Promise.all(promises)];
                case 2:
                    _b.sent();
                    return [2 /*return*/];
            }
        });
    });
}
// Unbehandelte Fehler tracen
process.on("unhandledRejection", function (err) {
    adapter.log.error("unhandled promise rejection: " + err.message);
    if (err.stack != null)
        adapter.log.error("> stack: " + err.stack);
});
process.on("uncaughtException", function (err) {
    adapter.log.error("unhandled exception:" + err.message);
    if (err.stack != null)
        adapter.log.error("> stack: " + err.stack);
    process.exit(1);
});
