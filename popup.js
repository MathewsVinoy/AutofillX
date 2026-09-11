const $ = (id) => document.getElementById(id);

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

function showState(name) {
  ["empty", "locked", "unlocked"].forEach((s) =>
    $(`state-${s}`).classList.add("hidden"),
  );
  $(`state-${name}`).classList.remove("hidden");
}

function populateProfileSelect(vaultData) {
  const select = $("profileSelect");
  select.innerHTML = "";
  (vaultData.profiles || []).forEach((p) => {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = p.name;
    if (p.id === vaultData.activeProfileId) opt.selected = true;
    select.appendChild(opt);
  });
}

async function refresh() {
  const local = await chrome.storage.local.get(["vault", "autoLockMinutes"]);
  const session = await chrome.storage.session.get(["vaultData"]);

  if (local.autoLockMinutes) {
    $("autoLockMinutes").textContent = local.autoLockMinutes;
  }

  if (!local.vault) {
    showState("empty");
  } else if (session.vaultData) {
    populateProfileSelect(session.vaultData);
    showState("unlocked");
  } else {
    showState("locked");
  }
}

$("createBtn").addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

$("optionsBtn").addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

$("unlockBtn").addEventListener("click", async () => {
  const password = $("unlockPassword").value;
  $("unlockError").classList.add("hidden");
  if (!password) return;

  const { vault } = await chrome.storage.local.get("vault");
  if (!vault) {
    showState("empty");
    return;
  }

  try {
    const salt = new Uint8Array(VaultCrypto.b64ToBuf(vault.salt));
    const key = await VaultCrypto.deriveKey(password, salt, vault.iterations);
    const decrypted = await VaultCrypto.decryptJSON(key, vault.iv, vault.data);
    const vaultData = VaultCrypto.migrateVaultShape(decrypted);

    await chrome.storage.session.set({ vaultData, unlockedAt: Date.now() });
    await chrome.runtime.sendMessage({ type: "RESET_AUTO_LOCK" });

    $("unlockPassword").value = "";
    populateProfileSelect(vaultData);
    showState("unlocked");
  } catch (err) {
    $("unlockError").textContent =
      "That password didn't unlock the vault. Try again.";
    $("unlockError").classList.remove("hidden");
  }
});

$("unlockPassword").addEventListener("keydown", (e) => {
  if (e.key === "Enter") $("unlockBtn").click();
});

$("profileSelect").addEventListener("change", async () => {
  await chrome.runtime.sendMessage({
    type: "SET_ACTIVE_PROFILE",
    profileId: $("profileSelect").value,
  });
});

$("lockBtn").addEventListener("click", async () => {
  await chrome.runtime.sendMessage({ type: "LOCK_NOW" });
  showState("locked");
});

$("fillAllBtn").addEventListener("click", async () => {
  const tab = await getActiveTab();
  if (!tab?.id) return;
  await chrome.runtime.sendMessage({ type: "RESET_AUTO_LOCK" });
  chrome.tabs.sendMessage(tab.id, { type: "AutoFillX_FILL_ALL" }, () => {
    void chrome.runtime.lastError;
  });
  window.close();
});

refresh();
