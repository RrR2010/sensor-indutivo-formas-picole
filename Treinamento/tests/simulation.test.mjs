import {SCENARIOS,scenarioState} from '../src/scenarios.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULTS,evaluate,earContains,layout,sensorPose,createMotion,stepMotion,previewCycle} from '../src/simulation.js';
const cycle=(opts={})=>Array.from({length:600},(_,i)=>evaluate({...DEFAULTS,...opts,progress:i/6}));
test('correct setting alternates six times',()=>{const all=cycle();assert.ok(all.some(r=>r.signal));assert.ok(all.some(r=>!r.signal));let rising=0;all.forEach((r,i)=>{if(r.signal&&!all[(i+599)%600].signal)rising++;});assert.equal(rising,6);assert.ok(all.every(r=>!r.collision));});
test('high sensor fails to detect',()=>assert.ok(cycle({height:18}).every(r=>!r.signal)));
test('root of V keeps unshielded output on',()=>assert.ok(cycle({offset:6,gap:0,height:2}).every(r=>r.signal)));
test('shielded field rejects lateral wall better',()=>{const opts={offset:6,gap:0,height:2};const a=cycle(opts),b=cycle({...opts,sensorType:'shielded'});assert.ok(Math.min(...b.map(r=>r.influence))<Math.min(...a.map(r=>r.influence)));});
test('variations deterministic and intervals nonnegative',()=>{const s={...DEFAULTS,lift:5,wander:8,gap:0,gapVariation:15,progress:27};assert.deepEqual(evaluate(s),evaluate(s));assert.ok(layout(s).gaps.every(g=>g>=0));});
test('manual cycle repeats',()=>assert.ok(Math.abs(evaluate({...DEFAULTS,progress:0}).influence-evaluate({...DEFAULTS,progress:100}).influence)<1e-9));
test('upper screw is tilt pivot',()=>{const a=sensorPose(DEFAULTS),b=sensorPose({...DEFAULTS,tilt:20});assert.deepEqual(a.pivot,b.pivot);assert.ok(Math.abs(b.z)>20);assert.ok(Math.abs(a.z)<1e-9);});
test('chamfer opens the outer gap',()=>{assert.equal(earContains(-221,60),false);assert.equal(earContains(-208,60),true);});
test('hysteresis retains signal between thresholds',()=>{let s;for(let h=0;h<20;h+=.02){const x={...DEFAULTS,height:h};const r=evaluate(x);if(r.influence>.475&&r.influence<.495){s=x;break;}}assert.ok(s);assert.equal(evaluate(s,false).signal,false);assert.equal(evaluate(s,true).signal,true);});

function run(opts={},seconds=20){const s={...DEFAULTS,dwell:0,playing:true,...opts},m=createMotion(s);let r=evaluate(s);for(let t=0;t<seconds&&!m.fault;t+=.02)r=stepMotion(s,m,.02,r.signal);return {s,m,r};}
test('dwell holds position and resumes exactly one pitch',()=>{const s={...DEFAULTS,playing:true,speed:143.5},m=createMotion(s);stepMotion(s,m,2);assert.equal(s.progress,0);assert.equal(m.remaining,1);stepMotion(s,m,2.5,true);assert.equal(m.completed,1);assert.ok(Math.abs(s.progress-100/6)<1e-7);assert.equal(m.phase,'dwell');assert.ok(Math.abs(m.remaining-2.5)<1e-7);});
test('paused dwell preserves timer and position',()=>{const s={...DEFAULTS},m=createMotion(s);stepMotion(s,m,10);assert.equal(m.remaining,3);assert.equal(s.progress,0);});
test('six indexed strokes complete a full cycle',()=>{const s={...DEFAULTS,dwell:0,speed:143.5,playing:true},m=createMotion(s);stepMotion(s,m,6,true);assert.equal(m.completed,6);assert.equal(m.fault,null);assert.ok(Math.min(s.progress,100-s.progress)<1e-7);});
test('disabling fault stops permits continuous inspection',()=>{const {s,m}=run({alignment:60,stopOnFault:false},3);assert.equal(m.fault,null);assert.equal(s.playing,true);assert.ok(m.completed>0);});
test('lateral wander stays within three millimetres',()=>assert.ok(cycle({wander:8}).every(r=>r.forms.every(f=>Math.abs(f.dx)<=3))));
test('guide leaves small height variations untouched',()=>{assert.ok(cycle({lift:4}).every(r=>r.forms.every(f=>f.correction===0)));});
test('guide protects against excessive lift at normal setting',()=>{assert.ok(cycle({lift:10}).every(r=>!r.collision));assert.ok(cycle({lift:10,guard:false}).some(r=>r.collision));assert.ok(cycle({lift:10}).some(r=>r.correcting));});
test('sensor below raised guard loses protection',()=>{const s={...DEFAULTS,assemblyHeight:8,height:-5,lift:6,playing:true},m=createMotion(s);stepMotion(s,m,.1);assert.equal(m.fault,'collision');assert.equal(s.playing,false);});
test('missing detection and missing gap do not block the cycle',()=>{for(const opts of [{height:22},{offset:6,height:2,gap:0}]){const {s,m}=run(opts);assert.equal(m.fault,null);assert.ok(m.completed>2);assert.equal(s.playing,true);}});
test('assembly height moves pivot and sensor equally',()=>{const a=sensorPose(DEFAULTS),b=sensorPose({...DEFAULTS,assemblyHeight:9.5});assert.equal(b.y-a.y,5);assert.equal(b.pivot.y-a.pivot.y,5);});
test('raising a form changes influence even below guard clearance',()=>{const a=evaluate(DEFAULTS),b=evaluate({...DEFAULTS,lift:4});assert.ok(b.influence>a.influence);assert.equal(b.collision,false);});

