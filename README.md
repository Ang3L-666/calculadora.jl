# Sistema JL - ERP Industrial

![Versão](https://img.shields.io/badge/version-2.2-blue.svg)
![Status](https://img.shields.io/badge/status-active-success.svg)
![Licença](https://img.shields.io/badge/license-Private-red.svg)

Sistema web de gestão e orçamentos industriais desenvolvido sob medida para a **JL Equipamentos**.
A plataforma automatiza o cálculo de materiais (Aço Inox, Carbono, Alumínio), precificação de serviços de solda e geração de propostas comerciais instantâneas integradas ao WhatsApp.

---------------------

## Histórico de Atualizações

### Versão 2.0 - Separação Comercial/Oficina (Atual)
Foco total na **privacidade de dados** e fluxos de trabalho distintos:
* **Dupla Visualização:** Botão "PDF Cliente" (Proposta limpa) vs. "Relatório Interno" (Custos, Lucros e Gráficos).
* **WhatsApp Comercial:** Texto de envio reescrito com tom cordial e profissional.

### Versão 1.9 - UX Inteligente (Tarugos e Tubos)
Refinamento da lógica baseado no feedback de chão de fábrica:
* **Lógica Condicional:** Ocultamento automático do campo "Parede" ao selecionar Tarugo (Maciço).
* **Atalhos:** Menu de pré-definição para serviços comuns (Solda, Instalação).

### Versão 1.7 - Padrão de Código (Refatoração)
Ajustes estruturais sugeridos por code review sênior:
* **Clean Code:** Organização de recursos estáticos na pasta `assets/img`.
* **Unidades de Medida:** Implementação de seletor para cobrar serviços por $m$, $m^2$ ou Unidade.

### Versão 1.6 - Segurança de Input (Validação)
Correção crítica para evitar erros de digitação comuns:
* **Sanitização:** Conversão automática de vírgula (`,`) para ponto (`.`) em todos os campos numéricos.
* **Placeholders:** Exemplos visuais (Ex: "1.2") para guiar o preenchimento da espessura.

### Versão 1.4 - Layout de Impressão (CSS Print)
Uma grande mudança visual do projeto:
* **Visual de Recibo:** Estilização específica para impressão, ocultando botões e menus, transformando a tela em um documento formal.

### Versão 1.0 - MVP (Produto Mínimo Viável)
* **Origem:** Calculadora simples de peso para chapas de Aço Inox, focada em substituir a conta manual no papel.

---------------------

## Funções Principais

### Módulo Comercial (Vendas)
* **Cálculo Automático de Peso:** Algoritmo preciso baseado na densidade do material (Ex: Inox 304 = 8,0 g/cc).
* **Orçamentos Rápidos:** Gera propostas com validade, condições de pagamento e entrega.
* **Integração WhatsApp:** Envia o pedido formatado diretamente para o aplicativo do cliente.
* **PDF Inteligente:** Gera PDFs de apresentação sem revelar margens de lucro ou custos de produção.

### Módulo de Produção (Oficina)
* **Relatório de Custos:** Visão detalhada de Matéria-prima x Mão de Obra.
* **Controle de Margem:** Gráficos em tempo real mostrando o Lucro Líquido esperado.
* **Logística:** Calculadora de frete (Veículo Próprio x Terceirizado).
* **Banco de Materiais:** Suporte a Chapas, Tubos Quadrados, Redondos, Retangulares e Tarugos Maciços.
  
---------------------

## Tecnologias

O projeto foi construído focado em **desempenho** e **portabilidade**, rodando inteiramente no navegador (Client-side) sem necessidade de instalação complexa.

| Tecnologia | Uso |
|------------|-----|
| ![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white) | Estrutura semântica |
| ![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white) | Estilização responsiva e Layout de Impressão |
| ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black) | Lógica de negócios e cálculos matemáticos |
| **Chart.js** | Geração de gráficos financeiros |
| **Local Storage** | Persistência de dados local (Histórico) |

-------------

## 📂 Estrutura do Projeto

```bash
/
├── 📁 assets/         # Recursos estáticos
│   └── 📁 img/        # Logos e ícones do sistema
├── index.html         # Dashboard Principal
├── style.css          # Estilos e regras @media print
├── script.js          # Core do sistema (Cálculos e Eventos)
└── README.md          # Documentação
