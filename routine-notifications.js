/* =========================================================
   MyRoutine — Notifications & Reminders
   File: routine-notifications.js
   ========================================================= */

(function () {
  "use strict";

  const VERSION = "1.0.0";

  const DEFAULT_SETTINGS = {
    enabled: true,
    classReminder: true,
    examReminder: true,
    eventReminder: true,
    minutesBeforeClass: 10,
    minutesBeforeExam: 1440,
    minutesBeforeEvent: 60
  };

  let settings = {
    ...DEFAULT_SETTINGS
  };

  let timer = null;
  let initialized = false;

  /* ---------------------------------------------------------
     Helpers
     --------------------------------------------------------- */

  function getRoutine() {
    if (
      window.MyRoutine &&
      typeof window.MyRoutine.getActiveRoutine === "function"
    ) {
      return window.MyRoutine.getActiveRoutine();
    }

    return null;
  }

  function getStorageKey() {
    return "myroutine_notifications_settings";
  }

  function loadSettings() {
    try {
      const saved = localStorage.getItem(
        getStorageKey()
      );

      if (saved) {
        settings = {
          ...DEFAULT_SETTINGS,
          ...JSON.parse(saved)
        };
      }
    } catch (error) {
      console.warn(
        "MyRoutine notification settings could not be loaded.",
        error
      );
    }

    return settings;
  }

  function saveSettings() {
    try {
      localStorage.setItem(
        getStorageKey(),
        JSON.stringify(settings)
      );
    } catch (error) {
      console.warn(
        "MyRoutine notification settings could not be saved.",
        error
      );
    }
  }

  function isSupported() {
    return (
      typeof window !== "undefined" &&
      "Notification" in window
    );
  }

  function permissionStatus() {
    if (!isSupported()) {
      return "unsupported";
    }

    return Notification.permission;
  }

  /* ---------------------------------------------------------
     Browser notification permission
     --------------------------------------------------------- */

  async function requestPermission() {
    if (!isSupported()) {
      return "unsupported";
    }

    try {
      const permission =
        await Notification.requestPermission();

      return permission;
    } catch (error) {
      console.warn(
        "Notification permission request failed.",
        error
      );

      return "denied";
    }
  }

  /* ---------------------------------------------------------
     Show notification
     --------------------------------------------------------- */

  function notify(title, options) {
    options = options || {};

    if (!settings.enabled) {
      return false;
    }

    if (!isSupported()) {
      return false;
    }

    if (Notification.permission !== "granted") {
      return false;
    }

    try {
      const notification =
        new Notification(
          title || "MyRoutine",
          {
            body:
              options.body ||
              "You have a MyRoutine reminder.",

            icon:
              options.icon ||
              "",

            tag:
              options.tag ||
              "myroutine",

            requireInteraction:
              options.requireInteraction ||
              false
          }
        );

      notification.onclick = function () {
        window.focus();

        if (
          typeof options.onClick === "function"
        ) {
          options.onClick();
        }

        notification.close();
      };

      return true;

    } catch (error) {
      console.warn(
        "MyRoutine notification failed.",
        error
      );

      return false;
    }
  }

  /* ---------------------------------------------------------
     Settings
     --------------------------------------------------------- */

  function getSettings() {
    return {
      ...settings
    };
  }

  function updateSettings(updates) {
    settings = {
      ...settings,
      ...(updates || {})
    };

    saveSettings();

    document.dispatchEvent(
      new CustomEvent(
        "myroutine:notification-settings-changed",
        {
          detail: {
            settings: getSettings()
          }
        }
      )
    );

    return getSettings();
  }

  function resetSettings() {
    settings = {
      ...DEFAULT_SETTINGS
    };

    saveSettings();

    return getSettings();
  }

  /* ---------------------------------------------------------
     Initialization
     --------------------------------------------------------- */

  function init() {
    if (initialized) {
      return;
    }

    initialized = true;

    loadSettings();

    console.log(
      "MyRoutine Notifications loaded — v" +
      VERSION
    );
  }

  /* ---------------------------------------------------------
     Public API
     --------------------------------------------------------- */

  window.MyRoutineNotifications = {
    VERSION,

    DEFAULT_SETTINGS,

    init,

    isSupported,

    permissionStatus,

    requestPermission,

    notify,

    getSettings,

    updateSettings,

    resetSettings
  };

  init();

})();
/* =========================================================
   Notification Scheduler
   ========================================================= */

