"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const utils = require("@iobroker/adapter-core");
const gHoma = require("g-homa");
const global_1 = require("./lib/global");
const network_1 = require("./lib/network");
const object_polyfill_1 = require("./lib/object-polyfill");
let server;
let serverAddress;
let manager;
// tslint:disable-next-line:prefer-const
let discovery;
let inclusionOn = false;
let gHomaOptions;
let ownIP;
const plugs = {};
let adapter;
/**
 * Starts the adapter instance
 */
function startAdapter(options = {}) {
    // Create the adapter and define its methods
    return adapter = utils.adapter(Object.assign({}, options, { 
        // custom options
        name: "g-homa", ready: () => __awaiter(this, void 0, void 0, function* () {
            // Adapter-Instanz global machen
            global_1.Global.adapter = adapter;
            // redirect console output
            console.log = (msg) => adapter.log.debug("STDOUT > " + msg);
            console.error = (msg) => adapter.log.error("STDERR > " + msg);
            // Objekte zurücksetzen
            yield adapter.setStateAsync("info.inclusionOn", false, true);
            // richtige IP-Adresse auswählen
            gHomaOptions = {
                networkInterfaceIndex: adapter.config.networkInterfaceIndex || 0,
            };
            ownIP = network_1.getOwnIpAddresses()[gHomaOptions.networkInterfaceIndex];
            if (ownIP == null) {
                adapter.log.error("Invalid network interface configured. Please check your configuration!");
                return;
            }
            // bekannte Plugs einlesen
            yield readPlugs();
            // Server zuerst starten, damit wir den Port kennen
            adapter.setState("info.connection", false, true);
            adapter.log.info("starting server...");
            server = new gHoma.Server(adapter.config.serverPort);
            server.once("server started", (address) => __awaiter(this, void 0, void 0, function* () {
                serverAddress = address;
                adapter.log.info(`server started on port ${address.port}`);
                adapter.setState("info.connection", true, true);
                // aktive Plugs konfigurieren
                configurePlugs();
            }));
            // auf Events des Servers lauschen
            server
                .on("server closed", () => {
                adapter.setState("info.connection", false, true);
                adapter.log.info("The local server was shut down");
            })
                .on("plug added", (id) => {
                // vorerst nichts zu tun
                adapter.log.info(`Added plug with ID ${id}`);
            })
                .on("plug updated", (plug) => {
                // Objekt merken
                plugs[plug.id] = plug;
                adapter.log.debug(`Got updated info for Plug ${plug.id}:
  state: ${plug.state ? "on" : "off"}
  switched from: ${plug.lastSwitchSource}
  type: ${plug.type}`);
                const { current, power, powerFactor, voltage, } = plug.energyMeasurement;
                if (voltage != null)
                    adapter.log.debug(`  Voltage: ${voltage} V`);
                if (current != null)
                    adapter.log.debug(`  Current: ${current} A`);
                if (power != null)
                    adapter.log.debug(`  Power: ${power} W`);
                if (powerFactor != null)
                    adapter.log.debug(`  Power factor: ${powerFactor}`);
                // und nach ioBroker exportieren
                extendPlug(plug);
            })
                .on("plug dead", (id) => __awaiter(this, void 0, void 0, function* () {
                if (plugs[id])
                    plugs[id].online = false;
                adapter.log.info(`Plug ${id} is now dead`);
                const prefix = id.toUpperCase();
                const iobID = `${prefix}.info.alive`;
                const state = yield adapter.getStateAsync(iobID);
                if (state && state.val != null) {
                    yield adapter.setStateAsync(iobID, false, true);
                }
            }))
                .on("plug alive", (id) => __awaiter(this, void 0, void 0, function* () {
                if (plugs[id])
                    plugs[id].online = true;
                adapter.log.info(`Plug ${id} is now alive`);
                const prefix = id.toUpperCase();
                const iobID = `${prefix}.info.alive`;
                const state = yield adapter.getStateAsync(iobID);
                if (state && state.val != null) {
                    yield adapter.setStateAsync(iobID, true, true);
                }
            }));
            // watch states and objects
            adapter.subscribeStates("*");
            adapter.subscribeObjects("*");
        }), 
        // is called if a subscribed object changes
        objectChange: (id, obj) => {
            // TODO: do we need this?
        }, 
        // is called if a subscribed state changes
        stateChange: (id, state) => __awaiter(this, void 0, void 0, function* () {
            if (state && !state.ack) {
                if (id.endsWith(".state")) {
                    // Switch soll geschaltet werden
                    // Device finden
                    const matches = /([0-9A-Fa-f]{6})\.state$/.exec(id);
                    if (matches && matches.length) {
                        const switchId = matches[1];
                        const obj = yield adapter.getObjectAsync(switchId.toUpperCase());
                        if (obj && obj.native.id) {
                            server.switchPlug(obj.native.id, state.val);
                        }
                    }
                }
                else if (id.match(/info\.inclusionOn/)) {
                    inclusionOn = state.val;
                }
            }
        }), message: (obj) => __awaiter(this, void 0, void 0, function* () {
            // responds to the adapter that sent the original message
            function respond(response) {
                if (obj.callback)
                    adapter.sendTo(obj.from, obj.command, response, obj.callback);
            }
            // some predefined responses so we only have to define them once
            const responses = {
                ACK: { error: null },
                OK: { error: null, result: "ok" },
                ERROR_UNKNOWN_COMMAND: { error: "Unknown command!" },
                MISSING_PARAMETER: (paramName) => {
                    return { error: 'missing parameter "' + paramName + '"!' };
                },
                COMMAND_RUNNING: { error: "command running" },
                RESULT: (result) => ({ error: null, result }),
                ERROR: (error) => ({ error }),
            };
            // make required parameters easier
            function requireParams(...params) {
                if (!(params && params.length))
                    return true;
                for (const param of params) {
                    if (!(obj.message && obj.message.hasOwnProperty(param))) {
                        respond(responses.MISSING_PARAMETER(param));
                        return false;
                    }
                }
                return true;
            }
            // handle the message
            if (obj) {
                switch (obj.command) {
                    case "inclusion":
                        if (!requireParams("psk")) {
                            respond(responses.MISSING_PARAMETER("psk"));
                            return;
                        }
                        if (inclusionOn) {
                            respond(responses.COMMAND_RUNNING);
                            return;
                        }
                        yield adapter.setStateAsync("info.inclusionOn", true, true);
                        discovery = new gHoma.Discovery(gHomaOptions);
                        discovery
                            .once("inclusion finished", (devices) => __awaiter(this, void 0, void 0, function* () {
                            yield adapter.setStateAsync("info.inclusionOn", false, true);
                            // do something with included devices
                            discovery.close();
                            if (devices && devices.length > 0) {
                                configurePlugs(devices.map(d => d.ip));
                            }
                        }))
                            .once("ready", () => {
                            // start inclusion
                            discovery.beginInclusion(obj.message.psk);
                        });
                        respond(responses.ACK);
                        return;
                    case "getIPAddresses": {
                        const addresses = network_1.getOwnIpAddresses();
                        respond(responses.RESULT(addresses));
                        return;
                    }
                    default:
                        respond(responses.ERROR_UNKNOWN_COMMAND);
                        return;
                }
            }
        }), 
        // is called when adapter shuts down - callback has to be called under any circumstances!
        unload: (callback) => {
            try {
                server.close();
                manager.close();
                callback();
            }
            catch (e) {
                callback();
            }
        } }));
}
function configurePlugs(ipAddresses) {
    manager = (new gHoma.Manager(gHomaOptions))
        .once("ready", () => __awaiter(this, void 0, void 0, function* () {
        let promises;
        if (ipAddresses && ipAddresses.length) {
            // configure specific plugs
            promises = ipAddresses.map((ip) => manager.configurePlug(ip, ownIP, serverAddress.port));
        }
        else {
            // configure all plugs
            adapter.log.info("searching plugs");
            // die Steckdosen zu suchen
            const activePlugs = yield manager.findAllPlugs();
            // und zu konfigurieren
            promises = activePlugs.map((addr) => manager.configurePlug(addr.ip, ownIP, serverAddress.port));
        }
        yield Promise.all(promises);
        manager.close();
    }));
}
function readPlugs() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            adapter.log.info("enumerating known plugs...");
            const iobPlugs = yield global_1.Global.$$(`${adapter.namespace}.*`, "device");
            for (const [id, iobPlug] of object_polyfill_1.entries(iobPlugs)) {
                // Objekt erstellen
                const plugId = id.substr(id.lastIndexOf(".") + 1).toLowerCase();
                const plug = {
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
                // Eigenschaften einlesen
                let state = yield adapter.getStateAsync(`${id}.info.lastSeen`);
                if (state && state.val != null)
                    plug.lastSeen = state.val;
                state = yield adapter.getStateAsync(`${id}.info.lastSwitchSource`);
                if (state && state.val != null)
                    plug.lastSwitchSource = state.val;
                state = yield adapter.getStateAsync(`${id}.info.ip`);
                if (state && state.val != null)
                    plug.ip = state.val;
                state = yield adapter.getStateAsync(`${id}.info.port`);
                if (state && state.val != null)
                    plug.port = state.val;
                // nicht den Schaltzustand, der wird vom Gerät selbst verraten
                // Erreichbarkeit prüfen
                plug.online = (Date.now() - plug.lastSeen <= 60000);
                yield adapter.setStateChangedAsync(`${id}.info.alive`, plug.online, true);
                global_1.Global.log(`found plug with id ${plugId} (${plug.online ? "online" : "offline"})`);
            }
        }
        catch (e) {
            // egal
        }
    });
}
function extendPlug(plug) {
    return __awaiter(this, void 0, void 0, function* () {
        const prefix = plug.id.toUpperCase();
        let promises = [
            // Gerät selbst
            extendOrCreateObject(`${prefix}`, {
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
            extendOrCreateObject(`${prefix}.info`, {
                type: "channel",
                common: {
                    name: "Information über das Gerät",
                },
                native: {},
            }),
            // Kommunikation
            extendOrCreateObject(`${prefix}.info.alive`, {
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
            extendOrCreateObject(`${prefix}.info.lastSeen`, {
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
            extendOrCreateObject(`${prefix}.info.ip`, {
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
            extendOrCreateObject(`${prefix}.info.port`, {
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
            extendOrCreateObject(`${prefix}.lastSwitchSource`, {
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
            extendOrCreateObject(`${prefix}.state`, {
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
        adapter.log.debug(`extendPlug: type = ${plug.type}, energyMeasurement != null: ${plug.energyMeasurement != null}`);
        if ( /*plug.type === "withEnergyMeasurement" &&*/plug.energyMeasurement != null) {
            adapter.log.debug(`current != null: ${plug.energyMeasurement.current != null}`);
            if (plug.energyMeasurement.current != null) {
                promises.push(extendOrCreateObject(`${prefix}.current`, {
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
            adapter.log.debug(`powerFactor != null: ${plug.energyMeasurement.powerFactor != null}`);
            if (plug.energyMeasurement.powerFactor != null) {
                promises.push(extendOrCreateObject(`${prefix}.powerFactor`, {
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
            adapter.log.debug(`power != null: ${plug.energyMeasurement.power != null}`);
            if (plug.energyMeasurement.power != null) {
                promises.push(extendOrCreateObject(`${prefix}.power`, {
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
            adapter.log.debug(`voltage != null: ${plug.energyMeasurement.voltage != null}`);
            if (plug.energyMeasurement.voltage != null) {
                promises.push(extendOrCreateObject(`${prefix}.voltage`, {
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
        yield Promise.all(promises);
        // Jetzt die Werte speichern
        promises = [
            adapter.setStateAsync(`${prefix}.info.alive`, plug.online, true),
            adapter.setStateAsync(`${prefix}.info.lastSeen`, plug.lastSeen, true),
            adapter.setStateAsync(`${prefix}.info.ip`, plug.ip, true),
            adapter.setStateAsync(`${prefix}.info.port`, plug.port, true),
            adapter.setStateAsync(`${prefix}.lastSwitchSource`, plug.lastSwitchSource, true),
            adapter.setStateAsync(`${prefix}.state`, plug.state, true),
        ];
        // alle vorhandenen Energiemessungs-Werte speichern
        for (const measurement of ["voltage", "current", "power", "powerFactor"]) {
            adapter.log.debug(`${measurement} in plug.energyMeasurement => ${measurement in plug.energyMeasurement}`);
            if (measurement in plug.energyMeasurement) {
                promises.push(adapter.setStateAsync(`${prefix}.${measurement}`, plug.energyMeasurement[measurement], true));
            }
        }
        yield Promise.all(promises);
    });
}
function extendOrCreateObject(id, obj) {
    return __awaiter(this, void 0, void 0, function* () {
        const existing = yield adapter.getObjectAsync(id);
        if (existing == null) {
            return adapter.setObjectAsync(id, obj);
        }
        else {
            // merge all properties together
            const oldObjAsString = JSON.stringify(existing);
            for (const prop of Object.keys(obj)) {
                if (typeof existing[prop] === "object") {
                    if (prop === "common") {
                        // we prefer to keep the existing properties
                        existing[prop] = Object.assign({}, obj[prop], existing[prop]);
                    }
                    else {
                        // overwrite with new ones as the firmware or similiar might actually have changed
                        existing[prop] = Object.assign({}, existing[prop], obj[prop]);
                    }
                }
                else {
                    existing[prop] = obj[prop];
                }
            }
            const newObjAsString = JSON.stringify(existing);
            if (oldObjAsString !== newObjAsString) {
                return adapter.setObjectAsync(id, existing);
            }
            else {
                // nothing to update
                return { id };
            }
        }
    });
}
// Unbehandelte Fehler tracen
process.on("unhandledRejection", (err) => {
    adapter.log.error("unhandled promise rejection: " + err.message);
    if (err.stack != null)
        adapter.log.error("> stack: " + err.stack);
});
process.on("uncaughtException", (err) => {
    adapter.log.error("unhandled exception:" + err.message);
    if (err.stack != null)
        adapter.log.error("> stack: " + err.stack);
    process.exit(1);
});
if (module.parent) {
    // Export startAdapter in compact mode
    module.exports = startAdapter;
}
else {
    // otherwise start the instance directly
    startAdapter();
}
