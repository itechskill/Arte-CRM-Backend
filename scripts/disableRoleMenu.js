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
          if (file.endsWith('.jsx')) results.push(file);
          if (!--pending) done(null, results);
        }
      });
    });
  });
}

walk('d:/Our CRM/universal crm/Arte CRM/frontend/src', function(err, results) {
  let count = 0;
  results.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;
    
    // Replace the exact lines where the menu is toggled to be disabled via false &&
    content = content.replace(/\{\(userRole === 'admin' \|\| userRole === 'ceo'\) && showRoleMenu && \(/g, '{false && (userRole === \'admin\' || userRole === \'ceo\') && showRoleMenu && (');
    content = content.replace(/\{showRoleMenu && \(/g, '{false && showRoleMenu && (');
    
    // Some places had `onClick={() => setShowRoleMenu(!showRoleMenu)}` on the role selector itself.
    // We can also disable that so the UI doesn't even feel interactive if we want, but hiding the menu is enough.
    
    if (content !== original) {
      fs.writeFileSync(file, content, 'utf8');
      count++;
    }
  });
  console.log('Fixed role menus in ' + count + ' files.');
});
