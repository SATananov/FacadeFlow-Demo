import { useEffect, useMemo, useRef, useState } from "react";
import { fitDwgView, zoomDwgView } from "../dwgBounds";
import {
  canvasPointToDwgWorld,
  DWG_SECTION_RULES,
  hitTestDwgSection,
  isDwgSectionClick,
} from "../dwgSectionDetection";
import {
  hitTestDwgVisualField,
  hitTestVisibleDwgText,
  type DwgCorrectionStep,
  type DwgManualTextAssignment,
  type DwgTextHitCandidate,
} from "../dwgManualTextCorrection";
import {
  canvasPixelsToDwgLocal,
  dwgCanvasFont,
  layoutDwgText,
} from "../dwgTextLayout";
import { isDwgTextVisibleAtScale } from "../dwgTextNormalization";
import type {
  DwgDecodeResult,
  DwgSection,
  DwgViewState,
} from "../dwgViewerTypes";
import type {
  DwgApproximateTextAssignment,
  DwgVisualField,
} from "../dwgVisualFieldDetection";
import type { DwgVisualTextEditorState } from "../dwgVisualTextEditor";
import {
  isDwgCanvasNavigationAvailable,
  shouldDwgCanvasCaptureWheel,
} from "../dwgCanvasNavigation";

interface Props {
  drawing: DwgDecodeResult;
  visibleLayers: ReadonlySet<string>;
  showText: boolean;
  approximateText: boolean;
  displayAssignments: ReadonlyMap<
    number,
    DwgApproximateTextAssignment | DwgManualTextAssignment
  >;
  visualFields: readonly DwgVisualField[];
  correctionStep: DwgCorrectionStep;
  selectedEntityIndex: number | null;
  visualTextEditor: DwgVisualTextEditorState;
  dark: boolean;
  fitToken: number;
  resetToken: number;
  selectedSection: DwgSection | null;
  onSelectCorrectionText: (entityIndex: number) => void;
  onSelectCorrectionField: (fieldId: string) => void;
  onSelectVisualSource: (entityIndex: number) => void;
  onMoveVisualSource: (entityIndex: number, dx: number, dy: number) => void;
  onSetVisualSourceBox: (
    entityIndex: number,
    bounds: { minX: number; minY: number; maxX: number; maxY: number },
  ) => void;
  onPlaceVisualNote: (position: { x: number; y: number }) => void;
  onSelectSection: (sectionId: string) => void;
}
export function DwgCanvas({
  drawing,
  visibleLayers,
  showText,
  approximateText,
  displayAssignments,
  visualFields,
  correctionStep,
  selectedEntityIndex,
  visualTextEditor,
  dark,
  fitToken,
  resetToken,
  selectedSection,
  onSelectCorrectionText,
  onSelectCorrectionField,
  onSelectVisualSource,
  onMoveVisualSource,
  onSetVisualSourceBox,
  onPlaceVisualNote,
  onSelectSection,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null),
    hostRef = useRef<HTMLDivElement>(null),
    renderedText = useRef<DwgTextHitCandidate[]>([]),
    drag = useRef<{
      x: number;
      y: number;
      view: DwgViewState;
      panning: boolean;
    } | null>(null),
    editorGesture = useRef<{
      kind: "MOVE" | "BOX";
      entityIndex: number;
      start: { x: number; y: number };
    } | null>(null),
    suppressClick = useRef(false),
    handledResetToken = useRef(resetToken);
  const [size, setSize] = useState({ width: 0, height: 0 }),
    [view, setView] = useState<DwgViewState>({
      scale: 1,
      offsetX: 0,
      offsetY: 0,
    }),
    [hoveredFieldId, setHoveredFieldId] = useState<string | null>(null),
    [editorPreview, setEditorPreview] = useState<{
      dx: number;
      dy: number;
      box: { minX: number; minY: number; maxX: number; maxY: number } | null;
    }>({ dx: 0, dy: 0, box: null }),
    [navigationActive, setNavigationActive] = useState(false);
  const activeBounds = selectedSection?.bounds ?? drawing.bounds;
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
      if (entry)
        setSize({
          width: Math.max(320, Math.round(entry.contentRect.width)),
          height: Math.max(360, Math.round(entry.contentRect.height)),
        });
    });
    if (hostRef.current) observer.observe(hostRef.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!size.width || !size.height) return;
    /* oxlint-disable-next-line react-hooks/set-state-in-effect -- external fit command synchronizes the canvas viewport */ setView(
      fitDwgView(
        activeBounds,
        size.width,
        size.height,
        selectedSection ? DWG_SECTION_RULES.fitPaddingPixels : 32,
      ),
    );
  }, [activeBounds, fitToken, selectedSection, size]);
  useEffect(() => {
    if (resetToken === handledResetToken.current || !size.width || !size.height)
      return;
    handledResetToken.current = resetToken;
    /* oxlint-disable-next-line react-hooks/set-state-in-effect -- external reset command synchronizes the canvas viewport */ setView(
      fitDwgView(
        activeBounds,
        size.width,
        size.height,
        selectedSection ? DWG_SECTION_RULES.fitPaddingPixels : 32,
      ),
    );
  }, [activeBounds, resetToken, selectedSection, size.width, size.height]);
  useEffect(() => {
    const deactivate = (event: PointerEvent) => {
      if (hostRef.current && !hostRef.current.contains(event.target as Node))
        setNavigationActive(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setNavigationActive(false);
    };
    document.addEventListener("pointerdown", deactivate);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", deactivate);
      document.removeEventListener("keydown", escape);
    };
  }, []);
  const visibleEntities = useMemo(
    () =>
      drawing.entities
        .map((entity, index) => ({ entity, index }))
        .filter(
          ({ entity }) =>
            visibleLayers.has(entity.layer) &&
            (showText || entity.type !== "TEXT"),
        ),
    [drawing.entities, visibleLayers, showText],
  );
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !size.width || !size.height) return;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = size.width * ratio;
    canvas.height = size.height * ratio;
    canvas.style.width = `${size.width}px`;
    canvas.style.height = `${size.height}px`;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.fillStyle = dark ? "#111b20" : "#f6fafb";
    context.fillRect(0, 0, size.width, size.height);
    context.strokeStyle = dark ? "#bce6e8" : "#163b45";
    context.fillStyle = dark ? "#f0f7f7" : "#15353d";
    context.lineWidth = 1;
    renderedText.current = [];
    const map = (x: number, y: number) => ({
      x: x * view.scale + view.offsetX,
      y: -y * view.scale + view.offsetY,
    });
    for (const { entity, index: entityIndex } of visibleEntities) {
      context.beginPath();
      if (entity.type === "LINE") {
        const a = map(entity.start.x, entity.start.y),
          b = map(entity.end.x, entity.end.y);
        context.moveTo(a.x, a.y);
        context.lineTo(b.x, b.y);
        context.stroke();
        continue;
      }
      if (entity.type === "POLYLINE") {
        entity.points.forEach((point, index) => {
          const p = map(point.x, point.y);
          if (!index) context.moveTo(p.x, p.y);
          else context.lineTo(p.x, p.y);
        });
        if (entity.closed) context.closePath();
        context.stroke();
        continue;
      }
      if (entity.type === "CIRCLE" || entity.type === "ARC") {
        const center = map(entity.center.x, entity.center.y);
        context.arc(
          center.x,
          center.y,
          entity.radius * view.scale,
          entity.type === "CIRCLE" ? 0 : -entity.endAngle,
          entity.type === "CIRCLE" ? Math.PI * 2 : -entity.startAngle,
        );
        context.stroke();
        continue;
      }
      if (entity.type === "ELLIPSE") {
        const center = map(entity.center.x, entity.center.y),
          major = Math.hypot(entity.major.x, entity.major.y) * view.scale;
        context.ellipse(
          center.x,
          center.y,
          major,
          major * entity.ratio,
          -Math.atan2(entity.major.y, entity.major.x),
          -entity.endAngle,
          -entity.startAngle,
        );
        context.stroke();
        continue;
      }
      if (!isDwgTextVisibleAtScale(entity.height, view.scale, showText))
        continue;
      const sourceEdit = visualTextEditor.sourceEdits.find(
        (edit) => edit.entityIndex === entityIndex,
      );
      if (sourceEdit?.hidden) continue;
      const previewMove =
        visualTextEditor.selectedEntityIndex === entityIndex &&
        editorGesture.current?.kind === "MOVE"
          ? editorPreview
          : { dx: 0, dy: 0 };
      const worldPosition = {
          x: entity.position.x + (sourceEdit?.offsetX ?? 0) + previewMove.dx,
          y: entity.position.y + (sourceEdit?.offsetY ?? 0) + previewMove.dy,
        },
        position = map(worldPosition.x, worldPosition.y),
        fontSize = Math.min(512, entity.height * view.scale),
        assignment = approximateText
          ? displayAssignments.get(entityIndex)
          : undefined,
        visualBounds = sourceEdit?.box ?? assignment?.innerBounds;
      context.save();
      if (visualBounds) {
        const a = map(visualBounds.minX, visualBounds.maxY),
          b = map(visualBounds.maxX, visualBounds.minY);
        context.beginPath();
        context.rect(a.x, a.y, b.x - a.x, b.y - a.y);
        context.clip();
      }
      context.translate(position.x, position.y);
      context.rotate(-entity.rotation);
      const visualWidth = visualBounds
        ? visualBounds.maxX - visualBounds.minX
        : entity.referenceWidth;
      const layout = layoutDwgText(
        {
          textKind: entity.textKind,
          displayText: entity.displayText,
          runs: entity.runs,
          referenceWidth: visualWidth,
          textHeight: entity.height,
          widthFactor: entity.widthFactor,
          attachmentPoint: entity.attachmentPoint,
          horizontalAlignment: entity.horizontalAlignment,
          verticalAlignment: entity.verticalAlignment,
          lineSpacingFactor: entity.lineSpacing,
          lineSpacingStyle: entity.lineSpacingStyle,
        },
        (text, run) => {
          context.font = dwgCanvasFont(fontSize * run.heightScale);
          return canvasPixelsToDwgLocal(
            context.measureText(text).width,
            view.scale,
            entity.widthFactor * run.widthScale,
          );
        },
      );
      context.textAlign = "left";
      context.textBaseline = "top";
      let offsetX = 0,
        offsetY = 0;
      if (visualBounds) {
        const corners = screenCorners(
            layout.bounds,
            position,
            entity.rotation,
            view.scale,
          ),
          rendered = enclosing(corners),
          a = map(visualBounds.minX, visualBounds.maxY),
          b = map(visualBounds.maxX, visualBounds.minY),
          sx =
            rendered.minX < a.x
              ? a.x - rendered.minX
              : rendered.maxX > b.x
                ? b.x - rendered.maxX
                : 0,
          sy =
            rendered.minY < a.y
              ? a.y - rendered.minY
              : rendered.maxY > b.y
                ? b.y - rendered.maxY
                : 0;
        offsetX =
          (Math.cos(entity.rotation) * sx - Math.sin(entity.rotation) * sy) /
          view.scale;
        offsetY =
          (Math.sin(entity.rotation) * sx + Math.cos(entity.rotation) * sy) /
          view.scale;
      }
      const hitBounds = enclosing(
        screenCorners(
          {
            minX: layout.bounds.minX + offsetX,
            minY: layout.bounds.minY + offsetY,
            maxX: layout.bounds.maxX + offsetX,
            maxY: layout.bounds.maxY + offsetY,
          },
          position,
          entity.rotation,
          view.scale,
        ),
      );
      renderedText.current.push({
        entityIndex,
        bounds: hitBounds,
        unresolvedNoWidth:
          entity.textKind === "MTEXT" &&
          entity.referenceWidth === null &&
          !displayAssignments.has(entityIndex),
      });
      layout.lines.forEach((line) =>
        line.runs.forEach((run) => {
          context.save();
          context.translate(
            (offsetX + run.x) * view.scale,
            (offsetY + layout.anchorOffsetY + line.y) * view.scale,
          );
          context.scale(entity.widthFactor * run.widthScale, 1);
          context.font = dwgCanvasFont(fontSize * run.heightScale);
          context.fillText(run.text.slice(0, 4096), 0, 0);
          context.restore();
        }),
      );
      context.restore();
    }
    for (const note of visualTextEditor.notes)
      drawVisualNote(context, note, map, view.scale, dark);
    if (selectedSection) {
      const a = map(selectedSection.bounds.minX, selectedSection.bounds.maxY),
        b = map(selectedSection.bounds.maxX, selectedSection.bounds.minY);
      context.save();
      context.strokeStyle = "#008b8b";
      context.lineWidth = 2;
      context.setLineDash([7, 5]);
      context.strokeRect(a.x, a.y, b.x - a.x, b.y - a.y);
      context.restore();
    }
    const hovered = visualFields.find((field) => field.id === hoveredFieldId);
    if (correctionStep === "SELECT_FIELD" && hovered) {
      const a = map(hovered.bounds.minX, hovered.bounds.maxY),
        b = map(hovered.bounds.maxX, hovered.bounds.minY);
      context.save();
      context.strokeStyle = "#b94b86";
      context.lineWidth = 3;
      context.setLineDash([4, 3]);
      context.strokeRect(a.x, a.y, b.x - a.x, b.y - a.y);
      context.restore();
    }
    const selected = renderedText.current.find(
      (candidate) => candidate.entityIndex === selectedEntityIndex,
    );
    if (selected) {
      context.save();
      context.strokeStyle = "#7d3bb3";
      context.lineWidth = 3;
      context.setLineDash([6, 3]);
      context.strokeRect(
        selected.bounds.minX,
        selected.bounds.minY,
        selected.bounds.maxX - selected.bounds.minX,
        selected.bounds.maxY - selected.bounds.minY,
      );
      context.restore();
    }
    const editorSelected = renderedText.current.find(
      (candidate) =>
        candidate.entityIndex === visualTextEditor.selectedEntityIndex,
    );
    if (editorSelected) {
      context.save();
      context.strokeStyle = "#db6b18";
      context.lineWidth = 3;
      context.setLineDash([5, 3]);
      context.strokeRect(
        editorSelected.bounds.minX,
        editorSelected.bounds.minY,
        editorSelected.bounds.maxX - editorSelected.bounds.minX,
        editorSelected.bounds.maxY - editorSelected.bounds.minY,
      );
      context.restore();
    }
    if (editorPreview.box) {
      const a = map(editorPreview.box.minX, editorPreview.box.maxY),
        b = map(editorPreview.box.maxX, editorPreview.box.minY);
      context.save();
      context.strokeStyle = "#db6b18";
      context.lineWidth = 3;
      context.setLineDash([5, 3]);
      context.strokeRect(a.x, a.y, b.x - a.x, b.y - a.y);
      context.restore();
    }
  }, [
    approximateText,
    correctionStep,
    dark,
    displayAssignments,
    editorPreview,
    hoveredFieldId,
    selectedEntityIndex,
    selectedSection,
    showText,
    size,
    view,
    visibleEntities,
    visualFields,
    visualTextEditor,
  ]);
  const point = (
    event:
      | React.PointerEvent<HTMLCanvasElement>
      | React.MouseEvent<HTMLCanvasElement>,
  ) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      canvas: { x: event.clientX - rect.left, y: event.clientY - rect.top },
      world: canvasPointToDwgWorld(
        { x: event.clientX - rect.left, y: event.clientY - rect.top },
        view,
      ),
    };
  };
  return (
    <div ref={hostRef} className={`dwg-canvas-host ${dark ? "dark" : ""} ${navigationActive ? "navigation-active" : ""}`}>
      <div className="dwg-navigation-hint" role="status">
        <span>{navigationActive ? "Ръчичката е активна · плъзгане мести · колелцето увеличава" : "Колелцето движи страницата · кликнете върху чертежа за ръчичка"}</span>
        {navigationActive && <button type="button" onClick={(event) => { event.stopPropagation(); setNavigationActive(false) }}>Освободи мишката</button>}
      </div>
      <canvas
        ref={canvasRef}
        aria-label="Локална read-only DWG визуализация с отделен визуален текстов слой."
        tabIndex={0}
        onWheel={(event) => {
          if (!shouldDwgCanvasCaptureWheel(navigationActive, visualTextEditor.mode, correctionStep)) return;
          event.preventDefault();
          const p = point(event);
          setView((current) =>
            zoomDwgView(
              current,
              event.deltaY < 0 ? 1.15 : 1 / 1.15,
              p.canvas.x,
              p.canvas.y,
            ),
          );
        }}
        onPointerDown={(event) => {
          suppressClick.current = false;
          const p = point(event);
          if (visualTextEditor.mode === "MOVE_SOURCE") {
            const text = hitTestVisibleDwgText(
              renderedText.current,
              p.canvas.x,
              p.canvas.y,
            );
            if (text) {
              onSelectVisualSource(text.entityIndex);
              editorGesture.current = {
                kind: "MOVE",
                entityIndex: text.entityIndex,
                start: p.world,
              };
              event.currentTarget.setPointerCapture(event.pointerId);
              return;
            }
          }
          if (
            visualTextEditor.mode === "DRAW_BOX" &&
            visualTextEditor.selectedEntityIndex !== null
          ) {
            editorGesture.current = {
              kind: "BOX",
              entityIndex: visualTextEditor.selectedEntityIndex,
              start: p.world,
            };
            setEditorPreview({
              dx: 0,
              dy: 0,
              box: {
                minX: p.world.x,
                minY: p.world.y,
                maxX: p.world.x,
                maxY: p.world.y,
              },
            });
            event.currentTarget.setPointerCapture(event.pointerId);
            return;
          }
          if (!navigationActive || !isDwgCanvasNavigationAvailable(visualTextEditor.mode, correctionStep)) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          drag.current = {
            x: event.clientX,
            y: event.clientY,
            view,
            panning: false,
          };
        }}
        onPointerMove={(event) => {
          const p = point(event),
            gesture = editorGesture.current;
          if (gesture?.kind === "MOVE") {
            setEditorPreview({
              dx: p.world.x - gesture.start.x,
              dy: p.world.y - gesture.start.y,
              box: null,
            });
            suppressClick.current = true;
            return;
          }
          if (gesture?.kind === "BOX") {
            setEditorPreview({
              dx: 0,
              dy: 0,
              box: {
                minX: gesture.start.x,
                minY: gesture.start.y,
                maxX: p.world.x,
                maxY: p.world.y,
              },
            });
            suppressClick.current = true;
            return;
          }
          if (correctionStep === "SELECT_FIELD" && selectedSection)
            setHoveredFieldId(
              hitTestDwgVisualField(
                visualFields,
                selectedSection.sectionId,
                p.world.x,
                p.world.y,
              )?.id ?? null,
            );
          const current = drag.current;
          if (!current) return;
          if (
            !current.panning &&
            !isDwgSectionClick(
              { x: current.x, y: current.y },
              { x: event.clientX, y: event.clientY },
            )
          ) {
            current.panning = true;
            suppressClick.current = true;
          }
          if (current.panning)
            setView({
              ...current.view,
              offsetX: current.view.offsetX + event.clientX - current.x,
              offsetY: current.view.offsetY + event.clientY - current.y,
            });
        }}
        onPointerUp={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId))
            event.currentTarget.releasePointerCapture(event.pointerId);
          const gesture = editorGesture.current;
          if (
            gesture?.kind === "MOVE" &&
            (editorPreview.dx || editorPreview.dy)
          )
            onMoveVisualSource(
              gesture.entityIndex,
              editorPreview.dx,
              editorPreview.dy,
            );
          if (
            gesture?.kind === "BOX" &&
            editorPreview.box &&
            Math.abs(editorPreview.box.maxX - editorPreview.box.minX) > 1 &&
            Math.abs(editorPreview.box.maxY - editorPreview.box.minY) > 1
          )
            onSetVisualSourceBox(gesture.entityIndex, editorPreview.box);
          editorGesture.current = null;
          setEditorPreview({ dx: 0, dy: 0, box: null });
          drag.current = null;
        }}
        onPointerCancel={() => {
          suppressClick.current = true;
          drag.current = null;
          editorGesture.current = null;
          setEditorPreview({ dx: 0, dy: 0, box: null });
        }}
        onClick={(event) => {
          if (suppressClick.current) {
            suppressClick.current = false;
            return;
          }
          const p = point(event);
          if (visualTextEditor.mode === "PLACE_NOTE") {
            onPlaceVisualNote(p.world);
            return;
          }
          if (visualTextEditor.mode === "SELECT_SOURCE") {
            const text = hitTestVisibleDwgText(
              renderedText.current,
              p.canvas.x,
              p.canvas.y,
            );
            if (text) onSelectVisualSource(text.entityIndex);
            return;
          }
          if (correctionStep === "SELECT_TEXT") {
            const text = hitTestVisibleDwgText(
              renderedText.current,
              p.canvas.x,
              p.canvas.y,
            );
            if (text) onSelectCorrectionText(text.entityIndex);
            return;
          }
          if (correctionStep === "SELECT_FIELD" && selectedSection) {
            const field = hitTestDwgVisualField(
              visualFields,
              selectedSection.sectionId,
              p.world.x,
              p.world.y,
            );
            if (field) onSelectCorrectionField(field.id);
            return;
          }
          if (!navigationActive) {
            setNavigationActive(true);
            return;
          }
          const section = hitTestDwgSection(drawing.sections, p.world);
          if (section) onSelectSection(section.sectionId);
        }}
      />
    </div>
  );
}

