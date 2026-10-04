/* MyRoutine — Universal Storage Manager */

(function () {
  "use strict";

  const VERSION = "1.0.0";
  const STORAGE_KEY = "myroutine_storage";
  const BACKUP_KEY = "myroutine_storage_backup";
  const META_KEY = "myroutine_storage_meta";

  let autoSaveTimer = null;
  let initialized = false;

  function safeParse(value, fallback = null) {
    if (!value) {
      return fallback;
    }

    try {
      return JSON.parse(value);
    } catch (_) {
      return fallback;
    }
  }

  function safeStringify(value) {
    try {
      return JSON.stringify(value);
    } catch (_) {
      return null;
    }
  }

  function storageAvailable() {
    try {
      const testKey =
        "__myroutine_storage_test__";

      localStorage.setItem(
        testKey,
        "1"
      );

      localStorage.removeItem(
        testKey
      );

      return true;
    } catch (_) {
      return false;
    }
  }

  function getMeta() {
    if (!storageAvailable()) {
      return {
        version: VERSION,
        updatedAt: null,
        initialized: false
      };
    }

    return (
      safeParse(
        localStorage.getItem(
          META_KEY
        ),
        null
      ) || {
        version: VERSION,
        updatedAt: null,
        initialized: false
      }
    );
  }

  function saveMeta(extra = {}) {
    if (!storageAvailable()) {
      return false;
    }

    const meta = {
      ...getMeta(),
      ...extra,
      version: VERSION,
      updatedAt:
        new Date().toISOString()
    };

    try {
      localStorage.setItem(
        META_KEY,
        JSON.stringify(meta)
      );

      return true;
    } catch (_) {
      return false;
    }
  }

  function getEngineData() {
    if (
      !window.MyRoutine ||
      !window.MyRoutine.state
    ) {
      return null;
    }

    return window.MyRoutine.state.data;
  }

  function getEngineSnapshot() {
    const data =
      getEngineData();

    if (!data) {
      return null;
    }

    try {
      return JSON.parse(
        JSON.stringify(data)
      );
    } catch (_) {
      return null;
    }
  }

  function saveData(
    data = getEngineData()
  ) {
    if (!data) {
      return false;
    }

    if (!storageAvailable()) {
      return false;
    }

    const serialized =
      safeStringify(data);

    if (!serialized) {
      return false;
    }

    try {
      const old =
        localStorage.getItem(
          STORAGE_KEY
        );

      if (old) {
        localStorage.setItem(
          BACKUP_KEY,
          old
        );
      }

      localStorage.setItem(
        STORAGE_KEY,
        serialized
      );

      saveMeta({
        initialized: true
      });

      return true;
    } catch (error) {
      console.error(
        "MyRoutine storage save failed:",
        error
      );

      return false;
    }
  }

  function loadData() {
    if (!storageAvailable()) {
      return null;
    }

    const raw =
      localStorage.getItem(
        STORAGE_KEY
      );

    if (!raw) {
      return null;
    }

    return safeParse(
      raw,
      null
    );
  }

  function loadBackup() {
    if (!storageAvailable()) {
      return null;
    }

    return safeParse(
      localStorage.getItem(
        BACKUP_KEY
      ),
      null
    );
  }

  function restoreData(
    data
  ) {
    if (
      !data ||
      typeof data !== "object"
    ) {
      return false;
    }

    if (
      !window.MyRoutine ||
      !window.MyRoutine.state
    ) {
      return false;
    }

    try {
      window.MyRoutine.state.data =
        JSON.parse(
          JSON.stringify(data)
        );

      saveData(
        window.MyRoutine.state.data
      );

      window.dispatchEvent(
        new CustomEvent(
          "myroutine:storage-restored"
        )
      );

      window.dispatchEvent(
        new CustomEvent(
          "myroutine:updated"
        )
      );

      return true;
    } catch (error) {
      console.error(
        "MyRoutine restore failed:",
        error
      );

      return false;
    }
  }
  function restoreBackup() {
    const backup =
      loadBackup();

    if (!backup) {
      return false;
    }

    return restoreData(
      backup
    );
  }

  function clearData(
    options = {}
  ) {
    if (!storageAvailable()) {
      return false;
    }

    try {
      if (
        options.keepBackup !== false
      ) {
        const current =
          localStorage.getItem(
            STORAGE_KEY
          );

        if (current) {
          localStorage.setItem(
            BACKUP_KEY,
            current
          );
        }
      }

      localStorage.removeItem(
        STORAGE_KEY
      );

      if (
        options.clearMeta !== false
      ) {
        localStorage.removeItem(
          META_KEY
        );
      }

      return true;
    } catch (error) {
      console.error(
        "MyRoutine storage clear failed:",
        error
      );

      return false;
    }
  }

  function clearEverything() {
    if (!storageAvailable()) {
      return false;
    }

    try {
      localStorage.removeItem(
        STORAGE_KEY
      );

      localStorage.removeItem(
        BACKUP_KEY
      );

      localStorage.removeItem(
        META_KEY
      );

      return true;
    } catch (error) {
      console.error(
        "MyRoutine storage reset failed:",
        error
      );

      return false;
    }
  }

  function getStorageSize() {
    if (!storageAvailable()) {
      return {
        available: false,
        bytes: 0,
        kilobytes: 0
      };
    }

    let total = 0;

    [
      STORAGE_KEY,
      BACKUP_KEY,
      META_KEY
    ].forEach(key => {
      const value =
        localStorage.getItem(
          key
        );

      if (value) {
        total +=
          new Blob(
            [value]
          ).size;
      }
    });

    return {
      available: true,
      bytes: total,
      kilobytes:
        Math.round(
          (total / 1024) *
          100
        ) / 100
    };
  }

  function scheduleSave(
    delay = 400
  ) {
    if (autoSaveTimer) {
      clearTimeout(
        autoSaveTimer
      );
    }

    autoSaveTimer =
      setTimeout(
        () => {
          autoSaveTimer =
            null;

          saveData();
        },
        delay
      );
  }

  function saveNow() {
    if (autoSaveTimer) {
      clearTimeout(
        autoSaveTimer
      );

      autoSaveTimer =
        null;
    }

    return saveData();
  }

  function createSnapshot() {
    const data =
      getEngineSnapshot();

    if (!data) {
      return null;
    }

    return {
      schema:
        "myroutine-storage-snapshot",
      version: VERSION,
      createdAt:
        new Date().toISOString(),
      data
    };
  }

  function restoreSnapshot(
    snapshot
  ) {
    if (
      !snapshot ||
      typeof snapshot !==
        "object"
    ) {
      return false;
    }

    const data =
      snapshot.data;

    if (!data) {
      return false;
    }

    return restoreData(
      data
    );
  }

  function exportStorage() {
    const snapshot =
      createSnapshot();

    if (!snapshot) {
      return false;
    }

    const blob =
      new Blob(
        [
          JSON.stringify(
            snapshot,
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
      document.createElement(
        "a"
      );

    link.href =
      url;

    link.download =
      "myroutine-storage-backup.json";

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

  function importStorageFile(
    file
  ) {
    return new Promise(
      (resolve, reject) => {
        if (!file) {
          reject(
            new Error(
              "No backup file selected."
            )
          );

          return;
        }

        const reader =
          new FileReader();

        reader.onload =
          event => {
            try {
              const parsed =
                JSON.parse(
                  event.target.result
                );

              if (
                parsed.schema !==
                "myroutine-storage-snapshot"
              ) {
                throw new Error(
                  "Invalid MyRoutine backup file."
                );
              }

              const restored =
                restoreSnapshot(
                  parsed
                );

              if (!restored) {
                throw new Error(
                  "Could not restore backup."
                );
              }

              resolve(
                true
              );
            } catch (error) {
              reject(
                error
              );
            }
          };

        reader.onerror =
          () => {
            reject(
              new Error(
                "Could not read backup file."
              )
            );
          };

        reader.readAsText(
          file
        );
      }
    );
  }
  function initialize() {
    if (initialized) {
      return;
    }

    initialized = true;

    if (
      !storageAvailable()
    ) {
      console.warn(
        "MyRoutine: browser storage is unavailable."
      );

      return;
    }

    const stored =
      loadData();

    if (
      stored &&
      window.MyRoutine &&
      window.MyRoutine.state
    ) {
      try {
        window.MyRoutine.state.data =
          stored;
      } catch (error) {
        console.error(
          "Could not restore stored routine data:",
          error
        );
      }
    }

    saveMeta({
      initialized: true
    });
  }

  function watchEngine() {
    window.addEventListener(
      "myroutine:updated",
      () => {
        scheduleSave();
      }
    );

    window.addEventListener(
      "myroutine:data-updated",
      () => {
        scheduleSave();
      }
    );

    window.addEventListener(
      "myroutine:settings-updated",
      () => {
        scheduleSave();
      }
    );

    window.addEventListener(
      "beforeunload",
      () => {
        saveNow();
      }
    );
  }

  function getStatus() {
    const size =
      getStorageSize();

    const meta =
      getMeta();

    const data =
      loadData();

    let routineCount = 0;

    if (
      data &&
      Array.isArray(
        data.routines
      )
    ) {
      routineCount =
        data.routines.length;
    }

    return {
      available:
        size.available,
      version:
        VERSION,
      updatedAt:
        meta.updatedAt || null,
      initialized:
        Boolean(
          meta.initialized
        ),
      routineCount,
      bytes:
        size.bytes,
      kilobytes:
        size.kilobytes
    };
  }

  function hasStoredData() {
    if (!storageAvailable()) {
      return false;
    }

    return Boolean(
      localStorage.getItem(
        STORAGE_KEY
      )
    );
  }

  function hasBackup() {
    if (!storageAvailable()) {
      return false;
    }

    return Boolean(
      localStorage.getItem(
        BACKUP_KEY
      )
    );
  }

  function removeBackup() {
    if (!storageAvailable()) {
      return false;
    }

    try {
      localStorage.removeItem(
        BACKUP_KEY
      );

      return true;
    } catch (_) {
      return false;
    }
  }

  function replaceStoredData(
    data
  ) {
    if (
      !data ||
      typeof data !== "object"
    ) {
      return false;
    }

    const serialized =
      safeStringify(data);

    if (!serialized) {
      return false;
    }

    if (!storageAvailable()) {
      return false;
    }

    try {
      const current =
        localStorage.getItem(
          STORAGE_KEY
        );

      if (current) {
        localStorage.setItem(
          BACKUP_KEY,
          current
        );
      }

      localStorage.setItem(
        STORAGE_KEY,
        serialized
      );

      saveMeta({
        initialized: true
      });

      return true;
    } catch (error) {
      console.error(
        "MyRoutine storage replacement failed:",
        error
      );

      return false;
    }
  }

  function getRawData() {
    if (!storageAvailable()) {
      return null;
    }

    return localStorage.getItem(
      STORAGE_KEY
    );
  }
  window.MyRoutineStorage = {
    version:
      VERSION,

    available:
      storageAvailable,

    initialize,

    save:
      saveData,

    saveNow,

    load:
      loadData,

    backup:
      loadBackup,

    restore:
      restoreData,

    restoreBackup,

    clear:
      clearData,

    clearEverything,

    getMeta,

    getStatus,

    getStorageSize,

    hasStoredData,

    hasBackup,

    removeBackup,

    createSnapshot,

    restoreSnapshot,

    export:
      exportStorage,

    importFile:
      importStorageFile,

    replace:
      replaceStoredData,

    raw:
      getRawData,

    scheduleSave
  };

  /*
   * Wait until the main routine engine
   * is available before initializing.
   */

  window.addEventListener(
    "myroutine:ready",
    function () {
      initialize();
      watchEngine();
    }
  );

  /*
   * Fallback for cases where the engine
   * was loaded before this module.
   */

  if (
    window.MyRoutine &&
    window.MyRoutine.state
  ) {
    initialize();
    watchEngine();
  }

})();