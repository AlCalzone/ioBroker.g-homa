import { Global as _, ExtendedAdapter } from "./lib/global";
import { getOwnIpAddresses } from "./lib/network";
import { entries } from "./lib/object-polyfill";
import utils from "./lib/utils";
import * as gHoma from "g-homa";

let server: gHoma.Server;
let manager: gHoma.Manager;
let discovery: gHoma.Discovery;

const ownIP = getOwnIpAddresses()[0];

const plugs: { [id: string]: gHoma.Plug } = {};

let adapter: ExtendedAdapter = utils.adapter({
    name: 'g-homa',

	ready: async () => {

		// Adapter-Instanz global machen
		adapter = _.extend(adapter);
		_.adapter = adapter;

		// bekannte Plugs einlesen
		await readPlugs();

		// Server zuerst starten, damit wir den Port kennen
		adapter.setState("info.connection", false, true);
		adapter.log.info("starting server...");
		server = new gHoma.Server();
		server.once("server started", (address: gHoma.ServerAddress) => {
			adapter.log.info(`server started on port ${address.port}`);
			adapter.setState("info.connection", true, true);

			// Manager starten, um
			manager = new gHoma.Manager();
			manager.once("ready", async () => {

				// die Steckdosen zu suchen
				const plugs = await manager.findAllPlugs();
				// und zu konfigurieren
				const promises = plugs.map(addr => manager.configurePlug(addr.ip, ownIP, address.port));
				await Promise.all(promises);

			});

		});
		// auf Events des Servers lauschen
		server
			.on("server closed", () => {
				adapter.setState("info.connection", false, true);
			})
			.on("plug added", (id: string) => {
				// vorerst nichts zu tun
			})
			.on("plug updated", (plug: gHoma.Plug) => {
				// Objekt merken
				plugs[plug.id] = plug;
				// und nach ioBroker exportieren
				extendPlug(plug);
			})
			.on("plug dead", async (id: string) => {
				if (plugs[id])
					plugs[id].online = false;

				const iobID = `${id}.alive`;
				let state = await adapter.$getState(iobID);
				if (state && state.val != null)
					await adapter.$setState(iobID, false, true);
			})
			.on("plug alive", async (id: string) => {
				if (plugs[id]) plugs[id].online = true;

				const iobID = `${id}.alive`;
				let state = await adapter.$getState(iobID);
				if (state && state.val != null)
					await adapter.$setState(iobID, true, true);
			})
			;

		// watch states and objects
		adapter.subscribeStates("*");
		adapter.subscribeObjects("*");

	},

    // is called if a subscribed object changes
    objectChange: (id, obj) => {
        
    },

    // is called if a subscribed state changes
    stateChange: (id, state) => {
		if (state && !state.ack) {
			if (id.endsWith(".state")) {
				// Switch soll geschaltet werden
				// Device finden
				const matches = /([0-9A-Fa-f]{6})\.state$/.exec(id);
				if (matches && matches.length) {
					const switchId = matches[1];
					server.switchPlug(switchId, state.val);
				}
			}
		}
    },

    message: (obj) => {
        
    },

	// is called when adapter shuts down - callback has to be called under any circumstances!
	unload: (callback) => {
		try {
			server.close();
			manager.close();
			
			callback();
		} catch (e) {
			callback();
		}
	},


}) as ExtendedAdapter;

