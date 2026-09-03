export type LeadSourceMenuRect = {
  top: number;
  right: number;
  bottom: number;
  left: number;
  width: number;
};

export type LeadSourceMenuPosition = {
  left: number;
  top: number;
  width: number;
  maxHeight: number;
  placement: 'above' | 'below';
};

const MENU_GAP = 8;
const MENU_MAX_HEIGHT = 288;
const VIEWPORT_GUTTER = 8;

export function leadSourceMenuPosition(
  trigger: LeadSourceMenuRect,
  boundary: Pick<LeadSourceMenuRect, 'top' | 'bottom'>,
  viewport: { width: number; height: number },
): LeadSourceMenuPosition {
  const boundaryTop = Math.max(VIEWPORT_GUTTER, boundary.top);
  const boundaryBottom = Math.min(viewport.height - VIEWPORT_GUTTER, boundary.bottom);
  const spaceAbove = Math.max(0, trigger.top - boundaryTop - MENU_GAP);
  const spaceBelow = Math.max(0, boundaryBottom - trigger.bottom - MENU_GAP);
  const placement = spaceBelow >= MENU_MAX_HEIGHT || spaceBelow >= spaceAbove ? 'below' : 'above';
  const maxHeight = Math.min(MENU_MAX_HEIGHT, placement === 'below' ? spaceBelow : spaceAbove);
  const width = Math.min(trigger.width, viewport.width - (VIEWPORT_GUTTER * 2));
  const left = Math.min(
    Math.max(VIEWPORT_GUTTER, trigger.left),
    Math.max(VIEWPORT_GUTTER, viewport.width - VIEWPORT_GUTTER - width),
  );

  return {
    left,
    top: placement === 'below'
      ? trigger.bottom + MENU_GAP
      : trigger.top - MENU_GAP - maxHeight,
    width,
    maxHeight,
    placement,
  };
}
