type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

const toStableValue = (value: unknown): JsonValue => {
  if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => toStableValue(item));
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, entryValue]) => entryValue !== undefined)
      .sort(([a], [b]) => a.localeCompare(b));

    const output: { [key: string]: JsonValue } = {};
    for (const [key, entryValue] of entries) {
      output[key] = toStableValue(entryValue);
    }

    return output;
  }

  return String(value);
};

export const stableStringify = (value: unknown): string => {
  return JSON.stringify(toStableValue(value));
};

export const djb2Hash = (input: string): string => {
  let hash = 5381;

  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 33) ^ input.charCodeAt(index);
  }

  return (hash >>> 0).toString(36);
};

export const computeStableHash = (value: unknown): string => {
  return djb2Hash(stableStringify(value));
};
