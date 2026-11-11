import {SCENARIOS,scenarioState} from './scenarios.js';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {DEFAULTS,evaluate,layout,createMotion,stepMotion,sensorPose,previewCycle} from './simulation.js';

const $=id=>document.getElementById(id);
const state={...DEFAULTS};
let motion=createMotion(state);
const fmt=(n,d=1)=>Number(n).toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d});
let result,signal=false,ready=false,frames=0,history=[],historyAccumulator=0,lastNow=performance.now();
let renderer,scene,camera,controls,sensorAssembly,sensorBarrel,lowerBolt,nuts=[],forms=[],guardMesh,cloud,envelope,fieldGroup,led,wall,spacers=[];
const fieldColor=new THREE.Color(),fieldLow=new THREE.Color(0x17bac1),fieldHigh=new THREE.Color(0xff613d);
const viewport=$('viewport'),canvas=$('scene');
let transition=null;
let previewKey="",previewRows=[];
let initialPosition,tipMesh,tipOriginal,damageGroup,damaged=false;
const lastTip=new THREE.Vector3();

function makeBox(w,h,d,x,y,z,material){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);m.position.set(x,y,z);m.receiveShadow=true;m.castShadow=true;scene.add(m);return m;}
function unpack(base64){const bytes=Uint8Array.from(atob(base64),c=>c.charCodeAt(0));return bytes.buffer;}
function splitGuard(mesh){
  const geometry=mesh.geometry,indices=geometry.index?Array.from(geometry.index.array):Array.from({length:geometry.attributes.position.count},(_,i)=>i);
  const pos=geometry.attributes.position,body=[],foot=[];
  for(let i=0;i<indices.length;i+=3){const ids=indices.slice(i,i+3);const y=ids.reduce((s,j)=>s+pos.getY(j),0)/3,z=ids.reduce((s,j)=>s+pos.getZ(j),0)/3;(z<-.014&&y<.018?foot:body).push(...ids);}
  const bodyGeometry=geometry.clone();bodyGeometry.setIndex(body);mesh.geometry=bodyGeometry;
  const footGeometry=geometry.clone();footGeometry.setIndex(foot);const m=new THREE.Mesh(footGeometry,mesh.material);m.name='Protecao_Pezinho';m.castShadow=true;m.receiveShadow=true;mesh.parent.add(m);return m;
}