async function readPlugs() : Promise<void> {
	try {
		adapter.log.info("enumerating known plugs...");
		const iobPlugs = await _.$$(`${adapter.namespace}.*`, "device");
		for (let [id, iobPlug] of entries(iobPlugs)) {
			// Objekt erstellen
			const plug = {
				id: id,
				ip: null,
				port: null,
				lastSeen: 0,
				lastSwitchSource: "unknown" as gHoma.SwitchSource,
				shortmac: iobPlug.native.shortmac,
				mac: iobPlug.native.mac,
				online: false,
				state: false
			};
			plugs[id] = plug;
			// Eigenschaften einlesen
			let state = await adapter.$getState(`${id}.lastSeen`);
			if (state && state.val != null) plug.lastSeen = state.val;

			state = await adapter.$getState(`${id}.lastSwitchSource`);
			if (state && state.val != null) plug.lastSwitchSource = state.val;

			state = await adapter.$getState(`${id}.ip`);
			if (state && state.val != null) plug.ip = state.val;

			state = await adapter.$getState(`${id}.port`);
			if (state && state.val != null) plug.port = state.val;

			// nicht den Schaltzustand, der wird vom Gerät selbst verraten
		}
	}
	catch (e) {
		// egal
	}

}

async function extendPlug(plug: gHoma.Plug) {
	const prefix = plug.id;
	let promises: Promise<any>[] = [
		// Gerät selbst
		adapter.$setObjectNotExists(
			`${plug.id}`, {
				type: "device",
				common: {
					name: "G-Homa WiFi plug " + plug.id,
				},
				native: {
					shortmac: plug.shortmac,
					mac: plug.mac
				}
			}
		),
		// Info-Channel
		adapter.$setObjectNotExists(
			`${plug.id}.info`, {
				type: "channel",
				common: {
					name: "Information über das Gerät",
				},
				native: {}
			}
		),
		// Kommunikation
		adapter.$setObjectNotExists(
			`${plug.id}.info.alive`, {
				"type": "state",
				"common": {
					"name": "Ob das Gerät erreichbar ist",
					"type": "boolean",
					"role": "indicator.reachable",
					"read": true,
					"write": false
				},
				native: {}
			}
		),
		adapter.$setObjectNotExists(
			`${plug.id}.info.lastSeen`, {
				"type": "state",
				"common": {
					"name": "Wann zuletzt eine Rückmeldung vom Gerät kam",
					"type": "number",
					"role": "value.time",
					"read": true,
					"write": false
				},
				native: {}
			}
		),
		adapter.$setObjectNotExists(
			`${plug.id}.info.ip`, {
				"type": "state",
				"common": {
					"name": "Letzte bekannte IP-Adresse",
					"type": "string",
					"role": "value",
					"read": true,
					"write": false
				},
				native: {}
			}
		),
		adapter.$setObjectNotExists(
			`${plug.id}.info.port`, {
				"type": "state",
				"common": {
					"name": "Letzter bekannter Port",
					"type": "number",
					"role": "value",
					"read": true,
					"write": false
				},
				native: {}
			}
		),
		// Schalten des Geräts
		adapter.$setObjectNotExists(
			`${plug.id}.lastSwitchSource`, {
				"type": "state",
				"common": {
					"name": "Von wo das Gerät zuletzt geschaltet wurde (remote oder lokal)",
					"type": "string",
					"role": "text",
					"read": true,
					"write": false
				},
				native: {}
			}
		),
		adapter.$setObjectNotExists(
			`${plug.id}.state`, {
				"type": "state",
				"common": {
					"name": "Schaltzustand des Geräts",
					"type": "boolean",
					"role": "switch",
					"read": true,
					"write": true
				},
				native: {}
			}
		),
	];
	// Sicherstellen, dass die Objekte existieren
	await Promise.all(promises);

	// Jetzt die Werte speichern
	promises = [
		adapter.$setState(`${plug.id}.info.alive`, plug.online, true),
		adapter.$setState(`${plug.id}.info.lastSeen`, plug.lastSeen, true),
		adapter.$setState(`${plug.id}.info.ip`, plug.ip, true),
		adapter.$setState(`${plug.id}.info.port`, plug.port, true),
		adapter.$setState(`${plug.id}.lastSwitchSource`, plug.lastSwitchSource, true),
		adapter.$setState(`${plug.id}.state`, plug.state, true),
	];
	await Promise.all(promises);

}