import * as gHoma from "g-homa";
import * as minimist from "minimist";

const argv = minimist(process.argv.slice(2));

function printUsage() {
	console.log("usage: node setup.js <command> [options]");
	console.log("the supported commands are:");
	console.log("");
	console.log("  include [--interface=<network interface index>] --psk=<wifi key>");
	console.log("include new plugs into the WiFi network");
	console.log("");
	console.log("  configure [--interface=<network interface index>] [--server=<server ip> --port=<server port>] [--ignore <MAC>] [--restore <MAC>]");
	console.log("configures all plugs to communicate with the given server.");
	console.log("Plugs can be ignored (--ignore) or restored (--restore) to the original settings.");
	console.log("By writing those arguments multiple times, more plugs can be ignored or restored");
	console.log("");
}
function fail() {
	printUsage();
	process.exit();
}
function ensureArray(arrOrString: string | string[]): string[] {
	if (typeof arrOrString === "string") return [arrOrString];
	return arrOrString;
}

async function main() {
	// make sure we have exactly one command
	if (argv._.length !== 1) return fail();

	let options = null;
	if ("interface" in argv) {
		const index = parseInt(argv.interface, 10);
		if (!Number.isNaN(index) && index >= 0) {
			options = {networkInterfaceIndex: index};
		}
	}

	switch (argv._[0]) {
		case "include":
			// make sure we have a psk
			if (!("psk" in argv)) return fail();

			console.log("starting inclusion...");
			console.log("Please put your plug into inclusion mode (LED flashing fast)");

			const discovery = new gHoma.Discovery(options);
			discovery
				.on("inclusion finished", (devices) => {
					// do something with included devices
					console.log("inclusion process finished...");
					const numPlugs = Object.keys(devices).length;
					if (numPlugs > 0) {
						console.log(`found ${numPlugs} plugs:`);
						for (const key of Object.keys(devices)) {
							console.log(`  IP = ${key}, MAC = ${devices[key]}`);
						}
					} else {
						console.log("no plugs found!");
					}
					// we're done!
					process.exit(0);
				})
				.once("ready", () => {
					// start inclusion
					discovery.beginInclusion(argv.psk);
				})
				;
			break;

		case "configure":
			const manager = new gHoma.Manager(options);
			const ignoredMacs = ensureArray(argv.ignore || []);
			const restoredMacs = ensureArray(argv.restore || []);
			manager
				.once("ready", async () => {
					console.log("searching plugs...");
					const plugs = await manager.findAllPlugs(/* optional duration in ms */);
					const numPlugs = Object.keys(plugs).length;
					console.log(`${numPlugs} plugs found`);

					console.log("");
					console.log("configuring plugs...");
					// do the work
					const promises = plugs.map(p => {
						if (p.mac in ignoredMacs) {
							// don't care
						} else if (p.mac in restoredMacs) {
							// reset this plug
							return manager.restorePlug(p.ip);
						} else if ("server" in argv && "port" in argv) {
							// configure this plug
							return manager.configurePlug(p.ip, argv.server, argv.port);
						}
					});
					await Promise.all(promises);
					console.log("done!");
					// we're done!
					process.exit(0);
				})
				;
			break;

		default:
			return fail();
	}
}
main();
