/** Safe inside an HTML script element, including application/json and JSON-LD. */
export function serializeInlineJson(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
}

export function shouldRenderPublicPilot(path: string, servicesLoaded: boolean, publishedPaths: ReadonlyMap<string, unknown>): boolean {
  return path === '/newborn-baby-photography-erode' && (!servicesLoaded || publishedPaths.has(path));
}
