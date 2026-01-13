const MATERIAIS_DB = {
    "304": 8.00, "430": 7.74, "316": 7.98,
    "galv": 7.87, "1020": 7.85, 
    "alu": 2.70, "lat": 8.50, "cob": 8.96, "brz": 8.80, "tit": 4.50,
    "nyl": 1.14, "uhmw": 0.94
};

const SERVICOS_DB = {
    "linear": { nome: "Solda Linear Simples", unidade: "m", valor: 15.00 },
    "complexa": { nome: "Solda Cuba/Acabamento", unidade: "m", valor: 45.00 },
    "instalacao": { nome: "Instalação no Local", unidade: "un", valor: 150.00 }
};

let orcamento = [];
let idAtual = "";

window.onload = function() {
    configurarDataEId();
    atualizarListaHistorico();
    
    document.getElementById("tipoServico").addEventListener("change", function() {
        let tipo = this.value;
        if(SERVICOS_DB[tipo]) {
            document.getElementById("descServico").value = SERVICOS_DB[tipo].nome;
            document.getElementById("unidadeServico").value = SERVICOS_DB[tipo].unidade;
            document.getElementById("valorServico").value = SERVICOS_DB[tipo].valor.toFixed(2);
        }
    });

    let salvo = localStorage.getItem('jl_orcamento_temp');
    if (salvo) carregarDadosNaTela(JSON.parse(salvo));
};

function lerNumero(id) {
    let el = document.getElementById(id);
    if (!el || !el.value) return 0;
    let valorCorrigido = el.value.toString().replace(',', '.');
    return parseFloat(valorCorrigido);
}

function mudarLabelTubo() { 
    let formato = document.getElementById("formatoTubo").value;
    document.getElementById("boxMedida2").style.display = (formato === "retangular") ? "flex" : "none"; 
    
    let boxEspessura = document.getElementById("boxEspessura");
    if (formato === "macico") {
        boxEspessura.style.visibility = "hidden";
        document.getElementById("espessuraTubo").value = "";
    } else {
        boxEspessura.style.visibility = "visible";
    }
}

function adicionarTubo() {
    let matKey = document.getElementById("tipoMaterial").value;
    let densidade = MATERIAIS_DB[matKey] || 8.0;
    let precoKg = lerNumero("precoKg");
    let formato = document.getElementById("formatoTubo").value;
    
    let mA = lerNumero("medidaTubo") / 1000;
    let esp = lerNumero("espessuraTubo") / 1000;
    let compTotal = lerNumero("comprimentoTubo");

    if (precoKg <= 0) { alert("Preencha o Preço do Kg!"); return; }
    if (mA <= 0 || compTotal <= 0) { alert("Preencha as medidas do tubo!"); return; }
    
    if (formato !== "macico") {
        if (esp <= 0) { alert("Preencha a Parede (mm)!"); return; }
        if (esp * 2 >= mA) { alert("Erro: Parede muito grossa para essa bitola!"); return; }
    }

    let area = 0;
    if (formato === "quadrado") area = (mA * mA) - (Math.pow(mA - (2 * esp), 2));
    else if (formato === "retangular") {
        let mB = lerNumero("medidaTubo2") / 1000;
        if (mB <= 0) { alert("Preencha a Bitola B!"); return; }
        area = (mA * mB) - ((mA - 2 * esp) * (mB - 2 * esp));
    } else if (formato === "redondo") {
        area = Math.PI * (Math.pow(mA / 2, 2) - Math.pow((mA / 2) - esp, 2));
    } else { 
        area = Math.PI * Math.pow(mA / 2, 2);
    }

    let peso = area * compTotal * (densidade * 1000);
    let custo = peso * precoKg;

    orcamento.push({ 
        descricao: `Tubo ${matKey.toUpperCase()} ${formato} (${compTotal}m lin.)`, 
        peso: peso, custo: custo 
    });
    atualizarTabela();
}

function adicionarChapa() {
    let matKey = document.getElementById("tipoMaterial").value;
    let densidade = MATERIAIS_DB[matKey] || 8.0;
    let precoKg = lerNumero("precoKg");
    let comp_mm = lerNumero("comprimento");
    let larg_mm = lerNumero("largura");
    let qtd = lerNumero("qtdChapa") || 1;
    let esp = parseFloat(document.getElementById("espessura").value);

    if (comp_mm <= 0 || larg_mm <= 0 || precoKg <= 0) { alert("Preencha medidas e preço!"); return; }

    let pesoTotal = (comp_mm / 1000) * (larg_mm / 1000) * (esp / 1000) * (densidade * 1000) * qtd;
    let custo = pesoTotal * precoKg;

    orcamento.push({ 
        descricao: `${qtd}x Chapa ${matKey.toUpperCase()} ${esp}mm (${comp_mm}x${larg_mm}mm)`, 
        peso: pesoTotal, custo: custo 
    });
    atualizarTabela();
}

