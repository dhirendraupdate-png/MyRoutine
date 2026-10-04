/* =========================================================
   MyRoutine — Universal Routine Application
   Corrected JSON / Dashboard Foundation
   ========================================================= */

const DATA_URL = "data/routines.json";
const STORAGE_KEY = "myroutine_data";
const DATA_VERSION = 2;

const state = {
  data: null,
  activeRoutineId: null
};

const $ = (id) => document.getElementById(id);


/* =========================================================
   DEFAULT DATA
   ========================================================= */

function createEmptyData() {
  return {
    version: DATA_VERSION,
    app: {
      name: "MyRoutine",
      tagline: "Your routine. Your way."
    },
    routines: []
  };
}


/* =========================================================
   SAFE JSON
   ========================================================= */

function isValidData(data) {
  return !!(
    data &&
    typeof data === "object" &&
    Array.isArray(data.routines)
  );
}


function normalizeData(data) {
  if (!isValidData(data)) {
    return createEmptyData();
  }

  if (!data.app || typeof data.app !== "object") {
    data.app = {
      name: "MyRoutine",
      tagline: "Your routine. Your way."
    };
  }

  data.version = DATA_VERSION;

  data.routines = data.routines
    .filter(Boolean)
    .map(normalizeRoutine);

  return data;
}


function normalizeRoutine(routine) {
  const r = {
    ...routine
  };

  if (!r.id) {
    r.id =
      "routine-" +
      Date.now().toString(36) +
      "-" +
      Math.random().toString(36).slice(2, 7);
  }

  if (!r.name) {
    r.name = "My Routine";
  }

  if (!r.institution) {
    r.institution = {
      type: "Other",
      name: "",
      logo: ""
    };
  }

  if (!r.academic) {
    r.academic = {
      course: "",
      section: "",
      session: ""
    };
  }

  if (!r.settings) {
    r.settings = {};
  }

  if (!r.settings.weekStartsOn) {
    r.settings.weekStartsOn = "Monday";
  }

  if (!Array.isArray(r.settings.workingDays)) {
    r.settings.workingDays = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday"
    ];
  }

  if (!r.customization) {
    r.customization = {};
  }

  if (!r.customization.theme) {
    r.customization.theme = "light";
  }

  if (!r.customization.primaryColor) {
    r.customization.primaryColor = "#2563eb";
  }

  if (!Array.isArray(r.periods)) {
    r.periods = [];
  }

  if (!Array.isArray(r.subjects)) {
    r.subjects = [];
  }

  if (!r.schedule || typeof r.schedule !== "object") {
    r.schedule = {};
  }

  normalizeSchedule(r);

  return r;
}


/* =========================================================
   NORMALIZE SCHEDULE
   ========================================================= */

