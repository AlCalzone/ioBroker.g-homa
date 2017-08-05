"use strict";
///
/// Stellt einen Polyfill für Object.entries bereit
///
//export function* entries(obj) {
//	for (let key of Object.keys(obj)) {
//		yield [key, obj[key]];
//	}
//}
export function entries<T>(obj: { [id: string]: T }): [string, T][]
export function entries(obj: any): [string, any][] {
	return Object.keys(obj)
		.map(key => [key, obj[key]] as [string, any])
		;
	//for (let key of Object.keys(obj)) {
	//	yield [key, obj[key]];
	//}
}

///
/// Stellt einen Polyfill für Object.values bereit
///
//export function* values(obj) {
//	for (let key of Object.keys(obj)) {
//		yield obj[key];
//	}
//}
export function values<T>(obj: { [id: string]: T }): T[]
export function values(obj): any[] {
	return Object.keys(obj)
		.map(key => obj[key])
		;
}


export function filter(obj, predicate): { [key: string]: any } {
	const ret = {};
	for (let [key, val] of entries(obj)) {
		if (predicate(val)) ret[key] = val;
	}
	return ret;
}

// Kombinierte mehrere Key-Value-Paare zu einem Objekt
export function composeObject<T>(properties: [string, T][]): { [key: string]: T }
export function composeObject(properties: [string, any][]): { [key: string]: any } {
	return properties.reduce((acc, [key, value]) => {
		acc[key] = value;
		return acc;
	}, {});
}