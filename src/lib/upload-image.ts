/**
 * Helper sisi klien untuk mengunggah gambar produk ke Supabase Storage
 * melalui endpoint aman `/api/admin/upload`.
 */

export interface UploadImageResult {
  success: boolean;
  url?: string;
  fileName?: string;
  storage?: "supabase" | "local-fallback";
  message?: string;
  error?: string;
}

const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export async function uploadProductImage(file: File): Promise<UploadImageResult> {
  const fileNameLower = file.name.toLowerCase();
  const hasValidExtension = ALLOWED_EXTENSIONS.some((ext) =>
    fileNameLower.endsWith(ext),
  );

  if (!hasValidExtension) {
    return {
      success: false,
      error: "Format file tidak didukung. Pilih file .jpg, .jpeg, .png, atau .webp.",
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      success: false,
      error: "Ukuran file terlalu besar. Maksimal ukuran gambar adalah 5 MB.",
    };
  }

  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch("/api/admin/upload", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return {
        success: false,
        error: data.error || "Gagal mengunggah gambar ke Supabase Storage.",
      };
    }

    return {
      success: true,
      url: data.url,
      fileName: data.fileName,
      storage: data.storage,
      message: data.message,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Gagal menghubungkan ke server saat mengunggah foto.",
    };
  }
}

