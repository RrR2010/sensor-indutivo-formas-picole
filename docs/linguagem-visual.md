# Linguagem de interface e cor

## Voz e vocabulário

- Português direto, concreto e orientado à ação.
- Nomes dos controles descrevem a grandeza ou a peça; verbos ficam para ações.
- Unidades aparecem junto ao valor e seguem o domínio (`mm`, `s`, `°`, `%`).
- Mensagens seguem a sequência **estado → consequência → ação**, por exemplo: “Ciclo bloqueado: houve impacto. Eleve o sensor e rearme.”
- Termos técnicos recebem explicação curta no contexto; a ajuda extensa fica sob demanda.
- “Reset total” restaura toda a experiência; `↺` junto de um parâmetro restaura apenas aquele ajuste.

## Papéis de cor

As cores abaixo são papéis semânticos iniciais. Antes de adotar novas cores, verifique se um papel existente resolve a necessidade.

| Papel | Claro | Escuro | Uso |
| --- | --- | --- | --- |
| Fundo | `#F4F7F8` | `#101B29` | Superfície geral e cena |
| Superfície | `#FFFFFF` | `#182638` | Painéis e cartões |
| Texto | `#172331` | `#F2F6F8` | Conteúdo principal |
| Texto secundário | `#5B6873` | `#AEBCC8` | Apoio e unidades |
| Ação/informação | `#147F80` | `#2BC1BD` | Controles ativos, gráficos e foco |
| Ênfase física | `#D9A11E` | `#F1C24B` | Campo, energia ou elemento observado |
| Atenção | `#B65B20` | `#E28A4A` | Condição que pede inspeção |
| Risco/bloqueio | `#B43B32` | `#F06A5F` | Impacto e falha bloqueante |
| Sucesso/seguro | `#287A50` | `#55BE83` | Estado confirmado e seguro |

Regras:

- Contraste mínimo recomendado: 4,5:1 para texto normal e 3:1 para texto grande e componentes.
- Ação/informação não deve compartilhar a mesma aparência de risco.
- Estados incluem ícone ou rótulo além da cor.
- Materiais da cena podem ser realistas; sobreposições e indicadores seguem os papéis semânticos.

## Forma, espaço e movimento

- Escala de espaçamento: `4, 8, 12, 16, 24, 32 px`.
- Raio padrão: `8 px`; cartões de destaque podem usar `12 px`.
- Área mínima de toque: `44 × 44 px`.
- Foco de teclado visível com contorno de pelo menos `2 px`.
- Transições de interface: `120–240 ms`. Transições didáticas podem durar mais quando mostram uma sequência causal e devem poder ser interrompidas.
- Respeitar `prefers-reduced-motion`; nenhuma informação pode depender apenas de animação.

## Arquitetura comum da experiência

1. Cabeçalho: nome do laboratório, status operacional e ações globais.
2. Cena: objeto, feedback físico e navegação de câmera.
3. Reprodução: iniciar/pausar, avanço manual e seleção de cenário.
4. Ajustes: grupos por intenção, com ajuda contextual e reset local.
5. Evidência: métricas, histórico ou mapa que sustentem a interpretação.
6. Ajuda: princípio de funcionamento, limites e fontes.

