/* =========================================================
   MyRoutine — Backup & Recovery System
   Part 1/4
   ========================================================= */

(function () {
  "use strict";

  const BACKUP_VERSION = "1.0.0";

  const STORAGE_KEY =
    "myroutine_backups";

  const MAX_BACKUPS = 10;

  const state = {
    backups: [],
    lastBackup: null,
    autoBackup: true
  };

  /* ---------------------------------------------------------
     Storage helpers
     --------------------------------------------------------- */

  function loadBackups() {
    try {
      const raw =
        localStorage.getItem(
          STORAGE_KEY
        );

      if (!raw) {
        state.backups = [];
        return [];
      }

      const parsed =
        JSON.parse(raw);

      state.backups =
        Array.isArray(parsed)
          ? parsed
          : [];

      return state.backups;
    } catch (error) {
      console.warn(
        "MyRoutine Backup: unable to load backups.",
        error
      );

      state.backups = [];

      return [];
    }
  }

  function saveBackups() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(
          state.backups
        )
      );

      return true;
    } catch (error) {
      console.warn(
        "MyRoutine Backup: unable to save backups.",
        error
      );

      return false;
    }
  }

  /* ---------------------------------------------------------
     Routine access
     --------------------------------------------------------- */

  function getRoutines() {
    if (
      window.MyRoutine &&
      window.MyRoutine.state &&
      window.MyRoutine.state.data &&
      Array.isArray(
        window.MyRoutine.state.data.routines
      )
    ) {
      return (
        window.MyRoutine.state
          .data.routines
      );
    }

    return [];
  }

  function getActiveRoutine() {
    if (
      window.MyRoutine &&
      typeof
        window.MyRoutine.getActiveRoutine ===
        "function"
    ) {
      return (
        window.MyRoutine
          .getActiveRoutine()
      );
    }

    return null;
  }

  /* ---------------------------------------------------------
     Utility helpers
     --------------------------------------------------------- */

  function generateId() {
    return (
      "backup-" +
      Date.now() +
      "-" +
      Math.random()
        .toString(36)
        .slice(2, 9)
    );
  }

  function deepClone(value) {
    try {
      return JSON.parse(
        JSON.stringify(value)
      );
    } catch (error) {
      return null;
    }
  }

  function emit(name, detail) {
    document.dispatchEvent(
      new CustomEvent(
        name,
        {
          detail:
            detail || {}
        }
      )
    );
  }

  /* ---------------------------------------------------------
     Create backup
     --------------------------------------------------------- */

  function createBackup(
    label,
    options
  ) {
    options =
      options || {};

    const routines =
      getRoutines();

    if (!routines.length) {
      return null;
    }

    const backup = {
      id:
        generateId(),

      version:
        BACKUP_VERSION,

      label:
        label ||
        "MyRoutine Backup",

      createdAt:
        new Date().toISOString(),

      activeRoutineId:
        window.MyRoutine &&
        window.MyRoutine.state
          ? window.MyRoutine.state
              .activeRoutineId ||
            null
          : null,

      routines:
        deepClone(
          routines
        )
    };

    state.backups.unshift(
      backup
    );

    /*
     * Keep only the latest backups.
     */
    if (
      state.backups.length >
      MAX_BACKUPS
    ) {
      state.backups =
        state.backups.slice(
          0,
          MAX_BACKUPS
        );
    }

    saveBackups();

    state.lastBackup =
      backup;

    emit(
      "myroutine:backup-created",
      {
        backup:
          backup
      }
    );

    return backup;
  }

  /* ---------------------------------------------------------
     List backups
     --------------------------------------------------------- */

  function getBackups() {
    loadBackups();

    return state.backups.map(
      function (backup) {
        return {
          id:
            backup.id,

          label:
            backup.label,

          createdAt:
            backup.createdAt,

          routineCount:
            Array.isArray(
              backup.routines
            )
              ? backup.routines.length
              : 0
        };
      }
    );
  }

  /* ---------------------------------------------------------
     Public API
     --------------------------------------------------------- */

  window.MyRoutineBackup = {
    version:
      BACKUP_VERSION,

    state,

    createBackup,

    getBackups,

    loadBackups,

    saveBackups,

    getRoutines,

    getActiveRoutine
  };

  loadBackups();

  console.log(
    "MyRoutine Backup system loaded."
  );

})();
/* =========================================================
   MyRoutine — Backup & Recovery System
   Part 2/4
   ========================================================= */

