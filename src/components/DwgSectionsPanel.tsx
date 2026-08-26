import type { DwgSection } from '../dwgViewerTypes'

interface Props { sections: DwgSection[]; selectedSectionId: string | null; onSelect: (sectionId: string) => void; onBack: () => void }

export function DwgSectionsPanel({ sections, selectedSectionId, onSelect, onBack }: Props) {
  if (!sections.length) return <p className="dwg-section-help" role="status">Не са открити достатъчно надеждни външни секционни рамки. Canvas навигацията остава непроменена.</p>
  return <section className="dwg-sections" aria-labelledby="dwg-sections-title">
    <div><b id="dwg-sections-title">Открити секции: {sections.length}</b><span>Щракнете върху секция, за да я покажете на цял екран.</span></div>
    <div className="dwg-section-actions" role="group" aria-label="Навигация по открити секции">
      {sections.map((section, index) => <button key={section.sectionId} type="button" aria-pressed={selectedSectionId === section.sectionId} title={section.reason} onClick={() => onSelect(section.sectionId)}>Секция {index + 1}</button>)}
      {selectedSectionId && <button type="button" className="dwg-section-back" onClick={onBack}>Назад към целия чертеж</button>}
    </div>
  </section>
}
