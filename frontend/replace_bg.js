const fs = require('fs');
const path = require('path');

const walk = (dir) => {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.tsx')) {
        results.push(file);
      }
    }
  });
  return results;
};

const files = [...walk('app'), ...walk('components')];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  // Only replace inside classNames (roughly, just replacing the specific tailwind classes)
  content = content.replace(/bg-white/g, 'bg-[#F5FEFD]');
  content = content.replace(/bg-gray-50/g, 'bg-[#F5FEFD]');
  // if there's a case of hover:bg-[#F5FEFD] we might want to keep it simple
  fs.writeFileSync(file, content);
});
console.log("Done replacing.");
