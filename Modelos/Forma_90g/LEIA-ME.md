# Forma de 90 g — modelo preparado

Importado do [GLB original](../../Referências/Forma%2090g/Forma%2090g.glb), preservado sem alterações. A geometria veio do CAD; não foi remodelada nem simplificada por decimação.

- [Cena Blender](forma_90g.blend)
- [GLB consolidado para Three.js](forma_90g.glb)
- [Prévia](forma_90g_preview.png)
- [Script reproduzível](../../scripts/preparar_forma90g.py)

## Organização e escala

Um objeto `Forma_90g`, na coleção `Forma_90g_Asset`, com material básico `Metal_Forma`, sem texturas. Câmera de prévia em coleção separada, excluída do GLB. Abas, orelhinhas, cavidades e alça mantêm a geometria importada.

Unidade real: metro. Dimensões após orientação: 445 × 143 × 155 mm (comprimento × largura × altura), provenientes do GLB; não conferidas com as cotas do PDF. Não foi aplicada mudança de escala.

Origem no centro da base da caixa envolvente; abertura para cima. No Blender: X comprimento, Y largura, Z altura, base Z=0. No GLB/Three.js: X comprimento, Y altura, Z largura, base Y=0. Transformações aplicadas, escala (1,1,1).

A forma está em arquivo separado, pronta para ser adicionada à cena do sensor. A posição relativa ao sensor, o trajeto das formas e a lógica de acionamento não foram definidos nesta etapa.

## Limpeza e validação

- União dos vértices coincidentes com tolerância de 0,001 mm: de 4.010 para 2.576 vértices no Blender.
- Nenhum deslocamento detectado nas posições dos vértices remanescentes em relação ao CAD orientado, antes do ajuste da origem.
- 5.152 triângulos preservados.
- Bordas abertas: de 2.376 antes da união para zero; nenhuma aresta não manifold após a limpeza.
- Normais recalculadas; suavização com arestas marcadas a partir de 30° para preservar cantos.
- GLB consolidado de 305 primitivas para uma, com um material. Tamanho de 540.492 para 160.220 bytes.
- GLB reimportado no Blender para confirmar dimensões, posição da base, quantidade de objetos e material.

Os vértices exportados no GLB podem ser duplicados nos cantos para representar normais e UVs; isso é esperado e não desfaz a limpeza da malha Blender.

Para regenerar, executar Blender headless com `--background --python-exit-code 1 --python scripts/preparar_forma90g.py` a partir da raiz do projeto.
