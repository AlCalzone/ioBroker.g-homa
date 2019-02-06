import { entries, filter as objFilter } from "./object-polyfill";

// ==================================

const colors = {
	red: "#db3340",
	yellow: "#ffa200",
	green: "#5bb12f",
	blue: "#0087cb",
};

const replacements: {
	[id: string]: [RegExp, string | ((substring: string, ...args: any[]) => string)];
} = {
	bold: [/\*{2}(.*?)\*{2}/g, "<b>$1</b>"],
	italic: [/#{2}(.*?)#{2}/g, "<i>$1</i>"],
	underline: [/_{2}(.*?)_{2}/g, "<u>$1</u>"],
	strikethrough: [/\~{2}(.*?)\~{2}/g, "<s>$1</s>"],
	color: [/\{{2}(\w+)\|(.*?)\}{2}/, (str, p1, p2) => {
		const color = colors[p1];
		if (!color) { return str; }

		return `<span style="color: ${color}">${p2}</span>`;
	}],
	fullcolor: [/^\{{2}(\w+)\}{2}(.*?)$/, (str, p1, p2) => {
		const color = colors[p1];
		if (!color) { return str; }

		return `<span style="color: ${color}">${p2}</span>`;
	}],
};

export class Global {

	public static readonly loglevels = Object.freeze({ off: 0, on: 1, ridiculous: 2 });
	public static readonly severity = Object.freeze({ normal: 0, warn: 1, error: 2 });

	private static _adapter: ioBroker.Adapter;
	public static get adapter(): ioBroker.Adapter { return Global._adapter; }
	public static set adapter(adapter: ioBroker.Adapter) {
		Global._adapter = adapter;
	}

	private static _loglevel = Global.loglevels.on;
	public static get loglevel() { return Global._loglevel; }
	public static set loglevel(value) { Global._loglevel = value; }

	/*
		Formatierungen:
		**fett**, ##kursiv##, __unterstrichen__, ~~durchgestrichen~~
		schwarz{{farbe|bunt}}schwarz, {{farbe}}bunt
	*/
	public static log(message: string, { level = Global.loglevels.on, severity = Global.severity.normal } = {}) {
		if (!Global.adapter) return;
		if (level < Global._loglevel) return;

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
			for (const [/*key*/, [regex, repl]] of entries(replacements)) {
				if (typeof repl === "string") {
					message = message.replace(regex, repl);
				} else {
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
	public static async $(id: string) {
		return await Global._adapter.getForeignObjectAsync(id);
	}

	/**
	 * Kurzschreibweise für die Ermittlung mehrerer Objekte
	 * @param id
	 */
	public static async $$(pattern: string, type: ioBroker.ObjectType, role?: string): Promise<{ [id: string]: ioBroker.Object }> {
		const objects = await Global._adapter.getForeignObjectsAsync(pattern, type);
		if (role) {
			return objFilter(objects, (o) => o.common.role === role);
		} else {
			return objects;
		}
	}

	// custom subscriptions
	public static subscribeStates: (pattern: string | RegExp, callback: (id: string, state: ioBroker.State) => void) => string;
	public static unsubscribeStates: (id: string) => void;
	public static subscribeObjects: (pattern: string | RegExp, callback: (id: string, object: ioBroker.Object) => void) => string;
	public static unsubscribeObjects: (id: string) => void;
}
