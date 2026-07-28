/**
 * API UNIFICADA - DASHBOARDS V21.0
 * VERSÃO COMPLETA COM TODOS OS DASHBOARDS ATUALIZADOS
 * 
 * CORREÇÃO: Recorrência agora busca consultores dinamicamente da aba FUNCIONARIOS
 * CORREÇÃO DE DATA: Extração de datas na recorrência agora suporta Date objects,
 *                   números seriais do Google Sheets e strings em vários formatos.
 * CORREÇÃO DE MÉTRICAS: Adicionados campos totalOK e pendencias nos dados de recorrência.
 */

// ============================================================================
// CONFIGURAÇÕES GLOBAIS
// ============================================================================

const ID_PLANILHA_DADOS = "1CRjUZ7MUe_kEdM68wRO3xMl0eqUbGbd_3L4o2XtjBjA";
const ID_PLANILHA_DASHBOARDS = "1Um8k4XD9CjbLZK4WQHl8Qh3c_EqiRlpd-6CVQ512A4E";

const NOME_ABA_RECORRENCIA_FONTE = "RECORRENCIA";
const NOME_ABA_FUNCIONARIOS = "FUNCIONARIOS";
const PREFIXO_AMOR = "AMOR SAUDE PARACATU - ";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const SUPABASE_URL = 'https://ddxhnoiqxtbfdrwhhcab.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkeGhub2lxeHRiZmRyd2hoY2FiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ5MjUyMjcsImV4cCI6MjEwMDUwMTIyN30.NBISCHsDQiDTkysd6TSxiU67kcM4Aspk01lD05rbtUM';

// ============================================================================
// FUNÇÃO PRINCIPAL - doGet()
// ============================================================================

function doGet(e) {
  try {
    const endpoint = e.parameter.endpoint || "qualidade_vendas";
    const mes = parseInt(e.parameter.mes) || new Date().getMonth() + 1;
    const ano = parseInt(e.parameter.ano) || new Date().getFullYear();

    let resultado;

    if (endpoint === "qualidade_vendas") {
      resultado = getQualidadeVendasData(mes, ano);
    } else if (endpoint === "app") {
      resultado = getAppData(mes, ano);
    } else if (endpoint === "qualidade_trocas") {
      resultado = getQualidadeTrocasData(mes, ano);
    } else if (endpoint === "recorrencia") {
      const mesRec = parseInt(e.parameter.mes) || new Date().getMonth() + 1;
      const anoRec = parseInt(e.parameter.ano) || new Date().getFullYear();
      resultado = processarDadosRecorrenciaPorMes(mesRec, anoRec, true);
    } else if (endpoint === "refuturiza") {
      resultado = getRefuturizaData(mes, ano);
    } else {
      resultado = {
        status: "error",
        error: "Endpoint nao encontrado: " + endpoint,
        endpoints_disponiveis: ["qualidade_vendas", "app", "qualidade_trocas", "recorrencia", "refuturiza"]
      };
    }

    return ContentService.createTextOutput(JSON.stringify(resultado))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      error: error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================================================
// MENU CUSTOMIZADO
// ============================================================================

function onOpen() {
  const ui = SpreadsheetApp.getUi();

  ui.createMenu("📊 DASHBOARDS V21.0")
    .addItem("👥 Gerenciar Funcionários", "abrirAbaFuncionarios")
    .addSeparator()
    .addSubMenu(ui.createMenu("📁 Qualidade Vendas")
      .addItem("Janeiro", "abrirDashboardQualidadeVendasJaneiro")
      .addItem("Fevereiro", "abrirDashboardQualidadeVendasFevereiro")
      .addItem("Março", "abrirDashboardQualidadeVendasMarco")
      .addItem("Abril", "abrirDashboardQualidadeVendasAbril")
      .addItem("Maio", "abrirDashboardQualidadeVendasMaio")
      .addItem("Junho", "abrirDashboardQualidadeVendasJunho")
      .addItem("Julho", "abrirDashboardQualidadeVendasJulho")
      .addItem("Agosto", "abrirDashboardQualidadeVendasAgosto")
      .addItem("Setembro", "abrirDashboardQualidadeVendasSetembro")
      .addItem("Outubro", "abrirDashboardQualidadeVendasOutubro")
      .addItem("Novembro", "abrirDashboardQualidadeVendasNovembro")
      .addItem("Dezembro", "abrirDashboardQualidadeVendasDezembro"))
    .addSubMenu(ui.createMenu("📱 App")
      .addItem("Janeiro", "abrirDashboardAppJaneiro")
      .addItem("Fevereiro", "abrirDashboardAppFevereiro")
      .addItem("Março", "abrirDashboardAppMarco")
      .addItem("Abril", "abrirDashboardAppAbril")
      .addItem("Maio", "abrirDashboardAppMaio")
      .addItem("Junho", "abrirDashboardAppJunho")
      .addItem("Julho", "abrirDashboardAppJulho")
      .addItem("Agosto", "abrirDashboardAppAgosto")
      .addItem("Setembro", "abrirDashboardAppSetembro")
      .addItem("Outubro", "abrirDashboardAppOutubro")
      .addItem("Novembro", "abrirDashboardAppNovembro")
      .addItem("Dezembro", "abrirDashboardAppDezembro"))
    .addSubMenu(ui.createMenu("📊 Qualidade Trocas")
      .addItem("Janeiro", "abrirDashboardQualidadeTrocasJaneiro")
      .addItem("Fevereiro", "abrirDashboardQualidadeTrocasFevereiro")
      .addItem("Março", "abrirDashboardQualidadeTrocasMarco")
      .addItem("Abril", "abrirDashboardQualidadeTrocasAbril")
      .addItem("Maio", "abrirDashboardQualidadeTrocasMaio")
      .addItem("Junho", "abrirDashboardQualidadeTrocasJunho")
      .addItem("Julho", "abrirDashboardQualidadeTrocasJulho")
      .addItem("Agosto", "abrirDashboardQualidadeTrocasAgosto")
      .addItem("Setembro", "abrirDashboardQualidadeTrocasSetembro")
      .addItem("Outubro", "abrirDashboardQualidadeTrocasOutubro")
      .addItem("Novembro", "abrirDashboardQualidadeTrocasNovembro")
      .addItem("Dezembro", "abrirDashboardQualidadeTrocasDezembro"))
    .addSubMenu(ui.createMenu("📈 Recorrência")
      .addItem("Janeiro", "abrirDashboardRecorrenciaJaneiro")
      .addItem("Fevereiro", "abrirDashboardRecorrenciaFevereiro")
      .addItem("Março", "abrirDashboardRecorrenciaMarco")
      .addItem("Abril", "abrirDashboardRecorrenciaAbril")
      .addItem("Maio", "abrirDashboardRecorrenciaMaio")
      .addItem("Junho", "abrirDashboardRecorrenciaJunho")
      .addItem("Julho", "abrirDashboardRecorrenciaJulho")
      .addItem("Agosto", "abrirDashboardRecorrenciaAgosto")
      .addItem("Setembro", "abrirDashboardRecorrenciaSetembro")
      .addItem("Outubro", "abrirDashboardRecorrenciaOutubro")
      .addItem("Novembro", "abrirDashboardRecorrenciaNovembro")
      .addItem("Dezembro", "abrirDashboardRecorrenciaDezembro")
      .addSeparator()
      .addItem("Atualizar Mês Atual", "gerarDashboardRecorrencia")
      .addItem("Histórico Detalhado", "gerarDashboardRecorrenciaHistorico"))
    .addSubMenu(ui.createMenu("🔄 Refuturiza")
      .addItem("Janeiro", "abrirDashboardRefuturizaJaneiro")
      .addItem("Fevereiro", "abrirDashboardRefuturizaFevereiro")
      .addItem("Março", "abrirDashboardRefuturizaMarco")
      .addItem("Abril", "abrirDashboardRefuturizaAbril")
      .addItem("Maio", "abrirDashboardRefuturizaMaio")
      .addItem("Junho", "abrirDashboardRefuturizaJunho")
      .addItem("Julho", "abrirDashboardRefuturizaJulho")
      .addItem("Agosto", "abrirDashboardRefuturizaAgosto")
      .addItem("Setembro", "abrirDashboardRefuturizaSetembro")
      .addItem("Outubro", "abrirDashboardRefuturizaOutubro")
      .addItem("Novembro", "abrirDashboardRefuturizaNovembro")
      .addItem("Dezembro", "abrirDashboardRefuturizaDezembro"))
    .addSeparator()
    .addItem("🔄 Atualizar Todos (Mês Atual)", "atualizarTodosDashboards")
    .addItem("🔧 Gerar Mês Passado", "gerarDashboardMesPassado")
    .addItem("⚙️ Configurações", "showConfigDialog")
    .addItem("🚀 Deploy API", "deployAPI")
    .addToUi();
}

// ============================================================================
// FUNCIONARIOS
// ============================================================================

function carregarFuncionarios() {
  try {
    const ssDados = SpreadsheetApp.openById(ID_PLANILHA_DADOS);
    let sheet = ssDados.getSheetByName(NOME_ABA_FUNCIONARIOS);
    
    if (!sheet) {
      sheet = ssDados.insertSheet(NOME_ABA_FUNCIONARIOS);
      const headers = ["Nome Completo", "Setor", "Ativo"];
      sheet.appendRow(headers);
      const hRange = sheet.getRange(1, 1, 1, 3);
      hRange.setFontWeight("bold").setBackground("#1e3a8a").setFontColor("#ffffff").setHorizontalAlignment("center");
      
      const setores = ["VENDAS", "RECEPCAO", "REFILIACAO", "RETENÇÃO", "WEB SITE", "TELEVENDAS", "OUTROS"];
      const rule = SpreadsheetApp.newDataValidation().requireValueInList(setores, true).build();
      sheet.getRange("B:B").setDataValidation(rule);
      
      const ativoRule = SpreadsheetApp.newDataValidation().requireValueInList(["SIM", "NÃO"], true).build();
      sheet.getRange("C:C").setDataValidation(ativoRule);
      
      sheet.setColumnWidth(1, 280);
      sheet.setColumnWidth(2, 120);
      sheet.setColumnWidth(3, 60);
      sheet.getRange("B:C").setHorizontalAlignment("center");
      
      SpreadsheetApp.getUi().alert(
        "✅ Aba 'FUNCIONARIOS' criada!\n\n" +
        "📌 Como usar:\n" +
        "• Adicione novos funcionários no final da lista\n" +
        "• Escolha o setor no dropdown\n" +
        "• Escolha SIM ou NÃO no dropdown para ativar/inativar"
      );
    }
    
    const data = sheet.getDataRange().getValues();
    if (data.length < 2) return { todos: [], porSetor: {}, ativos: [], mapaNomeSetor: {} };
    
    const idx = { nome: 0, setor: 1, ativo: 2 };
    const funcionarios = [];
    const porSetor = {};
    const ativos = [];
    const mapaNomeSetor = {};
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const nome = String(row[idx.nome] || "").trim();
      const setor = String(row[idx.setor] || "").trim().toUpperCase();
      const ativo = String(row[idx.ativo] || "").trim().toUpperCase() === "SIM";
      
      if (!nome) continue;
      funcionarios.push({ nome, setor, ativo });
      
      if (ativo) {
        ativos.push(nome);
        const primeiroNome = nome.split(" ")[0];
        mapaNomeSetor[primeiroNome.toUpperCase()] = setor;
        mapaNomeSetor[nome.toUpperCase()] = setor;
      }
      if (!porSetor[setor]) porSetor[setor] = [];
      if (ativo) porSetor[setor].push(nome);
    }
    
    return { todos: funcionarios, porSetor: porSetor, ativos: ativos, mapaNomeSetor: mapaNomeSetor };
  } catch (error) {
    console.error("Erro ao carregar funcionários:", error);
    return carregarFuncionariosFallback();
  }
}

function carregarFuncionariosFallback() {
  const porSetor = {};
  const ativos = [];
  const mapaNomeSetor = {};
  
  const dadosHardcoded = {
    "VENDAS": ["FRANCISCO ROGEAN ALVES NASCIMENTO", "LAYANE MACHADO DA CUNHA", "RAFAEL DOS SANTOS DE JESUS", "VANESSA CRISTINA MARTINS SOUZA", "THAYNARA ARAUJO DE OLIVEIRA", "MARIA MADALENA SILVA FURTADO", "JOISCIANE DE SOUSA SILVA", "MARCUS LUIZ ARAUJO CUNHA"],
    "RECEPCAO": ["THIAGO DA SILVA CARDOSO", "MILENA VITORIA LEMOS DA SILVA", "DANIELLE LIMA BRITO"],
    "REFILIACAO": ["FABIANA DA SILVA", "INGRID CARVALHO RODRIGUES", "JENIFFER THAYNNA LIMA DA ROCHA", "WANESSA EVELYN CARVALHO OLIVEIRA MORAIS"],
    "RETENÇÃO": ["JACKSON RYLLER DOS SANTOS", "ISAAC PEREIRA NUNES FERREIRA"]
  };
  
  for (const setor in dadosHardcoded) {
    porSetor[setor] = dadosHardcoded[setor];
    dadosHardcoded[setor].forEach(nome => {
      ativos.push(nome);
      const primeiroNome = nome.split(" ")[0];
      mapaNomeSetor[primeiroNome.toUpperCase()] = setor;
      mapaNomeSetor[nome.toUpperCase()] = setor;
    });
  }
  
  return { todos: ativos.map(nome => ({ nome, setor: mapaNomeSetor[nome.toUpperCase()] || "OUTROS", ativo: true })), porSetor: porSetor, ativos: ativos, mapaNomeSetor: mapaNomeSetor };
}

function abrirAbaFuncionarios() {
  const ssDados = SpreadsheetApp.openById(ID_PLANILHA_DADOS);
  let sheet = ssDados.getSheetByName(NOME_ABA_FUNCIONARIOS);
  if (!sheet) { carregarFuncionarios(); sheet = ssDados.getSheetByName(NOME_ABA_FUNCIONARIOS); }
  const url = `https://docs.google.com/spreadsheets/d/${ID_PLANILHA_DADOS}/edit#gid=${sheet.getSheetId()}`;
  SpreadsheetApp.getUi().showModalDialog(HtmlService.createHtmlOutput(`<script>window.open('${url}', '_blank'); google.script.host.close();</script>`), 'Abrindo Funcionários...');
}

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

function limparNomeConsultor(nome) {
  if (!nome) return "";
  let nomeLimpo = nome.trim();
  if (nomeLimpo.toUpperCase().includes(PREFIXO_AMOR.toUpperCase())) {
    nomeLimpo = nomeLimpo.replace(new RegExp(PREFIXO_AMOR, "i"), "").trim();
  }
  nomeLimpo = nomeLimpo.replace(/\s+/g, " ");
  return nomeLimpo;
}

function normalizarConsultorPeloMapa(nomeOriginal, mapaFuncionarios) {
  if (!nomeOriginal) return null;
  const upper = nomeOriginal.toUpperCase().trim();
  if (mapaFuncionarios[upper]) return upper;
  const primeiroNome = upper.split(" ")[0];
  if (mapaFuncionarios[primeiroNome]) {
    for (const nomeCompleto in mapaFuncionarios) {
      if (nomeCompleto.split(" ")[0] === primeiroNome) return nomeCompleto;
    }
  }
  for (const nomeCadastrado in mapaFuncionarios) {
    if (upper.includes(nomeCadastrado) || nomeCadastrado.includes(upper)) return nomeCadastrado;
  }
  return null;
}

function obterSetorDoFuncionario(nomeNormalizado, mapaFuncionarios) {
  if (mapaFuncionarios[nomeNormalizado]) return mapaFuncionarios[nomeNormalizado];
  const primeiroNome = nomeNormalizado.split(" ")[0];
  if (mapaFuncionarios[primeiroNome]) return mapaFuncionarios[primeiroNome];
  return "TELEVENDAS";
}

function normalizarAppStatus(status) {
  if (!status || status === "") return "OUTROS";
  const statusUpper = status.toString().toUpperCase().trim();
  if (["SIM", "S", "YES", "Y", "COM APP", "BAIXADO", "INSTALADO", "✅", "OK", "CONCLUÍDO", "CONCLUIDO"].includes(statusUpper)) return "SIM";
  if (["NÃO", "NAO", "N", "NO", "SEM APP", "NÃO BAIXADO", "NÃO INSTALADO", "❌", "NEGATIVO", "NA"].includes(statusUpper)) return "NAO";
  if (["CANCELADO", "CANCEL", "C", "CANCELADA", "CANCELADOS", "CANC"].includes(statusUpper)) return "CANCELADO";
  return "OUTROS";
}

function normalizarStatusLigacao(status) {
  if (!status || status === "") return "SEM LIGAÇÃO";
  const statusUpper = status.toString().toUpperCase().trim();
  if (["SIM", "S", "YES", "Y", "COM LIGAÇÃO", "LIGADO", "REALIZADO", "CONCLUÍDO", "CONCLUIDO", "✅", "OK", "FEITO", "FEITA"].includes(statusUpper)) return "COM LIGAÇÃO";
  if (["NÃO", "NAO", "N", "NO", "SEM LIGAÇÃO", "NÃO LIGADO", "NÃO REALIZADO", "PENDENTE", "❌", "NEGATIVO", "NA"].includes(statusUpper)) return "SEM LIGAÇÃO";
  if (["CANCELADO", "CANCEL", "C", "CANCELADA", "CANCELADOS", "CANC", "DESISTENTE", "DESISTIU"].includes(statusUpper)) return "CANCELADO";
  if (statusUpper.includes("LIG") || statusUpper.includes("CALL") || statusUpper.includes("TELEFONE")) return "COM LIGAÇÃO";
  return "SEM LIGAÇÃO";
}

function parseDate(dataStr) {
  if (!dataStr) return { mes: 0, ano: 0 };
  const d = new Date(dataStr);
  if (!isNaN(d.getTime())) return { mes: d.getMonth() + 1, ano: d.getFullYear() };
  const str = String(dataStr).trim();
  const partesBarra = str.split("/");
  if (partesBarra.length >= 2) {
    const mes = parseInt(partesBarra[1], 10);
    let ano;
    if (partesBarra.length >= 3) { ano = parseInt(partesBarra[2], 10); if (ano < 100) ano += 2000; }
    else { ano = new Date().getFullYear(); }
    if (!isNaN(mes) && !isNaN(ano)) return { mes: mes, ano: ano };
  }
  const partesMesAno = str.split("/");
  if (partesMesAno.length === 2) {
    const mes = parseInt(partesMesAno[0], 10);
    const ano = parseInt(partesMesAno[1], 10);
    if (!isNaN(mes) && !isNaN(ano)) return { mes: mes, ano: ano < 100 ? ano + 2000 : ano };
  }
  const numeros = str.match(/\d+/g);
  if (numeros && numeros.length >= 2) {
    const mes = parseInt(numeros[1], 10);
    const ano = numeros.length >= 3 ? parseInt(numeros[2], 10) : new Date().getFullYear();
    if (!isNaN(mes) && mes >= 1 && mes <= 12) return { mes: mes, ano: ano < 100 ? ano + 2000 : ano };
  }
  return { mes: 0, ano: 0 };
}

function calcPctDoc(aprovados, total, cancelados) {
  const base = total - cancelados;
  return base > 0 ? Math.round((aprovados / base) * 100) : 0;
}

function createSuccessResponse(data) { return { status: "success", timestamp: new Date().toISOString(), data: data }; }
function createErrorResponse(msg) { return { status: "error", timestamp: new Date().toISOString(), error: msg }; }

// ============================================================================
// FUNÇÃO CORRIGIDA PARA EXTRAIR DATA DA RECORRÊNCIA
// ============================================================================

function extrairMesAnoRecorrencia(valor) {
  // Versão corrigida que suporta Date objects, números seriais e strings
  Logger.log(`📅 extrairMesAnoRecorrencia recebeu: ${valor} (${typeof valor})`);
  
  if (!valor && valor !== 0) return null;
  
  // ========== TIPO 1: Date Object do JavaScript ==========
  if (valor instanceof Date) {
    if (!isNaN(valor.getTime())) {
      const resultado = { mes: valor.getMonth() + 1, ano: valor.getFullYear() };
      Logger.log(`✅ Data extraída (Date): ${resultado.mes}/${resultado.ano}`);
      return resultado;
    }
  }
  
  // ========== TIPO 2: Número (Serial Date do Google Sheets) ==========
  if (typeof valor === 'number') {
    if (valor > 1000) {
      try {
        const jsDate = new Date((valor - 25569) * 86400 * 1000);
        if (!isNaN(jsDate.getTime())) {
          const resultado = { mes: jsDate.getMonth() + 1, ano: jsDate.getFullYear() };
          Logger.log(`✅ Data extraída (serial): ${resultado.mes}/${resultado.ano}`);
          return resultado;
        }
      } catch (e) {
        Logger.log(`⚠️ Erro ao converter serial date: ${e.message}`);
      }
    }
  }
  
  // ========== TIPO 3: String ==========
  if (typeof valor === 'string') {
    const str = valor.trim();
    
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      const resultado = { mes: d.getMonth() + 1, ano: d.getFullYear() };
      Logger.log(`✅ Data extraída (string→Date): ${resultado.mes}/${resultado.ano}`);
      return resultado;
    }
    
    const matchBarra = str.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (matchBarra) {
      const resultado = { mes: parseInt(matchBarra[2]), ano: parseInt(matchBarra[3]) };
      Logger.log(`✅ Data extraída (regex): ${resultado.mes}/${resultado.ano}`);
      return resultado;
    }
    
    const matchSimples = str.match(/(\d{1,2})\/(\d{1,2})/);
    if (matchSimples) {
      const dia = parseInt(matchSimples[1]);
      const mes = parseInt(matchSimples[2]);
      const anoMatch = str.match(/(\d{4})/);
      const ano = anoMatch ? parseInt(anoMatch[1]) : new Date().getFullYear();
      if (mes >= 1 && mes <= 12) {
        const resultado = { mes: mes, ano: ano };
        Logger.log(`✅ Data extraída (d/m): ${resultado.mes}/${resultado.ano}`);
        return resultado;
      }
    }
    
    const mesesAbrev = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
    const mesesNum = [1,2,3,4,5,6,7,8,9,10,11,12];
    for (let i = 0; i < mesesAbrev.length; i++) {
      if (str.toLowerCase().includes(mesesAbrev[i])) {
        const anoMatch = str.match(/\d{4}/);
        const resultado = { mes: mesesNum[i], ano: anoMatch ? parseInt(anoMatch[0]) : new Date().getFullYear() };
        Logger.log(`✅ Data extraída (mês abreviado): ${resultado.mes}/${resultado.ano}`);
        return resultado;
      }
    }
  }
  
  Logger.log(`❌ Falha ao extrair data: ${valor}`);
  return null;
}

