import type { SupabaseBrowserClient } from "./client";

export const TRADE_SETUPS_BUCKET = "trade-setups";

/** Matches the bucket `file_size_limit` in the migration. */
export const SETUP_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

const SETUP_IMAGE_URL_TTL_SECONDS = 60 * 60;

const MIME_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export type SetupSlot = "before" | "after";

/**
 * Rejects anything the bucket would refuse, so the form can show the error
 * before a round trip. Returns the file extension stored in the object path.
 */
export function extensionForSetupImage(file: File): string {
  const extension = MIME_EXTENSIONS[file.type];
  if (!extension) {
    throw new Error("Use a JPEG, PNG, or WebP image.");
  }
  if (file.size <= 0) {
    throw new Error("That image is empty.");
  }
  if (file.size > SETUP_IMAGE_MAX_BYTES) {
    throw new Error("Each image must be 5 MB or smaller.");
  }
  return extension;
}

export function setupImageObjectPath(
  userId: string,
  tradeId: string,
  slot: SetupSlot,
  extension: string,
): string {
  return `${userId}/${tradeId}/${slot}.${extension}`;
}

export async function uploadSetupImage(
  supabase: SupabaseBrowserClient,
  path: string,
  file: File,
): Promise<void> {
  const { error } = await supabase.storage
    .from(TRADE_SETUPS_BUCKET)
    .upload(path, file, {
      upsert: true,
      contentType: file.type,
      cacheControl: "3600",
    });
  if (error) throw new Error(error.message);
}

export async function removeSetupImages(
  supabase: SupabaseBrowserClient,
  paths: string[],
): Promise<void> {
  const unique = [...new Set(paths.filter(Boolean))];
  if (unique.length === 0) return;
  const { error } = await supabase.storage.from(TRADE_SETUPS_BUCKET).remove(unique);
  if (error) throw new Error(error.message);
}

/** Deletes every object stored for one trade. Missing folders are a no-op. */
export async function removeSetupFolder(
  supabase: SupabaseBrowserClient,
  userId: string,
  tradeId: string,
): Promise<void> {
  const folder = `${userId}/${tradeId}`;
  const { data, error } = await supabase.storage
    .from(TRADE_SETUPS_BUCKET)
    .list(folder);
  if (error) throw new Error(error.message);
  const paths = (data ?? []).map((object) => `${folder}/${object.name}`);
  await removeSetupImages(supabase, paths);
}

/** Maps object path → signed URL. Paths that fail to sign are omitted. */
export async function signSetupImages(
  supabase: SupabaseBrowserClient,
  paths: string[],
): Promise<Record<string, string>> {
  const unique = [...new Set(paths.filter(Boolean))];
  if (unique.length === 0) return {};
  const { data, error } = await supabase.storage
    .from(TRADE_SETUPS_BUCKET)
    .createSignedUrls(unique, SETUP_IMAGE_URL_TTL_SECONDS);
  if (error) throw new Error(error.message);

  const urls: Record<string, string> = {};
  for (const item of data ?? []) {
    if (item.path && item.signedUrl && !item.error) {
      urls[item.path] = item.signedUrl;
    }
  }
  return urls;
}
