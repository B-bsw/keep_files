const ReactJSXDev = require('react/jsx-dev-runtime');
const props = { ref: null, a: 1 };
console.log("--- TEST DEV 1 ---");
ReactJSXDev.jsxDEV("div", props, "mykey", false, { fileName: "test.js", lineNumber: 1, columnNumber: 1 }, this);
console.log("--- TEST DEV 2 ---");
ReactJSXDev.jsxDEV("div", { key: "mykey", ...props }, undefined, false, { fileName: "test.js", lineNumber: 2, columnNumber: 1 }, this);
