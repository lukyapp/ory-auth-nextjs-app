export function getFirstSearchParam(param: string | string[] | undefined, fallback = ''): string {
  if (Array.isArray(param)) {
    return param[0] ?? fallback;
  }
  return param ?? fallback;
}
