"use strict";
///
/// Stellt einen Promise-Wrapper für asynchrone Node-Funktionen zur Verfügung
///

//export type CallbackFunction = (error: Error, result?: any) => void;
//export type PromisifiableFunction = (...args: any[], callback: CallbackFunction) => void;
export type PromiseCallback = (value: any) => {} | PromiseLike<any>

export function promisify<T>(fn, context): (...args: any[]) => Promise<T>;
export function promisify(fn, context) {
	return function (...args) {
		context = context || this;
		return new Promise(function (resolve, reject) {
			fn.apply(context, [...args, function (error, result) {
				if (error)
					return reject(error);
				else
					return resolve(result);
			}]);
		});
	};
}

export function promisifyNoError<T>(fn, context): (...args: any[]) => Promise<T>;
export function promisifyNoError(fn, context) {
    return function(...args) {
        context = context || this;
        return new Promise(function(resolve, reject) {
            fn.apply(context, [...args, function(result) {
                return resolve(result);
            }]);
        });
    };
}

export function waterfall(...fn: PromiseCallback[]): Promise<any> {
	// Führt eine Reihe von Promises sequentiell aus
	// TODO: Rückgabewerte prüfen (ob da was zu viel ist)
	return fn.reduce(
		(prev, cur) => prev.then(cur),
		Promise.resolve()
	);
}