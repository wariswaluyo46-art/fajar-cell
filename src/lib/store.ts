import storeJson from "@/data/store.json";
import type { StoreSettings } from "@/types";

/** Pengaturan toko awal dari `src/data/store.json`. */
export const defaultStoreSettings = storeJson as unknown as StoreSettings;
