"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const os = require("os");
/**
 * Returns the broadcast addresses for all connected interfaces
 */
function getBroadcastAddresses() {
    // enumerate interfaces
    const net = os.networkInterfaces();
    const broadcastAddresses = Object.keys(net)
        // flatten the array structure
        .map(k => net[k])
        .reduce((prev, cur) => prev.concat(...cur), [])
        // only use external IPv4 ones
        .filter(add => !add.internal && add.family === "IPv4")
        // extract address and subnet as number array
        .map(k => ({
        address: k.address.split(".").map(num => +num),
        netmask: k.netmask.split(".").map(num => +num),
    }))
        // broadcast is address OR (not netmask)
        .map(add => add.address.map((val, i) => (val | ~add.netmask[i]) & 0xff))
        // ignore unconnected ones
        .filter(add => add[0] !== 169)
        // turn the address into a string again
        .map(a => `${a[0]}.${a[1]}.${a[2]}.${a[3]}`);
    return broadcastAddresses;
}
exports.getBroadcastAddresses = getBroadcastAddresses;
/**
 * Returns the broadcast addresses for all connected interfaces
 */
function getOwnIpAddresses() {
    // enumerate interfaces
    const net = os.networkInterfaces();
    const addresses = Object.keys(net)
        // flatten the array structure
        .map(k => net[k])
        .reduce((prev, cur) => prev.concat(...cur), [])
        // only use external IPv4 ones
        .filter(add => !add.internal && add.family === "IPv4")
        // extract address as number array
        .map(k => k.address.split(".").map(num => +num))
        // ignore unconnected ones
        .filter(add => add[0] !== 169)
        // turn the address into a string again
        .map(a => `${a[0]}.${a[1]}.${a[2]}.${a[3]}`);
    return addresses;
}
exports.getOwnIpAddresses = getOwnIpAddresses;
