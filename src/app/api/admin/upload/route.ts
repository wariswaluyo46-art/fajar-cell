import { randomBytes } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

import { getAdminSession } from "@/lib/admin-auth";
import { apiError, apiJson } from "@/lib/api-response";
import { checkRateLimit, getClientKey } from "@/lib/rate-limit";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Batas ukuran file maksimal 2 MB */
const MAX_FILE_SIZE = 2 * 1024 * 1024;
const UPLOAD_LIMIT = 20;
const UPLOAD_WINDOW_MS = 60_000;

/** Tipe file gambar yang diizinkan */
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

const BUCKET_NAME = "products";

interface DetectedImageType {
  mime: "image/jpeg" | "image/png" | "image/webp";
  ext: "jpg" | "png" | "webp";
}

/** Verifikasi magic bytes asli gambar agar file berbahaya yang disamarkan ditolak. */
function detectImageSignature(buffer: Buffer): DetectedImageType | null {
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

function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  return Boolean(url && serviceKey);
}

/**
 * Memastikan bucket Supabase Storage sudah ada dan berstatus publik.
 */
async function ensureBucketExists(supabase: ReturnType<typeof getSupabaseAdmin>) {
  try {
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) {
      console.warn("Gagal memeriksa list bucket Supabase Storage:", listError.message);
      return false;
    }

    const existingBucket = buckets?.find((b) => b.name === BUCKET_NAME);
    if (!existingBucket) {
      const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: true,
        allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
        fileSizeLimit: MAX_FILE_SIZE,
      });
      if (createError) {
        console.warn("Gagal membuat bucket Supabase Storage:", createError.message);
        return false;
      }
    } else if (!existingBucket.public) {
      await supabase.storage.updateBucket(BUCKET_NAME, { public: true });
    }
    return true;
  } catch (err) {
    console.warn("Exception saat memeriksa bucket Supabase:", err);
    return false;
  }
}

/**
 * Graceful fallback: Simpan gambar secara lokal ke folder public/images/products/
 */
async function saveLocalFallback(
  buffer: Buffer,
  fileName: string,
): Promise<{ url: string; fileName: string }> {
  const uploadDir = path.resolve(process.cwd(), "public", "images", "products");
  await fs.mkdir(uploadDir, { recursive: true });

  const localFilePath = path.resolve(uploadDir, fileName);
  if (!localFilePath.startsWith(uploadDir + path.sep)) {
    throw new Error("Path file tidak valid.");
  }

  await fs.writeFile(localFilePath, buffer);

  return {
    url: `/images/products/${fileName}`,
    fileName,
  };
}

export async function POST(request: Request): Promise<Response> {
  // 1. Verifikasi sesi admin
  if (!(await getAdminSession())) {
    return apiError("Sesi admin berakhir. Silakan login ulang.", 401);
  }

  const limit = checkRateLimit(
    `admin-upload:${getClientKey(request)}`,
    UPLOAD_LIMIT,
    UPLOAD_WINDOW_MS,
  );
  if (!limit.allowed) {
    const response = apiError(
      `Terlalu banyak unggahan foto. Coba lagi dalam ${limit.retryAfterSeconds} detik.`,
      429,
    );
    response.headers.set("Retry-After", String(limit.retryAfterSeconds));
    return response;
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return apiError("File gambar tidak ditemukan dalam formulir.", 400);
    }

    // 2. Validasi header MIME & ukuran file
    if (file.type && !ALLOWED_MIME_TYPES.has(file.type.toLowerCase())) {
      return apiError(
        "Format file tidak didukung. Harap unggah gambar berekstensi .jpg, .jpeg, .png, atau .webp.",
        400,
      );
    }

    if (file.size === 0 || file.size > MAX_FILE_SIZE) {
      return apiError(
        file.size === 0
          ? "File gambar kosong tidak dapat diunggah."
          : "Ukuran file terlalu besar. Maksimal ukuran gambar adalah 2 MB.",
        400,
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.byteLength === 0 || buffer.byteLength > MAX_FILE_SIZE) {
      return apiError(
        "Ukuran file tidak valid atau melebihi batas maksimal 2 MB.",
        400,
      );
    }

    // 3. Validasi magic bytes header asli gambar (anti spoofing)
    const detected = detectImageSignature(buffer);
    if (!detected) {
      return apiError(
        "Isi file bukan gambar JPEG, PNG, atau WebP yang valid.",
        400,
      );
    }

    // 4. Sanitasi nama file dari path traversal + ekstensi hasil inspeksi biner
    const safeSourceName = path.basename(file.name).toLowerCase();
    const baseName = safeSourceName
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-z0-9]/g, "-")
      .slice(0, 40)
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    const timestamp = Date.now();
    const randomHex = randomBytes(4).toString("hex");
    const fileName = `${baseName || "product"}-${randomHex}.${detected.ext}`;

    // 5. Coba upload ke Supabase Storage jika terkonfigurasi
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseAdmin();
        const bucketReady = await ensureBucketExists(supabase);

        if (bucketReady) {
          // Path sesuai standar: product-images/[timestamp]-[filename]
          const storagePath = `product-images/${timestamp}-${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(storagePath, buffer, {
              contentType: detected.mime,
              upsert: true,
            });

          if (!uploadError) {
            const { data: publicUrlData } = supabase.storage
              .from(BUCKET_NAME)
              .getPublicUrl(storagePath);

            if (publicUrlData?.publicUrl) {
              return apiJson({
                success: true,
                url: publicUrlData.publicUrl,
                fileName,
                storage: "supabase",
              });
            }
          } else {
            console.warn(
              "Supabase upload error, beralih ke penyimpanan lokal fallback:",
              uploadError.message,
            );
          }
        }
      } catch (supabaseError) {
        console.warn(
          "Koneksi Supabase Storage bermasalah, beralih ke penyimpanan lokal fallback:",
          supabaseError,
        );
      }
    }

    // 6. Graceful fallback ke penyimpanan lokal jika Supabase offline/tidak tersedia
    const fallbackResult = await saveLocalFallback(buffer, fileName);
    return apiJson({
      success: true,
      url: fallbackResult.url,
      fileName: fallbackResult.fileName,
      storage: "local-fallback",
      message:
        "Foto berhasil disimpan secara lokal (mode fallback offline / Supabase Storage tidak terjangkau).",
    });
  } catch (error) {
    console.error("Gagal memproses upload file:", error);
    return apiError(
      "Terjadi kesalahan pada server saat memproses unggahan gambar.",
      500,
    );
  }
}
