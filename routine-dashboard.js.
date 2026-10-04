/* =========================================================
   MyRoutine — Dashboard Workspace
   File: routine-dashboard.js
   ========================================================= */

(function () {
  "use strict";

  const VERSION = "1.0.0";

  let root = null;
  let currentRoutineId = null;

  /* ---------------------------------------------------------
     Helpers
     --------------------------------------------------------- */

  function getApp() {
    return window.MyRoutine || null;
  }

  function getActiveRoutine() {
    const app = getApp();

    if (
      app &&
      typeof app.getActiveRoutine === "function"
    ) {
      return app.getActiveRoutine();
    }

    return null;
  }

  function getRoutine(id) {
    const app = getApp();

    if (!app) return null;

    if (
      typeof app.getRoutine === "function"
    ) {
      return app.getRoutine(id);
    }

    if (
      app.state &&
      app.state.data &&
      Array.isArray(app.state.data.routines)
    ) {
      return app.state.data.routines.find(
        routine => routine.id === id
      ) || null;
    }

    return null;
  }

  function escapeHTML(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function dispatch(name, detail) {
    document.dispatchEvent(
      new CustomEvent(name, {
        detail: detail || {}
      })
    );
  }

  /* ---------------------------------------------------------
     Dashboard statistics
     --------------------------------------------------------- */

  function getStats(routine) {
    routine =
      routine ||
      getActiveRoutine();

    if (!routine) {
      return {
        periods: 0,
        subjects: 0,
        scheduled: 0,
        events: 0
      };
    }

    let scheduled = 0;

    if (
      routine.schedule &&
      typeof routine.schedule === "object"
    ) {
      Object.values(
        routine.schedule
      ).forEach(day => {
        if (
          day &&
          typeof day === "object"
        ) {
          Object.values(day)
            .forEach(value => {
              if (value) {
                scheduled++;
              }
            });
        }
      });
    }

    const events =
      routine.calendar &&
      Array.isArray(
        routine.calendar.events
      )
        ? routine.calendar.events.length
        : 0;

    return {
      periods:
        Array.isArray(routine.periods)
          ? routine.periods.length
          : 0,

      subjects:
        Array.isArray(routine.subjects)
          ? routine.subjects.length
          : 0,

      scheduled,

      events
    };
  }

  /* ---------------------------------------------------------
     Today's information
     --------------------------------------------------------- */

  function getTodayName() {
    return [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday"
    ][new Date().getDay()];
  }

  function getTodaySchedule(routine) {
    if (!routine) return [];

    const day =
      getTodayName();

    if (
      routine.schedule &&
      routine.schedule[day]
    ) {
      return routine.schedule[day];
    }

    return [];
  }

  function getTodayEvents(routine) {
    if (
      !routine ||
      !routine.calendar ||
      !Array.isArray(
        routine.calendar.events
      )
    ) {
      return [];
    }

    const now =
      new Date();

    const date =
      now.getFullYear() +
      "-" +
      String(
        now.getMonth() + 1
      ).padStart(2, "0") +
      "-" +
      String(
        now.getDate()
      ).padStart(2, "0");

    return routine.calendar.events.filter(
      event => event.date === date
    );
  }

  /* ---------------------------------------------------------
     Dashboard actions
     --------------------------------------------------------- */

  function openEditor() {
    const routine =
      getActiveRoutine();

    if (
      routine &&
      window.MyRoutineEditor &&
      typeof window.MyRoutineEditor.open ===
        "function"
    ) {
      window.MyRoutineEditor.open(
        routine.id
      );

      return;
    }

    dispatch(
      "myroutine:dashboard-action",
      {
        action: "edit",
        routine
      }
    );
  }

  function openViewer() {
    const routine =
      getActiveRoutine();

    if (
      routine &&
      window.MyRoutineViewer &&
      typeof window.MyRoutineViewer.open ===
        "function"
    ) {
      window.MyRoutineViewer.open(
        routine.id
      );

      return;
    }

    dispatch(
      "myroutine:dashboard-action",
      {
        action: "view",
        routine
      }
    );
  }

  function openCalendar() {
    const routine =
      getActiveRoutine();

    if (
      routine &&
      window.MyRoutineCalendar &&
      typeof window.MyRoutineCalendar.open ===
        "function"
    ) {
      window.MyRoutineCalendar.open(
        routine.id
      );

      return;
    }

    dispatch(
      "myroutine:dashboard-action",
      {
        action: "calendar",
        routine
      }
    );
  }

  function openSettings() {
    if (
      window.MyRoutineSettings &&
      typeof window.MyRoutineSettings.open ===
        "function"
    ) {
      window.MyRoutineSettings.open();

      return;
    }

    dispatch(
      "myroutine:dashboard-action",
      {
        action: "settings"
      }
    );
  }

  function openNotifications() {
    if (
      window.MyRoutineNotifications &&
      typeof window.MyRoutineNotifications.open ===
        "function"
    ) {
      window.MyRoutineNotifications.open();

      return;
    }

    dispatch(
      "myroutine:dashboard-action",
      {
        action: "notifications"
      }
    );
  }

  function openTemplates() {
    if (
      window.MyRoutineTemplates &&
      typeof window.MyRoutineTemplates.open ===
        "function"
    ) {
      window.MyRoutineTemplates.open();

      return;
    }

    dispatch(
      "myroutine:dashboard-action",
      {
        action: "templates"
      }
    );
  }

  /* ---------------------------------------------------------
     Public API
     --------------------------------------------------------- */

  window.MyRoutineDashboard = {
    VERSION,

    mount,
    unmount,
    refresh,

    getStats,

    openEditor,
    openViewer,
    openCalendar,
    openSettings,
    openNotifications,
    openTemplates
  };

})();
/* =========================================================
   Dashboard Workspace UI
   ========================================================= */

(function () {
  "use strict";

  const dashboard =
    window.MyRoutineDashboard;

  if (!dashboard) return;

  let mounted = false;

  /* ---------------------------------------------------------
     Styles
     --------------------------------------------------------- */

  function injectStyles() {
    if (
      document.getElementById(
        "myroutine-dashboard-styles"
      )
    ) {
      return;
    }

    const style =
      document.createElement("style");

    style.id =
      "myroutine-dashboard-styles";

    style.textContent = `
      .mr-dashboard {
        width: 100%;
        min-height: 100%;
        box-sizing: border-box;
        padding: 20px;
        font-family:
          system-ui,
          -apple-system,
          BlinkMacSystemFont,
          "Segoe UI",
          sans-serif;
      }

      .mr-dashboard *,
      .mr-dashboard *::before,
      .mr-dashboard *::after {
        box-sizing: border-box;
      }

      .mr-dashboard-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        margin-bottom: 22px;
      }

      .mr-dashboard-brand {
        min-width: 0;
      }

      .mr-dashboard-eyebrow {
        font-size: 11px;
        font-weight: 800;
        letter-spacing: .08em;
        text-transform: uppercase;
        opacity: .55;
      }

      .mr-dashboard-title {
        margin: 4px 0 0;
        font-size: 28px;
        line-height: 1.15;
      }

      .mr-dashboard-subtitle {
        margin: 6px 0 0;
        font-size: 13px;
        opacity: .62;
      }

      .mr-dashboard-header-actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      .mr-dashboard-button {
        border: 1px solid rgba(127,127,127,.18);
        background: transparent;
        color: inherit;
        border-radius: 11px;
        min-height: 40px;
        padding: 0 13px;
        cursor: pointer;
        font-weight: 700;
      }

      .mr-dashboard-button:hover {
        background: rgba(127,127,127,.08);
      }

      .mr-dashboard-button.primary {
        background: rgba(70,110,240,.14);
      }

      .mr-dashboard-stats {
        display: grid;
        grid-template-columns:
          repeat(4, minmax(0, 1fr));
        gap: 12px;
        margin-bottom: 18px;
      }

      .mr-dashboard-stat {
        padding: 16px;
        border:
          1px solid rgba(127,127,127,.15);
        border-radius: 17px;
        background: rgba(127,127,127,.035);
      }

      .mr-dashboard-stat-label {
        font-size: 11px;
        font-weight: 700;
        opacity: .55;
      }

      .mr-dashboard-stat-value {
        margin-top: 7px;
        font-size: 25px;
        font-weight: 800;
      }

      .mr-dashboard-layout {
        display: grid;
        grid-template-columns:
          minmax(0, 1.4fr)
          minmax(280px, .6fr);
        gap: 16px;
      }

      .mr-dashboard-panel {
        border:
          1px solid rgba(127,127,127,.15);
        border-radius: 19px;
        overflow: hidden;
        background: rgba(127,127,127,.025);
      }

      .mr-dashboard-panel-header {
        padding: 15px 17px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        border-bottom:
          1px solid rgba(127,127,127,.12);
      }

      .mr-dashboard-panel-header h3 {
        margin: 0;
        font-size: 15px;
      }

      .mr-dashboard-panel-header span {
        font-size: 11px;
        opacity: .55;
      }

      .mr-dashboard-actions {
        padding: 15px;
        display: grid;
        grid-template-columns:
          repeat(2, minmax(0, 1fr));
        gap: 9px;
      }

      .mr-dashboard-action {
        min-height: 76px;
        padding: 12px;
        border:
          1px solid rgba(127,127,127,.14);
        border-radius: 13px;
        background: transparent;
        color: inherit;
        cursor: pointer;
        text-align: left;
      }

      .mr-dashboard-action:hover {
        background: rgba(127,127,127,.07);
      }

      .mr-dashboard-action-icon {
        font-size: 21px;
      }

      .mr-dashboard-action strong {
        display: block;
        margin-top: 6px;
        font-size: 13px;
      }

      .mr-dashboard-action span {
        display: block;
        margin-top: 2px;
        font-size: 10px;
        opacity: .55;
      }

      .mr-dashboard-list {
        padding: 8px 15px 15px;
      }

      .mr-dashboard-list-item {
        padding: 12px 0;
        display: flex;
        align-items: center;
        gap: 11px;
        border-bottom:
          1px solid rgba(127,127,127,.10);
      }

      .mr-dashboard-list-item:last-child {
        border-bottom: 0;
      }

      .mr-dashboard-list-icon {
        width: 38px;
        height: 38px;
        flex: 0 0 38px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 11px;
        background: rgba(70,110,240,.10);
      }

      .mr-dashboard-list-content {
        min-width: 0;
        flex: 1;
      }

      .mr-dashboard-list-content strong {
        display: block;
        font-size: 13px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .mr-dashboard-list-content span {
        display: block;
        margin-top: 3px;
        font-size: 10px;
        opacity: .55;
      }

      .mr-dashboard-empty {
        padding: 28px 15px;
        text-align: center;
        opacity: .6;
      }

      .mr-dashboard-empty-icon {
        font-size: 30px;
        margin-bottom: 8px;
      }

      .mr-dashboard-empty strong {
        display: block;
        font-size: 14px;
      }

      .mr-dashboard-empty span {
        display: block;
        margin-top: 4px;
        font-size: 11px;
      }

      @media (max-width: 850px) {
        .mr-dashboard-layout {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 650px) {
        .mr-dashboard {
          padding: 13px;
        }

        .mr-dashboard-header {
          align-items: flex-start;
          flex-direction: column;
        }

        .mr-dashboard-title {
          font-size: 23px;
        }

        .mr-dashboard-stats {
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
        }

        .mr-dashboard-actions {
          grid-template-columns: 1fr;
        }

        .mr-dashboard-header-actions {
          width: 100%;
        }

        .mr-dashboard-header-actions
        .mr-dashboard-button {
          flex: 1;
        }
      }
    `;

    document.head.appendChild(style);
  }

  /* ---------------------------------------------------------
     Render routine information
     --------------------------------------------------------- */

  function renderRoutineHeader(routine) {
    if (!routine) {
      return `
        <div class="mr-dashboard-brand">
          <div class="mr-dashboard-eyebrow">
            MyRoutine
          </div>

          <h1 class="mr-dashboard-title">
            Your Routine Workspace
          </h1>

          <p class="mr-dashboard-subtitle">
            Create or select a routine to get started.
          </p>
        </div>
      `;
    }

    const institution =
      routine.institutionName ||
      routine.institutionType ||
      "";

    const details =
      [
        institution,
        routine.course,
        routine.section,
        routine.session
      ]
        .filter(Boolean)
        .join(" • ");

    return `
      <div class="mr-dashboard-brand">

        <div class="mr-dashboard-eyebrow">
          MyRoutine Workspace
        </div>

        <h1 class="mr-dashboard-title">
          ${escapeHTML(
            routine.name ||
            "My Routine"
          )}
        </h1>

        <p class="mr-dashboard-subtitle">
          ${escapeHTML(
            details ||
            "Your universal routine dashboard"
          )}
        </p>

      </div>
    `;
  }

  /* ---------------------------------------------------------
     Statistics
     --------------------------------------------------------- */

  function renderStats(routine) {
    const stats =
      dashboard.getStats(routine);

    return `
      <section class="mr-dashboard-stats">

        <div class="mr-dashboard-stat">
          <div class="mr-dashboard-stat-label">
            PERIODS
          </div>
          <div class="mr-dashboard-stat-value">
            ${stats.periods}
          </div>
        </div>

        <div class="mr-dashboard-stat">
          <div class="mr-dashboard-stat-label">
            SUBJECTS
          </div>
          <div class="mr-dashboard-stat-value">
            ${stats.subjects}
          </div>
        </div>

        <div class="mr-dashboard-stat">
          <div class="mr-dashboard-stat-label">
            SCHEDULED
          </div>
          <div class="mr-dashboard-stat-value">
            ${stats.scheduled}
          </div>
        </div>

        <div class="mr-dashboard-stat">
          <div class="mr-dashboard-stat-label">
            EVENTS
          </div>
          <div class="mr-dashboard-stat-value">
            ${stats.events}
          </div>
        </div>

      </section>
    `;
  }

  /* ---------------------------------------------------------
     Quick actions
     --------------------------------------------------------- */

  function renderActions() {
    return `
      <section class="mr-dashboard-panel">

        <div class="mr-dashboard-panel-header">
          <h3>Workspace</h3>
          <span>Quick actions</span>
        </div>

        <div class="mr-dashboard-actions">

          <button
            type="button"
            class="mr-dashboard-action"
            data-dashboard-action="edit"
          >
            <div class="mr-dashboard-action-icon">
              ✏️
            </div>
            <strong>Edit Routine</strong>
            <span>
              Subjects, periods and schedule
            </span>
          </button>

          <button
            type="button"
            class="mr-dashboard-action"
            data-dashboard-action="view"
          >
            <div class="mr-dashboard-action-icon">
              👀
            </div>
            <strong>View Timetable</strong>
            <span>
              See your weekly routine
            </span>
          </button>

          <button
            type="button"
            class="mr-dashboard-action"
            data-dashboard-action="calendar"
          >
            <div class="mr-dashboard-action-icon">
              📅
            </div>
            <strong>Calendar</strong>
            <span>
              Exams, holidays and events
            </span>
          </button>

          <button
            type="button"
            class="mr-dashboard-action"
            data-dashboard-action="templates"
          >
            <div class="mr-dashboard-action-icon">
              🧩
            </div>
            <strong>Templates</strong>
            <span>
              Create a new routine setup
            </span>
          </button>

          <button
            type="button"
            class="mr-dashboard-action"
            data-dashboard-action="notifications"
          >
            <div class="mr-dashboard-action-icon">
              🔔
            </div>
            <strong>Notifications</strong>
            <span>
              Manage reminders
            </span>
          </button>

          <button
            type="button"
            class="mr-dashboard-action"
            data-dashboard-action="settings"
          >
            <div class="mr-dashboard-action-icon">
              ⚙️
            </div>
            <strong>Settings</strong>
            <span>
              Customize MyRoutine
            </span>
          </button>

        </div>

      </section>
    `;
  }

  /* ---------------------------------------------------------
     Today's schedule
     --------------------------------------------------------- */

  function renderToday(routine) {
    if (!routine) {
      return `
        <section class="mr-dashboard-panel">

          <div class="mr-dashboard-panel-header">
            <h3>Today</h3>
            <span>No routine selected</span>
          </div>

          <div class="mr-dashboard-empty">
            <div class="mr-dashboard-empty-icon">
              🗓️
            </div>

            <strong>
              Nothing to show yet
            </strong>

            <span>
              Select or create a routine first.
            </span>
          </div>

        </section>
      `;
    }

    const schedule =
      getTodaySchedule(routine);

    const events =
      getTodayEvents(routine);

    const items = [];

    Object.entries(
      schedule || {}
    ).forEach(([periodId, value]) => {
      if (!value) return;

      const period =
        Array.isArray(routine.periods)
          ? routine.periods.find(
              item => item.id === periodId
            )
          : null;

      const subject =
        Array.isArray(routine.subjects)
          ? routine.subjects.find(
              item =>
                item.id === value ||
                item.id === value.subjectId
            )
          : null;

      items.push({
        type: "class",
        title:
          subject?.name ||
          value?.subjectName ||
          value?.title ||
          "Scheduled class",
        time:
          period
            ? `${period.startTime || ""} – ${period.endTime || ""}`
            : ""
      });
    });

    events.forEach(event => {
      items.push({
        type: event.type,
        title:
          event.title ||
          "Calendar event",
        time:
          event.startTime ||
          ""
      });
    });

    return `
      <section class="mr-dashboard-panel">

        <div class="mr-dashboard-panel-header">
          <h3>Today</h3>
          <span>
            ${escapeHTML(
              getTodayName()
            )}
          </span>
        </div>

        <div class="mr-dashboard-list">

          ${
            items.length
              ? items.map(item => `
                <div class="mr-dashboard-list-item">

                  <div class="mr-dashboard-list-icon">
                    ${
                      item.type === "exam"
                        ? "📝"
                        : item.type === "holiday"
                        ? "🏖️"
                        : item.type === "event"
                        ? "📅"
                        : "📚"
                    }
                  </div>

                  <div class="mr-dashboard-list-content">

                    <strong>
                      ${escapeHTML(
                        item.title
                      )}
                    </strong>

                    ${
                      item.time
                        ? `<span>
                            ${escapeHTML(
                              item.time
                            )}
                           </span>`
                        : `<span>
                            ${escapeHTML(
                              item.type
                            )}
                           </span>`
                    }

                  </div>

                </div>
              `).join("")
              : `
                <div class="mr-dashboard-empty">
                  <div class="mr-dashboard-empty-icon">
                    ☀️
                  </div>

                  <strong>
                    Nothing scheduled today
                  </strong>

                  <span>
                    Enjoy the free time or add something.
                  </span>
                </div>
              `
          }

        </div>

      </section>
    `;
  }

})();
/* =========================================================
   Dashboard Renderer + Interaction Layer
   ========================================================= */

(function () {
  "use strict";

  const dashboard =
    window.MyRoutineDashboard;

  if (!dashboard) return;

  /* ---------------------------------------------------------
     Local helpers
     --------------------------------------------------------- */

  function escapeHTML(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function getRoutine() {
    if (
      window.MyRoutine &&
      typeof window.MyRoutine.getActiveRoutine ===
        "function"
    ) {
      return window.MyRoutine.getActiveRoutine();
    }

    return null;
  }

  /* ---------------------------------------------------------
     Main renderer
     --------------------------------------------------------- */

  function render() {
    if (!root) {
      return;
    }

    const routine =
      getRoutine();

    root.innerHTML = `
      <div class="mr-dashboard">

        <header class="mr-dashboard-header">

          ${renderHeader(routine)}

          <div class="mr-dashboard-header-actions">

            <button
              type="button"
              class="mr-dashboard-button"
              data-dashboard-action="notifications"
            >
              🔔
            </button>

            <button
              type="button"
              class="mr-dashboard-button"
              data-dashboard-action="settings"
            >
              ⚙️
            </button>

            <button
              type="button"
              class="
                mr-dashboard-button
                primary
              "
              data-dashboard-action="edit"
            >
              Edit Routine
            </button>

          </div>

        </header>

        ${renderStats(routine)}

        <div class="mr-dashboard-layout">

          <div>

            ${renderActions()}

          </div>

          <div>

            ${renderToday(routine)}

          </div>

        </div>

      </div>
    `;

    bindActions();
  }

  /* ---------------------------------------------------------
     Header
     --------------------------------------------------------- */

  function renderHeader(routine) {
    if (!routine) {
      return `
        <div class="mr-dashboard-brand">

          <div class="mr-dashboard-eyebrow">
            MyRoutine
          </div>

          <h1 class="mr-dashboard-title">
            Your Routine Workspace
          </h1>

          <p class="mr-dashboard-subtitle">
            Create or select a routine to get started.
          </p>

        </div>
      `;
    }

    const institution =
      routine.institutionName ||
      routine.institutionType ||
      "";

    const details = [
      institution,
      routine.course,
      routine.section,
      routine.session
    ]
      .filter(Boolean)
      .join(" • ");

    return `
      <div class="mr-dashboard-brand">

        <div class="mr-dashboard-eyebrow">
          MyRoutine Workspace
        </div>

        <h1 class="mr-dashboard-title">
          ${escapeHTML(
            routine.name ||
            "My Routine"
          )}
        </h1>

        <p class="mr-dashboard-subtitle">
          ${escapeHTML(
            details ||
            "Your universal routine dashboard"
          )}
        </p>

      </div>
    `;
  }

  /* ---------------------------------------------------------
     Bind dashboard buttons
     --------------------------------------------------------- */

  function bindActions() {
    if (!root) return;

    root
      .querySelectorAll(
        "[data-dashboard-action]"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          () => {

            const action =
              button.dataset
                .dashboardAction;

            switch (action) {

              case "edit":
                dashboard.openEditor();
                break;

              case "view":
                dashboard.openViewer();
                break;

              case "calendar":
                dashboard.openCalendar();
                break;

              case "settings":
                dashboard.openSettings();
                break;

              case "notifications":
                dashboard.openNotifications();
                break;

              case "templates":
                dashboard.openTemplates();
                break;

              default:
                break;
            }
          }
        );
      });
  }

  /* ---------------------------------------------------------
     Mount dashboard
     --------------------------------------------------------- */

  function mount(target) {
    injectStyles();

    if (mounted) {
      render();
      return;
    }

    if (typeof target === "string") {
      root =
        document.querySelector(target);
    } else if (
      target instanceof HTMLElement
    ) {
      root = target;
    } else {
      root =
        document.getElementById(
          "myroutine-dashboard"
        );
    }

    if (!root) {
      root =
        document.createElement("div");

      root.id =
        "myroutine-dashboard";

      document.body.appendChild(root);
    }

    mounted = true;

    render();

    document.dispatchEvent(
      new CustomEvent(
        "myroutine:dashboard-mounted"
      )
    );
  }

  /* ---------------------------------------------------------
     Unmount
     --------------------------------------------------------- */

  function unmount() {
    if (!root) {
      return;
    }

    root.innerHTML = "";

    mounted = false;
  }

  /* ---------------------------------------------------------
     Refresh
     --------------------------------------------------------- */

  function refresh() {
    if (!mounted) {
      return;
    }

    render();
  }

  /* ---------------------------------------------------------
     Event listeners
     --------------------------------------------------------- */

  document.addEventListener(
    "myroutine:ready",
    function () {
      refresh();
    }
  );

  document.addEventListener(
    "myroutine:storage-loaded",
    function () {
      refresh();
    }
  );

  document.addEventListener(
    "myroutine:calendar-changed",
    function () {
      refresh();
    }
  );

  document.addEventListener(
    "myroutine:calendar-updated",
    function () {
      refresh();
    }
  );

  document.addEventListener(
    "myroutine:notification-settings-changed",
    function () {
      refresh();
    }
  );

  document.addEventListener(
    "myroutine:template-created",
    function () {
      refresh();
    }
  );

})();
/* =========================================================
   MyRoutine — Dashboard Finalization
   ========================================================= */

