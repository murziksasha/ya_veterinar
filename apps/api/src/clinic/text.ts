import { BadRequestException } from "@nestjs/common";

export function recordOf(body: unknown): Record<string, unknown> {
  return body && typeof body === "object" ? (body as Record<string, unknown>) : {};
}

export function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export function requiredText(value: unknown, max: number): string {
  const cleaned = text(value, max);
  if (!cleaned) {
    throw new BadRequestException("invalid_input");
  }
  return cleaned;
}

export function optionalInt(value: unknown, min: number, max: number): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new BadRequestException("invalid_input");
  }
  return parsed;
}

export function parseDate(value: unknown, required: boolean): Date | null {
  if (value === undefined || value === null || value === "") {
    if (required) {
      throw new BadRequestException("invalid_input");
    }
    return null;
  }
  if (typeof value !== "string") {
    throw new BadRequestException("invalid_input");
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException("invalid_input");
  }
  return date;
}

export function slugFor(name: string, tenantId: string): string {
  const base = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${base || "clinic"}-${tenantId.slice(0, 8)}`;
}