function getMesAnoFromRowRecorrencia(row, idxData) {
  if (!row || row.length === 0) {
    Logger.log(`⚠️ Linha vazia`);
    return null;
  }
  
  if (idxData === -1 || idxData >= row.length) {
    Logger.log(`⚠️ Índice de data inválido: ${idxData}`);
    return null;
  }
  
  const valorData = row[idxData];
  if (!valorData && valorData !== 0) {
    Logger.log(`⚠️ Valor de data vazio`);
    return null;
  }
  
  return extrairMesAnoRecorrencia(valorData);
}

// ============================================================================
// RECORRÊNCIA - CORRIGIDA
// ============================================================================

function processarDadosRecorrenciaPorMes(mes, ano, isFixedMonth = false) {
  try {
    Logger.log(`🚀 Iniciando processamento CORRIGIDO para ${mes}/${ano}`);
    
    const funcionarios = carregarFuncionarios();
    const porSetor = funcionarios.porSetor;
    
    const consultoresRetencao = porSetor["RETENÇÃO"] || [];
    const consultoresRefiliacao = porSetor["REFILIACAO"] || [];
    
    Logger.log(`👥 Consultores de RETENÇÃO carregados: ${consultoresRetencao.length}`);
    consultoresRetencao.forEach(c => Logger.log(`   • ${c}`));
    
    Logger.log(`👥 Consultores de REFILIAÇÃO carregados: ${consultoresRefiliacao.length}`);
    consultoresRefiliacao.forEach(c => Logger.log(`   • ${c}`));
    
    if (consultoresRetencao.length === 0 && consultoresRefiliacao.length === 0) {
      Logger.log(`⚠️ AVISO: Nenhum consultor de RETENÇÃO ou REFILIAÇÃO cadastrado!`);
      return {
        status: "warning",
        message: "Nenhum consultor de RETENÇÃO/REFILIAÇÃO cadastrado na aba FUNCIONARIOS",
        data: {
          retencao: {},
          refiliacao: {},
          periodo: { 
            atual: `${String(mes).padStart(2, '0')}/${ano}`,
            historico: [],
            mes: mes,
            ano: ano,
            nomeMes: MESES[mes-1],
            isFixedMonth: isFixedMonth 
          }
        }
      };
    }

    const ssDados = SpreadsheetApp.openById(ID_PLANILHA_DADOS);
    let sheetRec = ssDados.getSheetByName(NOME_ABA_RECORRENCIA_FONTE);
    if (!sheetRec) {
      const sheets = ssDados.getSheets();
      sheetRec = sheets.find(s => s.getName().toUpperCase().includes("RECORRENCIA"));
    }
    if (!sheetRec) {
      throw new Error("Aba RECORRENCIA não encontrada.");
    }

    const dataRec = sheetRec.getDataRange().getValues();
    const headers = dataRec[1] || dataRec[0] || [];
    
    let idxData = -1;
    for (let i = 0; i < headers.length; i++) {
      const header = String(headers[i] || "").toUpperCase().trim();
      if (header.includes("DATA") || header.includes("DATA REFILIAÇÃO") || header.includes("DATA RETENÇÃO")) {
        idxData = i;
        break;
      }
    }
    if (idxData === -1) idxData = 4;
    
    const rows = dataRec.slice(2);
    const targetMonth = (mes < 10 ? '0' + mes : mes) + '/' + ano;

    // Função auxiliar para calcular métricas de um consultor em determinados meses
    function calculateMetrics(consultor, targetMonths) {
      Logger.log(`🔍 Filtrando "${consultor}" para meses: ${targetMonths.join(', ')}`);
      
      const filteredRows = rows.filter(row => {
        if (!row || row.length === 0) return false;
        
        const rowConsultor = String(row[0] || "").trim().toUpperCase();
        const consultorNormalizado = consultor.toUpperCase().trim();
        
        if (rowConsultor !== consultorNormalizado) {
          const primeiroNomeRow = rowConsultor.split(" ")[0];
          const primeiroNomeConsultor = consultorNormalizado.split(" ")[0];
          if (primeiroNomeRow !== primeiroNomeConsultor) {
            return false;
          }
        }
        
        const mesAno = getMesAnoFromRowRecorrencia(row, idxData);
        if (!mesAno) {
          return false;
        }
        
        const mesAnoStr = (mesAno.mes < 10 ? '0' + mesAno.mes : mesAno.mes) + '/' + mesAno.ano;
        const match = targetMonths.some(t => t === mesAnoStr);
        
        if (match) {
          Logger.log(`   ✅ ${consultor}: encontrado para ${mesAnoStr}`);
        }
        
        return match;
      });

      Logger.log(`   📊 ${consultor}: ${filteredRows.length} registro(s) encontrado(s)`);

      if (filteredRows.length === 0) {
        return { 
          totalRetido: 0, ok: 0, emAberto: 0, emAtraso: 0, cancelado: 0, 
          pendenciasKYC: 0, totalPendencias: 0, totalRetidosFinal: 0, 
          retençõesOK: 0, percentualOK: 0, totalOK: 0, pendencias: 0
        };
      }

      let totalRetido = filteredRows.length;
      let ok = 0, emAberto = 0, emAtraso = 0, cancelado = 0, pendenciasKYC = 0;

      filteredRows.forEach(row => {
        const mensalidade = String(row[2] || "").trim().toUpperCase();
        const kyc = String(row[3] || "").trim().toUpperCase();
        
        if (mensalidade === 'OK') ok++;
        else if (mensalidade === 'EM ABERTO') emAberto++;
        else if (mensalidade === 'EM ATRASO') emAtraso++;
        else if (mensalidade === 'CANCELADO') cancelado++;
        
        if (kyc !== 'APROVADO' && mensalidade !== 'CANCELADO') {
          pendenciasKYC++;
        }
      });

      const totalPendencias = pendenciasKYC;
      const totalRetidosFinal = totalRetido - cancelado;
      const retençõesOK = totalRetidosFinal - totalPendencias;
      const percentualOK = totalRetidosFinal > 0 ? Math.round((retençõesOK / totalRetidosFinal) * 100) : 0;
      const totalOK = ok + emAberto; // para fins de exibição
      const pendencias = totalPendencias;
      
      Logger.log(`   📊 ${consultor}: total=${totalRetido}, ok=${ok}, cancelado=${cancelado}, pct=${percentualOK}%`);
      
      return { 
        totalRetido, ok, emAberto, emAtraso, cancelado, pendenciasKYC, 
        totalPendencias, totalRetidosFinal, retençõesOK, percentualOK,
        totalOK, pendencias
      };
    }

    let historicoMonths = [];
    for (let i = 1; i <= 3; i++) {
      let histMes = mes - i;
      let histAno = ano;
      if (histMes <= 0) { 
        histMes += 12; 
        histAno -= 1; 
      }
      historicoMonths.push((histMes < 10 ? '0' + histMes : histMes) + '/' + histAno);
    }

    const result = {
      retencao: {},
      refiliacao: {},
      periodo: { 
        atual: targetMonth, 
        historico: historicoMonths, 
        mes: mes, 
        ano: ano, 
        nomeMes: MESES[mes-1], 
        isFixedMonth: isFixedMonth 
      }
    };

    Logger.log(`\n📊 === PROCESSANDO RETENÇÃO ===`);
    consultoresRetencao.forEach(c => {
      Logger.log(`\n👤 ${c}`);
      const atual = calculateMetrics(c, [targetMonth]);
      const total3Meses = calculateMetrics(c, historicoMonths);
      result.retencao[c] = {
        atual: atual,
        historico: historicoMonths.map(m => ({ mes: m, dados: calculateMetrics(c, [m]) })),
        total3Meses: total3Meses
      };
    });

    Logger.log(`\n📊 === PROCESSANDO REFILIAÇÃO ===`);
    consultoresRefiliacao.forEach(c => {
      Logger.log(`\n👤 ${c}`);
      const total3Meses = calculateMetrics(c, historicoMonths);
      result.refiliacao[c] = {
        historico: historicoMonths.map(m => ({ mes: m, dados: calculateMetrics(c, [m]) })),
        total3Meses: total3Meses
      };
    });

    Logger.log('\n✅ Processamento concluído com sucesso!');
    return { status: "success", data: result };

  } catch (error) {
    Logger.log('❌ Erro na recorrência:', error.message);
    return { status: "error", error: error.message };
  }
}

function diagnosticarConsultoresRecorrencia() {
  try {
    const funcionarios = carregarFuncionarios();
    const porSetor = funcionarios.porSetor;
    const ativos = funcionarios.ativos;
    
    let msg = `📋 DIAGNOSE DE CONSULTORES\n\n`;
    msg += `Total ativos: ${ativos.length}\n`;
    msg += `Setores: ${Object.keys(porSetor).length}\n\n`;
    msg += `RETENÇÃO: ${porSetor["RETENÇÃO"] ? porSetor["RETENÇÃO"].length : 0}\n`;
    msg += `REFILIAÇÃO: ${porSetor["REFILIACAO"] ? porSetor["REFILIACAO"].length : 0}\n\n`;
    
    Object.keys(porSetor).forEach(setor => {
      const consultores = porSetor[setor];
      msg += `📁 ${setor}: ${consultores.length}\n`;
    });
    
    SpreadsheetApp.getUi().alert(msg);
    
  } catch (error) {
    SpreadsheetApp.getUi().alert(`❌ Erro: ${error.message}`);
  }
}

