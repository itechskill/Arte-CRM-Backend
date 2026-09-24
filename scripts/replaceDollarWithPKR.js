const fs = require('fs');
const path = require('path');

const frontendSrc = path.join(__dirname, '..', '..', 'frontend', 'src');

let totalChanges = 0;

function cleanDollars(filePath) {
  if (!fs.existsSync(filePath)) return;
  const stat = fs.statSync(filePath);
  if (stat.isDirectory()) {
    const files = fs.readdirSync(filePath);
    for (const f of files) {
      cleanDollars(path.join(filePath, f));
    }
  } else if (stat.isFile() && (filePath.endsWith('.jsx') || filePath.endsWith('.js'))) {
    let content = fs.readFileSync(filePath, 'utf8');
    const original = content;

    // Replace PKR $ or PKR$ or $PKR
    content = content.replace(/PKR\s*\$/g, 'PKR ');
    content = content.replace(/\$\s*PKR/g, 'PKR ');

    // Replace ($k) or ($K) or ($)
    content = content.replace(/\(\$k\)/gi, '(in PKR k)');
    content = content.replace(/\(\$K\)/g, '(in PKR k)');
    content = content.replace(/\(in \$K\)/gi, '(in PKR k)');

    // Replace $ inside amount strings like `$ ${` or `$${` or `$ ` + digits or `${` where currency is intended
    content = content.replace(/\$\s*(\d|\{)/g, 'PKR $1');

    // Remove double PKR PKR if created
    content = content.replace(/PKR\s*PKR/g, 'PKR');

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Cleaned dollars in: ${filePath}`);
      totalChanges++;
    }
  }
}

cleanDollars(frontendSrc);
console.log(`\nFinished cleaning dollar signs in ${totalChanges} files.`);
