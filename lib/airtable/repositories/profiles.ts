import type { Profile } from "../../domain/types";
import { cached, invalidate } from "../cache";
import { createRecords, listAllRecords, updateRecords } from "../client";
import { profileToDomain, profileToFields, type ProfileFields } from "../mappers";

const TABLE = "Profiles";

async function all(): Promise<Profile[]> {
  return cached(TABLE, async () => {
    const records = await listAllRecords<ProfileFields>(TABLE);
    return records.map(profileToDomain);
  });
}

export async function listAllProfiles(): Promise<Profile[]> {
  const profiles = await all();
  return [...profiles].sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function listActiveProfiles(): Promise<Profile[]> {
  return (await listAllProfiles()).filter((p) => p.active);
}

export async function getProfile(id: string): Promise<Profile | undefined> {
  return (await all()).find((p) => p.id === id);
}

export async function createProfile(input: Omit<Profile, "id">): Promise<Profile> {
  const [record] = await createRecords<ProfileFields>(TABLE, [
    { fields: profileToFields(input) as ProfileFields },
  ]);
  invalidate(TABLE);
  return profileToDomain(record);
}

export async function updateProfile(id: string, patch: Partial<Profile>): Promise<Profile> {
  const [record] = await updateRecords<ProfileFields>(TABLE, [{ id, fields: profileToFields(patch) }]);
  invalidate(TABLE);
  return profileToDomain(record);
}
