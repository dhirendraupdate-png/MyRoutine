/* MyRoutine — Universal Routine Editor */

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

  function getRoutine() {
    return window.MyRoutine?.getActiveRoutine?.() || null;
  }

  function save() {
    window.MyRoutine?.saveRoutines?.();
  }

  function esc(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function ensureSchedule(routine) {
    if (!routine.schedule) {
      routine.schedule = {};
    }

    DAYS.forEach(day => {
      if (!Array.isArray(routine.schedule[day])) {
        routine.schedule[day] = [];
      }
    });
  }

  function formatTime(value) {
    if (!value) return "";

    const match = /^(\d{1,2}):(\d{2})$/.exec(value);

    if (!match) return value;

    let hour = Number(match[1]);
    const minute = match[2];

    const suffix = hour >= 12 ? "PM" : "AM";

    hour = hour % 12 || 12;

    return `${hour}:${minute} ${suffix}`;
  }

  function addStyles() {
    if (document.getElementById("myroutine-editor-styles")) {
      return;
    }

    const style = document.createElement("style");

    style.id = "myroutine-editor-styles";

    style.textContent = `
      .mr-editor-backdrop {
        position: fixed;
        inset: 0;
        z-index: 9999;
        display: none;
        background: rgba(15,23,42,.58);
        backdrop-filter: blur(7px);
        padding: 14px;
        overflow: auto;
      }

      .mr-editor-backdrop.open {
        display: block;
      }

      .mr-editor {
        width: min(1100px,100%);
        min-height: calc(100vh - 28px);
        margin: auto;
        background: #fff;
        border-radius: 24px;
        box-shadow: 0 30px 90px rgba(0,0,0,.25);
        overflow: hidden;
      }

      .mr-editor-head {
        position: sticky;
        top: 0;
        z-index: 3;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        padding: 18px 20px;
        border-bottom: 1px solid #e5e7eb;
        background: rgba(255,255,255,.94);
        backdrop-filter: blur(14px);
      }

      .mr-editor-head h2 {
        font-size: 1.25rem;
        margin: 0;
      }

      .mr-editor-head p {
        font-size: .82rem;
        color: #6b7280;
        margin-top: 3px;
      }

      .mr-editor-close {
        width: 40px;
        height: 40px;
        border: 0;
        border-radius: 11px;
        background: #f3f4f6;
        font-size: 1.25rem;
      }

      .mr-tabs {
        display: flex;
        gap: 7px;
        overflow-x: auto;
        padding: 12px 20px;
        border-bottom: 1px solid #e5e7eb;
      }

      .mr-tab {
        border: 0;
        background: #f3f4f6;
        color: #374151;
        padding: 9px 14px;
        border-radius: 10px;
        font-weight: 700;
        white-space: nowrap;
      }

      .mr-tab.active {
        background: #2563eb;
        color: white;
      }

      .mr-editor-body {
        padding: 20px;
      }

      .mr-panel {
        display: none;
      }

      .mr-panel.active {
        display: block;
      }

      .mr-toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        flex-wrap: wrap;
        margin-bottom: 18px;
      }

      .mr-toolbar h3 {
        font-size: 1.1rem;
      }

      .mr-muted {
        color: #6b7280;
        font-size: .9rem;
      }

      .mr-grid {
        display: grid;
        grid-template-columns: repeat(2,minmax(0,1fr));
        gap: 14px;
      }

      .mr-field {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .mr-field label {
        font-size: .8rem;
        font-weight: 700;
        color: #374151;
      }

      .mr-field input,
      .mr-field select {
        width: 100%;
        padding: 11px 12px;
        border: 1px solid #dbe0e7;
        border-radius: 10px;
        outline: 0;
        background: white;
      }

      .mr-field input:focus,
      .mr-field select:focus {
        border-color: #2563eb;
        box-shadow: 0 0 0 3px rgba(37,99,235,.1);
      }

      .mr-full {
        grid-column: 1/-1;
      }
            .mr-list {
        display: grid;
        gap: 10px;
      }

      .mr-item {
        border: 1px solid #e5e7eb;
        border-radius: 14px;
        padding: 14px;
        background: white;
      }

      .mr-item-top {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 12px;
      }

      .mr-item-title {
        font-weight: 800;
      }

      .mr-item-sub {
        font-size: .82rem;
        color: #6b7280;
        margin-top: 4px;
      }

      .mr-actions {
        display: flex;
        gap: 7px;
        flex-wrap: wrap;
      }

      .mr-btn {
        border: 0;
        border-radius: 9px;
        padding: 9px 12px;
        font-weight: 700;
        background: #f3f4f6;
        color: #111827;
      }

      .mr-btn.primary {
        background: #2563eb;
        color: white;
      }

      .mr-btn.danger {
        background: #fee2e2;
        color: #b91c1c;
      }

      .mr-day {
        border: 1px solid #e5e7eb;
        border-radius: 16px;
        overflow: hidden;
        margin-bottom: 14px;
      }

      .mr-day-head {
        padding: 13px 15px;
        background: #f8fafc;
        display: flex;
        justify-content: space-between;
        gap: 10px;
        font-weight: 800;
      }

      .mr-assignment {
        display: grid;
        grid-template-columns: 160px 1fr auto;
        gap: 10px;
        align-items: center;
        padding: 12px 15px;
        border-top: 1px solid #eef0f3;
      }

      .mr-assignment-time {
        font-size: .85rem;
        color: #4b5563;
        font-weight: 700;
      }

      .mr-assignment select {
        width: 100%;
        padding: 10px;
        border: 1px solid #dbe0e7;
        border-radius: 10px;
        background: white;
      }

      .mr-empty {
        padding: 18px;
        text-align: center;
        color: #6b7280;
        font-size: .9rem;
      }

      .mr-note {
        padding: 12px 14px;
        border-radius: 12px;
        background: #eff6ff;
        color: #1e40af;
        font-size: .86rem;
        margin-bottom: 16px;
      }

      @media(max-width:700px) {
        .mr-grid {
          grid-template-columns: 1fr;
        }

        .mr-full {
          grid-column: auto;
        }

        .mr-assignment {
          grid-template-columns: 1fr;
        }

        .mr-editor-body {
          padding: 14px;
        }

        .mr-editor-head {
          padding: 14px;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function createEditor() {
    if (document.getElementById("myroutineEditor")) {
      return;
    }

    const shell = document.createElement("div");

    shell.id = "myroutineEditor";
    shell.className = "mr-editor-backdrop";

    shell.innerHTML = `
      <div class="mr-editor">

        <div class="mr-editor-head">
          <div>
            <h2 id="mrEditorTitle">
              Routine Editor
            </h2>

            <p id="mrEditorSubtitle">
              Customize your timetable
            </p>
          </div>

          <button
            class="mr-editor-close"
            type="button"
            data-mr-close>
            ×
          </button>
        </div>

        <div class="mr-tabs">

          <button
            class="mr-tab active"
            data-mr-tab="overview">
            Overview
          </button>

          <button
            class="mr-tab"
            data-mr-tab="periods">
            Periods
          </button>

          <button
            class="mr-tab"
            data-mr-tab="subjects">
            Subjects
          </button>

          <button
            class="mr-tab"
            data-mr-tab="schedule">
            Weekly Schedule
          </button>

        </div>

        <div class="mr-editor-body">

          <section
            class="mr-panel active"
            data-mr-panel="overview">
          </section>

          <section
            class="mr-panel"
            data-mr-panel="periods">
          </section>

          <section
            class="mr-panel"
            data-mr-panel="subjects">
          </section>

          <section
            class="mr-panel"
            data-mr-panel="schedule">
          </section>

        </div>

      </div>
    `;

    document.body.appendChild(shell);

    shell.addEventListener("click", event => {

      if (
        event.target === shell ||
        event.target.matches("[data-mr-close]")
      ) {
        closeEditor();
      }

    });

    shell
      .querySelectorAll("[data-mr-tab]")
      .forEach(button => {

        button.addEventListener(
          "click",
          () => {
            switchTab(
              button.dataset.mrTab
            );
          }
        );

      });
  }

  function openEditor(id) {

    const routine =
      window.MyRoutine
        ?.state
        ?.data
        ?.routines
        ?.find(
          r => r.id === id
        );

    if (!routine) return;

    window.MyRoutine
      .state
      .activeRoutineId = id;

    save();

    ensureSchedule(routine);

    addStyles();

    createEditor();

    document
      .getElementById(
        "myroutineEditor"
      )
      .classList.add("open");

    document.body.style.overflow =
      "hidden";

    renderAll();

    switchTab("overview");
  }

  function closeEditor() {

    const editor =
      document.getElementById(
        "myroutineEditor"
      );

    if (editor) {
      editor.classList.remove("open");
    }

    document.body.style.overflow =
      "";
  }

  function switchTab(tab) {

    document
      .querySelectorAll(".mr-tab")
      .forEach(button => {

        button.classList.toggle(
          "active",
          button.dataset.mrTab === tab
        );

      });

    document
      .querySelectorAll(".mr-panel")
      .forEach(panel => {

        panel.classList.toggle(
          "active",
          panel.dataset.mrPanel === tab
        );

      });

    if (tab === "overview") {
      renderOverview();
    }

    if (tab === "periods") {
      renderPeriods();
    }

    if (tab === "subjects") {
      renderSubjects();
    }

    if (tab === "schedule") {
      renderSchedule();
    }
  }

  function renderAll() {

    const routine =
      getRoutine();

    if (!routine) return;

    document.getElementById(
      "mrEditorTitle"
    ).textContent =
      routine.name ||
      "Routine Editor";

    document.getElementById(
      "mrEditorSubtitle"
    ).textContent =
      `${routine.institution?.name || "My Institution"} · ${
        routine.academic?.course || "Routine"
      }`;

    renderOverview();
    renderPeriods();
    renderSubjects();
    renderSchedule();
  }
    function renderOverview() {

    const routine =
      getRoutine();

    const panel =
      document.querySelector(
        '[data-mr-panel="overview"]'
      );

    if (!routine || !panel) return;

    panel.innerHTML = `
      <div class="mr-toolbar">

        <div>
          <h3>
            Routine information
          </h3>

          <div class="mr-muted">
            These details can be changed anytime.
          </div>
        </div>

        <button
          class="mr-btn primary"
          data-mr-save-overview>
          Save changes
        </button>

      </div>

      <div class="mr-grid">

        <div class="mr-field mr-full">

          <label>
            Routine name
          </label>

          <input
            id="mrRoutineName"
            value="${esc(routine.name)}">

        </div>

        <div class="mr-field">

          <label>
            Institution type
          </label>

          <select id="mrInstitutionType">

            ${[
              "School",
              "College",
              "University",
              "Coaching Institute",
              "Training Institute",
              "Personal",
              "Other"
            ].map(v => `
              <option
                ${
                  routine.institution?.type === v
                    ? "selected"
                    : ""
                }>
                ${v}
              </option>
            `).join("")}

          </select>

        </div>

        <div class="mr-field">

          <label>
            Institution name
          </label>

          <input
            id="mrInstitutionName"
            value="${esc(
              routine.institution?.name
            )}">

        </div>

        <div class="mr-field">

          <label>
            Class / Course
          </label>

          <input
            id="mrCourse"
            value="${esc(
              routine.academic?.course
            )}">

        </div>

        <div class="mr-field">

          <label>
            Section / Semester
          </label>

          <input
            id="mrSection"
            value="${esc(
              routine.academic?.section
            )}">

        </div>

        <div class="mr-field">

          <label>
            Academic session
          </label>

          <input
            id="mrSession"
            value="${esc(
              routine.academic?.session
            )}">

        </div>

        <div class="mr-field">

          <label>
            Week starts on
          </label>

          <select id="mrWeekStart">

            <option
              ${
                routine.settings?.weekStartsOn ===
                "Monday"
                  ? "selected"
                  : ""
              }>
              Monday
            </option>

            <option
              ${
                routine.settings?.weekStartsOn ===
                "Sunday"
                  ? "selected"
                  : ""
              }>
              Sunday
            </option>

          </select>

        </div>

      </div>
    `;

    panel
      .querySelector(
        "[data-mr-save-overview]"
      )
      .onclick = () => {

        routine.name =
          document
            .getElementById(
              "mrRoutineName"
            )
            .value
            .trim() ||
          "My Routine";

        routine.institution =
          routine.institution || {};

        routine.institution.type =
          document
            .getElementById(
              "mrInstitutionType"
            )
            .value;

        routine.institution.name =
          document
            .getElementById(
              "mrInstitutionName"
            )
            .value
            .trim() ||
          "My Institution";

        routine.academic =
          routine.academic || {};

        routine.academic.course =
          document
            .getElementById(
              "mrCourse"
            )
            .value
            .trim();

        routine.academic.section =
          document
            .getElementById(
              "mrSection"
            )
            .value
            .trim();

        routine.academic.session =
          document
            .getElementById(
              "mrSession"
            )
            .value
            .trim();

        routine.settings =
          routine.settings || {};

        routine.settings.weekStartsOn =
          document
            .getElementById(
              "mrWeekStart"
            )
            .value;

        save();

        renderAll();

        alert(
          "Routine details saved."
        );
      };
  }

  function renderPeriods() {

    const routine =
      getRoutine();

    const panel =
      document.querySelector(
        '[data-mr-panel="periods"]'
      );

    if (!routine || !panel) return;

    const periods =
      routine.periods || [];

    panel.innerHTML = `
      <div class="mr-toolbar">

        <div>
          <h3>
            Periods & breaks
          </h3>

          <div class="mr-muted">
            Create any timetable structure you need.
          </div>
        </div>

        <button
          class="mr-btn primary"
          data-add-period>
          + Add period
        </button>

      </div>

      <div class="mr-note">
        A period can be a normal class,
        lab, practical, break, lunch,
        activity or any custom slot.
      </div>

      <div class="mr-list">

        ${
          periods.length
            ? periods.map(
                (period,index) => `
                  <div class="mr-item">

                    <div class="mr-item-top">

                      <div>

                        <div class="mr-item-title">
                          ${index + 1}.
                          ${esc(period.name)}
                        </div>

                        <div class="mr-item-sub">
                          ${esc(
                            formatTime(
                              period.start
                            )
                          )}
                          –
                          ${esc(
                            formatTime(
                              period.end
                            )
                          )}
                          ·
                          ${esc(
                            period.type ||
                            "class"
                          )}
                        </div>

                      </div>

                      <div class="mr-actions">

                        <button
                          class="mr-btn"
                          data-edit-period="${esc(
                            period.id
                          )}">
                          Edit
                        </button>

                        <button
                          class="mr-btn danger"
                          data-delete-period="${esc(
                            period.id
                          )}">
                          Delete
                        </button>

                      </div>

                    </div>

                  </div>
                `
              ).join("")
            : `
              <div class="mr-empty">
                No periods yet.
                Add your first period.
              </div>
            `
        }

      </div>
    `;

    panel
      .querySelector(
        "[data-add-period]"
      )
      .onclick = () => {

        const name =
          prompt(
            "Period name",
            `Period ${
              periods.length + 1
            }`
          );

        if (name === null) return;

        const start =
          prompt(
            "Start time (24-hour format)",
            "08:00"
          );

        if (start === null) return;

        const end =
          prompt(
            "End time (24-hour format)",
            "08:45"
          );

        if (end === null) return;

        const type =
          prompt(
            "Type: class / break / lab / activity",
            "class"
          );

        if (type === null) return;

        window.MyRoutine.addPeriod(
          routine,
          {
            name:
              name.trim() ||
              `Period ${
                periods.length + 1
              }`,

            start:
              start.trim() ||
              "08:00",

            end:
              end.trim() ||
              "08:45",

            type:
              type.trim() ||
              "class"
          }
        );

        renderPeriods();
        renderSchedule();
      };

    panel
      .querySelectorAll(
        "[data-delete-period]"
      )
      .forEach(button => {

        button.onclick = () => {

          if (
            !confirm(
              "Delete this period and its weekly assignments?"
            )
          ) {
            return;
          }

          window.MyRoutine.removePeriod(
            routine,
            button.dataset.deletePeriod
          );

          renderPeriods();
          renderSchedule();
        };

      });

    panel
      .querySelectorAll(
        "[data-edit-period]"
      )
      .forEach(button => {

        button.onclick = () => {

          editPeriod(
            routine,
            button.dataset.editPeriod
          );

        };

      });
  }

  function editPeriod(
    routine,
    id
  ) {

    const period =
      (routine.periods || [])
        .find(
          p => p.id === id
        );

    if (!period) return;

    const name =
      prompt(
        "Period name",
        period.name
      );

    if (name === null) return;

    const start =
      prompt(
        "Start time",
        period.start
      );

    if (start === null) return;

    const end =
      prompt(
        "End time",
        period.end
      );

    if (end === null) return;

    const type =
      prompt(
        "Type",
        period.type ||
        "class"
      );

    if (type === null) return;

    period.name =
      name.trim() ||
      period.name;

    period.start =
      start.trim() ||
      period.start;

    period.end =
      end.trim() ||
      period.end;

    period.type =
      type.trim() ||
      "class";

    save();

    renderPeriods();
    renderSchedule();
  }

  function renderSubjects() {

    const routine =
      getRoutine();

    const panel =
      document.querySelector(
        '[data-mr-panel="subjects"]'
      );

    if (!routine || !panel) return;

    const subjects =
      routine.subjects || [];

    panel.innerHTML = `
      <div class="mr-toolbar">

        <div>
          <h3>
            Subjects & activities
          </h3>

          <div class="mr-muted">
            Add anything that can appear
            in your timetable.
          </div>
        </div>

        <button
          class="mr-btn primary"
          data-add-subject>
          + Add subject
        </button>

      </div>

      <div class="mr-list">

        ${
          subjects.length
            ? subjects.map(
                subject => `
                  <div class="mr-item">

                    <div class="mr-item-top">

                      <div>

                        <div class="mr-item-title">
                          ${esc(
                            subject.name
                          )}
                        </div>

                        <div class="mr-item-sub">

                          ${esc(
                            subject.code ||
                            "No code"
                          )}

                          ${
                            subject.teacher
                              ? ` · ${esc(
                                  subject.teacher
                                )}`
                              : ""
                          }

                          ${
                            subject.room
                              ? ` · ${esc(
                                  subject.room
                                )}`
                              : ""
                          }

                        </div>

                      </div>

                      <div class="mr-actions">

                        <button
                          class="mr-btn"
                          data-edit-subject="${esc(
                            subject.id
                          )}">
                          Edit
                        </button>

                        <button
                          class="mr-btn danger"
                          data-delete-subject="${esc(
                            subject.id
                          )}">
                          Delete
                        </button>

                      </div>

                    </div>

                  </div>
                `
              ).join("")
            : `
              <div class="mr-empty">
                No subjects yet.
                Add your first one.
              </div>
            `
        }

      </div>
    `;

    panel
      .querySelector(
        "[data-add-subject]"
      )
      .onclick = () =>
        addSubject(routine);

    panel
      .querySelectorAll(
        "[data-delete-subject]"
      )
      .forEach(button => {

        button.onclick = () => {

          if (
            !confirm(
              "Delete this subject and its weekly assignments?"
            )
          ) {
            return;
          }

          window.MyRoutine.removeSubject(
            routine,
            button.dataset.deleteSubject
          );

          renderSubjects();
          renderSchedule();
        };

      });

    panel
      .querySelectorAll(
        "[data-edit-subject]"
      )
      .forEach(button => {

        button.onclick = () =>
          editSubject(
            routine,
            button.dataset.editSubject
          );

      });
      }
    function addSubject(routine) {

    const name =
      prompt(
        "Subject / activity name",
        "New Subject"
      );

    if (name === null) return;

    const code =
      prompt(
        "Short code (optional)",
        ""
      );

    if (code === null) return;

    const teacher =
      prompt(
        "Teacher / instructor (optional)",
        ""
      );

    if (teacher === null) return;

    const room =
      prompt(
        "Room / location (optional)",
        ""
      );

    if (room === null) return;

    const type =
      prompt(
        "Type: theory / lab / practical / activity",
        "theory"
      );

    if (type === null) return;

    window.MyRoutine.addSubject(
      routine,
      {
        name:
          name.trim() ||
          "New Subject",

        code:
          code.trim(),

        teacher:
          teacher.trim(),

        room:
          room.trim(),

        type:
          type.trim() ||
          "theory"
      }
    );

    renderSubjects();
    renderSchedule();
  }

  function editSubject(
    routine,
    id
  ) {

    const subject =
      (routine.subjects || [])
        .find(
          s => s.id === id
        );

    if (!subject) return;

    const name =
      prompt(
        "Subject / activity name",
        subject.name
      );

    if (name === null) return;

    const code =
      prompt(
        "Short code",
        subject.code || ""
      );

    if (code === null) return;

    const teacher =
      prompt(
        "Teacher / instructor",
        subject.teacher || ""
      );

    if (teacher === null) return;

    const room =
      prompt(
        "Room / location",
        subject.room || ""
      );

    if (room === null) return;

    const type =
      prompt(
        "Type",
        subject.type ||
        "theory"
      );

    if (type === null) return;

    subject.name =
      name.trim() ||
      subject.name;

    subject.code =
      code.trim();

    subject.teacher =
      teacher.trim();

    subject.room =
      room.trim();

    subject.type =
      type.trim() ||
      "theory";

    save();

    renderSubjects();
    renderSchedule();
  }

  function renderSchedule() {

    const routine =
      getRoutine();

    const panel =
      document.querySelector(
        '[data-mr-panel="schedule"]'
      );

    if (!routine || !panel) return;

    ensureSchedule(routine);

    const workingDays =
      routine.settings?.workingDays?.length
        ? routine.settings.workingDays
        : DAYS.slice(0,6);

    const periods =
      routine.periods || [];

    const subjects =
      routine.subjects || [];

    panel.innerHTML = `

      <div class="mr-toolbar">

        <div>

          <h3>
            Weekly schedule
          </h3>

          <div class="mr-muted">
            Assign a subject or activity
            to each time slot.
          </div>

        </div>

        <button
          class="mr-btn primary"
          data-add-day>
          + Add day
        </button>

      </div>

      ${
        periods.length &&
        subjects.length

          ? workingDays
              .map(
                day =>
                  renderDay(
                    routine,
                    day,
                    periods,
                    subjects
                  )
              )
              .join("")

          : `
            <div class="mr-empty">
              Add at least one period
              and one subject before
              building your weekly schedule.
            </div>
          `
      }

    `;

    panel
      .querySelector(
        "[data-add-day]"
      )
      .onclick = () => {

        const day =
          prompt(
            "Enter a day name",
            "Sunday"
          );

        if (!day) return;

        const normalized =
          day.trim();

        if (!normalized) return;

        if (
          !routine.settings.workingDays
            .includes(normalized)
        ) {

          routine.settings
            .workingDays
            .push(normalized);

          ensureSchedule(routine);

          save();

          renderSchedule();
        }
      };

    panel
      .querySelectorAll(
        "[data-assignment]"
      )
      .forEach(select => {

        select.addEventListener(
          "change",
          () => {

            window.MyRoutine.setClass(
              routine,
              select.dataset.day,
              select.dataset.period,
              select.value
            );

            renderSchedule();
          }
        );

      });
  }

  function renderDay(
    routine,
    day,
    periods,
    subjects
  ) {

    const assignments =
      routine.schedule?.[day] ||
      [];

    return `

      <div class="mr-day">

        <div class="mr-day-head">

          <span>
            ${esc(day)}
          </span>

          <span>
            ${assignments.length}
            assigned
          </span>

        </div>

        ${
          periods.map(
            period => {

              const assignment =
                assignments.find(
                  item =>
                    item.periodId ===
                    period.id
                );

              const selectedSubject =
                assignment?.subjectId ||
                "";

              const isBreak =
                String(
                  period.type ||
                  ""
                ).toLowerCase() ===
                "break";

              return `

                <div class="mr-assignment">

                  <div
                    class="mr-assignment-time">

                    ${esc(
                      formatTime(
                        period.start
                      )
                    )}

                    –

                    ${esc(
                      formatTime(
                        period.end
                      )
                    )}

                    <br>

                    <small>
                      ${esc(
                        period.name
                      )}
                    </small>

                  </div>

                  <select
                    data-assignment
                    data-day="${esc(day)}"
                    data-period="${esc(
                      period.id
                    )}"
                    ${
                      isBreak
                        ? "disabled"
                        : ""
                    }>

                    <option value="">
                      ${
                        isBreak
                          ? "Break / empty slot"
                          : "Select subject or activity"
                      }
                    </option>

                    ${
                      subjects.map(
                        subject => `

                          <option
                            value="${esc(
                              subject.id
                            )}"

                            ${
                              selectedSubject ===
                              subject.id
                                ? "selected"
                                : ""
                            }>

                            ${esc(
                              subject.name
                            )}

                            ${
                              subject.code
                                ? ` (${esc(
                                    subject.code
                                  )})`
                                : ""
                            }

                          </option>

                        `
                      ).join("")
                    }

                  </select>

                  <button
                    class="mr-btn"
                    type="button"
                    data-clear="${esc(
                      day
                    )}|${esc(
                      period.id
                    )}">
                    Clear
                  </button>

                </div>

              `;
            }
          ).join("")
        }

      </div>
    `;
  }

  document.addEventListener(
    "click",
    event => {

      const clear =
        event.target.closest(
          "[data-clear]"
        );

      if (!clear) return;

      const routine =
        getRoutine();

      if (!routine) return;

      const parts =
        clear.dataset.clear.split("|");

      window.MyRoutine.setClass(
        routine,
        parts[0],
        parts[1],
        ""
      );

      renderSchedule();
    }
  );

  window.MyRoutineEditor = {
    open: openEditor,
    close: closeEditor,
    refresh: renderAll
  };

  window.addEventListener(
    "keydown",
    event => {

      if (
        event.key === "Escape"
      ) {
        closeEditor();
      }

    }
  );

})();
