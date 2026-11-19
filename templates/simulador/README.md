# Nome do simulador

## Propósito

Que decisão, regulagem ou fenômeno este simulador ajuda a compreender?

## Estrutura recomendada

- `simulador/`: aplicação executável, testes e build.
- `modelos/`: fontes editáveis, arquivos de intercâmbio e prévias.
- `referencias/`: CAD, fotos, fichas técnicas e outras fontes preservadas.
- `ferramentas/`: scripts de preparação e geração de ativos.

Crie apenas os diretórios necessários, mas mantenha os artefatos específicos dentro deste projeto.

## Contrato do modelo

- Entradas e unidades:
- Saídas observáveis:
- Hipóteses e aproximações:
- Fenômenos não simulados:
- Fonte dos parâmetros:

## Cenários mínimos

1. Estado nominal.
2. Limite operacional relevante.
3. Falha ou condição insegura.
4. Recuperação demonstrável.

## Critérios de entrega

- [ ] O cenário padrão explica o objetivo sem configuração prévia.
- [ ] Controles têm unidade, ajuda contextual e reset previsível.
- [ ] Estados não dependem apenas de cor.
- [ ] O mesmo cenário é determinístico.
- [ ] Cálculo de domínio possui testes independentes da renderização.
- [ ] Limites e aproximações estão documentados.
- [ ] Uso com mouse, teclado e toque foi considerado.
- [ ] Build e execução estão documentados e reproduzíveis.

