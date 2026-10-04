/* =========================================================
   MyRoutine — Universal Routine Templates
   File: routine-templates.js
   ========================================================= */

(function () {
  "use strict";

  const VERSION = "1.0.0";

  const TEMPLATE_TYPES = {
    SCHOOL: "school",
    COLLEGE: "college",
    UNIVERSITY: "university",
    COACHING: "coaching",
    PERSONAL: "personal",
    WORK: "work",
    CUSTOM: "custom"
  };

  const TEMPLATE_PRESETS = {
    school: {
      label: "School",
      icon: "🏫",
      description: "Classes, periods, teachers and school activities.",
      defaults: {
        workingDays: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday"
        ],
        periodDuration: 45,
        breakDuration: 10
      }
    },

    college: {
      label: "College",
      icon: "🎓",
      description: "College timetable with subjects, rooms and faculty.",
      defaults: {
        workingDays: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday"
        ],
        periodDuration: 60,
        breakDuration: 10
      }
    },

    university: {
      label: "University",
      icon: "🏛️",
      description: "Flexible university timetable for departments and semesters.",
      defaults: {
        workingDays: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday"
        ],
        periodDuration: 60,
        breakDuration: 15
      }
    },

    coaching: {
      label: "Coaching",
      icon: "📚",
      description: "Coaching, tuition and competitive-exam schedules.",
      defaults: {
        workingDays: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday"
        ],
        periodDuration: 90,
        breakDuration: 15
      }
    },

    personal: {
      label: "Personal",
      icon: "🗓️",
      description: "Build your own completely custom routine.",
      defaults: {
        workingDays: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday"
        ],
        periodDuration: 60,
        breakDuration: 15
      }
    },

    work: {
      label: "Work",
      icon: "💼",
      description: "Work schedules, shifts and meetings.",
      defaults: {
        workingDays: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday"
        ],
        periodDuration: 60,
        breakDuration: 15
      }
    },

    custom: {
      label: "Custom",
      icon: "⚙️",
      description: "Start with a completely blank routine.",
      defaults: {
        workingDays: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday"
        ],
        periodDuration: 50,
        breakDuration: 10
      }
    }
  };

  /* ---------------------------------------------------------
     Helpers
     --------------------------------------------------------- */

  function clone(value) {
    return JSON.parse(
      JSON.stringify(value)
    );
  }

  function generateId(prefix) {
    return (
      prefix +
      "_" +
      Date.now().toString(36) +
      "_" +
      Math.random()
        .toString(36)
        .slice(2, 8)
    );
  }

  function normalizeType(type) {
    const value =
      String(type || "custom")
        .toLowerCase()
        .trim();

    return TEMPLATE_PRESETS[value]
      ? value
      : TEMPLATE_TYPES.CUSTOM;
  }

  /* ---------------------------------------------------------
     Create template configuration
     --------------------------------------------------------- */

  function getPreset(type) {
    const normalized =
      normalizeType(type);

    return clone(
      TEMPLATE_PRESETS[normalized]
    );
  }

  function getAllPresets() {
    return Object.keys(
      TEMPLATE_PRESETS
    ).map(type => ({
      type,
      ...clone(
        TEMPLATE_PRESETS[type]
      )
    }));
  }

  function createTemplate(type, options) {
    options = options || {};

    const normalized =
      normalizeType(type);

    const preset =
      TEMPLATE_PRESETS[normalized];

    const defaults =
      clone(preset.defaults);

    return {
      id: generateId("template"),

      type: normalized,

      name:
        options.name ||
        preset.label +
          " Routine",

      institutionType:
        options.institutionType ||
        preset.label,

      institutionName:
        options.institutionName ||
        "",

      course:
        options.course ||
        "",

      section:
        options.section ||
        "",

      session:
        options.session ||
        "",

      settings: {
        weekStart: "Monday",

        timeFormat: "12",

        workingDays:
          options.workingDays ||
          defaults.workingDays,

        defaultPeriodDuration:
          options.periodDuration ||
          defaults.periodDuration,

        breakDuration:
          options.breakDuration ||
          defaults.breakDuration
      },

      periods: [],

      subjects: [],

      schedule: {},

      calendar: {
        events: []
      },

      metadata: {
        createdAt:
          new Date().toISOString(),

        updatedAt:
          new Date().toISOString(),

        templateVersion:
          VERSION
      }
    };
  }

  /* ---------------------------------------------------------
     Template metadata
     --------------------------------------------------------- */

  function getTemplateLabel(type) {
    const normalized =
      normalizeType(type);

    return TEMPLATE_PRESETS[
      normalized
    ].label;
  }

  function getTemplateIcon(type) {
    const normalized =
      normalizeType(type);

    return TEMPLATE_PRESETS[
      normalized
    ].icon;
  }

  function getTemplateDescription(type) {
    const normalized =
      normalizeType(type);

    return TEMPLATE_PRESETS[
      normalized
    ].description;
  }

  /* ---------------------------------------------------------
     Public API
     --------------------------------------------------------- */

  window.MyRoutineTemplates = {
    VERSION,

    TEMPLATE_TYPES,

    TEMPLATE_PRESETS,

    getPreset,

    getAllPresets,

    createTemplate,

    getTemplateLabel,

    getTemplateIcon,

    getTemplateDescription
  };

  console.log(
    "MyRoutine Templates loaded — v" +
    VERSION
  );

})();
/* =========================================================
   Template Builder & Routine Conversion
   ========================================================= */

