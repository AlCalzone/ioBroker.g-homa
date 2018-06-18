"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var os = require("os");
/**
 * Returns the broadcast addresses for all connected interfaces
 */
function getBroadcastAddresses() {
    // enumerate interfaces
    var net = os.networkInterfaces();
    var broadcastAddresses = Object.keys(net)
        // flatten the array structure
        .map(function (k) { return net[k]; })
        .reduce(function (prev, cur) { return prev.concat.apply(prev, cur); }, [])
        // only use external IPv4 ones
        .filter(function (add) { return !add.internal && add.family === "IPv4"; })
        // extract address and subnet as number array
        .map(function (k) { return ({
        address: k.address.split(".").map(function (num) { return +num; }),
        netmask: k.netmask.split(".").map(function (num) { return +num; }),
    }); })
        // broadcast is address OR (not netmask)
        .map(function (add) { return add.address.map(function (val, i) { return (val | ~add.netmask[i]) & 0xff; }); })
        // ignore unconnected ones
        .filter(function (add) { return add[0] !== 169; })
        // turn the address into a string again
        .map(function (a) { return a[0] + "." + a[1] + "." + a[2] + "." + a[3]; });
    return broadcastAddresses;
}
exports.getBroadcastAddresses = getBroadcastAddresses;
/**
 * Returns the broadcast addresses for all connected interfaces
 */
function getOwnIpAddresses() {
    // enumerate interfaces
    var net = os.networkInterfaces();
    var addresses = Object.keys(net)
        // flatten the array structure
        .map(function (k) { return net[k]; })
        .reduce(function (prev, cur) { return prev.concat.apply(prev, cur); }, [])
        // only use external IPv4 ones
        .filter(function (add) { return !add.internal && add.family === "IPv4"; })
        // extract address as number array
        .map(function (k) { return k.address.split(".").map(function (num) { return +num; }); })
        // ignore unconnected ones
        .filter(function (add) { return add[0] !== 169; })
        // turn the address into a string again
        .map(function (a) { return a[0] + "." + a[1] + "." + a[2] + "." + a[3]; });
    return addresses;
}
exports.getOwnIpAddresses = getOwnIpAddresses;