function adicionarServico() {
    let desc = document.getElementById("descServico").value;
    let unidade = document.getElementById("unidadeServico").value;
    let qtd = lerNumero("qtdServico");
    let valorUnit = lerNumero("valorServico");
    
    if (!desc || qtd <= 0 || valorUnit <= 0) { alert("Preencha a descrição, quantidade e valor!"); return; }
    
    let labelUnidade = (unidade === "m") ? "m lin." : (unidade === "m2" ? "m²" : "un.");

    orcamento.push({ 
        descricao: `${desc} (${qtd} ${labelUnidade})`, 
        peso: 0, 
        custo: qtd * valorUnit 
    });
    atualizarTabela();
}

function adicionarAcessorio() {
    let nome = document.getElementById("nomeAcessorio").value;
    let valor = lerNumero("valorAcessorio");
    if (!nome || valor <= 0) return;
    orcamento.push({ descricao: nome, peso: 0, custo: valor });
    atualizarTabela();
}

function atualizarTabela() {
    let tbody = document.getElementById("listaItens");
    tbody.innerHTML = "";
    let totalCusto = 0;
    let totalPeso = 0;
    
    orcamento.forEach((item, i) => {
        totalCusto += item.custo;
        totalPeso += item.peso || 0;
        tbody.innerHTML += `<tr><td>${item.descricao}</td><td align="right">R$ ${item.custo.toFixed(2)}</td><td><button class="btn-del" onclick="removerItem(${i})">x</button></td></tr>`;
    });
    
    document.getElementById("totalMaterial").innerText = "R$ " + totalCusto.toFixed(2);
    document.getElementById("pesoTotalDisplay").innerText = totalPeso.toFixed(2) + " kg";
    salvarProgresso();
    calcularTotalFinal();
}

function calcularTotalFinal() {
    let totalMaterial = parseFloat(document.getElementById("totalMaterial").innerText.replace("R$ ", "")) || 0;
    let extra = lerNumero("custoExtras");
    let mo = lerNumero("custoMaoObra");
    let margem = lerNumero("margemLucro");
    let frete = parseFloat(document.getElementById("valorFrete").value) || 0;
    let desconto = lerNumero("descontoVenda");
    
    let custoTotal = totalMaterial + extra + mo;
    let vendaBruta = custoTotal / (1 - (margem / 100));
    let totalFinal = vendaBruta + frete - desconto;
    
    document.getElementById("custoProducao").innerText = "R$ " + custoTotal.toFixed(2);
    document.getElementById("precoVendaFinal").innerText = "R$ " + totalFinal.toFixed(2);
    document.getElementById("lucroLiquido").innerText = "Lucro Líq: R$ " + (vendaBruta - custoTotal).toFixed(2);
    
    atualizarGrafico(totalMaterial, mo, extra + frete, vendaBruta - custoTotal);
}

function calcularFrete() {
    let tipo = document.getElementById("tipoFrete").value;
    let valor = 0;
    if (tipo === "proprio") {
        let km = lerNumero("distanciaKm");
        let cons = lerNumero("consumoVeiculo") || 1;
        let precoL = lerNumero("precoCombustivel");
        valor = (km / cons) * precoL;
    } else valor = lerNumero("valorFreteTerceiro");
    document.getElementById("valorFrete").value = valor.toFixed(2);
    calcularTotalFinal();
}

function removerItem(i) { orcamento.splice(i, 1); atualizarTabela(); }
function limparOrcamento() { if(confirm("Limpar tudo?")) { localStorage.removeItem('jl_orcamento_temp'); location.reload(); } }

function configurarDataEId() {
    idAtual = "#" + Math.floor(Date.now() / 1000).toString().slice(-4);
    document.getElementById("idOrcamento").innerText = idAtual;
    let validade = new Date();
    validade.setDate(validade.getDate() + 5);
    document.getElementById("dataValidade").innerText = validade.toLocaleDateString('pt-BR');
}

function salvarNoHistorico() {
    let nome = document.getElementById("nomeCliente").value || "Sem Nome";
    let historico = JSON.parse(localStorage.getItem('jl_historico') || "[]");
    let novoItem = {
        id: Date.now(), id_visivel: idAtual, nome: nome, data: new Date().toLocaleString('pt-BR'),
        total_txt: document.getElementById("precoVendaFinal").innerText, itens: orcamento,
        endereco: document.getElementById("enderecoEntrega").value,
        material: document.getElementById("tipoMaterial").value, precoKg: document.getElementById("precoKg").value,
        obs: document.getElementById("obsOrcamento").value,
        frete: { tipo: document.getElementById("tipoFrete").value, valor: document.getElementById("valorFrete").value },
        pagto: document.getElementById("formaPagamento").value, prazo: document.getElementById("prazoEntrega").value
    };
    historico.unshift(novoItem);
    if (historico.length > 20) historico.pop();
    localStorage.setItem('jl_historico', JSON.stringify(historico));
    atualizarListaHistorico();
    alert("Orçamento Salvo!");
}

