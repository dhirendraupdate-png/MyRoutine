/* =========================================================
   MyRoutine — Calendar Module
   File: routine-calendar.js
   Purpose: Monthly / weekly calendar + date-based events
   ========================================================= */

(function () {
  "use strict";

  const VERSION = "1.0.0";

  const EVENT_TYPES = {
    CLASS: "class",
    EXAM: "exam",
    HOLIDAY: "holiday",
    EVENT: "event",
    NOTE: "note"
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

  let currentRoutineId = null;
  let currentDate = new Date();
  let selectedDate = null;

  /* ---------------------------------------------------------
     Basic helpers
     --------------------------------------------------------- */

  function getMyRoutine() {
    return window.MyRoutine || null;
  }

  function getRoutine(id) {
    const app = getMyRoutine();
    if (!app) return null;

    if (typeof app.getRoutine === "function") {
      return app.getRoutine(id);
    }

    if (typeof app.getActiveRoutine === "function" && !id) {
      return app.getActiveRoutine();
    }

    if (app.state && app.state.data && Array.isArray(app.state.data.routines)) {
      return app.state.data.routines.find(r => r.id === id) || null;
    }

    return null;
  }

  function getActiveRoutine() {
    const app = getMyRoutine();
    if (!app) return null;

    if (typeof app.getActiveRoutine === "function") {
      return app.getActiveRoutine();
    }

    if (app.state && app.state.activeRoutineId) {
      return getRoutine(app.state.activeRoutineId);
    }

    return null;
  }

  function ensureCalendar(routine) {
    if (!routine) return null;

    if (!routine.calendar || typeof routine.calendar !== "object") {
      routine.calendar = {
        events: []
      };
    }

    if (!Array.isArray(routine.calendar.events)) {
      routine.calendar.events = [];
    }

    return routine.calendar;
  }

  function generateId(prefix) {
    return (
      prefix +
      "_" +
      Date.now().toString(36) +
      "_" +
      Math.random().toString(36).slice(2, 8)
    );
  }

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function toISODate(date) {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      return "";
    }

    return (
      date.getFullYear() +
      "-" +
      pad(date.getMonth() + 1) +
      "-" +
      pad(date.getDate())
    );
  }

  function fromISODate(value) {
    if (!value) return null;

    const parts = String(value).split("-").map(Number);

    if (parts.length !== 3 || parts.some(isNaN)) {
      return null;
    }

    return new Date(parts[0], parts[1] - 1, parts[2]);
  }

  function formatDate(date, options) {
    if (!(date instanceof Date)) return "";

    return date.toLocaleDateString(
      undefined,
      options || {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
      }
    );
  }

  function sameDate(a, b) {
    return toISODate(a) === toISODate(b);
  }

  function isToday(date) {
    return sameDate(date, new Date());
  }

  function getMonthStart(date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  function getMonthEnd(date) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
  }

  function getMonday(date) {
    const d = new Date(date);
    const day = d.getDay();

    const diff = day === 0 ? -6 : 1 - day;

    d.setDate(d.getDate() + diff);
    return d;
  }

  function addDays(date, amount) {
    const result = new Date(date);
    result.setDate(result.getDate() + amount);
    return result;
  }

  function addMonths(date, amount) {
    return new Date(
      date.getFullYear(),
      date.getMonth() + amount,
      1
    );
  }

  /* ---------------------------------------------------------
     Event helpers
     --------------------------------------------------------- */

  function normalizeEvent(event) {
    const source = event || {};

    return {
      id: source.id || generateId("event"),
      date: source.date || toISODate(new Date()),
      title: source.title || "Untitled Event",
      type: source.type || EVENT_TYPES.EVENT,
      description: source.description || "",
      startTime: source.startTime || "",
      endTime: source.endTime || "",
      subjectId: source.subjectId || null,
      periodId: source.periodId || null,
      location: source.location || "",
      color: source.color || "",
      allDay: source.allDay !== false,
      createdAt: source.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  function getEvents(routine, date) {
    const calendar = ensureCalendar(routine);
    if (!calendar) return [];

    if (!date) {
      return calendar.events.slice();
    }

    const dateKey =
      date instanceof Date ? toISODate(date) : String(date);

    return calendar.events.filter(event => event.date === dateKey);
  }

  function getEvent(routine, eventId) {
    const calendar = ensureCalendar(routine);

    return calendar.events.find(
      event => event.id === eventId
    ) || null;
  }

  function addEvent(routineId, eventData) {
    const routine = getRoutine(routineId) || getActiveRoutine();
    if (!routine) return null;

    const calendar = ensureCalendar(routine);
    const event = normalizeEvent(eventData);

    calendar.events.push(event);

    saveRoutine();

    return event;
  }

  function updateEvent(routineId, eventId, updates) {
    const routine = getRoutine(routineId) || getActiveRoutine();
    if (!routine) return null;

    const calendar = ensureCalendar(routine);

    const index = calendar.events.findIndex(
      event => event.id === eventId
    );

    if (index === -1) return null;

    calendar.events[index] = {
      ...calendar.events[index],
      ...updates,
      id: calendar.events[index].id,
      updatedAt: new Date().toISOString()
    };

    saveRoutine();

    return calendar.events[index];
  }

  function removeEvent(routineId, eventId) {
    const routine = getRoutine(routineId) || getActiveRoutine();
    if (!routine) return false;

    const calendar = ensureCalendar(routine);

    const oldLength = calendar.events.length;

    calendar.events = calendar.events.filter(
      event => event.id !== eventId
    );

    const removed = calendar.events.length !== oldLength;

    if (removed) {
      saveRoutine();
    }

    return removed;
  }

  /* ---------------------------------------------------------
     Save helper
     --------------------------------------------------------- */

  function saveRoutine() {
    const app = getMyRoutine();

    if (!app) return;

    if (typeof app.saveRoutines === "function") {
      app.saveRoutines();
    }

    document.dispatchEvent(
      new CustomEvent("myroutine:calendar-changed", {
        detail: {
          routineId: currentRoutineId
        }
      })
    );
  }

  /* ---------------------------------------------------------
     Public API - first section
     --------------------------------------------------------- */

  window.MyRoutineCalendar = {
    VERSION,
    EVENT_TYPES,
    DAYS,

    open,
    close,
    refresh,

    addEvent,
    updateEvent,
    removeEvent,

    getEvents,
    getEvent,

    toISODate,
    fromISODate,
    formatDate,
    isToday
  };

})();
/* =========================================================
   Calendar Navigation + Date Utilities
   ========================================================= */

(function () {
  "use strict";

  const calendar = window.MyRoutineCalendar;
  if (!calendar) return;

  /* ---------------------------------------------------------
     Internal state
     --------------------------------------------------------- */

  let state = {
    view: "month",
    date: new Date(),
    selectedDate: null
  };

  function getRoutine() {
    if (typeof window.MyRoutine?.getActiveRoutine === "function") {
      return window.MyRoutine.getActiveRoutine();
    }

    return null;
  }

  function getCalendarEvents(date) {
    const routine = getRoutine();
    if (!routine) return [];

    return calendar.getEvents(routine, date);
  }

  /* ---------------------------------------------------------
     Month helpers
     --------------------------------------------------------- */

  function getMonthName(date) {
    return date.toLocaleDateString(undefined, {
      month: "long",
      year: "numeric"
    });
  }

  function getDayName(date) {
    return date.toLocaleDateString(undefined, {
      weekday: "short"
    });
  }

  function getMonthDays(date) {
    const firstDay = new Date(
      date.getFullYear(),
      date.getMonth(),
      1
    );

    const lastDay = new Date(
      date.getFullYear(),
      date.getMonth() + 1,
      0
    );

    let startOffset = firstDay.getDay();

    // Monday-first calendar
    startOffset = startOffset === 0 ? 6 : startOffset - 1;

    const days = [];

    for (let i = startOffset; i > 0; i--) {
      const d = new Date(firstDay);
      d.setDate(d.getDate() - i);

      days.push({
        date: d,
        currentMonth: false
      });
    }

    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push({
        date: new Date(
          date.getFullYear(),
          date.getMonth(),
          day
        ),
        currentMonth: true
      });
    }

    let nextDay = 1;

    while (days.length < 42) {
      days.push({
        date: new Date(
          date.getFullYear(),
          date.getMonth() + 1,
          nextDay++
        ),
        currentMonth: false
      });
    }

    return days;
  }

  /* ---------------------------------------------------------
     Navigation
     --------------------------------------------------------- */

  function previousMonth() {
    state.date = new Date(
      state.date.getFullYear(),
      state.date.getMonth() - 1,
      1
    );

    render();
  }

  function nextMonth() {
    state.date = new Date(
      state.date.getFullYear(),
      state.date.getMonth() + 1,
      1
    );

    render();
  }

  function goToday() {
    state.date = new Date();
    state.selectedDate = calendar.toISODate(state.date);

    render();
  }

  function previousWeek() {
    const d = new Date(state.date);
    d.setDate(d.getDate() - 7);

    state.date = d;
    render();
  }

  function nextWeek() {
    const d = new Date(state.date);
    d.setDate(d.getDate() + 7);

    state.date = d;
    render();
  }

  function selectDate(date) {
    state.selectedDate = calendar.toISODate(date);
    state.date = new Date(date);

    render();
  }

  /* ---------------------------------------------------------
     Event display
     --------------------------------------------------------- */

  function getEventIcon(type) {
    switch (type) {
      case "class":
        return "📚";

      case "exam":
        return "📝";

      case "holiday":
        return "🏖️";

      case "event":
        return "📅";

      case "note":
        return "📌";

      default:
        return "•";
    }
  }

  function escapeHTML(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function renderEvents(events) {
    if (!events.length) return "";

    return events
      .slice(0, 3)
      .map(event => {
        const title = escapeHTML(event.title);
        const icon = getEventIcon(event.type);

        return `
          <div
            class="mr-calendar-event mr-calendar-event-${escapeHTML(event.type)}"
            data-event-id="${escapeHTML(event.id)}"
            title="${title}"
          >
            <span>${icon}</span>
            <span>${title}</span>
          </div>
        `;
      })
      .join("");
  }

  /* ---------------------------------------------------------
     Month view
     --------------------------------------------------------- */

  function renderMonth() {
    const days = getMonthDays(state.date);

    const weekdayHeader = [
      "Mon",
      "Tue",
      "Wed",
      "Thu",
      "Fri",
      "Sat",
      "Sun"
    ]
      .map(day => `
        <div class="mr-calendar-weekday">
          ${day}
        </div>
      `)
      .join("");

    const cells = days
      .map(item => {
        const date = item.date;
        const dateKey = calendar.toISODate(date);

        const events = getCalendarEvents(date);

        const selected =
          state.selectedDate === dateKey;

        const today =
          calendar.isToday(date);

        return `
          <button
            type="button"
            class="
              mr-calendar-day
              ${item.currentMonth ? "" : "mr-calendar-other-month"}
              ${today ? "mr-calendar-today" : ""}
              ${selected ? "mr-calendar-selected" : ""}
            "
            data-date="${dateKey}"
          >
            <span class="mr-calendar-day-number">
              ${date.getDate()}
            </span>

            <div class="mr-calendar-day-events">
              ${renderEvents(events)}
              ${
                events.length > 3
                  ? `<div class="mr-calendar-more">
                      +${events.length - 3} more
                     </div>`
                  : ""
              }
            </div>
          </button>
        `;
      })
      .join("");

    return `
      <div class="mr-calendar-month">

        <div class="mr-calendar-grid mr-calendar-weekdays">
          ${weekdayHeader}
        </div>

        <div class="mr-calendar-grid mr-calendar-days">
          ${cells}
        </div>

      </div>
    `;
  }

  /* ---------------------------------------------------------
     Selected day panel
     --------------------------------------------------------- */

  function renderSelectedDay() {
    if (!state.selectedDate) {
      return "";
    }

    const date = calendar.fromISODate(
      state.selectedDate
    );

    if (!date) return "";

    const events = getCalendarEvents(date);

    return `
      <section class="mr-calendar-day-panel">

        <div class="mr-calendar-day-panel-header">

          <div>
            <div class="mr-calendar-panel-label">
              Selected date
            </div>

            <h3>
              ${escapeHTML(
                calendar.formatDate(date)
              )}
            </h3>
          </div>

          <button
            type="button"
            class="mr-calendar-add-button"
            data-action="add-event"
          >
            + Add
          </button>

        </div>

        <div class="mr-calendar-event-list">

          ${
            events.length
              ? events
                  .map(event => `
                    <article
                      class="mr-calendar-event-card"
                      data-event-id="${escapeHTML(event.id)}"
                    >

                      <div class="mr-calendar-event-card-icon">
                        ${getEventIcon(event.type)}
                      </div>

                      <div class="mr-calendar-event-card-content">

                        <strong>
                          ${escapeHTML(event.title)}
                        </strong>

                        ${
                          event.startTime
                            ? `
                              <span>
                                ${escapeHTML(event.startTime)}
                                ${
                                  event.endTime
                                    ? ` – ${escapeHTML(event.endTime)}`
                                    : ""
                                }
                              </span>
                            `
                            : ""
                        }

                        ${
                          event.location
                            ? `
                              <span>
                                📍 ${escapeHTML(event.location)}
                              </span>
                            `
                            : ""
                        }

                        ${
                          event.description
                            ? `
                              <p>
                                ${escapeHTML(event.description)}
                              </p>
                            `
                            : ""
                        }

                      </div>

                    </article>
                  `)
                  .join("")
              : `
                <div class="mr-calendar-empty-day">
                  <div>📅</div>
                  <strong>No events</strong>
                  <span>
                    Nothing is scheduled for this date.
                  </span>
                </div>
              `
          }

        </div>

      </section>
    `;
  }

  /* ---------------------------------------------------------
     Main renderer
     --------------------------------------------------------- */

  function render() {
    const root = document.querySelector(
      "#myroutine-calendar-root"
    );

    if (!root) return;

    root.innerHTML = `
      <div class="mr-calendar-shell">

        <header class="mr-calendar-toolbar">

          <div class="mr-calendar-title-area">

            <button
              type="button"
              class="mr-calendar-icon-button"
              data-action="close"
              aria-label="Close"
            >
              ×
            </button>

            <div>
              <div class="mr-calendar-eyebrow">
                MyRoutine Calendar
              </div>

              <h2>
                ${escapeHTML(
                  getMonthName(state.date)
                )}
              </h2>
            </div>

          </div>

          <div class="mr-calendar-navigation">

            <button
              type="button"
              data-action="previous"
              title="Previous month"
            >
              ‹
            </button>

            <button
              type="button"
              data-action="today"
            >
              Today
            </button>

            <button
              type="button"
              data-action="next"
              title="Next month"
            >
              ›
            </button>

          </div>

        </header>

        <div class="mr-calendar-body">

          ${renderMonth()}

          ${renderSelectedDay()}

        </div>

      </div>
    `;

    bindEvents(root);
  }

  /* ---------------------------------------------------------
     Event binding
     --------------------------------------------------------- */

  function bindEvents(root) {
    root.querySelectorAll("[data-date]")
      .forEach(button => {
        button.addEventListener("click", () => {
          const date = calendar.fromISODate(
            button.dataset.date
          );

          if (date) {
            selectDate(date);
          }
        });
      });

    root.querySelectorAll("[data-action]")
      .forEach(button => {
        button.addEventListener("click", () => {
          const action = button.dataset.action;

          if (action === "previous") {
            previousMonth();
          }

          if (action === "next") {
            nextMonth();
          }

          if (action === "today") {
            goToday();
          }

          if (action === "close") {
            calendar.close();
          }

          if (action === "add-event") {
            openEventCreator();
          }
        });
      });
  }

  /* ---------------------------------------------------------
     Event creator
     --------------------------------------------------------- */

  function openEventCreator() {
    const date =
      state.selectedDate ||
      calendar.toISODate(new Date());

    const title = prompt(
      "Event title:",
      ""
    );

    if (!title || !title.trim()) {
      return;
    }

    const typeInput = prompt(
      "Type: class, exam, holiday, event, note",
      "event"
    );

    const allowed = [
      "class",
      "exam",
      "holiday",
      "event",
      "note"
    ];

    const type = allowed.includes(
      String(typeInput).toLowerCase()
    )
      ? String(typeInput).toLowerCase()
      : "event";

    const routine = getRoutine();

    if (!routine) {
      alert("Please open a routine first.");
      return;
    }

    calendar.addEvent(
      routine.id,
      {
        date,
        title: title.trim(),
        type
      }
    );

    render();
  }

  /* ---------------------------------------------------------
     Expose internal controls
     --------------------------------------------------------- */

  window.MyRoutineCalendar._state = state;

  window.MyRoutineCalendar._render = render;

  window.MyRoutineCalendar._previousMonth =
    previousMonth;

  window.MyRoutineCalendar._nextMonth =
    nextMonth;

  window.MyRoutineCalendar._previousWeek =
    previousWeek;

  window.MyRoutineCalendar._nextWeek =
    nextWeek;

  window.MyRoutineCalendar._selectDate =
    selectDate;

})();
/* =========================================================
   Calendar Styles + Modal
   ========================================================= */

(function () {
  "use strict";

  const calendar = window.MyRoutineCalendar;
  if (!calendar) return;

  /* ---------------------------------------------------------
     Inject styles
     --------------------------------------------------------- */

  function injectStyles() {
    if (document.getElementById("myroutine-calendar-styles")) {
      return;
    }

    const style = document.createElement("style");

    style.id = "myroutine-calendar-styles";

    style.textContent = `
      .mr-calendar-overlay {
        position: fixed;
        inset: 0;
        z-index: 9998;
        background: rgba(0,0,0,.55);
        backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
      }

      .mr-calendar-modal {
        width: min(1100px, 100%);
        height: min(900px, 94vh);
        background: var(--mr-calendar-bg, #ffffff);
        color: var(--mr-calendar-text, #111827);
        border-radius: 24px;
        overflow: hidden;
        box-shadow: 0 25px 80px rgba(0,0,0,.25);
        display: flex;
        flex-direction: column;
      }

      .mr-calendar-shell {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
      }

      .mr-calendar-toolbar {
        min-height: 78px;
        padding: 16px 20px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        border-bottom: 1px solid rgba(127,127,127,.18);
      }

      .mr-calendar-title-area {
        display: flex;
        align-items: center;
        gap: 14px;
        min-width: 0;
      }

      .mr-calendar-eyebrow {
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: .08em;
        opacity: .6;
        margin-bottom: 3px;
      }

      .mr-calendar-title-area h2 {
        margin: 0;
        font-size: 22px;
        line-height: 1.2;
      }

      .mr-calendar-icon-button {
        width: 40px;
        height: 40px;
        border: 0;
        border-radius: 12px;
        background: rgba(127,127,127,.10);
        color: inherit;
        font-size: 25px;
        cursor: pointer;
      }

      .mr-calendar-navigation {
        display: flex;
        align-items: center;
        gap: 7px;
      }

      .mr-calendar-navigation button {
        min-width: 40px;
        height: 38px;
        padding: 0 12px;
        border: 1px solid rgba(127,127,127,.18);
        border-radius: 10px;
        background: transparent;
        color: inherit;
        cursor: pointer;
        font-weight: 600;
      }

      .mr-calendar-navigation button:hover,
      .mr-calendar-icon-button:hover,
      .mr-calendar-add-button:hover {
        background: rgba(127,127,127,.15);
      }

      .mr-calendar-body {
        flex: 1;
        overflow: auto;
        padding: 18px;
      }

      .mr-calendar-grid {
        display: grid;
        grid-template-columns: repeat(7, minmax(0, 1fr));
      }

      .mr-calendar-weekdays {
        margin-bottom: 6px;
      }

      .mr-calendar-weekday {
        padding: 8px;
        text-align: center;
        font-size: 12px;
        font-weight: 700;
        opacity: .6;
      }

      .mr-calendar-days {
        gap: 6px;
      }

      .mr-calendar-day {
        min-height: 105px;
        padding: 8px;
        text-align: left;
        border: 1px solid rgba(127,127,127,.15);
        border-radius: 12px;
        background: transparent;
        color: inherit;
        cursor: pointer;
        overflow: hidden;
      }

      .mr-calendar-day:hover {
        background: rgba(127,127,127,.08);
      }

      .mr-calendar-other-month {
        opacity: .4;
      }

      .mr-calendar-today {
        border: 2px solid currentColor;
      }

      .mr-calendar-selected {
        box-shadow: inset 0 0 0 2px rgba(80,120,255,.55);
      }

      .mr-calendar-day-number {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        font-size: 13px;
        font-weight: 700;
      }

      .mr-calendar-today .mr-calendar-day-number {
        background: currentColor;
        color: var(--mr-calendar-bg, #ffffff);
      }

      .mr-calendar-day-events {
        margin-top: 5px;
        display: flex;
        flex-direction: column;
        gap: 3px;
      }

      .mr-calendar-event {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 4px 5px;
        border-radius: 6px;
        background: rgba(80,120,255,.10);
        font-size: 10px;
        line-height: 1.2;
        overflow: hidden;
      }

      .mr-calendar-event span:last-child {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .mr-calendar-event-exam {
        background: rgba(220,70,70,.12);
      }

      .mr-calendar-event-holiday {
        background: rgba(40,160,100,.12);
      }

      .mr-calendar-event-class {
        background: rgba(80,120,255,.12);
      }

      .mr-calendar-event-note {
        background: rgba(220,160,40,.13);
      }

      .mr-calendar-more {
        padding-left: 5px;
        font-size: 10px;
        opacity: .65;
      }

      .mr-calendar-day-panel {
        margin-top: 18px;
        border: 1px solid rgba(127,127,127,.16);
        border-radius: 18px;
        overflow: hidden;
      }

      .mr-calendar-day-panel-header {
        padding: 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        border-bottom: 1px solid rgba(127,127,127,.14);
      }

      .mr-calendar-panel-label {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: .06em;
        opacity: .55;
        font-weight: 700;
      }

      .mr-calendar-day-panel h3 {
        margin: 4px 0 0;
        font-size: 17px;
      }

      .mr-calendar-add-button {
        border: 0;
        border-radius: 10px;
        padding: 9px 14px;
        background: rgba(80,120,255,.14);
        color: inherit;
        cursor: pointer;
        font-weight: 700;
      }

      .mr-calendar-event-list {
        display: flex;
        flex-direction: column;
      }

      .mr-calendar-event-card {
        display: flex;
        gap: 12px;
        padding: 14px 16px;
        border-bottom: 1px solid rgba(127,127,127,.10);
      }

      .mr-calendar-event-card:last-child {
        border-bottom: 0;
      }

      .mr-calendar-event-card-icon {
        width: 36px;
        height: 36px;
        flex: 0 0 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 10px;
        background: rgba(127,127,127,.10);
      }

      .mr-calendar-event-card-content {
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 3px;
      }

      .mr-calendar-event-card-content strong {
        font-size: 14px;
      }

      .mr-calendar-event-card-content span {
        font-size: 12px;
        opacity: .65;
      }

      .mr-calendar-event-card-content p {
        margin: 5px 0 0;
        font-size: 13px;
        line-height: 1.45;
        opacity: .75;
      }

      .mr-calendar-empty-day {
        padding: 28px 16px;
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 5px;
        opacity: .65;
      }

      .mr-calendar-empty-day div {
        font-size: 28px;
        margin-bottom: 4px;
      }

      .mr-calendar-empty-day span {
        font-size: 12px;
      }

      @media (max-width: 700px) {
        .mr-calendar-overlay {
          padding: 0;
          align-items: stretch;
        }

        .mr-calendar-modal {
          width: 100%;
          height: 100%;
          max-height: none;
          border-radius: 0;
        }

        .mr-calendar-toolbar {
          padding: 12px;
          min-height: 68px;
        }

        .mr-calendar-title-area h2 {
          font-size: 18px;
        }

        .mr-calendar-navigation button {
          min-width: 34px;
          padding: 0 8px;
        }

        .mr-calendar-body {
          padding: 10px;
        }

        .mr-calendar-days {
          gap: 3px;
        }

        .mr-calendar-day {
          min-height: 72px;
          padding: 4px;
          border-radius: 8px;
        }

        .mr-calendar-weekday {
          padding: 5px 2px;
          font-size: 10px;
        }

        .mr-calendar-day-number {
          width: 24px;
          height: 24px;
          font-size: 11px;
        }

        .mr-calendar-event {
          padding: 2px 3px;
          font-size: 8px;
        }

        .mr-calendar-event span:first-child {
          display: none;
        }

        .mr-calendar-day-panel-header {
          padding: 13px;
        }
      }

      @media (prefers-color-scheme: dark) {
        .mr-calendar-modal {
          --mr-calendar-bg: #111318;
          --mr-calendar-text: #f3f4f6;
        }
      }
    `;

    document.head.appendChild(style);
  }

  /* ---------------------------------------------------------
     Root creation
     --------------------------------------------------------- */

  function createRoot() {
    let root = document.getElementById(
      "myroutine-calendar-root"
    );

    if (!root) {
      root = document.createElement("div");
      root.id = "myroutine-calendar-root";
      return root;
    }

    return root;
  }

  /* ---------------------------------------------------------
     Open
     --------------------------------------------------------- */

  function open(routineId, options) {
    options = options || {};

    injectStyles();

    if (routineId) {
      currentRoutineId = routineId;
    } else {
      const active =
        window.MyRoutine?.getActiveRoutine?.();

      currentRoutineId = active?.id || null;
    }

    if (options.date) {
      const provided =
        options.date instanceof Date
          ? options.date
          : calendar.fromISODate(options.date);

      if (provided) {
        currentDate = new Date(provided);
        selectedDate = calendar.toISODate(provided);
      }
    } else {
      currentDate = new Date();

      selectedDate =
        calendar.toISODate(currentDate);
    }

    const overlay =
      document.createElement("div");

    overlay.className =
      "mr-calendar-overlay";

    const modal =
      document.createElement("div");

    modal.className =
      "mr-calendar-modal";

    const root = createRoot();

    root.innerHTML = "";

    modal.appendChild(root);
    overlay.appendChild(modal);

    document.body.appendChild(overlay);

    document.body.style.overflow = "hidden";

    overlay.addEventListener("click", event => {
      if (event.target === overlay) {
        close();
      }
    });

    window.MyRoutineCalendar._overlay = overlay;

    renderCalendar();
  }

  /* ---------------------------------------------------------
     Close
     --------------------------------------------------------- */

  function close() {
    const overlay =
      window.MyRoutineCalendar._overlay;

    if (overlay) {
      overlay.remove();
    }

    window.MyRoutineCalendar._overlay = null;

    document.body.style.overflow = "";

    const root =
      document.getElementById(
        "myroutine-calendar-root"
      );

    if (root) {
      root.innerHTML = "";
    }
  }

  /* ---------------------------------------------------------
     Render bridge
     --------------------------------------------------------- */

  function renderCalendar() {
    const root =
      document.getElementById(
        "myroutine-calendar-root"
      );

    if (!root) return;

    /*
      Keep the main renderer supplied by Part 2.
      The wrapper allows the public module to
      remain independent from the UI implementation.
    */

    if (
      typeof window.MyRoutineCalendar._render ===
      "function"
    ) {
      window.MyRoutineCalendar._render();
    }
  }

  /* ---------------------------------------------------------
     Public refresh
     --------------------------------------------------------- */

  function refresh() {
    if (
      window.MyRoutineCalendar._overlay
    ) {
      renderCalendar();
    }
  }

  /* ---------------------------------------------------------
     Public state helpers
     --------------------------------------------------------- */

  Object.defineProperty(
    window.MyRoutineCalendar,
    "currentDate",
    {
      get() {
        return currentDate;
      }
    }
  );

  Object.defineProperty(
    window.MyRoutineCalendar,
    "selectedDate",
    {
      get() {
        return selectedDate;
      }
    }
  );

  /* ---------------------------------------------------------
     Patch the original renderer's state
     --------------------------------------------------------- */

  const originalState =
    window.MyRoutineCalendar._state;

  if (originalState) {
    Object.defineProperty(
      originalState,
      "date",
      {
        get() {
          return currentDate;
        },

        set(value) {
          if (value instanceof Date) {
            currentDate = value;
          }
        }
      }
    );

    Object.defineProperty(
      originalState,
      "selectedDate",
      {
        get() {
          return selectedDate;
        },

        set(value) {
          selectedDate = value;
        }
      }
    );
  }

  /* ---------------------------------------------------------
     Override public methods
     --------------------------------------------------------- */

  window.MyRoutineCalendar.open = open;
  window.MyRoutineCalendar.close = close;
  window.MyRoutineCalendar.refresh = refresh;

})();
/* =========================================================
   MyRoutine — Calendar Finalization
   ========================================================= */

(function () {
  "use strict";

  const calendar = window.MyRoutineCalendar;

  if (!calendar) return;

  /* ---------------------------------------------------------
     Routine / date helpers
     --------------------------------------------------------- */

  function getRoutineById(id) {
    if (!window.MyRoutine) return null;

    if (typeof window.MyRoutine.getRoutine === "function") {
      return window.MyRoutine.getRoutine(id);
    }

    if (
      window.MyRoutine.state &&
      window.MyRoutine.state.data &&
      Array.isArray(window.MyRoutine.state.data.routines)
    ) {
      return window.MyRoutine.state.data.routines.find(
        routine => routine.id === id
      ) || null;
    }

    return null;
  }

  function getCurrentRoutine() {
    const id =
      calendar.currentRoutineId ||
      window.MyRoutine?.state?.activeRoutineId;

    return getRoutineById(id) ||
      window.MyRoutine?.getActiveRoutine?.() ||
      null;
  }

  function save() {
    if (
      window.MyRoutine &&
      typeof window.MyRoutine.saveRoutines === "function"
    ) {
      window.MyRoutine.saveRoutines();
    }

    document.dispatchEvent(
      new CustomEvent("myroutine:calendar-updated", {
        detail: {
          routineId: calendar.currentRoutineId || null
        }
      })
    );
  }

  /* ---------------------------------------------------------
     Advanced event operations
     --------------------------------------------------------- */

  function createEvent(data) {
    const routine = getCurrentRoutine();

    if (!routine) {
      return null;
    }

    return calendar.addEvent(
      routine.id,
      data
    );
  }

  function editEvent(eventId, updates) {
    const routine = getCurrentRoutine();

    if (!routine) {
      return null;
    }

    return calendar.updateEvent(
      routine.id,
      eventId,
      updates
    );
  }

  function deleteEvent(eventId) {
    const routine = getCurrentRoutine();

    if (!routine) {
      return false;
    }

    return calendar.removeEvent(
      routine.id,
      eventId
    );
  }

  /* ---------------------------------------------------------
     Date-specific schedule helper
     --------------------------------------------------------- */

  function getDateSchedule(date) {
    const routine = getCurrentRoutine();

    if (!routine) {
      return [];
    }

    const dateObject =
      date instanceof Date
        ? date
        : calendar.fromISODate(date);

    if (!dateObject) {
      return [];
    }

    return calendar.getEvents(
      routine,
      dateObject
    );
  }

  /* ---------------------------------------------------------
     Event type shortcuts
     --------------------------------------------------------- */

  function addExam(date, title, options) {
    options = options || {};

    return createEvent({
      date:
        date instanceof Date
          ? calendar.toISODate(date)
          : date,

      title: title || "Exam",

      type: "exam",

      description:
        options.description || "",

      startTime:
        options.startTime || "",

      endTime:
        options.endTime || "",

      location:
        options.location || "",

      subjectId:
        options.subjectId || null
    });
  }

  function addHoliday(date, title, options) {
    options = options || {};

    return createEvent({
      date:
        date instanceof Date
          ? calendar.toISODate(date)
          : date,

      title: title || "Holiday",

      type: "holiday",

      description:
        options.description || "",

      allDay: true
    });
  }

  function addNote(date, title, description) {
    return createEvent({
      date:
        date instanceof Date
          ? calendar.toISODate(date)
          : date,

      title: title || "Note",

      type: "note",

      description:
        description || ""
    });
  }

  function addCalendarEvent(date, title, options) {
    options = options || {};

    return createEvent({
      date:
        date instanceof Date
          ? calendar.toISODate(date)
          : date,

      title:
        title || "Event",

      type:
        options.type || "event",

      description:
        options.description || "",

      startTime:
        options.startTime || "",

      endTime:
        options.endTime || "",

      location:
        options.location || "",

      allDay:
        options.allDay !== false
    });
  }

  /* ---------------------------------------------------------
     Import / export calendar events
     --------------------------------------------------------- */

  function exportEvents() {
    const routine = getCurrentRoutine();

    if (!routine) {
      return null;
    }

    const events =
      calendar.getEvents(routine);

    return JSON.stringify(
      {
        format: "MyRoutine Calendar",
        version: "1.0",
        exportedAt: new Date().toISOString(),
        routineId: routine.id,
        routineName: routine.name || "",
        events
      },
      null,
      2
    );
  }

  function importEvents(json) {
    const routine = getCurrentRoutine();

    if (!routine) {
      return false;
    }

    let parsed;

    try {
      parsed =
        typeof json === "string"
          ? JSON.parse(json)
          : json;
    } catch (error) {
      console.error(
        "MyRoutine Calendar import failed:",
        error
      );

      return false;
    }

    if (
      !parsed ||
      !Array.isArray(parsed.events)
    ) {
      return false;
    }

    if (
      !routine.calendar ||
      typeof routine.calendar !== "object"
    ) {
      routine.calendar = {};
    }

    if (
      !Array.isArray(routine.calendar.events)
    ) {
      routine.calendar.events = [];
    }

    const imported =
      parsed.events.map(event => ({
        ...event,
        id:
          event.id ||
          "event_" +
            Date.now().toString(36) +
            "_" +
            Math.random()
              .toString(36)
              .slice(2, 8)
      }));

    routine.calendar.events.push(
      ...imported
    );

    save();

    calendar.refresh();

    return true;
  }

  /* ---------------------------------------------------------
     Download calendar
     --------------------------------------------------------- */

  function downloadEvents() {
    const json = exportEvents();

    if (!json) {
      return false;
    }

    const blob = new Blob(
      [json],
      {
        type: "application/json"
      }
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;

    link.download =
      "myroutine-calendar.json";

    document.body.appendChild(link);

    link.click();

    link.remove();

    URL.revokeObjectURL(url);

    return true;
  }

  /* ---------------------------------------------------------
     Calendar statistics
     --------------------------------------------------------- */

  function getStats() {
    const routine = getCurrentRoutine();

    if (!routine) {
      return {
        total: 0,
        classes: 0,
        exams: 0,
        holidays: 0,
        events: 0,
        notes: 0
      };
    }

    const events =
      calendar.getEvents(routine);

    return {
      total: events.length,

      classes:
        events.filter(
          event => event.type === "class"
        ).length,

      exams:
        events.filter(
          event => event.type === "exam"
        ).length,

      holidays:
        events.filter(
          event => event.type === "holiday"
        ).length,

      events:
        events.filter(
          event => event.type === "event"
        ).length,

      notes:
        events.filter(
          event => event.type === "note"
        ).length
    };
  }

  /* ---------------------------------------------------------
     Public API
     --------------------------------------------------------- */

  calendar.createEvent = createEvent;

  calendar.editEvent = editEvent;

  calendar.deleteEvent = deleteEvent;

  calendar.getDateSchedule =
    getDateSchedule;

  calendar.addExam = addExam;

  calendar.addHoliday = addHoliday;

  calendar.addNote = addNote;

  calendar.addCalendarEvent =
    addCalendarEvent;

  calendar.exportEvents =
    exportEvents;

  calendar.importEvents =
    importEvents;

  calendar.downloadEvents =
    downloadEvents;

  calendar.getStats =
    getStats;

  /* ---------------------------------------------------------
     Routine change listener
     --------------------------------------------------------- */

  document.addEventListener(
    "myroutine:ready",
    function () {
      calendar.refresh();
    }
  );

  document.addEventListener(
    "myroutine:calendar-changed",
    function () {
      calendar.refresh();
    }
  );

  document.addEventListener(
    "myroutine:storage-loaded",
    function () {
      calendar.refresh();
    }
  );

  console.log(
    "MyRoutine Calendar loaded — v1.0.0"
  );

})();