async function init(){
  renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.6));renderer.setClearColor(0xe8eef2);
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.9;
  scene=new THREE.Scene();scene.background=new THREE.Color(0xe8eef2);scene.fog=new THREE.Fog(0xe8eef2,1100,2300);
  camera=new THREE.PerspectiveCamera(37,1,.5,4000);
  controls=new OrbitControls(camera,canvas);controls.enableDamping=true;controls.dampingFactor=.085;controls.minDistance=40;controls.maxDistance=1700;controls.maxPolarAngle=Math.PI*.88;
  controls.touches.ONE=THREE.TOUCH.ROTATE;controls.touches.TWO=THREE.TOUCH.DOLLY_PAN;
  controls.addEventListener('start',()=>document.querySelectorAll('[data-view]').forEach(b=>b.classList.remove('selected')));
  const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment();scene.environment=pmrem.fromScene(room,.04).texture;scene.environmentIntensity=.7;room.dispose();pmrem.dispose();
  scene.add(new THREE.HemisphereLight(0xe8f5ff,0x78838e,1.35));
  const light=new THREE.DirectionalLight(0xfff4e6,2);light.position.set(-250,650,300);light.castShadow=true;light.shadow.mapSize.set(1024,1024);Object.assign(light.shadow.camera,{left:-500,right:500,top:650,bottom:-650,near:1,far:1500});light.shadow.bias=-.0004;scene.add(light);
  const fill=new THREE.DirectionalLight(0xffffff,.8);fill.position.set(400,150,-300);scene.add(fill);
  const floorMat=new THREE.MeshStandardMaterial({color:0xdce4e9,roughness:.95});makeBox(1800,8,2300,0,-22,0,floorMat);
  const nylon=new THREE.MeshStandardMaterial({color:0x18242d,roughness:.75,metalness:0});
  for(const x of [-219.5,219.5])makeBox(10,12,1450,x,148,0,nylon);
  const frameMat=new THREE.MeshStandardMaterial({color:0x748a98,metalness:.35,roughness:.6});
  for(const z of [-440,440]){
    makeBox(455,12,15,0,136,z,frameMat);
    for(const x of [-219.5,219.5])makeBox(14,145,14,x,65,z,frameMat);
  }
  wall=makeBox(4,100,90,-264,207,0,new THREE.MeshStandardMaterial({color:0x748a98,transparent:true,opacity:.08,depthWrite:false}));wall.castShadow=false;wall.receiveShadow=false;
  const spacerMat=new THREE.MeshStandardMaterial({color:0x667780,metalness:.55,roughness:.5});
  for(const y of [213,224])spacers.push(makeBox(18,5,5,-253,y,0,spacerMat));
  const arrow=new THREE.ArrowHelper(new THREE.Vector3(0,0,1),new THREE.Vector3(-247,148,-100),62,0x0d9197,12,7);scene.add(arrow);

  const loader=new GLTFLoader();
  const [sensorAsset,formaAsset]=await Promise.all([loader.parseAsync(unpack(window.ASSETS.sensor),''),loader.parseAsync(unpack(window.ASSETS.forma),'')]);
  delete window.ASSETS;
  const sensor=sensorAsset.scene;sensor.scale.setScalar(1000);sensor.position.set(27,-65,0);
  sensorAssembly=new THREE.Group();sensorAssembly.name='Pivo_Parafuso_Superior';sensorAssembly.add(sensor);scene.add(sensorAssembly);
  sensorBarrel=sensor.getObjectByName('Sensor_Indutivo_M18');
  lowerBolt=sensor.getObjectByName('Parafuso_Fixacao_01');
  nuts=['Porca_M18_Superior','Porca_M18_Inferior'].map(n=>sensor.getObjectByName(n));
  led=sensor.getObjectByName('Luz_Indicadora');led.material=led.material.clone();
  tipMesh=sensor.getObjectByName('Face_Sensora');tipMesh.material=tipMesh.material.clone();tipOriginal=tipMesh.material.color.clone();
  guardMesh=splitGuard(sensor.getObjectByName('Suporte_Chapa_Unica'));
  sensor.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;if(o.material&&o!==led){o.material.roughness=Math.max(o.material.roughness,.28);o.material.metalness=Math.min(o.material.metalness,.7);}}});
  const mouldMat=new THREE.MeshStandardMaterial({color:0x85959d,metalness:.6,roughness:.4});
  for(let i=0;i<6;i++){
    const obj=formaAsset.scene.clone(true);obj.name=`Forma_${i+1}`;obj.scale.setScalar(1000);
    obj.traverse(o=>{if(o.isMesh){o.material=mouldMat;o.castShadow=true;o.receiveShadow=true;}});scene.add(obj);forms.push(obj);
  }
  createField();createDamage();
  new ResizeObserver(resize).observe(viewport);resize();setView('detail');
  ready=true;$('loading').hidden=true;$('play').disabled=false;
  syncUI();update(0);requestAnimationFrame(tick);
}

