// ============================================================================
// DASHBOARD V21.1 - app.js — COM SUPABASE (CORRIGIDO)
// ============================================================================

const API_URL = 'https://script.google.com/macros/s/AKfycbwSJZCrAVjQpiXLnt-oAg0T6S8ehPoEyYoOhDRcl-5EbhcXW52xIfeQfLWw7tW5WGFilg/exec';

const SUPABASE_URL  = 'https://ddxhnoiqxtbfdrwhhcab.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkeGhub2lxeHRiZmRyd2hoY2FiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ5MjUyMjcsImV4cCI6MjEwMDUwMTIyN30.NBISCHsDQiDTkysd6TSxiU67kcM4Aspk01lD05rbtUM';

const C = {
    green:'#00a651', greenFade:'rgba(0,166,81,0.12)',
    lime:'#7ed321',  teal:'#0d9488',
    warn:'#f59e0b',  warnFade:'rgba(245,158,11,0.12)',
    danger:'#ef4444',gray:'#6b8072', border:'#d1e8d9',
};

const RANKING_SETORES = ['VENDAS','RECEPCAO','REFILIACAO'];
const SEM_FILTRO = ['recorrencia'];

// ── Cache ──────────────────────────────────────────────────────────────────
const CACHE_MEM  = new Map();
const CACHE_TTL  = 30 * 60 * 1000;
const LS_PREFIX  = 'cdt_dash_';

function cacheKey(ep,m,y){ return SEM_FILTRO.includes(ep)?ep:`${ep}:${m}:${y}`; }

function getCached(k){
    const mem = CACHE_MEM.get(k);
    if(mem && Date.now()-mem.ts < CACHE_TTL) return mem.data;
    try{
        const raw = localStorage.getItem(LS_PREFIX+k);
        if(raw){
            const entry = JSON.parse(raw);
            if(Date.now()-entry.ts < CACHE_TTL){
                CACHE_MEM.set(k,{data:entry.data,ts:entry.ts});
                return entry.data;
            }
            localStorage.removeItem(LS_PREFIX+k);
        }
    }catch(_){}
    return null;
}

function setCache(k,d){
    const entry = {data:d, ts:Date.now()};
    CACHE_MEM.set(k, entry);
    try{ localStorage.setItem(LS_PREFIX+k, JSON.stringify(entry)); }catch(_){}
}

function invalidateCache(k){
    CACHE_MEM.delete(k);
    try{ localStorage.removeItem(LS_PREFIX+k); }catch(_){}
}

// ============================================================================
// CAMADA DE DADOS
// ============================================================================

const SUPABASE_TABLES = {
    'documentacao': 'qualidade_vendas',
    'app': 'app_dashboard',
    'adimplencia': 'qualidade_trocas',
    'recorrencia': 'recorrência',
    'refuturiza': 'refuturiza'
};

// ============================================================================
// fetchSupabase
// ============================================================================

async function fetchSupabase(endpoint, mes, ano) {
    if (endpoint === 'campanha14' || endpoint === 'recorrencia_vendedor') return null;

    const tabela = SUPABASE_TABLES[endpoint];
    if (!tabela) {
        console.warn(`[Supabase] Tabela não mapeada para endpoint: ${endpoint}`);
        return null;
    }

    try {
        let url;
        const headers = {
            'apikey': SUPABASE_ANON,
            'Authorization': `Bearer ${SUPABASE_ANON}`
        };

        if (endpoint === 'recorrencia') {
            url = `${SUPABASE_URL}/rest/v1/${tabela}?select=*&limit=1`;
        } else {
            url = `${SUPABASE_URL}/rest/v1/${tabela}?mes=eq.${mes}&ano=eq.${ano}&select=*`;
        }

        console.log(`[Supabase] Buscando ${tabela} (${mes}/${ano})`);
        const resp = await fetch(url, { headers });
        
        if (!resp.ok) {
            console.warn(`[Supabase] HTTP ${resp.status} para ${tabela}`);
            return null;
        }
        
        const rows = await resp.json();
        if (!rows || rows.length === 0) {
            console.warn(`[Supabase] Nenhum dado encontrado para ${tabela}`);
            return null;
        }

        return rowToData(endpoint, rows[0]);
    } catch(err) {
        console.error(`[Supabase] Erro em ${tabela}:`, err);
        return null;
    }
}

// ============================================================================
// rowToData — CORRIGIDO: calcula totais a partir dos consultores
// ============================================================================