function atualizarListaHistorico() {
    let lista = document.getElementById("listaHistorico");
    let historico = JSON.parse(localStorage.getItem('jl_historico') || "[]");
    if (historico.length === 0) { lista.innerHTML = '<small style="padding:10px; display:block; color:#888">Vazio</small>'; return; }
    lista.innerHTML = historico.map(h => `<div class="item-hist" onclick="recuperarHistorico(${h.id})"><div style="font-weight:bold; color:#0056b3">${h.nome}</div><div style="font-size:10px; color:#666">${h.data} • ${h.total_txt}</div></div>`).join("");
}

function recuperarHistorico(id) {
    if(!confirm("Carregar este orçamento?")) return;
    let item = JSON.parse(localStorage.getItem('jl_historico') || "[]").find(h => h.id === id);
    if (item) carregarDadosNaTela(item);
}

function carregarDadosNaTela(dados) {
    orcamento = dados.itens || [];
    document.getElementById("nomeCliente").value = dados.nome || dados.cliente || "";
    document.getElementById("obsOrcamento").value = dados.obs || "";
    document.getElementById("formaPagamento").value = dados.pagto || "";
    document.getElementById("prazoEntrega").value = dados.prazo || "";
    if(dados.precoKg) document.getElementById("precoKg").value = dados.precoKg;
    atualizarTabela();
}

function atualizarGrafico(mat, mo, ext, lucro) {
    let ctx = document.getElementById('graficoFinanceiro').getContext('2d');
    if (meuGrafico) meuGrafico.destroy();
    meuGrafico = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Materiais', 'Mão de Obra', 'Logística/Extras', 'Lucro'],
            datasets: [{ data: [mat, mo, ext, lucro > 0 ? lucro : 0], backgroundColor: ['#34495e', '#e67e22', '#95a5a6', '#2ecc71'] }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
}

function filtrarMateriais() {
    let busca = document.getElementById("buscaMaterial").value.toLowerCase();
    let select = document.getElementById("tipoMaterial");
    let options = select.getElementsByTagName("option");
    for (let opt of options) {
        opt.style.display = opt.text.toLowerCase().includes(busca) ? "block" : "none";
    }
    for (let opt of options) { if (opt.style.display !== "none") { select.value = opt.value; break; } }
}

function salvarProgresso() { /* Opcional */ }
function alternarTipoFrete() { 
    document.getElementById("boxFreteProprio").style.display = document.getElementById("tipoFrete").value === "proprio" ? "block" : "none"; 
    document.getElementById("boxFreteTerceiro").style.display = document.getElementById("tipoFrete").value === "terceiro" ? "block" : "none"; 
    calcularFrete();
}

function imprimirCliente() { 
    document.body.classList.add('print-client'); 
    window.print(); 
    document.body.classList.remove('print-client'); 
}

function imprimirInterno() {
    window.print();
}

function enviarWhatsApp() {
    let cliente = document.getElementById("nomeCliente").value || "Cliente";
    let obs = document.getElementById("obsOrcamento").value;
    let total = document.getElementById("precoVendaFinal").innerText;
    let pagto = document.getElementById("formaPagamento").value;
    let prazo = document.getElementById("prazoEntrega").value;
    let validade = document.getElementById("dataValidade").innerText;
    
    let txt = `Olá *${cliente}*, tudo bem?\n`;
    txt += `Segue o orçamento solicitado na *JL EQUIPAMENTOS*:\n\n`;
    
    if (orcamento.length > 0) {
        txt += `📋 *DESCRIÇÃO DOS SERVIÇOS:*\n`;
        orcamento.forEach(i => {
            txt += `▪ ${i.descricao}\n`;
        });
    }

    txt += `\n💰 *INVESTIMENTO TOTAL: ${total}*\n`;
    txt += `📅 Validade: ${validade}\n`;

    if(pagto) txt += `💳 Pagamento: ${pagto}\n`;
    if(prazo) txt += `🚚 Entrega: ${prazo}\n`;

    if(obs) txt += `\n📝 *Nota:* ${obs}\n`;
    
    txt += `\n_Ficamos à disposição!_\n*Att, JL Equipamentos*`;

    window.open(`https://wa.me/?text=${encodeURIComponent(txt)}`, '_blank');
}

function gerarExcelInterno() {
    let csv = `ITEM;VALOR\n`;
    orcamento.forEach(i => csv += `${i.descricao};${i.custo.toFixed(2).replace('.', ',')}\n`);
    csv += `\nTOTAL VENDA;${document.getElementById("precoVendaFinal").innerText}`;
    
    let blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    let link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Relatorio_Interno_${idAtual}.csv`;
    link.click();
}

function abrirMapa() { window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(document.getElementById("enderecoEntrega").value)}`, '_blank'); }
function abrirWaze() { window.open(`https://waze.com/ul?q=${encodeURIComponent(document.getElementById("enderecoEntrega").value)}`, '_blank'); }