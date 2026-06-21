const ReactJSX = require('react/jsx-runtime');
const props = { ref: null, a: 1 };
console.log("--- TEST 1 ---");
ReactJSX.jsx("div", props, "mykey");
console.log("--- TEST 2 ---");
ReactJSX.jsx("div", { key: "mykey", ...props });
