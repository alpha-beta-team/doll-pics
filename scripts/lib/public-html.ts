import { publicHtmlKind } from '../../src/lib/publicHtmlRoutes';
import type { PublicRouteCatalog } from '../../src/lib/publicCatalog';
/** Safe inside an HTML script element, including application/json and JSON-LD. */
export function serializeInlineJson(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
}

export function shouldRenderPublicPage(path: string, catalog: PublicRouteCatalog): boolean {
  return publicHtmlKind(path, catalog) !== undefined;
}
