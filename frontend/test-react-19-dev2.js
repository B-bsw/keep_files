const ReactJSXDev = require('react/jsx-dev-runtime');
const props = { ref: null, a: 1 };
props.key = "mykey";
console.log("--- TEST DEV 3 ---");
ReactJSXDev.jsxDEV("div", props, undefined, false, { fileName: "test.js", lineNumber: 2, columnNumber: 1 }, this);