function testarRecorrenciaComConsultoresReais() {
  const mes = new Date().getMonth() + 1;
  const ano = new Date().getFullYear();
  const resultado = processarDadosRecorrenciaPorMes(mes, ano, true);
  
  if (resultado.status === "success") {
    SpreadsheetApp.getUi().alert(
      `✅ TESTE CONCLUÍDO\n\n` +
      `Consultores RETENÇÃO: ${Object.keys(resultado.data.retencao).length}\n` +
      `Consultores REFILIAÇÃO: ${Object.keys(resultado.data.refiliacao).length}`
    );
  } else if (resultado.status === "warning") {
    SpreadsheetApp.getUi().alert(`⚠️ ${resultado.message}`);
  } else {
    SpreadsheetApp.getUi().alert(`❌ Erro: ${resultado.error}`);
  }
}

function gerarDashboardRecorrencia() {
  const now = new Date();
  const mes = now.getMonth() + 1;
  const ano = now.getFullYear();
  const dados = processarDadosRecorrenciaPorMes(mes, ano, false);
  if (dados.status === "success") {
    renderizarPlanilhaRecorrenciaPorMes(dados.data, mes, ano);
    SpreadsheetApp.getUi().alert(`✅ Dashboard de Recorrência de ${MESES[mes-1]} ${ano} atualizado!`);
  } else {
    SpreadsheetApp.getUi().alert("❌ Erro: " + dados.error);
  }
}

function gerarDashboardRecorrenciaHistorico() {
  const now = new Date();
  const mes = now.getMonth() + 1;
  const ano = now.getFullYear();
  const dados = processarDadosRecorrenciaPorMes(mes, ano, false);
  if (dados.status === "success") {
    renderizarPlanilhaRecorrenciaDetalhada(dados.data);
    SpreadsheetApp.getUi().alert("✅ Dashboard Histórico atualizado!");
  } else {
    SpreadsheetApp.getUi().alert("❌ Erro: " + dados.error);
  }
}

function renderizarPlanilhaRecorrenciaPorMes(dados, mes, ano) {
  const ssDash = SpreadsheetApp.openById(ID_PLANILHA_DASHBOARDS);
  const nomeAba = `Recorrência ${MESES[mes-1]} ${ano}`;
  let sheet = ssDash.getSheetByName(nomeAba);
  if (!sheet) sheet = ssDash.insertSheet(nomeAba);
  const oldSheet = ssDash.getSheetByName("Dashboard Recorrência");
  if (oldSheet && oldSheet.getName() !== nomeAba) ssDash.deleteSheet(oldSheet);
  sheet.clear();

  sheet.getRange("A1:M1").merge().setValue(`📈 DASHBOARD RECORRÊNCIA - ${MESES[mes-1]} ${ano}`)
    .setBackground("#1e3a8a").setFontColor("#ffffff").setFontWeight("bold").setHorizontalAlignment("center").setFontSize(14);

  if (dados.periodo.isFixedMonth) {
    sheet.getRange("A2:M2").merge().setValue(`📅 DADOS FIXOS DO MÊS ${dados.periodo.atual}`)
      .setBackground("#f59e0b").setFontColor("#000000").setFontWeight("bold").setHorizontalAlignment("center");
  } else {
    sheet.getRange("A2:M2").merge().setValue(`🔄 DADOS DO MÊS ATUAL`)
      .setBackground("#10b981").setFontColor("#ffffff").setFontWeight("bold").setHorizontalAlignment("center");
  }

  let currentRow = 4;

  // Retenção
  Object.keys(dados.retencao).forEach(c => {
    const d = dados.retencao[c];
    sheet.getRange(currentRow, 1, 1, 13).merge().setValue("CONSULTOR: " + c + " (RETENÇÃO)").setBackground("#f1f5f9").setFontWeight("bold");
    currentRow++;

    const cardAtual = [["MÊS ATUAL (" + dados.periodo.atual + ")", ""], 
      ["TOTAL RETIDO", d.atual.totalRetido], 
      ["CANCELADO", d.atual.cancelado], 
      ["TOTAL RETIDOS FINAL", d.atual.totalRetidosFinal], 
      ["MENSALIDADES OK", d.atual.ok], 
      ["EM ABERTO", d.atual.emAberto], 
      ["EM ATRASO", d.atual.emAtraso], 
      ["PENDÊNCIAS KYC", d.atual.pendenciasKYC], 
      ["TOTAL PENDÊNCIAS", d.atual.totalPendencias], 
      ["RETENÇÕES OK", d.atual.retençõesOK], 
      ["% OK", d.atual.percentualOK + "%"]];
    sheet.getRange(currentRow, 1, cardAtual.length, 2).setValues(cardAtual).setBorder(true, true, true, true, true, true);
    sheet.getRange(currentRow, 1, 1, 2).merge().setBackground("#10b981").setFontColor("#ffffff").setFontWeight("bold").setHorizontalAlignment("center");

    const cardTotal = [["TOTAL 3 MESES ANTERIORES", ""], 
      ["TOTAL RETIDO", d.total3Meses.totalRetido], 
      ["CANCELADO", d.total3Meses.cancelado || 0], 
      ["TOTAL RETIDOS FINAL", d.total3Meses.totalRetidosFinal], 
      ["OK (Mensalidade OK)", d.total3Meses.ok], 
      ["EM ABERTO", d.total3Meses.emAberto], 
      ["TOTAL OK (OK + Aberto)", d.total3Meses.totalOK || (d.total3Meses.ok + d.total3Meses.emAberto)], 
      ["EM ATRASO", d.total3Meses.emAtraso], 
      ["TOTAL PENDÊNCIAS", d.total3Meses.pendencias], 
      ["% OK", (d.total3Meses.percentualOK || 0) + "%"]];
    sheet.getRange(currentRow, 4, cardTotal.length, 2).setValues(cardTotal).setBorder(true, true, true, true, true, true);
    sheet.getRange(currentRow, 4, 1, 2).merge().setBackground("#f59e0b").setFontColor("#ffffff").setFontWeight("bold").setHorizontalAlignment("center");

    const percentualCell = sheet.getRange(currentRow + cardTotal.length - 1, 5);
    const corPercentual = d.total3Meses.percentualOK >= 90 ? "#10b981" : d.total3Meses.percentualOK >= 80 ? "#f59e0b" : "#ef4444";
    percentualCell.setBackground(corPercentual).setFontColor("#ffffff").setFontWeight("bold");

    currentRow += Math.max(cardAtual.length, cardTotal.length) + 2;
  });

  // Refiliação
  Object.keys(dados.refiliacao).forEach(c => {
    const d = dados.refiliacao[c];
    sheet.getRange(currentRow, 1, 1, 13).merge().setValue("CONSULTOR: " + c + " (REFILIAÇÃO)").setBackground("#f1f5f9").setFontWeight("bold");
    currentRow++;

    const cardTotal = [["TOTAL 3 MESES ANTERIORES", ""], 
      ["TOTAL REFILIAÇÃO", d.total3Meses.totalRetido], 
      ["CANCELADO", d.total3Meses.cancelado || 0], 
      ["TOTAL REFILIADOS FINAL", d.total3Meses.totalRetidosFinal], 
      ["OK (Mensalidade OK)", d.total3Meses.ok], 
      ["EM ABERTO", d.total3Meses.emAberto], 
      ["TOTAL OK", d.total3Meses.totalOK || (d.total3Meses.ok + d.total3Meses.emAberto)], 
      ["EM ATRASO", d.total3Meses.emAtraso], 
      ["TOTAL PENDÊNCIAS", d.total3Meses.pendencias], 
      ["% OK", (d.total3Meses.percentualOK || 0) + "%"]];
    sheet.getRange(currentRow, 1, cardTotal.length, 2).setValues(cardTotal).setBorder(true, true, true, true, true, true);
    sheet.getRange(currentRow, 1, 1, 2).merge().setBackground("#f59e0b").setFontColor("#ffffff").setFontWeight("bold").setHorizontalAlignment("center");

    const percentualCell = sheet.getRange(currentRow + cardTotal.length - 1, 2);
    const corPercentual = d.total3Meses.percentualOK >= 90 ? "#10b981" : d.total3Meses.percentualOK >= 80 ? "#f59e0b" : "#ef4444";
    percentualCell.setBackground(corPercentual).setFontColor("#ffffff").setFontWeight("bold");

    currentRow += cardTotal.length + 2;
  });

  sheet.setColumnWidths(1, 13, 150);
  sheet.setFrozenRows(2);
}

function renderizarPlanilhaRecorrenciaDetalhada(dados) {
  const ssDash = SpreadsheetApp.openById(ID_PLANILHA_DASHBOARDS);
  let sheet = ssDash.getSheetByName("Dashboard Recorrência Histórico");
  if (!sheet) sheet = ssDash.insertSheet("Dashboard Recorrência Histórico");
  sheet.clear();

  sheet.getRange("A1:M1").merge().setValue("📊 DASHBOARD RECORRÊNCIA - HISTÓRICO DETALHADO")
    .setBackground("#7c3aed").setFontColor("#ffffff").setFontWeight("bold").setHorizontalAlignment("center").setFontSize(14);

  let currentRow = 3;

  Object.keys(dados.retencao).forEach(c => {
    const d = dados.retencao[c];
    sheet.getRange(currentRow, 1, 1, 13).merge().setValue("👑 " + c + " - RETENÇÃO").setBackground("#1e3a8a").setFontColor("#ffffff").setFontWeight("bold");
    currentRow++;
    sheet.getRange(currentRow, 1, 1, 13).merge().setValue("MÊS ATUAL: " + dados.periodo.atual).setBackground("#10b981").setFontColor("#ffffff").setFontWeight("bold");
    currentRow++;
    sheet.getRange(currentRow, 1, 1, 2).setValues([["Métrica", "Valor"]]).setBackground("#d1fae5");
    currentRow++;
    const dadosAtual = [["Total Retido", d.atual.totalRetido], ["Cancelados", d.atual.cancelado], ["Total Retidos Final", d.atual.totalRetidosFinal], ["Mensalidades OK", d.atual.ok], ["Em Aberto", d.atual.emAberto], ["Em Atraso", d.atual.emAtraso], ["Pendências KYC", d.atual.pendenciasKYC], ["Total Pendências", d.atual.totalPendencias], ["Retenções OK", d.atual.retençõesOK], ["% OK", d.atual.percentualOK + "%"]];
    sheet.getRange(currentRow, 1, dadosAtual.length, 2).setValues(dadosAtual);
    currentRow += dadosAtual.length + 2;
    sheet.getRange(currentRow, 1, 1, 13).merge().setValue("HISTÓRICO - ÚLTIMOS 3 MESES").setBackground("#f59e0b").setFontColor("#ffffff").setFontWeight("bold");
    currentRow++;
    sheet.getRange(currentRow, 1, 1, 7).setValues([["Mês", "Total", "OK", "Em Aberto", "Total OK", "Pendências", "% OK"]]).setBackground("#fef3c7");
    currentRow++;
    d.historico.forEach(h => {
      const totalOK = (h.dados.ok + h.dados.emAberto);
      sheet.getRange(currentRow, 1, 1, 7).setValues([[h.mes, h.dados.totalRetido, h.dados.ok, h.dados.emAberto, totalOK, h.dados.pendencias, h.dados.percentualOK + "%"]]);
      currentRow++;
    });
    currentRow += 2;
  });

  sheet.setColumnWidths(1, 13, 140);
}

// ============================================================================
// QUALIDADE VENDAS
// ============================================================================

function getQualidadeVendasData(mes, ano) {
  try {
    const funcionarios = carregarFuncionarios();
    const mapaFuncionarios = funcionarios.mapaNomeSetor;
    const ativos = funcionarios.ativos;
    
    const ssDados = SpreadsheetApp.openById(ID_PLANILHA_DADOS);
    const sheet = ssDados.getSheetByName("QUALIDADE VENDAS");
    if (!sheet) return createErrorResponse("Sheet 'QUALIDADE VENDAS' não encontrada");

    const data = sheet.getDataRange().getValues();
    const headers = data[1];

    const idx = {
      consultor: headers.indexOf("CONSULTOR"),
      data: headers.indexOf("DATA"),
      kyc: headers.indexOf("KYC"),
      promocao: headers.indexOf("PROMOÇÃO")
    };

    const mesAtual = mes || new Date().getMonth() + 1;
    const anoAtual = ano || new Date().getFullYear();

    const SETORES_COM_NOME = ["VENDAS", "RECEPCAO", "REFILIACAO"];
    
    function novoTotalizador() {
      return {
        total: 0, cancelados: 0, aprovados: 0,
        pendencias: 0, reprovados: 0, expirado: 0, pendente: 0, naoEnviado: 0,
        promo: { total: 0, cancelados: 0, aprovados: 0, reprovados: 0, expirado: 0, pendente: 0, naoEnviado: 0 },
        normal: { total: 0, cancelados: 0, aprovados: 0, reprovados: 0, expirado: 0, pendente: 0, naoEnviado: 0 }
      };
    }

    const consultoresData = {};
    let totalGeral = novoTotalizador();
    let vendasLoja = novoTotalizador();
    let vendasWeb = novoTotalizador();

    for (let i = 2; i < data.length; i++) {
      const row = data[i];
      const dataParsed = parseDate(row[idx.data]);
      if (dataParsed.mes !== mesAtual || dataParsed.ano !== anoAtual) continue;

      const consultorOriginal = String(row[idx.consultor] || "").trim();
      if (!consultorOriginal) continue;

      const consultorLimpo = limparNomeConsultor(consultorOriginal);
      
      let consultorNormalizado;
      let setorOriginal;
      let setorExibicao;
      let isCadastrado = false;
      
      const encontrado = normalizarConsultorPeloMapa(consultorLimpo, mapaFuncionarios);
      
      if (encontrado) {
        isCadastrado = true;
        consultorNormalizado = encontrado;
        setorOriginal = obterSetorDoFuncionario(consultorNormalizado, mapaFuncionarios);
        setorExibicao = SETORES_COM_NOME.includes(setorOriginal) ? setorOriginal : "OUTROS";
      } else {
        const isWebSite = consultorLimpo.toUpperCase().includes("WEB SITE");
        if (isWebSite) {
          consultorNormalizado = "WEB SITE";
          setorOriginal = "WEB SITE";
          setorExibicao = "WEB/TELEVENDAS";
          isCadastrado = false;
        } else {
          consultorNormalizado = consultorLimpo.toUpperCase().trim();
          setorOriginal = "TELEVENDAS";
          setorExibicao = "WEB/TELEVENDAS";
          isCadastrado = false;
        }
      }
      
      const isWebTelevendas = (setorExibicao === "WEB/TELEVENDAS" || setorOriginal === "WEB SITE" || setorOriginal === "TELEVENDAS");
      const dest = isWebTelevendas ? vendasWeb : vendasLoja;

      if (!consultoresData[consultorNormalizado]) {
        consultoresData[consultorNormalizado] = Object.assign(novoTotalizador(), { 
          nome: consultorNormalizado, setorOriginal: setorOriginal, setorExibicao: setorExibicao, cadastrado: isCadastrado
        });
      }
      const c = consultoresData[consultorNormalizado];

      let isPromo = false;
      if (idx.promocao !== -1) {
        const promoVal = String(row[idx.promocao] || "").trim().toUpperCase();
        isPromo = ["SIM", "S", "YES", "Y", "1", "TRUE"].includes(promoVal);
      }
      const bucket = isPromo ? "promo" : "normal";

      const kyc = String(row[idx.kyc] || "").trim().toUpperCase();
      
      c.total++; totalGeral.total++; dest.total++;
      c[bucket].total++; totalGeral[bucket].total++; dest[bucket].total++;

      if (kyc === "CANCELADO") {
        c.cancelados++; totalGeral.cancelados++; dest.cancelados++;
        c[bucket].cancelados++; totalGeral[bucket].cancelados++; dest[bucket].cancelados++;
        continue;
      }

      if (kyc === "APROVADO") {
        c.aprovados++; totalGeral.aprovados++; dest.aprovados++;
        c[bucket].aprovados++; totalGeral[bucket].aprovados++; dest[bucket].aprovados++;
      } else {
        c.pendencias++; totalGeral.pendencias++; dest.pendencias++;
        if (kyc === "REPROVADO") {
          c.reprovados++; totalGeral.reprovados++; dest.reprovados++;
          c[bucket].reprovados++; totalGeral[bucket].reprovados++; dest[bucket].reprovados++;
        } else if (kyc === "EXPIRADO") {
          c.expirado++; totalGeral.expirado++; dest.expirado++;
          c[bucket].expirado++; totalGeral[bucket].expirado++; dest[bucket].expirado++;
        } else if (kyc === "PENDENTE") {
          c.pendente++; totalGeral.pendente++; dest.pendente++;
          c[bucket].pendente++; totalGeral[bucket].pendente++; dest[bucket].pendente++;
        } else {
          c.naoEnviado++; totalGeral.naoEnviado++; dest.naoEnviado++;
          c[bucket].naoEnviado++; totalGeral[bucket].naoEnviado++; dest[bucket].naoEnviado++;
        }
      }
    }

    const consultoresPorSetor = {};
    Object.values(consultoresData).forEach(c => {
      const setor = c.setorExibicao;
      if (!consultoresPorSetor[setor]) consultoresPorSetor[setor] = [];
      consultoresPorSetor[setor].push(c);
    });

    const responseData = {
      mes: MESES[mesAtual - 1],
      ano: anoAtual,
      geral: totalGeral,
      vendasLoja: vendasLoja,
      vendasWeb: vendasWeb,
      consultores: Object.values(consultoresData),
      consultoresPorSetor: consultoresPorSetor,
      temColunasPromo: idx.promocao !== -1,
      totalFuncionariosAtivos: ativos.length
    };

    criarDashboardQualidadeVendas(responseData);
    return createSuccessResponse(responseData);

  } catch (error) {
    return createErrorResponse(error.message);
  }
}

