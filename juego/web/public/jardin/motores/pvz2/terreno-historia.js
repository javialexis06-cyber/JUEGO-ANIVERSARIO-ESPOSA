/* Geometría de territorios sobre componentes nativos. Solo instancias de historia.
 * No cambia animaciones, daños, velocidades ni habilidades de las unidades. */
(() => {
    if(!window.semillaHistoriaMotor) return;
    const m=n=>System.get(`chunks:///_virtual/${n}.ts`);
    let cc,config,instalado=false;
    window.semillaTerrenoHistoria={
        instalar(motor,c) {
            cc=motor;config=c;
            if(instalado)return;instalado=true;
            const S=m('Square').Square,original=S.prototype.onLoad;
            S.prototype.onLoad=function() {
                // La escena distribuida trae cinco filas. El resto de filas se construye
                // con sus propios Lane/LnC/LnCLower, no redirigiendo a una fila existente.
                S.LaneCount=5;S.MaxLaneIndex=4;S.SquareHeight=80.77;
                original.call(this);
                if(!config||config.filas<=5)return;
                const cantidad=config.filas,rows=this.node.parent.getChildByName('squaresLower');
                const Lane=m('Lane').Lane,LnC=m('LnC').LnC,Lower=m('LnCLower').LnCLower;
                const borde=rows.getChildByName('Row5');borde.name='Row'+cantidad;
                borde.getComponent(Lane).LaneIndex=cantidad;
                for(let fila=5;fila<cantidad;fila++) {
                    const row=cc.instantiate(rows.getChildByName('Row4'));row.name='Row'+fila;row.parent=rows;
                    const lane=row.getComponent(Lane);lane.LaneIndex=fila;
                    lane._UpperLane=null;lane._LowerLane=null;lane._laneLnCs=[];
                    const celdas=[];
                    for(let col=0;col<9;col++) {
                        const node=cc.instantiate(this.node.getChildByName(`Square4${col}`));
                        node.name=`Square${fila}${col}`;node.parent=this.node;
                        const cell=node.getComponent(LnC);cell.lIndex=fila;cell.cIndex=col;cell.RowParent=row;cell.inLane=lane;
                        const low=row.getChildByName(`Square4${col}`);low.name=node.name;low.getComponent(Lower).standardize(node);
                        this.squares.push(node);celdas.push(cell);
                    }
                    this.inLawnLnCs.push(celdas);
                }
                S.LaneCount=cantidad;S.MaxLaneIndex=cantidad-1;S.SquareHeight=80.77*5/cantidad;
                const origen=this.square00.position.clone();origen.y+=(80.77-S.SquareHeight)/2;
                this.lanesInLawn=[];this.laneHere=borde.getComponent(Lane);
                this.LnCHere.inLane=this.laneHere;this.LnCHere.lIndex=cantidad;
                for(let fila=0;fila<cantidad;fila++) {
                    const lane=rows.getChildByName('Row'+fila).getComponent(Lane);
                    lane._UpperLane=null;lane._LowerLane=null;lane._laneLnCs=[];this.lanesInLawn.push(lane);
                    for(let col=0;col<9;col++) {
                        const cell=this.inLawnLnCs[fila][col];
                        cell.node.setPosition(origen.x+col*S.SquareWidth,origen.y-fila*S.SquareHeight,origen.z);
                        cell.squareLower.standardize(cell.node);cell.standardize();
                    }
                    lane.midY=S.getSquareWorldPosition(fila,0).y;
                }
                this.laneHere.midY=S.getSquareWorldPosition(cantidad,0).y;
            };
        },
        async aplicar(c) {
            const S=m('Square').Square,lawn=m('FrontYard').FrontYard.CurrentLawn;
            Object.defineProperty(lawn,'DisabledLanes',{configurable:true,get:()=>Array.from({length:S.LaneCount-c.filas},(_,i)=>c.filas+i)});
            Object.defineProperty(lawn,'SeaRows',{configurable:true,get:()=>c.agua});
            const pintar=(fila,color,rayas=false)=>{
                const lane=S.getLane(fila),node=new cc.Node('Terreno territorial');node.layer=lane.node.layer;node.parent=lane.tombLayer;
                const punto=(col,x,y)=>{const p=S.getSquareWorldPosition(fila,col,x,y);return node.inverseTransformPoint(new cc.Vec3(),new cc.Vec3(p.x,p.y,0));};
                const a=punto(0,0,0),b=punto(8,1,1),alto=a.y-b.y,g=node.addComponent(cc.Graphics);
                g.fillColor=color;g.rect(a.x,b.y,b.x-a.x,alto);g.fill();
                g.strokeColor=new cc.Color(235,185,65,255);g.lineWidth=8;
                if(rayas){for(let x=a.x-alto;x<b.x;x+=100){g.moveTo(Math.max(x,a.x),b.y+Math.max(0,a.x-x));g.lineTo(Math.min(x+alto,b.x),a.y-Math.max(0,x+alto-b.x));}g.stroke();}
                return {g,a,b};
            };
            for(let fila=c.filas;fila<S.LaneCount;fila++)pintar(fila,new cc.Color(55,54,44,245),true);
            for(const fila of c.agua) {
                S.getLane(fila).isSea=true;
                for(let col=0;col<9;col++)S.getLnC(fila,col).setTileType(m('LnC').SquareType.water);
                const {g,a,b}=pintar(fila,new cc.Color(42,143,169,210));
                g.lineWidth=2;g.strokeColor=new cc.Color(151,224,226,130);
                for(let col=0;col<=9;col++){const x=a.x+(b.x-a.x)*col/9;g.moveTo(x,b.y);g.lineTo(x,a.y);}g.stroke();
            }
            for(const q of c.lapidas??[]) {
                const t=await S.getLnC(q.fila,q.col).SpawnTomb('gravestone_tutorial');
                if(!t)throw Error('No se pudo restaurar una lápida.');
                if(q.vida!==undefined){t.health=Math.min(t.toughness,q.vida);t.onDamaged(t.health,t.health,false);}
            }
            for(const q of c.punto?.crateres??[])S.getLnC(q.fila,q.col).crackleCountdown=q.segundos;
            // Casillas sobre la misma geometría que utiliza la siembra y los impactos.
            if(c.filas>5)for(let fila=0;fila<c.filas;fila++) {
                const {g,a,b}=pintar(fila,new cc.Color(79,136,38,fila%2?20:48));
                g.lineWidth=1;g.strokeColor=new cc.Color(205,227,126,95);
                for(let col=0;col<=9;col++){const x=a.x+(b.x-a.x)*col/9;g.moveTo(x,b.y);g.lineTo(x,a.y);}
                g.moveTo(a.x,b.y);g.lineTo(b.x,b.y);g.moveTo(a.x,a.y);g.lineTo(b.x,a.y);g.stroke();
            }
        }
    };
})();
