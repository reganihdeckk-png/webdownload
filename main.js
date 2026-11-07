(() => {
  const form = document.querySelector("#link-form");
  const input = document.querySelector("#video-url");
  const inputLabel = document.querySelector("#input-label");
  const inputWrap = document.querySelector("#url-input-wrap");
  const pasteButton = document.querySelector("#paste-button");
  const inputHint = document.querySelector("#input-hint");
  const message = document.querySelector("#form-message");
  const submitButton = document.querySelector("#analyze-button");
  const tabs = [...document.querySelectorAll(".platform-tab")];
  const platformSwitch = document.querySelector(".platform-switch");
  const qualityControl = document.querySelector("#quality-control");
  const formatSelect = document.querySelector("#format-select");
  const audioOption = formatSelect.querySelector('option[value="audio"]');
  const qualitySelect = document.querySelector("#quality-select");
  const downloadOptions = document.querySelector("#download-options");
  const resultCard = document.querySelector("#result-card");
  const resultArt = document.querySelector("#result-art");
  const resultPlatform = document.querySelector("#result-platform");
  const resultTitle = document.querySelector("#result-title");
  const resultDescription = document.querySelector("#result-description");
  const resultLink = document.querySelector("#result-link");
  const mediaDownloads = document.querySelector("#media-downloads");
  const backendNote = document.querySelector("#backend-note");
  const profileCard = document.querySelector("#profile-card");
  const profilePicture = document.querySelector("#profile-picture");
  const profileAvatarFallback = document.querySelector("#profile-avatar-fallback");
  const profileVerified = document.querySelector("#profile-verified");
  const profileBackendNote = document.querySelector("#profile-backend-note");
  const historySection = document.querySelector("#recent-section");
  const historyList = document.querySelector("#history-list");
  const storageKey = "glassy-link-history";
  const maxHistoryItems = 5;
  let selectedPlatform = "tiktok";

  const platformHosts = {
    tiktok: ["tiktok.com", "www.tiktok.com", "m.tiktok.com", "vm.tiktok.com", "vt.tiktok.com"],
    instagram: ["instagram.com", "www.instagram.com", "m.instagram.com"],
  };

  const platformLabels = {
    tiktok: "TikTok",
    instagram: "Instagram",
    stalkig: "Stalk IG",
  };

  const apiRoutes = {
    tiktok: "/api/tiktok/download",
    instagram: "/api/instagram/download",
    stalkig: "/api/instagram/stalk",
  };

  async function postToApi(path, payload) {
    let response;
    try {
      response = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      throw new Error("Backend tidak dapat dijangkau. Sajikan webapp melalui server yang menyediakan endpoint /api.");
    }

    let data;
    try {
      data = await response.json();
    } catch (error) {
      throw new Error(`Endpoint ${path} tidak tersedia atau tidak mengirim JSON (HTTP ${response.status}).`);
    }

    if (!response.ok || !data || data.success !== true) {
      const errorText = data && (data.error || data.message);
      throw new Error(typeof errorText === "string" ? errorText : `Permintaan gagal (HTTP ${response.status}).`);
    }

    return data;
  }

  function getHistory() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "[]");
      return Array.isArray(saved) ? saved.filter((item) => item && typeof item.url === "string" && typeof item.platform === "string") : [];
    } catch (error) {
      console.error("Riwayat glassy tidak dapat dibaca:", error);
      setMessage("Riwayat lokal tidak dapat dibaca di browser ini.", false);
      return [];
    }
  }

  function saveHistory(items) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(items.slice(0, maxHistoryItems)));
      return true;
    } catch (error) {
      console.error("Riwayat glassy tidak dapat disimpan:", error);
      setMessage("Browser tidak mengizinkan penyimpanan riwayat lokal.", false);
      return false;
    }
  }

  function normalizeUrl(value) {
    const trimmed = value.trim();
    if (!trimmed) return null;

    let url;
    try {
      url = new URL(trimmed);
    } catch {
      try {
        url = new URL(`https://${trimmed}`);
      } catch {
        return null;
      }
    }

    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url;
  }

  function detectPlatform(url) {
    const hostname = url.hostname.toLowerCase();
    return Object.keys(platformHosts).find((platform) => platformHosts[platform].includes(hostname)) || null;
  }

  function setMessage(text, isError = true) {
    message.textContent = text;
    message.style.color = isError ? "#f399a2" : "#a1e2c2";
    inputWrap.classList.toggle("invalid", isError && Boolean(text));
  }

  function platformIcon(platform) {
    if (platform === "instagram") {
      return '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="5" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="2"/><circle cx="17.7" cy="6.8" r="1.1" fill="currentColor"/></svg>';
    }
    return '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M15.8 3c.3 2.2 1.5 3.5 3.7 3.7v3.2a8.6 8.6 0 0 1-3.7-.9v6.2a5.8 5.8 0 1 1-5.8-5.8c.4 0 .8 0 1.2.1v3.3a2.6 2.6 0 1 0 1.4 2.3V3h3.2Z" fill="currentColor"/></svg>';
  }

  function renderHistory() {
    const items = getHistory();
    historyList.replaceChildren();
    historySection.hidden = items.length === 0;

    items.forEach((item) => {
      const row = document.createElement("article");
      row.className = "history-item";

      const icon = document.createElement("span");
      icon.className = "history-platform-icon";
      icon.innerHTML = platformIcon(item.platform);

      const details = document.createElement("div");
      const link = document.createElement("div");
      link.className = "history-url";
      link.textContent = item.url;
      link.title = item.url;
      const meta = document.createElement("div");
      meta.className = "history-meta";
      meta.textContent = `${platformLabels[item.platform] || "Platform"} · ${item.format === "audio" ? "Audio MP3" : "Video MP4"}`;
      details.append(link, meta);

      const openButton = document.createElement("button");
      openButton.className = "history-open";
      openButton.type = "button";
      openButton.textContent = "Pakai lagi";
      openButton.addEventListener("click", () => {
        input.value = item.url;
        selectPlatform(item.platform);
        input.focus();
        form.scrollIntoView({ behavior: "smooth", block: "center" });
      });

      row.append(icon, details, openButton);
      historyList.append(row);
    });
  }

  function selectPlatform(platform) {
    selectedPlatform = platform;
    platformSwitch.dataset.platform = platform;

    tabs.forEach((tab) => {
      const isActive = tab.dataset.platform === platform;
      tab.classList.toggle("active", isActive);
      tab.setAttribute("aria-selected", String(isActive));
    });

    const isStalkMode = platform === "stalkig";
    input.type = isStalkMode ? "text" : "url";
    input.inputMode = isStalkMode ? "text" : "url";
    input.autocomplete = isStalkMode ? "off" : "url";
    inputLabel.textContent = isStalkMode ? "USERNAME INSTAGRAM" : "TEMPEL TAUTAN KONTEN";
    input.placeholder = isStalkMode
      ? "Masukkan username Instagram..."
      : `Tempel link ${platformLabels[platform]} di sini...`;
    pasteButton.hidden = isStalkMode;
    audioOption.disabled = platform !== "tiktok";
    if (audioOption.disabled && formatSelect.value === "audio") formatSelect.value = "video";
    inputHint.hidden = false;
    const exampleText = {
      tiktok: "https://www.tiktok.com/@creator/video/...",
      instagram: "https://www.instagram.com/reel/...",
      stalkig: "@creator.instagram",
    };
    document.querySelector("#example-link").textContent = exampleText[platform];
    downloadOptions.hidden = isStalkMode;
    qualitySelect.disabled = formatSelect.value === "audio";
    qualityControl.classList.toggle("disabled", qualitySelect.disabled);
    submitButton.querySelector("span:first-child").textContent = isStalkMode ? "Cari profil" : "Analisis tautan";
    resultCard.hidden = true;
    backendNote.hidden = true;
    profileCard.hidden = true;
    profileBackendNote.hidden = true;
    setMessage("", false);
  }

  function getSafeMediaUrl(value) {
    let url;
    try {
      url = new URL(value, window.location.origin);
    } catch (error) {
      throw new Error("Backend mengembalikan URL media yang tidak valid.");
    }

    if (url.protocol !== "https:" && !(url.protocol === "http:" && url.origin === window.location.origin)) {
      throw new Error("URL media backend harus HTTPS atau berasal dari server aplikasi.");
    }
    return url;
  }

  function showDownloadResult(url, platform, media) {
    resultArt.classList.toggle("instagram-art", platform === "instagram");
    resultPlatform.textContent = `TAUTAN ${platformLabels[platform].toUpperCase()}`;
    resultTitle.textContent = media.length === 1 ? "Media siap diunduh" : `${media.length} media siap diunduh`;
    resultDescription.textContent = "Media berhasil diproses oleh backend.";
    resultLink.textContent = url.href;
    resultLink.title = url.href;
    mediaDownloads.replaceChildren();

    media.forEach((item, index) => {
      const mediaUrl = getSafeMediaUrl(item.url);
      const link = document.createElement("a");
      link.className = "download-button";
      link.href = mediaUrl.href;
      link.rel = "noopener noreferrer";
      link.target = "_blank";
      const mediaType = item.type === "audio" ? "Audio" : item.type === "image" ? "Foto" : "Video";
      link.textContent = mediaUrl.origin === window.location.origin ? `Unduh ${mediaType} ${index + 1} ↓` : `Buka ${mediaType} ${index + 1} ↗`;

      if (mediaUrl.origin === window.location.origin) {
        const extension = item.type === "audio" ? "mp3" : item.type === "image" ? "jpg" : "mp4";
        link.download = `glassy-${platform}-${index + 1}.${extension}`;
      }

      mediaDownloads.append(link);
    });

    resultCard.hidden = false;
    backendNote.hidden = false;
    backendNote.textContent = "Media berasal dari backend yang dikonfigurasi. Simpan hanya konten yang kamu miliki atau berizin untuk diunduh.";
    profileCard.hidden = true;
    profileBackendNote.hidden = true;
    resultCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function displayValue(value, suffix = "") {
    if (value === null || value === undefined || value === "") return "—";
    return `${String(value)}${suffix}`;
  }

  function showProfile(data, username) {
    const safeUsername = typeof data.username === "string" && data.username.trim()
      ? data.username.trim().replace(/^@/, "")
      : username;
    const profilePictureUrl = typeof data.profile_pic === "string" ? data.profile_pic : "";

    document.querySelector("#profile-name").textContent =
      typeof data.name === "string" && data.name.trim() ? data.name.trim() : safeUsername;
    document.querySelector("#profile-username").textContent = `@${safeUsername}`;
    document.querySelector("#profile-bio").textContent =
      typeof data.bio === "string" && data.bio.trim() ? data.bio : "Bio tidak tersedia.";
    document.querySelector("#profile-followers").textContent = displayValue(data.followers);
    document.querySelector("#profile-following").textContent = displayValue(data.following);
    document.querySelector("#profile-posts").textContent = displayValue(data.posts);
    document.querySelector("#profile-engagement").textContent = displayValue(
      data.engagement_rate,
      typeof data.engagement_rate === "number" ? "%" : "",
    );
    profileVerified.hidden = data.verified !== true;

    profilePicture.hidden = true;
    profileAvatarFallback.hidden = false;
    profilePicture.removeAttribute("src");
    profilePicture.alt = `Foto profil @${safeUsername}`;

    if (profilePictureUrl) {
      const pictureUrl = getSafeMediaUrl(profilePictureUrl);
      profilePicture.onload = () => {
        profilePicture.hidden = false;
        profileAvatarFallback.hidden = true;
      };
      profilePicture.onerror = () => {
        profilePicture.hidden = true;
        profileAvatarFallback.hidden = false;
      };
      profilePicture.src = pictureUrl.href;
    }

    profileCard.hidden = false;
    profileBackendNote.hidden = false;
    profileBackendNote.textContent = "Username dikirim ke backend aplikasi untuk mencari informasi profil publik.";
    resultCard.hidden = true;
    backendNote.hidden = true;
    profileCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => selectPlatform(tab.dataset.platform));
  });

  input.addEventListener("input", () => {
    if (message.textContent) setMessage("", false);
    inputWrap.classList.remove("invalid");
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    resultCard.hidden = true;
    profileCard.hidden = true;
    backendNote.hidden = true;
    profileBackendNote.hidden = true;
    setMessage("", false);
    submitButton.disabled = true;
    submitButton.querySelector("span:first-child").textContent =
      selectedPlatform === "stalkig" ? "Mencari profil..." : "Memproses...";

    try {
      if (selectedPlatform === "stalkig") {
        const username = input.value.trim().replace(/^@/, "");
        if (!/^[A-Za-z0-9._]{1,30}$/.test(username)) {
          setMessage("Masukkan username Instagram yang valid (1–30 karakter: huruf, angka, titik, atau garis bawah).");
          input.focus();
          return;
        }

        const response = await postToApi(apiRoutes.stalkig, { username });
        if (!response.data || typeof response.data !== "object" || Array.isArray(response.data)) {
          throw new Error("Response backend tidak berisi data profil yang valid.");
        }
        showProfile(response.data, username);
        setMessage("Profil ditemukan.", false);
        return;
      }

      const url = normalizeUrl(input.value);
      if (!url) {
        setMessage("Masukkan tautan yang valid, misalnya https://www.tiktok.com/...");
        input.focus();
        return;
      }

      const detectedPlatform = detectPlatform(url);
      if (!detectedPlatform) {
        setMessage("Tautan belum didukung. Gunakan link dari TikTok atau Instagram.");
        input.focus();
        return;
      }

      if (detectedPlatform !== selectedPlatform) selectPlatform(detectedPlatform);
      url.hash = "";
      input.value = url.href;
      const payload = {
        url: url.href,
        format: formatSelect.value,
        quality: qualitySelect.value,
      };
      const response = await postToApi(apiRoutes[detectedPlatform], payload);
      if (!Array.isArray(response.media) || response.media.length === 0) {
        throw new Error("Backend tidak menemukan media pada tautan tersebut.");
      }

      const media = response.media.map((item) => {
        if (!item || !["video", "image", "audio"].includes(item.type) || typeof item.url !== "string") {
          throw new Error("Response backend berisi format media yang tidak valid.");
        }
        getSafeMediaUrl(item.url);
        return item;
      });

      showDownloadResult(url, detectedPlatform, media);
      setMessage("Media berhasil diproses.", false);
      const items = getHistory().filter((item) => item.url !== url.href);
      items.unshift({
        url: url.href,
        platform: detectedPlatform,
        format: formatSelect.value,
        checkedAt: Date.now(),
      });
      saveHistory(items);
      renderHistory();
    } catch (error) {
      console.error("Permintaan glassy gagal:", error);
      setMessage(error instanceof Error ? error.message : "Permintaan gagal. Silakan coba lagi.");
    } finally {
      submitButton.disabled = false;
      submitButton.querySelector("span:first-child").textContent =
        selectedPlatform === "stalkig" ? "Cari profil" : "Analisis tautan";
    }
  });

  document.querySelector("#paste-button").addEventListener("click", async () => {
    if (!navigator.clipboard || !navigator.clipboard.readText) {
      setMessage("Akses clipboard tidak tersedia. Tempel tautan langsung ke kolom.", false);
      input.focus();
      return;
    }

    try {
      const clipboardText = await navigator.clipboard.readText();
      if (!clipboardText.trim()) {
        setMessage("Clipboard kosong. Salin tautan dulu, lalu coba lagi.", false);
        return;
      }
      input.value = clipboardText.trim();
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.focus();
    } catch (error) {
      console.error("Clipboard tidak dapat diakses:", error);
      setMessage("Clipboard tidak dapat diakses. Tempel tautan langsung ke kolom.", false);
      input.focus();
    }
  });

  document.querySelector("#example-link").addEventListener("click", () => {
    const examples = {
      tiktok: "https://www.tiktok.com/@creator/video/1234567890123456789",
      instagram: "https://www.instagram.com/reel/ABC123xyz/",
      stalkig: "@creator.instagram",
    };
    input.value = examples[selectedPlatform];
    input.focus();
    setMessage("", false);
    inputWrap.classList.remove("invalid");
  });

  formatSelect.addEventListener("change", () => {
    const isAudio = formatSelect.value === "audio";
    qualitySelect.disabled = isAudio;
    qualityControl.classList.toggle("disabled", isAudio);
  });

  document.querySelector("#clear-history").addEventListener("click", () => {
    if (saveHistory([])) renderHistory();
  });

  document.querySelector("#current-year").textContent = new Date().getFullYear();
  renderHistory();
})();