function normalizeSchedule(routine) {
  const days = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday"
  ];

  days.forEach(day => {
    if (!Array.isArray(routine.schedule[day])) {
      routine.schedule[day] = [];
    }
  });

  const existingPeriods = new Map(
    routine.periods.map(p => [p.id, p])
  );

  const existingSubjects = new Map(
    routine.subjects.map(s => [s.id, s])
  );

  days.forEach(day => {
    routine.schedule[day] = routine.schedule[day]
      .filter(Boolean)
      .map((entry, index) => {

        /*
         * Native MyRoutine format:
         * {
         *   periodId,
         *   subjectId
         * }
         */

        if (entry.periodId && entry.subjectId) {
          return entry;
        }

        /*
         * Support timetable JSON format:
         * {
         *   title,
         *   subject,
         *   code,
         *   start,
         *   end
         * }
         */

        const start = entry.start || "08:00";
        const end = entry.end || "08:45";

        const periodId =
          entry.periodId ||
          `period-${start.replace(":", "")}-${end.replace(":", "")}`;

        if (!existingPeriods.has(periodId)) {
          const period = {
            id: periodId,
            name: entry.title || `Period ${index + 1}`,
            start,
            end,
            type: entry.type || "class"
          };

          routine.periods.push(period);
          existingPeriods.set(periodId, period);
        }

        const subjectName =
          entry.subject ||
          entry.title ||
          (
            Array.isArray(entry.subjects)
              ? entry.subjects.join(" / ")
              : ""
          );

        const subjectCode =
          entry.code ||
          (
            Array.isArray(entry.subjects)
              ? entry.subjects.join(" / ")
              : ""
          );

        if (!subjectName) {
          return {
            periodId,
            subjectId: `special-${periodId}-${day}`
          };
        }

        const subjectKey =
          `${subjectName}|${subjectCode}`;

        let subject = Array.from(
          existingSubjects.values()
        ).find(s =>
          `${s.name}|${s.code || ""}` === subjectKey
        );

        if (!subject) {
          subject = {
            id:
              "subject-" +
              subjectName
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-+|-+$/g, "") +
              "-" +
              Math.random().toString(36).slice(2, 6),

            name: subjectName,
            code: subjectCode,
            teacher: entry.teacher || "",
            room: entry.room || "",
            type:
              entry.type === "practical"
                ? "practical"
                : "theory",
            color:
              routine.customization.primaryColor
          };

          routine.subjects.push(subject);
          existingSubjects.set(subject.id, subject);
        }

        return {
          periodId,
          subjectId: subject.id
        };
      });
  });
}


/* =========================================================
   LOAD ROUTINES
   ========================================================= */

async function loadRoutines() {
  try {
    let loaded = null;

    /*
     * First try localStorage.
     * If it is invalid/empty, fall back to routines.json.
     */
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      try {
        const parsed = JSON.parse(saved);

        if (
  isValidData(parsed) &&
  parsed.routines.length > 0
) {
  loaded = normalizeData(parsed);
        }
      } catch (storageError) {
        console.warn(
          "Stored MyRoutine data was invalid. Loading data file instead.",
          storageError
        );

        localStorage.removeItem(STORAGE_KEY);
      }
    }

    /*
     * If there was no usable saved data,
     * load the repository JSON file.
     */
    if (!loaded) {
      const response = await fetch(
        DATA_URL + "?v=" + Date.now(),
        {
          cache: "no-store"
        }
      );

      if (!response.ok) {
        throw new Error(
          `Unable to load routines.json (${response.status})`
        );
      }

      const json = await response.json();

      loaded = normalizeData(json);

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(loaded)
      );
    }

    state.data = loaded;

    state.activeRoutineId =
      state.data.routines[0]?.id || null;

    saveRoutines();
    renderApp();

  } catch (error) {
    console.error(
      "MyRoutine loading error:",
      error
    );

    showError(
      "Unable to load your routines. Please check the data file."
    );
  }
}


/* =========================================================
   SAVE
   ========================================================= */

function saveRoutines() {
  if (!state.data) {
    return;
  }

  state.data = normalizeData(state.data);

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(state.data)
  );
}


/* =========================================================
   GET ACTIVE ROUTINE
   ========================================================= */

function getActiveRoutine() {
  if (!state.data?.routines) {
    return null;
  }

  return (
    state.data.routines.find(
      routine =>
        routine.id === state.activeRoutineId
    ) || null
  );
            }
/* =========================================================
   CREATE ROUTINE
   ========================================================= */

function createRoutine(profile = {}) {

  const id =
    "routine-" +
    Date.now().toString(36) +
    "-" +
    Math.random().toString(36).slice(2, 7);

  const routine = {
    id,

    name:
      profile.name ||
      "My Routine",

    institution: {
      type:
        profile.institutionType ||
        "Other",

      name:
        profile.institutionName ||
        "My Institution",

      logo: ""
    },

    academic: {
      course:
        profile.course ||
        "",

      section:
        profile.section ||
        "",

      session:
        profile.session ||
        ""
    },

    settings: {
      weekStartsOn:
        profile.weekStart ||
        "Monday",

      timeFormat:
        "12-hour",

      workingDays: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday"
      ]
    },

    periods: [],
    subjects: [],
    schedule: {},

    customization: {
      theme: "light",
      primaryColor: "#2563eb",
      showTeacher: true,
      showRoom: true,
      showCurrentClass: true,
      showNextClass: true,
      showSubjectLegend: true
    }
  };

  if (!state.data) {
    state.data = createEmptyData();
  }

  if (!Array.isArray(state.data.routines)) {
    state.data.routines = [];
  }

  state.data.routines.push(routine);

  state.activeRoutineId = id;

  saveRoutines();
  renderApp();

  return routine;
}


