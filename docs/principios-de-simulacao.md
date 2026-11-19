# Princípios dos simuladores de cenários

## 1. Tornar relações visíveis

O simulador deve explicar causa e efeito. Cada controle precisa produzir uma mudança observável na cena e, quando pertinente, em um indicador quantitativo. Animações de transição devem ajudar a perceber a mudança, não apenas decorar a interface.

## 2. Separar fato, aproximação e hipótese

Dimensões medidas, parâmetros assumidos e simplificações didáticas devem ser identificados. Um simulador não deve sugerir precisão física que o modelo não possui. Limites e fenômenos ausentes ficam acessíveis na própria experiência e na documentação.

## 3. Ensinar por cenários, permitir exploração

Cenários nomeados apresentam situações relevantes e reproduzíveis. Depois deles, controles manuais permitem investigar variações. Um reset total sempre devolve um estado conhecido; resets locais preservam o restante do experimento.

## 4. Mostrar estado e consequência

A interface deve responder claramente: o que está acontecendo, por que importa e como corrigir. Estados normais, atenção e risco usam texto, forma e cor — nunca somente cor. Falhas bloqueantes devem indicar a condição de recuperação.

## 5. Manter o objeto como protagonista

A cena 3D ocupa a área principal. Controles são agrupados pela intenção do usuário, com detalhes progressivos e valores/unidades próximos aos ajustes. A câmera deve começar em um enquadramento útil e oferecer retorno previsível ao estado inicial.

## 6. Funcionar no contexto real

Projetar primeiro para o dispositivo, conectividade e modo de distribuição reais. Controles devem aceitar mouse e toque, textos devem permanecer legíveis em telas compactas e a experiência essencial não deve depender de rede quando o uso for offline.

## 7. Ser determinístico e verificável

O mesmo cenário deve produzir o mesmo resultado. O cálculo do domínio fica separado da renderização sempre que possível e recebe testes automatizados. Builds entregáveis devem ser reproduzíveis a partir das fontes e dos ativos versionados.

## 8. Evoluir sem perder coerência

Novos simuladores reutilizam vocabulário, tokens e padrões de interação, mas não copiam cegamente a composição de uma bancada anterior. Mudanças transversais começam na documentação compartilhada e são adotadas gradualmente pelos projetos.