function rowToData(endpoint, row) {
    if (!row) return null;

    // --- qualidade_vendas ---
    if (endpoint === 'documentacao') {
        let consultores = row.consultores || [];
        if (typeof consultores === 'string') {
            try { consultores = JSON.parse(consultores); } catch(e) { consultores = []; }
        }
        
        // Mapeia o setor
        consultores = consultores.map(c => ({
            ...c,
            setor: (c.setorExibicao || c.setorOriginal || c.setor || 'OUTROS').toUpperCase()
        }));

        // 🔥 CALCULA os totais a partir dos consultores
        const totalCalc = consultores.reduce((sum, c) => sum + (c.total || 0), 0);
        const aprovadosCalc = consultores.reduce((sum, c) => sum + (c.aprovados || 0), 0);
        const canceladosCalc = consultores.reduce((sum, c) => sum + (c.cancelados || 0), 0);
        const pendenciasCalc = consultores.reduce((sum, c) => sum + (c.pendencias || 0), 0);

        // Usa o valor do Supabase se tiver, senão usa o calculado
        const geralTotal = (row.geral?.total || 0) > 0 ? row.geral.total : totalCalc;
        const geralAprovados = (row.geral?.aprovados || 0) > 0 ? row.geral.aprovados : aprovadosCalc;
        const geralCancelados = (row.geral?.cancelados || 0) > 0 ? row.geral.cancelados : canceladosCalc;
        const geralPendencias = (row.geral?.pendencias || 0) > 0 ? row.geral.pendencias : pendenciasCalc;

        console.log('📊 Total do Supabase:', row.geral?.total);
        console.log('📊 Total calculado dos consultores:', totalCalc);
        console.log('📊 Usando valor final:', geralTotal);

        return {
            mes: row.mes || 'Julho',
            ano: row.ano || 2026,
            temColunasPromo: row.temColunasPromo || false,
            geral: {
                total: geralTotal,
                cancelados: geralCancelados,
                aprovados: geralAprovados,
                pendencias: geralPendencias,
                reprovados: row.geral?.reprovados || 0,
                expirado: row.geral?.expirado || 0,
                pendente: row.geral?.pendente || 0,
                naoEnviado: row.geral?.naoEnviado || 0,
                promo: row.geral?.promo || {total:0, cancelados:0, aprovados:0, reprovados:0, expirado:0, pendente:0, naoEnviado:0},
                normal: row.geral?.normal || {total:0, cancelados:0, aprovados:0, reprovados:0, expirado:0, pendente:0, naoEnviado:0}
            },
            vendasLoja: {
                total: (row.vendasLoja?.total || 0) > 0 ? row.vendasLoja.total : totalCalc,
                cancelados: (row.vendasLoja?.cancelados || 0) > 0 ? row.vendasLoja.cancelados : canceladosCalc,
                aprovados: (row.vendasLoja?.aprovados || 0) > 0 ? row.vendasLoja.aprovados : aprovadosCalc,
                pendencias: (row.vendasLoja?.pendencias || 0) > 0 ? row.vendasLoja.pendencias : pendenciasCalc,
                reprovados: row.vendasLoja?.reprovados || 0,
                expirado: row.vendasLoja?.expirado || 0,
                pendente: row.vendasLoja?.pendente || 0,
                naoEnviado: row.vendasLoja?.naoEnviado || 0,
                promo: row.vendasLoja?.promo || {total:0, cancelados:0, aprovados:0, reprovados:0, expirado:0, pendente:0, naoEnviado:0},
                normal: row.vendasLoja?.normal || {total:0, cancelados:0, aprovados:0, reprovados:0, expirado:0, pendente:0, naoEnviado:0}
            },
            vendasWeb: {
                total: row.vendasWeb?.total || 0,
                cancelados: row.vendasWeb?.cancelados || 0,
                aprovados: row.vendasWeb?.aprovados || 0,
                pendencias: row.vendasWeb?.pendencias || 0,
                reprovados: row.vendasWeb?.reprovados || 0,
                expirado: row.vendasWeb?.expirado || 0,
                pendente: row.vendasWeb?.pendente || 0,
                naoEnviado: row.vendasWeb?.naoEnviado || 0,
                promo: row.vendasWeb?.promo || {total:0, cancelados:0, aprovados:0, reprovados:0, expirado:0, pendente:0, naoEnviado:0},
                normal: row.vendasWeb?.normal || {total:0, cancelados:0, aprovados:0, reprovados:0, expirado:0, pendente:0, naoEnviado:0}
            },
            consultores: consultores,
            consultoresPorSetor: row.consultoresPorSetor || {},
            totalFuncionariosAtivos: row.totalFuncionariosAtivos || 0
        };
    }

    // --- app_dashboard ---
    if (endpoint === 'app') {
        let consultores = row.consultores || [];
        if (typeof consultores === 'string') {
            try { consultores = JSON.parse(consultores); } catch(e) { consultores = []; }
        }
        consultores = consultores.map(c => ({
            ...c,
            setor: (c.setorExibicao || c.setorOriginal || c.setor || 'OUTROS').toUpperCase()
        }));
        
        const totalCalc = consultores.reduce((sum, c) => sum + (c.total || 0), 0);
        const simCalc = consultores.reduce((sum, c) => sum + (c.sim || 0), 0);
        
        return {
            mes: row.mes || 'Julho',
            ano: row.ano || 2026,
            geral: { 
                total: (row.geral?.total || 0) > 0 ? row.geral.total : totalCalc,
                sim: (row.geral?.sim || 0) > 0 ? row.geral.sim : simCalc,
                nao: row.geral?.nao || 0,
                cancelado: row.geral?.cancelado || 0,
                outros: row.geral?.outros || 0
            },
            appLoja: { 
                total: row.appLoja?.total || row.loja_total || 0,
                sim: row.appLoja?.sim || row.loja_sim || 0,
                nao: row.appLoja?.nao || row.loja_nao || 0,
                cancelado: row.appLoja?.cancelado || row.loja_cancelado || 0,
                outros: row.appLoja?.outros || row.loja_outros || 0
            },
            appWeb: { 
                total: row.appWeb?.total || row.web_total || 0,
                sim: row.appWeb?.sim || row.web_sim || 0,
                nao: row.appWeb?.nao || row.web_nao || 0,
                cancelado: row.appWeb?.cancelado || row.web_cancelado || 0,
                outros: row.appWeb?.outros || row.web_outros || 0
            },
            consultores: consultores,
            consultorasRetencao: row.consultoras_retencao || []
        };
    }

    // --- qualidade_trocas ---
    if (endpoint === 'adimplencia') {
        let consultores = row.consultores || [];
        if (typeof consultores === 'string') {
            try { consultores = JSON.parse(consultores); } catch(e) { consultores = []; }
        }
        consultores = consultores.map(c => ({
            ...c,
            setor: (c.setorExibicao || c.setorOriginal || c.setor || 'OUTROS').toUpperCase()
        }));
        
        const totalTrocasCalc = consultores.reduce((sum, c) => sum + (c.totalTrocas || 0), 0);
        
        return {
            mes: row.mes || 'Julho',
            ano: row.ano || 2026,
            geral: { 
                totalTrocas: (row.geral?.totalTrocas || 0) > 0 ? row.geral.totalTrocas : totalTrocasCalc,
                mensOk: row.geral?.mensOk || row.geral_mens_ok || 0,
                mensAberto: row.geral?.mensAberto || row.geral_mens_aberto || 0,
                mensAtraso: row.geral?.mensAtraso || row.geral_mens_atraso || 0,
                aprovados: row.geral?.aprovados || row.geral_aprovados || 0,
                pendentes: row.geral?.pendentes || row.geral_pendentes || 0,
                totalBi: row.geral?.totalBi || row.geral_total_bi || 0,
                foraBi: row.geral?.foraBi || row.geral_fora_bi || 0,
                okBi: row.geral?.okBi || row.geral_ok_bi || 0,
                percentualAprovado: row.geral?.percentualAprovado || row.geral_percentual_aprovado || 0
            },
            consultores: consultores
        };
    }

    // --- recorrência ---
    if (endpoint === 'recorrencia') {
        return typeof row.dados === 'string' ? JSON.parse(row.dados) : (row.dados || {});
    }

    // --- refuturiza ---
    if (endpoint === 'refuturiza') {
        let consultores = row.consultores || [];
        if (typeof consultores === 'string') {
            try { consultores = JSON.parse(consultores); } catch(e) { consultores = []; }
        }
        consultores = consultores.map(c => ({
            ...c,
            setor: (c.setorExibicao || c.setorOriginal || c.setor || 'OUTROS').toUpperCase()
        }));
        
        const totalCalc = consultores.reduce((sum, c) => sum + (c.total || 0), 0);
        
        return {
            mes: row.mes || 'Julho',
            ano: row.ano || 2026,
            geral: { 
                total: (row.geral?.total || 0) > 0 ? row.geral.total : totalCalc,
                comLigacao: row.geral?.comLigacao || row.geral_com_ligacao || 0,
                semLigacao: row.geral?.semLigacao || row.geral_sem_ligacao || 0,
                cancelado: row.geral?.cancelado || row.geral_cancelado || 0
            },
            consultores: consultores
        };
    }

    return null;
}

// ============================================================================
// fetchData
// ============================================================================

async function fetchData(endpoint, mes, ano) {
    const dadosSupabase = await fetchSupabase(endpoint, mes, ano);
    if (dadosSupabase) {
        console.log(`[${endpoint}] Dados obtidos do Supabase`);
        return { status: 'success', data: dadosSupabase, fonte: 'supabase' };
    }

    console.log(`[${endpoint}] Fallback para Apps Script`);
    const url = buildUrl(endpoint, mes, ano);
    try {
        const resp = await fetch(url);
        if (!resp.ok) {
            console.warn(`[Apps Script] HTTP ${resp.status} para endpoint "${endpoint}"`);
            return {
                status: 'error',
                error: `Servidor retornou erro ${resp.status}.`
            };
        }
        const json = await resp.json();
        if (json.status === 'success') json.fonte = 'appscript';
        return json;
    } catch (err) {
        const isOffline = !navigator.onLine || err instanceof TypeError;
        console.error(`[Apps Script] Falha no endpoint "${endpoint}":`, err);
        return {
            status: 'error',
            error: isOffline ? 'Sem conexão com a internet.' : 'Não foi possível conectar ao servidor.'
        };
    }
}

// ============================================================================
// buildUrl
// ============================================================================

function buildUrl(ep, m, y) {
    const endpointMap = {
        'documentacao': 'qualidade_vendas',
        'app': 'app_dashboard',
        'adimplencia': 'qualidade_trocas'
    };
    const endpointReal = endpointMap[ep] || ep;
    let u = `${API_URL}?endpoint=${endpointReal}`;
    if (!SEM_FILTRO.includes(ep)) u += `&mes=${m}&ano=${y}`;
    return u;
}

// ── Auto-refresh ──────────────────────────────────────────────────
setInterval(() => {
    const k = cacheKey(currentDashboard, currentMonth, currentYear);
    invalidateCache(k);
    silentRefresh();
}, CACHE_TTL);

async function silentRefresh(){
    try{
        if(currentDashboard === 'resumo'){
            const eps = ['documentacao','app','adimplencia'];
            const results = {};
            await Promise.all(eps.map(async ep => {
                const k = cacheKey(ep, currentMonth, currentYear);
                const r = await fetchData(ep, currentMonth, currentYear);
                if(r.status==='success'){ setCache(k,r.data); results[ep]=r.data; }
            }));
            if(results['documentacao']) renderResumoDashboard(results['documentacao'], results['app'], results['adimplencia']);
        } else {
            const k = cacheKey(currentDashboard, currentMonth, currentYear);
            const r = await fetchData(currentDashboard, currentMonth, currentYear);
            if(r.status==='success'){ setCache(k,r.data); window._dashboardData=r.data; renderDashboard(); }
        }
        updateLastUpdateTime();
    }catch(_){}
}

function destroyChart(id){ if(chartInstances[id]){chartInstances[id].destroy();delete chartInstances[id];} }
function createChart(id,cfg){ destroyChart(id); const ctx=document.getElementById(id); if(!ctx)return; chartInstances[id]=new Chart(ctx,cfg); }

