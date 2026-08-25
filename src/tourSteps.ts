import type { TourStep } from './helpTypes'
export const tourSteps: TourStep[] = [
  { id: 'profile', targetId: 'profile-panel', title: 'Проект и профил', description: 'Тук се задават проектът, профилът, размерите и ориентацията.' },
  { id: 'template', targetId: 'product-template', title: 'Схема на изделието', description: 'Отворете каталога и сравнете REF схемата с оригинала.' },
  { id: 'visualization', targetId: 'product-visualization', title: 'Визуализация', description: 'Този бутон отваря демонстрационния продуктов preview.' },
  { id: 'operations', targetId: 'operations-panel', title: 'Операции', description: 'Операциите се добавят ръчно и само след технологична проверка.' },
  { id: 'validation', targetId: 'validation-status', title: 'Проверки', description: 'Глобалното състояние включва запазените данни и текущата operation форма.' },
  { id: 'export', targetId: 'simulation-export', title: 'Симулационен export', description: 'Достъпен е само при валидно състояние и никога не е машинен файл.' },
  { id: 'import', targetId: 'unified-import', title: 'Импортен център', description: 'Изберете route преди локалния файл.' },
  { id: 'formats', targetId: 'format-selector', title: 'Формат', description: 'Картите описват възможностите и ограниченията на всеки формат.' },
  { id: 'viewer', targetId: 'source-viewer', title: 'Оригинален източник', description: 'Viewer-ът пази пропорциите и служи за авторитетно визуално сравнение.' },
  { id: 'recognition', targetId: 'source-viewer', title: 'OCR и анализ', description: 'Контролите във viewer-а стартират анализ само след изрично потвърдена зона.' },
  { id: 'captured', targetId: 'import-workspace', title: 'Заснети изделия', description: 'В долната част на import workspace се редактират, филтрират и проверяват локалните записи.' },
  { id: 'gate', targetId: 'import-workspace', title: 'VERIFIED gate', description: 'В списъка „Заснети изделия“ само човешки проверен запис може да се зареди в workflow.' },
  { id: 'help', targetId: 'help-button', title: 'Помощ', description: 'Помощта и обиколката могат да бъдат отворени отново по всяко време.' },
]
