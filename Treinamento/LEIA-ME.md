# Treinamento interativo — sensor indutivo e forma de 90 g

## Abrir

O arquivo de distribuição é [Treinamento_sensor_indutivo.html](dist/Treinamento_sensor_indutivo.html). Ele contém a aplicação, Three.js e os dois modelos GLB. Não precisa de servidor, instalação, CDN ou conexão com a internet para funcionar.

No computador, abra esse HTML no Microsoft Edge. No Android, baixe o HTML completo para o dispositivo, por exemplo para Downloads, e use a opção de abrir com um navegador no gerenciador de arquivos. A prévia do SharePoint não substitui o arquivo baixado. A associação de arquivos HTML depende do gerenciador e das permissões do Android; se o dispositivo apenas mostrar o código ou bloquear JavaScript, será necessário escolher um aplicativo que abra HTML como página web. Não há aplicativo Android/APK nesta entrega.

Validado no Microsoft Edge de desktop, abrindo por `file://` com a rede bloqueada, e com emulação de tela/toque de tablet. A abertura pelo gerenciador e o desempenho em um tablet Android físico ainda precisam ser conferidos no equipamento de destino. Requer navegador com WebGL 2.

## Usar a bancada

- **Iniciar/Pausar:** ciclo de avanço e parada de seis formas. Tempo parado de 0 a 15 s (padrão 3 s; zero permite movimento contínuo). A velocidade vai de 5 a 200 mm/s; valores baixos permitem câmera lenta.

- **Avanço das formas:** controle manual de um ciclo completo. Mover esse controle pausa a animação. Os botões −1 mm e +1 mm permitem examinar a transição no vão.

- **Altura do conjunto:** sobe chapa, pezinho e sensor. A folga inicial sob o pezinho é 4,5 mm; pequenas variações passam sem contato.
- **Altura efetiva do sensor:** move apenas o sensor pelas porcas. O valor mostrado é a distância vertical do centro da ponta à aba assentada, compensando altura do conjunto e inclinação. O padrão é 6 mm. O reset restaura a posição individual nas porcas, preservando a altura do conjunto. Subir o conjunto e baixar o sensor pode deixar o pezinho acima da ponta, anulando a proteção.

- **Posição sobre a aba da forma:** move o conjunto entre a borda externa e a raiz do V. O afastamento da parede é representado por espaçadores, sem deformação da chapa.

- **Alinhamento na parada:** move sensor, suporte e parede no sentido de passagem. O avanço tem passo fixo médio, independente do sensor; vãos irregulares deslocam as abas nas paradas.
- **Inclinação:** gira ao redor do parafuso superior, no sentido de passagem. O parafuso inferior e seu espaçador desaparecem enquanto a inclinação não for zero.

- **Proteção do pezinho:** habilita a guia e sua ação de acomodação da forma elevada. Desabilitar oculta a extensão protetora. O deslocamento vertical é uma aproximação cinemática, não uma simulação de forças.

- **Variações:** elevação/vibração, desalinhamento lateral, vão médio e variação dos vãos. O vão padrão é 0,5 mm e o desalinhamento é limitado a ±3 mm. Os efeitos funcionam também no avanço manual e são repetíveis. Com vão zero ainda existe o V geométrico dos chanfros.

- **Parar por impacto:** somente o contato da forma com a ponta bloqueia o automático. Ausência de leitura ou sinal contínuo não interrompem o ciclo. Corrija, use **Rearmar ciclo** e depois **Iniciar**. Desative para observar contatos sem bloquear.
- **Campo:** alterna entre sensor blindado e não blindado e entre nuvem de partículas e envelope animado. A visualização é sobreposta para permitir enxergar o campo mesmo onde há metal. Pode ser ocultada.

- **Interface compacta:** o botão ☰ Ajustes recolhe o painel; os botões ? abrem explicações por toque. Transparência torna sensor e suporte semitransparentes, sem alterar a detecção. A parede permanece quase invisível.
- **Cena:** um dedo/mouse para girar; dois dedos para zoom e deslocamento. O dropdown de cenários substitui os botões de vista. A tela cheia depende do suporte do navegador.

