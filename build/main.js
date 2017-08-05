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
const global_1 = require("./lib/global");
const network_1 = require("./lib/network");
const object_polyfill_1 = require("./lib/object-polyfill");
const utils_1 = require("./lib/utils");
const gHoma = require("g-homa");
let server;
let manager;
let discovery;
const ownIP = network_1.getOwnIpAddresses()[0];
const plugs = {};
let adapter = utils_1.default.adapter({
    name: 'g-homa',
    ready: () => __awaiter(this, void 0, void 0, function* () {
        // Adapter-Instanz global machen
        adapter = global_1.Global.extend(adapter);
        global_1.Global.adapter = adapter;
        // redirect console output
        console.log = (msg) => adapter.log.debug("STDOUT > " + msg);
        console.error = (msg) => adapter.log.error("STDERR > " + msg);
        // bekannte Plugs einlesen
        yield readPlugs();
        // Server zuerst starten, damit wir den Port kennen
        adapter.setState("info.connection", false, true);
        adapter.log.info("starting server...");
        server = new gHoma.Server();
        server.once("server started", (address) => __awaiter(this, void 0, void 0, function* () {
            adapter.log.info(`server started on port ${address.port}`);
            adapter.setState("info.connection", true, true);
            // Manager starten, um
            manager = (new gHoma.Manager())
                .once("ready", () => __awaiter(this, void 0, void 0, function* () {
                adapter.log.info("searching plugs");
                // die Steckdosen zu suchen
                const plugs = yield manager.findAllPlugs();
                // und zu konfigurieren
                const promises = plugs.map(addr => manager.configurePlug(addr.ip, ownIP, address.port));
                yield Promise.all(promises);
            }));
        }));
        // auf Events des Servers lauschen
        server
            .on("server closed", () => {
            adapter.setState("info.connection", false, true);
        })
            .on("plug added", (id) => {
            // vorerst nichts zu tun
        })
            .on("plug updated", (plug) => {
            // Objekt merken
            plugs[plug.id] = plug;
            // und nach ioBroker exportieren
            extendPlug(plug);
        })
            .on("plug dead", (id) => __awaiter(this, void 0, void 0, function* () {
            if (plugs[id])
                plugs[id].online = false;
            const iobID = `${id}.alive`;
            let state = yield adapter.$getState(iobID);
            if (state && state.val != null)
                yield adapter.$setState(iobID, false, true);
        }))
            .on("plug alive", (id) => __awaiter(this, void 0, void 0, function* () {
            if (plugs[id])
                plugs[id].online = true;
            const iobID = `${id}.alive`;
            let state = yield adapter.$getState(iobID);
            if (state && state.val != null)
                yield adapter.$setState(iobID, true, true);
        }));
        // watch states and objects
        adapter.subscribeStates("*");
        adapter.subscribeObjects("*");
    }),
    // is called if a subscribed object changes
    objectChange: (id, obj) => {
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
                    const obj = yield adapter.$getObject(switchId.toUpperCase());
                    if (obj && obj.native.id)
                        server.switchPlug(obj.native.id, state.val);
                }
            }
        }
    }),
    //message: (obj) => {
    //},
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
    },
});
function readPlugs() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            adapter.log.info("enumerating known plugs...");
            const iobPlugs = yield global_1.Global.$$(`${adapter.namespace}.*`, "device");
            for (let [id, iobPlug] of object_polyfill_1.entries(iobPlugs)) {
                // Objekt erstellen
                const plug = {
                    id: id,
                    ip: null,
                    port: null,
                    lastSeen: 0,
                    lastSwitchSource: "unknown",
                    shortmac: iobPlug.native.shortmac,
                    mac: iobPlug.native.mac,
                    online: false,
                    state: false
                };
                plugs[id] = plug;
                // Eigenschaften einlesen
                let state = yield adapter.$getState(`${id}.lastSeen`);
                if (state && state.val != null)
                    plug.lastSeen = state.val;
                state = yield adapter.$getState(`${id}.lastSwitchSource`);
                if (state && state.val != null)
                    plug.lastSwitchSource = state.val;
                state = yield adapter.$getState(`${id}.ip`);
                if (state && state.val != null)
                    plug.ip = state.val;
                state = yield adapter.$getState(`${id}.port`);
                if (state && state.val != null)
                    plug.port = state.val;
                // nicht den Schaltzustand, der wird vom Gerät selbst verraten
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
            adapter.$setObjectNotExists(`${prefix}`, {
                type: "device",
                common: {
                    name: "G-Homa WiFi plug " + plug.id.toUpperCase(),
                },
                native: {
                    id: plug.id,
                    shortmac: plug.shortmac,
                    mac: plug.mac
                }
            }),
            // Info-Channel
            adapter.$setObjectNotExists(`${prefix}.info`, {
                type: "channel",
                common: {
                    name: "Information über das Gerät",
                },
                native: {}
            }),
            // Kommunikation
            adapter.$setObjectNotExists(`${prefix}.info.alive`, {
                "type": "state",
                "common": {
                    "name": "Ob das Gerät erreichbar ist",
                    "type": "boolean",
                    "role": "indicator.reachable",
                    "read": true,
                    "write": false
                },
                native: {}
            }),
            adapter.$setObjectNotExists(`${prefix}.info.lastSeen`, {
                "type": "state",
                "common": {
                    "name": "Wann zuletzt eine Rückmeldung vom Gerät kam",
                    "type": "number",
                    "role": "value.time",
                    "read": true,
                    "write": false
                },
                native: {}
            }),
            adapter.$setObjectNotExists(`${prefix}.info.ip`, {
                "type": "state",
                "common": {
                    "name": "Letzte bekannte IP-Adresse",
                    "type": "string",
                    "role": "value",
                    "read": true,
                    "write": false
                },
                native: {}
            }),
            adapter.$setObjectNotExists(`${prefix}.info.port`, {
                "type": "state",
                "common": {
                    "name": "Letzter bekannter Port",
                    "type": "number",
                    "role": "value",
                    "read": true,
                    "write": false
                },
                native: {}
            }),
            // Schalten des Geräts
            adapter.$setObjectNotExists(`${prefix}.lastSwitchSource`, {
                "type": "state",
                "common": {
                    "name": "Von wo das Gerät zuletzt geschaltet wurde (remote oder lokal)",
                    "type": "string",
                    "role": "text",
                    "read": true,
                    "write": false
                },
                native: {}
            }),
            adapter.$setObjectNotExists(`${prefix}.state`, {
                "type": "state",
                "common": {
                    "name": "Schaltzustand des Geräts",
                    "type": "boolean",
                    "role": "switch",
                    "read": true,
                    "write": true
                },
                native: {}
            }),
        ];
        // Sicherstellen, dass die Objekte existieren
        yield Promise.all(promises);
        // Jetzt die Werte speichern
        promises = [
            adapter.$setState(`${prefix}.info.alive`, plug.online, true),
            adapter.$setState(`${prefix}.info.lastSeen`, plug.lastSeen, true),
            adapter.$setState(`${prefix}.info.ip`, plug.ip, true),
            adapter.$setState(`${prefix}.info.port`, plug.port, true),
            adapter.$setState(`${prefix}.lastSwitchSource`, plug.lastSwitchSource, true),
            adapter.$setState(`${prefix}.state`, plug.state, true),
        ];
        yield Promise.all(promises);
    });
}
// Unbehandelte Fehler tracen
process.on('unhandledRejection', r => {
    adapter.log.error("unhandled promise rejection: " + r);
});
//# sourceMappingURL=main.js.map