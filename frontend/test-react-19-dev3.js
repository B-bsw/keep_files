const React = require('react');
const props = { ref: null, a: 1 };
console.log("--- TEST DEV 4 ---");
React.createElement("div", Object.assign({ key: "mykey" }, props));