(function () {
  "use strict";

  const templates =
    window.MyRoutineTemplates;

  if (!templates) return;

  /* ---------------------------------------------------------
     Helpers
     --------------------------------------------------------- */

  function clone(value) {
    return JSON.parse(
      JSON.stringify(value)
    );
  }

  function generateId(prefix) {
    return (
      prefix +
      "_" +
      Date.now().toString(36) +
      "_" +
      Math.random()
        .toString(36)
        .slice(2, 8)
    );
  }

  function getPreset(type) {
    return templates.getPreset(type);
  }

  /* ---------------------------------------------------------
     Period generation
     --------------------------------------------------------- */

  function createPeriods(options) {
    options = options || {};

    const count =
      Number(options.count) || 6;

    const startTime =
      options.startTime || "08:00";

    const duration =
      Number(options.duration) || 50;

    const breakDuration =
      Number(options.breakDuration) || 10;

    const periods = [];

    let currentMinutes =
      timeToMinutes(startTime);

    for (let i = 1; i <= count; i++) {
      const start =
        minutesToTime(currentMinutes);

      const end =
        minutesToTime(
          currentMinutes + duration
        );

      periods.push({
        id: generateId("period"),

        name:
          options.prefix
            ? `${options.prefix} ${i}`
            : `Period ${i}`,

        startTime: start,

        endTime: end,

        type: "class",

        order: i
      });

      currentMinutes +=
        duration +
        breakDuration;
    }

    return periods;
  }

  function timeToMinutes(value) {
    const match =
      String(value || "")
        .match(/^(\d{1,2}):(\d{2})$/);

    if (!match) {
      return 0;
    }

    return (
      Number(match[1]) * 60 +
      Number(match[2])
    );
  }

  function minutesToTime(minutes) {
    minutes =
      Math.max(0, Number(minutes));

    const hours =
      Math.floor(minutes / 60);

    const mins =
      minutes % 60;

    return (
      String(hours).padStart(2, "0") +
      ":" +
      String(mins).padStart(2, "0")
    );
  }

  /* ---------------------------------------------------------
     Subject generation
     --------------------------------------------------------- */

  function createSubjects(subjects) {
    if (!Array.isArray(subjects)) {
      return [];
    }

    return subjects.map(
      (subject, index) => ({
        id:
          subject.id ||
          generateId("subject"),

        name:
          subject.name ||
          subject.title ||
          `Subject ${index + 1}`,

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
          "subject",

        color:
          subject.color ||
          "",

        order:
          index + 1
      })
    );
  }

  /* ---------------------------------------------------------
     Empty weekly schedule
     --------------------------------------------------------- */

  function createEmptySchedule(
    workingDays,
    periods
  ) {
    const schedule = {};

    (workingDays || [])
      .forEach(day => {
        schedule[day] = {};

        (periods || [])
          .forEach(period => {
            schedule[day][period.id] = null;
          });
      });

    return schedule;
  }

  /* ---------------------------------------------------------
     Build routine from template
     --------------------------------------------------------- */

  function buildRoutine(type, options) {
    options = options || {};

    const template =
      templates.createTemplate(
        type,
        options
      );

    const preset =
      getPreset(type);

    const periodCount =
      Number(
        options.periodCount ||
        6
      );

    const periods =
      options.periods
        ? clone(options.periods)
        : createPeriods({
            count: periodCount,

            startTime:
              options.startTime ||
              "08:00",

            duration:
              options.periodDuration ||
              preset.defaults
                .periodDuration,

            breakDuration:
              options.breakDuration ||
              preset.defaults
                .breakDuration,

            prefix:
              options.periodPrefix ||
              "Period"
          });

    const subjects =
      createSubjects(
        options.subjects || []
      );

    template.periods =
      periods;

    template.subjects =
      subjects;

    template.schedule =
      createEmptySchedule(
        template.settings
          .workingDays,

        periods
      );

    if (options.schedule) {
      template.schedule =
        clone(options.schedule);
    }

    if (options.calendar) {
      template.calendar =
        clone(options.calendar);
    }

    template.metadata.updatedAt =
      new Date().toISOString();

    return template;
  }

  /* ---------------------------------------------------------
     Clone existing routine as template
     --------------------------------------------------------- */

  function routineToTemplate(
    routine,
    name
  ) {
    if (!routine) {
      return null;
    }

    const copy =
      clone(routine);

    copy.id =
      generateId("template");

    copy.name =
      name ||
      `${routine.name || "Routine"} Template`;

    if (!copy.metadata) {
      copy.metadata = {};
    }

    copy.metadata.createdAt =
      new Date().toISOString();

    copy.metadata.updatedAt =
      new Date().toISOString();

    copy.metadata.templateVersion =
      templates.VERSION;

    copy.metadata.isTemplate =
      true;

    return copy;
  }

  /* ---------------------------------------------------------
     Apply template to an existing routine
     --------------------------------------------------------- */

  function applyTemplate(
    routine,
    template,
    options
  ) {
    if (!routine || !template) {
      return null;
    }

    options = options || {};

    const preserveIdentity =
      options.preserveIdentity !== false;

    const originalId =
      routine.id;

    const originalName =
      routine.name;

    const result =
      clone(template);

    if (preserveIdentity) {
      result.id =
        originalId;

      result.name =
        options.name ||
        originalName;
    }

    result.metadata =
      result.metadata || {};

    result.metadata.updatedAt =
      new Date().toISOString();

    Object.keys(routine)
      .forEach(key => {
        if (
          key !== "id" &&
          key !== "name" &&
          !Object.prototype.hasOwnProperty
            .call(result, key)
        ) {
          result[key] =
            clone(routine[key]);
        }
      });

    return result;
  }

  /* ---------------------------------------------------------
     Preset-specific builders
     --------------------------------------------------------- */

  function createSchoolRoutine(options) {
    return buildRoutine(
      "school",
      options
    );
  }

  function createCollegeRoutine(options) {
    return buildRoutine(
      "college",
      options
    );
  }

  function createUniversityRoutine(options) {
    return buildRoutine(
      "university",
      options
    );
  }

  function createCoachingRoutine(options) {
    return buildRoutine(
      "coaching",
      options
    );
  }

  function createPersonalRoutine(options) {
    return buildRoutine(
      "personal",
      options
    );
  }

  function createWorkRoutine(options) {
    return buildRoutine(
      "work",
      options
    );
  }

  function createCustomRoutine(options) {
    return buildRoutine(
      "custom",
      options
    );
  }

  /* ---------------------------------------------------------
     Public API
     --------------------------------------------------------- */

  templates.createPeriods =
    createPeriods;

  templates.createSubjects =
    createSubjects;

  templates.createEmptySchedule =
    createEmptySchedule;

  templates.buildRoutine =
    buildRoutine;

  templates.routineToTemplate =
    routineToTemplate;

  templates.applyTemplate =
    applyTemplate;

  templates.createSchoolRoutine =
    createSchoolRoutine;

  templates.createCollegeRoutine =
    createCollegeRoutine;

  templates.createUniversityRoutine =
    createUniversityRoutine;

  templates.createCoachingRoutine =
    createCoachingRoutine;

  templates.createPersonalRoutine =
    createPersonalRoutine;

  templates.createWorkRoutine =
    createWorkRoutine;

  templates.createCustomRoutine =
    createCustomRoutine;

})();
/* =========================================================
   Template Manager + Preset UI
   ========================================================= */

