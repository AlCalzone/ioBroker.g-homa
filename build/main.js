"use strict";
var utils_1 = require("./lib/utils");
var adapter = utils_1.default.adapter({
    name: 'g-homa',
    ready: function () {
    },
    // is called if a subscribed object changes
    objectChange: function (id, obj) {
    },
    // is called if a subscribed state changes
    stateChange: function (id, state) {
    },
    message: function (obj) {
    },
    // is called when adapter shuts down - callback has to be called under any circumstances!
    unload: function (callback) {
        try {
            callback();
        }
        catch (e) {
            callback();
        }
    },
});
//# sourceMappingURL=main.js.map