const fs = require('fs');
const path = require('path');

const frontendSrc = path.join(__dirname, '..', '..', 'frontend', 'src');

function fixFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const stat = fs.statSync(filePath);
  if (stat.isDirectory()) {
    const files = fs.readdirSync(filePath);
    for (const f of files) {
      fixFile(path.join(filePath, f));
    }
  } else if (stat.isFile() && (filePath.endsWith('.jsx') || filePath.endsWith('.js'))) {
    let content = fs.readFileSync(filePath, 'utf8');
    const original = content;

    // Fix broken `PKR {` back to `${`
    content = content.replace(/PKR\s*\{/g, '${');

    // Fix double PKR PKR
    content = content.replace(/PKR\s*PKR/g, 'PKR');

    // Fix dollar signs in currency contexts:
    // e.g. `$ ${` -> `PKR ${`
    content = content.replace(/\$\s*\$\{/g, 'PKR ${');
    // e.g. `$${` -> `PKR ${`
    content = content.replace(/\$\$\{/g, 'PKR ${');

    // Fix hardcoded dollars before numbers e.g. `$100` or `$ 100` -> `PKR 100`
    content = content.replace(/\$(\s*\d+)/g, 'PKR $1');

    // Fix ($k) or ($K) or (in $K) -> (in PKR k)
    content = content.replace(/\(\$k\)/gi, '(in PKR k)');
    content = content.replace(/\(in \$K\)/gi, '(in PKR k)');

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed: ${filePath}`);
    }
  }
}

fixFile(frontendSrc);
console.log('Fix script complete.');
