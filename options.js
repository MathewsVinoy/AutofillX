const $ = (id) => document.getElementById(id);

let currentKey = null;
let vaultData = null;
let editingProfileId = null;

function sectionId(sectionName) {
  return "sec-" + sectionName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function showGate(name) {
  ["gate-create", "gate-unlock", "editor"].forEach((id) =>
    $(id).classList.add("hidden"),
  );
  $(name).classList.remove("hidden");
}

function setSaveStatus(text, transient = true) {
  $("saveStatus").textContent = text;
  if (transient && text) {
    setTimeout(() => {
      if ($("saveStatus").textContent === text)
        $("saveStatus").textContent = "";
    }, 2500);
  }
}

function getEditingProfile() {
  return vaultData.profiles.find((p) => p.id === editingProfileId);
}

function renderProfileList() {
  const list = $("profileList");
  list.innerHTML = "";
  vaultData.profiles.forEach((p) => {
    const pill = document.createElement("div");
    pill.className =
      "profile-pill" +
      (p.id === editingProfileId ? " active" : "") +
      (p.id === vaultData.activeProfileId ? " is-autofill-target" : "");
    pill.title =
      p.id === vaultData.activeProfileId
        ? `${p.name} — used for autofill`
        : `Click to edit ${p.name}`;

    const dot = document.createElement("span");
    dot.className = "dot-active";
    pill.appendChild(dot);

    const label = document.createElement("span");
    label.textContent = p.name;
    pill.appendChild(label);

    pill.addEventListener("click", () => switchEditingProfile(p.id));
    list.appendChild(pill);
  });
}

function switchEditingProfile(profileId) {
  captureFormIntoProfile(editingProfileId);
  editingProfileId = profileId;
  const profile = getEditingProfile();
  $("profileHeading").textContent = profile.name;
  renderForm(profile.fields);
  renderProfileList();
  updateSetActiveButton();
}

function updateSetActiveButton() {
  const isActive = editingProfileId === vaultData.activeProfileId;
  $("setActiveBtn").textContent = isActive
    ? "✓ Used for autofill"
    : "Use for autofill";
  $("setActiveBtn").disabled = isActive;
}

$("setActiveBtn").addEventListener("click", async () => {
  vaultData.activeProfileId = editingProfileId;
  updateSetActiveButton();
  renderProfileList();
  await persistVault();
  setSaveStatus("Autofill profile updated ✓");
});

$("addProfileBtn").addEventListener("click", () => {
  captureFormIntoProfile(editingProfileId);
  const name = prompt(
    'Name this profile (e.g. "Work", "Personal", "My spouse"):',
    "New profile",
  );
  if (!name) return;
  const profile = VaultCrypto.createProfile(name.trim() || "New profile");
  vaultData.profiles.push(profile);
  switchEditingProfile(profile.id);
  setSaveStatus("Profile added — remember to Save changes");
});

$("renameProfileBtn").addEventListener("click", () => {
  const profile = getEditingProfile();
  const name = prompt("Rename this profile:", profile.name);
  if (!name || !name.trim()) return;
  profile.name = name.trim();
  $("profileHeading").textContent = profile.name;
  renderProfileList();
  setSaveStatus("Renamed — remember to Save changes");
});

$("deleteProfileBtn").addEventListener("click", async () => {
  if (vaultData.profiles.length <= 1) {
    alert(
      "You need at least one profile. Add another before deleting this one.",
    );
    return;
  }
  const profile = getEditingProfile();
  if (
    !confirm(
      `Delete the "${profile.name}" profile? This can't be undone once you save.`,
    )
  )
    return;

  vaultData.profiles = vaultData.profiles.filter((p) => p.id !== profile.id);
  if (vaultData.activeProfileId === profile.id) {
    vaultData.activeProfileId = vaultData.profiles[0].id;
  }
  switchEditingProfile(vaultData.profiles[0].id);
  await persistVault();
  setSaveStatus("Profile deleted ✓");
});

function renderNav() {
  const nav = $("sectionNav");
  nav.innerHTML = "";
  VAULT_SCHEMA.forEach((section) => {
    const a = document.createElement("a");
    a.href = "#" + sectionId(section.section);
    a.textContent = section.section;
    nav.appendChild(a);
  });
}

function renderForm(fields) {
  const form = $("profileForm");
  form.innerHTML = "";

  VAULT_SCHEMA.forEach((section) => {
    const wrap = document.createElement("div");
    wrap.className = "form-section" + (section.sensitive ? " sensitive" : "");
    wrap.id = sectionId(section.section);

    const h2 = document.createElement("h2");
    h2.textContent = section.section;
    wrap.appendChild(h2);

    if (section.sensitive) {
      const note = document.createElement("p");
      note.className = "sensitive-note";
      note.textContent =
        "Stored encrypted like everything else — only fill these in if a form genuinely requires them.";
      wrap.appendChild(note);
    }

    const grid = document.createElement("div");
    grid.className = "field-grid";

    section.fields.forEach((field) => {
      const fieldWrap = document.createElement("div");
      fieldWrap.className = "field-wrap";
      if (field.type === "textarea") fieldWrap.classList.add("full-width");

      const label = document.createElement("label");
      label.textContent = field.label;
      label.setAttribute("for", "f_" + field.key);
      fieldWrap.appendChild(label);

      let input;
      if (field.type === "textarea") {
        input = document.createElement("textarea");
      } else {
        input = document.createElement("input");
        input.type = field.sensitive ? "password" : field.type;
      }
      input.id = "f_" + field.key;
      input.dataset.key = field.key;
      input.autocomplete = "off";
      input.value = fields[field.key] || "";

      fieldWrap.appendChild(input);
      grid.appendChild(fieldWrap);
    });

    wrap.appendChild(grid);
    form.appendChild(wrap);
  });
}

function captureFormIntoProfile(profileId) {
  if (!profileId) return;
  const profile = vaultData.profiles.find((p) => p.id === profileId);
  if (!profile) return;
  const fields = {};
  VAULT_SCHEMA.forEach((section) => {
    section.fields.forEach((field) => {
      const el = $("f_" + field.key);
      if (el && el.value.trim() !== "") fields[field.key] = el.value.trim();
    });
  });
  profile.fields = fields;
}

async function loadAutoLockSetting() {
  const { autoLockMinutes } = await chrome.storage.local.get("autoLockMinutes");
  $("autoLockMinutes").value = autoLockMinutes || 15;
}

async function persistVault() {
  captureFormIntoProfile(editingProfileId);
  const { vault: oldVault } = await chrome.storage.local.get("vault");
  const encrypted = await VaultCrypto.encryptJSON(currentKey, vaultData);
  const vault = {
    salt: oldVault.salt,
    iterations: oldVault.iterations,
    iv: encrypted.iv,
    data: encrypted.data,
  };
  await chrome.storage.local.set({ vault });
  await chrome.storage.session.set({ vaultData, unlockedAt: Date.now() });
  await chrome.runtime.sendMessage({ type: "RESET_AUTO_LOCK" });
}

function openEditor() {
  editingProfileId = vaultData.activeProfileId || vaultData.profiles[0].id;
  const profile = getEditingProfile();
  $("profileHeading").textContent = profile.name;
  renderForm(profile.fields);
  renderProfileList();
  updateSetActiveButton();
  showGate("editor");
}

async function init() {
  renderNav();
  await loadAutoLockSetting();

  const { vault } = await chrome.storage.local.get("vault");
  if (!vault) {
    showGate("gate-create");
    return;
  }
  showGate("gate-unlock");
}

$("createSubmit").addEventListener("click", async () => {
  const pw = $("createPassword").value;
  const pw2 = $("createPasswordConfirm").value;
  $("createError").classList.add("hidden");

  if (pw.length < 8) {
    $("createError").textContent =
      "Use at least 8 characters for your master password.";
    $("createError").classList.remove("hidden");
    return;
  }
  if (pw !== pw2) {
    $("createError").textContent = "Passwords don't match.";
    $("createError").classList.remove("hidden");
    return;
  }

  const salt = VaultCrypto.randomBytes(16);
  currentKey = await VaultCrypto.deriveKey(pw, salt);

  const defaultProfile = VaultCrypto.createProfile("Default");
  vaultData = {
    profiles: [defaultProfile],
    activeProfileId: defaultProfile.id,
  };

  const encrypted = await VaultCrypto.encryptJSON(currentKey, vaultData);
  const vault = {
    salt: VaultCrypto.bufToB64(salt),
    iterations: VaultCrypto.PBKDF2_ITERATIONS,
    iv: encrypted.iv,
    data: encrypted.data,
  };
  await chrome.storage.local.set({ vault });
  await chrome.storage.session.set({ vaultData, unlockedAt: Date.now() });
  await chrome.runtime.sendMessage({ type: "RESET_AUTO_LOCK" });

  openEditor();
});

$("unlockSubmit").addEventListener("click", async () => {
  const pw = $("unlockPassword").value;
  $("unlockError").classList.add("hidden");

  const { vault } = await chrome.storage.local.get("vault");
  try {
    const salt = new Uint8Array(VaultCrypto.b64ToBuf(vault.salt));
    currentKey = await VaultCrypto.deriveKey(pw, salt, vault.iterations);
    const decrypted = await VaultCrypto.decryptJSON(
      currentKey,
      vault.iv,
      vault.data,
    );
    vaultData = VaultCrypto.migrateVaultShape(decrypted);

    await chrome.storage.session.set({ vaultData, unlockedAt: Date.now() });
    await chrome.runtime.sendMessage({ type: "RESET_AUTO_LOCK" });

    $("unlockPassword").value = "";
    openEditor();
  } catch (err) {
    $("unlockError").textContent = "That password didn't unlock the vault.";
    $("unlockError").classList.remove("hidden");
    currentKey = null;
  }
});

["createPassword", "createPasswordConfirm"].forEach((id) => {
  $(id).addEventListener("keydown", (e) => {
    if (e.key === "Enter") $("createSubmit").click();
  });
});
$("unlockPassword").addEventListener("keydown", (e) => {
  if (e.key === "Enter") $("unlockSubmit").click();
});

$("saveBtn").addEventListener("click", async () => {
  if (!currentKey) return;
  await persistVault();
  setSaveStatus("Saved & encrypted ✓");
});

$("lockNowBtn").addEventListener("click", async () => {
  await chrome.runtime.sendMessage({ type: "LOCK_NOW" });
  currentKey = null;
  vaultData = null;
  location.reload();
});

$("changePasswordBtn").addEventListener("click", () => {
  $("cpCurrent").value = "";
  $("cpNew").value = "";
  $("cpConfirm").value = "";
  $("cpError").classList.add("hidden");
  $("modalOverlay").classList.remove("hidden");
});

$("cpCancel").addEventListener("click", () =>
  $("modalOverlay").classList.add("hidden"),
);

$("cpSubmit").addEventListener("click", async () => {
  const current = $("cpCurrent").value;
  const next = $("cpNew").value;
  const confirmPw = $("cpConfirm").value;
  $("cpError").classList.add("hidden");

  const { vault } = await chrome.storage.local.get("vault");
  try {
    const salt = new Uint8Array(VaultCrypto.b64ToBuf(vault.salt));
    const verifyKey = await VaultCrypto.deriveKey(
      current,
      salt,
      vault.iterations,
    );
    await VaultCrypto.decryptJSON(verifyKey, vault.iv, vault.data);
  } catch {
    $("cpError").textContent = "Current password is incorrect.";
    $("cpError").classList.remove("hidden");
    return;
  }

  if (next.length < 8) {
    $("cpError").textContent = "New password must be at least 8 characters.";
    $("cpError").classList.remove("hidden");
    return;
  }
  if (next !== confirmPw) {
    $("cpError").textContent = "New passwords don't match.";
    $("cpError").classList.remove("hidden");
    return;
  }

  captureFormIntoProfile(editingProfileId);
  const newSalt = VaultCrypto.randomBytes(16);
  const newKey = await VaultCrypto.deriveKey(next, newSalt);
  const encrypted = await VaultCrypto.encryptJSON(newKey, vaultData);

  const newVault = {
    salt: VaultCrypto.bufToB64(newSalt),
    iterations: VaultCrypto.PBKDF2_ITERATIONS,
    iv: encrypted.iv,
    data: encrypted.data,
  };
  await chrome.storage.local.set({ vault: newVault });
  await chrome.storage.session.set({ vaultData, unlockedAt: Date.now() });

  currentKey = newKey;
  $("modalOverlay").classList.add("hidden");
  setSaveStatus("Password updated ✓");
});

$("deleteVaultBtn").addEventListener("click", () => {
  $("deleteConfirmInput").value = "";
  $("deleteOverlay").classList.remove("hidden");
});

$("deleteCancel").addEventListener("click", () =>
  $("deleteOverlay").classList.add("hidden"),
);

$("deleteSubmit").addEventListener("click", async () => {
  if ($("deleteConfirmInput").value !== "DELETE") return;
  await chrome.storage.local.remove(["vault", "autoLockMinutes"]);
  await chrome.runtime.sendMessage({ type: "LOCK_NOW" });
  location.reload();
});

$("autoLockMinutes").addEventListener("change", async () => {
  const minutes = Math.max(
    1,
    Math.min(120, Number($("autoLockMinutes").value) || 15),
  );
  $("autoLockMinutes").value = minutes;
  await chrome.storage.local.set({ autoLockMinutes: minutes });
  await chrome.runtime.sendMessage({ type: "RESET_AUTO_LOCK" });
  setSaveStatus("Setting saved ✓");
});

init();