test('each mould keeps a distinct nearly constant free height through the cycle',()=>{const all=cycle({lift:8,guard:false});for(let id=0;id<6;id++){const heights=all.map(r=>r.forms[id].rawLift);assert.ok(Math.max(...heights)-Math.min(...heights)<=.161);}const heights=all[0].forms.map(f=>f.rawLift);assert.ok(Math.max(...heights)-Math.min(...heights)>6);});

test('lateral displacement differs between moulds and stays fixed during travel',()=>{const all=cycle({wander:3}),positions=all[0].forms.map(f=>f.dx);assert.equal(new Set(positions).size,6);for(const r of all)assert.deepEqual(r.forms.map(f=>f.dx),positions);assert.ok(cycle({wander:0}).every(r=>r.forms.every(f=>f.dx===0)));});

test('preview covers twelve sorted geometric centres and matches the live calculation',()=>{const s={...DEFAULTS,gapVariation:8,lift:3,wander:2,alignment:24,tilt:7};const rows=previewCycle(s);assert.equal(rows.length,12);assert.equal(new Set(rows.map(r=>r.kind+r.id)).size,12);rows.forEach((r,i)=>{if(i)assert.ok(r.progress>=rows[i-1].progress);const live=evaluate({...s,progress:r.progress});assert.equal(r.influence,live.influence);assert.equal(r.collision,live.collision);if(r.kind==='form')assert.ok(Math.abs(live.forms[r.id].z-live.pose.z)<1e-6);});assert.equal(previewCycle(DEFAULTS)[0].id,0);assert.equal(previewCycle(DEFAULTS)[0].progress,0);assert.deepEqual(previewCycle({...s,progress:70}),rows);});

test('reported gap case exposes a lower reading after its geometric centre without animation',()=>{const s={...DEFAULTS,offset:2.4,lift:3,wander:2,gapVariation:2.5};const row=previewCycle(s).find(r=>r.kind==='gap'&&r.id===4);assert.ok(row.influence>.5);assert.ok(row.minimumInfluence<.47);assert.ok(row.minimumProgress>row.progress);assert.equal(row.minimumInfluence,evaluate({...s,progress:row.minimumProgress}).influence);assert.ok(evaluate({...s,progress:26.5},true).influence<.47);});

test('all eight scenarios reset omitted settings and honor effective height',()=>{assert.equal(SCENARIOS.length,8);const heights=[6,8.9,6,3.8,6,6,2,6];for(let i=0;i<8;i++){const s=scenarioState(i);assert.ok(Math.abs(sensorPose(s).y-155-heights[i])<1e-8);assert.equal(s.lift,i?3:0);assert.equal(s.wander,i?2:0);assert.equal(s.gap,.5);assert.equal(s.gapVariation,i?2.5:0);assert.equal(s.alignment,i===7?55:i?25:0);assert.equal(s.fieldStyle,'envelope');}assert.equal(scenarioState(2).offset,2.4);assert.equal(scenarioState(3).offset,1.3);assert.equal(scenarioState(4).offset,-5.2);assert.equal(scenarioState(5).tilt,-15.5);});
