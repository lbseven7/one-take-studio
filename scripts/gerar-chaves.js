const { gerar } = require('../one-take-studio/chave-core.js');

const n = parseInt(process.argv[2] || '1', 10);
const keys = [];
for(let i = 0; i < n; i++) keys.push(gerar());
console.log(keys.join('\n'));