(function () {
  "use strict";

  const notifications =
    window.MyRoutineNotifications;

  if (!notifications) return;

  /* ---------------------------------------------------------
     Time helpers
     --------------------------------------------------------- */

  function parseTime(value) {
    if (!value) return null;

    const match = String(value)
      .trim()
      .match(/^(\d{1,2}):(\d{2})$/);

    if (!match) return null;

    const hours = Number(match[1]);
    const minutes = Number(match[2]);

    if (
      hours < 0 ||
      hours > 23 ||
      minutes < 0 ||
      minutes > 59
    ) {
      return null;
    }

    return {
      hours,
      minutes
    };
  }

  function makeDate(date, time) {
    const parsed = parseTime(time);

    if (!parsed) return null;

    const result = new Date(date);

    result.setHours(
      parsed.hours,
      parsed.minutes,
      0,
      0
    );

    return result;
  }

  function minutesUntil(target) {
    return Math.round(
      (target.getTime() - Date.now()) / 60000
    );
  }

  function isoDate(date) {
    return (
      date.getFullYear() +
      "-" +
      String(date.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(date.getDate()).padStart(2, "0")
    );
  }

  /* ---------------------------------------------------------
     Routine access
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

  /* ---------------------------------------------------------
     Prevent duplicate notifications
     --------------------------------------------------------- */

  function getSentKey() {
    return "myroutine_sent_notifications";
  }

  function getSentNotifications() {
    try {
      const raw =
        localStorage.getItem(getSentKey());

      if (!raw) return {};

      return JSON.parse(raw) || {};
    } catch {
      return {};
    }
  }

  function saveSentNotifications(data) {
    try {
      localStorage.setItem(
        getSentKey(),
        JSON.stringify(data)
      );
    } catch {
      // Ignore storage errors.
    }
  }

  function alreadySent(key) {
    const sent =
      getSentNotifications();

    return Boolean(sent[key]);
  }

  function markSent(key) {
    const sent =
      getSentNotifications();

    sent[key] = Date.now();

    /*
      Keep only recent notification records.
      This prevents localStorage from growing forever.
    */

    const cutoff =
      Date.now() -
      1000 * 60 * 60 * 24 * 30;

    Object.keys(sent).forEach(item => {
      if (sent[item] < cutoff) {
        delete sent[item];
      }
    });

    saveSentNotifications(sent);
  }

  /* ---------------------------------------------------------
     Notification builders
     --------------------------------------------------------- */

  function sendClassReminder(item, date) {
    if (
      !notifications.getSettings()
        .classReminder
    ) {
      return;
    }

    if (!item.startTime) return;

    const classDate =
      makeDate(date, item.startTime);

    if (!classDate) return;

    const minutes =
      minutesUntil(classDate);

    const reminder =
      notifications.getSettings()
        .minutesBeforeClass;

    if (
      minutes < reminder ||
      minutes > reminder + 1
    ) {
      return;
    }

    const key =
      "class:" +
      isoDate(date) +
      ":" +
      (item.id || item.subjectId || item.title);

    if (alreadySent(key)) {
      return;
    }

    markSent(key);

    notifications.notify(
      "Upcoming class",
      {
        body:
          (item.title ||
            item.subjectName ||
            "Class") +
          " starts in " +
          reminder +
          " minutes.",

        tag: key
      }
    );
  }

  function sendCalendarReminder(event) {
    const settings =
      notifications.getSettings();

    if (!settings.eventReminder) {
      return;
    }

    if (!event.date) return;

    if (!event.startTime) return;

    const dateParts =
      String(event.date)
        .split("-")
        .map(Number);

    if (dateParts.length !== 3) {
      return;
    }

    const date =
      new Date(
        dateParts[0],
        dateParts[1] - 1,
        dateParts[2]
      );

    const eventDate =
      makeDate(
        date,
        event.startTime
      );

    if (!eventDate) return;

    const minutes =
      minutesUntil(eventDate);

    const reminder =
      settings.minutesBeforeEvent;

    if (
      minutes < reminder ||
      minutes > reminder + 1
    ) {
      return;
    }

    const key =
      "event:" +
      event.id +
      ":" +
      event.date;

    if (alreadySent(key)) {
      return;
    }

    markSent(key);

    notifications.notify(
      event.title ||
        "Upcoming event",
      {
        body:
          reminder >= 60
            ? "Scheduled in " +
              Math.round(
                reminder / 60
              ) +
              " hour(s)."
            : "Scheduled in " +
              reminder +
              " minutes.",

        tag: key
      }
    );
  }

  function sendExamReminder(event) {
    const settings =
      notifications.getSettings();

    if (!settings.examReminder) {
      return;
    }

    if (!event.date) return;

    const parts =
      String(event.date)
        .split("-")
        .map(Number);

    if (parts.length !== 3) {
      return;
    }

    const examDate =
      new Date(
        parts[0],
        parts[1] - 1,
        parts[2]
      );

    if (event.startTime) {
      const withTime =
        makeDate(
          examDate,
          event.startTime
        );

      if (withTime) {
        examDate.setTime(
          withTime.getTime()
        );
      }
    } else {
      examDate.setHours(
        8,
        0,
        0,
        0
      );
    }

    const minutes =
      minutesUntil(examDate);

    const reminder =
      settings.minutesBeforeExam;

    if (
      minutes < reminder ||
      minutes > reminder + 1
    ) {
      return;
    }

    const key =
      "exam:" +
      event.id +
      ":" +
      event.date;

    if (alreadySent(key)) {
      return;
    }

    markSent(key);

    notifications.notify(
      "Upcoming exam",
      {
        body:
          (event.title ||
            "Exam") +
          " is coming up.",

        tag: key,

        requireInteraction: true
      }
    );
  }

  /* ---------------------------------------------------------
     Today's weekly schedule
     --------------------------------------------------------- */

  function getTodayName() {
    const names = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday"
    ];

    return names[
      new Date().getDay()
    ];
  }

  function getTodaySchedule(routine) {
    if (!routine) return [];

    /*
      Supports the common MyRoutine structure:
      routine.schedule[day]
      or
      routine.weeklySchedule[day]
    */

    const day =
      getTodayName();

    if (
      routine.schedule &&
      Array.isArray(
        routine.schedule[day]
      )
    ) {
      return routine.schedule[day];
    }

    if (
      routine.weeklySchedule &&
      Array.isArray(
        routine.weeklySchedule[day]
      )
    ) {
      return routine.weeklySchedule[day];
    }

    return [];
  }

  /* ---------------------------------------------------------
     Main check
     --------------------------------------------------------- */

  function check() {
    const settings =
      notifications.getSettings();

    if (!settings.enabled) {
      return;
    }

    if (
      notifications.permissionStatus() !==
      "granted"
    ) {
      return;
    }

    const routine =
      getActiveRoutine();

    if (!routine) {
      return;
    }

    const now =
      new Date();

    const today =
      new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );

    /* Today's classes */

    const schedule =
      getTodaySchedule(routine);

    schedule.forEach(item => {
      sendClassReminder(
        item,
        today
      );
    });

    /* Calendar events */

    if (
      routine.calendar &&
      Array.isArray(
        routine.calendar.events
      )
    ) {
      routine.calendar.events
        .forEach(event => {
          if (
            event.type === "exam"
          ) {
            sendExamReminder(event);
          } else {
            sendCalendarReminder(event);
          }
        });
    }
  }

  /* ---------------------------------------------------------
     Start scheduler
     --------------------------------------------------------- */

  function startScheduler() {
    stopScheduler();

    /*
      Check immediately.
    */

    check();

    /*
      Then check once every minute.
    */

    timer =
      setInterval(
        check,
        60 * 1000
      );
  }

  function stopScheduler() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  /* ---------------------------------------------------------
     Public API
     --------------------------------------------------------- */

  notifications.parseTime =
    parseTime;

  notifications.check =
    check;

  notifications.start =
    startScheduler;

  notifications.stop =
    stopScheduler;

  notifications.isRunning =
    function () {
      return timer !== null;
    };

})();
/* =========================================================
   Notification Center UI
   ========================================================= */