(function () {
  "use strict";

  const backup =
    window.MyRoutineBackup;

  if (!backup) return;

  /* ---------------------------------------------------------
     Find backup
     --------------------------------------------------------- */

  function findBackup(id) {
    backup.loadBackups();

    return (
      backup.state.backups.find(
        function (item) {
          return item.id === id;
        }
      ) || null
    );
  }

  /* ---------------------------------------------------------
     Restore backup
     --------------------------------------------------------- */

  function restoreBackup(id) {
    const selected =
      findBackup(id);

    if (!selected) {
      return false;
    }

    if (
      !Array.isArray(
        selected.routines
      )
    ) {
      return false;
    }

    /*
     * Clone first so the stored backup
     * remains untouched.
     */
    const routines =
      JSON.parse(
        JSON.stringify(
          selected.routines
        )
      );

    if (
      !window.MyRoutine ||
      !window.MyRoutine.state
    ) {
      return false;
    }

    if (
      !window.MyRoutine.state.data
    ) {
      window.MyRoutine.state.data = {};
    }

    window.MyRoutine.state
      .data.routines =
      routines;

    /*
     * Restore the previously active
     * routine when it still exists.
     */
    const activeId =
      selected.activeRoutineId;

    const activeExists =
      routines.some(
        function (routine) {
          return (
            routine.id ===
            activeId
          );
        }
      );

    if (activeExists) {
      window.MyRoutine.state
        .activeRoutineId =
        activeId;
    } else {
      window.MyRoutine.state
        .activeRoutineId =
        routines.length
          ? routines[0].id
          : null;
    }

    /*
     * Save through the existing
     * MyRoutine engine when available.
     */
    if (
      typeof
        window.MyRoutine.saveRoutines ===
        "function"
    ) {
      window.MyRoutine
        .saveRoutines();
    }

    /*
     * Also synchronize the storage
     * module if it exists.
     */
    if (
      window.MyRoutineStorage &&
      typeof
        window.MyRoutineStorage.save ===
        "function"
    ) {
      try {
        window.MyRoutineStorage.save();
      } catch (error) {
        console.warn(
          "Backup restore storage sync failed.",
          error
        );
      }
    }

    emit(
      "myroutine:backup-restored",
      {
        backup:
          selected,

        routineCount:
          routines.length
      }
    );

    /*
     * Tell all modules to refresh.
     */
    emit(
      "myroutine:routine-changed",
      {
        source:
          "backup-restore"
      }
    );

    return true;
  }

  /* ---------------------------------------------------------
     Delete backup
     --------------------------------------------------------- */

  function deleteBackup(id) {
    backup.loadBackups();

    const before =
      backup.state.backups.length;

    backup.state.backups =
      backup.state.backups.filter(
        function (item) {
          return item.id !== id;
        }
      );

    if (
      backup.state.backups.length ===
      before
    ) {
      return false;
    }

    backup.saveBackups();

    emit(
      "myroutine:backup-deleted",
      {
        backupId:
          id
      }
    );

    return true;
  }

  /* ---------------------------------------------------------
     Clear all backups
     --------------------------------------------------------- */

  function clearBackups() {
    backup.state.backups = [];

    const saved =
      backup.saveBackups();

    if (saved) {
      emit(
        "myroutine:backups-cleared"
      );
    }

    return saved;
  }

  /* ---------------------------------------------------------
     Get complete backup
     --------------------------------------------------------- */

  function getBackup(id) {
    const selected =
      findBackup(id);

    if (!selected) {
      return null;
    }

    return JSON.parse(
      JSON.stringify(
        selected
      )
    );
  }

  /* ---------------------------------------------------------
     Expose API
     --------------------------------------------------------- */

  backup.findBackup =
    findBackup;

  backup.getBackup =
    getBackup;

  backup.restoreBackup =
    restoreBackup;

  backup.deleteBackup =
    deleteBackup;

  backup.clearBackups =
    clearBackups;

})();
/* =========================================================
   MyRoutine — Backup & Recovery System
   Part 3/4
   ========================================================= */