let currentDashboard = 'resumo';
let currentMonth     = new Date().getMonth() + 1;
let currentYear      = new Date().getFullYear();
const chartInstances = {};

let dashboardBtns, monthSelect, yearSelect, dashboardContent,
    refreshBtn, downloadBtn, loadingEl, lastUpdateEl, periodSelector;

// ============================================================================
// INIT
// ============================================================================

document.addEventListener('DOMContentLoaded', function(){
    Chart.defaults.font.family="'Plus Jakarta Sans', sans-serif";
    Chart.defaults.font.size=12; Chart.defaults.color='#5a7a65';

    dashboardBtns    = document.querySelectorAll('.sidebar-btn');
    monthSelect      = document.getElementById('monthSelect');
    yearSelect       = document.getElementById('yearSelect');
    dashboardContent = document.getElementById('dashboardContent');
    refreshBtn       = document.getElementById('refreshBtn');
    downloadBtn      = document.getElementById('downloadBtn');
    loadingEl        = document.getElementById('loading');
    lastUpdateEl     = document.getElementById('lastUpdate');
    periodSelector   = document.getElementById('periodSelector');

    const anoAtual = new Date().getFullYear();
    for(let y = anoAtual; y >= anoAtual - 3; y--){
        const opt = document.createElement('option');
        opt.value = y; opt.textContent = y;
        yearSelect.appendChild(opt);
    }
    monthSelect.value = currentMonth;
    yearSelect.value  = currentYear;

    const topbarTitle = document.getElementById('topbarTitle');
    const TITLES = {
        resumo: 'Resumo Geral', 
        documentacao: 'Vendas',
        app: 'App', 
        adimplencia: 'Trocas', 
        recorrencia: 'Recorrência',
        refuturiza: 'Refuturiza'
    };

    dashboardBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            dashboardBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentDashboard = btn.dataset.dashboard;
            if(topbarTitle) topbarTitle.textContent = TITLES[currentDashboard] || currentDashboard;

            if(periodSelector){
                periodSelector.style.display = SEM_FILTRO.includes(currentDashboard) ? 'none' : 'flex';
            }

            closeSidebarMobile();
            if (window.updateFabVisibility) window.updateFabVisibility();
            loadDashboard();
        });
    });

    monthSelect.addEventListener('change', () => { currentMonth = parseInt(monthSelect.value); loadDashboard(); });
    yearSelect.addEventListener('change',  () => { currentYear  = parseInt(yearSelect.value);  loadDashboard(); });
    refreshBtn.addEventListener('click',   () => { invalidateCache(cacheKey(currentDashboard, currentMonth, currentYear)); loadDashboard(); });
    downloadBtn.addEventListener('click',  exportPage);

    const sidebar        = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const sidebarToggle  = document.getElementById('sidebarToggle');
    const collapseBtn    = document.getElementById('collapseBtn');
    const collapseIcon   = document.getElementById('collapseIcon');

    const COLLAPSE_KEY = 'sidebar_collapsed';

    function setSidebarCollapsed(collapsed) {
        if (collapsed) {
            sidebar.classList.add('collapsed');
            if (collapseIcon) {
                collapseIcon.classList.remove('fa-chevron-left');
                collapseIcon.classList.add('fa-chevron-right');
            }
        } else {
            sidebar.classList.remove('collapsed');
            if (collapseIcon) {
                collapseIcon.classList.remove('fa-chevron-right');
                collapseIcon.classList.add('fa-chevron-left');
            }
        }
        try { localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0'); } catch(e){}
    }

    try {
        if (localStorage.getItem(COLLAPSE_KEY) === '1') setSidebarCollapsed(true);
    } catch(e){}

    if (collapseBtn) {
        collapseBtn.addEventListener('click', () => {
            setSidebarCollapsed(!sidebar.classList.contains('collapsed'));
        });
    }

    function closeSidebarMobile() {
        if (sidebar)        sidebar.classList.remove('open');
        if (sidebarOverlay) sidebarOverlay.classList.remove('open');
    }

    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
            sidebarOverlay.classList.toggle('open');
        });
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', closeSidebarMobile);
    }

    loadDashboard();
    initPeriodModal();
});

// ============================================================================
// LOAD DASHBOARD
// ============================================================================

async function loadDashboard(){
    if(currentDashboard === 'resumo'){ await loadResumoDashboard(); return; }

    const k      = cacheKey(currentDashboard, currentMonth, currentYear);
    const cached = getCached(k);

    if(cached){
        window._dashboardData = cached;
        renderDashboard();
        updateLastUpdateTime();
        fetchData(currentDashboard, currentMonth, currentYear).then(r => {
            if(r.status==='success' && JSON.stringify(r.data) !== JSON.stringify(cached)){
                setCache(k, r.data);
                window._dashboardData = r.data;
                renderDashboard();
                updateLastUpdateTime();
                showToast('Dados atualizados ✓');
            }
        }).catch(_=>{});
        return;
    }

    showSkeleton();
    try{
        const result = await fetchData(currentDashboard, currentMonth, currentYear);
        hideSkeleton();
        if(result.status === 'success'){
            setCache(k, result.data);
            window._dashboardData = result.data;
            if(result.fonte === 'appscript') showToast('⚠️ Supabase sem dados — carregado do Apps Script');
            renderDashboard();
        } else {
            showError(result.error || 'Erro desconhecido', true);
        }
    }catch(err){
        hideSkeleton();
        const online = navigator.onLine;
        if(!online){
            showError('Sem conexão com a internet. Verifique sua rede e tente novamente.', false);
        } else {
            showError('Não foi possível conectar ao servidor. Tente novamente em instantes.', true);
        }
    }
    updateLastUpdateTime();
}

function renderDashboard(){
    hideLoading();
    const data = window._dashboardData;
    switch(currentDashboard){
        case 'documentacao':         renderDocumentacaoDashboard(data);        break;
        case 'app':                  renderAppDashboard(data);                 break;
        case 'adimplencia':          renderAdimplenciaDashboard(data);         break;
        case 'recorrencia':          renderRecorrenciaDashboard(data);         break;
        case 'refuturiza':           renderRefuturizaDashboard(data);          break;
        default: showError('Dashboard não encontrado: ' + currentDashboard);
    }
}

// ============================================================================
// RESUMO
// ============================================================================

async function loadResumoDashboard(){
    const eps     = ['documentacao','app','adimplencia'];
    const results = {};

    const allCached = eps.every(ep => !!getCached(cacheKey(ep, currentMonth, currentYear)));

    if(allCached){
        eps.forEach(ep => { results[ep] = getCached(cacheKey(ep, currentMonth, currentYear)); });
        renderResumoDashboard(results['documentacao'], results['app'], results['adimplencia']);
        updateLastUpdateTime();
        Promise.all(eps.map(async ep => {
            const r = await fetchData(ep, currentMonth, currentYear);
            if(r.status==='success'){ setCache(cacheKey(ep,currentMonth,currentYear), r.data); results[ep]=r.data; }
        })).then(() => {
            if(results['documentacao']) renderResumoDashboard(results['documentacao'], results['app'], results['adimplencia']);
        }).catch(_=>{});
        return;
    }

    showSkeleton();

    await Promise.all(eps.map(async ep => {
        const k = cacheKey(ep, currentMonth, currentYear);
        const cached = getCached(k);
        if(cached){ results[ep] = cached; return; }
        try{
            const r = await fetchData(ep, currentMonth, currentYear);
            if(r.status==='success'){ setCache(k, r.data); results[ep]=r.data; }
        }catch(_){}
    }));

    hideSkeleton();
    if(!results['documentacao']){
        showError('Não foi possível carregar os dados de Vendas. Verifique a conexão e tente novamente.', true);
        return;
    }
    renderResumoDashboard(results['documentacao'], results['app'], results['adimplencia']);
    updateLastUpdateTime();
}

function updateLastUpdateTime(){
    if(lastUpdateEl) lastUpdateEl.textContent = new Date().toLocaleString('pt-BR');
}

// ============================================================================
// RENDER RESUMO
// ============================================================================

