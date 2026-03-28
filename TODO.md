# 1 - Mudar Paleta de Cores.

- Paleta Principal
#1A6F4A
#F4A01C
#1B3D2F

- Apoio e Neutros
#E8F5EE
#FEF6E4
#F5F5F3
#2E2E2C

**Migração para nova paleta:**

Você é um especialista em design systems e refatoração de código frontend.

Sua tarefa é migrar a paleta de cores atual de um sistema para uma nova paleta, mantendo toda a lógica, estrutura e funcionalidades intactas. Apenas as cores devem mudar.

━━━ PALETA ATUAL ━━━
Mapeie e substitua todas as ocorrências das cores abaixo:
[COLE AQUI AS CORES ATUAIS DO SISTEMA — ex: variáveis CSS, tokens, hex codes, classes Tailwind]

Exemplo:
  --color-primary: #3B82F6;
  --color-accent: #F59E0B;
  --color-bg: #FFFFFF;
  --color-text: #111827;

━━━ NOVA PALETA ━━━
Substitua pelas seguintes cores, respeitando o papel semântico de cada uma:

  Primária (ação principal, CTA, links):  #1A6F4A
  Acento (destaques, urgência positiva):  #F4A01C
  Fundo escuro / header:                  #1B3D2F
  Fundo suave verde (cards, surfaces):    #E8F5EE
  Fundo suave âmbar (badges, alertas):    #FEF6E4
  Fundo neutro (page background):         #F5F5F3
  Texto principal:                        #2E2E2C
  Texto secundário / muted:              #6B6B69

━━━ REGRAS DE SUBSTITUIÇÃO ━━━
1. Preserve 100% da estrutura do código — não refatore, não reorganize, não renomeie variáveis
2. Substitua cor por cor seguindo o papel semântico (primária → primária, acento → acento, etc.)
3. Se houver variações de opacidade (ex: rgba(59,130,246,0.2)), recalcule usando o RGB da nova cor correspondente
4. Se houver tons derivados (ex: lighten/darken de uma primária), derive os mesmos tons a partir da nova primária #1A6F4A
5. Mantenha todos os estados de hover, focus e disabled — ajuste apenas o valor da cor base
6. Se o sistema usa tokens ou variáveis CSS, atualize apenas os valores, nunca os nomes das variáveis
7. Não altere nenhuma propriedade que não seja relacionada a cor (tamanho, espaçamento, fonte, etc.)

━━━ CÓDIGO A MIGRAR ━━━
[COLE AQUI O CÓDIGO DO SISTEMA — pode ser CSS, Tailwind config, tokens JSON, SCSS, styled-components, etc.]

━━━ ENTREGA ESPERADA ━━━
- O mesmo código com as cores substituídas
- Um sumário ao final listando cada substituição feita no formato:
  [COR ANTIGA] → [COR NOVA] — [onde foi aplicada]
- Alertas sobre qualquer cor que não teve correspondente claro na nova paleta

# 2 - Adicionar atributo "modules" para o banco de dados das lojas
- Ex: Pedidos, Montagem etc.

# 3 - Criar e configurar migrations para alterações no banco de dados, sem dar erro no banco atual

# 4 Configurar módulos

Módulos Globais:
- Métricas
- Cardápio
- Produtos
- Faturas

Módulos adicionados a parte:
- Montagem