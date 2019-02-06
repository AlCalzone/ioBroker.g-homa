/// <reference types="iobroker" />
export declare class Global {
    static readonly loglevels: Readonly<{
        off: number;
        on: number;
        ridiculous: number;
    }>;
    static readonly severity: Readonly<{
        normal: number;
        warn: number;
        error: number;
    }>;
    private static _adapter;
    static adapter: ioBroker.Adapter;
    private static _loglevel;
    static loglevel: number;
    static log(message: string, { level, severity }?: {
        level?: number;
        severity?: number;
    }): void;
    /**
     * Kurzschreibweise für die Ermittlung eines Objekts
     * @param id
     */
    static $(id: string): Promise<ioBroker.Object>;
    /**
     * Kurzschreibweise für die Ermittlung mehrerer Objekte
     * @param id
     */
    static $$(pattern: string, type: ioBroker.ObjectType, role?: string): Promise<{
        [id: string]: ioBroker.Object;
    }>;
    static subscribeStates: (pattern: string | RegExp, callback: (id: string, state: ioBroker.State) => void) => string;
    static unsubscribeStates: (id: string) => void;
    static subscribeObjects: (pattern: string | RegExp, callback: (id: string, object: ioBroker.Object) => void) => string;
    static unsubscribeObjects: (id: string) => void;
}
