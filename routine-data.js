/* MyRoutine — Universal Routine Data Manager */

(function () {
  "use strict";

  const VERSION = "1.0.0";

  const REQUIRED_ARRAYS = [
    "periods",
    "subjects"
  ];

  const DAYS = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday"
  ];

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

  function save() {
    if (
      window.MyRoutine &&
      typeof window.MyRoutine.saveRoutines ===
        "function"
    ) {
      window.MyRoutine.saveRoutines();
    }

    window.dispatchEvent(
      new CustomEvent(
        "myroutine:data-updated"
      )
    );

    window.dispatchEvent(
      new CustomEvent(
        "myroutine:updated"
      )
    );
  }

  function normalizeRoutine(
    routine
  ) {
    if (
      !routine ||
      typeof routine !== "object"
    ) {
      return null;
    }

    const result = clone(routine);

    if (!result.id) {
      result.id = makeId("routine");
    }

    if (!result.name) {
      result.name = "Imported Routine";
    }

    if (!Array.isArray(result.periods)) {
      result.periods = [];
    }

    if (!Array.isArray(result.subjects)) {
      result.subjects = [];
    }

    if (
      !result.schedule ||
      typeof result.schedule !== "object"
    ) {
      result.schedule = {};
    }

    DAYS.forEach(day => {
      if (!Array.isArray(result.schedule[day])) {
        result.schedule[day] = [];
      }
    });

    if (!result.settings) {
      result.settings = {};
    }

    result.periods =
      result.periods.map(
        (period, index) => ({
          id:
            period.id ||
            makeId("period"),
          name:
            period.name ||
            `Period ${index + 1}`,
          startTime:
            period.startTime || "",
          endTime:
            period.endTime || "",
          type:
            period.type || "class"
        })
      );

    result.subjects =
      result.subjects.map(
        (subject, index) => ({
          id:
            subject.id ||
            makeId("subject"),
          name:
            subject.name ||
            `Subject ${index + 1}`,
          code:
            subject.code || "",
          teacher:
            subject.teacher || "",
          room:
            subject.room || "",
          type:
            subject.type || "subject"
        })
      );

    return result;
  }

  function validateRoutine(
    routine
  ) {
    const errors = [];
    const warnings = [];

    if (
      !routine ||
      typeof routine !== "object"
    ) {
      errors.push(
        "Routine must be an object."
      );

      return {
        valid: false,
        errors,
        warnings
      };
    }

    if (!routine.id) {
      warnings.push(
        "Routine has no ID."
      );
    }

    if (!routine.name) {
      warnings.push(
        "Routine has no name."
      );
    }

    REQUIRED_ARRAYS.forEach(key => {
      if (!Array.isArray(routine[key])) {
        errors.push(
          `${key} must be an array.`
        );
      }
    });

    if (
      routine.schedule !== undefined &&
      (
        typeof routine.schedule !==
          "object" ||
        Array.isArray(
          routine.schedule
        )
      )
    ) {
      errors.push(
        "Schedule must be an object."
      );
    }

    const periodIds = new Set();

    if (Array.isArray(routine.periods)) {
      routine.periods.forEach(
        (period, index) => {
          if (!period.id) {
            errors.push(
              `Period ${index + 1} has no ID.`
            );
          } else {
            if (
              periodIds.has(
                String(period.id)
              )
            ) {
              errors.push(
                `Duplicate period ID: ${period.id}`
              );
            }

            periodIds.add(
              String(period.id)
            );
          }
        }
      );
    }

    const subjectIds = new Set();

    if (Array.isArray(routine.subjects)) {
      routine.subjects.forEach(
        (subject, index) => {
          if (!subject.id) {
            errors.push(
              `Subject ${index + 1} has no ID.`
            );
          } else {
            if (
              subjectIds.has(
                String(subject.id)
              )
            ) {
              errors.push(
                `Duplicate subject ID: ${subject.id}`
              );
            }

            subjectIds.add(
              String(subject.id)
            );
          }
        }
      );
    }
    const schedule =
      routine.schedule || {};

    DAYS.forEach(day => {
      const entries =
        schedule[day];

      if (
        entries !== undefined &&
        !Array.isArray(entries)
      ) {
        errors.push(
          `Schedule for ${day} must be an array.`
        );

        return;
      }

      if (!Array.isArray(entries)) {
        return;
      }

      entries.forEach(
        (entry, index) => {
          if (!entry || typeof entry !== "object") {
            errors.push(
              `Invalid schedule entry on ${day}, item ${index + 1}.`
            );

            return;
          }

          if (
            entry.periodId !== undefined &&
            !periodIds.has(
              String(entry.periodId)
            )
          ) {
            warnings.push(
              `Unknown period ${entry.periodId} used on ${day}.`
            );
          }

          if (
            entry.subjectId !== undefined &&
            entry.subjectId !== null &&
            entry.subjectId !== "" &&
            !subjectIds.has(
              String(entry.subjectId)
            )
          ) {
            warnings.push(
              `Unknown subject ${entry.subjectId} used on ${day}.`
            );
          }
        }
      );
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  function prepareForExport(
    routine
  ) {
    const normalized =
      normalizeRoutine(routine);

    if (!normalized) {
      return null;
    }

    return {
      schema: "myroutine",
      version: VERSION,
      exportedAt:
        new Date().toISOString(),
      routine: normalized
    };
  }

  function stringify(
    routine,
    pretty = true
  ) {
    const payload =
      prepareForExport(routine);

    if (!payload) {
      throw new Error(
        "Invalid routine."
      );
    }

    return JSON.stringify(
      payload,
      null,
      pretty ? 2 : 0
    );
  }

  function parse(
    input
  ) {
    let data = input;

    if (
      typeof input === "string"
    ) {
      try {
        data = JSON.parse(input);
      } catch (error) {
        throw new Error(
          "The selected file is not valid JSON."
        );
      }
    }

    if (
      !data ||
      typeof data !== "object"
    ) {
      throw new Error(
        "Invalid routine data."
      );
    }

    let routine = data;

    if (
      data.schema === "myroutine" &&
      data.routine
    ) {
      routine = data.routine;
    }

    const normalized =
      normalizeRoutine(routine);

    if (!normalized) {
      throw new Error(
        "Could not read the routine."
      );
    }

    const validation =
      validateRoutine(
        normalized
      );

    if (!validation.valid) {
      throw new Error(
        validation.errors.join("\n")
      );
    }

    return {
      routine: normalized,
      warnings:
        validation.warnings
    };
  }

  function download(
    routine,
    filename
  ) {
    const json =
      stringify(routine, true);

    const blob =
      new Blob(
        [json],
        {
          type:
            "application/json"
        }
      );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;

    link.download =
      filename ||
      `${String(
        routine?.name ||
        "myroutine"
      )
        .trim()
        .replace(
          /[^a-z0-9]+/gi,
          "-"
        )
        .replace(
          /^-+|-+$/g,
          ""
        )
        .toLowerCase() ||
        "myroutine"}.json`;

    document.body.appendChild(
      link
    );

    link.click();

    link.remove();

    URL.revokeObjectURL(
      url
    );
  }

  function readFile(file) {
    return new Promise(
      (resolve, reject) => {
        if (!file) {
          reject(
            new Error(
              "No file selected."
            )
          );

          return;
        }

        const reader =
          new FileReader();

        reader.onload = event => {
          try {
            const result =
              parse(
                event.target.result
              );

            resolve(result);
          } catch (error) {
            reject(error);
          }
        };

        reader.onerror = () => {
          reject(
            new Error(
              "Could not read the file."
            )
          );
        };

        reader.readAsText(file);
      }
    );
  }
  function getAllRoutines() {
    if (
      !window.MyRoutine ||
      !window.MyRoutine.state
    ) {
      return [];
    }

    const data =
      window.MyRoutine.state.data;

    if (
      !data ||
      !Array.isArray(
        data.routines
      )
    ) {
      return [];
    }

    return data.routines;
  }

  function findRoutine(
    id
  ) {
    return getAllRoutines().find(
      routine =>
        String(routine.id) ===
        String(id)
    );
  }

  function addRoutine(
    routine
  ) {
    const normalized =
      normalizeRoutine(routine);

    if (!normalized) {
      return null;
    }

    const routines =
      getAllRoutines();

    let finalId =
      normalized.id;

    while (
      routines.some(
        item =>
          String(item.id) ===
          String(finalId)
      )
    ) {
      finalId =
        makeId("routine");
    }

    normalized.id = finalId;

    routines.push(
      normalized
    );

    if (
      window.MyRoutine.state
        .activeRoutineId ===
      undefined
    ) {
      window.MyRoutine.state.activeRoutineId =
        finalId;
    }

    save();

    return normalized;
  }

  function replaceRoutine(
    routine
  ) {
    const normalized =
      normalizeRoutine(routine);

    if (!normalized) {
      return null;
    }

    const routines =
      getAllRoutines();

    const index =
      routines.findIndex(
        item =>
          String(item.id) ===
          String(normalized.id)
      );

    if (index === -1) {
      return addRoutine(
        normalized
      );
    }

    routines[index] =
      normalized;

    save();

    return normalized;
  }

  function duplicateRoutine(
    id
  ) {
    const source =
      findRoutine(id);

    if (!source) {
      return null;
    }

    const copy =
      clone(source);

    copy.id =
      makeId("routine");

    copy.name =
      `${source.name || "Routine"} Copy`;

    const added =
      addRoutine(copy);

    return added;
  }

  function removeRoutine(
    id
  ) {
    if (
      !window.MyRoutine ||
      !window.MyRoutine.state
    ) {
      return false;
    }

    const routines =
      getAllRoutines();

    const index =
      routines.findIndex(
        item =>
          String(item.id) ===
          String(id)
      );

    if (index === -1) {
      return false;
    }

    routines.splice(
      index,
      1
    );

    if (
      String(
        window.MyRoutine.state
          .activeRoutineId
      ) === String(id)
    ) {
      window.MyRoutine.state
        .activeRoutineId =
        routines[0]?.id || null;
    }

    save();

    return true;
  }

  function exportRoutine(
    id
  ) {
    const routine =
      id
        ? findRoutine(id)
        : getRoutine();

    if (!routine) {
      throw new Error(
        "No routine selected."
      );
    }

    download(
      routine
    );

    return true;
  }

  async function importRoutine(
    file,
    options = {}
  ) {
    const result =
      await readFile(file);

    const imported =
      result.routine;

    const mode =
      options.mode || "copy";

    if (mode === "replace") {
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

      imported.id =
        targetId;

      replaceRoutine(
        imported
      );

      return {
        routine:
          imported,
        warnings:
          result.warnings,
        mode: "replace"
      };
    }

    if (mode === "merge") {
      const target =
        findRoutine(
          options.targetId ||
          currentRoutineId ||
          window.MyRoutine?.state
            ?.activeRoutineId
        );

      if (!target) {
        throw new Error(
          "No target routine selected."
        );
      }

      mergeIntoRoutine(
        target,
        imported
      );

      save();

      return {
        routine: target,
        warnings:
          result.warnings,
        mode: "merge"
      };
    }

    imported.id =
      makeId("routine");

    if (
      !String(
        imported.name
      ).toLowerCase().includes(
        "import"
      )
    ) {
      imported.name =
        `${imported.name} (Imported)`;
    }

    const added =
      addRoutine(
        imported
      );

    return {
      routine: added,
      warnings:
        result.warnings,
      mode: "copy"
    };
  }
  function mergeIntoRoutine(
    target,
    source
  ) {
    if (!target || !source) {
      return false;
    }

    if (
      !Array.isArray(
        target.periods
      )
    ) {
      target.periods = [];
    }

    if (
      !Array.isArray(
        target.subjects
      )
    ) {
      target.subjects = [];
    }

    if (
      !target.schedule ||
      typeof target.schedule !==
        "object"
    ) {
      target.schedule = {};
    }

    DAYS.forEach(day => {
      if (
        !Array.isArray(
          target.schedule[day]
        )
      ) {
        target.schedule[day] = [];
      }
    });

    const periodMap =
      new Map();

    source.periods.forEach(
      period => {
        const copy =
          clone(period);

        const oldId =
          String(
            copy.id
          );

        copy.id =
          makeId("period");

        target.periods.push(
          copy
        );

        periodMap.set(
          oldId,
          copy.id
        );
      }
    );

    const subjectMap =
      new Map();

    source.subjects.forEach(
      subject => {
        const copy =
          clone(subject);

        const oldId =
          String(
            copy.id
          );

        copy.id =
          makeId("subject");

        target.subjects.push(
          copy
        );

        subjectMap.set(
          oldId,
          copy.id
        );
      }
    );

    DAYS.forEach(day => {
      const entries =
        source.schedule?.[day];

      if (
        !Array.isArray(entries)
      ) {
        return;
      }

      entries.forEach(
        entry => {
          const periodId =
            periodMap.get(
              String(
                entry.periodId
              )
            );

          const subjectId =
            entry.subjectId
              ? subjectMap.get(
                  String(
                    entry.subjectId
                  )
                )
              : "";

          if (!periodId) {
            return;
          }

          target.schedule[
            day
          ].push({
            periodId,
            subjectId:
              subjectId || ""
          });
        }
      );
    });

    return true;
  }

  function createBackup() {
    const routines =
      getAllRoutines();

    const payload = {
      schema:
        "myroutine-backup",
      version:
        VERSION,
      exportedAt:
        new Date().toISOString(),
      routines:
        clone(routines)
    };

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

    link.href = url;

    link.download =
      "myroutine-backup.json";

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

  function getVersion() {
    return VERSION;
  }

  window.MyRoutineData = {
    version:
      VERSION,

    getRoutine,
    getAllRoutines,
    findRoutine,

    normalize:
      normalizeRoutine,

    validate:
      validateRoutine,

    stringify,
    parse,

    download,
    readFile,

    addRoutine,
    replaceRoutine,
    duplicateRoutine,
    removeRoutine,

    exportRoutine,
    importRoutine,

    mergeIntoRoutine,

    createBackup,

    getVersion
  };

  window.addEventListener(
    "myroutine:ready",
    function () {
      const routine =
        getRoutine();

      if (routine) {
        normalizeRoutine(
          routine
        );
      }
    }
  );

})();