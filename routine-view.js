/* MyRoutine — Universal Routine Viewer */

(function () {
  "use strict";

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
  let currentDay = null;
  let viewMode = "week";

  function getRoutine() {
    if (!window.MyRoutine) return null;

    if (currentRoutineId) {
      window.MyRoutine.state.activeRoutineId = currentRoutineId;
    }

    return window.MyRoutine.getActiveRoutine
      ? window.MyRoutine.getActiveRoutine()
      : null;
  }

  function getPeriods(routine) {
    return Array.isArray(routine?.periods)
      ? routine.periods
      : [];
  }

  function getSubjects(routine) {
    return Array.isArray(routine?.subjects)
      ? routine.subjects
      : [];
  }

  function getSchedule(routine) {
    if (!routine.schedule) {
      routine.schedule = {};
    }

    DAYS.forEach(day => {
      if (!Array.isArray(routine.schedule[day])) {
        routine.schedule[day] = [];
      }
    });

    return routine.schedule;
  }

  function findSubject(routine, id) {
    return getSubjects(routine).find(
      subject => String(subject.id) === String(id)
    );
  }

  function getAssignment(routine, day, periodId) {
    const schedule = getSchedule(routine);
    const entries = schedule[day] || [];

    return entries.find(
      item =>
        String(item.periodId) === String(periodId)
    );
  }

  function getSubjectFromAssignment(routine, assignment) {
    if (!assignment) return null;

    return findSubject(
      routine,
      assignment.subjectId
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

  function formatTime(value) {
    if (!value) return "";

    const parts = String(value).split(":");

    if (parts.length < 2) {
      return value;
    }

    let hour = Number(parts[0]);
    const minute = parts[1];

    if (Number.isNaN(hour)) {
      return value;
    }

    const suffix = hour >= 12 ? "PM" : "AM";

    hour = hour % 12 || 12;

    return `${hour}:${minute} ${suffix}`;
  }

  function isBreak(period) {
    return String(period?.type || "")
      .toLowerCase() === "break";
  }

  function injectStyles() {
    if (document.getElementById(
      "myroutine-view-styles"
    )) {
      return;
    }

    const style = document.createElement("style");

    style.id = "myroutine-view-styles";

    style.textContent = `
      .mr-viewer {
        position: fixed;
        inset: 0;
        z-index: 9998;
        background: #f6f7fb;
        color: #111827;
        overflow: auto;
        font-family:
          Inter,
          system-ui,
          -apple-system,
          BlinkMacSystemFont,
          "Segoe UI",
          sans-serif;
      }

      .mr-viewer *,
      .mr-viewer *::before,
      .mr-viewer *::after {
        box-sizing: border-box;
      }

      .mr-viewer-header {
        position: sticky;
        top: 0;
        z-index: 20;
        background: rgba(255,255,255,.94);
        backdrop-filter: blur(18px);
        border-bottom: 1px solid #e5e7eb;
        padding: 14px 18px;
      }

      .mr-viewer-top {
        max-width: 1500px;
        margin: 0 auto;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
      }

      .mr-viewer-title {
        min-width: 0;
      }

      .mr-viewer-title h1 {
        margin: 0;
        font-size: 22px;
        line-height: 1.2;
      }

      .mr-viewer-title p {
        margin: 5px 0 0;
        color: #6b7280;
        font-size: 13px;
      }

      .mr-viewer-actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      .mr-btn {
        border: 1px solid #d1d5db;
        background: #fff;
        color: #111827;
        border-radius: 10px;
        padding: 9px 13px;
        font-size: 13px;
        cursor: pointer;
      }

      .mr-btn:hover {
        background: #f3f4f6;
      }

      .mr-btn.primary {
        background: #111827;
        color: #fff;
        border-color: #111827;
      }

      .mr-btn.primary:hover {
        background: #000;
      }

      .mr-viewer-body {
        max-width: 1500px;
        margin: 0 auto;
        padding: 18px;
      }

      .mr-toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 16px;
        flex-wrap: wrap;
      }

      .mr-view-switch {
        display: flex;
        gap: 4px;
        padding: 4px;
        border: 1px solid #e5e7eb;
        background: #fff;
        border-radius: 12px;
      }

      .mr-view-switch button {
        border: 0;
        background: transparent;
        border-radius: 8px;
        padding: 8px 12px;
        cursor: pointer;
        color: #6b7280;
      }

      .mr-view-switch button.active {
        background: #111827;
        color: #fff;
      }

      .mr-search {
        width: 240px;
        max-width: 100%;
        border: 1px solid #d1d5db;
        border-radius: 10px;
        padding: 10px 12px;
        outline: none;
        background: #fff;
      }

      .mr-search:focus {
        border-color: #6b7280;
      }

      .mr-week-wrap {
        overflow-x: auto;
        border: 1px solid #e5e7eb;
        border-radius: 16px;
        background: #fff;
      }

      .mr-week-grid {
        min-width: 1050px;
        display: grid;
        grid-template-columns: 95px repeat(7, minmax(130px, 1fr));
      }

      .mr-grid-head {
        position: sticky;
        top: 0;
        z-index: 5;
        background: #fff;
        border-bottom: 1px solid #e5e7eb;
        padding: 13px 8px;
        text-align: center;
        font-size: 13px;
        font-weight: 700;
      }

      .mr-grid-time {
        border-right: 1px solid #e5e7eb;
        border-bottom: 1px solid #e5e7eb;
        padding: 10px 6px;
        text-align: center;
        background: #fafafa;
        font-size: 11px;
        color: #6b7280;
      }

      .mr-grid-cell {
        min-height: 105px;
        padding: 7px;
        border-right: 1px solid #e5e7eb;
        border-bottom: 1px solid #e5e7eb;
      }

      .mr-grid-cell:last-child {
        border-right: 0;
      }

      .mr-day-head {
        position: relative;
      }

      .mr-day-head.today {
        background: #f0fdf4;
      }

      .mr-today-dot {
        display: inline-block;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #16a34a;
        margin-left: 5px;
        vertical-align: middle;
      }

      .mr-class-card {
        width: 100%;
        min-height: 88px;
        padding: 11px;
        border-radius: 12px;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        cursor: default;
      }

      .mr-class-card.break {
        background: #fff7ed;
        border-color: #fed7aa;
      }

      .mr-class-card.empty {
        background: #fafafa;
        border-style: dashed;
        color: #9ca3af;
      }

      .mr-class-name {
        font-weight: 750;
        font-size: 14px;
        line-height: 1.3;
        margin-bottom: 7px;
      }

      .mr-class-meta {
        color: #6b7280;
        font-size: 11px;
        line-height: 1.5;
      }

      .mr-class-code {
        display: inline-block;
        margin-top: 7px;
        padding: 3px 7px;
        border-radius: 6px;
        background: #e5e7eb;
        font-size: 10px;
        color: #374151;
      }

      .mr-mobile-days {
        display: none;
      }

      .mr-day-section {
        background: #fff;
        border: 1px solid #e5e7eb;
        border-radius: 16px;
        overflow: hidden;
        margin-bottom: 14px;
      }

      .mr-day-section-head {
        padding: 13px 15px;
        background: #fafafa;
        border-bottom: 1px solid #e5e7eb;
        font-weight: 750;
      }

      .mr-day-section-head.today {
        background: #f0fdf4;
      }

      .mr-mobile-period {
        display: grid;
        grid-template-columns: 78px 1fr;
        border-bottom: 1px solid #f0f0f0;
      }

      .mr-mobile-period:last-child {
        border-bottom: 0;
      }

      .mr-mobile-time {
        padding: 12px 8px;
        background: #fafafa;
        font-size: 10px;
        color: #6b7280;
        text-align: center;
      }

      .mr-mobile-class {
        padding: 8px;
      }

      .mr-empty-state {
        padding: 45px 20px;
        text-align: center;
        color: #6b7280;
        background: #fff;
        border: 1px solid #e5e7eb;
        border-radius: 16px;
      }

      @media (max-width: 700px) {
        .mr-viewer-header {
          padding: 12px;
        }

        .mr-viewer-top {
          align-items: flex-start;
        }

        .mr-viewer-title h1 {
          font-size: 18px;
        }

        .mr-viewer-title p {
          font-size: 11px;
        }

        .mr-viewer-body {
          padding: 12px;
        }

        .mr-week-wrap {
          display: none;
        }

        .mr-mobile-days {
          display: block;
        }

        .mr-toolbar {
          align-items: stretch;
        }

        .mr-search {
          width: 100%;
        }

        .mr-actions-mobile {
          width: 100%;
        }

        .mr-actions-mobile .mr-btn {
          flex: 1;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function createViewer() {
    let viewer = document.getElementById(
      "myroutine-viewer"
    );

    if (viewer) return viewer;

    viewer = document.createElement("div");
    viewer.id = "myroutine-viewer";
    viewer.className = "mr-viewer";
    viewer.hidden = true;

    document.body.appendChild(viewer);

    return viewer;
  }

  function getToday() {
    const day = new Date().getDay();

    return DAYS[
      day === 0 ? 6 : day - 1
    ];
  }
  function getFilteredSubject(routine, subject) {
    if (!subject) return false;

    const queryInput = document.getElementById(
      "mr-view-search"
    );

    const query = String(
      queryInput?.value || ""
    )
      .trim()
      .toLowerCase();

    if (!query) return true;

    const text = [
      subject.name,
      subject.code,
      subject.teacher,
      subject.room,
      subject.type
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return text.includes(query);
  }

  function classCard(
    routine,
    day,
    period
  ) {
    const assignment = getAssignment(
      routine,
      day,
      period.id
    );

    const subject =
      getSubjectFromAssignment(
        routine,
        assignment
      );

    if (isBreak(period)) {
      return `
        <div class="mr-class-card break">
          <div class="mr-class-name">
            ${escapeHTML(
              period.name || "Break"
            )}
          </div>
          <div class="mr-class-meta">
            Break / Free time
          </div>
        </div>
      `;
    }

    if (!subject) {
      return `
        <div class="mr-class-card empty">
          <div class="mr-class-name">
            Free
          </div>
          <div class="mr-class-meta">
            No class scheduled
          </div>
        </div>
      `;
    }

    if (!getFilteredSubject(
      routine,
      subject
    )) {
      return `
        <div class="mr-class-card empty">
          <div class="mr-class-name">
            Hidden
          </div>
          <div class="mr-class-meta">
            Does not match search
          </div>
        </div>
      `;
    }

    const teacher = subject.teacher
      ? escapeHTML(subject.teacher)
      : "";

    const room = subject.room
      ? escapeHTML(subject.room)
      : "";

    const meta = [
      teacher,
      room
    ]
      .filter(Boolean)
      .join(" • ");

    return `
      <div class="mr-class-card">
        <div class="mr-class-name">
          ${escapeHTML(
            subject.name ||
            "Untitled Subject"
          )}
        </div>

        ${
          meta
            ? `
              <div class="mr-class-meta">
                ${meta}
              </div>
            `
            : ""
        }

        ${
          subject.code
            ? `
              <span class="mr-class-code">
                ${escapeHTML(
                  subject.code
                )}
              </span>
            `
            : ""
        }
      </div>
    `;
  }

  function renderWeekView(routine) {
    const periods = getPeriods(routine);

    if (!periods.length) {
      return `
        <div class="mr-empty-state">
          <strong>No periods yet</strong>
          <br>
          Add periods in the Routine Editor.
        </div>
      `;
    }

    const today = getToday();

    let html = `
      <div class="mr-week-wrap">
        <div
          class="mr-week-grid"
          style="
            grid-template-rows:
              auto repeat(
                ${periods.length},
                minmax(105px, auto)
              );
          "
        >
          <div class="mr-grid-head">
            Time
          </div>
    `;

    DAYS.forEach(day => {
      html += `
        <div
          class="mr-grid-head mr-day-head ${
            day === today
              ? "today"
              : ""
          }"
        >
          ${day.slice(0, 3)}
          ${
            day === today
              ? `<span class="mr-today-dot"></span>`
              : ""
          }
        </div>
      `;
    });

    periods.forEach(period => {
      html += `
        <div class="mr-grid-time">
          <strong>
            ${escapeHTML(
              period.name ||
              "Period"
            )}
          </strong>
          <br>
          ${
            period.startTime
              ? escapeHTML(
                  formatTime(
                    period.startTime
                  )
                )
              : ""
          }
          ${
            period.endTime
              ? `
                -
                ${escapeHTML(
                  formatTime(
                    period.endTime
                  )
                )}
              `
              : ""
          }
        </div>
      `;

      DAYS.forEach(day => {
        html += `
          <div class="mr-grid-cell">
            ${classCard(
              routine,
              day,
              period
            )}
          </div>
        `;
      });
    });

    html += `
        </div>
      </div>
    `;

    return html;
  }

  function renderMobileView(routine) {
    const periods = getPeriods(routine);

    if (!periods.length) {
      return `
        <div class="mr-empty-state">
          <strong>No periods yet</strong>
          <br>
          Add periods in the Routine Editor.
        </div>
      `;
    }

    const today = getToday();

    let daysToShow = DAYS.slice();

    if (currentDay) {
      daysToShow = [
        currentDay
      ];
    }

    let html = `
      <div class="mr-mobile-days">
    `;

    daysToShow.forEach(day => {
      html += `
        <section class="mr-day-section">

          <div
            class="
              mr-day-section-head
              ${
                day === today
                  ? "today"
                  : ""
              }
            "
          >
            ${day}

            ${
              day === today
                ? `
                  <span
                    class="mr-today-dot"
                  ></span>
                `
                : ""
            }
          </div>
      `;

      periods.forEach(period => {
        html += `
          <div class="mr-mobile-period">

            <div class="mr-mobile-time">
              <strong>
                ${escapeHTML(
                  period.name ||
                  "Period"
                )}
              </strong>

              <br>

              ${
                period.startTime
                  ? escapeHTML(
                      formatTime(
                        period.startTime
                      )
                    )
                  : ""
              }

              ${
                period.endTime
                  ? `
                    <br>
                    ${escapeHTML(
                      formatTime(
                        period.endTime
                      )
                    )}
                  `
                  : ""
              }
            </div>

            <div class="mr-mobile-class">
              ${classCard(
                routine,
                day,
                period
              )}
            </div>

          </div>
        `;
      });

      html += `
        </section>
      `;
    });

    html += `
      </div>
    `;

    return html;
  }

  function renderToolbar() {
    return `
      <div class="mr-toolbar">

        <div class="mr-view-switch">

          <button
            type="button"
            data-view="week"
            class="${
              viewMode === "week"
                ? "active"
                : ""
            }"
          >
            Week
          </button>

          <button
            type="button"
            data-view="day"
            class="${
              viewMode === "day"
                ? "active"
                : ""
            }"
          >
            Day
          </button>

        </div>

        <input
          id="mr-view-search"
          class="mr-search"
          type="search"
          placeholder="Search subjects..."
        />

      </div>
    `;
  }

  function renderDaySelector() {
    if (viewMode !== "day") {
      return "";
    }

    const selected =
      currentDay || getToday();

    return `
      <div
        class="mr-toolbar"
        style="margin-top:-4px;"
      >
        <div class="mr-view-switch">

          ${DAYS.map(day => `
            <button
              type="button"
              data-day="${day}"
              class="${
                day === selected
                  ? "active"
                  : ""
              }"
            >
              ${day.slice(0, 3)}
            </button>
          `).join("")}

        </div>
      </div>
    `;
  }
  function renderAll() {
    const viewer = createViewer();
    const routine = getRoutine();

    if (!routine) {
      viewer.innerHTML = `
        <div class="mr-empty-state">
          No routine selected.
        </div>
      `;

      return;
    }

    const institution =
      routine.institution?.name ||
      routine.institutionName ||
      "";

    const subtitle = [
      institution,
      routine.course,
      routine.section
    ]
      .filter(Boolean)
      .join(" • ");

    viewer.innerHTML = `
      <header class="mr-viewer-header">

        <div class="mr-viewer-top">

          <div class="mr-viewer-title">
            <h1>
              ${escapeHTML(
                routine.name ||
                "My Routine"
              )}
            </h1>

            ${
              subtitle
                ? `
                  <p>
                    ${escapeHTML(
                      subtitle
                    )}
                  </p>
                `
                : `
                  <p>
                    Weekly timetable
                  </p>
                `
            }
          </div>

          <div class="mr-viewer-actions">

            <button
              type="button"
              class="mr-btn"
              id="mr-view-today"
            >
              Today
            </button>

            <button
              type="button"
              class="mr-btn"
              id="mr-view-close"
            >
              Close
            </button>

          </div>

        </div>

      </header>

      <main class="mr-viewer-body">

        ${renderToolbar()}

        ${renderDaySelector()}

        ${
          viewMode === "week"
            ? renderWeekView(routine)
            : renderMobileView(routine)
        }

      </main>
    `;

    bindEvents();
  }

  function bindEvents() {
    const viewer =
      document.getElementById(
        "myroutine-viewer"
      );

    if (!viewer) return;

    const closeButton =
      document.getElementById(
        "mr-view-close"
      );

    if (closeButton) {
      closeButton.onclick =
        closeViewer;
    }

    const todayButton =
      document.getElementById(
        "mr-view-today"
      );

    if (todayButton) {
      todayButton.onclick = () => {
        currentDay = getToday();
        viewMode = "day";
        renderAll();
      };
    }

    viewer
      .querySelectorAll(
        "[data-view]"
      )
      .forEach(button => {
        button.addEventListener(
          "click",
          () => {
            viewMode =
              button.dataset.view;

            if (viewMode === "day") {
              currentDay =
                currentDay ||
                getToday();
            }

            renderAll();
          }
        );
      });

    viewer
      .querySelectorAll(
        "[data-day]"
      )
      .forEach(button => {
        button.addEventListener(
          "click",
          () => {
            currentDay =
              button.dataset.day;

            viewMode = "day";

            renderAll();
          }
        );
      });

    const search =
      document.getElementById(
        "mr-view-search"
      );

    if (search) {
      search.addEventListener(
        "input",
        () => {
          const value =
            search.value;

          renderAll();

          const newSearch =
            document.getElementById(
              "mr-view-search"
            );

          if (newSearch) {
            newSearch.value = value;

            try {
              newSearch.focus();

              newSearch.setSelectionRange(
                value.length,
                value.length
              );
            } catch (_) {}
          }
        }
      );
    }
  }

  function openViewer(routineId) {
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

    currentDay = null;
    viewMode = "week";

    const viewer = createViewer();

    viewer.hidden = false;

    document.body.style.overflow =
      "hidden";

    renderAll();
  }

  function closeViewer() {
    const viewer =
      document.getElementById(
        "myroutine-viewer"
      );

    if (viewer) {
      viewer.hidden = true;
    }

    document.body.style.overflow = "";
  }

  function refreshViewer() {
    const viewer =
      document.getElementById(
        "myroutine-viewer"
      );

    if (
      viewer &&
      !viewer.hidden
    ) {
      renderAll();
    }
  }

  window.MyRoutineViewer = {
    open: openViewer,
    close: closeViewer,
    refresh: refreshViewer
  };
  /*
   * Automatically refresh the viewer whenever
   * the routine engine announces an update.
   */

  window.addEventListener(
    "myroutine:ready",
    function () {
      refreshViewer();
    }
  );

  window.addEventListener(
    "myroutine:updated",
    function () {
      refreshViewer();
    }
  );

  window.addEventListener(
    "keydown",
    function (event) {
      if (
        event.key === "Escape"
      ) {
        const viewer =
          document.getElementById(
            "myroutine-viewer"
          );

        if (
          viewer &&
          !viewer.hidden
        ) {
          closeViewer();
        }
      }
    }
  );

})();