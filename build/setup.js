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
Object.defineProperty(exports, "__esModule", { value: true });
var minimist = require("minimist");
var gHoma = require("g-homa");
var argv = minimist(process.argv.slice(2));
//console.dir(argv);
function printUsage() {
    console.log("usage: node setup.js <command> [options]");
    console.log("the supported commands are:");
    console.log("");
    console.log("  include --psk=<wifi key>");
    console.log("include new plugs into the WiFi network");
    console.log("");
    console.log("  configure [--server=<server ip> --port=<server port>] [--ignore <MAC>] [--restore <MAC>]");
    console.log("configures all plugs to communicate with the given server.");
    console.log("Plugs can be ignored (--ignore) or restored (--restore) to the original settings.");
    console.log("By writing those arguments multiple times, more plugs can be ignored or restored");
    console.log("");
}
function fail() {
    printUsage();
    process.exit();
}
function ensureArray(arrOrString) {
    if (typeof arrOrString === "string")
        return [arrOrString];
    return arrOrString;
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        var discovery_1, manager_1, ignoredMacs_1, restoredMacs_1;
        return __generator(this, function (_a) {
            // make sure we have exactly one command
            if (argv._.length !== 1)
                return [2 /*return*/, fail()];
            switch (argv._[0]) {
                case "include":
                    // make sure we have a psk
                    if (!("psk" in argv))
                        return [2 /*return*/, fail()];
                    console.log("starting inclusion...");
                    console.log("Please put your plug into inclusion mode (LED flashing fast)");
                    discovery_1 = new gHoma.Discovery();
                    discovery_1
                        .on("inclusion finished", function (devices) {
                        // do something with included devices
                        console.log("inclusion process finished...");
                        var numPlugs = Object.keys(devices).length;
                        if (numPlugs > 0) {
                            console.log("found " + numPlugs + " plugs:");
                            for (var _i = 0, _a = Object.keys(devices); _i < _a.length; _i++) {
                                var key = _a[_i];
                                console.log("  IP = " + key + ", MAC = " + devices[key]);
                            }
                        }
                        else {
                            console.log("no plugs found!");
                        }
                        // we're done!
                        process.exit(0);
                    })
                        .once("ready", function () {
                        // start inclusion
                        discovery_1.beginInclusion(argv.psk);
                    });
                    break;
                case "configure":
                    manager_1 = new gHoma.Manager();
                    ignoredMacs_1 = ensureArray(argv.ignore || []);
                    restoredMacs_1 = ensureArray(argv.restore || []);
                    manager_1
                        .once("ready", function () { return __awaiter(_this, void 0, void 0, function () {
                        var plugs, numPlugs, promises;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    console.log("searching plugs...");
                                    return [4 /*yield*/, manager_1.findAllPlugs()];
                                case 1:
                                    plugs = _a.sent();
                                    numPlugs = Object.keys(plugs).length;
                                    console.log(numPlugs + " plugs found");
                                    console.log("");
                                    console.log("configuring plugs...");
                                    promises = plugs.map(function (p) {
                                        if (p.mac in ignoredMacs_1) {
                                            // don't care
                                        }
                                        else if (p.mac in restoredMacs_1) {
                                            // reset this plug
                                            return manager_1.restorePlug(p.ip);
                                        }
                                        else if ("server" in argv && "port" in argv) {
                                            // configure this plug
                                            return manager_1.configurePlug(p.ip, argv.server, argv.port);
                                        }
                                    });
                                    return [4 /*yield*/, Promise.all(promises)];
                                case 2:
                                    _a.sent();
                                    console.log("done!");
                                    // we're done!
                                    process.exit(0);
                                    return [2 /*return*/];
                            }
                        });
                    }); });
                    break;
                default:
                    return [2 /*return*/, fail()];
            }
            return [2 /*return*/];
        });
    });
}
main();
