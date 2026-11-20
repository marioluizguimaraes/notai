import type { NotaMock } from './db'
import { db } from './db'

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** XML ilustrativo no formato da DPS (demonstração, sem assinatura real). */
export function gerarXml(n: NotaMock) {
  const e = db.empresa
  const t = n.tomador
  const doc =
    t.tipo_documento === 'CNPJ' ? `<CNPJ>${t.documento}</CNPJ>` : `<CPF>${t.documento}</CPF>`
  return `<?xml version="1.0" encoding="UTF-8"?>
<!-- NotAI: XML de DEMONSTRAÇÃO gerado pelo mock. Sem valor fiscal. -->
<NFSe xmlns="http://www.sped.fazenda.gov.br/nfse" versao="1.00">
  <infNFSe Id="NFS${n.chave_acesso ?? ''}">
    <DPS>
      <infDPS>
        <tpAmb>${n.ambiente === 'PRODUCAO' ? 1 : 2}</tpAmb>
        <dhEmi>${n.emitida_em ?? ''}</dhEmi>
        <serie>${n.serie}</serie>
        <nDPS>${n.numero_dps ?? ''}</nDPS>
        <dCompet>${n.competencia}</dCompet>
        <tpEmit>1</tpEmit>
        <cLocEmi>${e.municipio.codigo_ibge}</cLocEmi>
        <prest>
          <CNPJ>${e.cnpj}</CNPJ>
          <IM>${e.inscricao_municipal ?? ''}</IM>
          <regTrib><opSimpNac>${e.opcao_simples}</opSimpNac><regEspTrib>0</regEspTrib></regTrib>
        </prest>
        <toma>
          ${doc}
          <xNome>${esc(t.nome)}</xNome>
          <end><endNac><cMun>${t.endereco.municipio.codigo_ibge}</cMun><CEP>${t.endereco.cep}</CEP></endNac>
            <xLgr>${esc(t.endereco.logradouro)}</xLgr><nro>${esc(t.endereco.numero)}</nro><xBairro>${esc(t.endereco.bairro)}</xBairro></end>
        </toma>
        <serv>
          <locPrest><cLocPrestacao>${n.municipio_prestacao.codigo_ibge}</cLocPrestacao></locPrest>
          <cServ><cTribNac>${n.servico.codigo_servico}</cTribNac><xDescServ>${esc(n.descricao)}</xDescServ>${n.servico.nbs ? `<cNBS>${n.servico.nbs}</cNBS>` : ''}</cServ>
        </serv>
        <valores>
          <vServPrest><vServ>${n.valor.toFixed(2)}</vServ></vServPrest>
          <trib><tribMun><tribISSQN>1</tribISSQN><tpRetISSQN>1</tpRetISSQN></tribMun></trib>
        </valores>
      </infDPS>
    </DPS>
  </infNFSe>
</NFSe>
`
}

/** PDF mínimo de uma página (DANFSe de demonstração). */
export function gerarPdf(n: NotaMock) {
  const linhas = [
    'DANFSe - DEMONSTRACAO (sem valor fiscal)',
    `Nota no ${n.numero_dps ?? '-'}  Serie ${n.serie}`,
    `Prestador: ${db.empresa.razao_social}`,
    `Tomador: ${n.tomador.nome}`,
    `Servico: ${n.servico.apelido}`,
    `Valor: R$ ${n.valor.toFixed(2).replace('.', ',')}`,
    `Chave: ${n.chave_acesso ?? '-'}`,
  ].map((l) =>
    l
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[()\\]/g, ''),
  )
  const texto = linhas
    .map((l, i) => `BT /F1 ${i === 0 ? 14 : 11} Tf 56 ${780 - i * 22} Td (${l}) Tj ET`)
    .join('\n')
  const objs = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${texto.length} >>\nstream\n${texto}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ]
  let pdf = '%PDF-1.4\n'
  const offsets: number[] = []
  objs.forEach((o, i) => {
    offsets.push(pdf.length)
    pdf += `${i + 1} 0 obj\n${o}\nendobj\n`
  })
  const xref = pdf.length
  pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`
  pdf += offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('')
  pdf += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`
  return pdf
}