(function () {
  "use strict";

  const backup =
    window.MyRoutineBackup;

  if (!backup) return;

  /* ---------------------------------------------------------
     Export backup
     --------------------------------------------------------- */

  function exportBackup(id) {
    const selected =
      backup.getBackup(id);

    if (!selected) {
      return null;
    }

    const json =
      JSON.stringify(
        selected,
        null,
        2
      );

    downloadFile(
      json,
      "myroutine-backup-" +
        id +
        ".json",
      "application/json"
    );

    emit(
      "myroutine:backup-exported",
      {
        backup:
          selected
      }
    );

    return selected;
  }

  /* ---------------------------------------------------------
     Export all backups
     --------------------------------------------------------- */

  function exportAllBackups() {
    backup.loadBackups();

    const payload = {
      version:
        backup.version,

      exportedAt:
        new Date().toISOString(),

      backups:
        backup.state.backups
    };

    const json =
      JSON.stringify(
        payload,
        null,
        2
      );

    downloadFile(
      json,
      "myroutine-backups-" +
        Date.now() +
        ".json",
      "application/json"
    );

    emit(
      "myroutine:backups-exported",
      {
        count:
          backup.state.backups
            .length
      }
    );

    return payload;
  }

  /* ---------------------------------------------------------
     Import backup
     --------------------------------------------------------- */

  async function importBackup(
    source
  ) {
    try {
      const text =
        await readSource(
          source
        );

      const parsed =
        JSON.parse(text);

      /*
       * Accept either:
       * 1. A single backup object
       * 2. An exported backup collection
       */
      let imported = [];

      if (
        Array.isArray(
          parsed.backups
        )
      ) {
        imported =
          parsed.backups;
      } else if (
        Array.isArray(
          parsed.routines
        )
      ) {
        imported = [
          parsed
        ];
      } else {
        throw new Error(
          "Invalid MyRoutine backup file."
        );
      }

      let added = 0;

      imported.forEach(
        function (item) {
          if (
            !item ||
            !Array.isArray(
              item.routines
            )
          ) {
            return;
          }

          const safeBackup = {
            id:
              item.id ||
              generateId(),

            version:
              item.version ||
              backup.version,

            label:
              item.label ||
              "Imported Backup",

            createdAt:
              item.createdAt ||
              new Date()
                .toISOString(),

            activeRoutineId:
              item.activeRoutineId ||
              null,

            routines:
              deepClone(
                item.routines
              )
          };

          /*
           * Prevent duplicate backup IDs.
           */
          const duplicate =
            backup.state.backups
              .some(
                function (existing) {
                  return (
                    existing.id ===
                    safeBackup.id
                  );
                }
              );

          if (duplicate) {
            safeBackup.id =
              generateId();
          }

          backup.state.backups
            .unshift(
              safeBackup
            );

          added++;
        }
      );

      /*
       * Keep backup history under
       * the configured limit.
       */
      backup.state.backups =
        backup.state.backups.slice(
          0,
          10
        );

      backup.saveBackups();

      emit(
        "myroutine:backups-imported",
        {
          count:
            added
        }
      );

      return {
        success:
          true,

        count:
          added
      };

    } catch (error) {
      console.error(
        "MyRoutine backup import failed:",
        error
      );

      return {
        success:
          false,

        error:
          error.message ||
          "Unable to import backup."
      };
    }
  }

  /* ---------------------------------------------------------
     Automatic backup
     --------------------------------------------------------- */

  function setAutoBackup(enabled) {
    backup.state.autoBackup =
      Boolean(enabled);

    try {
      localStorage.setItem(
        "myroutine_auto_backup",
        backup.state.autoBackup
          ? "true"
          : "false"
      );
    } catch (error) {
      /* Ignore storage errors. */
    }

    return (
      backup.state.autoBackup
    );
  }

  function isAutoBackupEnabled() {
    return (
      backup.state.autoBackup
    );
  }

  function loadAutoBackupSetting() {
    try {
      const value =
        localStorage.getItem(
          "myroutine_auto_backup"
        );

      if (
        value === "false"
      ) {
        backup.state.autoBackup =
          false;
      } else {
        backup.state.autoBackup =
          true;
      }
    } catch (error) {
      backup.state.autoBackup =
        true;
    }

    return (
      backup.state.autoBackup
    );
  }

  /* ---------------------------------------------------------
     Automatic backup trigger
     --------------------------------------------------------- */

  function performAutoBackup() {
    if (
      !backup.state.autoBackup
    ) {
      return null;
    }

    const routines =
      backup.getRoutines();

    if (!routines.length) {
      return null;
    }

    return backup.createBackup(
      "Automatic Backup"
    );
  }

  /* ---------------------------------------------------------
     Helpers
     --------------------------------------------------------- */

  function generateId() {
    return (
      "backup-" +
      Date.now() +
      "-" +
      Math.random()
        .toString(36)
        .slice(2, 9)
    );
  }

  function deepClone(value) {
    try {
      return JSON.parse(
        JSON.stringify(value)
      );
    } catch (error) {
      return null;
    }
  }

  function downloadFile(
    content,
    filename,
    type
  ) {
    const blob =
      new Blob(
        [content],
        {
          type:
            type ||
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
      filename;

    document.body.appendChild(
      link
    );

    link.click();

    link.remove();

    setTimeout(
      function () {
        URL.revokeObjectURL(
          url
        );
      },
      1000
    );
  }

  async function readSource(
    source
  ) {
    if (
      typeof source ===
      "string"
    ) {
      return source;
    }

    if (
      source &&
      typeof source.text ===
        "function"
    ) {
      return await source.text();
    }

    throw new Error(
      "No backup file supplied."
    );
  }

  function emit(name, detail) {
    document.dispatchEvent(
      new CustomEvent(
        name,
        {
          detail:
            detail || {}
        }
      )
    );
  }

  /* ---------------------------------------------------------
     Public API
     --------------------------------------------------------- */

  backup.exportBackup =
    exportBackup;

  backup.exportAllBackups =
    exportAllBackups;

  backup.importBackup =
    importBackup;

  backup.setAutoBackup =
    setAutoBackup;

  backup.isAutoBackupEnabled =
    isAutoBackupEnabled;

  backup.loadAutoBackupSetting =
    loadAutoBackupSetting;

  backup.performAutoBackup =
    performAutoBackup;

  loadAutoBackupSetting();

})();
/* =========================================================
   MyRoutine — Backup & Recovery System
   Part 4/4
   ========================================================= */

(function () {
  "use strict";

  const backup =
    window.MyRoutineBackup;

  if (!backup) return;

  /* ---------------------------------------------------------
     Automatic backup scheduling
     --------------------------------------------------------- */

  let autoBackupTimer = null;

  function scheduleAutoBackup() {
    if (autoBackupTimer) {
      clearTimeout(autoBackupTimer);
    }

    if (!backup.isAutoBackupEnabled()) {
      return;
    }

    /*
     * Delay the backup slightly so multiple
     * changes made together don't create
     * multiple backup files.
     */
    autoBackupTimer =
      setTimeout(
        function () {
          backup.performAutoBackup();
          autoBackupTimer = null;
        },
        1500
      );
  }

  /* ---------------------------------------------------------
     Backup on important changes
     * --------------------------------------------------------- */

  document.addEventListener(
    "myroutine:routine-changed",
    scheduleAutoBackup
  );

  document.addEventListener(
    "myroutine:calendar-changed",
    scheduleAutoBackup
  );

  /* ---------------------------------------------------------
     Backup before page unload
     * --------------------------------------------------------- */

  window.addEventListener(
    "beforeunload",
    function () {
      if (
        backup.isAutoBackupEnabled()
      ) {
        /*
         * Don't create a new backup
         * during every page refresh if
         * there is already a recent one.
         */
        backup.loadBackups();

        const latest =
          backup.state.backups[0];

        if (latest) {
          const age =
            Date.now() -
            new Date(
              latest.createdAt
            ).getTime();

          /*
           * 5-minute protection window.
           */
          if (
            age <
            5 * 60 * 1000
          ) {
            return;
          }
        }

        backup.performAutoBackup();
      }
    }
  );

  /* ---------------------------------------------------------
     Backup status
     --------------------------------------------------------- */

  function getStatus() {
    backup.loadBackups();

    const backups =
      backup.state.backups;

    return {
      enabled:
        backup.isAutoBackupEnabled(),

      count:
        backups.length,

      latest:
        backups.length
          ? backups[0]
          : null,

      maxBackups:
        10
    };
  }

  /* ---------------------------------------------------------
     Create named backup
     --------------------------------------------------------- */

  function createNamedBackup(
    label
  ) {
    return backup.createBackup(
      label ||
        "Manual Backup"
    );
  }

  /* ---------------------------------------------------------
     Restore latest backup
     --------------------------------------------------------- */

  function restoreLatest() {
    backup.loadBackups();

    const latest =
      backup.state.backups[0];

    if (!latest) {
      return false;
    }

    return backup.restoreBackup(
      latest.id
    );
  }

  /* ---------------------------------------------------------
     Cleanup old backups
     --------------------------------------------------------- */

  function cleanup() {
    backup.loadBackups();

    backup.state.backups =
      backup.state.backups.slice(
        0,
        10
      );

    backup.saveBackups();

    return backup.state.backups
      .length;
  }

  /* ---------------------------------------------------------
     Reset backup system
     --------------------------------------------------------- */

  function reset() {
    if (autoBackupTimer) {
      clearTimeout(
        autoBackupTimer
      );

      autoBackupTimer =
        null;
    }

    backup.clearBackups();

    backup.state.lastBackup =
      null;

    backup.state.autoBackup =
      true;

    try {
      localStorage.removeItem(
        "myroutine_auto_backup"
      );
    } catch (error) {
      /* Ignore storage errors. */
    }

    return true;
  }

  /* ---------------------------------------------------------
     Public API
     --------------------------------------------------------- */

  backup.scheduleAutoBackup =
    scheduleAutoBackup;

  backup.getStatus =
    getStatus;

  backup.createNamedBackup =
    createNamedBackup;

  backup.restoreLatest =
    restoreLatest;

  backup.cleanup =
    cleanup;

  backup.reset =
    reset;

  /* ---------------------------------------------------------
     Initial cleanup
     --------------------------------------------------------- */

  backup.cleanup();

  console.log(
    "MyRoutine Backup & Recovery ready."
  );

})();