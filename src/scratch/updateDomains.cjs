const fs = require('fs');

const domainsContent = fs.readFileSync('./src/constants/domains.ts', 'utf8');
const mapping = JSON.parse(fs.readFileSync('./src/constants/setMapping.json', 'utf8'));

let updated = domainsContent;

// We need to inject enkaId into each set
// Example:
// { id: "thundering_fury", name: "Thundering Fury" },
// =>
// { id: "thundering_fury", name: "Thundering Fury", enkaId: 15005 },

for (const [name, enkaId] of Object.entries(mapping)) {
  const regex = new RegExp(`(name:\\s*"${name}"\\s*)`, 'g');
  updated = updated.replace(regex, `$1, enkaId: ${enkaId}`);
}

// Add enkaId to the interface
updated = updated.replace(
  'export interface ArtifactSet {\n  id: string\n  name: string\n}',
  'export interface ArtifactSet {\n  id: string\n  name: string\n  enkaId?: number\n}'
);

fs.writeFileSync('./src/constants/domains.ts', updated, 'utf8');