- **Resets:** cada parâmetro tem seu botão ↺. O reset total restaura valores, câmera, histórico e modo manual.

O LED vermelho e o indicador de saída mostram apenas ligado/desligado, sem contador de formas. A barra e o histórico mostram a influência relativa do metal e a comutação. Ao sair da página ou bloquear a tela, a animação pausa.

## Modelo didático

O sensor tem alcance nominal informado de 10 mm. Não foi identificada uma ficha técnica específica. A forma mantém a geometria CAD e as dimensões originais; o sensor e o suporte são aproximações visuais. A forma é movimentada sobre duas barras de nylon com 10 mm de largura, afastadas para dar folga lateral, sob as abas da forma.

A detecção usa amostras ponderadas do campo sobre o contorno superior da aba, incluindo seus chanfros. O efeito da distância diminui continuamente. O modelo também considera o acoplamento com a parede metálica vertical junto à raiz do V, mais forte no não blindado. Assim, uma regulagem próxima dessa raiz pode manter o sinal ligado mesmo entre formas.

O índice vai de 0 a 100% e não representa uma grandeza física medida. O limiar de ligar é 50%; o de desligar, 47%. Essa histerese foi escolhida para a demonstração e não é uma especificação do equipamento. A resposta de uma aba estreita pode ser menor que a de um alvo plano grande, mesmo a uma distância inferior a 10 mm.

O alcance e o formato reais do campo dependem do sensor, alvo e montagem. A troca blindado/não blindado muda a distribuição e o cálculo conceitual; a carcaça permanece a mesma. Não há simulação eletromagnética por elementos finitos, elasticidade da chapa, circuito elétrico, desgaste nem dinâmica de corpos rígidos. O contato aproximado com a ponta pode bloquear a animação quando Parar por impacto está ativo. A altura efetiva da forma participa do cálculo do campo e do contato. A guia reduz a elevação na entrada; a forma só é rebaixada quando excede a folga do pezinho e volta à altura livre depois de passar pelo sensor. Uma aba alta pode manter o sinal ligado no vão mesmo sem impacto. A guia pode reduzir uma elevação, mas não torna segura uma altura de sensor abaixo do plano normal das formas.