function criarDashboardQualidadeVendas(dados) {
  const ssDash = SpreadsheetApp.openById(ID_PLANILHA_DASHBOARDS);
  let sheet = ssDash.getSheetByName("Dashboard Qualidade Vendas");
  if (!sheet) sheet = ssDash.insertSheet("Dashboard Qualidade Vendas");
  sheet.clear();

  sheet.getRange("A1:L1").merge()
    .setValue("📊 DASHBOARD QUALIDADE VENDAS - " + dados.mes.toUpperCase() + " " + dados.ano)
    .setBackground("#000000").setFontColor("#ffffff")
    .setFontWeight("bold").setHorizontalAlignment("center").setFontSize(14);

  renderizarTresCardsPrincipaisQualidade(sheet, dados);

  let currentRow = 22;
  if (dados.temColunasPromo) {
    currentRow = renderizarCardsPromoQualidade(sheet, dados, currentRow);
  }

  const setoresOrdenados = ["VENDAS", "RECEPCAO", "REFILIACAO", "OUTROS", "WEB/TELEVENDAS"];
  const cores = {
    "VENDAS": "#1e3a8a",
    "RECEPCAO": "#059669",
    "REFILIACAO": "#7c3aed",
    "OUTROS": "#92400e",
    "WEB/TELEVENDAS": "#dc2626"
  };
  const emojis = {
    "VENDAS": "💰",
    "RECEPCAO": "🛎️",
    "REFILIACAO": "🔄",
    "OUTROS": "🚫",
    "WEB/TELEVENDAS": "🌐"
  };

  setoresOrdenados.forEach(setor => {
    const consultoresSetor = dados.consultoresPorSetor[setor] || [];
    if (consultoresSetor.length === 0) return;

    const corSetor = cores[setor] || "#4b5563";
    const emojiSetor = emojis[setor] || "🏢";
    
    sheet.getRange(currentRow, 1, 1, 12).merge()
      .setValue(emojiSetor + " SETOR: " + setor + " (" + consultoresSetor.length + " consultor" + (consultoresSetor.length > 1 ? "es" : "") + ")")
      .setBackground(corSetor).setFontColor("#ffffff")
      .setFontWeight("bold").setHorizontalAlignment("left");
    currentRow += 2;

    let col = 1;
    let maxCardHeight = 0;

    consultoresSetor.sort((a, b) => a.nome.localeCompare(b.nome));

    consultoresSetor.forEach(c => {
      const p = calcPctDoc(c.aprovados, c.total, c.cancelados);
      const hasPromo = dados.temColunasPromo && c.promo.total > 0;
      const bannerCor = cores[setor] || "#059669";
      
      const cardHeight = renderizarCardConsultorQualidade(sheet, c, p, hasPromo, currentRow, col, bannerCor);
      maxCardHeight = Math.max(maxCardHeight, cardHeight);

      col += 5;
      if (col > 9) {
        col = 1;
        currentRow += maxCardHeight + 3;
        maxCardHeight = 0;
      }
    });

    if (col !== 1) currentRow += maxCardHeight + 3;
    currentRow += 3;
  });

  sheet.setColumnWidths(1, 12, 160);
  sheet.setFrozenRows(1);
}

function renderizarCardConsultorQualidade(sheet, c, p, hasPromo, row, col, corBanner) {
  const cardWidth = hasPromo ? 4 : 2;
  const cor = corBanner || "#059669";

  sheet.getRange(row, col, 1, cardWidth).merge()
    .setValue(c.nome)
    .setBackground(cor)
    .setFontColor("#ffffff")
    .setFontWeight("bold")
    .setHorizontalAlignment("center");

  const mainData = [
    ["TOTAL", c.total],
    ["CANCELADOS", c.cancelados],
    ["BASE LÍQUIDA", c.total - c.cancelados],
    ["APROVADOS", c.aprovados],
    ["PENDÊNCIAS", c.pendencias],
    ["  NÃO ENVIADO", c.naoEnviado],
    ["  EXPIRADO", c.expirado],
    ["  PENDENTE", c.pendente],
    ["  REPROVADO", c.reprovados],
    ["% APROVADOS", p + "%"]
  ];

  sheet.getRange(row + 1, col, mainData.length, 2)
    .setValues(mainData).setBorder(true, true, true, true, true, true);

  sheet.getRange(row + 2, col + 1)
    .setBackground("#fee2e2").setFontColor("#991b1b").setFontWeight("bold");

  const cCor = p >= 90 ? "#10b981" : p >= 80 ? "#f59e0b" : "#ef4444";
  sheet.getRange(row + 10, col + 1)
    .setBackground(cCor).setFontColor("#ffffff").setFontWeight("bold");

  let cardHeight = 11;

  if (hasPromo) {
    const pP = calcPctDoc(c.promo.aprovados, c.promo.total, c.promo.cancelados);
    const pN = calcPctDoc(c.normal.aprovados, c.normal.total, c.normal.cancelados);

    const promoData = [
      ["Total", c.promo.total],
      ["Cancelados", c.promo.cancelados],
      ["Base líquida", c.promo.total - c.promo.cancelados],
      ["Aprovados", c.promo.aprovados],
      ["Pendências", c.promo.reprovados + c.promo.expirado + c.promo.pendente + c.promo.naoEnviado],
      ["% Aprovados", pP + "%"]
    ];

    const normalData = [
      ["Total", c.normal.total],
      ["Cancelados", c.normal.cancelados],
      ["Base líquida", c.normal.total - c.normal.cancelados],
      ["Aprovados", c.normal.aprovados],
      ["Pendências", c.normal.reprovados + c.normal.expirado + c.normal.pendente + c.normal.naoEnviado],
      ["% Aprovados", pN + "%"]
    ];

    const promoHeaderRow = row + 1;
    const promoDataRow = row + 2;
    const normalHeaderRow = row + 2 + promoData.length;
    const normalDataRow = normalHeaderRow + 1;

    sheet.getRange(promoHeaderRow, col + 2, 1, 2).merge()
      .setValue("▶ PROMOÇÃO")
      .setBackground("#7c3aed").setFontColor("#ffffff")
      .setFontWeight("bold").setHorizontalAlignment("center");

    sheet.getRange(promoDataRow, col + 2, promoData.length, 2)
      .setValues(promoData).setBorder(true, true, true, true, true, true);

    const cP = pP >= 90 ? "#10b981" : pP >= 80 ? "#f59e0b" : "#ef4444";
    sheet.getRange(promoDataRow + promoData.length - 1, col + 3)
      .setBackground(cP).setFontColor("#ffffff").setFontWeight("bold");

    sheet.getRange(normalHeaderRow, col + 2, 1, 2).merge()
      .setValue("▶ NORMAL")
      .setBackground("#1e3a8a").setFontColor("#ffffff")
      .setFontWeight("bold").setHorizontalAlignment("center");

    sheet.getRange(normalDataRow, col + 2, normalData.length, 2)
      .setValues(normalData).setBorder(true, true, true, true, true, true);

    const cN = pN >= 90 ? "#10b981" : pN >= 80 ? "#f59e0b" : "#ef4444";
    sheet.getRange(normalDataRow + normalData.length - 1, col + 3)
      .setBackground(cN).setFontColor("#ffffff").setFontWeight("bold");

    cardHeight = Math.max(cardHeight, 1 + promoData.length + 1 + normalData.length);
  }

  return cardHeight;
}

function renderizarTresCardsPrincipaisQualidade(sheet, dados) {
  const row = 3;
  const g = dados.geral;
  const l = dados.vendasLoja;
  const w = dados.vendasWeb;

  const pG = calcPctDoc(g.aprovados, g.total, g.cancelados);
  const pL = calcPctDoc(l.aprovados, l.total, l.cancelados);
  const pW = calcPctDoc(w.aprovados, w.total, w.cancelados);

  const blocos = [
    { titulo: "TOTAL GERAL", data: g, p: pG, col: 1, cor: "#000000" },
    { titulo: "VENDAS LOJA", data: l, p: pL, col: 4, cor: "#78350f" },
    { titulo: "WEB / TELEVENDAS", data: w, p: pW, col: 7, cor: "#1e3a8a" }
  ];

  blocos.forEach(b => {
    const d = b.data;
    const pP = dados.temColunasPromo ? calcPctDoc(d.promo.aprovados, d.promo.total, d.promo.cancelados) : null;
    const pN = dados.temColunasPromo ? calcPctDoc(d.normal.aprovados, d.normal.total, d.normal.cancelados) : null;

    const card = [
      [b.titulo, ""],
      ["TOTAL", d.total],
      ["CANCELADOS", d.cancelados],
      ["BASE LÍQUIDA", d.total - d.cancelados],
      ["APROVADOS", d.aprovados],
      ["PENDÊNCIAS", d.pendencias],
      ["  NÃO ENVIADO", d.naoEnviado],
      ["  EXPIRADO", d.expirado],
      ["  PENDENTE", d.pendente],
      ["  REPROVADO", d.reprovados],
      ["% APROVADOS", b.p + "%"],
      ["", ""],
      ["── PROMOÇÃO ──", dados.temColunasPromo ? d.promo.total + " vendas" : "sem coluna"],
      ["  Aprovados", dados.temColunasPromo ? d.promo.aprovados : "–"],
      ["  % Aprovados", dados.temColunasPromo ? pP + "%" : "–"],
      ["── NORMAL ──", dados.temColunasPromo ? d.normal.total + " vendas" : "sem coluna"],
      ["  Aprovados", dados.temColunasPromo ? d.normal.aprovados : "–"],
      ["  % Aprovados", dados.temColunasPromo ? pN + "%" : "–"]
    ];

    sheet.getRange(row, b.col, card.length, 2).setValues(card).setBorder(true, true, true, true, true, true);
    sheet.getRange(row, b.col, 1, 2).merge().setBackground(b.cor).setFontColor("#ffffff").setFontWeight("bold").setHorizontalAlignment("center");
    sheet.getRange(row + 2, b.col + 1).setBackground("#fee2e2").setFontColor("#991b1b").setFontWeight("bold");
    const cCor = b.p >= 90 ? "#10b981" : b.p >= 80 ? "#f59e0b" : "#ef4444";
    sheet.getRange(row + 10, b.col + 1).setBackground(cCor).setFontColor("#ffffff").setFontWeight("bold");

    if (dados.temColunasPromo) {
      const cP = pP >= 90 ? "#10b981" : pP >= 80 ? "#f59e0b" : "#ef4444";
      const cN = pN >= 90 ? "#10b981" : pN >= 80 ? "#f59e0b" : "#ef4444";
      sheet.getRange(row + 12, b.col, 1, 2).setBackground("#f3e8ff").setFontWeight("bold");
      sheet.getRange(row + 15, b.col, 1, 2).setBackground("#e0f2fe").setFontWeight("bold");
      sheet.getRange(row + 14, b.col + 1).setBackground(cP).setFontColor("#ffffff").setFontWeight("bold");
      sheet.getRange(row + 17, b.col + 1).setBackground(cN).setFontColor("#ffffff").setFontWeight("bold");
    }
  });
}

function renderizarCardsPromoQualidade(sheet, dados, startRow) {
  sheet.getRange(startRow, 1, 1, 12).merge()
    .setValue("📊 COMPARATIVO: PROMOÇÃO vs NORMAL")
    .setBackground("#7c3aed").setFontColor("#ffffff")
    .setFontWeight("bold").setHorizontalAlignment("center").setFontSize(12);
  startRow++;

  const blocos = [
    { label: "PROMOÇÃO — GERAL", data: dados.geral.promo, col: 1, cor: "#7c3aed" },
    { label: "PROMOÇÃO — LOJA", data: dados.vendasLoja.promo, col: 4, cor: "#6d28d9" },
    { label: "NORMAL — GERAL", data: dados.geral.normal, col: 7, cor: "#1e3a8a" },
    { label: "NORMAL — LOJA", data: dados.vendasLoja.normal, col: 10, cor: "#1e40af" }
  ];

  blocos.forEach(b => {
    const d = b.data;
    const p = calcPctDoc(d.aprovados, d.total, d.cancelados);
    const card = [
      [b.label, ""],
      ["TOTAL", d.total],
      ["CANCELADOS", d.cancelados],
      ["BASE LÍQUIDA", d.total - d.cancelados],
      ["APROVADOS", d.aprovados],
      ["REPROVADOS", d.reprovados],
      ["EXPIRADO", d.expirado],
      ["PENDENTE", d.pendente],
      ["NÃO ENVIADO", d.naoEnviado],
      ["% APROVADOS", p + "%"]
    ];
    sheet.getRange(startRow, b.col, card.length, 2).setValues(card).setBorder(true, true, true, true, true, true);
    sheet.getRange(startRow, b.col, 1, 2).merge().setBackground(b.cor).setFontColor("#ffffff").setFontWeight("bold").setHorizontalAlignment("center");
    sheet.getRange(startRow + 2, b.col + 1).setBackground("#fee2e2").setFontColor("#991b1b").setFontWeight("bold");
    const cCor = p >= 90 ? "#10b981" : p >= 80 ? "#f59e0b" : "#ef4444";
    sheet.getRange(startRow + 9, b.col + 1).setBackground(cCor).setFontColor("#ffffff").setFontWeight("bold");
  });

  return startRow + 12;
}

// ============================================================================
// APP
// ============================================================================