function renderResumoDashboard(vendas, app, adim){
    const { geral, consultores, mes, ano } = vendas;
    const pAprov = calcPercentDoc(geral.aprovados, geral.total, geral.cancelados||0);
    const pApp   = app  ? calcPercent(app.geral.sim, app.geral.total) : null;
    const pAdim  = adim ? adim.geral.percentualAprovado : null;

    const bySector = groupBySector(consultores);
    const order    = ['VENDAS','RECEPCAO','REFILIACAO','WEB SITE','TELEVENDAS','OUTROS'];
    const sectors  = sortSectors(Object.keys(bySector), order);

    const consultoresRanking = consultores
        .filter(c => RANKING_SETORES.includes((c.setor||'').toUpperCase()))
        .sort((a,b) => b.total - a.total);

    dashboardContent.innerHTML = `
    <h2 class="dash-title"><i class="fas fa-chart-line" style="color:var(--primary)"></i> Resumo Geral — ${mes} ${ano}</h2>
    <div class="kpi-strip">
        ${kpiCard('Total de Vendas', geral.total, 'fas fa-shopping-bag', C.green, '')}
        ${kpiCard('% Aprovação', pAprov+'%', 'fas fa-check-circle', pAprov>=90?C.green:pAprov>=80?C.warn:C.danger, '')}
        ${app  ? kpiCard('% Com App',      pApp+'%',  'fas fa-mobile-alt',  pApp>=90?C.green:pApp>=80?C.warn:C.danger,  '') : ''}
        ${adim ? kpiCard('% Trocas OK',  pAdim+'%', 'fas fa-credit-card', pAdim>=90?C.green:pAdim>=80?C.warn:C.danger,'') : ''}
    </div>
    <div class="charts-row">
        <div class="chart-card"><div class="chart-card-title"><i class="fas fa-chart-bar"></i> Vendas por Setor</div><div class="chart-card-subtitle">Aprovados e pendências de cada setor no mês</div><div class="chart-wrap"><canvas id="chRes1"></canvas></div></div>
        <div class="chart-card"><div class="chart-card-title"><i class="fas fa-chart-pie"></i> Status das Vendas</div><div class="chart-card-subtitle">Distribuição geral: aprovados, pendências, não enviado e expirado</div><div class="chart-wrap"><canvas id="chRes2"></canvas></div></div>
        ${app ? `<div class="chart-card"><div class="chart-card-title"><i class="fas fa-mobile-alt"></i> Adesão ao App por Setor</div><div class="chart-card-subtitle">Clientes com e sem app cadastrado, separado por setor</div><div class="chart-wrap"><canvas id="chRes3"></canvas></div></div>` : ''}
    </div>
    <div class="charts-row" style="grid-template-columns:${adim?'1fr 1fr':'1fr'}">
        ${adim ? `<div class="chart-card"><div class="chart-card-title"><i class="fas fa-credit-card"></i> Situação das Mensalidades</div><div class="chart-card-subtitle">Mensalidades em dia, em aberto e em atraso</div><div class="chart-wrap"><canvas id="chRes4"></canvas></div></div>` : ''}
        <div class="chart-card"><div class="chart-card-title"><i class="fas fa-store"></i> Loja vs Web/Tele</div><div class="chart-card-subtitle">Comparativo de total, aprovados e pendências entre os canais de venda</div><div class="chart-wrap"><canvas id="chRes5"></canvas></div></div>
    </div>
    ${buildRankingCompleto(consultoresRanking, mes, ano)}`;

    createChart('chRes1',{type:'bar',data:{labels:sectors,datasets:[{label:'Aprovados',data:sectors.map(s=>bySector[s].reduce((a,c)=>a+c.aprovados,0)),backgroundColor:C.green,borderRadius:6,borderSkipped:false},{label:'Pendências',data:sectors.map(s=>bySector[s].reduce((a,c)=>a+c.pendencias,0)),backgroundColor:C.warn,borderRadius:6,borderSkipped:false}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:legendTop()},scales:scalesXY()}});
    createChart('chRes2',{type:'doughnut',data:{labels:['Aprovados','Pendências','Não Enviado','Expirado'],datasets:[{data:[geral.aprovados,geral.pendencias,geral.naoEnviado,geral.expirado||0],backgroundColor:[C.green,C.warn,C.danger,C.gray],borderWidth:0,hoverOffset:6}]},options:{responsive:true,maintainAspectRatio:false,cutout:'68%',plugins:{legend:{position:'bottom',labels:{boxWidth:12,padding:12}}}}});

    if(app){
        const appBySector = groupBySector(app.consultores.filter(c=>!c.origem||c.origem!=='retencao'));
        createChart('chRes3',{type:'bar',data:{labels:sectors,datasets:[{label:'Com App',data:sectors.map(s=>(appBySector[s]||[]).reduce((a,c)=>a+(c.sim||0),0)),backgroundColor:C.teal,borderRadius:6,borderSkipped:false},{label:'Sem App',data:sectors.map(s=>(appBySector[s]||[]).reduce((a,c)=>a+(c.nao||0),0)),backgroundColor:C.danger,borderRadius:6,borderSkipped:false}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:legendTop()},scales:scalesXY()}});
    }
    if(adim){
        createChart('chRes4',{type:'doughnut',data:{labels:['Mens. OK','Mens. Aberto','Mens. Atraso'],datasets:[{data:[adim.geral.mensOk,adim.geral.mensAberto,adim.geral.mensAtraso],backgroundColor:[C.green,C.warn,C.danger],borderWidth:0,hoverOffset:6}]},options:{responsive:true,maintainAspectRatio:false,cutout:'68%',plugins:{legend:{position:'bottom',labels:{boxWidth:12,padding:12}}}}});
    }
    createChart('chRes5',{type:'bar',data:{labels:['Total','Aprovados','Pendências'],datasets:[{label:'Loja',data:[vendas.vendasLoja.total,vendas.vendasLoja.aprovados,vendas.vendasLoja.pendencias],backgroundColor:C.green,borderRadius:6,borderSkipped:false},{label:'Web/Tele',data:[vendas.vendasWeb.total,vendas.vendasWeb.aprovados,vendas.vendasWeb.pendencias],backgroundColor:C.lime,borderRadius:6,borderSkipped:false}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:legendTop()},scales:scalesXY()}});
}

function kpiCard(label, value, icon, cor, sub){
    return `<div class="kpi-card"><div class="kpi-icon" style="background:${cor}20;color:${cor}"><i class="${icon}"></i></div><div class="kpi-body"><div class="kpi-label">${label}</div><div class="kpi-value" style="color:${cor}">${value}</div>${sub?`<div class="kpi-sub">${sub}</div>`:''}</div></div>`;
}

function buildRankingCompleto(consultores, mes, ano){
    if(!consultores.length) return '';
    const medal = i => i===0?'🥇':i===1?'🥈':i===2?'🥉':(i+1);
    const posClass = i => i===0?'rank-gold':i===1?'rank-silver':i===2?'rank-bronze':'rank-other';
    const maxTotal = consultores[0].total || 1;
    const porSetor = {};
    RANKING_SETORES.forEach(s => { porSetor[s] = consultores.filter(c=>(c.setor||'').toUpperCase()===s); });
    const top10 = consultores.slice(0, 10);
    return `
    <div class="ranking-full">
        <div class="ranking-full-header"><i class="fas fa-trophy"></i> 🏆 Ranking de Vendedores — ${mes} ${ano}<span class="ranking-badge">Vendas · Recepção · Refiliação</span></div>
        <div class="ranking-section-title">Top 10 Geral</div>
        <div class="rank-grid">${top10.map((c,i) => { const pct=calcPercent(c.aprovados,c.total); const barW=Math.round((c.total/maxTotal)*100); return `<div class="rank-card ${i<3?'rank-card-destaque':''}"><div class="rank-card-pos ${posClass(i)}">${medal(i)}</div><div class="rank-card-info"><div class="rank-card-name">${c.nome}</div><div class="rank-card-sector ${getSectorClass(c.setor)}">${c.setor||'—'}</div></div><div class="rank-card-metrics"><div class="rank-card-total">${c.total} <span>vendas</span></div><div class="rank-card-pct ${getPercentClass(pct)}">${pct}%</div></div><div class="rank-bar-wrap" style="width:120px"><div class="rank-bar-bg"><div class="rank-bar-fill" style="width:${barW}%"></div></div></div></div>`; }).join('')}</div>
        <div class="ranking-setores">${RANKING_SETORES.map(setor => { const lista=porSetor[setor]; if(!lista||!lista.length)return ''; return `<div class="ranking-setor-col"><div class="ranking-setor-header ${getSectorClass(setor)}"><i class="${getSectorIcon(setor)}"></i> ${setor}</div>${lista.slice(0,5).map((c,i) => { const pct=calcPercent(c.aprovados,c.total); return `<div class="rank-setor-row"><div class="rank-pos ${posClass(i)}" style="width:24px;height:24px;font-size:0.7rem">${medal(i)}</div><div class="rank-name" style="font-size:0.83rem">${c.nome}</div><div class="rank-pct ${getPercentClass(pct)}" style="font-size:0.78rem">${pct}%</div><div class="rank-total" style="font-size:0.75rem">${c.total}vd</div></div>`; }).join('')}</div>`; }).join('')}</div>
    </div>`;
}