function createField(){
  fieldGroup=new THREE.Group();scene.add(fieldGroup);
  const count=420,positions=new Float32Array(count*3),seed=new Float32Array(count);
  for(let i=0;i<count;i++){
    const a=i*2.39996323,h=1-2*((i*.6180339)%1),r=Math.cbrt(((i*73)%541+.5)/541),s=Math.sqrt(1-h*h);
    positions.set([r*s*Math.cos(a),r*h,r*s*Math.sin(a)],i*3);seed[i]=(i*.317)%1;
  }
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(positions,3));geo.setAttribute('aSeed',new THREE.BufferAttribute(seed,1));
  const uniforms={uTime:{value:0},uColor:{value:new THREE.Color(0x16b9bd)},uRadius:{value:17},uDepth:{value:13}};
  const mat=new THREE.ShaderMaterial({uniforms,transparent:true,depthTest:false,depthWrite:false,blending:THREE.NormalBlending,
    vertexShader:`attribute float aSeed; uniform float uTime; uniform float uRadius; uniform float uDepth; varying float vAlpha; void main(){vec3 p=position; float a=uTime*.42+aSeed*6.283; p.xz=mat2(cos(a),-sin(a),sin(a),cos(a))*p.xz; p*=vec3(uRadius,uDepth,uRadius); p.y-=uDepth*.65; vec4 mv=modelViewMatrix*vec4(p,1.); gl_Position=projectionMatrix*mv; gl_PointSize=clamp(3200.0/-mv.z,4.0,28.0); vAlpha=(.135+.055*sin(uTime*2.0+aSeed*12.0))*(1.0-length(position)*.55);}`,
    fragmentShader:`uniform vec3 uColor; varying float vAlpha; void main(){float d=length(gl_PointCoord-.5)*2.; if(d>1.)discard; gl_FragColor=vec4(uColor,exp(-d*d*4.)*vAlpha);}`});
  cloud=new THREE.Points(geo,mat);cloud.renderOrder=5;fieldGroup.add(cloud);
  const shell=new THREE.ShaderMaterial({uniforms:{uTime:{value:0},uColor:{value:new THREE.Color(0x16b9bd)}},transparent:true,depthTest:false,depthWrite:false,side:THREE.DoubleSide,
    vertexShader:`varying vec3 vNormal;varying vec3 vView;varying vec3 vPos;void main(){vPos=position;vec4 p=modelViewMatrix*vec4(position,1.);vView=-p.xyz;vNormal=normalize(normalMatrix*normal);gl_Position=projectionMatrix*p;}`,
    fragmentShader:`uniform float uTime;uniform vec3 uColor;varying vec3 vNormal;varying vec3 vView;varying vec3 vPos;void main(){float rim=pow(1.-abs(dot(normalize(vNormal),normalize(vView))),2.);float bands=pow(.5+.5*sin(vPos.y*27.-uTime*3.+atan(vPos.z,vPos.x)*2.),12.);float alpha=.045+.27*rim+.18*bands;gl_FragColor=vec4(uColor,alpha);}`});
  envelope=new THREE.Mesh(new THREE.SphereGeometry(1,40,28),shell);envelope.renderOrder=4;fieldGroup.add(envelope);
}

// Procedural scrape strips on the incoming (-Z) side and along the bottom face.
// A visual teaching cue only: damage does not change collision or detection geometry.
function createDamage(){
  damageGroup=new THREE.Group();scene.add(damageGroup);
  const mat=new THREE.MeshBasicMaterial({color:0x51351d,transparent:true,opacity:.95,side:THREE.DoubleSide,depthWrite:false});
  for(let i=0;i<13;i++){
    const x=-6+i, z=-Math.sqrt(8.66**2-x*x),w=.12+(i%3)*.08,h=1.7+(i%4)*.8;
    const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.Float32BufferAttribute([x-w,.3,z-.06,x+w,.3,z-.06,x+w,h,z-.06,x-w,h,z-.06],3));geo.setIndex([0,1,2,0,2,3]);
    damageGroup.add(new THREE.Mesh(geo,mat));
    const scratch=new THREE.Mesh(new THREE.PlaneGeometry(w*1.4,3+(i%4)),mat);scratch.rotation.x=-Math.PI/2;scratch.position.set(x,-.07,z+2.5);damageGroup.add(scratch);
  }
}

