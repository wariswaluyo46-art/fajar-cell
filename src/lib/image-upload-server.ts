import "server-only";

import { randomBytes } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

import { getSupabaseAdmin } from "./supabase";

export interface DetectedImageType {
  mime: "image/jpeg" | "image/png" | "image/webp";
  ext: "jpg" | "png" | "webp";
}

export const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

/** Verifikasi magic bytes asli gambar agar file berbahaya yang disamarkan ditolak. */
export function detectImageSignature(buffer: Buffer): DetectedImageType | null {
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return { mime: "image/jpeg", ext: "jpg" };
  }

  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { mime: "image/png", ext: "png" };
  }

  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return { mime: "image/webp", ext: "webp" };
  }

  return null;
}

export function buildSafeImageFileName(
  originalName: string,
  ext: string,
  fallbackPrefix: string,
): string {
  const safeSourceName = path.basename(originalName).toLowerCase();
  const baseName = safeSourceName
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-z0-9]/g, "-")
    .slice(0, 40)
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  const randomHex = randomBytes(4).toString("hex");
  return `${baseName || fallbackPrefix}-${randomHex}.${ext}`;
}

function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  return Boolean(url && serviceKey);
}

async function ensurePublicBucket(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  bucketName: string,
  maxBytes: number,
): Promise<boolean> {
  try {
    const { data: buckets, error: listError } =
      await supabase.storage.listBuckets();
    if (listError) return false;

    const existing = buckets?.find((b) => b.name === bucketName);
    if (!existing) {
      const { error: createError } = await supabase.storage.createBucket(
        bucketName,
        {
          public: true,
          allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
          fileSizeLimit: maxBytes,
        },
      );
      if (createError) return false;
    } else if (!existing.public) {
      await supabase.storage.updateBucket(bucketName, { public: true });
    }
    return true;
  } catch {
    return false;
  }
}

export async function uploadImageWithFallback(params: {
  buffer: Buffer;
  detected: DetectedImageType;
  fileName: string;
  bucketName: string;
  storagePrefix: string;
  localPublicSubdir: string;
  maxBytes: number;
}): Promise<{ url: string; fileName: string; storage: "supabase" | "local-fallback" }> {
  const {
    buffer,
    detected,
    fileName,
    bucketName,
    storagePrefix,
    localPublicSubdir,
    maxBytes,
  } = params;

  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseAdmin();
      const bucketReady = await ensurePublicBucket(
        supabase,
        bucketName,
        maxBytes,
      );

      if (bucketReady) {
        const storagePath = `${storagePrefix}/${Date.now()}-${fileName}`;
        const { error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(storagePath, buffer, {
            contentType: detected.mime,
            upsert: true,
          });

        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(storagePath);

          if (publicUrlData?.publicUrl) {
            return {
              url: publicUrlData.publicUrl,
              fileName,
              storage: "supabase",
            };
          }
        }
      }
    } catch (error) {
      console.warn(
        `Supabase Storage bucket "${bucketName}" bermasalah, beralih ke local fallback:`,
        error,
      );
    }
  }

  const uploadDir = path.resolve(
    process.cwd(),
    "public",
    "images",
    localPublicSubdir,
  );
  await fs.mkdir(uploadDir, { recursive: true });

  const localFilePath = path.resolve(uploadDir, fileName);
  if (!localFilePath.startsWith(uploadDir + path.sep)) {
    throw new Error("Path file tidak valid.");
  }

  await fs.writeFile(localFilePath, buffer);

  return {
    url: `/images/${localPublicSubdir}/${fileName}`,
    fileName,
    storage: "local-fallback",
  };
}