// ============================================================================
// DASHBOARD: VENDAS
// ============================================================================

function calcPercentDoc(aprovados, total, cancelados) {
    const base = (total||0) - (cancelados||0);
    return base > 0 ? Math.round((aprovados / base) * 100) : 0;
}

function promoMiniCards(c) {
    if (!c.promo && !c.normal) return '';
    const p  = c.promo  || {};
    const n  = c.normal || {};
    const pP = calcPercentDoc(p.aprovados||0, p.total||0, p.cancelados||0);
    const pN = calcPercentDoc(n.aprovados||0, n.total||0, n.cancelados||0);
    if (!p.total && !n.total) return '';
    return `
    <div style="margin-top:10px;display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <div style="background:var(--primary-light);border-radius:8px;padding:8px;border-left:3px solid var(--primary)">
            <div style="font-size:10px;font-weight:700;color:var(--primary-dark);margin-bottom:4px">▶ PROMOÇÃO</div>
            <div style="font-size:11px;color:var(--text)">Total: <b>${p.total||0}</b></div>
            <div style="font-size:11px;color:var(--text)">Cancelados: <b style="color:#991b1b">${p.cancelados||0}</b></div>
            <div style="font-size:11px;color:var(--text)">Aprovados: <b style="color:var(--success)">${p.aprovados||0}</b></div>
            <div style="margin-top:4px"><span class="metric-percent ${getPercentClass(pP)}">${pP}%</span></div>
        </div>
        <div style="background:#f0f9e8;border-radius:8px;padding:8px;border-left:3px solid var(--accent)">
            <div style="font-size:10px;font-weight:700;color:var(--accent-dark);margin-bottom:4px">▶ NORMAL</div>
            <div style="font-size:11px;color:var(--text)">Total: <b>${n.total||0}</b></div>
            <div style="font-size:11px;color:var(--text)">Cancelados: <b style="color:#991b1b">${n.cancelados||0}</b></div>
            <div style="font-size:11px;color:var(--text)">Aprovados: <b style="color:var(--success)">${n.aprovados||0}</b></div>
            <div style="margin-top:4px"><span class="metric-percent ${getPercentClass(pN)}">${pN}%</span></div>
        </div>
    </div>`;
}

function promoSection(d, temPromo) {
    if (!temPromo) return '';
    const p  = d.geral.promo  || {};
    const n  = d.geral.normal || {};
    const lp = d.vendasLoja.promo  || {};
    const ln = d.vendasLoja.normal || {};
    const pP  = calcPercentDoc(p.aprovados||0,  p.total||0,  p.cancelados||0);
    const pN  = calcPercentDoc(n.aprovados||0,  n.total||0,  n.cancelados||0);
    const pLP = calcPercentDoc(lp.aprovados||0, lp.total||0, lp.cancelados||0);
    const pLN = calcPercentDoc(ln.aprovados||0, ln.total||0, ln.cancelados||0);

    function miniCard(label, obj, pct, cor) {
        return `
        <div class="card" style="border-left:4px solid ${cor}">
            <div class="card-header" style="padding-bottom:8px">
                <div class="card-title" style="font-size:13px;color:${cor}">${label}</div>
            </div>
            <div class="metric-grid">
                ${metricItem('Total', obj.total||0)}
                ${metricItem('Cancelados', obj.cancelados||0, '#991b1b')}
                ${metricItem('Base líquida', (obj.total||0)-(obj.cancelados||0))}
                ${metricItem('Aprovados', obj.aprovados||0, 'var(--success)')}
                ${metricItem('Pendências', (obj.reprovados||0)+(obj.expirado||0)+(obj.pendente||0)+(obj.naoEnviado||0), 'var(--danger)')}
                ${metricPercent('% Aprovados', pct)}
            </div>
        </div>`;
    }

    return `
    <h3 class="section-title" style="color:var(--primary-dark)">
        <i class="fas fa-tags" style="color:var(--primary-dark)"></i> Comparativo: Promoção vs Normal
    </h3>
    <div class="main-cards" style="grid-template-columns:repeat(auto-fit,minmax(220px,1fr))">
        ${miniCard('Promoção — Geral',  p,  pP,  'var(--primary)')}
        ${miniCard('Normal — Geral',    n,  pN,  'var(--accent-dark)')}
        ${miniCard('Promoção — Loja',   lp, pLP, 'var(--primary-dark)')}
        ${miniCard('Normal — Loja',     ln, pLN, 'var(--accent-dark)')}
    </div>`;
}

function renderDocumentacaoDashboard(d) {
    const { geral, vendasLoja, vendasWeb, consultores, mes, ano, temColunasPromo } = d;

    const pG = calcPercentDoc(geral.aprovados, geral.total, geral.cancelados||0);
    const pL = calcPercentDoc(vendasLoja.aprovados, vendasLoja.total, vendasLoja.cancelados||0);
    const pW = calcPercentDoc(vendasWeb.aprovados, vendasWeb.total, vendasWeb.cancelados||0);

    const bySector = groupBySector(consultores);
    const sectors  = sortSectors(Object.keys(bySector), ['VENDAS','RECEPCAO','REFILIACAO','WEB SITE','TELEVENDAS','OUTROS']);

    dashboardContent.innerHTML = `
    <h2 class="dash-title"><i class="fas fa-folder" style="color:var(--primary)"></i> Dashboard Vendas — ${mes} ${ano}</h2>
    <div class="main-cards">
        ${cardDoc('Total de Vendas', 'fas fa-chart-bar', geral, pG)}
        ${cardDoc('Vendas Loja', 'fas fa-store', vendasLoja, pL)}
        ${cardDoc('Vendas Web/Tele', 'fas fa-globe', vendasWeb, pW)}
    </div>
    ${promoSection(d, temColunasPromo)}
    <h3 class="section-title"><i class="fas fa-layer-group" style="color:var(--primary)"></i> Desempenho por Setor</h3>
    ${sectors.map(sector => {
        const list = bySector[sector];
        const tot   = list.reduce((s,c) => s + c.total, 0);
        const canc  = list.reduce((s,c) => s + (c.cancelados||0), 0);
        const aprov = list.reduce((s,c) => s + c.aprovados, 0);
        const pct   = calcPercentDoc(aprov, tot, canc);
        return `
        <div class="sector-card">
            <div class="sector-header">
                <div class="sector-title">
                    <i class="${getSectorIcon(sector)}"></i> ${sector}
                    <span class="sector-count">${list.length} consultor${list.length!==1?'es':''}</span>
                </div>
                <div class="metric-percent ${getPercentClass(pct)}">${pct}% aprovados</div>
            </div>
            <div class="consultant-grid">
                ${list.sort((a,b) => b.total - a.total).map(c => {
                    const p = calcPercentDoc(c.aprovados, c.total, c.cancelados||0);
                    return `
                    <div class="consultant-card">
                        <div class="consultant-header">
                            <div class="consultant-name">${c.nome}</div>
                            <div class="consultant-sector ${getSectorClass(sector)}">${sector}</div>
                        </div>
                        <div class="metric-grid">
                            ${metricItem('Total',        c.total)}
                            ${metricItem('Cancelados',   c.cancelados||0, '#991b1b')}
                            ${metricItem('Base líquida', c.total-(c.cancelados||0))}
                            ${metricItem('Aprovados',    c.aprovados, 'var(--success)')}
                            ${metricItem('Pendências',   c.pendencias, 'var(--danger)')}
                            ${metricItem('Não Enviado',  c.naoEnviado, 'var(--warning)')}
                            ${metricItem('Expirado',     c.expirado, 'var(--gray)')}
                            ${metricPercent('% Aprovados', p)}
                        </div>
                        ${temColunasPromo ? promoMiniCards(c) : ''}
                    </div>`;
                }).join('')}
            </div>
        </div>`;
    }).join('')}`;
}

