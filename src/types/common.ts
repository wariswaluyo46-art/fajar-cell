/**
 * Hasil operasi yang bisa gagal (validasi form, CRUD stok, dsb.).
 * Dipakai agar pemanggil wajib menangani cabang error sebelum memakai data.
 */
export type ActionResult<T = undefined> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: string;
      /** Error per field form, mis. { price: "Harga wajib diisi" }. */
      fieldErrors?: Record<string, string>;
    };

export interface SelectOption<T extends string = string> {
  label: string;
  value: T;
}
