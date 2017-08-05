export declare function entries<T>(obj: {
    [id: string]: T;
}): [string, T][];
export declare function values<T>(obj: {
    [id: string]: T;
}): T[];
export declare function filter(obj: any, predicate: any): {
    [key: string]: any;
};
export declare function composeObject<T>(properties: [string, T][]): {
    [key: string]: T;
};
