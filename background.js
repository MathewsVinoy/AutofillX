const AUTO_LOCK_ALARM = "AutoFillX-auto-lock";
const DEFAULT_AUTO_LOCK_MINUTES = 15;

function allowContentScriptSessionAccess() {
  try {
    chrome.storage.session.setAccessLevel({
      accessLevel: "TRUSTED_AND_UNTRUSTED_CONTEXTS",
    });
  } catch (e) {
    console.warn("[AutoFillX] setAccessLevel failed (non-fatal):", e);
  }
}
allowContentScriptSessionAccess();
chrome.runtime.onInstalled.addListener(allowContentScriptSessionAccess);

async function getAutoLockMinutes() {
  const { autoLockMinutes } = await chrome.storage.local.get("autoLockMinutes");
  return autoLockMinutes || DEFAULT_AUTO_LOCK_MINUTES;
}

async function scheduleAutoLock() {
  const minutes = await getAutoLockMinutes();
  chrome.alarms.create(AUTO_LOCK_ALARM, { delayInMinutes: minutes });
}

async function clearUnlockedVault() {
  await chrome.storage.session.remove(["vaultData", "unlockedAt"]);
}

async function getActiveProfileFields() {
  const { vaultData } = await chrome.storage.session.get("vaultData");
  if (!vaultData || !Array.isArray(vaultData.profiles)) return null;
  const active =
    vaultData.profiles.find((p) => p.id === vaultData.activeProfileId) ||
    vaultData.profiles[0];
  return active ? active.fields || {} : null;
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === AUTO_LOCK_ALARM) {
    clearUnlockedVault();
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  switch (message?.type) {
    case "RESET_AUTO_LOCK":
      scheduleAutoLock().then(() => sendResponse({ ok: true }));
      return true;

    case "LOCK_NOW":
      chrome.alarms.clear(AUTO_LOCK_ALARM);
      clearUnlockedVault().then(() => sendResponse({ ok: true }));
      return true;

    case "GET_PROFILE":
      getActiveProfileFields()
        .then((profile) => sendResponse({ profile }))
        .catch((err) => {
          console.warn("[AutoFillX] GET_PROFILE failed:", err);
          sendResponse({ profile: null });
        });
      return true;

    case "SET_ACTIVE_PROFILE":
      chrome.storage.session.get("vaultData").then(({ vaultData }) => {
        if (!vaultData) return sendResponse({ ok: false });
        vaultData.activeProfileId = message.profileId;
        chrome.storage.session
          .set({ vaultData })
          .then(() => sendResponse({ ok: true }));
      });
      return true;

    default:
      return false;
  }
});

chrome.runtime.onStartup.addListener(() => {
  allowContentScriptSessionAccess();
  clearUnlockedVault();
});
