(() => {
  const FILLABLE_SELECTOR =
    'input:not([type="hidden"]):not([type="password"]):not([type="submit"]):not([type="button"]):not([type="checkbox"]):not([type="radio"]):not([type="file"]), textarea, select';

  let badgeEl = null;
  let badgeTargetEl = null;

  function getLabelText(el) {
    const parts = [];
    if (el.id) {
      const lbl = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
      if (lbl) parts.push(lbl.textContent);
    }
    const wrappingLabel = el.closest("label");
    if (wrappingLabel) parts.push(wrappingLabel.textContent);
    if (el.getAttribute("aria-label"))
      parts.push(el.getAttribute("aria-label"));
    const describedBy = el.getAttribute("aria-describedby");
    if (describedBy) {
      describedBy.split(/\s+/).forEach((id) => {
        const node = document.getElementById(id);
        if (node) parts.push(node.textContent);
      });
    }

    const prev = el.previousElementSibling;
    if (
      prev &&
      /label|span|div|p/i.test(prev.tagName) &&
      prev.textContent.trim().length < 60
    ) {
      parts.push(prev.textContent);
    }
    return parts.join(" ");
  }

  function fingerprint(el) {
    return [
      el.name,
      el.id,
      el.placeholder,
      el.getAttribute("autocomplete"),
      getLabelText(el),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
  }

  function matchField(el) {
    const text = fingerprint(el);
    if (!text) return null;

    let best = null;
    let bestScore = 0;

    for (const section of VAULT_SCHEMA) {
      for (const field of section.fields) {
        let score = 0;
        for (const pattern of field.match) {
          try {
            if (new RegExp(pattern, "i").test(text)) score++;
          } catch {}
        }
        if (score > bestScore) {
          bestScore = score;
          best = field;
        }
      }
    }
    return best;
  }

  function setNativeValue(el, value) {
    const proto =
      el.tagName === "TEXTAREA"
        ? window.HTMLTextAreaElement.prototype
        : window.HTMLInputElement.prototype;
    const descriptor = Object.getOwnPropertyDescriptor(proto, "value");
    if (descriptor && descriptor.set) {
      descriptor.set.call(el, value);
    } else {
      el.value = value;
    }
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function fillElement(el, field, profile) {
    const value = profile[field.key];
    if (value === undefined || value === "") return false;

    if (el.tagName === "SELECT") {
      const options = Array.from(el.options);
      const match = options.find(
        (o) =>
          o.value.toLowerCase() === value.toLowerCase() ||
          o.textContent.trim().toLowerCase() === value.toLowerCase(),
      );
      if (match) {
        el.value = match.value;
        el.dispatchEvent(new Event("change", { bubbles: true }));
        return true;
      }
      return false;
    }

    setNativeValue(el, value);
    return true;
  }

  async function getProfile() {
    try {
      const response = await chrome.runtime.sendMessage({
        type: "GET_PROFILE",
      });
      return response?.profile || null;
    } catch (err) {
      console.warn("[AutoFillX] Could not reach background worker:", err);
      return null;
    }
  }

  function removeBadge() {
    if (badgeEl) {
      badgeEl.remove();
      badgeEl = null;
      badgeTargetEl = null;
    }
  }

  function positionBadge(el) {
    const rect = el.getBoundingClientRect();
    badgeEl.style.top = `${window.scrollY + rect.top + rect.height / 2 - 11}px`;
    badgeEl.style.left = `${window.scrollX + rect.right - 28}px`;
  }

  function showBadge(el, field, profile) {
    removeBadge();
    badgeTargetEl = el;

    badgeEl = document.createElement("div");
    badgeEl.className = "autoFillX-badge";
    badgeEl.title = `Fill "${field.label}" from AutoFillX`;
    badgeEl.innerHTML =
      '<svg width="13" height="13" viewBox="0 0 24 24" fill="none"><rect x="4" y="11" width="16" height="10" rx="2" fill="currentColor"/><path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" stroke-width="2" fill="none"/></svg>';

    badgeEl.addEventListener("mousedown", (e) => {
      e.preventDefault();
      fillElement(el, field, profile);
      removeBadge();
    });

    document.body.appendChild(badgeEl);
    positionBadge(el);
  }

  let lastFocusedField = null;

  document.addEventListener(
    "focusin",
    async (e) => {
      const el = e.target;
      if (!el.matches || !el.matches(FILLABLE_SELECTOR)) return;

      const field = matchField(el);
      lastFocusedField = field ? { el, field } : null;
      if (!field) return;

      const profile = await getProfile();
      if (
        !profile ||
        profile[field.key] === undefined ||
        profile[field.key] === ""
      )
        return;

      showBadge(el, field, profile);
    },
    true,
  );

  document.addEventListener(
    "focusout",
    (e) => {
      if (e.target === badgeTargetEl) {
        setTimeout(removeBadge, 120);
      }
    },
    true,
  );

  window.addEventListener(
    "scroll",
    () => {
      if (badgeEl && badgeTargetEl) positionBadge(badgeTargetEl);
    },
    true,
  );
  window.addEventListener("resize", () => {
    if (badgeEl && badgeTargetEl) positionBadge(badgeTargetEl);
  });

  document.addEventListener("keydown", async (e) => {
    if (
      e.altKey &&
      e.shiftKey &&
      e.key.toUpperCase() === "F" &&
      lastFocusedField
    ) {
      const profile = await getProfile();
      if (!profile) return;
      fillElement(lastFocusedField.el, lastFocusedField.field, profile);
      removeBadge();
    }
  });

  async function fillAll() {
    const profile = await getProfile();
    if (!profile) return;

    const elements = document.querySelectorAll(FILLABLE_SELECTOR);
    elements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const visible = rect.width > 0 && rect.height > 0;
      if (!visible) return;
      const field = matchField(el);
      if (field) fillElement(el, field, profile);
    });
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === "AutoFillX_FILL_ALL") {
      fillAll().then(() => sendResponse({ ok: true }));
      return true;
    }
    return false;
  });

  console.log("[AutoFillX] content script active on this page.");
})();
