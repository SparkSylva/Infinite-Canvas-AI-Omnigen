// --- utils: catch type & ensure valid value ---
type Option = { value: string | number; label?: string };

const isNil = (v: unknown): v is null | undefined => v === null || v === undefined;

export const coerceString = (v: unknown, d = ""): string =>
  String(isNil(v) ? d : v);

export const coerceNumber = (v: unknown, d = 0): number =>
  isNil(v) || v === "" ? d : Number(v);

export const coerceBool = (v: unknown, d = false): boolean =>
  Boolean(isNil(v) ? d : v);

/** ensure select value in options; otherwise fallback to defaultValue, then fallback to first option */
export const ensureSelectValue = (
  v: unknown,
  options?: Option[],
  defaultValue?: unknown
): string => {
  const opts = options ?? [];
  if (opts.length === 0) return coerceString(isNil(v) ? defaultValue : v, "");
  const values = new Set(opts.map(o => String(o.value)));
  const candidate = coerceString(isNil(v) ? defaultValue : v, String(opts[0].value));
  return values.has(candidate) ? candidate : String(opts[0].value);
};



export const findClosestValidNumber = (input: number, validNumbers: number[] = []): number => {

  // Calculate the closest multiple of 32
  const lowerMultiple = Math.floor(input / 32) * 32;
  const upperMultiple = Math.ceil(input / 32) * 32;
  // Return the closest multiple of 32
  return Math.abs(input - lowerMultiple) <= Math.abs(input - upperMultiple) ? lowerMultiple : upperMultiple;
}
