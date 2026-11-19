// All simulation distances are millimetres. This is a teaching model, not FEM.
export const DEFAULTS = Object.freeze({progress:0,height:1.5,assemblyHeight:4.5,transparent:false,offset:0,alignment:0,tilt:0,speed:70,dwell:1,lift:0,wander:0,gap:.5,gapVariation:0,guard:true,stopOnFault:true,sensorType:'unshielded',fieldStyle:'envelope',field:true,playing:false});
export const EAR_Y=155, HALF_WIDTH=71.5, NOMINAL=10, ON=.50, OFF=.47;
const TAU=2*Math.PI;
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=(a,b,v)=>{const t=clamp((v-a)/(b-a),0,1);return t*t*(3-2*t);};
const samples=Array.from({length:81},(_,i)=>{const r=Math.sqrt((i+.5)/81),a=i*2.399963229728653;return {u:r*Math.cos(a),v:r*Math.sin(a),w:Math.exp(-3.5*r*r)};});
export function layout(s){
  const gaps=Array.from({length:6},(_,i)=>Math.max(0,s.gap+s.gapVariation*Math.sin(i*2.1+.7)));
  let sum=0; const centres=gaps.map(g=>{const x=sum;sum+=143+g;return x;});
  return {gaps,centres,total:sum,pitch:sum/6};
}
export function sensorPose(s){
  const a=s.tilt*Math.PI/180,c=Math.cos(a),sn=Math.sin(a);
  // Upper screw remains the pivot; the height adjustment moves only the barrel.
  const baseY=EAR_Y+4+s.assemblyHeight, pivotY=baseY+65;
  const localHeight=s.height-4;
  return {x:-215+s.offset,y:pivotY+(-65+localHeight)*c,z:s.alignment+(-65+localHeight)*sn,
    dir:{x:0,y:-c,z:-sn},across:{x:0,y:-sn,z:c}, angle:a,
    pivot:{x:-242+s.offset,y:pivotY,z:s.alignment},baseY};
}
export function earContains(x,z){
  const a=Math.abs(x),b=Math.abs(z);
  if(a>=207.5&&a<=222.5) return b<=66.5-(a-207.5);
  // Thin inner folded wall remains near the root of the V.
  if(a>=206.5&&a<207.5) return b<=71.5;
  return false;
}
export function formsAt(s){
  const l=layout(s),p=sensorPose(s),advance=s.progress/100*l.total;
  return l.centres.map((base,i)=>{
    const z=((base+advance+l.total/2)%l.total+l.total)%l.total-l.total/2;
    // Each mould keeps its own height; only a tiny periodic ripple remains.
    const heightFactor=[.58,.22,.94,.40,.76,.12][i];
    const rawLift=s.lift*heightFactor+Math.min(.08,s.lift*.01)*Math.sin(TAU*advance/l.total*3+i*2.13);
    const dx=clamp(s.wander,0,3)*[-.65,.25,1,-.30,.60,-1][i];
    const front=z+59,back=z-59;
    // The guide limits only excess lift above its clearance; normal flaps pass free.
    // Release the correction after the trailing flap clears the sensing tip.
    const entry=smooth(-49,-18,front-p.z);
    const exit=1-smooth(10,28,back-p.z);
    const align=clamp(1-Math.max(0,Math.abs((-215+dx)-p.x)-12)/15,0,1);
    const guardY=p.baseY+65-69*Math.cos(p.angle)+17*Math.sin(p.angle);
    const allowance=Math.max(0,guardY-EAR_Y);
    const correction=s.guard?Math.max(0,rawLift-allowance)*entry*exit*align:0;
    return {id:i,z,dx,rawLift,lift:rawLift-correction,correction,gap:l.gaps[i]};
  });
}
export function evaluate(s,previous=false){
  const pose=sensorPose(s),forms=formsAt(s),radius=s.sensorType==='shielded'?9:17;
  let energy=0,weight=0,covered=0,minDistance=Infinity;
  for(const q of samples){
    const u=q.u*radius,v=q.v*radius;
    const ox=pose.x+u,oy=pose.y+v*pose.across.y,oz=pose.z+v*pose.across.z;
    let best=0;
    for(const f of forms){
      const distance=(oy-EAR_Y-f.lift)/(-pose.dir.y);
      if(distance > 40) continue;
      const z=oz+pose.dir.z*Math.max(0,distance)-f.z;
      if(earContains(ox-f.dx,z)){
        const d=Math.max(0,distance);
        best=Math.max(best,Math.exp(-Math.LN2*(d/NOMINAL)**2));
        minDistance=Math.min(minDistance,distance);
      }
    }
    energy+=best*q.w; weight+=q.w;if(best>0)covered+=q.w;
  }
  // Broad fields can couple to the vertical folded metal at the root of V.
  let sideCoupling=0;
  for(const f of forms){
    const dx=Math.abs(pose.x-(-207.5+f.dx));
    const dy=Math.max(0,pose.y-(EAR_Y+f.lift),105+f.lift-pose.y);
    const dz=Math.max(0,Math.abs(pose.z-f.z)-71.5);
    const amplitude=s.sensorType==='shielded'?.12:.72;
    sideCoupling=Math.max(sideCoupling,amplitude*Math.exp(-Math.LN2*((dx/7)**2+(dy/10)**2+(dz/10)**2)));
  }
  const influence=clamp(Math.max(energy/weight,sideCoupling),0,1);
  let collision=false;
  // Approximate the circular sensing face at several points, including tilt.
  for(let i=0;i<17;i++){
    const r=i===0?0:8.6,a=TAU*i/16,u=r*Math.cos(a),v=r*Math.sin(a);
    for(const f of forms){
      const py=pose.y+v*pose.across.y,pz=pose.z+v*pose.across.z;
      if(earContains(pose.x+u-f.dx,pz-f.z)&&py<EAR_Y+f.lift+.15)collision=true;
    }
  }
  const signal=previous?influence>=OFF:influence>=ON;
  return {pose,forms,influence,signal,surfaceInfluence:energy/weight,sideCoupling,coverage:covered/weight,minDistance,
    collision,correcting:forms.some(f=>f.correction>.2),cycleLength:layout(s).total};
}