/* =========================================================
   DELETE ROUTINE
   ========================================================= */

function deleteRoutine(id) {

  if (!state.data?.routines) {
    return;
  }

  state.data.routines =
    state.data.routines.filter(
      routine => routine.id !== id
    );

  if (state.activeRoutineId === id) {
    state.activeRoutineId =
      state.data.routines[0]?.id || null;
  }

  saveRoutines();
  renderApp();
}


/* =========================================================
   DUPLICATE ROUTINE
   ========================================================= */

function duplicateRoutine(id) {

  const original =
    state.data?.routines?.find(
      routine => routine.id === id
    );

  if (!original) {
    return null;
  }

  const copy =
    JSON.parse(
      JSON.stringify(original)
    );

  copy.id =
    "routine-" +
    Date.now().toString(36) +
    "-" +
    Math.random().toString(36).slice(2, 6);

  copy.name =
    `${original.name} Copy`;

  state.data.routines.push(copy);

  state.activeRoutineId = copy.id;

  saveRoutines();
  renderApp();

  return copy;
}


/* =========================================================
   ADD PERIOD
   ========================================================= */

function addPeriod(
  routine,
  period = {}
) {

  if (!routine) {
    return;
  }

  if (!Array.isArray(routine.periods)) {
    routine.periods = [];
  }

  const newPeriod = {
    id:
      period.id ||
      "period-" +
      Date.now().toString(36),

    name:
      period.name ||
      `Period ${routine.periods.length + 1}`,

    start:
      period.start ||
      "08:00",

    end:
      period.end ||
      "08:45",

    type:
      period.type ||
      "class"
  };

  routine.periods.push(newPeriod);

  saveRoutines();

  return newPeriod;
}


/* =========================================================
   REMOVE PERIOD
   ========================================================= */

function removePeriod(
  routine,
  periodId
) {

  if (!routine) {
    return;
  }

  routine.periods =
    (routine.periods || []).filter(
      period =>
        period.id !== periodId
    );

  Object.keys(
    routine.schedule || {}
  ).forEach(day => {

    routine.schedule[day] =
      (
        routine.schedule[day] || []
      ).filter(
        entry =>
          entry.periodId !== periodId
      );
  });

  saveRoutines();
}


/* =========================================================
   ADD SUBJECT
   ========================================================= */

function addSubject(
  routine,
  subject = {}
) {

  if (!routine) {
    return;
  }

  if (!Array.isArray(routine.subjects)) {
    routine.subjects = [];
  }

  const newSubject = {
    id:
      subject.id ||
      "subject-" +
      Date.now().toString(36),

    name:
      subject.name ||
      "New Subject",

    code:
      subject.code ||
      "",

    teacher:
      subject.teacher ||
      "",

    room:
      subject.room ||
      "",

    type:
      subject.type ||
      "theory",

    color:
      subject.color ||
      routine.customization?.primaryColor ||
      "#2563eb"
  };

  routine.subjects.push(newSubject);

  saveRoutines();

  return newSubject;
}


/* =========================================================
   REMOVE SUBJECT
   ========================================================= */

function removeSubject(
  routine,
  subjectId
) {

  if (!routine) {
    return;
  }

  routine.subjects =
    (routine.subjects || []).filter(
      subject =>
        subject.id !== subjectId
    );

  Object.keys(
    routine.schedule || {}
  ).forEach(day => {

    routine.schedule[day] =
      (
        routine.schedule[day] || []
      ).filter(
        entry =>
          entry.subjectId !== subjectId
      );
  });

  saveRoutines();
}


