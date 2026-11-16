// Verifica a integridade de docs/history.md num blob git.
//
// Uso: node scripts/check-history-integrity.mjs [ref]
//
// Le o ficheiro sem passar pelo shell, porque o shell do Windows descodifica
// a saida UTF-8 como CP1252 e mascara a corrupcao que se pretende detectar.

import { execFileSync } from 'node:child_process'

const REF = process.argv[2] ?? 'HEAD'

const text = execFileSync('git', ['show', `${REF}:docs/history.md`], {
  encoding: 'buffer',
  maxBuffer: 64 * 1024 * 1024,
}).toString('utf8')

const lines = text.split(/\r?\n/)
const headers = lines.filter((l) => l.startsWith('## '))

// Normaliza um titulo de entrada para comparar versoes do mesmo registo.
//
// O repositorio tem tres variantes do separador de titulo:
//   "—"    travessao em UTF-8 correcto
//   "-"    hifen
//   "ÔÇö"  travessao corrompido por encoding CP1252, presente em
//          origin/main desde o PR #3
// E uma variante dupla de "í", que aparece como "├¡".
//
// Todas tem de produzir a mesma chave, senao o mesmo registo e contado como
// duplicado e as entradas legadas sao vistas como distintas.
export function historyKey(header) {
  const body = header
    .replace(/^##\s+/, '')
    .replace(/^\d{4}-\d{2}-\d{2}\s*/, '')
    .replace(/ÔÇö/g, '—')
    .replace(/├¡/g, 'í')
  // o primeiro campo e o tipo (Decisao, Evento, Detalhe). A chave e o titulo.
  return (
    body
      .split(/\s*[—–-]\s*/)
      .filter(Boolean)
      .slice(1)
      .join(' ')
      .replace(/[—–-]/g, '-')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase()
      // a mesma entrada pode estar escrita com ou sem acentos, conforme o
      // momento em que foi registada. A chave ignora a acentuacao.
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
  )
}

const keys = headers.map(historyKey)
const dupes = keys.filter((k, i) => keys.indexOf(k) !== i)
const markers = lines.filter((l) => /^(<<<<<<<|=======|>>>>>>>)/.test(l)).length
const mojibake = (text.match(/ÔÇö/g) ?? []).length
const broken = (text.match(/\uFFFD/g) ?? []).length

console.log(`ref: ${REF}`)
console.log(`entradas: ${headers.length}`)
console.log(`duplicados: ${dupes.length}`)
console.log(`marcadores de conflito: ${markers}`)
console.log(`separadores corrompidos: ${mojibake}`)
console.log(`caracteres de substituição: ${broken}`)

if (dupes.length) {
  console.log('\nduplicados:')
  for (const d of [...new Set(dupes)]) console.log(`  ${d}`)
}

const ok = dupes.length === 0 && markers === 0 && mojibake === 0 && broken === 0
console.log(`\n${ok ? 'PASS' : 'FALHA'}  integridade de docs/history.md`)
process.exit(ok ? 0 : 1)
