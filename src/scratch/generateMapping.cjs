const fs = require('fs');
const gdb = require('genshin-db');
const content = fs.readFileSync('./src/constants/domains.ts', 'utf8');

// Find all artifact sets by looking for id: "something" and name: "Something"
// Actually, we can just grab all name: "..." matches
const setNames = [...content.matchAll(/name:\s*"([^"]+)"/g)].map(m => m[1]);

const mapping = {};
setNames.forEach(name => {
  const a = gdb.artifacts(name);
  if (a && a.id) {
    // we also need to match it with the ID string we used, e.g. thundering_fury
    // we can extract the id string that came right before this name in the file
    // But an easier way: just print out { [name]: id } and we'll manually apply it or write a better regex
    mapping[name] = a.id;
  }
});

fs.writeFileSync('./src/constants/setMapping.json', JSON.stringify(mapping, null, 2), 'utf8');
console.log('Mapping generated!');
