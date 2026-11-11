# Sensor indutivo M18

Modelo aproximado para treinamento, baseado nas fotografias e no rascunho de três vistas fornecidos. A cena Blender inclui sensor, suporte de chapa única, duas porcas M18 e dois parafusos de fixação separados. Sem formas ou cabo. Conector traseiro simplificado; pinagem apenas ilustrativa, sem especificação elétrica.

- [Modelo Blender](sensor_indutivo_M18.blend)
- [Modelo para Three.js](sensor_indutivo_M18.glb)
- [Prévia](sensor_indutivo_M18_preview.png)
- [Script de geração](../../scripts/criar_sensor.py)
- [Conjunto completo para Three.js](sensor_M18_com_suporte.glb)
- [Somente suporte e porcas](suporte_e_porcas.glb)
- [Prévia do conjunto](sensor_M18_com_suporte_preview.png)
- [Ângulo oposto](suporte_angulo_oposto.png)
- [Script do suporte](../../scripts/criar_suporte.py)

## Suporte e montagem

O Blender contém o conjunto completo. O GLB original `sensor_indutivo_M18.glb` continua contendo apenas o sensor. No arquivo `sensor_M18_com_suporte.glb`, a raiz `Conjunto_Sensor_M18` agrupa `Sensor_Indutivo_M18` e `Fixacao`. Este último agrupa `Suporte_Chapa_Unica`, `Porca_M18_Superior`, `Porca_M18_Inferior`, `Parafuso_Fixacao_01` e `Parafuso_Fixacao_02`. Cada componente pode ser selecionado e transformado separadamente; a luz mantém seu material exclusivo.

A chapa é uma única malha fechada e conectada, com dobras arredondadas, desvio superior e aba horizontal com furo. Conforme o rascunho de três vistas, o pé sai pela lateral da aba (90° em relação à direção entre o sensor e a parede de fixação), desce primeiro em um dente protetor até uma base 3 mm abaixo da face sensora e depois segue para a lateral, terminando curvado para cima. Dimensões aproximadas: espessura 2 mm, largura da parede 28 mm, furo do sensor 18,6 mm e dois furos de fixação de 5,5 mm alinhados verticalmente. Dois parafusos M5 ilustrativos com cabeça sextavada, flange e haste sem rosca estão incluídos. Porcas M18 ilustrativas: 24 mm entre faces e 4 mm de espessura, sem rosca interna. Não é um desenho de fabricação.

O GLB separado do suporte preserva as coordenadas de montagem do sensor, permitindo carregar ambos na mesma origem; inclui também os dois parafusos. Todos usam metros e eixo Y vertical no Three.js. As cinco malhas da fixação foram verificadas quanto a fechamento e conectividade.

Diâmetro externo da rosca: 18 mm. Comprimento total aproximado: 72 mm. Rosca helicoidal com passo ilustrativo de 1 mm. As dimensões longitudinais não foram medidas. Materiais básicos, sem texturas ou marca comercial. A faixa cinza representa a etiqueta.

O GLB usa metros: 0,018 m de diâmetro. Eixo longitudinal Y, ponta sensora em Y=0 voltada para -Y, conexão em +Y. No Blender o eixo longitudinal é Z. Origem no centro da face sensora. O GLB contém somente o sensor; câmera e luzes ficam na coleção Estudio_Preview do Blender.

## Luz no Three.js

Objeto `Luz_Indicadora`, com material exclusivo `Luz_Indicadora_Material`. O arquivo começa com indicação vermelha suave. Para controlar o estado sem substituir o material:

```js
const luz = gltf.scene.getObjectByName('Luz_Indicadora');
luz.material.emissive.set(0xff0202);
function indicarForma(presente) {
  luz.material.color.set(presente ? 0xff2020 : 0x450202);
  luz.material.emissiveIntensity = presente ? 2 : 0;
}
```

A emissão colore a superfície; halo depende do pós-processamento da aplicação. A detecção e a animação serão controladas pela aplicação. O modelo não contém lógica de detecção nem simulação eletromagnética.

Para regenerar, executar Blender em background com `--python scripts/criar_sensor.py` e depois com `--python scripts/criar_suporte.py` a partir da raiz do projeto. O segundo script atualiza a cena Blender e exporta o conjunto e a fixação separada.