function getAppData(mes, ano) {
  try {
    const funcionarios = carregarFuncionarios();
    const mapaFuncionarios = funcionarios.mapaNomeSetor;
    const ativos = funcionarios.ativos;
    const consultoresRetencao = funcionarios.porSetor["RETENÇÃO"] || [];
    
    if (consultoresRetencao.length === 0) {
      consultoresRetencao.push("JACKSON", "ISAAC");
    }
    
    const ssDados = SpreadsheetApp.openById(ID_PLANILHA_DADOS);
    const sheetPrincipal = ssDados.getSheetByName("app");
    if (!sheetPrincipal) return createErrorResponse("Sheet 'app' não encontrada");

    const dataPrincipal = sheetPrincipal.getDataRange().getValues();
    const headersPrincipal = dataPrincipal[1];
    const idxPrincipal = {
      consultor: headersPrincipal.indexOf("CONSULTOR"),
      data: headersPrincipal.indexOf("DATA"),
      app: headersPrincipal.indexOf("APP BAIXADO")
    };

    const mesAtual = mes || new Date().getMonth() + 1;
    const anoAtual = ano || new Date().getFullYear();

    const SETORES_COM_NOME = ["VENDAS", "RECEPCAO", "REFILIACAO"];

    const consultoresData = {};
    let totalGeral = { total: 0, sim: 0, nao: 0, cancelado: 0, outros: 0 };
    let appLoja = { total: 0, sim: 0, nao: 0, cancelado: 0, outros: 0 };
    let appWeb = { total: 0, sim: 0, nao: 0, cancelado: 0, outros: 0 };

    for (let i = 2; i < dataPrincipal.length; i++) {
      const row = dataPrincipal[i];
      const dataParsed = parseDate(row[idxPrincipal.data]);
      if (dataParsed.mes !== mesAtual || dataParsed.ano !== anoAtual) continue;

      const consultorOriginal = String(row[idxPrincipal.consultor] || "").trim();
      if (!consultorOriginal) continue;

      const consultorLimpo = limparNomeConsultor(consultorOriginal);
      
      let consultorNormalizado;
      let setorOriginal;
      let setorExibicao;
      let isCadastrado = false;
      
      const encontrado = normalizarConsultorPeloMapa(consultorLimpo, mapaFuncionarios);
      
      if (encontrado) {
        isCadastrado = true;
        consultorNormalizado = encontrado;
        setorOriginal = obterSetorDoFuncionario(consultorNormalizado, mapaFuncionarios);
        setorExibicao = SETORES_COM_NOME.includes(setorOriginal) ? setorOriginal : "OUTROS";
      } else {
        const isWebSite = consultorLimpo.toUpperCase().includes("WEB SITE");
        if (isWebSite) {
          consultorNormalizado = "WEB SITE";
          setorOriginal = "WEB SITE";
          setorExibicao = "WEB/TELEVENDAS";
          isCadastrado = false;
        } else {
          consultorNormalizado = consultorLimpo.toUpperCase().trim();
          setorOriginal = "TELEVENDAS";
          setorExibicao = "WEB/TELEVENDAS";
          isCadastrado = false;
        }
      }
      
      const isWebTelevendas = (setorExibicao === "WEB/TELEVENDAS" || setorOriginal === "WEB SITE" || setorOriginal === "TELEVENDAS");
      const dest = isWebTelevendas ? appWeb : appLoja;

      if (!consultoresData[consultorNormalizado]) {
        consultoresData[consultorNormalizado] = {
          nome: consultorNormalizado,
          setorOriginal: setorOriginal,
          setorExibicao: setorExibicao,
          cadastrado: isCadastrado,
          total: 0, sim: 0, nao: 0, cancelado: 0, outros: 0
        };
      }
      const c = consultoresData[consultorNormalizado];

      const appRaw = String(row[idxPrincipal.app] || "").trim();
      const app = normalizarAppStatus(appRaw);
      
      c.total++; totalGeral.total++; dest.total++;
      
      if (app === "SIM") {
        c.sim++; totalGeral.sim++; dest.sim++;
      } else if (app === "NAO") {
        c.nao++; totalGeral.nao++; dest.nao++;
      } else if (app === "CANCELADO") {
        c.cancelado++; totalGeral.cancelado++; dest.cancelado++;
      } else {
        c.outros++; totalGeral.outros++; dest.outros++;
      }
    }

    const retencaoData = {};
    const sheetRetencao = ssDados.getSheetByName("APP RETENÇÃO") || ssDados.getSheetByName("APP RETENCAO") || ssDados.getSheetByName("App Retenção");

    if (sheetRetencao) {
      const dataRetencao = sheetRetencao.getDataRange().getValues();
      const headersRetencao = dataRetencao[1];
      const idxRetencao = {
        consultor: headersRetencao.indexOf("CONSULTOR"),
        data: headersRetencao.indexOf("DATA"),
        app: headersRetencao.indexOf("APP BAIXADO")
      };

      if (idxRetencao.consultor !== -1 && idxRetencao.data !== -1 && idxRetencao.app !== -1) {
        for (let i = 2; i < dataRetencao.length; i++) {
          const row = dataRetencao[i];
          const dataParsed = parseDate(row[idxRetencao.data]);
          if (dataParsed.mes !== mesAtual || dataParsed.ano !== anoAtual) continue;
          
          const consultorOriginal = String(row[idxRetencao.consultor] || "").trim().toUpperCase();
          if (!consultorOriginal) continue;
          
          let consultoraEncontrada = null;
          for (const nomeRetencao of consultoresRetencao) {
            if (consultorOriginal.includes(nomeRetencao.toUpperCase())) {
              consultoraEncontrada = nomeRetencao;
              break;
            }
          }
          
          if (!consultoraEncontrada) continue;
          
          const appRaw = String(row[idxRetencao.app] || "").trim();
          const app = normalizarAppStatus(appRaw);
          
          if (!retencaoData[consultoraEncontrada]) {
            retencaoData[consultoraEncontrada] = {
              nome: consultoraEncontrada,
              total: 0, sim: 0, nao: 0, cancelado: 0, outros: 0,
              setor: "RETENÇÃO"
            };
          }
          const r = retencaoData[consultoraEncontrada];
          r.total++;
          if (app === "SIM") r.sim++;
          else if (app === "NAO") r.nao++;
          else if (app === "CANCELADO") r.cancelado++;
          else r.outros++;
        }
      }
    }

    const consultoresPorSetor = {};
    Object.values(consultoresData).forEach(c => {
      const setor = c.setorExibicao;
      if (!consultoresPorSetor[setor]) consultoresPorSetor[setor] = [];
      consultoresPorSetor[setor].push(c);
    });

    const responseData = {
      mes: MESES[mesAtual - 1],
      ano: anoAtual,
      geral: totalGeral,
      appLoja: appLoja,
      appWeb: appWeb,
      consultores: Object.values(consultoresData),
      consultoresPorSetor: consultoresPorSetor,
      consultorasRetencao: Object.values(retencaoData),
      totalFuncionariosAtivos: ativos.length
    };

    criarDashboardApp(responseData);
    return createSuccessResponse(responseData);

  } catch (error) {
    return createErrorResponse(error.message);
  }
}

function criarDashboardApp(dados) {
  const ssDash = SpreadsheetApp.openById(ID_PLANILHA_DASHBOARDS);
  let sheet = ssDash.getSheetByName("Dashboard App");
  if (!sheet) sheet = ssDash.insertSheet("Dashboard App");
  sheet.clear();

  sheet.getRange("A1:L1").merge()
    .setValue("📱 DASHBOARD APP - " + dados.mes.toUpperCase() + " " + dados.ano)
    .setBackground("#000000").setFontColor("#ffffff")
    .setFontWeight("bold").setHorizontalAlignment("center").setFontSize(14);

  let currentRow = 3;
  const g = dados.geral;
  const l = dados.appLoja;
  const w = dados.appWeb;
  
  const pG = g.total > 0 ? Math.round((g.sim / g.total) * 100) : 0;
  const pL = l.total > 0 ? Math.round((l.sim / l.total) * 100) : 0;
  const pW = w.total > 0 ? Math.round((w.sim / w.total) * 100) : 0;

  const cards = [
    { titulo: "APP - TOTAL", data: g, p: pG, col: 1, cor: "#000000" },
    { titulo: "APP - LOJA", data: l, p: pL, col: 4, cor: "#78350f" },
    { titulo: "APP - WEB/TELEVENDAS", data: w, p: pW, col: 7, cor: "#1e3a8a" }
  ];

  cards.forEach(card => {
    const d = card.data;
    const dadosCard = [
      [card.titulo, ""],
      ["TOTAL", d.total],
      ["COM APP (SIM)", d.sim],
      ["SEM APP (NÃO)", d.nao],
      ["CANCELADO", d.cancelado],
      ["OUTROS", d.outros || 0],
      ["% COM APP", card.p + "%"]
    ];
    sheet.getRange(3, card.col, dadosCard.length, 2).setValues(dadosCard).setBorder(true, true, true, true, true, true);
    sheet.getRange(3, card.col, 1, 2).merge()
      .setBackground(card.cor).setFontColor("#ffffff")
      .setFontWeight("bold").setHorizontalAlignment("center");
    const cCor = card.p >= 90 ? "#10b981" : card.p >= 80 ? "#f59e0b" : "#ef4444";
    sheet.getRange(9, card.col + 1).setBackground(cCor).setFontColor("#ffffff").setFontWeight("bold");
  });

  currentRow = 13;
  if (dados.consultorasRetencao && dados.consultorasRetencao.length > 0) {
    sheet.getRange(currentRow, 1, 1, 12).merge()
      .setValue("👑 CONSULTORAS DE RETENÇÃO")
      .setBackground("#7c3aed").setFontColor("#ffffff")
      .setFontWeight("bold").setHorizontalAlignment("center");
    currentRow += 2;
    
    let col = 1;
    dados.consultorasRetencao.sort((a, b) => a.nome.localeCompare(b.nome)).forEach(c => {
      const p = c.total > 0 ? Math.round((c.sim / c.total) * 100) : 0;
      const card = [
        [c.nome + " (RETENÇÃO)", ""],
        ["TOTAL", c.total],
        ["COM APP (SIM)", c.sim],
        ["SEM APP (NÃO)", c.nao],
        ["CANCELADO", c.cancelado],
        ["OUTROS", c.outros || 0],
        ["% COM APP", p + "%"]
      ];
      sheet.getRange(currentRow, col, card.length, 2).setValues(card).setBorder(true, true, true, true, true, true);
      sheet.getRange(currentRow, col, 1, 2).merge()
        .setBackground("#7c3aed").setFontColor("#ffffff")
        .setFontWeight("bold").setHorizontalAlignment("center");
      const cCor = p >= 90 ? "#10b981" : p >= 80 ? "#f59e0b" : "#ef4444";
      sheet.getRange(currentRow + 6, col + 1).setBackground(cCor).setFontColor("#ffffff").setFontWeight("bold");
      col += 3;
      if (col > 9) { col = 1; currentRow += 8; }
    });
    if (col !== 1) currentRow += 8; else currentRow += 2;
    currentRow += 2;
  }

  const setoresOrdenados = ["VENDAS", "RECEPCAO", "REFILIACAO", "OUTROS", "WEB/TELEVENDAS"];
  const cores = {
    "VENDAS": "#1e3a8a",
    "RECEPCAO": "#059669",
    "REFILIACAO": "#7c3aed",
    "OUTROS": "#92400e",
    "WEB/TELEVENDAS": "#dc2626"
  };
  const emojis = {
    "VENDAS": "💰",
    "RECEPCAO": "🛎️",
    "REFILIACAO": "🔄",
    "OUTROS": "🚫",
    "WEB/TELEVENDAS": "🌐"
  };

  setoresOrdenados.forEach(setor => {
    const consultoresSetor = dados.consultoresPorSetor[setor] || [];
    if (consultoresSetor.length === 0) return;

    const corSetor = cores[setor] || "#4b5563";
    const emojiSetor = emojis[setor] || "🏢";
    
    sheet.getRange(currentRow, 1, 1, 12).merge()
      .setValue(emojiSetor + " SETOR: " + setor + " (" + consultoresSetor.length + " consultor" + (consultoresSetor.length > 1 ? "es" : "") + ")")
      .setBackground(corSetor).setFontColor("#ffffff")
      .setFontWeight("bold").setHorizontalAlignment("left");
    currentRow += 2;

    let col = 1;
    consultoresSetor.sort((a, b) => a.nome.localeCompare(b.nome));

    consultoresSetor.forEach(c => {
      const p = c.total > 0 ? Math.round((c.sim / c.total) * 100) : 0;
      const card = [
        [c.nome, ""],
        ["TOTAL", c.total],
        ["SIM", c.sim],
        ["NÃO", c.nao],
        ["CANCELADO", c.cancelado],
        ["OUTROS", c.outros || 0],
        ["% APP", p + "%"]
      ];
      const bannerCor = cores[setor] || "#059669";
      sheet.getRange(currentRow, col, card.length, 2).setValues(card).setBorder(true, true, true, true, true, true);
      sheet.getRange(currentRow, col, 1, 2).merge()
        .setBackground(bannerCor).setFontColor("#ffffff")
        .setFontWeight("bold").setHorizontalAlignment("center");
      const cCor = p >= 90 ? "#10b981" : p >= 80 ? "#f59e0b" : "#ef4444";
      sheet.getRange(currentRow + 6, col + 1).setBackground(cCor).setFontColor("#ffffff").setFontWeight("bold");
      col += 3;
      if (col > 9) { col = 1; currentRow += 8; }
    });

    if (col !== 1) currentRow += 8;
    currentRow += 2;
  });

  sheet.setColumnWidths(1, 12, 160);
  sheet.setFrozenRows(1);
}

// ============================================================================
// QUALIDADE TROCAS
// ============================================================================

function getQualidadeTrocasData(mes, ano) {
  try {
    const ssDados = SpreadsheetApp.openById(ID_PLANILHA_DADOS);
    const sheet = ssDados.getSheetByName("QUALIDADE TROCAS");
    if (!sheet) return createErrorResponse("Sheet 'QUALIDADE TROCAS' não encontrada");
    
    const data = sheet.getDataRange().getValues();
    const headers = data[1];
    const idx = {
      consultor: headers.indexOf("Consultor"),
      data: headers.indexOf("Data"),
      kyc: headers.indexOf("KYC"),
      mensalidadeOk: headers.indexOf("MENSALIDADE OK"),
      statusBi: headers.indexOf("STATUS BI")
    };

    const mesAtual = mes || new Date().getMonth() + 1;
    const anoAtual = ano || new Date().getFullYear();

    const consultoresData = {};
    let totalGeral = {
      totalTrocas: 0, mensOk: 0, mensAberto: 0, mensAtraso: 0,
      aprovados: 0, pendentes: 0,
      totalBi: 0, foraBi: 0, okBi: 0
    };

    for (let i = 2; i < data.length; i++) {
      const row = data[i];
      const dataParsed = parseDate(row[idx.data]);
      if (dataParsed.mes !== mesAtual || dataParsed.ano !== anoAtual) continue;

      const consultor = String(row[idx.consultor] || "").trim();
      const kyc = String(row[idx.kyc] || "").trim().toUpperCase();
      const mensalidade = String(row[idx.mensalidadeOk] || "").trim().toUpperCase();
      const statusBi = String(row[idx.statusBi] || "").trim().toUpperCase();

      if (!consultoresData[consultor]) {
        consultoresData[consultor] = {
          nome: consultor,
          totalTrocas: 0, mensOk: 0, mensAberto: 0, mensAtraso: 0,
          aprovados: 0, pendentes: 0,
          totalBi: 0, foraBi: 0, okBi: 0
        };
      }

      const c = consultoresData[consultor];
      c.totalTrocas++;
      totalGeral.totalTrocas++;

      if (mensalidade === "OK") { c.mensOk++; totalGeral.mensOk++; }
      if (mensalidade === "EM ABERTO") { c.mensAberto++; totalGeral.mensAberto++; }
      if (mensalidade === "ATRASO") { c.mensAtraso++; totalGeral.mensAtraso++; }

      if (kyc === "APROVADO") { c.aprovados++; totalGeral.aprovados++; }
      else { c.pendentes++; totalGeral.pendentes++; }

      if (statusBi === "OK") { c.totalBi++; totalGeral.totalBi++; }
      if (statusBi === "FORA") { c.foraBi++; totalGeral.foraBi++; }
      if (statusBi === "OK" && mensalidade === "OK") { c.okBi++; totalGeral.okBi++; }
    }

    for (const c of Object.values(consultoresData)) {
      c.percentualAprovado = c.totalTrocas > 0 ? Math.round((c.aprovados / c.totalTrocas) * 100) : 0;
    }
    totalGeral.percentualAprovado = totalGeral.totalTrocas > 0 ? Math.round((totalGeral.aprovados / totalGeral.totalTrocas) * 100) : 0;

    const responseData = {
      mes: MESES[mesAtual - 1],
      ano: anoAtual,
      geral: totalGeral,
      consultores: Object.values(consultoresData).sort((a, b) => a.nome.localeCompare(b.nome))
    };

    criarDashboardQualidadeTrocas(responseData);
    return createSuccessResponse(responseData);

  } catch (error) {
    return createErrorResponse(error.message);
  }
}

