import fs from 'fs';
import path from 'path';
import type { UserProfile } from '@/types';

const PROFILE_PATH = path.join(process.cwd(), 'data', 'profile.json');

const DEFAULT_PROFILE: UserProfile = {
  name: '',
  measurements: {},
  stylePreferences: {},
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export function getProfile(): UserProfile {
  try {
    const raw = fs.readFileSync(PROFILE_PATH, 'utf-8');
    return JSON.parse(raw) as UserProfile;
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function saveProfile(profile: Partial<UserProfile>): UserProfile {
  const existing = getProfile();
  const updated: UserProfile = {
    ...existing,
    ...profile,
    measurements: { ...existing.measurements, ...(profile.measurements ?? {}) },
    stylePreferences: {
      ...existing.stylePreferences,
      ...(profile.stylePreferences ?? {}),
    },
    updatedAt: new Date().toISOString(),
  };

  const dir = path.dirname(PROFILE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(PROFILE_PATH, JSON.stringify(updated, null, 2));
  return updated;
}
