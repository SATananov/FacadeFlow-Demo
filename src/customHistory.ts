export interface HistoryState<T> { past: T[]; present: T; future: T[] }
export const createHistory = <T,>(initial: T): HistoryState<T> => ({ past: [], present: initial, future: [] })
export const pushHistory = <T,>(history: HistoryState<T>, next: T): HistoryState<T> => ({ past: [...history.past, history.present], present: next, future: [] })
export const undoHistory = <T,>(history: HistoryState<T>): HistoryState<T> => history.past.length ? { past: history.past.slice(0, -1), present: history.past.at(-1) as T, future: [history.present, ...history.future] } : history
export const redoHistory = <T,>(history: HistoryState<T>): HistoryState<T> => history.future.length ? { past: [...history.past, history.present], present: history.future[0] as T, future: history.future.slice(1) } : history

