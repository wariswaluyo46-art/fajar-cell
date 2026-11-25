import "server-only";

import type { StorePaymentSettings } from "@/types";

import { isOmsUnavailableError } from "./orders-db";
import { defaultStoreSettings } from "./store";
import { getSupabaseAdmin } from "./supabase";

interface StoreSettingsRow {
  id: string;
  qris_image_url: string;
  dana_number: string;
  dana_account_name: string;
  store_lat: number;
  store_lng: number;
  updated_at: string;
}

const globalForStoreSettings = globalThis as typeof globalThis & {
  kfcStoreSettingsFallback?: StorePaymentSettings;
};

export function getDefaultStorePaymentSettings(): StorePaymentSettings {
  return {
    qrisImageUrl:
      defaultStoreSettings.qrisImageUrl ?? "/images/qris-konter-fajar-cell.svg",
    danaNumber: defaultStoreSettings.danaNumber ?? "085156069234",
    danaAccountName:
      defaultStoreSettings.danaAccountName ?? defaultStoreSettings.name,
    storeLat: defaultStoreSettings.coordinates?.lat ?? -7.3679,
    storeLng: defaultStoreSettings.coordinates?.lng ?? 109.6836,
  };
}

export function isAllowedQrisImageUrl(raw: string): boolean {
  const trimmed = raw.trim();
  if (trimmed === "" || trimmed.length > 500) return false;
  if (trimmed.includes("..") || /[\u0000-\u001F\s]/.test(trimmed)) {
    return false;
  }

  if (trimmed.startsWith("/images/")) {
    return true;
  }

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function mapRow(row: StoreSettingsRow): StorePaymentSettings {
  const defaults = getDefaultStorePaymentSettings();
  return {
    qrisImageUrl: isAllowedQrisImageUrl(row.qris_image_url)
      ? row.qris_image_url
      : defaults.qrisImageUrl,
    danaNumber: row.dana_number?.trim() || defaults.danaNumber,
    danaAccountName:
      row.dana_account_name?.trim() || defaults.danaAccountName,
    storeLat: Number.isFinite(Number(row.store_lat))
      ? Number(row.store_lat)
      : defaults.storeLat,
    storeLng: Number.isFinite(Number(row.store_lng))
      ? Number(row.store_lng)
      : defaults.storeLng,
    updatedAt: row.updated_at
      ? new Date(row.updated_at).toISOString()
      : undefined,
  };
}

export async function getStorePaymentSettingsSafe(): Promise<{
  settings: StorePaymentSettings;
  isFallback: boolean;
}> {
  const fallback =
    globalForStoreSettings.kfcStoreSettingsFallback ??
    getDefaultStorePaymentSettings();

  try {
    const { data, error } = await getSupabaseAdmin()
      .from("store_settings")
      .select("*")
      .eq("id", "default")
      .maybeSingle();

    if (error) {
      throw new Error(`Supabase gagal membaca store_settings: ${error.message}`);
    }

    if (!data) {
      return { settings: fallback, isFallback: false };
    }

    return { settings: mapRow(data as StoreSettingsRow), isFallback: false };
  } catch (error) {
    if (!isOmsUnavailableError(error)) {
      throw error;
    }

    return { settings: fallback, isFallback: true };
  }
}

export async function updateStorePaymentSettingsSafe(
  input: StorePaymentSettings,
): Promise<{ settings: StorePaymentSettings; isFallback: boolean }> {
  const nowIso = new Date().toISOString();
  const normalized: StorePaymentSettings = {
    qrisImageUrl: input.qrisImageUrl.trim(),
    danaNumber: input.danaNumber.trim(),
    danaAccountName: input.danaAccountName.trim(),
    storeLat: input.storeLat,
    storeLng: input.storeLng,
    updatedAt: nowIso,
  };

  try {
    const { data, error } = await getSupabaseAdmin()
      .from("store_settings")
      .upsert(
        {
          id: "default",
          qris_image_url: normalized.qrisImageUrl,
          dana_number: normalized.danaNumber,
          dana_account_name: normalized.danaAccountName,
          store_lat: normalized.storeLat,
          store_lng: normalized.storeLng,
          updated_at: nowIso,
        },
        { onConflict: "id" },
      )
      .select("*")
      .single();

    if (error) {
      throw new Error(
        `Supabase gagal menyimpan store_settings: ${error.message}`,
      );
    }

    globalForStoreSettings.kfcStoreSettingsFallback = mapRow(
      data as StoreSettingsRow,
    );
    return {
      settings: globalForStoreSettings.kfcStoreSettingsFallback,
      isFallback: false,
    };
  } catch (error) {
    if (!isOmsUnavailableError(error)) {
      throw error;
    }

    globalForStoreSettings.kfcStoreSettingsFallback = normalized;
    return { settings: normalized, isFallback: true };
  }
}