function resize(){if(!renderer)return;const w=viewport.clientWidth,h=viewport.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();drawHistory();}
function setView(which){
  const p=sensorPose(state),target=new THREE.Vector3(p.x,p.y,p.z);
  const offsets={detail:[103,89,218],general:[-625,440,880],top:[0,269,.01],side:[228,0,0]};
  if(which==='general')target.set(-25,130,0);
  camera.position.copy(target).add(new THREE.Vector3(...(offsets[which]||offsets.detail)));controls.target.copy(target);controls.update();
  lastTip.set(p.x,p.y,p.z);
  document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('selected',b.dataset.view===which));
  initialPosition=which;
}
function update(dt){
  if(!ready)return;
  const wasPlaying=state.playing;
  result=stepMotion(state,motion,dt,signal);signal=result.signal;
  if(wasPlaying){$('progress').value=state.progress;$('progressValue').textContent=fmt(state.progress)+'%';}
  if(wasPlaying!==state.playing)syncUI();
  updatePreview();
  const p=result.pose;
  const currentTip=new THREE.Vector3(p.x,p.y,p.z);
  if(initialPosition!=='general'){const delta=currentTip.clone().sub(lastTip);camera.position.add(delta);controls.target.add(delta);}
  lastTip.copy(currentTip);
  damaged=result.collision;
  tipMesh.material.color.copy(damaged?new THREE.Color(0xb16a21):tipOriginal);
  tipMesh.material.roughness=damaged?.95:.45;
  damageGroup.visible=damaged;damageGroup.position.copy(currentTip);damageGroup.rotation.x=p.angle;
  damageGroup.traverse(o=>{if(o.isMesh){o.material.opacity=state.transparent?.3:.95;}});

  sensorAssembly.position.set(p.pivot.x,p.pivot.y,p.pivot.z);sensorAssembly.rotation.x=p.angle;
  wall.position.z=state.alignment;wall.position.y=207+state.assemblyHeight;
  sensorAssembly.traverse(o=>{if(o.isMesh){o.material.transparent=state.transparent;o.material.opacity=state.transparent?.18:1;o.material.depthWrite=!state.transparent;o.castShadow=!state.transparent;}});
  sensorBarrel.position.y=(state.height-4)/1000;
  lowerBolt.visible=Math.abs(state.tilt)<.01;
  nuts.forEach(n=>n.rotation.y=(state.height-4)*Math.PI*2);
  guardMesh.visible=state.guard;
  spacers.forEach((s,i)=>{s.visible=i===1||Math.abs(state.tilt)<.01;s.position.z=state.alignment;s.position.y=(i===0?213:224)+state.assemblyHeight;const end=p.pivot.x-1;s.position.x=(-262+end)/2;s.scale.x=(end+262)/18;});
  result.forms.forEach((f,i)=>forms[i].position.set(f.dx,f.lift,f.z));
  fieldColor.copy(fieldLow).lerp(fieldHigh,Math.min(1,result.influence/.8));
  led.material.color.setHex(signal?0xf53b20:0x4a1110);led.material.emissive.setHex(0xff1208);led.material.emissiveIntensity=signal?.7:0;
  fieldGroup.position.set(p.x,p.y,p.z);fieldGroup.rotation.x=p.angle;fieldGroup.visible=state.field;
  cloud.visible=state.fieldStyle==='cloud';envelope.visible=!cloud.visible;
  const r=state.sensorType==='shielded'?9:17,d=state.sensorType==='shielded'?10:12;
  cloud.material.uniforms.uRadius.value=r;cloud.material.uniforms.uDepth.value=d;cloud.material.uniforms.uColor.value.copy(fieldColor);
  envelope.scale.set(r,d,r);envelope.position.y=-d*.65;envelope.material.uniforms.uColor.value.copy(fieldColor);
  $('signal').classList.toggle('on',signal);$('signalText').textContent=signal?'Ligado':'Desligado';
  const percent=Math.round(result.influence*100);$('influenceValue').textContent=percent+'%';$('meterFill').style.width=percent+'%';$('meterFill').style.background=signal?'#e76545':'#159d9c';
  let condition='Observe a troca de sinal entre metal e vão.';let cls='';
  if(motion.fault){condition={collision:'Enroscou: a aba atingiu a ponta. Ajuste a regulagem e rearme.', 'missing-gap':'Ciclo bloqueado: o sinal não desligou no vão. Ajuste e rearme.', 'no-detection':'Ciclo bloqueado: não há leitura na parada. Ajuste o alinhamento e rearme.'}[motion.fault];cls='danger';}
  else if(result.collision){condition='Risco de impacto: a ponta invade a passagem da forma.';cls='danger';}
  else if(result.correcting){condition='A guia está acomodando a forma levantada.';cls='good';}
  else if(motion.phase==='dwell'&&!signal){condition='Sem leitura na posição de parada: confira altura e alinhamento.';cls='danger';}
  else if(state.height>10){condition='Sensor alto: a resposta pode ficar abaixo do limiar.';}
  else if(Math.abs(state.tilt)>10){condition='Inclinação: a distância muda ao longo do campo.';}
  else if(state.offset>5){condition='Próximo da raiz do V: observe se o sinal desliga no vão.';}
  $('condition').textContent=condition;$('condition').className=cls;
  const cycleText=transition?'Ajustando cenário…':motion.fault?'Ciclo bloqueado':state.playing?(motion.phase==='dwell'?`Parada · ${fmt(motion.remaining)} s`:'Avançando para a próxima forma'):'Manual · avanço livre';
  $('cycleStatus').textContent=cycleText;$('cycleStatus').classList.toggle('blocked',!!motion.fault);
  $('modeText').textContent=cycleText;$('rearm').hidden=!motion.fault;
  $('clearance').textContent=Number.isFinite(result.minDistance)?`${fmt(result.minDistance)} mm até o metal alcançado pelas amostras do campo. ${result.collision?'Há interferência com a ponta.':''}`:'Nenhum metal alcançado pelas amostras do campo nesta posição.';
  if(wasPlaying){historyAccumulator+=dt;while(historyAccumulator>=.06){historyAccumulator-=.06;pushHistory();}}
}
function pushHistory(){if(!result)return;history.push({v:result.influence,on:signal});if(history.length>180)history.shift();drawHistory();}
function drawHistory(){
  const c=$('history'),r=c.getBoundingClientRect();if(!r.width)return;const dpr=Math.min(window.devicePixelRatio||1,2);c.width=r.width*dpr;c.height=r.height*dpr;
  const ctx=c.getContext('2d');ctx.scale(dpr,dpr);const w=r.width,h=r.height,p=6;
  ctx.strokeStyle='#e8eef1';ctx.lineWidth=1;for(const y of [.15,.5,.9]){ctx.beginPath();ctx.moveTo(0,h*y);ctx.lineTo(w,h*y);ctx.stroke();}
  const y=v=>h-12-v*(h-19);
  ctx.setLineDash([4,4]);ctx.strokeStyle='#d8a181';ctx.beginPath();ctx.moveTo(0,y(.5));ctx.lineTo(w,y(.5));ctx.stroke();ctx.setLineDash([]);
  if(history.length<2)return;
  const x=i=>w-(history.length-1-i)*w/179;
  ctx.strokeStyle='#13a09f';ctx.lineWidth=1.8;ctx.beginPath();history.forEach((q,i)=>i?ctx.lineTo(x(i),y(q.v)):ctx.moveTo(x(i),y(q.v)));ctx.stroke();
  ctx.strokeStyle='#e46343';ctx.lineWidth=1.4;ctx.beginPath();history.forEach((q,i)=>{const yy=q.on?p:h-3;if(i){const last=history[i-1].on?p:h-3;ctx.lineTo(x(i),last);ctx.lineTo(x(i),yy);}else ctx.moveTo(x(i),yy);});ctx.stroke();
}
function tick(now){const dt=Math.min((now-lastNow)/1000,.06);lastNow=now;advanceTransition(now);update(dt);cloud.material.uniforms.uTime.value=now/1000;envelope.material.uniforms.uTime.value=now/1000;controls.update();renderer.render(scene,camera);frames++;requestAnimationFrame(tick);}
function updatePreview(){
  if(transition||!document.querySelector('.cycle-preview').open)return;
  const key=JSON.stringify(['height','assemblyHeight','offset','alignment','tilt','lift','wander','gap','gapVariation','guard','sensorType'].map(k=>state[k]));
  if(key!==previewKey){
    previewKey=key;previewRows=previewCycle(state).map(r=>{if(r.kind!=='gap')return r;const progress=r.minimumProgress,v=evaluate({...state,progress});return {...r,progress,influence:v.influence,collision:v.collision};});
    $('cyclePreviewRows').replaceChildren();
    for(const row of previewRows){
      const b=document.createElement('button');b.className='preview-card';
      const label=row.kind==='form'?`Forma ${row.id+1}`:`Vão ${row.id+1}–${row.nextId+1}`;
      const percent=Math.round(row.influence*100);
      b.innerHTML=`<span>${label}${row.collision?' <b class="impact">⚠</b>':''}</span><div class="preview-track"><i style="width:${percent}%;background:${row.influence>=.5?'#df6845':'#159d9c'}"></i><em></em></div><small>${percent}% · ${fmt(row.progress)}% do ciclo</small>`;
      b.setAttribute('aria-label',`${label}: influência ${percent}%, centro em ${fmt(row.progress)}% do ciclo.${row.collision?' Contato com a ponta neste ponto.':''} Ir para este ponto.`);
      b.title=row.collision?'Contato com a ponta neste ponto':'Toque para examinar o centro';
      b.addEventListener('click',()=>change('progress',row.progress));$('cyclePreviewRows').append(b);
    }
  }
  // Highlight the closest checkpoint without moving the user's horizontal scroll.
  let nearest=0,best=Infinity;previewRows.forEach((r,i)=>{const d=Math.abs(r.progress-state.progress),dist=Math.min(d,100-d);if(dist<best){best=dist;nearest=i;}});
  [...$('cyclePreviewRows').children].forEach((b,i)=>{b.classList.toggle('nearest',i===nearest);b.setAttribute('aria-current',i===nearest?'step':'false');});
}

