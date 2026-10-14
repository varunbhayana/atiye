/**
 * Pointer-based drag & drop with a built-in click/tap alternative.
 *  - press + move > 8px  → drag; dropping over an element with data-dropzone="<id>" calls onDrop(id)
 *  - press + release without moving → onTap() (so every drag task can be done by clicking)
 *  - Enter / Space → onTap() (keyboard)
 * A failed drop (released elsewhere) simply snaps back.
 */
import { useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';

interface Props {
  id: string;
  onTap?: () => void;
  onDrop?: (zone: string) => void;
  onHoverZone?: (zone: string | null) => void;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
  label: string;
  children: ReactNode;
  testId?: string;
}

function zoneAt(x: number, y: number, self: HTMLElement | null): string | null {
  const els = document.elementsFromPoint(x, y);
  for (const el of els) {
    if (self && self.contains(el)) continue;
    const z = (el as HTMLElement).closest?.('[data-dropzone]');
    if (z) return z.getAttribute('data-dropzone');
  }
  return null;
}

export function Draggable({ id, onTap, onDrop, onHoverZone, disabled, className = '', style, label, children, testId }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const start = useRef<{ x: number; y: number; pointer: number } | null>(null);
  const [offset, setOffset] = useState<{ x: number; y: number } | null>(null);
  const lastZone = useRef<string | null>(null);

  const end = (e: ReactPointerEvent<HTMLDivElement>) => {
    const s = start.current;
    start.current = null;
    if (!s) return;
    try {
      ref.current?.releasePointerCapture(s.pointer);
    } catch {
      /* ignore */
    }
    const moved = Math.hypot(e.clientX - s.x, e.clientY - s.y);
    setOffset(null);
    onHoverZone?.(null);
    lastZone.current = null;
    if (moved < 8) {
      onTap?.();
      return;
    }
    const zone = zoneAt(e.clientX, e.clientY, ref.current);
    if (zone) onDrop?.(zone);
  };

  return (
    <div
      ref={ref}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={label}
      aria-disabled={disabled}
      data-testid={testId}
      data-drag-id={id}
      className={`draggable ${offset ? 'dragging' : ''} ${disabled ? 'pointer-events-none opacity-50' : ''} ${className}`}
      style={{ ...style, transform: offset ? `translate(${offset.x}px, ${offset.y}px) scale(1.08)` : style?.transform, position: style?.position ?? 'relative' }}
      onPointerDown={(e) => {
        if (disabled || e.button !== 0) return;
        start.current = { x: e.clientX, y: e.clientY, pointer: e.pointerId };
        try {
          ref.current?.setPointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
      }}
      onPointerMove={(e) => {
        const s = start.current;
        if (!s) return;
        const dx = e.clientX - s.x;
        const dy = e.clientY - s.y;
        if (!offset && Math.hypot(dx, dy) < 8) return;
        setOffset({ x: dx, y: dy });
        const z = zoneAt(e.clientX, e.clientY, ref.current);
        if (z !== lastZone.current) {
          lastZone.current = z;
          onHoverZone?.(z);
        }
      }}
      onPointerUp={end}
      onPointerCancel={() => {
        start.current = null;
        setOffset(null);
        onHoverZone?.(null);
      }}
      onKeyDown={(e) => {
        if (disabled) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onTap?.();
        }
      }}
    >
      {children}
    </div>
  );
}
