const { test } = require('node:test');
const assert = require('node:assert/strict');
const chave = require('../one-take-studio/chave-core.js');

test('normalize: remove hífens/espaços e coloca em caixa alta', () => {
  assert.equal(
    chave.normalize('TAKEUM-L68W4-NYELN-3KBB3-KBB3K-JY45B'),
    'TAKEUML68W4NYELN3KBB3KBB3KJY45B'
  );
  assert.equal(
    chave.normalize(' takeum l68w4 nyeln 3kbb3 kbb3k jy45b '),
    'TAKEUML68W4NYELN3KBB3KBB3KJY45B'
  );
});

test('gerar: chave no formato correto e com checksum válido', () => {
  const k = chave.gerar();
  assert.match(k, /^TAKEUM-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}$/);
  assert.equal(chave.validar(k), true);
});

test('gerar: 100 chaves únicas e válidas', () => {
  const seen = new Set();
  for (let i = 0; i < 100; i++) {
    const k = chave.gerar();
    assert.equal(chave.validar(k), true);
    seen.add(k);
  }
  assert.equal(seen.size, 100);
});

test('gerarDeCodigo: determinístico', () => {
  assert.equal(
    chave.gerarDeCodigo('HP3670477666'),
    chave.gerarDeCodigo('HP3670477666')
  );
  assert.notEqual(
    chave.gerarDeCodigo('HP3670477666'),
    chave.gerarDeCodigo('HP3670477667')
  );
});

test('gerarDeCodigo: regressão da compra real', () => {
  assert.equal(
    chave.gerarDeCodigo('HP3670477666'),
    'TAKEUM-L68W4-NYELN-3KBB3-KBB3K-JY45B'
  );
});

test('gerarDeCodigo: normaliza a entrada', () => {
  assert.equal(
    chave.gerarDeCodigo('hp3670477666'),
    chave.gerarDeCodigo('HP3670477666')
  );
});

test('validar: rejeita prefixo errado', () => {
  assert.equal(chave.validar('XTAKEUM-L68W4-NYELN-3KBB3-KBB3K-JY45B'), false);
  assert.equal(chave.validar('TAKEU-L68W4-NYELN-3KBB3-KBB3K-JY45B'), false);
});

test('validar: rejeita comprimento errado', () => {
  assert.equal(chave.validar('TAKEUM-L68W4-NYELN-3KBB3-KBB3K-JY4'), false);
});

test('validar: rejeita checksum adulterado', () => {
  assert.equal(chave.validar('TAKEUM-L68W4-NYELN-3KBB3-KBB3K-JY45A'), false);
});

test('validar: aceita sem hífens e em caixa baixa', () => {
  assert.equal(chave.validar('TAKEUML68W4NYELN3KBB3KBB3KJY45B'), true);
  assert.equal(chave.validar('takeum-l68w4-nyeln-3kbb3-kbb3k-jy45b'), true);
});

test('validar: rejeita caracteres fora do ALPHABET (I, O, 0, 1)', () => {
  // Chave legítima trocando B->I, K->O, 6->0, 4->1 em posições do payload.
  const invalid = [
    'TAKEUM-LI8W4-NYELN-3KBB3-KBB3K-JY45B', // I no lugar de B
    'TAKEUM-L68W4-NYEO3-3KBB3-KBB3K-JY45B', // O no lugar de B
    'TAKEUM-L08W4-NYELN-3KBB3-KBB3K-JY45B', // 0 no lugar de 6
    'TAKEUM-L68W4-NYEL1-3KBB3-KBB3K-JY45B'  // 1 no lugar de N
  ];
  invalid.forEach(k => assert.equal(chave.validar(k), false, 'deveria rejeitar: ' + k));
});

test('validar: rejeita caracteres acentuados e símbolos', () => {
  assert.equal(chave.validar('TAKEUM-Á68W4-NYELN-3KBB3-KBB3K-JY45B'), false);
  assert.equal(chave.validar('TAKEUM!6!W4-NYELN-3KBB3-KBB3K-JY45B'), false);
});

test('validar: símbolo extra entre grupos não invalida (leniência por design)', () => {
  assert.equal(chave.validar('TAKEUM-L68W4-NYELN-3KBB3-KBB3K-JY45B!'), true);
  assert.equal(chave.validar('TAKEUM-L68W4-NYELN-3KBB3-KBB3K-JY45B-'), true);
});

test('validar: rejeita vazio e null', () => {
  assert.equal(chave.validar(''), false);
  assert.equal(chave.validar(null), false);
  assert.equal(chave.validar(undefined), false);
});

test('gerarDeCodigo: nunca produz caracteres fora do ALPHABET', () => {
  for (let i = 0; i < 50; i++) {
    const k = chave.gerarDeCodigo('COD-' + i + '-TESTE');
    const rest = chave.normalize(k).slice(6);
    assert.match(rest, /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{25}$/, 'chars proibidos em: ' + k);
  }
});

test('gerar: nunca produz caracteres fora do ALPHABET', () => {
  for (let i = 0; i < 50; i++) {
    const k = chave.gerar();
    const rest = chave.normalize(k).slice(6);
    assert.match(rest, /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{25}$/, 'chars proibidos em: ' + k);
  }
});

test('gerarDeCodigo: caracteres I/O/0/1 no código não alteram determinismo', () => {
  const a = chave.gerarDeCodigo('CODIGO-COM-I0O1');
  const b = chave.gerarDeCodigo('codigo-com-i0o1');
  assert.equal(a, b);
});