function cardDoc(t, icon, d, pct) {
    const canc = d.cancelados || 0;
    const base = d.total - canc;
    return `
    <div class="card card-doc">
        <div class="card-header">
            <div class="card-title">${t}</div>
            <div class="card-icon"><i class="${icon}"></i></div>
        </div>
        <div class="metric-grid">
            ${metricItem('Total Vendas', d.total)}
            ${metricItem('Cancelados', canc, '#991b1b')}
            ${metricItem('Base Líquida', base)}
            ${metricItem('Aprovados', d.aprovados, 'var(--success)')}
            ${metricItem('Pendências', d.pendencias, 'var(--danger)')}
            ${metricItem('Não Enviado', d.naoEnviado, 'var(--warning)')}
            ${metricItem('Expirado', d.expirado, 'var(--gray)')}
            ${metricPercent('% Aprovados', pct)}
        </div>
    </div>`;
}

// ============================================================================
// DASHBOARD: APP
// ============================================================================

function renderAppDashboard(d){
    const {geral,appLoja,appWeb,consultores,consultorasRetencao,mes,ano}=d;
    const pG=calcPercent(geral.sim,geral.total),pL=calcPercent(appLoja.sim,appLoja.total),pW=calcPercent(appWeb.sim,appWeb.total);
    const regular=consultores.filter(c=>!c.origem||c.origem!=='retencao');
    const bySector=groupBySector(regular);
    const sectors=sortSectors(Object.keys(bySector),['VENDAS','RECEPCAO','REFILIACAO','WEB SITE','TELEVENDAS','OUTROS']);
    dashboardContent.innerHTML=`
    <h2 class="dash-title"><i class="fas fa-mobile-alt" style="color:var(--teal)"></i> Dashboard App — ${mes} ${ano}</h2>
    <div class="main-cards">${cardApp('App — Total Geral','fas fa-chart-pie',geral,pG)}${cardApp('App — Loja','fas fa-store',appLoja,pL)}${cardApp('App — Web/Tele','fas fa-globe',appWeb,pW)}</div>
    ${consultorasRetencao&&consultorasRetencao.length>0?`<div class="retention-section"><div class="retention-header"><i class="fas fa-crown"></i><h3>Consultoras de Retenção</h3></div><div class="consultant-grid">${consultorasRetencao.map(c=>{const p=calcPercent(c.sim,c.total);return `<div class="consultant-card" style="border-left:3px solid #f59e0b;"><div class="consultant-header"><div class="consultant-name">${c.nome} (RETENÇÃO)</div><div class="consultant-sector sector-retencao">RETENÇÃO</div></div><div class="metric-grid">${metricItem('Total',c.total)}${metricItem('Com App',c.sim,'var(--success)')}${metricItem('Sem App',c.nao,'var(--danger)')}${metricItem('Cancelados',c.cancelado||0,'var(--gray)')}${metricPercent('% Com App',p)}</div></div>`;}).join('')}</div></div>`:''}
    <h3 class="section-title"><i class="fas fa-layer-group" style="color:var(--teal)"></i> Desempenho por Setor</h3>
    ${sectors.map(sector=>{const list=bySector[sector];const tot=list.reduce((s,c)=>s+c.total,0),sim=list.reduce((s,c)=>s+(c.sim||0),0);const pct=calcPercent(sim,tot);return `<div class="sector-card"><div class="sector-header"><div class="sector-title"><i class="${getSectorIcon(sector)}"></i> ${sector}<span class="sector-count">${list.length} consultor${list.length!==1?'es':''}</span></div><div class="metric-percent ${getPercentClass(pct)}">${pct}% com app</div></div><div class="consultant-grid">${list.sort((a,b)=>b.total-a.total).map(c=>{const p=calcPercent(c.sim||0,c.total);return `<div class="consultant-card"><div class="consultant-header"><div class="consultant-name">${c.nome}</div><div class="consultant-sector ${getSectorClass(sector)}">${sector}</div></div><div class="metric-grid">${metricItem('Total',c.total)}${metricItem('Com App',c.sim||0,'var(--success)')}${metricItem('Sem App',c.nao||0,'var(--danger)')}${metricItem('Cancelados',c.cancelado||0,'var(--gray)')}${metricPercent('% Com App',p)}</div></div>`;}).join('')}</div></div>`;}).join('')}`;
}
function cardApp(t,icon,d,pct){ return `<div class="card card-app"><div class="card-header"><div class="card-title">${t}</div><div class="card-icon"><i class="${icon}"></i></div></div><div class="metric-grid">${metricItem('Total Clientes',d.total)}${metricItem('Com App (SIM)',d.sim,'var(--success)')}${metricItem('Sem App (NÃO)',d.nao,'var(--danger)')}${metricItem('Cancelados',d.cancelado||0,'var(--gray)')}${metricPercent('% Com App',pct)}</div></div>`; }

// ============================================================================
// DASHBOARD: TROCAS
// ============================================================================

function renderAdimplenciaDashboard(d){
    const {geral,consultores,mes,ano}=d;
    dashboardContent.innerHTML=`
    <h2 class="dash-title"><i class="fas fa-credit-card" style="color:var(--success)"></i> Dashboard Trocas — ${mes} ${ano}</h2>
    <div class="card card-adim" style="max-width:600px;margin:0 auto 28px;"><div class="card-header"><div class="card-title">Trocas — Total da Loja</div><div class="card-icon"><i class="fas fa-chart-line"></i></div></div><div class="metric-grid">${metricItem('Total Trocas',geral.totalTrocas)}${metricItem('Mens. OK',geral.mensOk,'var(--success)')}${metricItem('Mens. Aberto',geral.mensAberto,'var(--warning)')}${metricItem('Mens. Atraso',geral.mensAtraso,'var(--danger)')}${metricItem('Aprovados',geral.aprovados,'var(--success)')}${metricItem('Pendentes',geral.pendentes,'var(--danger)')}${metricItem('Total BI',geral.totalBi)}${metricItem('Fora BI',geral.foraBi,'var(--danger)')}${metricPercent('% Aprovados',geral.percentualAprovado)}</div></div>
    <h3 class="section-title"><i class="fas fa-user-tie" style="color:var(--primary)"></i> Desempenho por Consultor</h3>
    <div class="table-wrapper"><table class="data-table"><thead><tr><th>Consultor</th><th>Total Trocas</th><th>Mens. OK</th><th>Mens. Aberto</th><th>Mens. Atraso</th><th>Aprovados</th><th>Pendentes</th><th>Total BI</th><th>Fora BI</th><th>% Aprovados</th></tr></thead><tbody>${consultores.map(c=>`<tr><td><strong>${c.nome}</strong></td><td>${c.totalTrocas}</td><td style="color:var(--success)">${c.mensOk}</td><td style="color:var(--warning)">${c.mensAberto}</td><td style="color:var(--danger)">${c.mensAtraso}</td><td style="color:var(--success)">${c.aprovados}</td><td style="color:var(--danger)">${c.pendentes}</td><td>${c.totalBi}</td><td style="color:var(--danger)">${c.foraBi}</td><td><span class="metric-percent ${getPercentClass(c.percentualAprovado)}">${c.percentualAprovado}%</span></td></tr>`).join('')}</tbody></table></div>`;
}

// ============================================================================
// DASHBOARD: RECORRÊNCIA
// ============================================================================

