import type { DoorHingeSide,DoorSwing } from './doorComposerTypes'
export const doorOpeningGeometry=(side:DoorHingeSide,swing:DoorSwing,x:number,y:number,w:number,h:number)=>!side||!swing?null:{path:side==='LEFT'?`M ${x} ${y} L ${x+w} ${y+h/2} L ${x} ${y+h}`:`M ${x+w} ${y} L ${x} ${y+h/2} L ${x+w} ${y+h}`,dash:swing==='OUTWARD'?'7 5':undefined,bounds:{x,y,width:w,height:h}}
