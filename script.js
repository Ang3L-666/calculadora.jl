// BANCO DE DADOS COMPLETO (g/cc)
const MATERIAIS_DB = {
    "304": 8.00, "430": 7.74, "316": 7.98,
    "galv": 7.87, "1020": 7.85, "1045": 7.85,
    "alu": 2.70, "lat": 8.50, "cob": 8.96, "brz": 8.80, "tit": 4.50,
    "nyl": 1.14, "uhmw": 0.94, "pol": 0.91
};

let orcamento = [];
let totalItensAcumulado = 0;
let totalPesoAcumulado = 0;
let idAtual = "";
let dataValidade = "";
let meuGrafico = null;

window.onload = function() {
    // Configura ID e Data
    configurarDataEId();
    atualizarListaHistorico();
    
    let salvo = localStorage.getItem('jl_orcamento_temp');
    if (salvo) carregarDadosNaTela(JSON.parse(salvo));
};

function configurarDataEId() {
    // ID baseado no timestamp curto
    if (!idAtual) idAtual = "#" + Math.floor(Date.now() / 1000).toString().slice(-4);
    document.getElementById("idOrcamento").innerText = idAtual;

    // Validade: Hoje + 5 dias
    let hoje = new Date();
    let validade = new Date();
    validade.setDate(hoje.getDate() + 5);
    dataValidade = validade.toLocaleDateString('pt-BR');
    document.getElementById("dataValidade").innerText = dataValidade;
    document.getElementById("dataValidadeFooter").innerText = dataValidade;
}

function filtrarMateriais() {
    let busca = document.getElementById("buscaMaterial").value.toLowerCase();
    let select = document.getElementById("tipoMaterial");
    // Filtra opções e grupos
    let options = select.getElementsByTagName("option");
    for (let opt of options) {
        let texto = opt.text.toLowerCase();
        opt.style.display = texto.includes(busca) ? "block" : "none";
    }
    // Seleciona o primeiro visível
    for (let opt of options) {
        if (opt.style.display !== "none") {
            select.value = opt.value;
            break;
        }
    }
}

function salvarNoHistorico() {
    let nome = document.getElementById("nomeCliente").value || "Cliente Sem Nome";
    let total = document.getElementById("precoVendaFinal").innerText;
    
    let historico = JSON.parse(localStorage.getItem('jl_historico') || "[]");
    let novoItem = {
        id: Date.now(),
        id_visivel: idAtual,
        nome: nome,
        data: new Date().toLocaleString('pt-BR'),
        validade: dataValidade,
        total_txt: total,
        itens: orcamento,
        endereco: document.getElementById("enderecoEntrega").value,
        material: document.getElementById("tipoMaterial").value,
        precoKg: document.getElementById("precoKg").value,
        // Salva estados financeiros e logísticos
        frete: {
            tipo: document.getElementById("tipoFrete").value,
            km: document.getElementById("distanciaKm").value,
            cons: document.getElementById("consumoVeiculo").value,
            litro: document.getElementById("precoCombustivel").value,
            terceiro: document.getElementById("valorFreteTerceiro").value
        },
        financeiro: {
            extra: document.getElementById("custoExtras").value,
            mo: document.getElementById("custoMaoObra").value,
            margem: document.getElementById("margemLucroRange").value,
            desc: document.getElementById("descontoVenda").value
        }
    };

    historico.unshift(novoItem);
    if (historico.length > 20) historico.pop();
    localStorage.setItem('jl_historico', JSON.stringify(historico));
    atualizarListaHistorico();
    alert("Orçamento salvo na memória!");
}

function atualizarListaHistorico() {
    let lista = document.getElementById("listaHistorico");
    let historico = JSON.parse(localStorage.getItem('jl_historico') || "[]");
    if (historico.length === 0) {
        lista.innerHTML = '<small style="padding:10px; display:block; color:#888">Nenhum salvo.</small>';
        return;
    }
    lista.innerHTML = historico.map(h => `
        <div class="item-hist" onclick="recuperarHistorico(${h.id})">
            <div style="font-weight:bold; color:#0056b3">${h.nome}</div>
            <div style="font-size:10px; color:#666">${h.data} • ${h.total_txt}</div>
        </div>
    `).join("");
}

