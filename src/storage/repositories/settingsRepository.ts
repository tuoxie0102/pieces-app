import type { AppSettings } from '../../domain/models';
import { getJson, setJson } from '../localStore';
import { storageKeys } from '../storageKeys';

export const defaultSettings: AppSettings = {
  userName: '创作者',
  defaultCardTemplateId: 'candy-default',
};

export async function getSettings(): Promise<AppSettings> {
  return getJson<AppSettings>(storageKeys.settings, defaultSettings);
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await setJson(storageKeys.settings, settings);
}
