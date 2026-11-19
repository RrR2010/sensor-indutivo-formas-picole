# Laboratório de simuladores 3D

Este repositório reúne simuladores didáticos 3D e os artefatos necessários para mantê-los. Cada projeto é autocontido; decisões que devem permanecer consistentes entre simuladores ficam em `docs/`.

## Estrutura

- `projetos/`: um diretório por simulador, contendo aplicação, modelos, referências e ferramentas próprias.
- `docs/`: princípios transversais de produto, interface e linguagem visual.
- `templates/`: ponto de partida e checklist para um novo simulador.

## Projetos atuais

- [Sensor indutivo](projetos/sensor-indutivo/README.md): laboratório de regulagem do sensor M18 sobre formas de 90 g.

## Começar um novo simulador

1. Copie `templates/simulador/` para `projetos/<nome-do-simulador>/`.
2. Preencha o propósito, os limites do modelo e a evidência de validação.
3. Aplique os princípios de `docs/principios-de-simulacao.md` e os tokens de `docs/linguagem-visual.md`.
4. Mantenha modelos, referências e ferramentas específicas dentro do próprio projeto.

