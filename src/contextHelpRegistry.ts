import type { ContextHelpEntry } from './helpTypes'
const entries: ContextHelpEntry[] = [
  { id: 'orientation', title: 'Ориентация', explanation: 'Определя дали X координатата започва от левия или десния край на профила.' },
  { id: 'x', title: 'X', explanation: 'Позиция по дължината на профила спрямо избраното начало.' }, { id: 'y', title: 'Y', explanation: 'Напречна позиция в рамките на ширината на профила.' }, { id: 'z', title: 'Z', explanation: 'Демонстрационна референция за инструмент или дълбочина; не е машинна ос.' },
  { id: 'diameter', title: 'Диаметър', explanation: 'Размер на демонстрационната пробивна операция.' }, { id: 'depth', title: 'Дълбочина', explanation: 'Демонстрационно навлизане на операцията; изисква технологична проверка.' },
  { id: 'template', title: 'Схема', explanation: 'REF визуална концепция на изделието, която трябва да се сравни с оригинала.' }, { id: 'source-page', title: 'Страница на източника', explanation: 'Страницата, от която е въведен или предложен конкретният запис.' },
  { id: 'draft', title: 'DRAFT', explanation: 'Чернова — записът все още се попълва.' }, { id: 'needs-review', title: 'NEEDS_REVIEW', explanation: 'Изисква проверка — данните са въведени или предложени, но не са потвърдени.' }, { id: 'verified', title: 'VERIFIED', explanation: 'Проверено от човек — може да се зареди в работния процес, но не е готово за машина.' },
  { id: 'ocr-confidence', title: 'OCR confidence', explanation: 'Оценка на разпознаването, а не доказателство за коректност. Ниските стойности обичайно се редактират или отхвърлят.' }, { id: 'similarity', title: 'Демонстрационно сходство', explanation: 'Помощна подредба спрямо REF схеми; не е вероятност или автоматично решение.' },
  { id: 'machine-ready', title: 'machineReady: false', explanation: 'Няма технологично одобрение и не може да бъде изпратено към машина.' }, { id: 'sha256', title: 'SHA-256', explanation: 'Локален цифров отпечатък за проследимост на източника; не разкрива съдържанието му.' },
  { id: 'cad-status', title: 'DWG/DXF статус', explanation: 'Файлът е проверен безопасно само по заглавна част или структура; не е визуализиран или преобразуван.' }, { id: 'simulation-export', title: 'Симулационен export', explanation: 'Създава само тестов JSON. Не създава MECAL, LTE, XM, G-code или CNC файл.' },
  { id: 'profile-frame', title: 'Каса', explanation: 'Неподвижната външна рамка на изделието. Избраният профил е само симулационна референция.' },
  { id: 'profile-sash', title: 'Крило', explanation: 'Профилът за отваряемата част. Посоката LEFT/RIGHT следва експертно потвърдената визуална конвенция.' },
  { id: 'profile-mullion', title: 'Делител', explanation: 'Профилът, който визуално разделя две полета. Съединенията и отнеманията не се изчисляват.' },
  { id: 'profile-dimensions', title: 'Размер A и Размер B', explanation: 'Неутрални временни полета. Професионалните им имена и технологично значение предстоят за потвърждение.' },
  { id: '3d-camera', title: '3D камера', explanation: 'Orbit, zoom, pan и фиксираните изгледи променят само гледната точка, не изделието.' },
  { id: '3d-visibility', title: '3D видимост', explanation: 'Скрива или показва концептуални части само в текущия преглед.' },
  { id: '3d-depth', title: 'Концептуална дълбочина', explanation: 'Временна view-only стойност. Не използва Размер A/B и не е потвърдено профилно сечение.' },
  { id: '3d-exploded', title: 'Разглобен изглед', explanation: 'Раздалечава частите визуално. Не показва ред или технология на сглобяване.' },
  { id: 'dimension-annotations', title: 'Размерни означения', explanation: 'Показват проектни или геометрично изведени стойности. Производствени отнемания и допуски не са приложени.' },
  { id: 'overall-dimensions', title: 'Общи размери', explanation: 'Ширина и височина от текущия структуриран продукт или човешки потвърден import evidence.' },
  { id: 'field-dimensions', title: 'Размери на полета', explanation: 'Детерминистично изведени от текущата REF или custom split геометрия.' },
  { id: 'divider-dimensions', title: 'Позиции на делители', explanation: 'Проектни позиции спрямо началото на изделието, без производствени отнемания.' },
]
export const contextualHelp = Object.fromEntries(entries.map((entry) => [entry.id, entry])) as Record<string, ContextHelpEntry>
