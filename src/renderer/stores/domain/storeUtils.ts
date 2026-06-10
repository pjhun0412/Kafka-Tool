export type SetValue<T> = T | ((current: T) => T);

export function resolveValue<T>(value: SetValue<T>, current: T) {
  return typeof value === "function" ? (value as (current: T) => T)(current) : value;
}