(function () {
  "use strict";

  const templates =
    window.MyRoutineTemplates;

  if (!templates) return;

  let overlay = null;

  /* ---------------------------------------------------------
     Helpers
     --------------------------------------------------------- */

  function escapeHTML(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function injectStyles() {
    if (
      document.getElementById(
        "myroutine-template-styles"
      )
    ) {
      return;
    }

    const style =
      document.createElement("style");

    style.id =
      "myroutine-template-styles";

    style.textContent = `
      .mr-template-overlay {
        position: fixed;
        inset: 0;
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
        background: rgba(0,0,0,.55);
        backdrop-filter: blur(8px);
      }

      .mr-template-modal {
        width: min(900px, 100%);
        max-height: 92vh;
        overflow: auto;
        border-radius: 24px;
        background: #fff;
        color: #111827;
        box-shadow:
          0 25px 80px rgba(0,0,0,.25);
      }

      .mr-template-header {
        padding: 20px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 15px;
        border-bottom:
          1px solid rgba(127,127,127,.16);
      }

      .mr-template-header h2 {
        margin: 0;
        font-size: 21px;
      }

      .mr-template-header p {
        margin: 5px 0 0;
        font-size: 12px;
        opacity: .6;
      }

      .mr-template-close {
        width: 40px;
        height: 40px;
        border: 0;
        border-radius: 11px;
        background: rgba(127,127,127,.10);
        color: inherit;
        font-size: 23px;
        cursor: pointer;
      }

      .mr-template-content {
        padding: 20px;
      }

      .mr-template-grid {
        display: grid;
        grid-template-columns:
          repeat(2, minmax(0, 1fr));
        gap: 12px;
      }

      .mr-template-card {
        padding: 18px;
        border:
          1px solid rgba(127,127,127,.17);
        border-radius: 17px;
        background: transparent;
        color: inherit;
        text-align: left;
        cursor: pointer;
        transition: .18s ease;
      }

      .mr-template-card:hover {
        transform: translateY(-2px);
        background: rgba(127,127,127,.06);
      }

      .mr-template-card.selected {
        border:
          2px solid currentColor;
        background:
          rgba(80,120,255,.08);
      }

      .mr-template-icon {
        font-size: 28px;
        margin-bottom: 10px;
      }

      .mr-template-card strong {
        display: block;
        font-size: 15px;
      }

      .mr-template-card span {
        display: block;
        margin-top: 5px;
        font-size: 12px;
        line-height: 1.45;
        opacity: .65;
      }

      .mr-template-form {
        margin-top: 22px;
        padding-top: 20px;
        border-top:
          1px solid rgba(127,127,127,.14);
      }

      .mr-template-form h3 {
        margin: 0 0 14px;
        font-size: 15px;
      }

      .mr-template-fields {
        display: grid;
        grid-template-columns:
          repeat(2, minmax(0, 1fr));
        gap: 12px;
      }

      .mr-template-field {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .mr-template-field.full {
        grid-column: 1 / -1;
      }

      .mr-template-field label {
        font-size: 11px;
        font-weight: 700;
        opacity: .65;
      }

      .mr-template-field input,
      .mr-template-field select {
        width: 100%;
        box-sizing: border-box;
        padding: 10px 11px;
        border:
          1px solid rgba(127,127,127,.20);
        border-radius: 10px;
        background: transparent;
        color: inherit;
        outline: none;
      }

      .mr-template-actions {
        margin-top: 18px;
        display: flex;
        justify-content: flex-end;
        gap: 8px;
      }

      .mr-template-button {
        padding: 10px 15px;
        border-radius: 10px;
        border:
          1px solid rgba(127,127,127,.20);
        background: transparent;
        color: inherit;
        cursor: pointer;
        font-weight: 700;
      }

      .mr-template-button.primary {
        background:
          rgba(70,110,240,.14);
      }

      @media (max-width: 650px) {
        .mr-template-overlay {
          padding: 0;
          align-items: stretch;
        }

        .mr-template-modal {
          width: 100%;
          max-height: none;
          border-radius: 0;
        }

        .mr-template-grid,
        .mr-template-fields {
          grid-template-columns: 1fr;
        }

        .mr-template-content {
          padding: 15px;
        }
      }

      @media (prefers-color-scheme: dark) {
        .mr-template-modal {
          background: #111318;
          color: #f3f4f6;
        }
      }
    `;

    document.head.appendChild(style);
  }

  /* ---------------------------------------------------------
     State
     --------------------------------------------------------- */

  let selectedType = "custom";

  /* ---------------------------------------------------------
     Render
     --------------------------------------------------------- */

  function render() {
    if (!overlay) return;

    const presets =
      templates.getAllPresets();

    overlay.innerHTML = `
      <div class="mr-template-modal">

        <header class="mr-template-header">

          <div>
            <h2>
              Choose a routine type
            </h2>

            <p>
              Start with a setup designed for your needs.
            </p>
          </div>

          <button
            type="button"
            class="mr-template-close"
            data-action="close"
          >
            ×
          </button>

        </header>

        <div class="mr-template-content">

          <div class="mr-template-grid">

            ${presets.map(preset => `
              <button
                type="button"
                class="
                  mr-template-card
                  ${
                    selectedType === preset.type
                      ? "selected"
                      : ""
                  }
                "
                data-type="${escapeHTML(
                  preset.type
                )}"
              >

                <div class="mr-template-icon">
                  ${preset.icon}
                </div>

                <strong>
                  ${escapeHTML(
                    preset.label
                  )}
                </strong>

                <span>
                  ${escapeHTML(
                    preset.description
                  )}
                </span>

              </button>
            `).join("")}

          </div>

          <div class="mr-template-form">

            <h3>
              Basic details
            </h3>

            <div class="mr-template-fields">

              <div class="mr-template-field">
                <label>
                  Routine name
                </label>

                <input
                  id="mr-template-name"
                  type="text"
                  placeholder="My Routine"
                />
              </div>

              <div class="mr-template-field">
                <label>
                  Institution / Organization
                </label>

                <input
                  id="mr-template-institution"
                  type="text"
                  placeholder="Optional"
                />
              </div>

              <div class="mr-template-field">
                <label>
                  Course / Class
                </label>

                <input
                  id="mr-template-course"
                  type="text"
                  placeholder="Optional"
                />
              </div>

              <div class="mr-template-field">
                <label>
                  Section / Group
                </label>

                <input
                  id="mr-template-section"
                  type="text"
                  placeholder="Optional"
                />
              </div>

              <div class="mr-template-field">
                <label>
                  Session / Year
                </label>

                <input
                  id="mr-template-session"
                  type="text"
                  placeholder="Optional"
                />
              </div>

              <div class="mr-template-field">
                <label>
                  Number of periods
                </label>

                <input
                  id="mr-template-periods"
                  type="number"
                  min="1"
                  max="20"
                  value="6"
                />
              </div>

              <div class="mr-template-field">
                <label>
                  Start time
                </label>

                <input
                  id="mr-template-start"
                  type="time"
                  value="08:00"
                />
              </div>

              <div class="mr-template-field">
                <label>
                  Period duration (minutes)
                </label>

                <input
                  id="mr-template-duration"
                  type="number"
                  min="5"
                  max="300"
                  value="50"
                />
              </div>

            </div>

            <div class="mr-template-actions">

              <button
                type="button"
                class="mr-template-button"
                data-action="close"
              >
                Cancel
              </button>

              <button
                type="button"
                class="
                  mr-template-button
                  primary
                "
                data-action="create"
              >
                Create Routine
              </button>

            </div>

          </div>

        </div>

      </div>
    `;

    bindEvents();
  }

  /* ---------------------------------------------------------
     Events
     --------------------------------------------------------- */

  function bindEvents() {
    if (!overlay) return;

    overlay
      .querySelectorAll("[data-type]")
      .forEach(card => {
        card.addEventListener(
          "click",
          () => {
            selectedType =
              card.dataset.type;

            const preset =
              templates.getPreset(
                selectedType
              );

            const duration =
              document.getElementById(
                "mr-template-duration"
              );

            if (
              duration &&
              preset?.defaults
                ?.periodDuration
            ) {
              duration.value =
                preset.defaults
                  .periodDuration;
            }

            render();
          }
        );
      });

    overlay
      .querySelectorAll("[data-action]")
      .forEach(button => {
        button.addEventListener(
          "click",
          () => {
            const action =
              button.dataset.action;

            if (action === "close") {
              close();
            }

            if (action === "create") {
              createFromForm();
            }
          }
        );
      });
  }

  /* ---------------------------------------------------------
     Create routine
     --------------------------------------------------------- */

  function createFromForm() {
    const value = id =>
      document.getElementById(id)?.value
        ?.trim() || "";

    const periodCount =
      Number(
        value(
          "mr-template-periods"
        )
      ) || 6;

    const duration =
      Number(
        value(
          "mr-template-duration"
        )
      ) || 50;

    const routine =
      templates.buildRoutine(
        selectedType,
        {
          name:
            value(
              "mr-template-name"
            ) ||
            `${templates.getTemplateLabel(
              selectedType
            )} Routine`,

          institutionName:
            value(
              "mr-template-institution"
            ),

          course:
            value(
              "mr-template-course"
            ),

          section:
            value(
              "mr-template-section"
            ),

          session:
            value(
              "mr-template-session"
            ),

          periodCount,

          startTime:
            value(
              "mr-template-start"
            ) || "08:00",

          periodDuration:
            duration
        }
      );

    document.dispatchEvent(
      new CustomEvent(
        "myroutine:template-created",
        {
          detail: {
            routine,
            type: selectedType
          }
        }
      )
    );

    close();

    return routine;
  }

  /* ---------------------------------------------------------
     Open / close
     --------------------------------------------------------- */

  function open(type) {
    injectStyles();

    if (type) {
      selectedType = type;
    } else {
      selectedType = "custom";
    }

    if (overlay) {
      render();
      return;
    }

    overlay =
      document.createElement("div");

    overlay.className =
      "mr-template-overlay";

    document.body.appendChild(
      overlay
    );

    document.body.style.overflow =
      "hidden";

    overlay.addEventListener(
      "click",
      event => {
        if (event.target === overlay) {
          close();
        }
      }
    );

    render();
  }

  function close() {
    if (overlay) {
      overlay.remove();
      overlay = null;
    }

    document.body.style.overflow = "";
  }

  /* ---------------------------------------------------------
     Public API
     --------------------------------------------------------- */

  templates.open =
    open;

  templates.close =
    close;

  templates.refresh =
    render;

  templates.getSelectedType =
    function () {
      return selectedType;
    };

})();
/* =========================================================
   MyRoutine — Template Finalization
   ========================================================= */

