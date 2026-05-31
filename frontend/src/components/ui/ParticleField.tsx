import { useEffect, useRef } from "react";

interface ParticleFieldProps {
  count?: number;
  disabled?: boolean;
}

const NEON = ["rgba(99,102,241,","rgba(168,85,247,","rgba(6,182,212,","rgba(236,72,153,","rgba(59,130,246,","rgba(52,211,153,"];
const STAR_COLORS = ["#ffffff","#e0e7ff","#c7d2fe","#a5b4fc","#93c5fd","#67e8f9","#f9a8d4"];

export function ParticleField({ disabled = false }: ParticleFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (disabled || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

    let W = window.innerWidth, H = window.innerHeight;
    const resize = () => { W = window.innerWidth; H = window.innerHeight; canvas.width = W; canvas.height = H; };
    resize();
    window.addEventListener("resize", resize);

    // Stars
    const stars = Array.from({ length: 220 }, () => ({
      x: Math.random()*W, y: Math.random()*H,
      r: 0.3+Math.random()*1.8,
      color: STAR_COLORS[Math.floor(Math.random()*STAR_COLORS.length)],
      base: 0.15+Math.random()*0.7, op: 0,
      ts: 0.005+Math.random()*0.02, tp: Math.random()*Math.PI*2,
    }));

    // Nebulae
    const nebulae = [
      { x:W*.15,y:H*.2,  rx:280,ry:200,color:"rgba(99,102,241,", op:.06,a:0,   rs:.0002 },
      { x:W*.8, y:H*.35, rx:320,ry:240,color:"rgba(168,85,247,", op:.07,a:1.2, rs:-.0003 },
      { x:W*.5, y:H*.75, rx:260,ry:180,color:"rgba(6,182,212,",  op:.05,a:2.4, rs:.00025 },
      { x:W*.25,y:H*.65, rx:200,ry:150,color:"rgba(236,72,153,", op:.04,a:.8,  rs:-.0002 },
    ];

    // Particles
    const particles: { x:number;y:number;vx:number;vy:number;r:number;color:string;op:number;maxOp:number;life:number;decay:number }[] = [];
    const spawn = () => {
      const c = NEON[Math.floor(Math.random()*NEON.length)];
      particles.push({ x:Math.random()*W, y:Math.random()*H, vx:(Math.random()-.5)*.4, vy:(Math.random()-.5)*.4, r:1+Math.random()*3, color:c, op:0, maxOp:.3+Math.random()*.5, life:0, decay:.002+Math.random()*.004 });
    };
    for (let i=0;i<80;i++) spawn();

    // Shooting stars
    const ss: { x:number;y:number;vx:number;vy:number;len:number;op:number;decay:number;color:string;w:number }[] = [];
    let nextShoot = 60+Math.random()*120;
    const spawnSS = () => {
      const a=(Math.random()*40+10)*(Math.PI/180), sp=8+Math.random()*12;
      const colors=["rgba(255,255,255,","rgba(99,102,241,","rgba(6,182,212,","rgba(168,85,247,"];
      ss.push({ x:Math.random()*W*.8, y:Math.random()*H*.4, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp, len:80+Math.random()*120, op:.9+Math.random()*.1, decay:.015+Math.random()*.02, color:colors[Math.floor(Math.random()*colors.length)], w:1+Math.random()*1.5 });
    };

    // Galaxy spiral (offscreen)
    const sc2 = document.createElement("canvas"); sc2.width=W; sc2.height=H;
    const sc = sc2.getContext("2d") as CanvasRenderingContext2D;
    const cx=W/2,cy=H/2;
    for (let arm=0;arm<2;arm++) for (let t=0;t<600;t++) {
      const ang=(t/60)*Math.PI+arm*Math.PI, dist=t*.8;
      const sx=cx+Math.cos(ang)*dist, sy=cy+Math.sin(ang)*dist*.4;
      if (sx<0||sx>W||sy<0||sy>H) continue;
      const op=Math.max(0,.04-t*.00006);
      sc.beginPath(); sc.arc(sx,sy,.8,0,Math.PI*2); sc.fillStyle=`rgba(168,85,247,${op})`; sc.fill();
    }

    let frame=0;
    const draw = () => {
      frame++;
      ctx.clearRect(0,0,W,H);
      const bg=ctx.createRadialGradient(W/2,H/2,0,W/2,H/2,Math.max(W,H)*.8);
      bg.addColorStop(0,"rgba(8,5,20,1)"); bg.addColorStop(.5,"rgba(5,10,25,1)"); bg.addColorStop(1,"rgba(2,4,8,1)");
      ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);
      ctx.drawImage(sc2,0,0);

      // Nebulae
      for (const n of nebulae) {
        n.a+=n.rs; ctx.save(); ctx.translate(n.x,n.y); ctx.rotate(n.a);
        const g=ctx.createRadialGradient(0,0,0,0,0,n.rx);
        g.addColorStop(0,`${n.color}${n.op})`); g.addColorStop(.4,`${n.color}${n.op*.5})`); g.addColorStop(1,`${n.color}0)`);
        ctx.scale(1,n.ry/n.rx); ctx.beginPath(); ctx.arc(0,0,n.rx,0,Math.PI*2); ctx.fillStyle=g; ctx.fill(); ctx.restore();
      }

      // Stars
      for (const s of stars) {
        s.tp+=s.ts; s.op=s.base*(.5+.5*Math.sin(s.tp));
        ctx.save();
        if (s.r>1.2) { ctx.shadowBlur=s.r*6; ctx.shadowColor=s.color; }
        ctx.globalAlpha=s.op; ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2); ctx.fillStyle=s.color; ctx.fill();
        if (s.r>1.4&&s.op>.5) {
          ctx.globalAlpha=s.op*.4; ctx.strokeStyle=s.color; ctx.lineWidth=.5;
          const fl=s.r*4; ctx.beginPath(); ctx.moveTo(s.x-fl,s.y); ctx.lineTo(s.x+fl,s.y); ctx.moveTo(s.x,s.y-fl); ctx.lineTo(s.x,s.y+fl); ctx.stroke();
        }
        ctx.restore();
      }

      // Particles
      for (let i=particles.length-1;i>=0;i--) {
        const p=particles[i]; p.life+=p.decay; p.x+=p.vx; p.y+=p.vy;
        p.op=p.life<.2?(p.life/.2)*p.maxOp:p.life>.7?((1-p.life)/.3)*p.maxOp:p.maxOp;
        if (p.life>=1) { particles.splice(i,1); spawn(); continue; }
        if (p.x<-10) p.x=W+10; if (p.x>W+10) p.x=-10; if (p.y<-10) p.y=H+10; if (p.y>H+10) p.y=-10;
        ctx.save(); ctx.shadowBlur=p.r*8; ctx.shadowColor=`${p.color}.8)`; ctx.globalAlpha=p.op;
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fillStyle=`${p.color}1)`; ctx.fill(); ctx.restore();
      }

      // Shooting stars
      if (--nextShoot<=0) { spawnSS(); nextShoot=80+Math.random()*160; }
      for (let i=ss.length-1;i>=0;i--) {
        const s=ss[i]; s.x+=s.vx; s.y+=s.vy; s.op-=s.decay;
        if (s.op<=0) { ss.splice(i,1); continue; }
        const tx=s.x-s.vx*(s.len/Math.hypot(s.vx,s.vy)), ty=s.y-s.vy*(s.len/Math.hypot(s.vx,s.vy));
        const g=ctx.createLinearGradient(tx,ty,s.x,s.y);
        g.addColorStop(0,`${s.color}0)`); g.addColorStop(.6,`${s.color}${s.op*.4})`); g.addColorStop(1,`${s.color}${s.op})`);
        ctx.save(); ctx.shadowBlur=12; ctx.shadowColor=`${s.color}${s.op})`; ctx.strokeStyle=g; ctx.lineWidth=s.w; ctx.lineCap="round";
        ctx.beginPath(); ctx.moveTo(tx,ty); ctx.lineTo(s.x,s.y); ctx.stroke();
        ctx.globalAlpha=s.op; ctx.beginPath(); ctx.arc(s.x,s.y,s.w*1.5,0,Math.PI*2); ctx.fillStyle=`${s.color}1)`; ctx.fill(); ctx.restore();
      }

      // Horizontal streaks
      if (frame%300===0) {
        const sy=Math.random()*H, sc3=NEON[Math.floor(Math.random()*NEON.length)];
        ctx.save();
        const sg=ctx.createLinearGradient(0,sy,W,sy);
        sg.addColorStop(0,`${sc3}0)`); sg.addColorStop(.3,`${sc3}.12)`); sg.addColorStop(.5,`${sc3}.2)`); sg.addColorStop(.7,`${sc3}.12)`); sg.addColorStop(1,`${sc3}0)`);
        ctx.strokeStyle=sg; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(0,sy); ctx.lineTo(W,sy); ctx.stroke(); ctx.restore();
      }

      rafRef.current=requestAnimationFrame(draw);
    };
    rafRef.current=requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(rafRef.current); window.removeEventListener("resize",resize); };
  }, [disabled]);

  if (disabled) return null;
  return <canvas ref={canvasRef} aria-hidden="true" style={{ position:"fixed",inset:0,zIndex:0,pointerEvents:"none",display:"block" }} />;
}

export default ParticleField;