function syncUI(){
  for(const [key,value] of Object.entries(state)){const el=$(key);if(!el)continue;if(el.type==='checkbox')el.checked=value;else el.value=value;}
  for(const key of ['height','assemblyHeight','offset','alignment','lift','wander','gap','gapVariation'])$(key+'Value').textContent=(['wander','gapVariation'].includes(key)?'±':'')+fmt(state[key])+' mm';
  const effectiveHeight=sensorPose(state).y-155;$('height').value=effectiveHeight;$('heightValue').textContent=fmt(effectiveHeight)+' mm';
  $('transparent').setAttribute('aria-pressed',String(state.transparent));
  $('dwellValue').textContent=fmt(state.dwell)+' s';
  $('tiltValue').textContent=fmt(state.tilt,state.tilt%1?1:0)+'°';$('speedValue').textContent=fmt(state.speed,0)+' mm/s';$('progressValue').textContent=fmt(state.progress)+'%';
  $('typeCaption').textContent=state.sensorType==='shielded'?'Blindado · frontal':'Não blindado · amplo';
  $('play').textContent=motion.fault?'Bloqueado':state.playing?'❚❚ Pausar':'▶ Iniciar';$('play').disabled=!ready||!!motion.fault||!!transition;
}
function change(key,value){
  transition=null;if(!['progress','speed','transparent','field','fieldStyle','dwell','stopOnFault'].includes(key))$('scenario').value='custom';
  const previous=state[key];state[key]=value;
  if(key==='progress'||key==='gap'||key==='gapVariation'){state.playing=false;motion=createMotion(state);}
  if(key==='dwell'&&motion.phase==='dwell')motion.remaining=state.dwell;
  if(key==='stopOnFault'&&!value){motion=createMotion(state);state.playing=false;}
  syncUI();update(0);if(ready)pushHistory();
}
for(const key of Object.keys(DEFAULTS)){
  const el=$(key);if(!el)continue;
  if(key==='transparent')continue;
  el.addEventListener(el.type==='range'?'input':'change',()=>change(key,el.type==='checkbox'?el.checked:el.type==='range'?(key==='height'?69+(Number(el.value)-69-state.assemblyHeight)/Math.cos(state.tilt*Math.PI/180):Number(el.value)):el.value));
}
document.querySelectorAll('[data-reset]').forEach(b=>b.addEventListener('click',()=>change(b.dataset.reset,DEFAULTS[b.dataset.reset])));
$('resetAll').addEventListener('click',()=>{transition=null;$('scenario').value='0';damaged=false;Object.assign(state,DEFAULTS);motion=createMotion(state);signal=false;history=[];historyAccumulator=0;syncUI();update(0);pushHistory();setView('detail');});
$('rearm').addEventListener('click',()=>{state.playing=false;motion=createMotion(state);syncUI();update(0);pushHistory();});
$('play').addEventListener('click',()=>{if(transition)return;state.playing=!state.playing;lastNow=performance.now();syncUI();});
for(const [id,d] of [['stepBack',-1],['stepForward',1]])$(id).addEventListener('click',()=>change('progress',(state.progress+d/layout(state).total*100+100)%100));
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>ready&&setView(b.dataset.view)));
document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('[data-tab]').forEach(t=>t.setAttribute('aria-selected',String(t===b)));document.querySelectorAll('.tab-panel').forEach(p=>p.hidden=p.id!==b.dataset.tab);}));
for(const [i,c] of SCENARIOS.entries()){const option=document.createElement('option');option.value=i;option.textContent=`${i+1} · ${c.name}`;$('scenario').append(option);}
$('scenario').value='0';
$('scenario').addEventListener('change',()=>{
 if($('scenario').value==='custom')return;
 const target=scenarioState(Number($('scenario').value));target.progress=state.progress;
 state.playing=false;motion=createMotion(state);signal=false;
 transition={from:{...state},target,start:performance.now()};syncUI();
});
function advanceTransition(now){
 if(!transition)return;
 const {from,target,start}=transition,t=Math.min(1,(now-start)/3000),u=t*t*(3-2*t);
 for(const key of Object.keys(DEFAULTS))state[key]=typeof target[key]==='number'?from[key]+(target[key]-from[key])*u:target[key];
 state.playing=false;
 if(t===1){Object.assign(state,target);transition=null;motion=createMotion(state);previewKey='';}
 syncUI();
}
$('transparent').addEventListener('click',()=>change('transparent',!state.transparent));
$('panelToggle').addEventListener('click',()=>{const collapsed=document.body.classList.toggle('controls-collapsed');$('panelToggle').setAttribute('aria-expanded',String(!collapsed));});
for(const card of document.querySelectorAll('.parameter,.toggle-card')){const paragraphs=[...card.querySelectorAll(':scope > p')];if(!paragraphs.length)continue;const button=document.createElement('button');button.className='explain';button.textContent='?';button.setAttribute('aria-label','Explicar '+(card.querySelector('label')?.textContent||'ajuste'));card.append(button);button.addEventListener('click',()=>{$('parameterTitle').textContent=card.querySelector('label')?.childNodes[0]?.textContent?.trim()||'Sobre este ajuste';$('parameterText').textContent=paragraphs.map(p=>p.textContent).join(' ');$('parameterHelp').showModal();});}
$('closeParameterHelp').addEventListener('click',()=>$('parameterHelp').close());
$('help').addEventListener('click',()=>$('helpDialog').showModal());$('closeHelp').addEventListener('click',()=>$('helpDialog').close());
$('fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{ $('condition').textContent='Tela cheia não disponível neste navegador.';}});
document.addEventListener('visibilitychange',()=>{if(document.hidden){state.playing=false;syncUI();}});
// Read-only diagnostics used by local regression tests; no network connection.
window.training={isTransitioning:()=>!!transition,getPreview:()=>previewRows.map(r=>({...r})),getState:()=>({...state}),getMotion:()=>({...motion}),getResult:()=>result?JSON.parse(JSON.stringify(result)):null,getReady:()=>ready,getFrames:()=>frames,getSceneInfo:()=>({damaged,cameraTarget:controls?.target.toArray(),forms:forms.length,wallOpacity:wall?.material.opacity,assemblyY:sensorAssembly?.position.y,sensorOpacity:lowerBolt?.material.opacity,wallZ:wall?.position.z,sensorZ:sensorAssembly?.position.z,lowerBoltVisible:lowerBolt?.visible,guardVisible:guardMesh?.visible,drawCalls:renderer?.info.render.calls,camera:camera?.position.toArray()}),sample:(params)=>evaluate({...state,...params},false)};
init().catch(error=>{console.error(error);$('loading').innerHTML='<strong>Não foi possível iniciar a cena 3D.</strong><small>Abra o arquivo HTML em um navegador com WebGL 2 ativado.</small><small id="errorDetail"></small>';$('errorDetail').textContent=error.message;});