// Indexed pusher: one mean pitch per stroke, independent of sensor position.
// Unequal gaps shift individual moulds around that fixed grid of stop positions.
export function createMotion(s){
  const l=layout(s),advance=s.progress/100*l.total;
  const phaseDistance=((advance%l.pitch)+l.pitch)%l.pitch;
  const atStop=Math.min(phaseDistance,l.pitch-phaseDistance)<1e-6;
  return {phase:atStop?'dwell':'advance',remaining:s.dwell,
    distanceRemaining:atStop?l.pitch:l.pitch-phaseDistance,sawOff:false,
    checkTransition:atStop,fault:null,completed:0};
}
export function stepMotion(s,m,dt,previous=false){
  let r=evaluate(s,previous);
  if(!s.playing||m.fault)return r;
  function block(reason){m.fault=reason;s.playing=false;}
  if(s.stopOnFault&&r.collision){block('collision');return r;}
  let budget=Math.max(0,dt),iterations=0;
  while(budget>1e-9&&iterations++<1000){
    if(m.phase==='dwell'){
      const spent=Math.min(budget,m.remaining);m.remaining-=spent;budget-=spent;
      if(m.remaining>1e-9)break;
      m.phase='advance';m.distanceRemaining=layout(s).pitch;m.sawOff=!r.signal;m.checkTransition=true;
    }
    if(m.phase==='advance'){
      // Check every millimetre so high speed cannot tunnel through a contact
      // or skip a short off pulse between frames.
      const travel=Math.min(1,s.speed*budget,m.distanceRemaining);
      if(travel<1e-9)break;
      s.progress=(s.progress+travel/layout(s).total*100)%100;
      m.distanceRemaining-=travel;budget-=travel/s.speed;
      r=evaluate(s,r.signal);m.sawOff ||= !r.signal;
      if(s.stopOnFault&&r.collision){block('collision');break;}
      if(m.distanceRemaining<1e-7){
        m.completed++;m.phase='dwell';m.remaining=s.dwell;
        }
    }
  }
  return r;
}

// Geometric checkpoints under the tip, ordered from the beginning of the cycle.
// Influence is history independent; no binary state is inferred inside hysteresis.
export function previewCycle(s){
  const l=layout(s),z=sensorPose(s).z;
  const wrap=v=>((v%l.total)+l.total)%l.total;
  const rows=[];
  for(let id=0;id<6;id++){
    for(const kind of ['form','gap']){
      const center=l.centres[id]+(kind==='gap'?(143+l.gaps[id])/2:0);
      let distance=wrap(z-center);if(l.total-distance<1e-7)distance=0;
      const progress=distance/l.total*100,r=evaluate({...s,progress},false);
      const row={kind,id,nextId:(id+1)%6,progress,influence:r.influence,collision:r.collision};
      if(kind==='gap'){
        const span=143+l.gaps[id],start=wrap(z-l.centres[(id+1)%6]);
        row.minimumInfluence=r.influence;row.minimumProgress=progress;
        // Include both form centres; sample at <= 1 mm, plus the exact gap centre.
        const steps=Math.ceil(span);
        for(let j=0;j<=steps;j++){
          const q=wrap(start+span*j/steps)/l.total*100;
          const v=evaluate({...s,progress:q},false).influence;
          if(v<row.minimumInfluence){row.minimumInfluence=v;row.minimumProgress=q;}
        }
      }
      rows.push(row);
    }
  }
  return rows.sort((a,b)=>a.progress-b.progress);
}
