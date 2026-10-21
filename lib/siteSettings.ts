import { prisma } from "@/lib/prisma";
import {
  ALL_SETTING_KEYS,
  createEmptySettingsMap,
  mapToPublicSettings,
  pickSettings,
  PUBLIC_SETTING_KEYS,
  settingsRecordToMap,
  type PublicSiteSettings,
} from "@/lib/settings";

export async function getSettingsMap(
  keys: readonly string[] = ALL_SETTING_KEYS
): Promise<Record<string, string>> {
  const rows = await prisma.siteSetting.findMany({
    where: { key: { in: [...keys] } },
  });

  return {
    ...createEmptySettingsMap(keys),
    ...pickSettings(settingsRecordToMap(rows), keys),
  };
}

export async function getPublicSiteSettings(): Promise<PublicSiteSettings> {
  const map = await getSettingsMap(PUBLIC_SETTING_KEYS);
  return mapToPublicSettings(map);
}