Referências conceituais: [Baumer — princípio indutivo e histerese](https://www.baumer.com/us/en/service-support/function-principle/working-principle-and-technology-of-inductive-sensors/a/Know-how_Function_Inductive-sensors) e [ifm — tecnologia indutiva](https://www.ifm.com/us/en/us/overview/inductive/technology-overview/tech-overview). Links apenas para consulta; não são carregados pela aplicação.

## Arquivos e manutenção

- [Interface e cena](src/app.js)

- [Cálculo didático independente](src/simulation.js)

- [Estrutura da interface](src/index.html)

- [Estilos responsivos](src/style.css)

- [Empacotador de HTML único](build.mjs)

- [Testes da simulação](tests/simulation.test.mjs)

- [Validação no Edge offline](tests/browser.mjs)

Para desenvolver: `npm ci`, `npm test`, `npm run build`. Para repetir o teste de navegador: `node tests/browser.mjs` (usa Microsoft Edge instalado no caminho padrão do Windows). Node e npm são necessários apenas para desenvolvimento; não para abrir o HTML entregue.

O build incorpora os modelos de `../Modelos/Sensor_indutivo_M18/sensor_M18_com_suporte.glb` e `../Modelos/Forma_90g/forma_90g.glb`. Ao atualizar os modelos, gere novamente o HTML. Three.js é distribuído sob licença MIT, incluída no próprio HTML.


## Altura por forma, enquadramento e marcas de impacto

Cada forma recebe uma altura própria, praticamente constante na passagem (oscilação residual de até 0,08 mm). O pezinho pode reduzir essa altura quando ela excede a folga disponível.

A câmera inicia mirando o centro da ponta, mas não acompanha ajustes ou transições de cenário. Deslocamentos manuais continuam permitidos; Reset total recentraliza.

Ao detectar contato, a ponta fica ocre e recebe riscos no lado de entrada e na face inferior, orientados pela passagem. As marcas são ilustrativas, não alteram a física e desaparecem automaticamente quando não há mais contato.

O desalinhamento lateral também é fixo por forma: cada peça mantém seu deslocamento durante a passagem, dentro de ±3 mm, sem oscilação lateral.

## Mapa do ciclo

O painel inferior calcula os centros das seis formas e dos seis vãos sob a ponta, na ordem de passagem a partir de T=0. IDs são fixos por peça: no ajuste inicial a Forma 1 está sob o sensor, mesmo que outras apareçam antes dela na tela. Vão A–B identifica as peças vizinhas. Toque em uma barra para pausar e examinar esse ponto.

As barras mostram influência e limiar de 50%, recalculados ao mudar os ajustes físicos. O aviso de contato corresponde somente ao ponto amostrado, não garante ausência de impacto em outras posições da passagem. A previsão inclui pontos posteriores a um possível bloqueio. Centros geométricos podem diferir das posições de parada quando há desalinhamento ou vãos irregulares. Os valores são determinísticos; a saída binária na faixa de histerese (47–50%) também depende do estado anterior e por isso não é prevista pela barra.

O mapa também informa, para cada vão, a menor influência entre os centros das duas formas vizinhas, amostrada com espaçamento de até 1 mm. Esse mínimo não precisa coincidir com o centro geométrico do vão. Ele não prevê toda a sequência binária de comutação.

### Diagnóstico do vão 5–6

Com posição sobre a aba 2,4 mm, diferença de altura 3 mm, desalinhamento lateral 2 mm e variação de vãos 2,5 mm (demais ajustes padrão), o centro do vão fica em 24,876% do ciclo, com influência de 50,308%. O mínimo próximo é 37,352%, em aproximadamente 25,57%. Avançando desde T=0, a saída desliga em aproximadamente 25,18% e religa em 26,64%. Não há atraso: isso já aparece em avaliações estáticas da geometria. A contribuição da parede lateral da forma que sai permanece alta no centro do vão e depois cai; a contribuição da aba seguinte aumenta mais adiante.

Esse comportamento é uma consequência do cálculo didático existente, que usa a maior contribuição entre superfície e acoplamento lateral por distância. Não comprova que o sensor real terá essa curva. Nenhum deslocamento temporal ou ajuste arbitrário de campo foi aplicado para forçar o mínimo ao centro.

[Gráfico do caso](diagnostico/vao-5-6.svg) · [Amostras do ciclo completo](diagnostico/ciclo-completo.csv). Para reproduzir: `node scripts/diagnosticar-vao.mjs`.

## Cenários e interface atual

O seletor oferece os oito cenários definidos para o treinamento, com seus focos entre parênteses. A seleção pausa a passagem, preserva o avanço atual e interpola os ajustes durante 3 segundos. Selecionar outro cenário durante a transição parte da posição corrente. Alterar um ajuste manualmente cancela a transição. Parâmetros não especificados voltam ao padrão; os cenários 2–8 recebem as variações comuns e alinhamento de 25 mm, exceto o cenário 8 com 55 mm. Alturas são efetivas, inclusive com inclinação.

Painel de ajustes e mapa começam recolhidos. O campo padrão é o envelope animado. Posição sobre a aba varia de −7 a +7 mm, vão de 0 a 4 mm e variação dos vãos de 0 a 10 mm.

No mapa atual, as formas mostram o centro e os vãos mostram o mínimo entre centros vizinhos (amostragem de até 1 mm). A barra, o aviso de contato e o clique correspondem a esse ponto mínimo, não ao centro geométrico do vão. O mapa é atualizado ao expandi-lo e ao alterar parâmetros, depois de terminar a transição.

Os cenários ficam na barra de reprodução, junto de ≪ / Iniciar / ≫ (passos de 1 mm). O status do ciclo e os avisos ficam reunidos. A saída é indicada pelo LED do modelo, com emissão reforçada; o cartão de saída foi removido. Transparência está em Regulagem, junto da proteção do pezinho. A câmera permanece independente dos movimentos do sensor; Reset total restaura o enquadramento inicial.