function recuperarHistorico(id) {
    if(!confirm("Carregar este orçamento?")) return;
    let historico = JSON.parse(localStorage.getItem('jl_historico') || "[]");
    let item = historico.find(h => h.id === id);
    if (item) {
        idAtual = item.id_visivel || "#RECUP";
        document.getElementById("idOrcamento").innerText = idAtual;
        carregarDadosNaTela(item);
        if(item.frete) {
            document.getElementById("tipoFrete").value = item.frete.tipo;
            document.getElementById("distanciaKm").value = item.frete.km;
            document.getElementById("consumoVeiculo").value = item.frete.cons;
            document.getElementById("precoCombustivel").value = item.frete.litro;
            document.getElementById("valorFreteTerceiro").value = item.frete.terceiro;
        }
        if(item.financeiro) {
            document.getElementById("custoExtras").value = item.financeiro.extra;
            document.getElementById("custoMaoObra").value = item.financeiro.mo;
            document.getElementById("margemLucroRange").value = item.financeiro.margem;
            document.getElementById("descontoVenda").value = item.financeiro.desc;
        }
        alternarTipoFrete();
        atualizarMargem();
    }
}

function salvarProgresso() {
    let dados = {
        itens: orcamento,
        cliente: document.getElementById("nomeCliente").value,
        endereco: document.getElementById("enderecoEntrega").value,
        material: document.getElementById("tipoMaterial").value,
        precoKg: document.getElementById("precoKg").value,
        pagto: document.getElementById("formaPagamento").value,
        prazo: document.getElementById("prazoEntrega").value
    };
    localStorage.setItem('jl_orcamento_temp', JSON.stringify(dados));
}

function carregarDadosNaTela(dados) {
    orcamento = dados.itens || [];
    document.getElementById("nomeCliente").value = dados.cliente || dados.nome || "";
    document.getElementById("enderecoEntrega").value = dados.endereco || "";
    document.getElementById("tipoMaterial").value = dados.material || "304";
    document.getElementById("precoKg").value = dados.precoKg || "";
    document.getElementById("formaPagamento").value = dados.pagto || "";
    document.getElementById("prazoEntrega").value = dados.prazo || "";
    atualizarTabela();
}

// --- FUNÇÕES DE CÁLCULO DE PESO E CUSTO ---
function adicionarChapa() {
    let matKey = document.getElementById("tipoMaterial").value;
    let densidade = MATERIAIS_DB[matKey] || 8.0;
    let precoKg = parseFloat(document.getElementById("precoKg").value);
    let comp = parseFloat(document.getElementById("comprimento").value);
    let larg = parseFloat(document.getElementById("largura").value);
    let esp = parseFloat(document.getElementById("espessura").value);

    if (isNaN(comp) || isNaN(larg) || isNaN(precoKg)) { alert("Preencha medidas e preço!"); return; }

    // Volume (m3) * Densidade (kg/m3)
    let peso = (comp * larg * (esp / 1000)) * (densidade * 1000);
    let custo = peso * precoKg;

    orcamento.push({ 
        descricao: `Chapa ${matKey.toUpperCase()} ${esp}mm (${comp}x${larg}m)`, 
        peso: peso,
        custo: custo 
    });
    atualizarTabela();
}