/* =========================================================
   SET CLASS
   ========================================================= */

function setClass(
  routine,
  day,
  periodId,
  subjectId
) {

  if (!routine) {
    return;
  }

  if (!routine.schedule) {
    routine.schedule = {};
  }

  if (!routine.schedule[day]) {
    routine.schedule[day] = [];
  }

  routine.schedule[day] =
    routine.schedule[day].filter(
      entry =>
        entry.periodId !== periodId
    );

  if (subjectId) {
    routine.schedule[day].push({
      periodId,
      subjectId
    });
  }

  saveRoutines();
}
/* =========================================================
   EXPORT ROUTINE
   ========================================================= */

function exportRoutine(routineId) {

  const routine =
    state.data?.routines?.find(
      r => r.id === routineId
    );

  if (!routine) {
    showToast("No routine selected.");
    return false;
  }

  const exportData = {
    version: DATA_VERSION,

    app: {
      name: "MyRoutine",
      tagline: "Your routine. Your way."
    },

    routines: [
      normalizeRoutine(
        JSON.parse(
          JSON.stringify(routine)
        )
      )
    ]
  };

  const blob = new Blob(
    [
      JSON.stringify(
        exportData,
        null,
        2
      )
    ],
    {
      type: "application/json"
    }
  );

  const url =
    URL.createObjectURL(blob);

  const anchor =
    document.createElement("a");

  anchor.href = url;

  anchor.download =
    `${slugify(
      routine.name ||
      "my-routine"
    )}.json`;

  document.body.appendChild(anchor);

  anchor.click();

  anchor.remove();

  setTimeout(
    () => URL.revokeObjectURL(url),
    1000
  );

  showToast("Routine JSON exported successfully.");

  return true;
}


/* =========================================================
   IMPORT ROUTINE
   ========================================================= */

function importRoutineFile(file) {

  return new Promise(
    (resolve, reject) => {

      if (!file) {
        reject(
          new Error("No JSON file selected.")
        );
        return;
      }

      const reader =
        new FileReader();

      reader.onload = () => {

        try {

          const imported =
            JSON.parse(
              reader.result
            );

          let routines = [];

          /*
           * Accept:
           *
           * 1. Full MyRoutine file
           * 2. Single routine object
           */

          if (
            imported &&
            Array.isArray(
              imported.routines
            )
          ) {
            routines =
              imported.routines;
          } else if (
            imported &&
            imported.id
          ) {
            routines = [imported];
          } else {
            throw new Error(
              "Invalid MyRoutine JSON format."
            );
          }

          if (!routines.length) {
            throw new Error(
              "The JSON file contains no routines."
            );
          }

          if (!state.data) {
            state.data =
              createEmptyData();
          }

          if (
            !Array.isArray(
              state.data.routines
            )
          ) {
            state.data.routines = [];
          }

          let firstImported = null;

          routines.forEach(
            originalRoutine => {

              const routine =
                normalizeRoutine(
                  JSON.parse(
                    JSON.stringify(
                      originalRoutine
                    )
                  )
                );

              if (!routine.id) {
                routine.id =
                  "imported-" +
                  Date.now().toString(36) +
                  "-" +
                  Math.random()
                    .toString(36)
                    .slice(2, 7);
              }

              /*
               * Avoid overwriting an existing
               * routine with the same ID.
               */

              const exists =
                state.data.routines.find(
                  r =>
                    r.id === routine.id
                );

              if (exists) {

                routine.id =
                  routine.id +
                  "-imported-" +
                  Date.now()
                    .toString(36);
              }

              state.data.routines.push(
                routine
              );

              if (!firstImported) {
                firstImported = routine;
              }
            }
          );

          state.activeRoutineId =
            firstImported.id;

          saveRoutines();

          renderApp();

          showToast(
            routines.length === 1
              ? "JSON routine imported successfully."
              : `${routines.length} routines imported successfully.`
          );

          resolve(firstImported);

        } catch (error) {

          console.error(
            "JSON import failed:",
            error
          );

          showToast(
            error.message ||
            "Invalid JSON file."
          );

          reject(error);
        }
      };

      reader.onerror = () => {

        const error =
          reader.error ||
          new Error(
            "Unable to read the JSON file."
          );

        showToast(error.message);

        reject(error);
      };

      reader.readAsText(file);
    }
  );
}


