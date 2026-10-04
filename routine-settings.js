/* MyRoutine — Universal Routine Settings */

(function () {
  "use strict";

  const DEFAULT_SETTINGS = {
    weekStart: "Monday",
    timeFormat: "12",
    workingDays: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday"
    ],
    defaultPeriodDuration: 50,
    breakDuration: 10,
    theme: "system",
    density: "comfortable",
    showTeacher: true,
    showRoom: true,
    showSubjectCode: true,
    showEmptyPeriods: true
  };

  const DAYS = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday"
  ];

  const THEMES = [
    "system",
    "light",
    "dark"
  ];

  const DENSITIES = [
    "compact",
    "comfortable",
    "spacious"
  ];

  let currentRoutineId = null;

  function getRoutine() {
    if (!window.MyRoutine) {
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

  function ensureSettings(routine) {
    if (!routine.settings) {
      routine.settings = {};
    }

    Object.keys(DEFAULT_SETTINGS)
      .forEach(key => {
        if (
          routine.settings[key] === undefined ||
          routine.settings[key] === null
        ) {
          routine.settings[key] =
            clone(DEFAULT_SETTINGS[key]);
        }
      });

    if (
      !Array.isArray(
        routine.settings.workingDays
      )
    ) {
      routine.settings.workingDays =
        clone(
          DEFAULT_SETTINGS.workingDays
        );
    }

    if (
      !DAYS.includes(
        routine.settings.weekStart
      )
    ) {
      routine.settings.weekStart =
        DEFAULT_SETTINGS.weekStart;
    }

    if (
      !THEMES.includes(
        routine.settings.theme
      )
    ) {
      routine.settings.theme =
        DEFAULT_SETTINGS.theme;
    }

    if (
      !DENSITIES.includes(
        routine.settings.density
      )
    ) {
      routine.settings.density =
        DEFAULT_SETTINGS.density;
    }

    return routine.settings;
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
        "myroutine:settings-updated"
      )
    );

    window.dispatchEvent(
      new CustomEvent(
        "myroutine:updated"
      )
    );
  }

  function updateSetting(
    key,
    value
  ) {
    const routine = getRoutine();

    if (!routine) {
      return false;
    }

    const settings =
      ensureSettings(routine);

    settings[key] = value;

    save();

    return true;
  }

  function resetSettings() {
    const routine = getRoutine();

    if (!routine) {
      return false;
    }

    routine.settings =
      clone(DEFAULT_SETTINGS);

    save();

    return true;
  }

  function setTheme(theme) {
    if (!THEMES.includes(theme)) {
      return false;
    }

    return updateSetting(
      "theme",
      theme
    );
  }

  function setDensity(density) {
    if (!DENSITIES.includes(density)) {
      return false;
    }

    return updateSetting(
      "density",
      density
    );
  }

  function toggleWorkingDay(day) {
    if (!DAYS.includes(day)) {
      return false;
    }

    const routine = getRoutine();

    if (!routine) {
      return false;
    }

    const settings =
      ensureSettings(routine);

    const days =
      Array.isArray(
        settings.workingDays
      )
        ? settings.workingDays
        : [];

    if (days.includes(day)) {
      if (days.length <= 1) {
        return false;
      }

      settings.workingDays =
        days.filter(
          item => item !== day
        );
    } else {
      settings.workingDays = [
        ...days,
        day
      ];
    }

    save();

    return true;
  }

  function setWorkingDays(days) {
    if (!Array.isArray(days)) {
      return false;
    }

    const validDays =
      days.filter(day =>
        DAYS.includes(day)
      );

    if (!validDays.length) {
      return false;
    }

    return updateSetting(
      "workingDays",
      [...new Set(validDays)]
    );
  }

  function setWeekStart(day) {
    if (!DAYS.includes(day)) {
      return false;
    }

    return updateSetting(
      "weekStart",
      day
    );
  }

  function setTimeFormat(format) {
    if (
      format !== "12" &&
      format !== "24"
    ) {
      return false;
    }

    return updateSetting(
      "timeFormat",
      format
    );
  }

  function getSettings() {
    const routine = getRoutine();

    if (!routine) {
      return clone(
        DEFAULT_SETTINGS
      );
    }

    return ensureSettings(
      routine
    );
  }

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
        "myroutine-settings-styles"
      )
    ) {
      return;
    }

    const style =
      document.createElement(
        "style"
      );

    style.id =
      "myroutine-settings-styles";

    style.textContent = `
      .mr-settings-overlay {
        position: fixed;
        inset: 0;
        z-index: 9999;
        background: rgba(15,23,42,.48);
        backdrop-filter: blur(8px);
        overflow-y: auto;
        padding: 20px;
        font-family:
          Inter,
          system-ui,
          -apple-system,
          BlinkMacSystemFont,
          "Segoe UI",
          sans-serif;
      }

      .mr-settings-panel {
        width: min(760px, 100%);
        margin: 20px auto;
        background: #fff;
        color: #111827;
        border-radius: 20px;
        overflow: hidden;
        box-shadow:
          0 24px 80px
          rgba(0,0,0,.22);
      }

      .mr-settings-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 20px;
        border-bottom: 1px solid #e5e7eb;
      }

      .mr-settings-header h2 {
        margin: 0;
        font-size: 21px;
      }

      .mr-settings-header p {
        margin: 5px 0 0;
        color: #6b7280;
        font-size: 12px;
      }

      .mr-settings-close {
        border: 0;
        width: 38px;
        height: 38px;
        border-radius: 10px;
        background: #f3f4f6;
        cursor: pointer;
        font-size: 20px;
      }

      .mr-settings-body {
        padding: 20px;
      }

      .mr-settings-section {
        margin-bottom: 25px;
      }

      .mr-settings-section:last-child {
        margin-bottom: 0;
      }

      .mr-settings-section h3 {
        margin: 0 0 5px;
        font-size: 15px;
      }

      .mr-settings-section > p {
        margin: 0 0 13px;
        color: #6b7280;
        font-size: 12px;
      }

      .mr-settings-grid {
        display: grid;
        grid-template-columns:
          repeat(2, minmax(0, 1fr));
        gap: 12px;
      }

      .mr-setting-field {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .mr-setting-field label {
        font-size: 12px;
        font-weight: 650;
        color: #374151;
      }

      .mr-setting-field select,
      .mr-setting-field input {
        width: 100%;
        border: 1px solid #d1d5db;
        border-radius: 10px;
        padding: 10px 11px;
        background: #fff;
        color: #111827;
        outline: none;
      }

      .mr-setting-field select:focus,
      .mr-setting-field input:focus {
        border-color: #6b7280;
      }

      .mr-days {
        display: flex;
        flex-wrap: wrap;
        gap: 7px;
      }

      .mr-day-toggle {
        border: 1px solid #d1d5db;
        background: #fff;
        color: #374151;
        border-radius: 9px;
        padding: 8px 11px;
        cursor: pointer;
        font-size: 12px;
      }

      .mr-day-toggle.active {
        background: #111827;
        color: #fff;
        border-color: #111827;
      }

      .mr-theme-options {
        display: grid;
        grid-template-columns:
          repeat(3, 1fr);
        gap: 9px;
      }

      .mr-theme-option {
        border: 1px solid #d1d5db;
        border-radius: 12px;
        background: #fff;
        padding: 13px 8px;
        cursor: pointer;
        text-align: center;
        font-size: 12px;
      }

      .mr-theme-option.active {
        border-color: #111827;
        background: #f3f4f6;
        font-weight: 700;
      }

      .mr-setting-checks {
        display: grid;
        grid-template-columns:
          repeat(2, 1fr);
        gap: 9px;
      }

      .mr-setting-check {
        display: flex;
        align-items: center;
        gap: 9px;
        padding: 11px;
        border: 1px solid #e5e7eb;
        border-radius: 11px;
        font-size: 12px;
        cursor: pointer;
      }

      .mr-setting-check input {
        width: 17px;
        height: 17px;
        margin: 0;
      }

      .mr-settings-footer {
        display: flex;
        justify-content: space-between;
        gap: 10px;
        padding: 15px 20px;
        border-top: 1px solid #e5e7eb;
        background: #fafafa;
      }

      .mr-settings-btn {
        border: 1px solid #d1d5db;
        background: #fff;
        color: #111827;
        border-radius: 10px;
        padding: 10px 14px;
        cursor: pointer;
        font-size: 12px;
      }

      .mr-settings-btn.primary {
        background: #111827;
        border-color: #111827;
        color: #fff;
      }

      .mr-settings-btn.danger {
        color: #b91c1c;
      }

      @media (max-width: 600px) {
        .mr-settings-overlay {
          padding: 0;
        }

        .mr-settings-panel {
          width: 100%;
          min-height: 100vh;
          margin: 0;
          border-radius: 0;
        }

        .mr-settings-grid {
          grid-template-columns: 1fr;
        }

        .mr-setting-checks {
          grid-template-columns: 1fr;
        }

        .mr-settings-footer {
          position: sticky;
          bottom: 0;
        }
      }
    `;

    document.head.appendChild(
      style
    );
  }

  function createOverlay() {
    let overlay =
      document.getElementById(
        "myroutine-settings"
      );

    if (overlay) {
      return overlay;
    }

    overlay =
      document.createElement(
        "div"
      );

    overlay.id =
      "myroutine-settings";

    overlay.className =
      "mr-settings-overlay";

    overlay.hidden = true;

    document.body.appendChild(
      overlay
    );

    return overlay;
  }

  function optionHTML(
    value,
    label,
    selected
  ) {
    return `
      <option
        value="${escapeHTML(value)}"
        ${
          selected === value
            ? "selected"
            : ""
        }
      >
        ${escapeHTML(label)}
      </option>
    `;
  }

  function renderSettings() {
    const overlay =
      createOverlay();

    const settings =
      getSettings();

    const routine =
      getRoutine();

    const workingDays =
      settings.workingDays || [];

    overlay.innerHTML = `
      <div
        class="mr-settings-panel"
        role="dialog"
        aria-modal="true"
      >

        <div
          class="mr-settings-header"
        >
          <div>
            <h2>
              Routine Settings
            </h2>

            <p>
              Customize how this routine
              behaves and appears.
            </p>
          </div>

          <button
            type="button"
            class="mr-settings-close"
            id="mr-settings-close"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div
          class="mr-settings-body"
        >

          <section
            class="mr-settings-section"
          >
            <h3>
              Calendar
            </h3>

            <p>
              Choose your working days
              and calendar preferences.
            </p>

            <div
              class="mr-settings-grid"
            >

              <div
                class="mr-setting-field"
              >
                <label>
                  Week starts on
                </label>

                <select
                  id="mr-setting-week-start"
                >
                  ${DAYS.map(day =>
                    optionHTML(
                      day,
                      day,
                      settings.weekStart
                    )
                  ).join("")}
                </select>
              </div>

              <div
                class="mr-setting-field"
              >
                <label>
                  Time format
                </label>

                <select
                  id="mr-setting-time-format"
                >
                  ${optionHTML(
                    "12",
                    "12-hour (AM/PM)",
                    settings.timeFormat
                  )}

                  ${optionHTML(
                    "24",
                    "24-hour",
                    settings.timeFormat
                  )}
                </select>
              </div>

            </div>

            <div
              style="margin-top:14px;"
            >
              <label
                style="
                  display:block;
                  font-size:12px;
                  font-weight:650;
                  margin-bottom:8px;
                "
              >
                Working days
              </label>

              <div
                class="mr-days"
              >
                ${DAYS.map(day => `
                  <button
                    type="button"
                    class="
                      mr-day-toggle
                      ${
                        workingDays.includes(
                          day
                        )
                          ? "active"
                          : ""
                      }
                    "
                    data-working-day="${day}"
                  >
                    ${day.slice(0, 3)}
                  </button>
                `).join("")}
              </div>
            </div>

          </section>

          <section
            class="mr-settings-section"
          >
            <h3>
              Period defaults
            </h3>

            <p>
              These values help when
              creating new periods.
            </p>

            <div
              class="mr-settings-grid"
            >

              <div
                class="mr-setting-field"
              >
                <label>
                  Default period duration
                  (minutes)
                </label>

                <input
                  id="mr-setting-period-duration"
                  type="number"
                  min="1"
                  max="600"
                  value="${
                    Number(
                      settings.defaultPeriodDuration
                    ) || 50
                  }"
                />
              </div>

              <div
                class="mr-setting-field"
              >
                <label>
                  Default break duration
                  (minutes)
                </label>

                <input
                  id="mr-setting-break-duration"
                  type="number"
                  min="1"
                  max="300"
                  value="${
                    Number(
                      settings.breakDuration
                    ) || 10
                  }"
                />
              </div>

            </div>
          </section>
          <section
            class="mr-settings-section"
          >
            <h3>
              Appearance
            </h3>

            <p>
              Choose how your routine
              should look.
            </p>

            <div
              class="mr-theme-options"
            >

              ${THEMES.map(theme => `
                <button
                  type="button"
                  class="
                    mr-theme-option
                    ${
                      settings.theme ===
                      theme
                        ? "active"
                        : ""
                    }
                  "
                  data-theme="${theme}"
                >
                  ${
                    theme === "system"
                      ? "System"
                      : theme === "light"
                        ? "Light"
                        : "Dark"
                  }
                </button>
              `).join("")}

            </div>

            <div
              class="mr-setting-field"
              style="margin-top:12px;"
            >
              <label>
                Timetable density
              </label>

              <select
                id="mr-setting-density"
              >
                ${optionHTML(
                  "compact",
                  "Compact",
                  settings.density
                )}

                ${optionHTML(
                  "comfortable",
                  "Comfortable",
                  settings.density
                )}

                ${optionHTML(
                  "spacious",
                  "Spacious",
                  settings.density
                )}
              </select>
            </div>
          </section>

          <section
            class="mr-settings-section"
          >
            <h3>
              Information visibility
            </h3>

            <p>
              Choose which information
              appears on timetable cards.
            </p>

            <div
              class="mr-setting-checks"
            >

              <label
                class="mr-setting-check"
              >
                <input
                  type="checkbox"
                  id="mr-show-teacher"
                  ${
                    settings.showTeacher
                      ? "checked"
                      : ""
                  }
                />
                <span>
                  Show teacher
                </span>
              </label>

              <label
                class="mr-setting-check"
              >
                <input
                  type="checkbox"
                  id="mr-show-room"
                  ${
                    settings.showRoom
                      ? "checked"
                      : ""
                  }
                />
                <span>
                  Show room
                </span>
              </label>

              <label
                class="mr-setting-check"
              >
                <input
                  type="checkbox"
                  id="mr-show-code"
                  ${
                    settings.showSubjectCode
                      ? "checked"
                      : ""
                  }
                />
                <span>
                  Show subject code
                </span>
              </label>

              <label
                class="mr-setting-check"
              >
                <input
                  type="checkbox"
                  id="mr-show-empty"
                  ${
                    settings.showEmptyPeriods
                      ? "checked"
                      : ""
                  }
                />
                <span>
                  Show empty periods
                </span>
              </label>

            </div>
          </section>

          ${
            routine
              ? `
                <section
                  class="mr-settings-section"
                >
                  <h3>
                    Current routine
                  </h3>

                  <p>
                    ${
                      escapeHTML(
                        routine.name ||
                        "My Routine"
                      )
                    }
                  </p>
                </section>
              `
              : ""
          }

        </div>

        <div
          class="mr-settings-footer"
        >

          <button
            type="button"
            class="
              mr-settings-btn
              danger
            "
            id="mr-settings-reset"
          >
            Reset defaults
          </button>

          <button
            type="button"
            class="
              mr-settings-btn
              primary
            "
            id="mr-settings-done"
          >
            Done
          </button>

        </div>

      </div>
    `;

    bindSettingsEvents();
  }

  function bindSettingsEvents() {
    const close =
      document.getElementById(
        "mr-settings-close"
      );

    const done =
      document.getElementById(
        "mr-settings-done"
      );

    const reset =
      document.getElementById(
        "mr-settings-reset"
      );

    if (close) {
      close.onclick =
        closeSettings;
    }

    if (done) {
      done.onclick =
        closeSettings;
    }

    if (reset) {
      reset.onclick = () => {
        const confirmed =
          window.confirm(
            "Reset all routine settings to defaults?"
          );

        if (!confirmed) {
          return;
        }

        resetSettings();
        renderSettings();
      };
    }

    const weekStart =
      document.getElementById(
        "mr-setting-week-start"
      );

    if (weekStart) {
      weekStart.onchange = event => {
        setWeekStart(
          event.target.value
        );
      };
    }

    const timeFormat =
      document.getElementById(
        "mr-setting-time-format"
      );

    if (timeFormat) {
      timeFormat.onchange = event => {
        setTimeFormat(
          event.target.value
        );
      };
    }

    document
      .querySelectorAll(
        "[data-working-day]"
      )
      .forEach(button => {
        button.onclick = () => {
          toggleWorkingDay(
            button.dataset.workingDay
          );

          renderSettings();
        };
      });

    const periodDuration =
      document.getElementById(
        "mr-setting-period-duration"
      );

    if (periodDuration) {
      periodDuration.onchange =
        event => {
          let value =
            Number(
              event.target.value
            );

          if (
            !Number.isFinite(value) ||
            value < 1
          ) {
            value = 50;
          }

          value = Math.min(
            600,
            Math.round(value)
          );

          updateSetting(
            "defaultPeriodDuration",
            value
          );

          event.target.value =
            value;
        };
    }

    const breakDuration =
      document.getElementById(
        "mr-setting-break-duration"
      );

    if (breakDuration) {
      breakDuration.onchange =
        event => {
          let value =
            Number(
              event.target.value
            );

          if (
            !Number.isFinite(value) ||
            value < 1
          ) {
            value = 10;
          }

          value = Math.min(
            300,
            Math.round(value)
          );

          updateSetting(
            "breakDuration",
            value
          );

          event.target.value =
            value;
        };
    }

    document
      .querySelectorAll(
        "[data-theme]"
      )
      .forEach(button => {
        button.onclick = () => {
          setTheme(
            button.dataset.theme
          );

          renderSettings();
        };
      });

    const density =
      document.getElementById(
        "mr-setting-density"
      );

    if (density) {
      density.onchange = event => {
        setDensity(
          event.target.value
        );
      };
    }

    const checkBindings = [
      [
        "mr-show-teacher",
        "showTeacher"
      ],
      [
        "mr-show-room",
        "showRoom"
      ],
      [
        "mr-show-code",
        "showSubjectCode"
      ],
      [
        "mr-show-empty",
        "showEmptyPeriods"
      ]
    ];

    checkBindings.forEach(
      ([id, key]) => {
        const checkbox =
          document.getElementById(id);

        if (checkbox) {
          checkbox.onchange =
            event => {
              updateSetting(
                key,
                event.target.checked
              );
            };
        }
      }
    );
  }
  function openSettings(routineId) {
    injectStyles();

    if (
      !window.MyRoutine ||
      !window.MyRoutine.state
    ) {
      console.error(
        "MyRoutine engine is not loaded."
      );

      return;
    }

    currentRoutineId =
      routineId ||
      window.MyRoutine.state.activeRoutineId;

    if (currentRoutineId) {
      window.MyRoutine.state.activeRoutineId =
        currentRoutineId;

      if (
        typeof window.MyRoutine.saveRoutines ===
        "function"
      ) {
        window.MyRoutine.saveRoutines();
      }
    }

    const routine = getRoutine();

    if (!routine) {
      window.alert(
        "Please select a routine first."
      );

      return;
    }

    ensureSettings(routine);

    const overlay =
      createOverlay();

    overlay.hidden = false;

    document.body.style.overflow =
      "hidden";

    renderSettings();
  }

  function closeSettings() {
    const overlay =
      document.getElementById(
        "myroutine-settings"
      );

    if (overlay) {
      overlay.hidden = true;
    }

    document.body.style.overflow =
      "";
  }

  function refreshSettings() {
    const overlay =
      document.getElementById(
        "myroutine-settings"
      );

    if (
      overlay &&
      !overlay.hidden
    ) {
      renderSettings();
    }
  }

  window.MyRoutineSettings = {
    open: openSettings,
    close: closeSettings,
    refresh: refreshSettings,
    get: getSettings,
    update: updateSetting,
    reset: resetSettings,
    setTheme,
    setDensity,
    setWorkingDays,
    toggleWorkingDay,
    setWeekStart,
    setTimeFormat
  };

  window.addEventListener(
    "myroutine:ready",
    function () {
      const routine =
        getRoutine();

      if (routine) {
        ensureSettings(routine);
      }
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

      const overlay =
        document.getElementById(
          "myroutine-settings"
        );

      if (
        overlay &&
        !overlay.hidden
      ) {
        closeSettings();
      }
    }
  );

})();