function adicionarTubo() {
    let matKey = document.getElementById("tipoMaterial").value;
    let densidade = MATERIAIS_DB[matKey] || 8.0;
    let precoKg = parseFloat(document.getElementById("precoKg").value);
    let formato = document.getElementById("formatoTubo").value;
    let mA = parseFloat(document.getElementById("medidaTubo").value) / 1000; // Metros
    let esp = parseFloat(document.getElementById("espessuraTubo").value) / 1000; // Metros
    let comp = parseFloat(document.getElementById("comprimentoTubo").value); // Metros

    if (isNaN(mA) || isNaN(comp) || isNaN(precoKg)) { alert("Dados incompletos!"); return; }

    let area = 0;
    if (formato === "quadrado") area = (mA * mA) - (Math.pow(mA - (2 * esp), 2));
    else if (formato === "retangular") {
        let mB = parseFloat(document.getElementById("medidaTubo2").value) / 1000;
        area = (mA * mB) - ((mA - 2 * esp) * (mB - 2 * esp));
    } else if (formato === "redondo") {
        area = Math.PI * (Math.pow(mA / 2, 2) - Math.pow((mA / 2) - esp, 2));
    } else { // Maciço
        area = Math.PI * Math.pow(mA / 2, 2);
    }

    let peso = area * comp * (densidade * 1000);
    let custo = peso * precoKg;

    orcamento.push({ 
        descricao: `${formato.toUpperCase()} ${matKey.toUpperCase()} (${mA*1000}mm)`, 
        peso: peso,
        custo: custo 
    });
    atualizarTabela();
}

function adicionarAcessorio() {
    let nome = document.getElementById("nomeAcessorio").value;
    let qtd = parseFloat(document.getElementById("qtdAcessorio").value);
    let vlr = parseFloat(document.getElementById("precoAcessorio").value);
    if (!nome || isNaN(qtd)) return;
    orcamento.push({ descricao: `${qtd}x ${nome}`, peso: 0, custo: qtd * vlr });
    atualizarTabela();
}

function adicionarSolda() {
    let m = parseFloat(document.getElementById("metrosSolda").value);
    let c = parseFloat(document.getElementById("custoMetroSolda").value);
    if (isNaN(m)) return;
    orcamento.push({ descricao: `Soldagem (${m}m)`, peso: 0, custo: m * c });
    atualizarTabela();
}

function atualizarTabela() {
    let tbody = document.getElementById("listaItens");
    tbody.innerHTML = "";
    totalItensAcumulado = 0;
    totalPesoAcumulado = 0;
    
    orcamento.forEach((item, i) => {
        totalItensAcumulado += item.custo;
        totalPesoAcumulado += item.peso || 0;
        let pesoTxt = item.peso > 0 ? `(${item.peso.toFixed(2)}kg)` : "";
        
        tbody.innerHTML += `
            <tr>
                <td>${item.descricao} <small style='color:#666'>${pesoTxt}</small></td>
                <td align="right">R$ ${item.custo.toFixed(2)}</td>
                <td align="center"><button class="btn-del" onclick="removerItem(${i})">x</button></td>
            </tr>`;
    });
    
    document.getElementById("totalMaterial").innerText = "R$ " + totalItensAcumulado.toFixed(2);
    document.getElementById("pesoTotalDisplay").innerText = totalPesoAcumulado.toFixed(2) + " kg";
    
    salvarProgresso();
    calcularTotalFinal();
}

// --- RESTO DO CÓDIGO (Frete, Gráfico, Exportação) ---
function calcularFrete() {
    let tipo = document.getElementById("tipoFrete").value;
    let valor = 0;
    if (tipo === "proprio") {
        let km = parseFloat(document.getElementById("distanciaKm").value) || 0;
        let cons = parseFloat(document.getElementById("consumoVeiculo").value) || 1;
        let precoL = parseFloat(document.getElementById("precoCombustivel").value) || 0;
        valor = (km / cons) * precoL;
    } else valor = parseFloat(document.getElementById("valorFreteTerceiro").value) || 0;
    document.getElementById("valorFrete").value = valor.toFixed(2);
    calcularTotalFinal();
}

function calcularTotalFinal() {
    let extra = parseFloat(document.getElementById("custoExtras").value) || 0;
    let mo = parseFloat(document.getElementById("custoMaoObra").value) || 0;
    let margem = parseFloat(document.getElementById("margemLucroRange").value) || 0;
    let frete = parseFloat(document.getElementById("valorFrete").value) || 0;
    let desc = parseFloat(document.getElementById("descontoVenda").value) || 0;

    let custoProd = totalItensAcumulado + extra + mo;
    let lucroBruto = custoProd * (margem / 100);
    let lucroReal = lucroBruto - desc;
    let total = custoProd + lucroBruto + frete;

    document.getElementById("custoProducao").innerText = "R$ " + custoProd.toFixed(2);
    document.getElementById("precoVendaFinal").innerText = "R$ " + (total - desc).toFixed(2);
    document.getElementById("lucroLiquido").innerText = "Lucro Líq: R$ " + lucroReal.toFixed(2);
    
    atualizarGrafico(totalItensAcumulado, mo, extra, frete, lucroReal);
}

