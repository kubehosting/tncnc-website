import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

export function jsonOk(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function readJson(request: Request) {
  try {
    return { data: (await request.json()) as Record<string, unknown> };
  } catch {
    return { error: jsonError("Request body must be JSON") };
  }
}

export function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : undefined;
}

export function asOptionalString(value: unknown) {
  if (value === null) {
    return null;
  }
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

export function asBool(value: unknown) {
  return typeof value === "boolean" ? value : undefined;
}

export function asCategoryKind(value: unknown) {
  return value === "MACHINE" || value === "SPARE" ? value : undefined;
}

export function asInt(value: unknown) {
  if (typeof value === "number" && Number.isInteger(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim() && Number.isInteger(Number(value))) {
    return Number(value);
  }
  return undefined;
}

export function asDecimal(value: unknown) {
  if (value === null) {
    return null;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return new Prisma.Decimal(value);
  }
  if (typeof value === "string" && value.trim()) {
    try {
      return new Prisma.Decimal(value);
    } catch {
      return undefined;
    }
  }
  return undefined;
}

export function asDate(value: unknown) {
  if (value === null) {
    return null;
  }
  if (typeof value !== "string" || !value.trim()) {
    return undefined;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function prismaError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return jsonError("A record with that unique value already exists", 409);
    }
    if (error.code === "P2025") {
      return jsonError("Record not found", 404);
    }
    if (error.code === "P2003") {
      return jsonError("Related record is missing or cannot be removed", 409);
    }
  }
  console.error(error);
  return jsonError("Unexpected server error", 500);
}