/* =========================================================
   JSON FILE PICKER
   ========================================================= */

function openJsonImporter() {

  let input =
    document.getElementById(
      "myroutine-json-input"
    );

  if (!input) {

    input =
      document.createElement(
        "input"
      );

    input.type = "file";

    input.id =
      "myroutine-json-input";

    input.accept =
      ".json,application/json";

    input.style.display =
      "none";

    document.body.appendChild(
      input
    );

    input.addEventListener(
      "change",
      async event => {

        const file =
          event.target.files?.[0];

        if (!file) {
          return;
        }

        try {
          await importRoutineFile(
            file
          );
        } catch (error) {
          console.error(error);
        }

        /*
         * Allows selecting the same
         * file again later.
         */
        input.value = "";
      }
    );
  }

  input.click();
}


/* =========================================================
   JSON BUTTON CONNECTOR
   ========================================================= */

function connectJsonButtons() {

  /*
   * Explicit IDs supported.
   */

  const importIds = [
    "import-json",
    "importJson",
    "json-import",
    "import-routine",
    "importRoutine",
    "routine-import"
  ];

  const exportIds = [
    "export-json",
    "exportJson",
    "json-export",
    "export-routine",
    "exportRoutine",
    "routine-export"
  ];

  importIds.forEach(id => {

    const element = $(id);

    if (!element) {
      return;
    }

    if (
      element.dataset.myroutineBound
    ) {
      return;
    }

    element.dataset.myroutineBound =
      "true";

    element.addEventListener(
      "click",
      event => {

        event.preventDefault();

        openJsonImporter();
      }
    );
  });

  exportIds.forEach(id => {

    const element = $(id);

    if (!element) {
      return;
    }

    if (
      element.dataset.myroutineBound
    ) {
      return;
    }

    element.dataset.myroutineBound =
      "true";

    element.addEventListener(
      "click",
      event => {

        event.preventDefault();

        const routine =
          getActiveRoutine();

        if (routine) {
          exportRoutine(
            routine.id
          );
        } else {
          showToast(
            "No routine available to export."
          );
        }
      }
    );
  });


  /*
   * Also support buttons using:
   *
   * data-action="import-json"
   * data-action="export-json"
   */

  document.addEventListener(
    "click",
    event => {

      const button =
        event.target.closest(
          "[data-action]"
        );

      if (!button) {
        return;
      }

      const action =
        String(
          button.dataset.action
        ).toLowerCase();

      if (
        action === "import-json" ||
        action === "import-json-routine" ||
        action === "import"
      ) {

        event.preventDefault();

        openJsonImporter();

        return;
      }

      if (
        action === "export-json" ||
        action === "export-json-routine" ||
        action === "export"
      ) {

        event.preventDefault();

        const routine =
          getActiveRoutine();

        if (routine) {
          exportRoutine(
            routine.id
          );
        } else {
          showToast(
            "No routine available to export."
          );
        }
      }
    }
  );
}


/* =========================================================
   TOAST
   ========================================================= */

