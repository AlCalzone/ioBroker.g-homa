"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function promisify(fn, context) {
    return function (...args) {
        context = context || this;
        return new Promise((resolve, reject) => {
            fn.apply(context, [...args, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    else {
                        return resolve(result);
                    }
                }]);
        });
    };
}
exports.promisify = promisify;
function promisifyNoError(fn, context) {
    return function (...args) {
        context = context || this;
        return new Promise((resolve, reject) => {
            fn.apply(context, [...args, (result) => {
                    return resolve(result);
                }]);
        });
    };
}
exports.promisifyNoError = promisifyNoError;
function waterfall(...fn) {
    // Führt eine Reihe von Promises sequentiell aus
    // TODO: Rückgabewerte prüfen (ob da was zu viel ist)
    return fn.reduce((prev, cur) => prev.then(cur), Promise.resolve());
}
exports.waterfall = waterfall;
