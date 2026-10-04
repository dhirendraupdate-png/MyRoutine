/* MyRoutine — Universal Routine Sharing */

(function () {
  "use strict";

  const SHARE_VERSION = "1.0.0";

  let currentRoutineId = null;

  function getRoutine() {
    if (
      !window.MyRoutine ||
      !window.MyRoutine.state
    ) {
      return null;
    }

    if (currentRoutineId) {
      window.MyRoutine.state.activeRoutineId =
        currentRoutineId;
    }

    return window.MyRoutine.getActiveRoutine
      ? window.MyRoutine.getActiveRoutine()
      : null;
  }

  function clone(value) {
    return JSON.parse(
      JSON.stringify(value)
    );
  }

  function makeId(prefix) {
    return (
      prefix +
      "_" +
      Date.now().toString(36) +
      "_" +
      Math.random()
        .toString(36)
        .slice(2, 9)
    );
  }

  function encodeBase64(value) {
    const text =
      typeof value === "string"
        ? value
        : JSON.stringify(value);

    const bytes =
      new TextEncoder().encode(text);

    let binary = "";

    bytes.forEach(byte => {
      binary += String.fromCharCode(byte);
    });

    return btoa(binary);
  }

  function decodeBase64(value) {
    try {
      const binary =
        atob(value);

      const bytes =
        Uint8Array.from(
          binary,
          char => char.charCodeAt(0)
        );

      return new TextDecoder().decode(
        bytes
      );
    } catch (error) {
      throw new Error(
        "Invalid share data."
      );
    }
  }

  function createSharePayload(
    routine
  ) {
    if (!routine) {
      throw new Error(
        "No routine selected."
      );
    }

    return {
      schema:
        "myroutine-share",
      version:
        SHARE_VERSION,
      id:
        makeId("share"),
      createdAt:
        new Date().toISOString(),
      routine:
        clone(routine)
    };
  }

  function createShareCode(
    routine
  ) {
    const payload =
      createSharePayload(
        routine
      );

    return encodeBase64(
      payload
    );
  }

  function decodeShareCode(
    code
  ) {
    if (
      typeof code !== "string" ||
      !code.trim()
    ) {
      throw new Error(
        "Share code is empty."
      );
    }

    const json =
      decodeBase64(
        code.trim()
      );

    let payload;

    try {
      payload =
        JSON.parse(json);
    } catch (error) {
      throw new Error(
        "Share code contains invalid data."
      );
    }

    if (
      !payload ||
      payload.schema !==
        "myroutine-share"
    ) {
      throw new Error(
        "This is not a valid MyRoutine share."
      );
    }

    if (!payload.routine) {
      throw new Error(
        "The shared routine is missing."
      );
    }

    return payload;
  }

  function prepareImportedRoutine(
    payload
  ) {
    const routine =
      clone(
        payload.routine
      );

    routine.id =
      makeId("routine");

    routine.name =
      `${routine.name || "Shared Routine"} (Shared)`;

    return routine;
  }

  function copyToClipboard(
    text
  ) {
    if (
      navigator.clipboard &&
      navigator.clipboard.writeText
    ) {
      return navigator.clipboard.writeText(
        text
      );
    }

    return new Promise(
      (resolve, reject) => {
        const textarea =
          document.createElement(
            "textarea"
          );

        textarea.value =
          text;

        textarea.style.position =
          "fixed";

        textarea.style.opacity =
          "0";

        document.body.appendChild(
          textarea
        );

        textarea.select();

        try {
          document.execCommand(
            "copy"
          );

          textarea.remove();

          resolve();
        } catch (error) {
          textarea.remove();

          reject(error);
        }
      }
    );
  }

  function saveRoutine() {
    if (
      window.MyRoutine &&
      typeof window.MyRoutine.saveRoutines ===
        "function"
    ) {
      window.MyRoutine.saveRoutines();
    }

    window.dispatchEvent(
      new CustomEvent(
        "myroutine:share-updated"
      )
    );

    window.dispatchEvent(
      new CustomEvent(
        "myroutine:updated"
      )
    );
  }
  function importShareCode(
    code,
    options = {}
  ) {
    const payload =
      decodeShareCode(code);

    let routine =
      prepareImportedRoutine(
        payload
      );

    if (
      window.MyRoutineData &&
      typeof window.MyRoutineData.normalize ===
        "function"
    ) {
      routine =
        window.MyRoutineData.normalize(
          routine
        );
    }

    const mode =
      options.mode || "copy";

    if (
      mode === "replace"
    ) {
      const targetId =
        options.targetId ||
        currentRoutineId ||
        window.MyRoutine?.state
          ?.activeRoutineId;

      if (!targetId) {
        throw new Error(
          "No routine selected for replacement."
        );
      }

      routine.id =
        targetId;

      if (
        window.MyRoutineData &&
        typeof window.MyRoutineData.replaceRoutine ===
          "function"
      ) {
        routine.name =
          payload.routine.name ||
          "Shared Routine";

        window.MyRoutineData
          .replaceRoutine(
            routine
          );
      } else {
        throw new Error(
          "Routine data manager is not available."
        );
      }

      return routine;
    }

    if (
      mode === "merge"
    ) {
      const target =
        window.MyRoutineData?.findRoutine
          ? window.MyRoutineData.findRoutine(
              options.targetId ||
              currentRoutineId ||
              window.MyRoutine?.state
                ?.activeRoutineId
            )
          : null;

      if (!target) {
        throw new Error(
          "No target routine selected."
        );
      }

      if (
        typeof window.MyRoutineData
          ?.mergeIntoRoutine !==
        "function"
      ) {
        throw new Error(
          "Routine merge system is not available."
        );
      }

      window.MyRoutineData
        .mergeIntoRoutine(
          target,
          payload.routine
        );

      saveRoutine();

      return target;
    }

    if (
      window.MyRoutineData &&
      typeof window.MyRoutineData.addRoutine ===
        "function"
    ) {
      return window.MyRoutineData.addRoutine(
        routine
      );
    }

    throw new Error(
      "Routine data manager is not available."
    );
  }

  function createShareText(
    routine
  ) {
    if (!routine) {
      throw new Error(
        "No routine selected."
      );
    }

    const code =
      createShareCode(
        routine
      );

    return [
      "MyRoutine",
      "",
      `Routine: ${
        routine.name ||
        "My Routine"
      }`,
      "",
      "Share Code:",
      code,
      "",
      "Import this code into MyRoutine to add the routine."
    ].join("\n");
  }

  function createShareLink(
    routine
  ) {
    const code =
      createShareCode(
        routine
      );

    const base =
      window.location.origin +
      window.location.pathname;

    return (
      base +
      "?share=" +
      encodeURIComponent(
        code
      )
    );
  }

  async function shareRoutine(
    routine
  ) {
    const text =
      createShareText(
        routine
      );

    const url =
      createShareLink(
        routine
      );

    if (
      navigator.share
    ) {
      try {
        await navigator.share({
          title:
            routine.name ||
            "MyRoutine",
          text,
          url
        });

        return {
          shared: true,
          method: "native"
        };
      } catch (error) {
        if (
          error?.name ===
          "AbortError"
        ) {
          return {
            shared: false,
            cancelled: true
          };
        }
      }
    }

    await copyToClipboard(
      text
    );

    return {
      shared: false,
      copied: true,
      method: "clipboard",
      text,
      url
    };
  }

  function downloadShareFile(
    routine
  ) {
    const payload =
      createSharePayload(
        routine
      );

    const blob =
      new Blob(
        [
          JSON.stringify(
            payload,
            null,
            2
          )
        ],
        {
          type:
            "application/json"
        }
      );

    const url =
      URL.createObjectURL(
        blob
      );

    const link =
      document.createElement("a");

    link.href =
      url;

    link.download =
      "myroutine-share.json";

    document.body.appendChild(
      link
    );

    link.click();

    link.remove();

    URL.revokeObjectURL(
      url
    );

    return true;
  }
  function getShareFromURL() {
    const params =
      new URLSearchParams(
        window.location.search
      );

    return (
      params.get("share") ||
      ""
    );
  }

  function clearShareFromURL() {
    const url =
      new URL(
        window.location.href
      );

    url.searchParams.delete(
      "share"
    );

    window.history.replaceState(
      {},
      document.title,
      url.pathname +
        url.search +
        url.hash
    );
  }

  function importFromURL(
    options = {}
  ) {
    const code =
      getShareFromURL();

    if (!code) {
      return null;
    }

    try {
      const routine =
        importShareCode(
          code,
          options
        );

      clearShareFromURL();

      return routine;
    } catch (error) {
      console.error(
        "MyRoutine share import failed:",
        error
      );

      return null;
    }
  }

  function createShareDialog() {
    let dialog =
      document.getElementById(
        "myroutine-share-dialog"
      );

    if (dialog) {
      return dialog;
    }

    dialog =
      document.createElement(
        "div"
      );

    dialog.id =
      "myroutine-share-dialog";

    dialog.style.cssText = `
      position:fixed;
      inset:0;
      z-index:10000;
      background:rgba(15,23,42,.5);
      backdrop-filter:blur(8px);
      display:none;
      align-items:center;
      justify-content:center;
      padding:18px;
      font-family:Inter,system-ui,sans-serif;
    `;

    dialog.innerHTML = `
      <div
        style="
          width:min(620px,100%);
          background:#fff;
          border-radius:20px;
          overflow:hidden;
          box-shadow:0 25px 80px rgba(0,0,0,.25);
        "
      >

        <div
          style="
            display:flex;
            align-items:center;
            justify-content:space-between;
            gap:10px;
            padding:18px;
            border-bottom:1px solid #e5e7eb;
          "
        >
          <div>
            <strong
              style="
                font-size:19px;
              "
            >
              Share Routine
            </strong>

            <div
              id="mr-share-name"
              style="
                margin-top:4px;
                color:#6b7280;
                font-size:12px;
              "
            ></div>
          </div>

          <button
            type="button"
            id="mr-share-close"
            style="
              border:0;
              width:36px;
              height:36px;
              border-radius:9px;
              background:#f3f4f6;
              cursor:pointer;
              font-size:19px;
            "
          >
            ×
          </button>
        </div>

        <div
          style="
            padding:18px;
          "
        >

          <label
            style="
              display:block;
              margin-bottom:7px;
              font-size:12px;
              font-weight:700;
            "
          >
            Share code
          </label>

          <textarea
            id="mr-share-code"
            readonly
            style="
              width:100%;
              min-height:150px;
              resize:vertical;
              border:1px solid #d1d5db;
              border-radius:11px;
              padding:11px;
              font-size:11px;
              line-height:1.5;
              outline:none;
            "
          ></textarea>

          <div
            style="
              display:flex;
              gap:8px;
              flex-wrap:wrap;
              margin-top:12px;
            "
          >

            <button
              type="button"
              id="mr-share-copy"
              style="
                flex:1;
                min-width:120px;
                border:0;
                border-radius:10px;
                padding:11px;
                background:#111827;
                color:#fff;
                cursor:pointer;
              "
            >
              Copy Code
            </button>

            <button
              type="button"
              id="mr-share-native"
              style="
                flex:1;
                min-width:120px;
                border:1px solid #d1d5db;
                border-radius:10px;
                padding:11px;
                background:#fff;
                cursor:pointer;
              "
            >
              Share
            </button>

            <button
              type="button"
              id="mr-share-download"
              style="
                flex:1;
                min-width:120px;
                border:1px solid #d1d5db;
                border-radius:10px;
                padding:11px;
                background:#fff;
                cursor:pointer;
              "
            >
              Save File
            </button>

          </div>

          <div
            id="mr-share-status"
            style="
              min-height:20px;
              margin-top:12px;
              color:#6b7280;
              font-size:12px;
            "
          ></div>

        </div>
      </div>
    `;

    document.body.appendChild(
      dialog
    );

    return dialog;
  }

  function openShareDialog(
    routineId
  ) {
    currentRoutineId =
      routineId ||
      window.MyRoutine?.state
        ?.activeRoutineId;

    const routine =
      getRoutine();

    if (!routine) {
      window.alert(
        "Please select a routine first."
      );

      return;
    }

    const dialog =
      createShareDialog();

    const code =
      createShareCode(
        routine
      );

    const name =
      document.getElementById(
        "mr-share-name"
      );

    const textarea =
      document.getElementById(
        "mr-share-code"
      );

    const status =
      document.getElementById(
        "mr-share-status"
      );

    if (name) {
      name.textContent =
        routine.name ||
        "My Routine";
    }

    if (textarea) {
      textarea.value =
        code;
    }

    if (status) {
      status.textContent =
        "";
    }

    dialog.style.display =
      "flex";

    bindShareDialogEvents();
  }
  function closeShareDialog() {
    const dialog =
      document.getElementById(
        "myroutine-share-dialog"
      );

    if (dialog) {
      dialog.style.display =
        "none";
    }
  }

  function bindShareDialogEvents() {
    const close =
      document.getElementById(
        "mr-share-close"
      );

    const copy =
      document.getElementById(
        "mr-share-copy"
      );

    const nativeShare =
      document.getElementById(
        "mr-share-native"
      );

    const download =
      document.getElementById(
        "mr-share-download"
      );

    const textarea =
      document.getElementById(
        "mr-share-code"
      );

    const status =
      document.getElementById(
        "mr-share-status"
      );

    if (close) {
      close.onclick =
        closeShareDialog;
    }

    if (copy) {
      copy.onclick = async () => {
        try {
          await copyToClipboard(
            textarea?.value || ""
          );

          if (status) {
            status.textContent =
              "Share code copied.";
          }
        } catch (error) {
          if (textarea) {
            textarea.select();
          }

          if (status) {
            status.textContent =
              "Select the code and copy it manually.";
          }
        }
      };
    }

    if (nativeShare) {
      nativeShare.onclick =
        async () => {
          const routine =
            getRoutine();

          if (!routine) {
            return;
          }

          try {
            const result =
              await shareRoutine(
                routine
              );

            if (status) {
              status.textContent =
                result.copied
                  ? "Share text copied."
                  : result.shared
                    ? "Shared successfully."
                    : "Sharing cancelled.";
            }
          } catch (error) {
            if (status) {
              status.textContent =
                "Unable to share this routine.";
            }
          }
        };
    }

    if (download) {
      download.onclick = () => {
        const routine =
          getRoutine();

        if (!routine) {
          return;
        }

        downloadShareFile(
          routine
        );

        if (status) {
          status.textContent =
            "Share file created.";
        }
      };
    }
  }

  window.MyRoutineShare = {
    version:
      SHARE_VERSION,

    open:
      openShareDialog,

    close:
      closeShareDialog,

    createCode:
      createShareCode,

    decodeCode:
      decodeShareCode,

    createText:
      createShareText,

    createLink:
      createShareLink,

    share:
      shareRoutine,

    import:
      importShareCode,

    importFromURL,

    download:
      downloadShareFile,

    copy:
      copyToClipboard
  };

  window.addEventListener(
    "myroutine:ready",
    function () {
      /*
       * The URL import is intentionally
       * prepared but not automatically
       * executed yet.
       *
       * We will connect this during
       * the final integration phase.
       */
    }
  );

  window.addEventListener(
    "keydown",
    function (event) {
      if (
        event.key !== "Escape"
      ) {
        return;
      }

      const dialog =
        document.getElementById(
          "myroutine-share-dialog"
        );

      if (
        dialog &&
        dialog.style.display ===
          "flex"
      ) {
        closeShareDialog();
      }
    }
  );

})();