function screenCorners(
  bounds: { minX: number; minY: number; maxX: number; maxY: number },
  position: { x: number; y: number },
  rotation: number,
  scale: number,
) {
  return [
    [bounds.minX, bounds.minY],
    [bounds.maxX, bounds.minY],
    [bounds.minX, bounds.maxY],
    [bounds.maxX, bounds.maxY],
  ].map(([x, y]) => ({
    x: position.x + (Math.cos(rotation) * x + Math.sin(rotation) * y) * scale,
    y: position.y + (-Math.sin(rotation) * x + Math.cos(rotation) * y) * scale,
  }));
}
function enclosing(points: Array<{ x: number; y: number }>) {
  return {
    minX: Math.min(...points.map((point) => point.x)),
    minY: Math.min(...points.map((point) => point.y)),
    maxX: Math.max(...points.map((point) => point.x)),
    maxY: Math.max(...points.map((point) => point.y)),
  };
}
function drawVisualNote(
  context: CanvasRenderingContext2D,
  note: DwgVisualTextEditorState["notes"][number],
  map: (x: number, y: number) => { x: number; y: number },
  scale: number,
  dark: boolean,
) {
  const position = map(note.position.x, note.position.y),
    fontSize = Math.max(8, Math.min(256, note.height * scale)),
    maxWidth = Math.max(20, note.width * scale),
    words = note.text.split(/\s+/),
    lines: string[] = [];
  context.save();
  context.font = dwgCanvasFont(fontSize);
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (line && context.measureText(next).width > maxWidth) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  context.fillStyle = dark ? "#ffd7a8" : "#9b4200";
  context.textBaseline = "top";
  context.textAlign = note.align;
  const x =
    note.align === "center"
      ? position.x + maxWidth / 2
      : note.align === "right"
        ? position.x + maxWidth
        : position.x;
  lines.forEach((text, index) =>
    context.fillText(
      text.slice(0, 4096),
      x,
      position.y + index * fontSize * 1.2,
    ),
  );
  context.restore();
}
