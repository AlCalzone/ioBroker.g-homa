const path = require("path");
const { tests, utils } = require("@iobroker/testing");
const adapterDir = path.join(__dirname, "..");

// Run tests
tests.packageFiles(adapterDir);
