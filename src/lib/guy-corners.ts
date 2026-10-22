import { number } from './geometry';
import { azimuth, coordinates, localBearing, pivotFor, resultFor, type GuyCornerSetup, type GuyId, type TowerProject } from './tower';

export const defaultGuyCornerSetup=():GuyCornerSetup=>({mode:'A',localFrame:'line',distanceA:'',stationAlong:'',stationRight:'',offset:'0',useUtm:false});
export const guyCornerSetup=(p:TowerProject,id:GuyId):GuyCornerSetup=>p.guys[id].corners??defaultGuyCornerSetup();
export function updateGuyCornerSetup(p:TowerProject,id:GuyId,patch:Partial<GuyCornerSetup>):TowerProject {
  return {...p,guys:{...p.guys,[id]:{...p.guys[id],corners:{...guyCornerSetup(p,id),...patch}}}};
}
export type GuyCorner={id:string;along:number;right:number;n:number;e:number};

/** Along points from the design pivot toward the block; right is clockwise from it.
 * C+X+K ends at the midpoint of the near 2 m face. The block extends 1 m outward.
 * Numbering follows the sketch: near right, near left, far left, far right.
 */
export function guyCorners(p:TowerProject,id:GuyId){
  const setup=guyCornerSetup(p,id),pivot=pivotFor(p,id),result=resultFor(p,id);
  const errors:string[]=[],offset=number(setup.offset);
  const distance=result.valid?result.distanceTotal:null;
  if(distance===null||distance<=0)errors.push('Completa C, X y K y revisa el ajuste de terreno del tirante.');
  if(!Number.isFinite(offset)||offset<0)errors.push('Ingresa un offset mayor o igual que cero.');
  const along=number(setup.mode==='A'?setup.distanceA:setup.stationAlong);
  const right=setup.mode==='A'?0:number(setup.stationRight);
  let axis:number|null=null,origin:{n:number;e:number}|null=null;
  if(setup.useUtm){
    const e=coordinates(p.survey.coords.E),f=coordinates(p.survey.coords.F),bearing=localBearing(p,id);
    const direction=e&&f?azimuth(f,e):null;
    if(e&&f&&direction!==null&&bearing!==null){axis=(direction+bearing)*Math.PI/180;origin=pivot==='E'?e:f;}
    else errors.push('Completa N/E de E′ y F′ en Ajustes, verifica que no coincidan y revisa φ.');
  }else if((setup.mode==='A'||setup.localFrame==='station')&&(!Number.isFinite(along)||(setup.mode==='A'&&along<=0)||!Number.isFinite(right)||Math.hypot(along,right)<1e-8)){
    errors.push(setup.mode==='A'?`Ingresa una distancia horizontal positiva entre T${id}-A y ${pivot}′.`:'Copia N0 y E0 con sus signos desde OCC de Punto–Línea. La estación no puede coincidir con el pivote.');
  }
  const corners:GuyCorner[]=[];
  if(errors.length===0&&distance!==null){
    const near=distance-offset,far=distance+1+offset,half=1+offset;
    const definitions=[{along:near,right:half},{along:near,right:-half},{along:far,right:-half},{along:far,right:half}];
    definitions.forEach((c,i)=>{
      let n:number,e:number;
      if(setup.useUtm&&axis!==null&&origin){
        n=origin.n+c.along*Math.cos(axis)-c.right*Math.sin(axis);
        e=origin.e+c.along*Math.sin(axis)+c.right*Math.cos(axis);
      }else if(setup.mode==='PL'&&setup.localFrame!=='station'){
        // SOUTH N6+ Point to Line: P1 is origin, P1->P2 is north; east is right.
        n=c.along;e=c.right;
      }else{
        // Station at (along,right) in the line frame. Local north sights the pivot;
        // local east is clockwise, including the rotation needed for off-line PL.
        const range=Math.hypot(along,right);
        n=((along-c.along)*along+(right-c.right)*right)/range;
        e=(right*c.along-along*c.right)/range;
      }
      corners.push({id:`T${id}${i+1}`,...c,n,e});
    });
  }
  return {corners,errors,distance,pivot,along,right,setup};
}