function showToast(message) {

  let toast =
    document.getElementById(
      "myroutine-toast"
    );

  if (!toast) {

    toast =
      document.createElement(
        "div"
      );

    toast.id =
      "myroutine-toast";

    toast.style.position =
      "fixed";

    toast.style.left = "50%";

    toast.style.bottom = "24px";

    toast.style.transform =
      "translateX(-50%)";

    toast.style.zIndex = "99999";

    toast.style.padding =
      "12px 18px";

    toast.style.borderRadius =
      "12px";

    toast.style.background =
      "#111827";

    toast.style.color =
      "#ffffff";

    toast.style.fontFamily =
      "system-ui,sans-serif";

    toast.style.fontSize =
      "14px";

    toast.style.boxShadow =
      "0 10px 30px rgba(0,0,0,.2)";

    toast.style.maxWidth =
      "calc(100vw - 40px)";

    toast.style.textAlign =
      "center";

    document.body.appendChild(
      toast
    );
  }

  toast.textContent =
    message;

  toast.style.display =
    "block";

  clearTimeout(
    toast._timer
  );

  toast._timer =
    setTimeout(
      () => {
        toast.style.display =
          "none";
      },
      3000
    );
}
/* =========================================================
   SLUGIFY
   ========================================================= */

function slugify(value) {

  return String(value)

    .toLowerCase()

    .trim()

    .replace(
      /[^a-z0-9]+/g,
      "-"
    )

    .replace(
      /^-+|-+$/g,
      ""
    )

    || "routine";
}


/* =========================================================
   HTML ESCAPE
   ========================================================= */

function escapeHtml(value) {

  return String(
    value ?? ""
  )

    .replaceAll(
      "&",
      "&amp;"
    )

    .replaceAll(
      "<",
      "&lt;"
    )

    .replaceAll(
      ">",
      "&gt;"
    )

    .replaceAll(
      '"',
      "&quot;"
    )

    .replaceAll(
      "'",
      "&#039;"
    );
}


/* =========================================================
   ERROR SCREEN
   ========================================================= */

function showError(message) {

  document.body.innerHTML = `

    <main style="
      min-height:100vh;
      display:grid;
      place-items:center;
      padding:24px;
      font-family:system-ui,sans-serif;
      background:#f5f7fb;
    ">

      <section style="
        width:min(520px,100%);
        padding:28px;
        background:white;
        border:1px solid #e5e7eb;
        border-radius:18px;
        box-shadow:
          0 12px 35px
          rgba(0,0,0,.08);
      ">

        <h1 style="
          margin:0 0 10px;
        ">
          MyRoutine
        </h1>

        <p style="
          margin:0;
          color:#6b7280;
          line-height:1.6;
        ">
          ${escapeHtml(message)}
        </p>

      </section>

    </main>

  `;
}


/* =========================================================
   APPLICATION READY
   ========================================================= */

function renderApp() {

  /*
   * Keep the public API compatible
   * with the existing dashboard.
   */

  window.MyRoutine = {

    state,

    getActiveRoutine,

    createRoutine,

    deleteRoutine,

    duplicateRoutine,

    addPeriod,

    removePeriod,

    addSubject,

    removeSubject,

    setClass,

    exportRoutine,

    importRoutineFile,

    openJsonImporter,

    saveRoutines,

    loadRoutines,

    normalizeData,

    normalizeRoutine
  };


  /*
   * Connect JSON controls after
   * the application is ready.
   */

  connectJsonButtons();


  /*
   * Tell the existing UI that
   * MyRoutine is ready.
   */

  document.dispatchEvent(
    new CustomEvent(
      "myroutine:ready",
      {
        detail: {
          data: state.data,

          activeRoutine:
            getActiveRoutine()
        }
      }
    )
  );
}


/* =========================================================
   GLOBAL JSON API
   ========================================================= */

window.MyRoutineJSON = {

  importFile:
    importRoutineFile,

  openImporter:
    openJsonImporter,

  exportActive:
    () => {

      const routine =
        getActiveRoutine();

      if (!routine) {
        showToast(
          "No routine available to export."
        );

        return false;
      }

      return exportRoutine(
        routine.id
      );
    }
};


/* =========================================================
   START APPLICATION
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    /*
     * Register button listeners as
     * early as possible.
     */

    connectJsonButtons();

    loadRoutines();
  }
);


/* =========================================================
   ALSO HANDLE DYNAMIC UI
   ========================================================= */

document.addEventListener(
  "myroutine:ready",
  () => {
    connectJsonButtons();
  }
);
