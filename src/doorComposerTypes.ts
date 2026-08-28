export type DoorHingeSide = 'LEFT' | 'RIGHT' | null
export type DoorSwing = 'INWARD' | 'OUTWARD' | null
export type DoorInfill = 'SOLID' | 'GLAZED' | 'GLASS_TOP_PANEL_BOTTOM'
export type DoorFieldRole = 'DOOR_LEAF' | 'FIXED_GLAZING'
export type DoorSelectedTool = 'HINGE' | 'HANDLE' | null
export type DoorColor = '' | 'WHITE' | 'ANTHRACITE' | 'BLACK' | 'BROWN' | 'SILVER' | 'CUSTOM'
export interface DoorField { id:string; role:DoorFieldRole; rect:{x:number;y:number;width:number;height:number}; infill:DoorInfill; hingeSide:DoorHingeSide; swing:DoorSwing; splitRatio:number; hingeIds:string[]; handleId:string|null }
export interface DoorHardware { id:string; kind:'HINGE'|'HANDLE'; parentFieldId:string; positionRatio:number; side:'LEFT'|'RIGHT'; handleStyle?:'STANDARD'|'KNOB'|'PULL'|'CUSTOM'; customDescription?:string; source:'DEMO'; simulationOnly:true; machineReady:false; productionApproved:false }
export interface DoorComposition { templateId:string|null; fields:DoorField[]; hardware:DoorHardware[]; selectedFieldId:string|null; selectedHardwareId:string|null; selectedTool:DoorSelectedTool; thresholdStatus:'UNRESOLVED'; thresholdProfileId:null; conceptuallyReviewed:boolean; status:'NEEDS_REVIEW'; interiorColor:DoorColor; exteriorColor:DoorColor; interiorColorCustom:string; exteriorColorCustom:string; sessionOnly:true; simulationOnly:true; machineReady:false; internalEvaluationOnly:true; productionApproved:false; sourceImmutable:true; geometryCreated:false; exportAvailable:false; dwgWriteAvailable:false; machineConnectivityAvailable:false }
