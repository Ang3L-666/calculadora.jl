const DENSIDADES = { "304": 8.00, "430": 7.74, "galv": 7.87 };
let orcamento = [];
let totalItensAcumulado = 0;
let meuGrafico = null;

window.onload = function() {
    let salvo = localStorage.getItem('jl_orcamento_temp');
    if (salvo) {
        let dados = JSON.parse(salvo);
        orcamento = dados.itens || [];
        document.getElementById("nomeCliente").value = dados.cliente || "";
        document.getElementById("enderecoEntrega").value = dados.endereco || "";
        document.getElementById("tipoMaterial").value = dados.material || "304";
        document.getElementById("precoKg").value = dados.precoKg || "";
        document.getElementById("formaPagamento").value = dados.pagto || "";
        document.getElementById("prazoEntrega").value = dados.prazo || "";
        atualizarTabela();
    }
};

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

function adicionarChapa() {
    let mat = document.getElementById("tipoMaterial").value;
    let precoKg = parseFloat(document.getElementById("precoKg").value);
    let comp = parseFloat(document.getElementById("comprimento").value);
    let larg = parseFloat(document.getElementById("largura").value);
    let esp = parseFloat(document.getElementById("espessura").value);
    if (isNaN(comp) || isNaN(larg) || isNaN(precoKg)) { alert("Preencha os dados!"); return; }
    let custo = (comp * larg * (esp / 1000)) * (DENSIDADES[mat] * 1000) * precoKg;
    orcamento.push({ descricao: `Chapa ${mat} ${esp}mm (${comp}x${larg}m)`, custo });
    atualizarTabela();
}

function adicionarTubo() {
    let mat = document.getElementById("tipoMaterial").value;
    let precoKg = parseFloat(document.getElementById("precoKg").value);
    let formato = document.getElementById("formatoTubo").value;
    let mA = parseFloat(document.getElementById("medidaTubo").value) / 1000;
    let esp = parseFloat(document.getElementById("espessuraTubo").value) / 1000;
    let comp = parseFloat(document.getElementById("comprimentoTubo").value);
    if (isNaN(mA) || isNaN(comp) || isNaN(precoKg)) { alert("Dados incompletos!"); return; }
    let area = 0;
    if (formato === "quadrado") area = (mA * mA) - (Math.pow(mA - (2 * esp), 2));
    else if (formato === "retangular") {
        let mB = parseFloat(document.getElementById("medidaTubo2").value) / 1000;
        area = (mA * mB) - ((mA - 2 * esp) * (mB - 2 * esp));
    } else area = Math.PI * (Math.pow(mA / 2, 2) - Math.pow((mA / 2) - esp, 2));
    orcamento.push({ descricao: `Tubo ${mat} ${formato} (${mA*1000}mm)`, custo: area * comp * (DENSIDADES[mat] * 1000) * precoKg });
    atualizarTabela();
}

function adicionarAcessorio() {
    let nome = document.getElementById("nomeAcessorio").value;
    let qtd = parseFloat(document.getElementById("qtdAcessorio").value);
    let vlr = parseFloat(document.getElementById("precoAcessorio").value);
    if (!nome || isNaN(qtd)) return;
    orcamento.push({ descricao: `${qtd}x ${nome}`, custo: qtd * vlr });
    atualizarTabela();
}

function adicionarSolda() {
    let m = parseFloat(document.getElementById("metrosSolda").value);
    let c = parseFloat(document.getElementById("custoMetroSolda").value);
    if (isNaN(m)) return;
    orcamento.push({ descricao: `Soldagem (${m}m)`, custo: m * c });
    atualizarTabela();
}

function atualizarTabela() {
    let tbody = document.getElementById("listaItens");
    tbody.innerHTML = "";
    totalItensAcumulado = 0;
    orcamento.forEach((item, i) => {
        totalItensAcumulado += item.custo;
        tbody.innerHTML += `<tr><td>${item.descricao}</td><td align="right">R$ ${item.custo.toFixed(2)}</td><td align="center"><button class="btn-del" onclick="removerItem(${i})">x</button></td></tr>`;
    });
    document.getElementById("totalMaterial").innerText = "R$ " + totalItensAcumulado.toFixed(2);
    salvarProgresso();
    calcularTotalFinal();
}

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
            labels: ['Material', 'Mão de Obra', 'Extras', 'Frete', 'Lucro Líquido'],
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
    let txt = `*JL EQUIPAMENTOS - ORÇAMENTO*\n📍 *Cliente:* ${cliente}\n--------------------------------\n`;
    orcamento.forEach(i => txt += `✅ ${i.descricao}: R$ ${i.custo.toFixed(2)}\n`);
    txt += `--------------------------------\n💰 *TOTAL: ${total}*\nValidade: 5 dias.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(txt)}`, '_blank');
}

function enviarWhatsAppInterno() {
    let cliente = document.getElementById("nomeCliente").value || "Cliente";
    let lucro = document.getElementById("lucroLiquido").innerText;
    let total = document.getElementById("precoVendaFinal").innerText;
    let txt = `🔐 *RELATÓRIO INTERNO - JL*\nRef: ${cliente}\n--------------------------------\nMaterial: R$ ${totalItensAcumulado.toFixed(2)}\n${lucro}\n✅ VENDA: ${total}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(txt)}`, '_blank');
}

function gerarExcelInterno() {
    let csv = `ITEM;DESC;VALOR\n`;
    orcamento.forEach(i => csv += `Item;${i.descricao};${i.custo.toFixed(2).replace('.', ',')}\n`);
    let blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    let link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Orcamento_JL.csv`;
    link.click();
}

function imprimirCliente() { document.body.classList.add('print-client'); window.print(); document.body.classList.remove('print-client'); }
function imprimirInterno() { window.print(); }
function removerItem(i) { orcamento.splice(i, 1); atualizarTabela(); }
function limparOrcamento() { if(confirm("Limpar tudo?")) { localStorage.removeItem('jl_orcamento_temp'); location.reload(); } }
function atualizarMargem() { document.getElementById("labelMargem").innerText = document.getElementById("margemLucroRange").value + "%"; calcularTotalFinal(); }
function mudarLabelTubo() { document.getElementById("boxMedida2").style.display = document.getElementById("formatoTubo").value === "retangular" ? "block" : "none"; }
function alternarTipoFrete() { document.getElementById("boxFreteProprio").style.display = document.getElementById("tipoFrete").value === "proprio" ? "block" : "none"; document.getElementById("boxFreteTerceiro").style.display = document.getElementById("tipoFrete").value === "terceiro" ? "block" : "none"; calcularFrete(); }