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
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
};

const files = [...walk('app'), ...walk('components')];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  // Revert dark mode unintentional replacements
  content = content.replace(/dark:bg-\[\#F5FEFD\]/g, 'dark:bg-white');
  content = content.replace(/dark:hover:bg-\[\#F5FEFD\]/g, 'dark:hover:bg-white');
  content = content.replace(/dark:selection:bg-\[\#F5FEFD\]/g, 'dark:selection:bg-white');
  
  fs.writeFileSync(file, content);
});
console.log("Done fixing dark mode.");