function renderRecorrenciaDashboard(d){
    const {retencao,refiliacao,periodo}=d;
    const retKeys=Object.keys(retencao),refKeys=Object.keys(refiliacao);
    dashboardContent.innerHTML=`
    <h2 class="dash-title"><i class="fas fa-redo" style="color:var(--warning)"></i> Dashboard Recorrência — ${periodo.atual}</h2>
    <div style="background:rgba(245,158,11,0.08);padding:14px 18px;border-radius:12px;margin-bottom:24px;border-left:4px solid var(--warning);"><p style="margin:0;color:#92400e;font-weight:600;font-size:0.9rem;"><i class="fas fa-info-circle"></i> Período atual: ${periodo.atual} | Histórico: ${periodo.historico.join(', ')}</p></div>
    <h3 class="section-title" style="border-bottom:2px solid var(--primary)"><i class="fas fa-crown" style="color:var(--primary)"></i> Retenção</h3>
    <div class="consultant-grid" style="margin-bottom:36px">${retKeys.map(key=>{const c=retencao[key];const pA=calcPercent(c.atual.retençõesOK,c.atual.totalRetidosFinal),pT=calcPercent(c.total3Meses.totalOK||0,c.total3Meses.totalRetidosFinal);return `<div class="consultant-card"><div class="consultant-header"><div class="consultant-name">${key} (RETENÇÃO)</div><div class="consultant-sector sector-vendas">RETENÇÃO</div></div><h4 class="sub-section-title"><i class="far fa-calendar-check"></i> Mês Atual (${periodo.atual})</h4><div class="metric-grid">${metricItem('Total Retido',c.atual.totalRetido)}${metricItem('Cancelados',c.atual.cancelado,'var(--danger)')}${metricItem('Retenções OK',c.atual.retençõesOK,'var(--success)')}${metricItem('Pendências KYC',c.atual.pendenciasKYC,'var(--warning)')}${metricPercent('% OK',pA)}</div><h4 class="sub-section-title"><i class="fas fa-chart-line"></i> Total 3 Meses</h4><div class="metric-grid">${metricItem('Total Retido',c.total3Meses.totalRetido)}${metricItem('Cancelados',c.total3Meses.cancelado||0,'var(--danger)')}${metricItem('Total OK',c.total3Meses.totalOK||0,'var(--success)')}${metricItem('Em Atraso',c.total3Meses.emAtraso,'var(--warning)')}${metricPercent('% OK',pT)}</div></div>`;}).join('')}</div>
    <h3 class="section-title" style="border-bottom:2px solid var(--warning)"><i class="fas fa-user-plus" style="color:var(--warning)"></i> Refiliação</h3>
    <div class="consultant-grid">${refKeys.map(key=>{const c=refiliacao[key];const pT=calcPercent(c.total3Meses.totalOK||0,c.total3Meses.totalRetidosFinal);return `<div class="consultant-card"><div class="consultant-header"><div class="consultant-name">${key} (REFILIAÇÃO)</div><div class="consultant-sector sector-refiliacao">REFILIAÇÃO</div></div><h4 class="sub-section-title"><i class="fas fa-chart-line"></i> Total 3 Meses</h4><div class="metric-grid">${metricItem('Total Refiliados',c.total3Meses.totalRetido)}${metricItem('Cancelados',c.total3Meses.cancelado||0,'var(--danger)')}${metricItem('Total OK',c.total3Meses.totalOK||0,'var(--success)')}${metricItem('Em Atraso',c.total3Meses.emAtraso,'var(--warning)')}${metricPercent('% OK',pT)}</div></div>`;}).join('')}</div>`;
}

// ============================================================================
// DASHBOARD: REFUTURIZA
// ============================================================================

function renderRefuturizaDashboard(d){
    const {geral,consultores,mes,ano}=d;
    if(!geral||!consultores){showError('Dados do Refuturiza não encontrados');return;}
    const pG=calcPercent(geral.comLigacao,geral.total);
    dashboardContent.innerHTML=`
    <h2 class="dash-title"><i class="fas fa-book" style="color:var(--accent-dark)"></i> Dashboard Refuturiza — ${mes} ${ano}</h2>
    <div class="card card-refut" style="max-width:500px;margin:0 auto 28px"><div class="card-header"><div class="card-title">Refuturiza — Total da Loja</div><div class="card-icon"><i class="fas fa-book-open"></i></div></div><div class="metric-grid">${metricItem('Total',geral.total||0)}${metricItem('Com Ligação',geral.comLigacao||0,'var(--success)')}${metricItem('Sem Ligação',geral.semLigacao||0,'var(--danger)')}${metricItem('Cancelados',geral.cancelado||0,'var(--gray)')}${metricPercent('% Com Ligação',pG)}</div></div>
    ${consultores.length>0?`<h3 class="section-title"><i class="fas fa-users" style="color:var(--accent-dark)"></i> Desempenho por Consultor (${consultores.length})</h3><div class="consultant-grid">${consultores.map(c=>{const p=calcPercent(c.comLigacao||0,c.total);return `<div class="consultant-card"><div class="consultant-header"><div class="consultant-name">${c.nome}</div><div class="consultant-sector" style="background:var(--primary-light);color:var(--accent-dark)">REFUTURIZA</div></div><div class="metric-grid">${metricItem('Total',c.total||0)}${metricItem('Com Ligação',c.comLigacao||0,'var(--success)')}${metricItem('Sem Ligação',c.semLigacao||0,'var(--danger)')}${metricItem('Cancelados',c.cancelado||0,'var(--gray)')}${metricPercent('% Com Ligação',p)}</div></div>`;}).join('')}</div><div class="card" style="margin-top:36px;background:linear-gradient(135deg,var(--primary),#007a3d);color:white"><div class="card-header" style="border-bottom-color:rgba(255,255,255,0.2)"><div class="card-title" style="color:white">Resumo Final</div><div class="card-icon" style="background:rgba(255,255,255,0.2)"><i class="fas fa-graduation-cap"></i></div></div><div class="metric-grid">${metricItemWhite('Total Consultores',consultores.length)}${metricItemWhite('Total Cursos',geral.total||0)}${metricItemWhite('Média por Consultor',consultores.length>0?Math.round((geral.total||0)/consultores.length):0)}${metricItemWhite('Taxa de Contato',pG+'%')}</div></div>`:`<div style="text-align:center;padding:40px;color:var(--gray)"><i class="fas fa-info-circle" style="font-size:2.5rem;margin-bottom:16px;display:block;"></i><h3>Nenhum dado para ${mes} ${ano}</h3></div>`}`;
}

// ============================================================================
// HELPERS
// ============================================================================

function metricItem(l,v,c){ const s=c?`style="color:${c};"`:''; return `<div class="metric-item"><div class="metric-label">${l}</div><div class="metric-value" ${s}>${v??0}</div></div>`; }
function metricPercent(l,v){ const cls=getPercentClass(typeof v==='number'?v:parseInt(v)); return `<div class="metric-item"><div class="metric-label">${l}</div><div class="metric-percent ${cls}">${v}%</div></div>`; }
function metricItemWhite(l,v){ return `<div class="metric-item"><div class="metric-label" style="color:rgba(255,255,255,0.75)">${l}</div><div class="metric-value" style="color:white">${v}</div></div>`; }
function calcPercent(n,d){ if(!d||d===0)return 0; return Math.round((n/d)*100); }
function groupBySector(list){ const m={}; list.forEach(c=>{const s=c.setor||'OUTROS';if(!m[s])m[s]=[];m[s].push(c);}); return m; }
function sortSectors(keys,order){ return keys.sort((a,b)=>{const ia=order.indexOf(a),ib=order.indexOf(b);if(ia===-1&&ib===-1)return a.localeCompare(b);if(ia===-1)return 1;if(ib===-1)return -1;return ia-ib;}); }
function getPercentClass(p){ p=typeof p==='number'?p:parseInt(p)||0; if(p>=90)return 'percent-high'; if(p>=80)return 'percent-medium'; return 'percent-low'; }
function getSectorClass(s){ switch((s||'').toUpperCase()){case 'VENDAS':return 'sector-vendas';case 'RECEPCAO':return 'sector-recepcao';case 'REFILIACAO':return 'sector-refiliacao';case 'WEB SITE':case 'WEB':return 'sector-web';case 'TELEVENDAS':return 'sector-televendas';case 'RETENÇÃO':case 'RETENCAO':return 'sector-retencao';default:return 'sector-outros';} }
function getSectorIcon(s){ switch((s||'').toUpperCase()){case 'VENDAS':return 'fas fa-shopping-cart';case 'RECEPCAO':return 'fas fa-headset';case 'REFILIACAO':return 'fas fa-user-plus';case 'WEB SITE':case 'WEB':return 'fas fa-globe';case 'TELEVENDAS':return 'fas fa-phone-alt';case 'RETENÇÃO':case 'RETENCAO':return 'fas fa-crown';default:return 'fas fa-users';} }
function scalesXY(){ return {x:{grid:{display:false},border:{display:false}},y:{grid:{color:C.border},border:{display:false}}}; }
function legendTop(){ return {position:'top',labels:{boxWidth:12,padding:14}}; }

