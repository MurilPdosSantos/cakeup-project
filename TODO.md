Você é um engenheiro de software sênior especialista em **frontend moderno, UX interativo e aplicações React performáticas**.

Crie **uma funcionalidade de montagem de bolo personalizado que fará parte de uma Landing Page chamada "Template"**.

Essa funcionalidade não é um módulo separado e deve ser implementada como **uma seção/feature dentro da página**, integrada ao layout existente.

Tecnologias esperadas:

* React
* TailwindCSS
* Framer Motion para animações
* Estado controlado com useState ou Zustand
* Código limpo e bem organizado

---

# Objetivo da funcionalidade

Permitir que o usuário **monte um bolo personalizado diretamente na Landing Page**, escolhendo:

* Massa
* Peso
* Combinações de recheios por camada

O sistema deve:

* Calcular o **valor total em tempo real**
* Exibir uma **visualização dinâmica do bolo**
* Atualizar a visualização conforme o usuário monta o bolo

---

# 1. Etapa inicial — Informações do cliente

Antes da montagem, deve existir uma pequena etapa solicitando:

* Nome completo
* Telefone com DDD
* CPF

Regras importantes:

Essas informações:

* **não devem ser salvas no servidor**
* **não devem ser armazenadas em cookies**
* **não devem usar localStorage**

Devem existir **apenas em variáveis temporárias de estado no frontend**.

Após preenchimento válido, permitir continuar para a montagem.

Validações mínimas:

* Nome obrigatório
* Telefone no formato brasileiro
* CPF com validação de formato

---

# 2. Layout da funcionalidade

A interface deve ser dividida em duas áreas:

### Área esquerda

Inputs de configuração do bolo.

### Área direita

Visualização gráfica do bolo que muda conforme as escolhas do usuário.

A seção deve ser **responsiva e funcionar bem em mobile e desktop**.

---

# 3. Inputs principais

### Massa

Um select onde o usuário escolhe o tipo de massa.

Exemplo:

* Chocolate
* Baunilha
* Red Velvet
* Pão de ló

Cada massa possui um **valor base**.

---

### Peso

Select ou slider.

Exemplo:

* 1kg
* 2kg
* 3kg
* 4kg

O peso influencia diretamente no cálculo do valor final.

---

# 4. Sistema de camadas de recheio

Cada camada possui **duas combinações de recheio**.

Estrutura:

COMB1 + COMB2 → CAMADA1
COMB3 + COMB4 → CAMADA2
COMB5 + COMB6 → CAMADA3

Cada COMB deve ser um select de recheios.

Exemplos de recheios:

* Brigadeiro
* Ninho
* Morango
* Doce de leite
* Ganache
* Creme de avelã

Cada recheio possui um **valor adicional**.

---

# 5. Exibição progressiva das camadas

Inicialmente apenas **CAMADA1 deve aparecer**.

As outras camadas devem existir no estado interno, porém **não visíveis inicialmente**.

Abaixo da camada atual deve existir um botão:

"Customizar próxima camada"

Comportamento:

Ao clicar:

* Revela a próxima camada
* Anima a entrada usando Framer Motion

Fluxo:

CAMADA1 → botão → CAMADA2
CAMADA2 → botão → CAMADA3

Após a terceira camada o botão desaparece.

---

# 6. Cálculo do valor total

O valor deve atualizar automaticamente sempre que o usuário alterar algum input.

Fórmula:

ValorTotal = Peso × ( Massa + ( CAMADA1 + CAMADA2 + CAMADA3 ) )

Onde:

CAMADA1 = COMB1 + COMB2
CAMADA2 = COMB3 + COMB4
CAMADA3 = COMB5 + COMB6

Exibir o **valor final em destaque na interface**.

---

# 7. Visualização dinâmica do bolo

Ao lado dos inputs deve existir uma **representação visual de um bolo**, construída com:

* divs
* gradients
* cores
* bordas

A visualização deve simular **camadas empilhadas de bolo**.

Comportamento esperado:

* Mostrar camadas conforme são habilitadas
* Alterar cores conforme os recheios selecionados
* Crescer verticalmente quando novas camadas aparecem
* Ter animações suaves com Framer Motion

Estrutura visual sugerida:

Topo do bolo
Camada 3
Camada 2
Camada 1
Base

Cada camada deve refletir visualmente os recheios escolhidos.

---

# 8. Estrutura de componentes sugerida

CakeBuilderSection

Componentes internos:

CustomerInfoStep
CakeConfigurationInputs
LayerConfiguration
CakePreview
TotalPriceDisplay

---

# 9. Experiência do usuário

A funcionalidade deve:

* Atualizar valores instantaneamente
* Ter animações suaves
* Manter layout limpo
* Ser intuitiva
* Funcionar perfeitamente em mobile

---

# Resultado esperado

Uma **funcionalidade interativa dentro da Landing Page** que permite ao usuário montar um bolo personalizado, visualizar as camadas em tempo real e ver o preço final calculado automaticamente.
