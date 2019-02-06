declare global {
    namespace ioBroker {
        interface AdapterConfig {
            "wifiKey": string;
            "serverPort": number;
            "networkInterfaceIndex": number;
        }
    }
}
export {};