function atualizarGrafico(mat, mo, ext, frete, lucro) {
    let ctx = document.getElementById('graficoFinanceiro').getContext('2d');
    if (meuGrafico) meuGrafico.destroy();
    meuGrafico = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Material', 'Mão de Obra', 'Extras', 'Frete', 'Lucro'],
            datasets: [{
                data: [mat, mo, ext, frete, lucro > 0 ? lucro : 0],
                backgroundColor: ['#34495e', '#e67e22', '#95a5a6', '#3498db', '#2ecc71']
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
    });
}

function enviarWhatsApp() {
    let cliente = document.getElementById("nomeCliente").value || "Cliente";
    let total = document.getElementById("precoVendaFinal").innerText;
    let peso = document.getElementById("pesoTotalDisplay").innerText;
    
    let txt = `*JL EQUIPAMENTOS - ORÇAMENTO ${idAtual}*\n`;
    txt += `📍 Cliente: ${cliente}\n`;
    txt += `📅 Validade: ${dataValidade}\n`;
    txt += `--------------------------------\n`;
    orcamento.forEach(i => txt += `✅ ${i.descricao}: R$ ${i.custo.toFixed(2)}\n`);
    txt += `--------------------------------\n`;
    txt += `⚖️ Peso Estimado: ${peso}\n`;
    txt += `💰 *TOTAL FINAL: ${total}*`;
    
    window.open(`https://wa.me/?text=${encodeURIComponent(txt)}`, '_blank');
}

function enviarWhatsAppInterno() {
    let cliente = document.getElementById("nomeCliente").value || "Cliente";
    let lucro = document.getElementById("lucroLiquido").innerText;
    let total = document.getElementById("precoVendaFinal").innerText;
    let txt = `🔐 *RELATÓRIO INTERNO ${idAtual}*\nRef: ${cliente}\nMaterial: R$ ${totalItensAcumulado.toFixed(2)}\n${lucro}\n✅ VENDA: ${total}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(txt)}`, '_blank');
}

function gerarExcelInterno() {
    let csv = `ID;ITEM;PESO(kg);VALOR\n`;
    orcamento.forEach(i => csv += `${idAtual};${i.descricao};${(i.peso||0).toFixed(2)};${i.custo.toFixed(2).replace('.', ',')}\n`);
    let blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    let link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Orcamento_JL_${idAtual}.csv`;
    link.click();
}

function abrirMapa() { window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(document.getElementById("enderecoEntrega").value)}`, '_blank'); }
function abrirWaze() { window.open(`https://waze.com/ul?q=${encodeURIComponent(document.getElementById("enderecoEntrega").value)}`, '_blank'); }
function removerItem(i) { orcamento.splice(i, 1); atualizarTabela(); }
function limparOrcamento() { if(confirm("Limpar e iniciar novo?")) { localStorage.removeItem('jl_orcamento_temp'); location.reload(); } }
function atualizarMargem() { document.getElementById("labelMargem").innerText = document.getElementById("margemLucroRange").value + "%"; calcularTotalFinal(); }
function mudarLabelTubo() { document.getElementById("boxMedida2").style.display = document.getElementById("formatoTubo").value === "retangular" ? "block" : "none"; }
function imprimirCliente() { document.body.classList.add('print-client'); window.print(); document.body.classList.remove('print-client'); }
function imprimirInterno() { window.print(); }
function alternarTipoFrete() { document.getElementById("boxFreteProprio").style.display = document.getElementById("tipoFrete").value === "proprio" ? "block" : "none"; document.getElementById("boxFreteTerceiro").style.display = document.getElementById("tipoFrete").value === "terceiro" ? "block" : "none"; calcularFrete(); }