function criarDashboardQualidadeTrocas(dados) {
  const ssDash = SpreadsheetApp.openById(ID_PLANILHA_DASHBOARDS);
  let sheet = ssDash.getSheetByName("Dashboard Qualidade Trocas");
  if (!sheet) sheet = ssDash.insertSheet("Dashboard Qualidade Trocas");
  sheet.clear();

  sheet.getRange("A1:L1").merge()
    .setValue("📊 DASHBOARD QUALIDADE TROCAS - " + dados.mes.toUpperCase() + " " + dados.ano)
    .setBackground("#000000").setFontColor("#ffffff")
    .setFontWeight("bold").setHorizontalAlignment("center").setFontSize(14);

  const g = dados.geral;
  const cardGeral = [
    ["EQUIPE - TOTAL", ""],
    ["TOTAL TROCAS", g.totalTrocas],
    ["MENS. OK", g.mensOk],
    ["MENS. ABERTO", g.mensAberto],
    ["MENS. ATRASO", g.mensAtraso],
    ["APROVADOS", g.aprovados],
    ["PENDENTES", g.pendentes],
    ["% APROVADOS", g.percentualAprovado + "%"],
    ["TOTAL BI", g.totalBi],
    ["FORA BI", g.foraBi],
    ["OK BI", g.okBi]
  ];

  sheet.getRange(3, 1, cardGeral.length, 2).setValues(cardGeral).setBorder(true, true, true, true, true, true);
  sheet.getRange(3, 1, 1, 2).merge()
    .setBackground("#000000").setFontColor("#ffffff")
    .setFontWeight("bold").setHorizontalAlignment("center");

  const corGeral = g.percentualAprovado >= 90 ? "#10b981" : g.percentualAprovado >= 80 ? "#f59e0b" : "#ef4444";
  sheet.getRange(10, 2).setBackground(corGeral).setFontColor("#ffffff").setFontWeight("bold");

  let row = 16;
  let col = 1;

  dados.consultores.forEach((c, i) => {
    const card = [
      [c.nome, ""],
      ["TOTAL TROCAS", c.totalTrocas],
      ["MENS. OK", c.mensOk],
      ["MENS. ABERTO", c.mensAberto],
      ["MENS. ATRASO", c.mensAtraso],
      ["APROVADOS", c.aprovados],
      ["PENDENTES", c.pendentes],
      ["% APROVADOS", c.percentualAprovado + "%"],
      ["TOTAL BI", c.totalBi],
      ["FORA BI", c.foraBi],
      ["OK BI", c.okBi]
    ];

    sheet.getRange(row, col, card.length, 2).setValues(card).setBorder(true, true, true, true, true, true);
    sheet.getRange(row, col, 1, 2).merge()
      .setBackground("#1e40af").setFontColor("#ffffff")
      .setFontWeight("bold").setHorizontalAlignment("center");

    const cor = c.percentualAprovado >= 90 ? "#10b981" : c.percentualAprovado >= 80 ? "#f59e0b" : "#ef4444";
    sheet.getRange(row + 7, col + 1).setBackground(cor).setFontColor("#ffffff").setFontWeight("bold");

    col += 3;
    if (col > 9) {
      col = 1;
      row += 13;
    }
  });

  sheet.setColumnWidths(1, 12, 140);
}

// ============================================================================
// REFUTURIZA
// ============================================================================

function getRefuturizaData(mes, ano) {
  try {
    const ssDados = SpreadsheetApp.openById(ID_PLANILHA_DADOS);
    let sheet = ssDados.getSheetByName("REFUTURIZA");
    if (!sheet) {
      const sheets = ssDados.getSheets();
      sheet = sheets.find(s => {
        const nome = s.getName().toUpperCase();
        return nome.includes("REFUTURIZA") || nome.includes("REFUTURISA") || nome.includes("REFUTUR");
      });
    }
    if (!sheet) return createErrorResponse("Sheet 'REFUTURIZA' não encontrada");

    const data = sheet.getDataRange().getValues();
    const idx = {
      matricula: 0,
      nomeAderente: 1,
      nomeConsultor: 2,
      dataFiliacao: 3,
      statusLigacao: 4
    };

    const mesAtual = mes || new Date().getMonth() + 1;
    const anoAtual = ano || new Date().getFullYear();

    const consultoresData = {};
    let totalGeral = { total: 0, comLigacao: 0, semLigacao: 0, cancelado: 0 };

    for (let i = 2; i < data.length; i++) {
      const row = data[i];
      if (!row[idx.matricula] && !row[idx.nomeAderente] && !row[idx.nomeConsultor]) continue;
      
      if (row[idx.dataFiliacao]) {
        const dataParsed = parseDate(row[idx.dataFiliacao]);
        if (dataParsed.mes !== mesAtual || dataParsed.ano !== anoAtual) continue;
      }
      
      const consultorOriginal = String(row[idx.nomeConsultor] || "").trim();
      if (!consultorOriginal) continue;

      const status = normalizarStatusLigacao(String(row[idx.statusLigacao] || "").trim());

      if (!consultoresData[consultorOriginal]) {
        consultoresData[consultorOriginal] = {
          nome: consultorOriginal,
          total: 0, comLigacao: 0, semLigacao: 0, cancelado: 0
        };
      }
      const c = consultoresData[consultorOriginal];
      c.total++; totalGeral.total++;
      
      if (status === "COM LIGAÇÃO") {
        c.comLigacao++; totalGeral.comLigacao++;
      } else if (status === "SEM LIGAÇÃO") {
        c.semLigacao++; totalGeral.semLigacao++;
      } else if (status === "CANCELADO") {
        c.cancelado++; totalGeral.cancelado++;
      } else {
        c.semLigacao++; totalGeral.semLigacao++;
      }
    }

    const consultoresComVendas = Object.values(consultoresData)
      .filter(c => c.total > 0)
      .sort((a, b) => b.total !== a.total ? b.total - a.total : a.nome.localeCompare(b.nome));

    const responseData = {
      mes: MESES[mesAtual - 1],
      ano: anoAtual,
      geral: totalGeral,
      consultores: consultoresComVendas
    };

    criarDashboardRefuturiza(responseData);
    return createSuccessResponse(responseData);

  } catch (error) {
    return createErrorResponse(error.message);
  }
}

function criarDashboardRefuturiza(dados) {
  const ssDash = SpreadsheetApp.openById(ID_PLANILHA_DASHBOARDS);
  let sheet = ssDash.getSheetByName("Dashboard Refuturiza");
  if (!sheet) sheet = ssDash.insertSheet("Dashboard Refuturiza");
  sheet.clear();

  sheet.getRange("A1:L1").merge()
    .setValue("🔄 DASHBOARD REFUTURIZA - " + dados.mes.toUpperCase() + " " + dados.ano)
    .setBackground("#7c3aed").setFontColor("#ffffff")
    .setFontWeight("bold").setHorizontalAlignment("center").setFontSize(14);

  const row = 3;
  const g = dados.geral;
  const p = g.total > 0 ? Math.round((g.comLigacao / g.total) * 100) : 0;
  
  const cardGeral = [
    ["REFUTURIZA - TOTAL DA LOJA", ""],
    ["TOTAL", g.total],
    ["COM LIGAÇÃO", g.comLigacao],
    ["SEM LIGAÇÃO", g.semLigacao],
    ["CANCELADO", g.cancelado],
    ["", ""],
    ["% COM LIGAÇÃO", p + "%"]
  ];
  
  sheet.getRange(row, 1, cardGeral.length, 2).setValues(cardGeral).setBorder(true, true, true, true, true, true);
  sheet.getRange(row, 1, 1, 2).merge()
    .setBackground("#7c3aed").setFontColor("#ffffff")
    .setFontWeight("bold").setHorizontalAlignment("center");
  
  const corPercentual = p >= 90 ? "#10b981" : p >= 80 ? "#f59e0b" : "#ef4444";
  sheet.getRange(row + 6, 2).setBackground(corPercentual).setFontColor("#ffffff").setFontWeight("bold");

  let currentRow = row + cardGeral.length + 3;

  if (dados.consultores.length > 0) {
    sheet.getRange(currentRow, 1, 1, 12).merge()
      .setValue("CONSULTORES COM VENDAS")
      .setBackground("#4b5563").setFontColor("#ffffff")
      .setFontWeight("bold").setHorizontalAlignment("center");
    currentRow += 2;
    
    let col = 1;
    let consultorRow = currentRow;
    
    dados.consultores.forEach(c => {
      const pConsultor = c.total > 0 ? Math.round((c.comLigacao / c.total) * 100) : 0;
      const card = [
        [c.nome, ""],
        ["TOTAL", c.total],
        ["COM LIGAÇÃO", c.comLigacao],
        ["SEM LIGAÇÃO", c.semLigacao],
        ["CANCELADO", c.cancelado],
        ["", ""],
        ["% COM LIGAÇÃO", pConsultor + "%"]
      ];
      
      sheet.getRange(consultorRow, col, card.length, 2).setValues(card).setBorder(true, true, true, true, true, true);
      sheet.getRange(consultorRow, col, 1, 2).merge()
        .setBackground("#7c3aed").setFontColor("#ffffff")
        .setFontWeight("bold").setHorizontalAlignment("center");
      
      const corPercentualConsultor = pConsultor >= 90 ? "#10b981" : pConsultor >= 80 ? "#f59e0b" : "#ef4444";
      sheet.getRange(consultorRow + 6, col + 1).setBackground(corPercentualConsultor).setFontColor("#ffffff").setFontWeight("bold");
      
      col += 3;
      if (col > 10) {
        col = 1;
        consultorRow += card.length + 1;
      }
    });
    
    if (col !== 1) currentRow = consultorRow + 8;
    else currentRow = consultorRow + 1;
  } else {
    sheet.getRange(currentRow, 1, 1, 12).merge()
      .setValue("ℹ️ Nenhum consultor com vendas neste período")
      .setBackground("#f59e0b").setFontColor("#000000")
      .setFontWeight("bold").setHorizontalAlignment("center");
    currentRow += 2;
  }

  currentRow += 2;
  const resumoFinal = [
    ["📈 RESUMO FINAL", ""],
    ["Total de Consultores:", dados.consultores.length],
    ["Total de Vendas:", g.total],
    ["Média por Consultor:", dados.consultores.length > 0 ? Math.round(g.total / dados.consultores.length) : 0],
    ["Melhor %:", dados.consultores.length > 0 ? Math.max(...dados.consultores.map(c => c.total > 0 ? Math.round((c.comLigacao / c.total) * 100) : 0)) + "%" : "0%"],
    ["Pior %:", dados.consultores.length > 0 ? Math.min(...dados.consultores.map(c => c.total > 0 ? Math.round((c.comLigacao / c.total) * 100) : 0)) + "%" : "0%"]
  ];
  
  sheet.getRange(currentRow, 1, resumoFinal.length, 2).setValues(resumoFinal).setBorder(true, true, true, true, true, true);
  sheet.getRange(currentRow, 1, 1, 2).merge()
    .setBackground("#000000").setFontColor("#ffffff")
    .setFontWeight("bold").setHorizontalAlignment("center");

  sheet.setColumnWidths(1, 12, 160);
  sheet.setFrozenRows(1);
}

// ============================================================================
// FUNÇÕES DE ABERTURA DE DASHBOARDS
// ============================================================================

function abrirDashboardQualidadeVendasJaneiro() { abrirDashboardPorMesETipo(1, "qualidade_vendas"); }
function abrirDashboardQualidadeVendasFevereiro() { abrirDashboardPorMesETipo(2, "qualidade_vendas"); }
function abrirDashboardQualidadeVendasMarco() { abrirDashboardPorMesETipo(3, "qualidade_vendas"); }
function abrirDashboardQualidadeVendasAbril() { abrirDashboardPorMesETipo(4, "qualidade_vendas"); }
function abrirDashboardQualidadeVendasMaio() { abrirDashboardPorMesETipo(5, "qualidade_vendas"); }
function abrirDashboardQualidadeVendasJunho() { abrirDashboardPorMesETipo(6, "qualidade_vendas"); }
function abrirDashboardQualidadeVendasJulho() { abrirDashboardPorMesETipo(7, "qualidade_vendas"); }
function abrirDashboardQualidadeVendasAgosto() { abrirDashboardPorMesETipo(8, "qualidade_vendas"); }
function abrirDashboardQualidadeVendasSetembro() { abrirDashboardPorMesETipo(9, "qualidade_vendas"); }
function abrirDashboardQualidadeVendasOutubro() { abrirDashboardPorMesETipo(10, "qualidade_vendas"); }
function abrirDashboardQualidadeVendasNovembro() { abrirDashboardPorMesETipo(11, "qualidade_vendas"); }
function abrirDashboardQualidadeVendasDezembro() { abrirDashboardPorMesETipo(12, "qualidade_vendas"); }

function abrirDashboardAppJaneiro() { abrirDashboardPorMesETipo(1, "app"); }
function abrirDashboardAppFevereiro() { abrirDashboardPorMesETipo(2, "app"); }
function abrirDashboardAppMarco() { abrirDashboardPorMesETipo(3, "app"); }
function abrirDashboardAppAbril() { abrirDashboardPorMesETipo(4, "app"); }
function abrirDashboardAppMaio() { abrirDashboardPorMesETipo(5, "app"); }
function abrirDashboardAppJunho() { abrirDashboardPorMesETipo(6, "app"); }
function abrirDashboardAppJulho() { abrirDashboardPorMesETipo(7, "app"); }
function abrirDashboardAppAgosto() { abrirDashboardPorMesETipo(8, "app"); }
function abrirDashboardAppSetembro() { abrirDashboardPorMesETipo(9, "app"); }
function abrirDashboardAppOutubro() { abrirDashboardPorMesETipo(10, "app"); }
function abrirDashboardAppNovembro() { abrirDashboardPorMesETipo(11, "app"); }
function abrirDashboardAppDezembro() { abrirDashboardPorMesETipo(12, "app"); }

function abrirDashboardQualidadeTrocasJaneiro() { abrirDashboardPorMesETipo(1, "qualidade_trocas"); }
function abrirDashboardQualidadeTrocasFevereiro() { abrirDashboardPorMesETipo(2, "qualidade_trocas"); }
function abrirDashboardQualidadeTrocasMarco() { abrirDashboardPorMesETipo(3, "qualidade_trocas"); }
function abrirDashboardQualidadeTrocasAbril() { abrirDashboardPorMesETipo(4, "qualidade_trocas"); }
function abrirDashboardQualidadeTrocasMaio() { abrirDashboardPorMesETipo(5, "qualidade_trocas"); }
function abrirDashboardQualidadeTrocasJunho() { abrirDashboardPorMesETipo(6, "qualidade_trocas"); }
function abrirDashboardQualidadeTrocasJulho() { abrirDashboardPorMesETipo(7, "qualidade_trocas"); }
function abrirDashboardQualidadeTrocasAgosto() { abrirDashboardPorMesETipo(8, "qualidade_trocas"); }
function abrirDashboardQualidadeTrocasSetembro() { abrirDashboardPorMesETipo(9, "qualidade_trocas"); }
function abrirDashboardQualidadeTrocasOutubro() { abrirDashboardPorMesETipo(10, "qualidade_trocas"); }
function abrirDashboardQualidadeTrocasNovembro() { abrirDashboardPorMesETipo(11, "qualidade_trocas"); }
function abrirDashboardQualidadeTrocasDezembro() { abrirDashboardPorMesETipo(12, "qualidade_trocas"); }

