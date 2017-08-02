import utils from "./lib/utils";

const adapter = utils.adapter({
    name: 'g-homa',

	ready: () => {

	},

    // is called if a subscribed object changes
    objectChange: (id, obj) => {
        
    },

    // is called if a subscribed state changes
    stateChange: (id, state) => {
        
    },

    message: (obj) => {
        
    },

	// is called when adapter shuts down - callback has to be called under any circumstances!
	unload: (callback) => {
		try {
			callback();
		} catch (e) {
			callback();
		}
	},


});