(function () {
  "use strict";

  const templates =
    window.MyRoutineTemplates;

  if (!templates) return;

  /* ---------------------------------------------------------
     Create from existing MyRoutine data
     --------------------------------------------------------- */

  function getActiveRoutine() {
    if (
      window.MyRoutine &&
      typeof window.MyRoutine.getActiveRoutine ===
        "function"
    ) {
      return window.MyRoutine.getActiveRoutine();
    }

    return null;
  }

  function saveRoutine(routine) {
    if (!routine || !window.MyRoutine) {
      return false;
    }

    /*
      Support the existing MyRoutine engine
      without replacing its internal state.
    */

    if (
      window.MyRoutine.state &&
      window.MyRoutine.state.data &&
      Array.isArray(
        window.MyRoutine.state.data.routines
      )
    ) {
      const routines =
        window.MyRoutine.state.data.routines;

      const index =
        routines.findIndex(
          item => item.id === routine.id
        );

      if (index !== -1) {
        routines[index] = routine;
      } else {
        routines.push(routine);
      }

      if (
        typeof window.MyRoutine.saveRoutines ===
        "function"
      ) {
        window.MyRoutine.saveRoutines();
      }

      return true;
    }

    return false;
  }

  /* ---------------------------------------------------------
     Save template
     --------------------------------------------------------- */

  function saveAsTemplate(
    routine,
    name
  ) {
    if (!routine) {
      return null;
    }

    const template =
      templates.routineToTemplate(
        routine,
        name
      );

    if (!template) {
      return null;
    }

    /*
      Templates are kept as independent
      objects. They are not automatically
      inserted into the user's routines.
    */

    let stored = [];

    try {
      const raw =
        localStorage.getItem(
          "myroutine_templates"
        );

      if (raw) {
        stored =
          JSON.parse(raw) || [];
      }
    } catch {
      stored = [];
    }

    stored.push(template);

    try {
      localStorage.setItem(
        "myroutine_templates",
        JSON.stringify(stored)
      );
    } catch (error) {
      console.warn(
        "Could not save MyRoutine template.",
        error
      );

      return null;
    }

    document.dispatchEvent(
      new CustomEvent(
        "myroutine:template-saved",
        {
          detail: {
            template
          }
        }
      )
    );

    return template;
  }

  /* ---------------------------------------------------------
     Load saved templates
     --------------------------------------------------------- */

  function getSavedTemplates() {
    try {
      const raw =
        localStorage.getItem(
          "myroutine_templates"
        );

      if (!raw) {
        return [];
      }

      const data =
        JSON.parse(raw);

      return Array.isArray(data)
        ? data
        : [];
    } catch {
      return [];
    }
  }

  /* ---------------------------------------------------------
     Delete saved template
     --------------------------------------------------------- */

  function deleteTemplate(id) {
    const templatesList =
      getSavedTemplates();

    const filtered =
      templatesList.filter(
        template =>
          template.id !== id
      );

    try {
      localStorage.setItem(
        "myroutine_templates",
        JSON.stringify(filtered)
      );
    } catch {
      return false;
    }

    document.dispatchEvent(
      new CustomEvent(
        "myroutine:template-deleted",
        {
          detail: {
            templateId: id
          }
        }
      )
    );

    return true;
  }

  /* ---------------------------------------------------------
     Create routine from saved template
     --------------------------------------------------------- */

  function createFromSavedTemplate(
    templateId,
    options
  ) {
    const saved =
      getSavedTemplates();

    const template =
      saved.find(
        item =>
          item.id === templateId
      );

    if (!template) {
      return null;
    }

    options = options || {};

    const routine =
      templates.applyTemplate(
        {},
        template,
        {
          preserveIdentity: false,
          name:
            options.name ||
            template.name
        }
      );

    if (!routine) {
      return null;
    }

    routine.id =
      "routine_" +
      Date.now().toString(36) +
      "_" +
      Math.random()
        .toString(36)
        .slice(2, 8);

    routine.metadata =
      routine.metadata || {};

    routine.metadata.isTemplate =
      false;

    routine.metadata.createdFromTemplate =
      template.id;

    routine.metadata.createdAt =
      new Date().toISOString();

    routine.metadata.updatedAt =
      new Date().toISOString();

    return routine;
  }

  /* ---------------------------------------------------------
     Duplicate template
     --------------------------------------------------------- */

  function duplicateTemplate(
    templateId,
    newName
  ) {
    const original =
      getSavedTemplates().find(
        item =>
          item.id === templateId
      );

    if (!original) {
      return null;
    }

    const copy =
      JSON.parse(
        JSON.stringify(original)
      );

    copy.id =
      "template_" +
      Date.now().toString(36) +
      "_" +
      Math.random()
        .toString(36)
        .slice(2, 8);

    copy.name =
      newName ||
      `${original.name} Copy`;

    copy.metadata =
      copy.metadata || {};

    copy.metadata.createdAt =
      new Date().toISOString();

    copy.metadata.updatedAt =
      new Date().toISOString();

    const saved =
      getSavedTemplates();

    saved.push(copy);

    try {
      localStorage.setItem(
        "myroutine_templates",
        JSON.stringify(saved)
      );
    } catch {
      return null;
    }

    return copy;
  }

  /* ---------------------------------------------------------
     Export templates
     --------------------------------------------------------- */

  function exportTemplates() {
    return JSON.stringify(
      {
        format:
          "MyRoutine Templates",

        version:
          templates.VERSION,

        exportedAt:
          new Date().toISOString(),

        templates:
          getSavedTemplates()
      },
      null,
      2
    );
  }

  /* ---------------------------------------------------------
     Import templates
     --------------------------------------------------------- */

  function importTemplates(data) {
    let parsed;

    try {
      parsed =
        typeof data === "string"
          ? JSON.parse(data)
          : data;
    } catch {
      return false;
    }

    if (
      !parsed ||
      !Array.isArray(
        parsed.templates
      )
    ) {
      return false;
    }

    const existing =
      getSavedTemplates();

    parsed.templates.forEach(
      template => {
        if (!template || typeof template !== "object") {
          return;
        }

        const copy =
          JSON.parse(
            JSON.stringify(template)
          );

        if (!copy.id) {
          copy.id =
            "template_" +
            Date.now().toString(36) +
            "_" +
            Math.random()
              .toString(36)
              .slice(2, 8);
        }

        existing.push(copy);
      }
    );

    try {
      localStorage.setItem(
        "myroutine_templates",
        JSON.stringify(existing)
      );
    } catch {
      return false;
    }

    document.dispatchEvent(
      new CustomEvent(
        "myroutine:templates-imported"
      )
    );

    return true;
  }

  /* ---------------------------------------------------------
     Download templates
     --------------------------------------------------------- */

  function downloadTemplates() {
    const json =
      exportTemplates();

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
      "myroutine-templates.json";

    document.body.appendChild(
      link
    );

    link.click();

    link.remove();

    URL.revokeObjectURL(url);

    return true;
  }

  /* ---------------------------------------------------------
     Public API
     --------------------------------------------------------- */

  templates.getActiveRoutine =
    getActiveRoutine;

  templates.saveRoutine =
    saveRoutine;

  templates.saveAsTemplate =
    saveAsTemplate;

  templates.getSavedTemplates =
    getSavedTemplates;

  templates.deleteTemplate =
    deleteTemplate;

  templates.createFromSavedTemplate =
    createFromSavedTemplate;

  templates.duplicateTemplate =
    duplicateTemplate;

  templates.exportTemplates =
    exportTemplates;

  templates.importTemplates =
    importTemplates;

  templates.downloadTemplates =
    downloadTemplates;

  console.log(
    "MyRoutine Templates ready."
  );

})();