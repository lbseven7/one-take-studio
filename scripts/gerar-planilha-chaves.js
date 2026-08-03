const fs = require('fs');
const path = require('path');
const { gerar } = require('../one-take-studio/chave-core.js');

const qtd = parseInt(process.argv[2] || '10', 10);
const dir = path.join(__dirname, '..', 'venda-hotmart');
fs.mkdirSync(dir, { recursive: true });

const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
let nome = 'chaves-' + stamp + '.csv';
let caminho = path.join(dir, nome);
let n = 1;
while (fs.existsSync(caminho)) {
  nome = 'chaves-' + stamp + '-' + (++n) + '.csv';
  caminho = path.join(dir, nome);
}

const linhas = ['chave,usada,email,data'];
for (let i = 0; i < qtd; i++) linhas.push(gerar() + ',,,');
fs.writeFileSync(caminho, linhas.join('\n') + '\n', 'utf8');

console.log('Geradas ' + qtd + ' chaves em venda-hotmart/' + nome);
console.log('Abra o arquivo, copie tudo e cole na planilha Google a partir da celula A1.');
