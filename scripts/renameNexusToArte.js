const fs = require('fs');
const path = require('path');

const dirsToScan = [
  path.join(__dirname, '..', '..', 'frontend', 'src'),
  path.join(__dirname, '..', 'controllers'),
  path.join(__dirname, '..', 'middleware'),
  path.join(__dirname, '..', 'models'),
  path.join(__dirname, '..', 'routes'),
  path.join(__dirname, '..', 'utils'),
  path.join(__dirname, '..', 'scripts'),
  path.join(__dirname, '..', 'server.js'),
  path.join(__dirname, '..', 'package.json')
];

let totalReplacements = 0;

function processFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const stat = fs.statSync(filePath);
  if (stat.isDirectory()) {
    const files = fs.readdirSync(filePath);
    for (const f of files) {
      processFile(path.join(filePath, f));
    }
  } else if (stat.isFile()) {
    if (filePath.endsWith('.js') || filePath.endsWith('.jsx') || filePath.endsWith('.json') || filePath.endsWith('.html') || filePath.endsWith('.css')) {
      let content = fs.readFileSync(filePath, 'utf8');
      const original = content;

      content = content.replace(/Arte CRM/g, 'Arte CRM');
      content = content.replace(/Arte CRM/g, 'Arte CRM');
      content = content.replace(/Arte/g, 'Arte');
      content = content.replace(/arte/g, 'arte');

      if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated: ${filePath}`);
        totalReplacements++;
      }
    }
  }
}

dirsToScan.forEach(p => processFile(p));
console.log(`\nRenamed Arte to Arte in ${totalReplacements} files.`);
