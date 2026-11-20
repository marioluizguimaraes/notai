/** Glossário em linguagem simples (spec: "Contexto fiscal para quem não é contador"). */
export const GLOSSARIO = {
  MEI: 'Microempreendedor Individual: empresa de uma pessoa, com imposto fixo mensal e limite anual de faturamento.',
  'ME/EPP': 'Microempresa ou Empresa de Pequeno Porte: pequena empresa no Simples Nacional.',
  DAS: 'Guia mensal única do Simples Nacional, onde vários impostos são pagos juntos.',
  CBS: 'Contribuição sobre Bens e Serviços: novo imposto federal da Reforma Tributária.',
  IBS: 'Imposto sobre Bens e Serviços: novo imposto de estados e municípios.',
  'NFS-e': 'Nota Fiscal de Serviço eletrônica. O documento fiscal de verdade é o arquivo XML.',
  DPS: 'Declaração de Prestação de Serviços: o "pedido de nota" enviado ao governo.',
  'Certificado A1':
    'A identidade digital da empresa (arquivo .pfx), válida por um ano. Assina as notas.',
  CNPJ: 'Cadastro Nacional da Pessoa Jurídica: o número de identificação da empresa.',
  ISS: 'Imposto Sobre Serviços: imposto municipal sobre serviços. Para o MEI, já vem incluído no DAS.',
  NBS: 'Nomenclatura Brasileira de Serviços: código que classifica o serviço prestado.',
  DANFSe:
    'Documento Auxiliar da NFS-e: o PDF legível da nota. O documento fiscal de verdade é o XML.',
  'Chave de acesso':
    'Código de 50 dígitos que identifica a nota no Sistema Nacional. Serve para consultar a nota.',
  Competência:
    'Data em que o serviço foi prestado. Define em que mês a nota conta para os impostos.',
} as const

export type Termo = keyof typeof GLOSSARIO
