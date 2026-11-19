import {DEFAULTS} from './simulation.js';
export const SCENARIOS=[
 {name:'Normal',values:{alignment:25}},
 {name:'Sensor alto (Forma 6)',effectiveHeight:8.9},
 {name:'Sensor avançado no V',values:{offset:2.4}},
 {name:'Sensor quase avançado no V com variação de altura',effectiveHeight:3.8,values:{offset:1.3}},
 {name:'Sensor recuado muito na borda (Forma 3)',values:{offset:-5.2}},
 {name:'Inclinado sem parafuso duplo (Forma 6)',values:{tilt:-15.5}},
 {name:'Pezinho alto (Forma 3)',effectiveHeight:2},
 {name:'Sensor na beirada (Vão 3-4)',values:{alignment:55}}
];
export function scenarioState(index){
 const c=SCENARIOS[index];
 const s={...DEFAULTS,...(index?{lift:3,wander:2,gap:.5,gapVariation:2.5,alignment:25}:{}),...c.values};
 // The scenario specification uses the effective height shown in the UI.
 s.height=69+((c.effectiveHeight??6)-69-s.assemblyHeight)/Math.cos(s.tilt*Math.PI/180);
 return s;
}