function abrirDashboardRecorrenciaJaneiro() { abrirDashboardRecorrenciaPorMes(1); }
function abrirDashboardRecorrenciaFevereiro() { abrirDashboardRecorrenciaPorMes(2); }
function abrirDashboardRecorrenciaMarco() { abrirDashboardRecorrenciaPorMes(3); }
function abrirDashboardRecorrenciaAbril() { abrirDashboardRecorrenciaPorMes(4); }
function abrirDashboardRecorrenciaMaio() { abrirDashboardRecorrenciaPorMes(5); }
function abrirDashboardRecorrenciaJunho() { abrirDashboardRecorrenciaPorMes(6); }
function abrirDashboardRecorrenciaJulho() { abrirDashboardRecorrenciaPorMes(7); }
function abrirDashboardRecorrenciaAgosto() { abrirDashboardRecorrenciaPorMes(8); }
function abrirDashboardRecorrenciaSetembro() { abrirDashboardRecorrenciaPorMes(9); }
function abrirDashboardRecorrenciaOutubro() { abrirDashboardRecorrenciaPorMes(10); }
function abrirDashboardRecorrenciaNovembro() { abrirDashboardRecorrenciaPorMes(11); }
function abrirDashboardRecorrenciaDezembro() { abrirDashboardRecorrenciaPorMes(12); }

function abrirDashboardRefuturizaJaneiro() { abrirDashboardPorMesETipo(1, "refuturiza"); }
function abrirDashboardRefuturizaFevereiro() { abrirDashboardPorMesETipo(2, "refuturiza"); }
function abrirDashboardRefuturizaMarco() { abrirDashboardPorMesETipo(3, "refuturiza"); }
function abrirDashboardRefuturizaAbril() { abrirDashboardPorMesETipo(4, "refuturiza"); }
function abrirDashboardRefuturizaMaio() { abrirDashboardPorMesETipo(5, "refuturiza"); }
function abrirDashboardRefuturizaJunho() { abrirDashboardPorMesETipo(6, "refuturiza"); }
function abrirDashboardRefuturizaJulho() { abrirDashboardPorMesETipo(7, "refuturiza"); }
function abrirDashboardRefuturizaAgosto() { abrirDashboardPorMesETipo(8, "refuturiza"); }
function abrirDashboardRefuturizaSetembro() { abrirDashboardPorMesETipo(9, "refuturiza"); }
function abrirDashboardRefuturizaOutubro() { abrirDashboardPorMesETipo(10, "refuturiza"); }
function abrirDashboardRefuturizaNovembro() { abrirDashboardPorMesETipo(11, "refuturiza"); }
function abrirDashboardRefuturizaDezembro() { abrirDashboardPorMesETipo(12, "refuturiza"); }

function abrirDashboardPorMesETipo(mes, tipo) {
  try {
    const ssDash = SpreadsheetApp.openById(ID_PLANILHA_DASHBOARDS);
    let sheetName = "";
    let sheet = null;

    if (tipo === "qualidade_vendas") {
      sheetName = "Dashboard Qualidade Vendas";
      sheet = ssDash.getSheetByName(sheetName);
      if (!sheet) { const ano = new Date().getFullYear(); getQualidadeVendasData(mes, ano); sheet = ssDash.getSheetByName(sheetName); }
    } else if (tipo === "app") {
      sheetName = "Dashboard App";
      sheet = ssDash.getSheetByName(sheetName);
      if (!sheet) { const ano = new Date().getFullYear(); getAppData(mes, ano); sheet = ssDash.getSheetByName(sheetName); }
    } else if (tipo === "qualidade_trocas") {
      sheetName = "Dashboard Qualidade Trocas";
      sheet = ssDash.getSheetByName(sheetName);
      if (!sheet) { const ano = new Date().getFullYear(); getQualidadeTrocasData(mes, ano); sheet = ssDash.getSheetByName(sheetName); }
    } else if (tipo === "recorrencia") {
      sheetName = "Dashboard Recorrência";
      sheet = ssDash.getSheetByName(sheetName);
      if (!sheet) { gerarDashboardRecorrencia(); sheet = ssDash.getSheetByName(sheetName); }
    } else if (tipo === "refuturiza") {
      sheetName = "Dashboard Refuturiza";
      sheet = ssDash.getSheetByName(sheetName);
      if (!sheet) { const ano = new Date().getFullYear(); getRefuturizaData(mes, ano); sheet = ssDash.getSheetByName(sheetName); }
    }

    if (!sheet) throw new Error(`Aba ${sheetName} não encontrada`);

    const url = `https://docs.google.com/spreadsheets/d/${ID_PLANILHA_DASHBOARDS}/edit#gid=${sheet.getSheetId()}`;
    SpreadsheetApp.getUi().showModalDialog(
      HtmlService.createHtmlOutput(`<script>window.open('${url}', '_blank'); google.script.host.close();</script>`),
      'Abrindo Dashboard...'
    );
  } catch (error) {
    SpreadsheetApp.getUi().alert(`Erro ao abrir dashboard: ${error.message}`);
  }
}

function abrirDashboardRecorrenciaPorMes(mes) {
  try {
    const ano = new Date().getFullYear();
    const ssDash = SpreadsheetApp.openById(ID_PLANILHA_DASHBOARDS);
    const nomeAba = `Recorrência ${MESES[mes-1]} ${ano}`;
    let sheet = ssDash.getSheetByName(nomeAba);
    if (!sheet) {
      const dados = processarDadosRecorrenciaPorMes(mes, ano, true);
      if (dados.status === "success") {
        renderizarPlanilhaRecorrenciaPorMes(dados.data, mes, ano);
        sheet = ssDash.getSheetByName(nomeAba);
      } else {
        throw new Error(dados.error);
      }
    }
    const url = `https://docs.google.com/spreadsheets/d/${ID_PLANILHA_DASHBOARDS}/edit#gid=${sheet.getSheetId()}`;
    SpreadsheetApp.getUi().showModalDialog(
      HtmlService.createHtmlOutput(`<script>window.open('${url}', '_blank'); google.script.host.close();</script>`),
      'Abrindo Dashboard Recorrência...'
    );
  } catch (error) {
    SpreadsheetApp.getUi().alert(`Erro ao abrir dashboard: ${error.message}`);
  }
}

// ============================================================================
// DASHBOARD MÊS PASSADO
// ============================================================================

function gerarDashboardMesPassado() {
  try {
    const ui = SpreadsheetApp.getUi();
    const anoAtual = new Date().getFullYear();
    const html = `
      <div style="padding: 20px; font-family: Arial;">
        <h2>🔧 Gerar Dashboard para Mês Específico</h2>
        <div style="margin: 15px 0;">
          <label for="dashboardType"><strong>Selecione o Dashboard:</strong></label><br>
          <select id="dashboardType" style="width: 100%; padding: 8px; margin: 10px 0;">
            <option value="qualidade_vendas">📁 Qualidade Vendas</option>
            <option value="app">📱 App</option>
            <option value="qualidade_trocas">📊 Qualidade Trocas</option>
            <option value="recorrencia">📈 Recorrência</option>
            <option value="refuturiza">🔄 Refuturiza</option>
          </select>
        </div>
        <div style="margin: 15px 0;" id="monthYearSection">
          <label for="mes"><strong>Selecione o Mês:</strong></label><br>
          <select id="mes" style="width: 100%; padding: 8px; margin: 10px 0;">
            <option value="1">Janeiro</option><option value="2">Fevereiro</option>
            <option value="3">Março</option><option value="4">Abril</option>
            <option value="5">Maio</option><option value="6">Junho</option>
            <option value="7">Julho</option><option value="8">Agosto</option>
            <option value="9">Setembro</option><option value="10">Outubro</option>
            <option value="11">Novembro</option><option value="12">Dezembro</option>
          </select>
        </div>
        <div style="margin: 15px 0;" id="yearSection">
          <label for="ano"><strong>Ano:</strong></label><br>
          <input type="number" id="ano" value="${anoAtual}" style="width: 100%; padding: 8px; margin: 10px 0;">
        </div>
        <div style="margin: 20px 0; padding: 10px; background: #f0f0f0; border-radius: 5px;">
          <strong>📋 Resumo:</strong><br>
          Dashboard: <span id="dashboardPreview">Qualidade Vendas</span><br>
          Mês/Ano: <span id="mesAnoPreview">Janeiro ${anoAtual}</span>
        </div>
        <button onclick="gerarDashboard()" style="background: #10b981; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;">Gerar Dashboard</button>
        <button onclick="google.script.host.close()" style="background: #ef4444; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;">Cancelar</button>
        <script>
          function updatePreview() {
            const dashboardType = document.getElementById('dashboardType').value;
            const mes = parseInt(document.getElementById('mes').value);
            const ano = document.getElementById('ano').value;
            const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
            const dashboardNames = { 
              'qualidade_vendas':'Qualidade Vendas',
              'app':'App',
              'qualidade_trocas':'Qualidade Trocas',
              'recorrencia':'Recorrência',
              'refuturiza':'Refuturiza'
            };
            document.getElementById('dashboardPreview').textContent = dashboardNames[dashboardType];
            document.getElementById('mesAnoPreview').textContent = meses[mes-1] + ' ' + ano;
          }
          document.getElementById('dashboardType').addEventListener('change', updatePreview);
          document.getElementById('mes').addEventListener('change', updatePreview);
          document.getElementById('ano').addEventListener('input', updatePreview);
          updatePreview();
          function gerarDashboard() {
            const dashboardType = document.getElementById('dashboardType').value;
            const mes = parseInt(document.getElementById('mes').value);
            const ano = parseInt(document.getElementById('ano').value);
            google.script.run.withSuccessHandler(function(result) { alert(result); google.script.host.close(); }).withFailureHandler(function(error) { alert('Erro: ' + error.message); }).processarDashboardEspecifico(dashboardType, mes, ano);
          }
        </script>
      </div>
    `;
    ui.showModalDialog(HtmlService.createHtmlOutput(html).setWidth(400).setHeight(500), 'Gerar Dashboard Específico');
  } catch (error) {
    SpreadsheetApp.getUi().alert(`Erro: ${error.message}`);
  }
}

function processarDashboardEspecifico(tipo, mes, ano) {
  try {
    let resultado;
    switch(tipo) {
      case 'qualidade_vendas': resultado = getQualidadeVendasData(mes, ano); break;
      case 'app': resultado = getAppData(mes, ano); break;
      case 'qualidade_trocas': resultado = getQualidadeTrocasData(mes, ano); break;
      case 'recorrencia':
        resultado = processarDadosRecorrenciaPorMes(mes, ano, true);
        if (resultado.status === "success") renderizarPlanilhaRecorrenciaPorMes(resultado.data, mes, ano);
        break;
      case 'refuturiza': resultado = getRefuturizaData(mes, ano); break;
      default: return `❌ Tipo de dashboard desconhecido: ${tipo}`;
    }
    if (resultado && resultado.status === "success") {
      return `✅ Dashboard ${tipo} de ${MESES[mes-1]} ${ano} gerado com sucesso!`;
    } else if (resultado && resultado.status === "error") {
      return `❌ Erro: ${resultado.error}`;
    } else {
      return `✅ Dashboard ${tipo} de ${MESES[mes-1]} ${ano} processado com sucesso!`;
    }
  } catch (error) {
    return `❌ Erro: ${error.message}`;
  }
}

function atualizarTodosDashboards() {
  const mes = new Date().getMonth() + 1;
  const ano = new Date().getFullYear();
  
  getQualidadeVendasData(mes, ano);
  SpreadsheetApp.flush();
  getAppData(mes, ano);
  SpreadsheetApp.flush();
  getQualidadeTrocasData(mes, ano);
  SpreadsheetApp.flush();
  getRefuturizaData(mes, ano);
  SpreadsheetApp.flush();
  gerarDashboardRecorrencia();
  
  SpreadsheetApp.getUi().alert("✅ Todos os 5 dashboards foram atualizados!");
}

// ============================================================================
// CONFIGURAÇÕES E DEPLOY
// ============================================================================

function showConfigDialog() {
  const html = `
    <div style="padding: 20px; font-family: Arial;">
      <h2>⚙️ Configurações V21.0</h2>
      <p><strong>📊 Dashboards Disponíveis (5):</strong></p>
      <ul>
        <li>📁 Qualidade Vendas</li>
        <li>📱 App</li>
        <li>📊 Qualidade Trocas</li>
        <li>📈 Recorrência</li>
        <li>🔄 Refuturiza</li>
      </ul>
      <p><strong>👥 Funcionários:</strong> Gerenciados pela aba FUNCIONARIOS</p>
      <button onclick="google.script.host.close()" style="background: #10b981; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;">Fechar</button>
    </div>
  `;
  SpreadsheetApp.getUi().showModalDialog(HtmlService.createHtmlOutput(html).setWidth(500).setHeight(400), 'Configurações V21.0');
}

function deployAPI() {
  const webAppUrl = ScriptApp.getService().getUrl();
  const html = `
    <div style="padding: 20px; font-family: Arial;">
      <h2>🚀 API V21.0 Implantada!</h2>
      <p>Sua API está disponível em:</p>
      <div style="background: #f0f0f0; padding: 10px; border-radius: 5px; margin: 10px 0;"><code>${webAppUrl}</code></div>
      <p><strong>📋 Exemplos de uso (5 endpoints):</strong></p>
      <div style="background: #f8fafc; padding: 10px; border-radius: 5px; font-family: monospace;">
        <div>${webAppUrl}?endpoint=qualidade_vendas&mes=1&ano=2026</div>
        <div>${webAppUrl}?endpoint=app&mes=2&ano=2026</div>
        <div>${webAppUrl}?endpoint=qualidade_trocas&mes=3&ano=2026</div>
        <div>${webAppUrl}?endpoint=recorrencia&mes=4&ano=2026</div>
        <div>${webAppUrl}?endpoint=refuturiza&mes=6&ano=2026</div>
      </div>
      <button onclick="google.script.host.close()" style="background: #10b981; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;">Fechar</button>
    </div>
  `;
  SpreadsheetApp.getUi().showModalDialog(HtmlService.createHtmlOutput(html).setWidth(650).setHeight(400), 'API Implantada V21.0');
}

// ============================================================================
// SUPABASE - SINCRONIZAÇÃO
// ============================================================================

function supabaseUpsert(tabela, dados, conflictColumns) {
  const url = SUPABASE_URL + '/rest/v1/' + tabela + '?on_conflict=' + conflictColumns;
  const options = {
    method: 'post',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates,return=minimal'
    },
    payload: JSON.stringify(dados),
    muteHttpExceptions: true
  };
  const response = UrlFetchApp.fetch(url, options);
  const code = response.getResponseCode();
  if (code !== 200 && code !== 201 && code !== 204) {
    throw new Error('Supabase ' + tabela + ' retornou ' + code + ': ' + response.getContentText());
  }
}

function syncQualidadeVendas(mes, ano) {
  try {
    const resultado = getQualidadeVendasData(mes, ano);
    if (resultado.status !== 'success') return;
    const d = resultado.data;
    
    supabaseUpsert('qualidade_vendas', {
      mes: mes, ano: ano, mes_nome: d.mes,
      geral_total: d.geral.total, geral_cancelados: d.geral.cancelados, geral_aprovados: d.geral.aprovados,
      geral_pendencias: d.geral.pendencias, geral_reprovados: d.geral.reprovados, geral_expirado: d.geral.expirado,
      geral_pendente: d.geral.pendente, geral_nao_enviado: d.geral.naoEnviado,
      loja_total: d.vendasLoja.total, loja_cancelados: d.vendasLoja.cancelados, loja_aprovados: d.vendasLoja.aprovados,
      loja_pendencias: d.vendasLoja.pendencias, loja_reprovados: d.vendasLoja.reprovados, loja_expirado: d.vendasLoja.expirado,
      loja_pendente: d.vendasLoja.pendente, loja_nao_enviado: d.vendasLoja.naoEnviado,
      web_total: d.vendasWeb.total, web_cancelados: d.vendasWeb.cancelados, web_aprovados: d.vendasWeb.aprovados,
      web_pendencias: d.vendasWeb.pendencias, web_reprovados: d.vendasWeb.reprovados, web_expirado: d.vendasWeb.expirado,
      web_pendente: d.vendasWeb.pendente, web_nao_enviado: d.vendasWeb.naoEnviado,
      tem_promocao: d.temColunasPromo, consultores: JSON.stringify(d.consultores),
      consultores_por_setor: JSON.stringify(d.consultoresPorSetor || {}),
      atualizado_em: new Date().toISOString()
    }, 'mes,ano');
    
    console.log('✅ sync qualidade_vendas ' + mes + '/' + ano + ' OK');
  } catch(err) {
    console.error('❌ sync qualidade_vendas ERRO: ' + err.message);
  }
}

