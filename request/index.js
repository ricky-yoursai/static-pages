// const GLOBAL_SETTINGS_URL = "https://file.yoursai.cn:9709/common/v2/api/all?themeTable=MSetting&db=global";
// const GLOBAL_SETTINGS_UPDATE_URL = "https://file.yoursai.cn:9709/common/v2/api/update/1?themeTable=MSetting&db=global";

// const GLOBAL_SETTINGS_URL =
//   "https://zyvera.cn/common_backend/common/v2/api/all?themeTable=MSetting&db=global";
// const GLOBAL_SETTINGS_UPDATE_URL =
//   "https://zyvera.cn/common_backend/common/v2/api/update/1?themeTable=MSetting&db=global";

const GLOBAL_SETTINGS_URL = "https://nocommonapi.yoursai.cn/common/v2/api/all?themeTable=MSetting&db=global";
const GLOBAL_SETTINGS_UPDATE_URL = "https://nocommonapi.yoursai.cn/common/v2/api/update/1?themeTable=MSetting&db=global";

const TARGET_RECORD_ID = 1;
// The backend replaces the whole `setting` object on PUT, so a concurrent writer
// can still win the race between our GET and PUT. Re-read/merge/verify a few times.
const WRITE_ATTEMPTS = 3;

/**
 * Fetch global project port settings.
 * Returns parsed JSON payload from the API.
 */
export async function getGlobalPortSettings() {
  const response = await fetch(GLOBAL_SETTINGS_URL, {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json();
}

/**
 * Fetch the `setting` object of record id=1.
 * @returns {Promise<Record<string, unknown>>}
 */
export async function getGlobalSetting() {
  const payload = await getGlobalPortSettings();
  const records = payload?.data?.data ?? [];
  const targetRecord = records.find((item) => item?.id === TARGET_RECORD_ID);
  if (!targetRecord) throw new Error(`Record id=${TARGET_RECORD_ID} not found`);
  return targetRecord.setting ?? {};
}

/**
 * Replace the `setting` object of record id=1 as-is (low level).
 * @param {Record<string, unknown>} setting
 */
async function putGlobalSetting(setting) {
  const response = await fetch(GLOBAL_SETTINGS_UPDATE_URL, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      setting,
    }),
  });

  if (!response.ok) {
    throw new Error(`Update failed with status ${response.status}`);
  }

  return response.json();
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function deepEqual(a, b) {
  if (a === b) return true;
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((item, index) => deepEqual(item, b[index]));
  }
  if (isPlainObject(a) && isPlainObject(b)) {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    return (
      keysA.length === keysB.length &&
      keysA.every(
        (key) => Object.prototype.hasOwnProperty.call(b, key) && deepEqual(a[key], b[key]),
      )
    );
  }
  return false;
}

/**
 * Safely patch the `setting` object of record id=1.
 *
 * Read-modify-write: fetch the current setting, merge `partial` on top of it,
 * PUT the merged object, then read it back and verify that (a) no previously
 * existing field disappeared and (b) the patched fields actually landed. This
 * is what keeps `note` and `port`/`portOrder` from wiping each other out.
 *
 * @param {Record<string, unknown>} partial
 * @returns {Promise<Record<string, unknown>>} the verified setting after the write
 */
export async function patchGlobalSetting(partial) {
  if (!isPlainObject(partial)) {
    throw new TypeError("patchGlobalSetting expects a plain object");
  }

  let lastError = null;

  for (let attempt = 0; attempt < WRITE_ATTEMPTS; attempt += 1) {
    const current = await getGlobalSetting();
    const merged = { ...current, ...partial };
    await putGlobalSetting(merged);

    try {
      const after = await getGlobalSetting();
      const lost = Object.keys(current).filter((key) => !(key in after));
      const notApplied = Object.keys(partial).filter(
        (key) => !deepEqual(after[key], partial[key]),
      );
      if (lost.length === 0 && notApplied.length === 0) {
        return after;
      }
      lastError = new Error(
        `Update was overwritten by another writer (lost: ${lost.join(", ") || "none"}; ` +
          `not applied: ${notApplied.join(", ") || "none"}).`,
      );
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Failed to verify update");
    }
  }

  throw lastError ?? new Error("Failed to update global setting");
}

/**
 * Update port map / order inside the setting object.
 * Other fields (e.g. `note`) are preserved via patchGlobalSetting().
 * @param {{port?: Record<string, string>, portOrder?: string[]}} setting
 */
export async function updateGlobalPortSettings(setting) {
  return patchGlobalSetting(setting ?? {});
}

/**
 * Update the `note` string inside the setting object.
 * Other fields (e.g. `port`, `portOrder`) are preserved via patchGlobalSetting().
 * @param {string} note
 */
export async function updateGlobalNoteSetting(note) {
  return patchGlobalSetting({ note });
}
