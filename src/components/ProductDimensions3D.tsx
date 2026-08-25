import type { DimensionAnnotation, DimensionVisibility } from '../dimensionTypes'
import { DimensionLine3D } from './DimensionLine3D'
interface Props { annotations: DimensionAnnotation[]; visibility: DimensionVisibility; width: number; height: number }
const shown = (item: DimensionAnnotation, value: DimensionVisibility) => value.all && (item.type.startsWith('OVERALL_') ? value.overall : item.type.startsWith('FIELD_') ? value.fields : item.type.includes('DIVIDER') ? value.dividers : item.type === 'COMPONENT_NOMINAL_LENGTH' ? value.selectedComponent : item.type === 'CONCEPTUAL_DEPTH' ? value.conceptualDepth : false)
export function ProductDimensions3D({ annotations, visibility, width, height }: Props) { return <group>{annotations.filter((item) => shown(item, visibility)).map((item) => <DimensionLine3D key={item.id} annotation={item} width={width} height={height}/>)}</group> }