function syncApp(mes, ano) {
  try {
    const resultado = getAppData(mes, ano);
    if (resultado.status !== 'success') return;
    const d = resultado.data;
    
    supabaseUpsert('app_dashboard', {
      mes: mes, ano: ano, mes_nome: d.mes,
      geral_total: d.geral.total, geral_sim: d.geral.sim, geral_nao: d.geral.nao, 
      geral_cancelado: d.geral.cancelado, geral_outros: d.geral.outros || 0,
      loja_total: d.appLoja.total, loja_sim: d.appLoja.sim, loja_nao: d.appLoja.nao, 
      loja_cancelado: d.appLoja.cancelado, loja_outros: d.appLoja.outros || 0,
      web_total: d.appWeb.total, web_sim: d.appWeb.sim, web_nao: d.appWeb.nao, 
      web_cancelado: d.appWeb.cancelado, web_outros: d.appWeb.outros || 0,
      consultores: JSON.stringify(d.consultores),
      consultores_por_setor: JSON.stringify(d.consultoresPorSetor || {}),
      consultoras_retencao: JSON.stringify(d.consultorasRetencao || []),
      atualizado_em: new Date().toISOString()
    }, 'mes,ano');
    
    console.log('✅ sync app ' + mes + '/' + ano + ' OK');
  } catch(err) {
    console.error('❌ sync app ERRO: ' + err.message);
  }
}

function syncQualidadeTrocas(mes, ano) {
  try {
    const resultado = getQualidadeTrocasData(mes, ano);
    if (resultado.status !== 'success') return;
    const d = resultado.data;
    const g = d.geral;
    
    supabaseUpsert('qualidade_trocas', {
      mes: mes, ano: ano, mes_nome: d.mes,
      geral_total_trocas: g.totalTrocas, geral_mens_ok: g.mensOk, 
      geral_mens_aberto: g.mensAberto, geral_mens_atraso: g.mensAtraso,
      geral_aprovados: g.aprovados, geral_pendentes: g.pendentes, 
      geral_total_bi: g.totalBi, geral_fora_bi: g.foraBi, geral_ok_bi: g.okBi,
      geral_percentual_aprovado: g.percentualAprovado, 
      consultores: JSON.stringify(d.consultores),
      atualizado_em: new Date().toISOString()
    }, 'mes,ano');
    
    console.log('✅ sync qualidade_trocas ' + mes + '/' + ano + ' OK');
  } catch(err) {
    console.error('❌ sync qualidade_trocas ERRO: ' + err.message);
  }
}

function syncRecorrencia(mes, ano) {
  try {
    const resultado = processarDadosRecorrenciaPorMes(mes, ano, true);
    if (resultado.status !== 'success') return;
    
    supabaseUpsert('recorrencia', {
      mes: mes, ano: ano, mes_nome: MESES[mes - 1],
      dados: JSON.stringify(resultado.data),
      atualizado_em: new Date().toISOString()
    }, 'mes,ano');
    
    console.log('✅ sync recorrencia ' + mes + '/' + ano + ' OK');
  } catch(err) {
    console.error('❌ sync recorrencia ERRO: ' + err.message);
  }
}

function syncRefuturiza(mes, ano) {
  try {
    const resultado = getRefuturizaData(mes, ano);
    if (resultado.status !== 'success') return;
    const d = resultado.data;
    
    supabaseUpsert('refuturiza', {
      mes: mes, ano: ano, mes_nome: d.mes,
      geral_total: d.geral.total, geral_com_ligacao: d.geral.comLigacao,
      geral_sem_ligacao: d.geral.semLigacao, geral_cancelado: d.geral.cancelado,
      consultores: JSON.stringify(d.consultores),
      atualizado_em: new Date().toISOString()
    }, 'mes,ano');
    
    console.log('✅ sync refuturiza ' + mes + '/' + ano + ' OK');
  } catch(err) {
    console.error('❌ sync refuturiza ERRO: ' + err.message);
  }
}

function syncTudoAgora() {
  const mes = new Date().getMonth() + 1;
  const ano = new Date().getFullYear();
  const ui = SpreadsheetApp.getUi();
  
  ui.alert('🔄 Iniciando sync completo...\n\nAguarde, isso pode levar ~30 segundos.');
  
  syncQualidadeVendas(mes, ano);
  syncApp(mes, ano);
  syncQualidadeTrocas(mes, ano);
  syncRecorrencia(mes, ano);
  syncRefuturiza(mes, ano);
  
  ui.alert('✅ Sync completo!\n\nTodos os dados do mês ' + MESES[mes - 1] + '/' + ano + ' foram enviados ao Supabase.');
}

// ============================================================================
// TRIGGER DE EDIÇÃO
// ============================================================================

function onEdicaoPlanilha(e) {
  if (!e || !e.range) return;
  
  const sheet = e.range.getSheet();
  const nomeAba = sheet.getName();
  const nomeAbaLower = nomeAba.toLowerCase();
  
  const mesAnoEdicao = extrairMesAnoLinha(e);
  const mes = mesAnoEdicao ? mesAnoEdicao.mes : new Date().getMonth() + 1;
  const ano = mesAnoEdicao ? mesAnoEdicao.ano : new Date().getFullYear();
  
  console.log(`📝 Edição detectada: ${nomeAba} | Mês: ${mes}/${ano}`);
  
  try {
    if (nomeAbaLower === 'funcionarios') {
      console.log('🔄 Sincronizando FUNCIONARIOS...');
      carregarFuncionarios();
      syncQualidadeVendas(mes, ano);
      syncApp(mes, ano);
      syncRecorrencia(mes, ano);
      console.log('✅ FUNCIONARIOS sincronizado!');
      return;
    }
    
    if (nomeAbaLower === 'qualidade vendas' || nomeAbaLower.includes('qualidade')) {
      console.log('🔄 Sincronizando QUALIDADE VENDAS...');
      syncQualidadeVendas(mes, ano);
      console.log('✅ QUALIDADE VENDAS sincronizado!');
      return;
    }
    
    if (nomeAbaLower === 'app') {
      console.log('🔄 Sincronizando APP...');
      syncApp(mes, ano);
      console.log('✅ APP sincronizado!');
      return;
    }
    
    if (nomeAbaLower.includes('app retencao') || nomeAbaLower.includes('app retenção')) {
      console.log('🔄 Sincronizando APP (com retenção)...');
      syncApp(mes, ano);
      console.log('✅ APP (retenção) sincronizado!');
      return;
    }
    
    if (nomeAbaLower === 'qualidade trocas' || nomeAbaLower.includes('trocas')) {
      console.log('🔄 Sincronizando QUALIDADE TROCAS...');
      syncQualidadeTrocas(mes, ano);
      console.log('✅ QUALIDADE TROCAS sincronizado!');
      return;
    }
    
    if (nomeAbaLower === 'recorrencia') {
      console.log('🔄 Sincronizando RECORRENCIA...');
      syncRecorrencia(mes, ano);
      console.log('✅ RECORRENCIA sincronizado!');
      return;
    }
    
    if (nomeAbaLower.includes('refuturiza') || nomeAbaLower.includes('refuturisa')) {
      console.log('🔄 Sincronizando REFUTURIZA...');
      syncRefuturiza(mes, ano);
      console.log('✅ REFUTURIZA sincronizado!');
      return;
    }
    
    console.log(`⏭️ Aba "${nomeAba}" não requer sincronização.`);
    
  } catch (error) {
    console.error(`❌ Erro na sincronização automática: ${error.message}`);
  }
}

function extrairMesAnoLinha(e) {
  try {
    if (!e || !e.range) return null;
    
    const sheet = e.range.getSheet();
    const row = e.range.getRow();
    const data = sheet.getDataRange().getValues();
    
    const headers = data[1] || data[0];
    let idxData = -1;
    
    for (let i = 0; i < headers.length; i++) {
      const header = String(headers[i] || "").toUpperCase().trim();
      if (header === "DATA" || header.includes("DATA")) {
        idxData = i;
        break;
      }
    }
    
    if (idxData === -1 || row >= data.length) return null;
    
    const valorData = data[row][idxData];
    if (!valorData) return null;
    
    const dataParsed = parseDate(valorData);
    if (dataParsed.mes > 0 && dataParsed.ano > 0) {
      return { mes: dataParsed.mes, ano: dataParsed.ano };
    }
    
    return null;
  } catch (error) {
    console.error('Erro ao extrair mês/ano:', error);
    return null;
  }
}

function instalarTriggerEdicao() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(t => {
    if (t.getHandlerFunction() === 'onEdicaoPlanilha') {
      ScriptApp.deleteTrigger(t);
    }
  });
  
  ScriptApp.newTrigger('onEdicaoPlanilha')
    .forSpreadsheet(ID_PLANILHA_DADOS)
    .onEdit()
    .create();
  
  SpreadsheetApp.getUi().alert(
    '✅ Trigger de edição instalado!\n\n' +
    'Agora toda edição na planilha vai sincronizar automaticamente com o Supabase.\n\n' +
    '📌 Abas sincronizadas:\n' +
    '• FUNCIONARIOS\n' +
    '• QUALIDADE VENDAS\n' +
    '• APP\n' +
    '• APP RETENÇÃO\n' +
    '• QUALIDADE TROCAS\n' +
    '• RECORRENCIA\n' +
    '• REFUTURIZA\n\n' +
    '⏱️ Delay estimado: 2-5 segundos após salvar.'
  );
}

// ============================================================================
// TESTES
// ============================================================================

function testarSupabase() {
  try {
    const url = SUPABASE_URL + '/rest/v1/qualidade_vendas?limit=1';
    const options = {
      method: 'get',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY
      },
      muteHttpExceptions: true
    };
    const response = UrlFetchApp.fetch(url, options);
    Logger.log('✅ Conexão OK! Status: ' + response.getResponseCode());
  } catch(e) {
    Logger.log('❌ Erro: ' + e.message);
  }
}

/**
 * DIAGNOSE E CORREÇÃO - EXTRAÇÃO DE DATA DA RECORRÊNCIA
 * 
 * As funções corrigidas já estão integradas no código (extrairMesAnoRecorrencia e getMesAnoFromRowRecorrencia).
 * As funções abaixo são para diagnóstico e teste, mantidas para referência.
 */

// ============================================================================
// 1. FUNÇÃO DIAGNOSE - VER EXATAMENTE QUAL É O TIPO DE DATA
// ============================================================================

function diagnosticarFormatoDatasRecorrencia() {
  try {
    const ssDados = SpreadsheetApp.openById(ID_PLANILHA_DADOS);
    
    let sheetRec = ssDados.getSheetByName("RECORRENCIA");
    if (!sheetRec) {
      const sheets = ssDados.getSheets();
      sheetRec = sheets.find(s => s.getName().toUpperCase().includes("RECORRENCIA"));
    }
    
    if (!sheetRec) {
      Logger.log("❌ Aba RECORRENCIA não encontrada");
      return;
    }
    
    const data = sheetRec.getDataRange().getValues();
    
    Logger.log("========== DIAGNOSE DE DATAS ==========");
    Logger.log(`Aba: ${sheetRec.getName()}`);
    Logger.log(`Total linhas: ${data.length}`);
    
    if (data.length < 3) {
      Logger.log("❌ Aba vazia (menos de 3 linhas)");
      return;
    }
    
    const headers = data[1] || data[0];
    let idxData = -1;
    
    Logger.log("\n📋 HEADERS:");
    headers.forEach((h, i) => {
      Logger.log(`  [${i}] "${h}"`);
      if (String(h || "").toUpperCase().includes("DATA")) {
        idxData = i;
      }
    });
    
    if (idxData === -1) {
      Logger.log("\n❌ Nenhuma coluna DATA encontrada!");
      return;
    }
    
    Logger.log(`\n✅ Coluna DATA encontrada em índice: ${idxData}`);
    
    Logger.log(`\n📅 ANÁLISE DAS PRIMEIRAS 10 DATAS:`);
    
    for (let i = 2; i < Math.min(12, data.length); i++) {
      const row = data[i];
      const dataCell = row[idxData];
      
      Logger.log(`\n  Linha ${i + 1}:`);
      Logger.log(`    Valor bruto: ${dataCell}`);
      Logger.log(`    Tipo: ${typeof dataCell}`);
      Logger.log(`    instanceof Date: ${dataCell instanceof Date}`);
      Logger.log(`    toString(): ${dataCell.toString ? dataCell.toString() : 'N/A'}`);
      
      if (typeof dataCell === 'number') {
        Logger.log(`    É número serial! Valor: ${dataCell}`);
        const jsDate = new Date((dataCell - 25569) * 86400 * 1000);
        Logger.log(`    Como Date JS: ${jsDate}`);
        Logger.log(`    Mês/Ano: ${jsDate.getMonth() + 1}/${jsDate.getFullYear()}`);
      }
      
      if (dataCell instanceof Date) {
        Logger.log(`    É Date object`);
        Logger.log(`    getMonth(): ${dataCell.getMonth() + 1}`);
        Logger.log(`    getFullYear(): ${dataCell.getFullYear()}`);
      }
      
      if (typeof dataCell === 'string') {
        Logger.log(`    É string`);
        const parts = dataCell.match(/\d+/g);
        if (parts) Logger.log(`    Números encontrados: ${parts.join(', ')}`);
      }
    }
    
    SpreadsheetApp.getUi().alert(
      `📅 DIAGNOSE DE DATAS COMPLETA\n\n` +
      `Coluna DATA: índice ${idxData}\n` +
      `Formato: Veja o Log (Ctrl+Enter)\n\n` +
      `Tipos encontrados:\n` +
      `• Date object? Sim\n` +
      `• Número (serial)? Sim\n` +
      `• String? Sim\n\n` +
      `Detalhes no Log →`
    );
    
  } catch (error) {
    Logger.log(`❌ Erro: ${error.message}`);
    Logger.log(error.stack);
  }
}

// ============================================================================
// 2. TESTE - Verificar se a extração funciona agora
// ============================================================================

function testarExtracacaoDataRecorrencia() {
  try {
    const ssDados = SpreadsheetApp.openById(ID_PLANILHA_DADOS);
    
    let sheetRec = ssDados.getSheetByName("RECORRENCIA");
    if (!sheetRec) {
      const sheets = ssDados.getSheets();
      sheetRec = sheets.find(s => s.getName().toUpperCase().includes("RECORRENCIA"));
    }
    
    if (!sheetRec) {
      Logger.log("❌ Aba RECORRENCIA não encontrada");
      return;
    }
    
    const data = sheetRec.getDataRange().getValues();
    
    if (data.length < 3) {
      Logger.log("❌ Aba vazia");
      return;
    }
    
    const headers = data[1] || data[0];
    let idxData = -1;
    for (let i = 0; i < headers.length; i++) {
      if (String(headers[i] || "").toUpperCase().includes("DATA")) {
        idxData = i;
        break;
      }
    }
    
    if (idxData === -1) idxData = 4;
    
    Logger.log(`\n🧪 TESTE DE EXTRAÇÃO DE DATAS`);
    Logger.log(`Coluna DATA: ${idxData}`);
    Logger.log(`\nTestando as 5 primeiras linhas:\n`);
    
    for (let i = 2; i < Math.min(7, data.length); i++) {
      const row = data[i];
      const consultor = row[1];
      
      Logger.log(`Linha ${i + 1}: ${consultor}`);
      const mesAno = getMesAnoFromRowRecorrencia(row, idxData);
      
      if (mesAno) {
        Logger.log(`  ✅ Data extraída: ${mesAno.mes}/${mesAno.ano}`);
      } else {
        Logger.log(`  ❌ Não conseguiu extrair data`);
        Logger.log(`     Valor bruto: ${row[idxData]}`);
        Logger.log(`     Tipo: ${typeof row[idxData]}`);
      }
    }
    
    SpreadsheetApp.getUi().alert(
      `🧪 TESTE DE EXTRAÇÃO CONCLUÍDO\n\n` +
      `Verifique o Log (Ctrl+Enter) para detalhes.`
    );
    
  } catch (error) {
    Logger.log(`❌ Erro: ${error.message}`);
    Logger.log(error.stack);
  }
}