(function () {
  "use strict";

  const notifications =
    window.MyRoutineNotifications;

  if (!notifications) return;

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
        "myroutine-notification-styles"
      )
    ) {
      return;
    }

    const style =
      document.createElement("style");

    style.id =
      "myroutine-notification-styles";

    style.textContent = `
      .mr-notification-overlay {
        position: fixed;
        inset: 0;
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
        background: rgba(0,0,0,.55);
        backdrop-filter: blur(8px);
      }

      .mr-notification-modal {
        width: min(560px, 100%);
        max-height: 90vh;
        overflow: auto;
        border-radius: 22px;
        background: var(
          --mr-notification-bg,
          #ffffff
        );
        color: var(
          --mr-notification-text,
          #111827
        );
        box-shadow:
          0 25px 80px rgba(0,0,0,.25);
      }

      .mr-notification-header {
        padding: 20px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 15px;
        border-bottom:
          1px solid rgba(127,127,127,.16);
      }

      .mr-notification-header h2 {
        margin: 0;
        font-size: 20px;
      }

      .mr-notification-header p {
        margin: 4px 0 0;
        font-size: 12px;
        opacity: .6;
      }

      .mr-notification-close {
        width: 38px;
        height: 38px;
        border: 0;
        border-radius: 10px;
        background: rgba(127,127,127,.10);
        color: inherit;
        font-size: 22px;
        cursor: pointer;
      }

      .mr-notification-content {
        padding: 18px 20px 20px;
      }

      .mr-notification-status {
        padding: 14px;
        border-radius: 14px;
        margin-bottom: 18px;
        background: rgba(127,127,127,.08);
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .mr-notification-status-icon {
        font-size: 24px;
      }

      .mr-notification-status-text {
        display: flex;
        flex-direction: column;
        gap: 3px;
      }

      .mr-notification-status-text strong {
        font-size: 14px;
      }

      .mr-notification-status-text span {
        font-size: 12px;
        opacity: .65;
      }

      .mr-notification-enable {
        margin-left: auto;
        border: 0;
        border-radius: 9px;
        padding: 8px 12px;
        background: rgba(70,110,240,.14);
        color: inherit;
        cursor: pointer;
        font-weight: 700;
      }

      .mr-notification-section {
        margin-top: 20px;
      }

      .mr-notification-section-title {
        margin-bottom: 10px;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: .06em;
        font-weight: 800;
        opacity: .55;
      }

      .mr-notification-setting {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
        padding: 13px 0;
        border-bottom:
          1px solid rgba(127,127,127,.10);
      }

      .mr-notification-setting:last-child {
        border-bottom: 0;
      }

      .mr-notification-setting-info {
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 3px;
      }

      .mr-notification-setting-info strong {
        font-size: 14px;
      }

      .mr-notification-setting-info span {
        font-size: 11px;
        opacity: .6;
      }

      .mr-notification-toggle {
        width: 46px;
        height: 26px;
        flex: 0 0 46px;
        border: 0;
        border-radius: 20px;
        background: rgba(127,127,127,.25);
        cursor: pointer;
        position: relative;
        transition: .2s;
      }

      .mr-notification-toggle::after {
        content: "";
        position: absolute;
        width: 20px;
        height: 20px;
        top: 3px;
        left: 3px;
        border-radius: 50%;
        background: white;
        transition: .2s;
        box-shadow: 0 1px 4px rgba(0,0,0,.2);
      }

      .mr-notification-toggle.active {
        background: currentColor;
      }

      .mr-notification-toggle.active::after {
        transform: translateX(20px);
      }

      .mr-notification-number {
        width: 90px;
        padding: 8px 9px;
        border-radius: 9px;
        border:
          1px solid rgba(127,127,127,.20);
        background: transparent;
        color: inherit;
      }

      .mr-notification-actions {
        margin-top: 22px;
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      .mr-notification-action {
        padding: 10px 13px;
        border-radius: 10px;
        border:
          1px solid rgba(127,127,127,.18);
        background: transparent;
        color: inherit;
        cursor: pointer;
        font-weight: 600;
      }

      .mr-notification-action.primary {
        background: rgba(70,110,240,.14);
      }

      @media (max-width: 600px) {
        .mr-notification-overlay {
          padding: 0;
          align-items: stretch;
        }

        .mr-notification-modal {
          width: 100%;
          max-height: none;
          border-radius: 0;
        }

        .mr-notification-header,
        .mr-notification-content {
          padding-left: 16px;
          padding-right: 16px;
        }
      }

      @media (prefers-color-scheme: dark) {
        .mr-notification-modal {
          --mr-notification-bg: #111318;
          --mr-notification-text: #f3f4f6;
        }
      }
    `;

    document.head.appendChild(style);
  }

  /* ---------------------------------------------------------
     Toggle
     --------------------------------------------------------- */

  function toggleSetting(key) {
    const current =
      notifications.getSettings()[key];

    notifications.updateSettings({
      [key]: !current
    });

    render();
  }

  function updateNumber(key, value) {
    const number =
      Number(value);

    if (
      !Number.isFinite(number) ||
      number < 0
    ) {
      return;
    }

    notifications.updateSettings({
      [key]: number
    });
  }

  /* ---------------------------------------------------------
     Render
     --------------------------------------------------------- */

  function render() {
    if (!overlay) return;

    const settings =
      notifications.getSettings();

    const permission =
      notifications.permissionStatus();

    let permissionText =
      "Notifications are ready.";

    let permissionIcon = "🔔";

    let enableButton = "";

    if (permission === "granted") {
      permissionText =
        "Browser notifications are enabled.";
    } else if (permission === "denied") {
      permissionIcon = "⚠️";

      permissionText =
        "Notifications are blocked by your browser.";
    } else if (permission === "default") {
      permissionIcon = "🔔";

      permissionText =
        "Allow notifications to receive reminders.";

      enableButton = `
        <button
          type="button"
          class="mr-notification-enable"
          data-action="permission"
        >
          Enable
        </button>
      `;
    } else {
      permissionIcon = "ℹ️";

      permissionText =
        "This browser does not support notifications.";
    }

    overlay.innerHTML = `
      <div class="mr-notification-modal">

        <header class="mr-notification-header">

          <div>
            <h2>
              🔔 Notifications
            </h2>

            <p>
              Manage your MyRoutine reminders
            </p>
          </div>

          <button
            type="button"
            class="mr-notification-close"
            data-action="close"
            aria-label="Close"
          >
            ×
          </button>

        </header>

        <div class="mr-notification-content">

          <div class="mr-notification-status">

            <div class="mr-notification-status-icon">
              ${permissionIcon}
            </div>

            <div class="mr-notification-status-text">
              <strong>
                Notification status
              </strong>

              <span>
                ${escapeHTML(permissionText)}
              </span>
            </div>

            ${enableButton}

          </div>

          <div class="mr-notification-section">

            <div class="mr-notification-section-title">
              General
            </div>

            <div class="mr-notification-setting">

              <div class="mr-notification-setting-info">
                <strong>
                  Enable reminders
                </strong>

                <span>
                  Allow MyRoutine to send reminders
                </span>
              </div>

              <button
                type="button"
                class="mr-notification-toggle
                  ${settings.enabled ? "active" : ""}"
                data-toggle="enabled"
                aria-label="Toggle reminders"
              ></button>

            </div>

          </div>

          <div class="mr-notification-section">

            <div class="mr-notification-section-title">
              Reminder types
            </div>

            <div class="mr-notification-setting">

              <div class="mr-notification-setting-info">
                <strong>
                  Class reminders
                </strong>

                <span>
                  Remind before scheduled classes
                </span>
              </div>

              <button
                type="button"
                class="mr-notification-toggle
                  ${settings.classReminder ? "active" : ""}"
                data-toggle="classReminder"
              ></button>

            </div>

            <div class="mr-notification-setting">

              <div class="mr-notification-setting-info">
                <strong>
                  Exam reminders
                </strong>

                <span>
                  Remind before exams
                </span>
              </div>

              <button
                type="button"
                class="mr-notification-toggle
                  ${settings.examReminder ? "active" : ""}"
                data-toggle="examReminder"
              ></button>

            </div>

            <div class="mr-notification-setting">

              <div class="mr-notification-setting-info">
                <strong>
                  Event reminders
                </strong>

                <span>
                  Remind before calendar events
                </span>
              </div>

              <button
                type="button"
                class="mr-notification-toggle
                  ${settings.eventReminder ? "active" : ""}"
                data-toggle="eventReminder"
              ></button>

            </div>

          </div>

          <div class="mr-notification-section">

            <div class="mr-notification-section-title">
              Timing
            </div>

            <div class="mr-notification-setting">

              <div class="mr-notification-setting-info">
                <strong>
                  Class reminder
                </strong>

                <span>
                  Minutes before class
                </span>
              </div>

              <input
                type="number"
                min="0"
                max="1440"
                class="mr-notification-number"
                data-number="minutesBeforeClass"
                value="${settings.minutesBeforeClass}"
              />

            </div>

            <div class="mr-notification-setting">

              <div class="mr-notification-setting-info">
                <strong>
                  Exam reminder
                </strong>

                <span>
                  Minutes before exam
                </span>
              </div>

              <input
                type="number"
                min="0"
                max="10080"
                class="mr-notification-number"
                data-number="minutesBeforeExam"
                value="${settings.minutesBeforeExam}"
              />

            </div>

            <div class="mr-notification-setting">

              <div class="mr-notification-setting-info">
                <strong>
                  Event reminder
                </strong>

                <span>
                  Minutes before event
                </span>
              </div>

              <input
                type="number"
                min="0"
                max="10080"
                class="mr-notification-number"
                data-number="minutesBeforeEvent"
                value="${settings.minutesBeforeEvent}"
              />

            </div>

          </div>

          <div class="mr-notification-actions">

            <button
              type="button"
              class="mr-notification-action primary"
              data-action="test"
            >
              Send test notification
            </button>

            <button
              type="button"
              class="mr-notification-action"
              data-action="reset"
            >
              Reset settings
            </button>

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
      .querySelectorAll("[data-toggle]")
      .forEach(button => {
        button.addEventListener(
          "click",
          () => {
            toggleSetting(
              button.dataset.toggle
            );
          }
        );
      });

    overlay
      .querySelectorAll("[data-number]")
      .forEach(input => {
        input.addEventListener(
          "change",
          () => {
            updateNumber(
              input.dataset.number,
              input.value
            );
          }
        );
      });

    overlay
      .querySelectorAll("[data-action]")
      .forEach(button => {
        button.addEventListener(
          "click",
          async () => {
            const action =
              button.dataset.action;

            if (action === "close") {
              close();
            }

            if (action === "permission") {
              await notifications
                .requestPermission();

              render();

              if (
                notifications.permissionStatus() ===
                "granted"
              ) {
                notifications.start();
              }
            }

            if (action === "test") {
              const permission =
                notifications.permissionStatus();

              if (permission !== "granted") {
                await notifications
                  .requestPermission();
              }

              if (
                notifications.permissionStatus() ===
                "granted"
              ) {
                notifications.notify(
                  "MyRoutine test",
                  {
                    body:
                      "Notifications are working correctly."
                  }
                );
              }

              render();
            }

            if (action === "reset") {
              notifications.resetSettings();

              render();
            }
          }
        );
      });
  }

  /* ---------------------------------------------------------
     Open / close settings UI
     --------------------------------------------------------- */

  function open() {
    injectStyles();

    if (overlay) {
      render();
      return;
    }

    overlay =
      document.createElement("div");

    overlay.className =
      "mr-notification-overlay";

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

  notifications.open =
    open;

  notifications.close =
    close;

})();
/* =========================================================
   MyRoutine — Notifications Finalization
   ========================================================= */

(function () {
  "use strict";

  const notifications =
    window.MyRoutineNotifications;

  if (!notifications) return;

  /* ---------------------------------------------------------
     Automatic scheduler lifecycle
     --------------------------------------------------------- */

  function startIfAllowed() {
    const settings =
      notifications.getSettings();

    if (!settings.enabled) {
      return;
    }

    if (
      notifications.permissionStatus() ===
      "granted"
    ) {
      notifications.start();
    }
  }

  function stopIfDisabled() {
    const settings =
      notifications.getSettings();

    if (!settings.enabled) {
      notifications.stop();
    }
  }

  /* ---------------------------------------------------------
     React to settings changes
     --------------------------------------------------------- */

  document.addEventListener(
    "myroutine:notification-settings-changed",
    function () {
      stopIfDisabled();
      startIfAllowed();
    }
  );

  /* ---------------------------------------------------------
     React to routine changes
     --------------------------------------------------------- */

  document.addEventListener(
    "myroutine:ready",
    function () {
      startIfAllowed();
    }
  );

  document.addEventListener(
    "myroutine:storage-loaded",
    function () {
      startIfAllowed();
    }
  );

  document.addEventListener(
    "myroutine:routine-changed",
    function () {
      notifications.check();
    }
  );

  /* ---------------------------------------------------------
     Manual reminder helpers
     --------------------------------------------------------- */

  function remind(title, body, options) {
    options = options || {};

    return notifications.notify(
      title || "MyRoutine Reminder",
      {
        body:
          body ||
          "You have a reminder from MyRoutine.",

        tag:
          options.tag ||
          "myroutine-manual-reminder",

        requireInteraction:
          options.requireInteraction ||
          false
      }
    );
  }

  function remindClass(subject, minutes) {
    const text =
      minutes > 0
        ? `${subject || "Your class"} starts in ${minutes} minutes.`
        : `${subject || "Your class"} is starting now.`;

    return remind(
      "📚 Upcoming class",
      text,
      {
        tag:
          "manual-class-" +
          Date.now()
      }
    );
  }

  function remindExam(exam, dateText) {
    return remind(
      "📝 Exam reminder",
      `${exam || "Your exam"}${dateText ? " — " + dateText : ""}`,
      {
        tag:
          "manual-exam-" +
          Date.now(),
        requireInteraction: true
      }
    );
  }

  /* ---------------------------------------------------------
     Notification history
     --------------------------------------------------------- */

  function clearHistory() {
    try {
      localStorage.removeItem(
        "myroutine_sent_notifications"
      );

      return true;
    } catch {
      return false;
    }
  }

  /* ---------------------------------------------------------
     Browser visibility handling
     --------------------------------------------------------- */

  document.addEventListener(
    "visibilitychange",
    function () {
      /*
        When the user returns to the app,
        immediately check reminders rather
        than waiting for the next minute tick.
      */

      if (
        document.visibilityState ===
        "visible"
      ) {
        notifications.check();
      }
    }
  );

  /* ---------------------------------------------------------
     Public API
     --------------------------------------------------------- */

  notifications.remind =
    remind;

  notifications.remindClass =
    remindClass;

  notifications.remindExam =
    remindExam;

  notifications.clearHistory =
    clearHistory;

  notifications.startIfAllowed =
    startIfAllowed;

  /* ---------------------------------------------------------
     Initial startup
     --------------------------------------------------------- */

  setTimeout(
    function () {
      startIfAllowed();
    },
    500
  );

  console.log(
    "MyRoutine Notifications ready."
  );

})();