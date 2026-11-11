import { promises as fs } from "node:fs";
import path from "node:path";

import { getAdminSession } from "@/lib/admin-auth";
import { apiError, apiJson } from "@/lib/api-response";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Batas ukuran file maksimal 5 MB */
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/** Tipe file gambar yang diizinkan */
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

const BUCKET_NAME = "products";

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
  const uploadDir = path.join(process.cwd(), "public", "images", "products");
  await fs.mkdir(uploadDir, { recursive: true });
  const localFilePath = path.join(uploadDir, fileName);
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

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return apiError("File gambar tidak ditemukan dalam formulir.", 400);
    }

    // 2. Validasi format file
    if (!ALLOWED_MIME_TYPES.has(file.type.toLowerCase())) {
      return apiError(
        "Format file tidak didukung. Harap unggah gambar berekstensi .jpg, .jpeg, .png, atau .webp.",
        400,
      );
    }

    // 3. Validasi ukuran file
    if (file.size > MAX_FILE_SIZE) {
      return apiError(
        "Ukuran file terlalu besar. Maksimal ukuran gambar adalah 5 MB.",
        400,
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 4. Generate nama file unik & aman
    const rawName = file.name.toLowerCase();
    const extension = rawName.split(".").pop() || "jpg";
    const baseName = rawName
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-z0-9]/g, "-")
      .slice(0, 40)
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    const timestamp = Date.now();
    const randomHex = Math.random().toString(16).substring(2, 6);
    const fileName = `${baseName || "product"}-${randomHex}.${extension}`;

    // 5. Coba upload ke Supabase Storage jika terkonfigurasi
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseAdmin();
        const bucketReady = await ensureBucketExists(supabase);

        if (bucketReady) {
          // Path sesuai instruksi: product-images/[timestamp]-[filename]
          const storagePath = `product-images/${timestamp}-${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(storagePath, buffer, {
              contentType: file.type,
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