// ── Skeleton ──────────────────────────────────────────────────────────────
function showSkeleton(){
    if(loadingEl) loadingEl.style.display='none';
    let sk = document.getElementById('skeletonLoader');
    if(sk) return;
    sk = document.createElement('div');
    sk.id = 'skeletonLoader';
    sk.style.cssText = 'position:absolute;inset:0;background:rgba(240,247,242,0.85);z-index:10;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;backdrop-filter:blur(2px);border-radius:inherit';
    sk.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;gap:12px">
            <div style="width:44px;height:44px;border:3px solid #d1e8d9;border-top-color:#00a651;border-radius:50%;animation:spin .8s linear infinite"></div>
            <span style="font-size:13px;font-weight:600;color:#5a7a65" id="skeletonMsg">Carregando dados...</span>
        </div>
        <div style="display:flex;flex-direction:column;gap:10px;width:min(420px,90%)">
            <div class="sk-line" style="height:20px;border-radius:8px;width:60%"></div>
            <div class="sk-line" style="height:100px;border-radius:12px"></div>
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">
                <div class="sk-line" style="height:80px;border-radius:12px"></div>
                <div class="sk-line" style="height:80px;border-radius:12px"></div>
                <div class="sk-line" style="height:80px;border-radius:12px"></div>
            </div>
            <div class="sk-line" style="height:60px;border-radius:12px"></div>
        </div>`;
    dashboardContent.style.position = 'relative';
    dashboardContent.appendChild(sk);
}

function hideSkeleton(){
    const sk = document.getElementById('skeletonLoader');
    if(sk) sk.remove();
    if(loadingEl) loadingEl.style.display='none';
    const pl = document.getElementById('progressLoader');
    if(pl) pl.remove();
}

function showProgressLoading(label='Carregando...', pct=0){ showSkeleton(); }
function updateProgress(pct, label){
    const msg = document.getElementById('skeletonMsg');
    if(msg) msg.textContent = label;
}
function hideLoading(){ hideSkeleton(); }

function showToast(msg){
    let t=document.getElementById('toast');
    if(!t){ t=document.createElement('div'); t.id='toast'; document.body.appendChild(t); }
    t.textContent=msg; t.className='toast toast-show';
    setTimeout(()=>{ t.className='toast'; },2500);
}

function showError(msg, podeRetentar=true){
    hideSkeleton();
    const online = navigator.onLine;
    const iconeCor = online ? '#f59e0b' : '#ef4444';
    const icone    = online ? 'fa-exclamation-triangle' : 'fa-wifi';
    const dica     = online ? 'Os dados podem estar indisponíveis no momento.' : 'Verifique sua conexão com a internet.';

    dashboardContent.innerHTML = `
    <div class="error-message">
        <div style="width:64px;height:64px;border-radius:50%;background:${iconeCor}1a;display:flex;align-items:center;justify-content:center;margin:0 auto 16px">
            <i class="fas ${icone}" style="font-size:1.8rem;color:${iconeCor}"></i>
        </div>
        <h3 style="margin-bottom:8px;font-size:1.1rem">Não foi possível carregar</h3>
        <p style="color:var(--text-muted);margin-bottom:4px">${msg}</p>
        <p style="color:var(--text-muted);font-size:0.82rem;margin-bottom:20px">${dica}</p>
        <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
            ${podeRetentar ? `<button class="btn" onclick="loadDashboard()" style="background:#ef4444;color:white;padding:10px 20px"><i class="fas fa-redo"></i> Tentar novamente</button>` : ''}
            <button class="btn btn-topbar-refresh" onclick="currentDashboard='resumo';loadDashboard()"><i class="fas fa-home"></i> Voltar ao início</button>
        </div>
    </div>`;
}

// ── Period Modal ──────────────────────────────────────────────────────────
function initPeriodModal(){
    const fab = document.createElement('button');
    fab.id = 'periodFab';
    fab.innerHTML = '<i class="fas fa-calendar-alt"></i>';
    fab.title = 'Selecionar período';
    document.body.appendChild(fab);

    const modal = document.createElement('div');
    modal.id = 'periodModal';
    modal.innerHTML = `
        <div class="period-modal-backdrop" id="periodModalBackdrop"></div>
        <div class="period-modal-sheet">
            <div class="period-modal-handle"></div>
            <div class="period-modal-title"><i class="fas fa-calendar-alt" style="color:var(--primary)"></i> Selecionar Período</div>
            <div class="period-modal-body">
                <div class="select-group" style="width:100%">
                    <label>Mês</label>
                    <select id="monthSelectMobile">
                        <option value="1">Janeiro</option><option value="2">Fevereiro</option>
                        <option value="3">Março</option><option value="4">Abril</option>
                        <option value="5">Maio</option><option value="6">Junho</option>
                        <option value="7">Julho</option><option value="8">Agosto</option>
                        <option value="9">Setembro</option><option value="10">Outubro</option>
                        <option value="11">Novembro</option><option value="12">Dezembro</option>
                    </select>
                </div>
                <div class="select-group" style="width:100%">
                    <label>Ano</label>
                    <select id="yearSelectMobile"></select>
                </div>
                <button class="btn btn-topbar-refresh" id="applyPeriodBtn" style="width:100%;justify-content:center;padding:12px"><i class="fas fa-check"></i> Aplicar</button>
            </div>
        </div>`;
    document.body.appendChild(modal);

    const anoAtual = new Date().getFullYear();
    const yearMob = document.getElementById('yearSelectMobile');
    for(let y = anoAtual; y >= anoAtual - 3; y--){
        const opt = document.createElement('option');
        opt.value = y; opt.textContent = y;
        yearMob.appendChild(opt);
    }

    function syncMobile(){
        const mm = document.getElementById('monthSelectMobile');
        const ym = document.getElementById('yearSelectMobile');
        if(mm) mm.value = currentMonth;
        if(ym) ym.value = currentYear;
    }

    function openModal(){
        syncMobile();
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
    }
    function closeModal(){
        modal.classList.remove('open');
        document.body.style.overflow = '';
    }

    fab.addEventListener('click', openModal);
    document.getElementById('periodModalBackdrop').addEventListener('click', closeModal);

    document.getElementById('applyPeriodBtn').addEventListener('click', () => {
        const mm = document.getElementById('monthSelectMobile');
        const ym = document.getElementById('yearSelectMobile');
        currentMonth = parseInt(mm.value);
        currentYear = parseInt(ym.value);
        if(monthSelect) monthSelect.value = currentMonth;
        if(yearSelect) yearSelect.value = currentYear;
        closeModal();
        loadDashboard();
    });

    function updateFabVisibility(){
        fab.style.display = SEM_FILTRO.includes(currentDashboard) ? 'none' : 'flex';
    }
    updateFabVisibility();
    window.updateFabVisibility = updateFabVisibility;
}

// ── Export ─────────────────────────────────────────────────────────────────
async function exportPage(){
    const btn=document.getElementById('downloadBtn');
    const orig=btn.innerHTML;
    btn.innerHTML='<i class="fas fa-spinner fa-spin"></i> Gerando imagem...';
    btn.disabled=true;
    try{
        const container=document.querySelector('.main-wrapper');
        const canvas=await html2canvas(container,{scale:2,useCORS:true,backgroundColor:'#ffffff',scrollX:0,scrollY:-window.scrollY,windowWidth:container.scrollWidth,windowHeight:container.scrollHeight,onclone:(doc)=>{doc.querySelector('.dashboard-content').style.overflow='visible';}});
        const nome=currentDashboard.toUpperCase().replace('_','-');
        const periodo=['recorrencia'].includes(currentDashboard)?'':`_${getMonthName(currentMonth)}-${currentYear}`;
        const link=document.createElement('a');
        link.download=`Dashboard_${nome}${periodo}.png`;
        link.href=canvas.toDataURL('image/png');
        link.click();
    }catch(err){ showToast('❌ Erro ao gerar imagem. Tente novamente.'); }
    finally{ btn.innerHTML=orig; btn.disabled=false; }
}
function getMonthName(m){ return ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'][m-1]; }
