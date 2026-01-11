
const DENSIDADES = { "304": 8000, "430": 7740, "galv": 7870 };
let orcamento = [];
let totalItensAcumulado = 0;

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
        document.getElementById("consumoVeiculo").value = dados.consumo || "10";
        document.getElementById("precoCombustivel").value = dados.gasolina || "6.00";
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
        prazo: document.getElementById("prazoEntrega").value,
        consumo: document.getElementById("consumoVeiculo").value,
        gasolina: document.getElementById("precoCombustivel").value
    };
    localStorage.setItem('jl_orcamento_temp', JSON.stringify(dados));
}


function adicionarChapa() {
    let mat = document.getElementById("tipoMaterial").value;
    let precoKg = parseFloat(document.getElementById("precoKg").value);
    let comp = parseFloat(document.getElementById("comprimento").value);
    let larg = parseFloat(document.getElementById("largura").value);
    let esp = parseFloat(document.getElementById("espessura").value);

    if (isNaN(comp) || isNaN(larg) || isNaN(precoKg)) { alert("Preencha as medidas e o preço do aço!"); return; }

    let peso = (comp * larg * (esp / 1000)) * DENSIDADES[mat];
    orcamento.push({ descricao: `Chapa ${mat} ${esp}mm (${comp}x${larg}m)`, custo: peso * precoKg });
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
    if (formato === "quadrado") {
        area = (mA * mA) - (Math.pow(mA - (2 * esp), 2));
    } else if (formato === "retangular") {
        let mB = parseFloat(document.getElementById("medidaTubo2").value) / 1000;
        area = (mA * mB) - ((mA - 2 * esp) * (mB - 2 * esp));
    } else { 
        area = Math.PI * (Math.pow(mA / 2, 2) - Math.pow((mA / 2) - esp, 2));
    }

    let peso = area * comp * DENSIDADES[mat];
    orcamento.push({ descricao: `Tubo ${mat} ${formato} (${(mA*1000).toFixed(0)}mm)`, custo: peso * precoKg });
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
        tbody.innerHTML += `
            <tr>
                <td>${item.descricao}</td>
                <td align="right">R$ ${item.custo.toFixed(2)}</td>
                <td align="center"><button class="btn-del" onclick="removerItem(${i})">x</button></td>
            </tr>`;
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
    } else {
        valor = parseFloat(document.getElementById("valorFreteTerceiro").value) || 0;
    }

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
    let lucro = custoProd * (margem / 100);
    let subtotal = custoProd + lucro + frete;
    let final = subtotal - desc;

    document.getElementById("custoProducao").innerText = "R$ " + custoProd.toFixed(2);
    document.getElementById("precoVendaFinal").innerText = "R$ " + final.toFixed(2);
    document.getElementById("lucroLiquido").innerText = "Lucro Líq: R$ " + (lucro - desc).toFixed(2);
}


function enviarWhatsApp() {
    let cliente = document.getElementById("nomeCliente").value || "Cliente";
    let endereco = document.getElementById("enderecoEntrega").value || "Não inf.";
    let pagto = document.getElementById("formaPagamento").value || "A Combinar";
    let prazo = document.getElementById("prazoEntrega").value || "A Combinar";
    let total = document.getElementById("precoVendaFinal").innerText;

    let txt = `*JL EQUIPAMENTOS - ORÇAMENTO*\n`;
    txt += `Cliente: *${cliente}*\n`;
    txt += `Entrega: ${endereco}\n`;
    txt += `--------------------------------\n`;
    orcamento.forEach(i => txt += `• ${i.descricao}: R$ ${i.custo.toFixed(2)}\n`);
    txt += `--------------------------------\n`;
    txt += `*TOTAL FINAL: ${total}*\n`;
    txt += `--------------------------------\n`;
    txt += `Condição Pagto: ${pagto}\n`;
    txt += `Previsão Entrega: ${prazo}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(txt)}`, '_blank');
}

function enviarWhatsAppInterno() {
    let cliente = document.getElementById("nomeCliente").value || "Cliente";
    let data = new Date().toLocaleDateString();
    let mat = totalItensAcumulado;
    let mo = parseFloat(document.getElementById("custoMaoObra").value) || 0;
    let lucroLiq = document.getElementById("lucroLiquido").innerText;
    let total = document.getElementById("precoVendaFinal").innerText;

    let txt = `🔐 *RELATÓRIO INTERNO - JL*\n`;
    txt += `Ref: ${cliente} | ${data}\n`;
    txt += `--------------------------------\n`;
    txt += `🔩 Material: R$ ${mat.toFixed(2)}\n`;
    txt += `👷 Mão de Obra: R$ ${mo.toFixed(2)}\n`;
    txt += `💰 ${lucroLiq}\n`;
    txt += `✅ VENDA: ${total}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(txt)}`, '_blank');
}

function gerarExcelInterno() {
    let cliente = document.getElementById("nomeCliente").value || "Cliente";
    let csv = `RELATORIO JL\nCLIENTE;${cliente}\n\nITEM;DESC;VALOR\n`;
    orcamento.forEach(i => csv += `Item;${i.descricao};${i.custo.toFixed(2).replace('.', ',')}\n`);
    let final = document.getElementById("precoVendaFinal").innerText.replace('R$ ', '').replace('.', ',');
    csv += `\n;TOTAL VENDA;${final}`;
    let blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    let link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Orcamento_${cliente}.csv`;
    link.click();
}

function imprimirCliente() {
    document.body.classList.add('print-client');
    window.print();
    document.body.classList.remove('print-client');
}

function imprimirInterno() {
    document.body.classList.add('print-internal');
    window.print();
    document.body.classList.remove('print-internal');
}

function removerItem(i) { orcamento.splice(i, 1); atualizarTabela(); }
function limparOrcamento() { if(confirm("Limpar tudo?")) { localStorage.removeItem('jl_orcamento_temp'); location.reload(); } }
function atualizarMargem() { document.getElementById("labelMargem").innerText = document.getElementById("margemLucroRange").value + "%"; calcularTotalFinal(); }
function mudarLabelTubo() { document.getElementById("boxMedida2").style.display = document.getElementById("formatoTubo").value === "retangular" ? "block" : "none"; }
function alternarTipoFrete() { 
    document.getElementById("boxFreteProprio").style.display = document.getElementById("tipoFrete").value === "proprio" ? "block" : "none"; 
    document.getElementById("boxFreteTerceiro").style.display = document.getElementById("tipoFrete").value === "terceiro" ? "block" : "none"; 
    calcularFrete();
}