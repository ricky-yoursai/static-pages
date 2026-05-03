const GLOBAL_SETTINGS_URL = "https://file.yoursai.cn:9709/common/v2/api/all?themeTable=MSetting&db=global";
const GLOBAL_SETTINGS_UPDATE_URL = "https://file.yoursai.cn:9709/common/v2/api/update/1?themeTable=MSetting&db=global";

/**
 * Fetch global project port settings.
 * Returns parsed JSON payload from the API.
 */
export async function getGlobalPortSettings() {
  const response = await fetch(GLOBAL_SETTINGS_URL, {
    method: "GET"
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json();
}

/**
 * Update id=1 setting object.
 * @param {{port?: Record<string, string>, portOrder?: string[]}} setting
 */
export async function updateGlobalPortSettings(setting) {
  const response = await fetch(GLOBAL_SETTINGS_UPDATE_URL, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      setting
    })
  });

  if (!response.ok) {
    throw new Error(`Update failed with status ${response.status}`);
  }

  return response.json();
}

/**
 * Update id=1 note string inside setting object.
 * @param {string} note
 */
export async function updateGlobalNoteSetting(note) {
  // Fetch current to avoid overwriting other properties in setting
  const getRes = await fetch(GLOBAL_SETTINGS_URL, { method: "GET" });
  if (!getRes.ok) throw new Error("Failed to fetch current settings");
  const payload = await getRes.json();
  const records = payload?.data?.data || [];
  const targetRecord = records.find(item => item?.id === 1);
  const currentSetting = targetRecord?.setting || {};

  const newSetting = { ...currentSetting, note };

  const response = await fetch(GLOBAL_SETTINGS_UPDATE_URL, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      setting: newSetting
    })
  });

  if (!response.ok) {
    throw new Error(`Update failed with status ${response.status}`);
  }

  return response.json();
}
