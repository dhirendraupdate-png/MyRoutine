/* MyRoutine — Universal Routine Application Foundation */

const DATA_URL = "data/routines.json";
const STORAGE_KEY = "myroutine_data";

const state = {
  data: null,
  activeRoutineId: null
};

const $ = (id) => document.getElementById(id);


/* =========================================================
   LOAD ROUTINES
   ========================================================= */

async function loadRoutines() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      state.data = JSON.parse(saved);
    } else {
      const response = await fetch(DATA_URL, {
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error("Unable to load routines.json");
      }

      state.data = await response.json();

      saveRoutines();
    }

    state.activeRoutineId =
      state.data?.routines?.[0]?.id || null;

    renderApp();

  } catch (error) {
    console.error(error);

    showError(
      "Unable to load your routines. Please check the data file."
    );
  }
}


/* =========================================================
   SAVE
   ========================================================= */

function saveRoutines() {
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

  return state.data.routines.find(
    routine =>
      routine.id === state.activeRoutineId
  ) || null;
}


/* =========================================================
   CREATE ROUTINE
   ========================================================= */

function createRoutine(profile = {}) {

  const id =
    "routine-" +
    Date.now().toString(36) +
    "-" +
    Math.random()
      .toString(36)
      .slice(2, 7);

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
        "Friday"
      ]
    },

    periods: [],

    subjects: [],

    schedule: {},

    customization: {

      theme: "light",

      primaryColor:
        "#2563eb",

      showTeacher:
        true,

      showRoom:
        true,

      showCurrentClass:
        true,

      showNextClass:
        true,

      showSubjectLegend:
        true
    }
  };


  if (!state.data) {
    state.data = {
      version: 1,
      app: {
        name: "MyRoutine",
        tagline: "Your routine. Your way."
      },
      routines: []
    };
  }


  if (!Array.isArray(state.data.routines)) {
    state.data.routines = [];
  }


  state.data.routines.push(routine);

  state.activeRoutineId = id;

  saveRoutines();

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


  if (
    state.activeRoutineId === id
  ) {

    state.activeRoutineId =
      state.data.routines[0]?.id ||
      null;
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
    Date.now().toString(36);


  copy.name =
    `${original.name} Copy`;


  state.data.routines.push(copy);

  state.activeRoutineId =
    copy.id;


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


  routine.periods.push({

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
  });


  saveRoutines();
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


  routine.subjects.push({

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
  });


  saveRoutines();
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
    return;
  }


  const blob =
    new Blob(
      [
        JSON.stringify(
          routine,
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


  URL.revokeObjectURL(url);
}


/* =========================================================
   IMPORT ROUTINE
   ========================================================= */

function importRoutineFile(file) {

  return new Promise(
    (resolve, reject) => {

      const reader =
        new FileReader();


      reader.onload =
        () => {

          try {

            const imported =
              JSON.parse(
                reader.result
              );


            const routine =
              imported.routines
                ? imported.routines[0]
                : imported;


            if (
              !routine ||
              !routine.id
            ) {

              throw new Error(
                "Invalid routine format"
              );

            }


            if (
              !state.data
            ) {

              state.data = {
                version: 1,
                app: {
                  name:
                    "MyRoutine",

                  tagline:
                    "Your routine. Your way."
                },
                routines: []
              };

            }


            if (
              !Array.isArray(
                state.data.routines
              )
            ) {

              state.data.routines = [];

            }


            const exists =
              state.data.routines.find(
                r =>
                  r.id ===
                  routine.id
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


            state.activeRoutineId =
              routine.id;


            saveRoutines();

            renderApp();


            resolve(
              routine
            );

          } catch (error) {

            reject(error);

          }

        };


      reader.onerror =
        () => reject(
          reader.error
        );


      reader.readAsText(
        file
      );

    }
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

    ) || "routine";
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
        max-width:520px;
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
        ">
          ${escapeHtml(message)}
        </p>

      </section>

    </main>

  `;
}


/* =========================================================
   APPLICATION READY EVENT
   ========================================================= */

function renderApp() {

  /*
    The visual interface will be connected
    to these functions in the next files.
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

    saveRoutines

  };


  document.dispatchEvent(

    new CustomEvent(
      "myroutine:ready",
      {
        detail: {

          data:
            state.data,

          activeRoutine:
            getActiveRoutine()

        }
      }
    )

  );

}


/* =========================================================
   START APPLICATION
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  loadRoutines
);
