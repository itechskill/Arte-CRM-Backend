const fs = require('fs');
const path = require('path');

function walk(dir, done) {
  let results = [];
  fs.readdir(dir, function(err, list) {
    if (err) return done(err);
    let pending = list.length;
    if (!pending) return done(null, results);
    list.forEach(function(file) {
      file = path.resolve(dir, file);
      fs.stat(file, function(err, stat) {
        if (stat && stat.isDirectory()) {
          walk(file, function(err, res) {
            results = results.concat(res);
            if (!--pending) done(null, results);
          });
        } else {
          if (file.endsWith('.jsx') || file.endsWith('.js') || file.endsWith('.css')) {
            results.push(file);
          }
          if (!--pending) done(null, results);
        }
      });
    });
  });
}

walk('d:/Our CRM/universal crm/Arte CRM/frontend/src', function(err, results) {
  if (err) throw err;
  let changedFiles = 0;
  results.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;
    
    // Replace standalone $ followed by a number with PKR 
    // e.g. $98,765 -> PKR 98,765
    content = content.replace(/\$([0-9])/g, 'PKR $1');

    // Replace $ followed by a template literal expression used for currency
    // e.g. ${Number(...)} or $${priceVal}
    // Note: JS template literal syntax is `${...}`.
    // If it's JSX, they might use `$` outside the expression: `${Number(...)}` in JSX translates to:
    // literal $ then {Number(...)}.
    // So if we see \$\{ we can't just replace it because it might be a normal template literal.
    // BUT if we see \$\$\{, it means a literal $ followed by a template literal.
    // E.g. `$${priceVal}` -> `PKR ${priceVal}`
    content = content.replace(/\$\$\{/g, 'PKR ${');

    // In JSX, currency format:
    // \$\{ followed by a JS expression inside JSX where the $ is literal.
    // E.g. \$\{Number(
    // Wait, \$\{ is literal $ followed by {.
    // Let's just do a specific replace for \$\{Number( and \$\{invoices.
    content = content.replace(/\$\{([a-zA-Z0-9_\.]+(?:\(.*\))?\.toLocaleString\(\))\}/g, 'PKR ${$1}');
    
    // There are cases in JSX like: 
    // \$\{Number(stats.achievedAmount || 0).toLocaleString()\}
    // Wait, in JSX it's `$` followed by `{Number(stats.achievedAmount || 0).toLocaleString()}`
    // Let's replace `\$\{` with `PKR \{` but ONLY if it looks like a currency.
    // Instead of doing this blindly, let's just replace `$` with `PKR ` if it's used for currency.
    // E.g. `\$\{Number\(` -> `PKR \{Number\(`
    content = content.replace(/\$\{Number\(/g, 'PKR {Number(');
    content = content.replace(/\$\{stats\./g, 'PKR {stats.');
    content = content.replace(/\$\{invoices\./g, 'PKR {invoices.');
    content = content.replace(/\$\{performance\./g, 'PKR {performance.');

    // In template literals: `${stats.achievedAmount}` -> might not have a literal `$` before it.
    // Let's look for `(\$)\{` in the code, which means it was `$ {` with space or without.
    // For exact strings: "Target Amount ($)" -> "Target Amount (PKR)"
    content = content.replace(/\(\$\)/g, '(PKR)');
    content = content.replace(/ \(\$\) /g, ' (PKR) ');
    content = content.replace(/ \(\$\)/g, ' (PKR)');
    
    // Replace '$' string literals with 'PKR'
    content = content.replace(/'\$'/g, "'PKR'");
    content = content.replace(/"\$"/g, '"PKR"');
    content = content.replace(/`\$`/g, "`PKR`");

    if (content !== original) {
      fs.writeFileSync(file, content, 'utf8');
      changedFiles++;
    }
  });
  console.log(`Updated ${changedFiles} files with PKR currency.`);
});