(function () {
  "use strict";

  const dashboard =
    window.MyRoutineDashboard;

  if (!dashboard) return;

  /* ---------------------------------------------------------
     Dashboard state
     --------------------------------------------------------- */

  function getCurrentRoutineId() {
    if (
      window.MyRoutine &&
      window.MyRoutine.state
    ) {
      return (
        window.MyRoutine.state
          .activeRoutineId || null
      );
    }

    return null;
  }

  function setCurrentRoutine(id) {
    if (
      window.MyRoutine &&
      window.MyRoutine.state
    ) {
      window.MyRoutine.state.activeRoutineId =
        id;
    }

    document.dispatchEvent(
      new CustomEvent(
        "myroutine:routine-selected",
        {
          detail: {
            routineId: id
          }
        }
      )
    );

    dashboard.refresh();
  }

  /* ---------------------------------------------------------
     Routine selector
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
      return window.MyRoutine.state
        .data.routines;
    }

    return [];
  }

  function selectRoutine(id) {
    const routine =
      getRoutines().find(
        item => item.id === id
      );

    if (!routine) {
      return false;
    }

    setCurrentRoutine(id);

    if (
      window.MyRoutine &&
      typeof window.MyRoutine.saveRoutines ===
        "function"
    ) {
      window.MyRoutine.saveRoutines();
    }

    return true;
  }

  /* ---------------------------------------------------------
     Dashboard snapshot
     --------------------------------------------------------- */

  function getSnapshot() {
    const routines =
      getRoutines();

    const activeId =
      getCurrentRoutineId();

    const active =
      routines.find(
        routine =>
          routine.id === activeId
      ) || null;

    return {
      activeRoutineId:
        activeId,

      activeRoutine:
        active,

      routineCount:
        routines.length,

      stats:
        dashboard.getStats(active)
    };
  }

  /* ---------------------------------------------------------
     Workspace shortcut
     --------------------------------------------------------- */

  function openWorkspace() {
    const routine =
      getRoutines().find(
        item =>
          item.id ===
          getCurrentRoutineId()
      );

    if (routine) {
      dashboard.openViewer();
    } else {
      dashboard.openTemplates();
    }
  }

  /* ---------------------------------------------------------
     Dashboard keyboard shortcuts
     --------------------------------------------------------- */

  function keyboardHandler(event) {
    /*
      Don't intercept typing inside inputs,
      textareas or editable elements.
    */

    const target =
      event.target;

    if (
      target &&
      (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      )
    ) {
      return;
    }

    /*
      E = Editor
      V = Viewer
      C = Calendar
      S = Settings
      N = Notifications
    */

    switch (
      String(event.key || "")
        .toLowerCase()
    ) {
      case "e":
        dashboard.openEditor();
        break;

      case "v":
        dashboard.openViewer();
        break;

      case "c":
        dashboard.openCalendar();
        break;

      case "s":
        dashboard.openSettings();
        break;

      case "n":
        dashboard.openNotifications();
        break;

      default:
        break;
    }
  }

  /* ---------------------------------------------------------
     Public API
     --------------------------------------------------------- */

  dashboard.getRoutines =
    getRoutines;

  dashboard.selectRoutine =
    selectRoutine;

  dashboard.getCurrentRoutineId =
    getCurrentRoutineId;

  dashboard.getSnapshot =
    getSnapshot;

  dashboard.openWorkspace =
    openWorkspace;

  /* ---------------------------------------------------------
     Keyboard shortcuts
     --------------------------------------------------------- */

  document.addEventListener(
    "keydown",
    keyboardHandler
  );

  /* ---------------------------------------------------------
     Initial state
     --------------------------------------------------------- */

  setTimeout(
    function () {
      if (
        window.MyRoutine &&
        typeof window.MyRoutine.getActiveRoutine ===
          "function"
      ) {
        dashboard.refresh();
      }
    },
    300
  );

  console.log(
    "MyRoutine Dashboard ready."
  );

})();