/* =========================================================
   MyRoutine — Print & Printable Views
   Part 1/4
   ========================================================= */

(function () {
  "use strict";

  const PRINT_VERSION = "1.0.0";

  const state = {
    mode: "weekly",
    routineId: null,
    options: {
      showTeacher: true,
      showRoom: true,
      showSubjectCode: true,
      showEmptyPeriods: true,
      showHeader: true,
      showFooter: true
    }
  };

  /* ---------------------------------------------------------
     Helpers
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
      return (
        window.MyRoutine.state.data.routines
      );
    }

    return [];
  }

  function getRoutine(id) {
    const routines =
      getRoutines();

    if (id) {
      return (
        routines.find(
          function (routine) {
            return (
              routine.id === id
            );
          }
        ) || null
      );
    }

    if (
      window.MyRoutine &&
      typeof
        window.MyRoutine.getActiveRoutine ===
        "function"
    ) {
      return (
        window.MyRoutine
          .getActiveRoutine()
      );
    }

    return routines[0] || null;
  }

  function safeArray(value) {
    return Array.isArray(value)
      ? value
      : [];
  }

  function escapeHTML(value) {
    return String(
      value === undefined ||
      value === null
        ? ""
        : value
    )
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function emit(name, detail) {
    document.dispatchEvent(
      new CustomEvent(
        name,
        {
          detail:
            detail || {}
        }
      )
    );
  }

  function getDays(routine) {
    if (!routine) {
      return [];
    }

    const settings =
      routine.settings || {};

    if (
      Array.isArray(
        settings.workingDays
      ) &&
      settings.workingDays.length
    ) {
      return (
        settings.workingDays
      );
    }

    if (
      routine.schedule &&
      typeof routine.schedule ===
        "object"
    ) {
      return Object.keys(
        routine.schedule
      );
    }

    return [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday"
    ];
  }

  /* ---------------------------------------------------------
     Subject lookup
     --------------------------------------------------------- */

  function findSubject(
    routine,
    value
  ) {
    if (!routine) {
      return null;
    }

    const subjects =
      safeArray(
        routine.subjects
      );

    if (
      value === null ||
      value === undefined
    ) {
      return null;
    }

    return (
      subjects.find(
        function (subject) {
          return (
            subject.id === value ||
            subject.name === value ||
            subject.title === value
          );
        }
      ) || null
    );
  }

  /* ---------------------------------------------------------
     Schedule lookup
     --------------------------------------------------------- */

  function getScheduleEntry(
    routine,
    day,
    periodId,
    index
  ) {
    if (!routine) {
      return null;
    }

    const schedule =
      routine.schedule || {};

    const dayData =
      schedule[day];

    if (!dayData) {
      return null;
    }

    if (
      Array.isArray(dayData)
    ) {
      return (
        dayData[index] ||
        null
      );
    }

    if (
      typeof dayData ===
      "object"
    ) {
      return (
        dayData[periodId] ||
        null
      );
    }

    return null;
  }

  /* ---------------------------------------------------------
     Normalize schedule entry
     --------------------------------------------------------- */

  function normalizeEntry(
    routine,
    entry
  ) {
    if (
      entry === null ||
      entry === undefined ||
      entry === ""
    ) {
      return null;
    }

    if (
      typeof entry ===
      "string"
    ) {
      const subject =
        findSubject(
          routine,
          entry
        );

      return {
        subject:
          subject,

        subjectId:
          entry
      };
    }

    if (
      typeof entry ===
      "object"
    ) {
      const subjectId =
        entry.subjectId ||
        entry.subject_id ||
        entry.subject ||
        null;

      const subject =
        findSubject(
          routine,
          subjectId
        ) ||
        findSubject(
          routine,
          entry.subjectName
        ) ||
        findSubject(
          routine,
          entry.name
        );

      return {
        subject:
          subject,

        subjectId:
          subjectId,

        data:
          entry
      };
    }

    return null;
  }

  /* ---------------------------------------------------------
     Public API
     --------------------------------------------------------- */

  window.MyRoutinePrint = {
    version:
      PRINT_VERSION,

    state,

    getRoutines,

    getRoutine,

    getDays,

    findSubject,

    getScheduleEntry,

    normalizeEntry
  };

  console.log(
    "MyRoutine Print module loaded."
  );

})();
/* =========================================================
   MyRoutine — Print & Printable Views
   Part 2/4
   ========================================================= */

(function () {
  "use strict";

  const print =
    window.MyRoutinePrint;

  if (!print) return;

  /* ---------------------------------------------------------
     Period helpers
     --------------------------------------------------------- */

  function getPeriods(routine) {
    if (!routine) return [];

    return Array.isArray(routine.periods)
      ? routine.periods
      : [];
  }

  function getPeriodLabel(period, index) {
    if (!period) {
      return "Period " + (index + 1);
    }

    return (
      period.name ||
      period.title ||
      "Period " + (index + 1)
    );
  }

  function getPeriodTime(period) {
    if (!period) return "";

    const start =
      period.startTime ||
      period.start ||
      "";

    const end =
      period.endTime ||
      period.end ||
      "";

    if (start && end) {
      return start + " – " + end;
    }

    return start || end || "";
  }

  /* ---------------------------------------------------------
     Subject display
     --------------------------------------------------------- */

  function getSubjectName(subject) {
    if (!subject) return "";

    return (
      subject.name ||
      subject.title ||
      "Untitled"
    );
  }

  function getSubjectMeta(subject) {
    if (!subject) return [];

    const meta = [];

    if (
      print.state.options
        .showSubjectCode &&
      subject.code
    ) {
      meta.push(
        String(subject.code)
      );
    }

    if (
      print.state.options
        .showTeacher &&
      subject.teacher
    ) {
      meta.push(
        String(subject.teacher)
      );
    }

    if (
      print.state.options
        .showRoom &&
      subject.room
    ) {
      meta.push(
        String(subject.room)
      );
    }

    return meta;
  }

  /* ---------------------------------------------------------
     Build weekly data
     --------------------------------------------------------- */

  function buildWeeklyData(routine) {
    if (!routine) {
      return {
        days: [],
        periods: []
      };
    }

    const days =
      print.getDays(routine);

    const periods =
      getPeriods(routine);

    return {
      days: days,
      periods: periods.map(
        function (period, index) {
          return {
            period: period,
            index: index
          };
        }
      )
    };
  }

  /* ---------------------------------------------------------
     Create weekly HTML
     --------------------------------------------------------- */

  function createWeeklyHTML(routine) {
    const data =
      buildWeeklyData(routine);

    let html = "";

    html += `
      <div class="mr-print-weekly">
        <table class="mr-print-table">

          <thead>
            <tr>
              <th class="mr-print-period-column">
                Period
              </th>
    `;

    data.days.forEach(
      function (day) {
        html += `
          <th>
            ${escapeHTML(day)}
          </th>
        `;
      }
    );

    html += `
            </tr>
          </thead>

          <tbody>
    `;

    data.periods.forEach(
      function (item) {
        const period =
          item.period;

        html += `
          <tr>

            <th class="mr-print-period-cell">

              <div class="mr-print-period-name">
                ${escapeHTML(
                  getPeriodLabel(
                    period,
                    item.index
                  )
                )}
              </div>

              ${
                getPeriodTime(
                  period
                )
                  ? `
                    <div class="mr-print-period-time">
                      ${escapeHTML(
                        getPeriodTime(
                          period
                        )
                      )}
                    </div>
                  `
                  : ""
              }

            </th>
        `;

        data.days.forEach(
          function (day) {
            const entry =
              print.getScheduleEntry(
                routine,
                day,
                period &&
                  period.id,
                item.index
              );

            const normalized =
              print.normalizeEntry(
                routine,
                entry
              );

            if (!normalized) {
              html += `
                <td class="mr-print-empty-cell">
                  ${
                    print.state.options
                      .showEmptyPeriods
                      ? "—"
                      : ""
                  }
                </td>
              `;

              return;
            }

            const subject =
              normalized.subject;

            if (!subject) {
              html += `
                <td>
                  <div class="mr-print-unknown">
                    ${escapeHTML(
                      normalized.subjectId ||
                      "Scheduled"
                    )}
                  </div>
                </td>
              `;

              return;
            }

            const meta =
              getSubjectMeta(
                subject
              );

            html += `
              <td>

                <div class="mr-print-subject">
                  ${escapeHTML(
                    getSubjectName(
                      subject
                    )
                  )}
                </div>

                ${
                  meta.length
                    ? `
                      <div class="mr-print-meta">
                        ${meta
                          .map(
                            function (
                              item
                            ) {
                              return escapeHTML(
                                item
                              );
                            }
                          )
                          .join(
                            " • "
                          )}
                      </div>
                    `
                    : ""
                }

              </td>
            `;
          }
        );

        html += `
          </tr>
        `;
      }
    );

    html += `
          </tbody>
        </table>
      </div>
    `;

    return html;
  }

  /* ---------------------------------------------------------
     Create header
     --------------------------------------------------------- */

  function createHeader(routine) {
    if (
      !print.state.options
        .showHeader
    ) {
      return "";
    }

    const name =
      routine.name ||
      "My Routine";

    const institution =
      routine.institutionName ||
      routine.institution ||
      "";

    const course =
      routine.course ||
      "";

    const section =
      routine.section ||
      "";

    const details = [
      institution,
      course,
      section
    ]
      .filter(Boolean)
      .join(" • ");

    return `
      <header class="mr-print-header">

        <div class="mr-print-brand">
          MyRoutine
        </div>

        <h1>
          ${escapeHTML(name)}
        </h1>

        ${
          details
            ? `
              <div class="mr-print-subtitle">
                ${escapeHTML(
                  details
                )}
              </div>
            `
            : ""
        }

      </header>
    `;
  }

  /* ---------------------------------------------------------
     Create footer
     --------------------------------------------------------- */

  function createFooter() {
    if (
      !print.state.options
        .showFooter
    ) {
      return "";
    }

    return `
      <footer class="mr-print-footer">
        Generated with MyRoutine
      </footer>
    `;
  }

  /* ---------------------------------------------------------
     Utility
     --------------------------------------------------------- */

  function escapeHTML(value) {
    return String(
      value === undefined ||
      value === null
        ? ""
        : value
    )
      .replace(
        /&/g,
        "&amp;"
      )
      .replace(
        /</g,
        "&lt;"
      )
      .replace(
        />/g,
        "&gt;"
      )
      .replace(
        /"/g,
        "&quot;"
      )
      .replace(
        /'/g,
        "&#039;"
      );
  }

  /* ---------------------------------------------------------
     Expose API
     --------------------------------------------------------- */

  print.getPeriods =
    getPeriods;

  print.getPeriodLabel =
    getPeriodLabel;

  print.getPeriodTime =
    getPeriodTime;

  print.getSubjectName =
    getSubjectName;

  print.getSubjectMeta =
    getSubjectMeta;

  print.buildWeeklyData =
    buildWeeklyData;

  print.createWeeklyHTML =
    createWeeklyHTML;

  print.createHeader =
    createHeader;

  print.createFooter =
    createFooter;

})();
/* =========================================================
   MyRoutine — Print & Printable Views
   Part 3/4
   ========================================================= */

(function () {
  "use strict";

  const print = window.MyRoutinePrint;

  if (!print) return;

  /* ---------------------------------------------------------
     Print document
     --------------------------------------------------------- */

  function printRoutine(routineId, options) {
    const routine =
      print.getRoutine(routineId);

    if (!routine) {
      console.warn(
        "MyRoutine Print: routine not found."
      );
      return false;
    }

    if (options) {
      print.state.options = {
        ...print.state.options,
        ...options
      };
    }

    print.state.routineId =
      routine.id || null;

    print.state.mode =
      "weekly";

    const documentHTML =
      createPrintDocument(
        routine
      );

    const printWindow =
      window.open(
        "",
        "_blank",
        "width=1200,height=800"
      );

    if (!printWindow) {
      /*
       * Popup blocking can happen on
       * mobile browsers.
       */
      alert(
        "Please allow pop-ups to print your routine."
      );

      return false;
    }

    printWindow.document.open();

    printWindow.document.write(
      documentHTML
    );

    printWindow.document.close();

    /*
     * Give the browser time to render
     * the printable document.
     */
    setTimeout(
      function () {
        try {
          printWindow.focus();
          printWindow.print();
        } catch (error) {
          console.warn(
            "MyRoutine Print failed.",
            error
          );
        }
      },
      400
    );

    emit(
      "myroutine:print-started",
      {
        routineId:
          routine.id || null
      }
    );

    return true;
  }

  /* ---------------------------------------------------------
     Create printable document
     --------------------------------------------------------- */

  function createPrintDocument(
    routine
  ) {
    const title =
      routine.name ||
      "MyRoutine";

    const header =
      print.createHeader(
        routine
      );

    const weekly =
      print.createWeeklyHTML(
        routine
      );

    const footer =
      print.createFooter();

    return `
<!DOCTYPE html>
<html lang="en">

<head>

  <meta charset="UTF-8">

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  >

  <title>
    ${escapeHTML(title)}
  </title>

  <style>

    * {
      box-sizing: border-box;
    }

    html,
    body {
      margin: 0;
      padding: 0;
      background: white;
      color: #111827;
      font-family:
        Arial,
        Helvetica,
        sans-serif;
    }

    body {
      padding: 28px;
    }

    .mr-print-header {
      text-align: center;
      margin-bottom: 24px;
    }

    .mr-print-brand {
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      opacity: .55;
      margin-bottom: 8px;
    }

    .mr-print-header h1 {
      margin: 0;
      font-size: 28px;
      line-height: 1.2;
    }

    .mr-print-subtitle {
      margin-top: 7px;
      font-size: 13px;
      color: #4b5563;
    }

    .mr-print-weekly {
      width: 100%;
      overflow: visible;
    }

    .mr-print-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }

    .mr-print-table th,
    .mr-print-table td {
      border: 1px solid #d1d5db;
      padding: 9px;
      vertical-align: top;
      min-height: 60px;
    }

    .mr-print-table thead th {
      background: #f3f4f6;
      font-size: 12px;
      font-weight: 800;
      text-align: center;
    }

    .mr-print-period-column {
      width: 105px;
    }

    .mr-print-period-cell {
      background: #f9fafb;
      text-align: left;
    }

    .mr-print-period-name {
      font-size: 12px;
      font-weight: 800;
    }

    .mr-print-period-time {
      margin-top: 4px;
      font-size: 10px;
      color: #6b7280;
    }

    .mr-print-subject {
      font-size: 12px;
      font-weight: 800;
      line-height: 1.3;
    }

    .mr-print-meta {
      margin-top: 5px;
      font-size: 9px;
      line-height: 1.3;
      color: #6b7280;
    }

    .mr-print-empty-cell {
      text-align: center;
      color: #9ca3af;
    }

    .mr-print-unknown {
      font-size: 11px;
      font-weight: 700;
    }

    .mr-print-footer {
      margin-top: 18px;
      text-align: center;
      font-size: 9px;
      color: #9ca3af;
    }

    @page {
      size: landscape;
      margin: 10mm;
    }

    @media print {

      body {
        padding: 0;
      }

      .mr-print-table {
        page-break-inside: avoid;
      }

      .mr-print-table tr {
        page-break-inside: avoid;
        page-break-after: auto;
      }

      .mr-print-header {
        page-break-after: avoid;
      }

      .mr-print-footer {
        page-break-before: avoid;
      }

    }

    @media (max-width: 700px) {

      body {
        padding: 12px;
      }

      .mr-print-header h1 {
        font-size: 20px;
      }

      .mr-print-table th,
      .mr-print-table td {
        padding: 5px;
      }

      .mr-print-period-column {
        width: 75px;
      }

      .mr-print-subject {
        font-size: 9px;
      }

      .mr-print-meta {
        font-size: 7px;
      }

    }

  </style>

</head>

<body>

  ${header}

  ${weekly}

  ${footer}

</body>

</html>
    `;
  }

  /* ---------------------------------------------------------
     Print current active routine
     --------------------------------------------------------- */

  function printCurrent(options) {
    const routine =
      print.getRoutine();

    if (!routine) {
      console.warn(
        "MyRoutine Print: no active routine."
      );

      return false;
    }

    return printRoutine(
      routine.id,
      options
    );
  }

  /* ---------------------------------------------------------
     Preview
     --------------------------------------------------------- */

  function preview(routineId) {
    const routine =
      print.getRoutine(
        routineId
      );

    if (!routine) {
      return false;
    }

    const html =
      createPrintDocument(
        routine
      );

    const previewWindow =
      window.open(
        "",
        "_blank",
        "width=1200,height=800"
      );

    if (!previewWindow) {
      alert(
        "Please allow pop-ups to preview your routine."
      );

      return false;
    }

    previewWindow.document.open();

    previewWindow.document.write(
      html
    );

    previewWindow.document.close();

    emit(
      "myroutine:print-preview",
      {
        routineId:
          routine.id || null
      }
    );

    return true;
  }

  /* ---------------------------------------------------------
     Options
     --------------------------------------------------------- */

  function setOptions(options) {
    if (!options) {
      return {
        ...print.state.options
      };
    }

    print.state.options = {
      ...print.state.options,
      ...options
    };

    return {
      ...print.state.options
    };
  }

  function getOptions() {
    return {
      ...print.state.options
    };
  }

  /* ---------------------------------------------------------
     Utility
     --------------------------------------------------------- */

  function escapeHTML(value) {
    return String(
      value === undefined ||
      value === null
        ? ""
        : value
    )
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function emit(name, detail) {
    document.dispatchEvent(
      new CustomEvent(
        name,
        {
          detail:
            detail || {}
        }
      )
    );
  }

  /* ---------------------------------------------------------
     Public API
     --------------------------------------------------------- */

  print.printRoutine =
    printRoutine;

  print.printCurrent =
    printCurrent;

  print.preview =
    preview;

  print.createPrintDocument =
    createPrintDocument;

  print.setOptions =
    setOptions;

  print.getOptions =
    getOptions;

})();
/* =========================================================
   MyRoutine — Print & Printable Views
   Part 4/4
   ========================================================= */

(function () {
  "use strict";

  const print =
    window.MyRoutinePrint;

  if (!print) return;

  /* ---------------------------------------------------------
     Print selected days
     --------------------------------------------------------- */

  function printDays(
    routineId,
    days,
    options
  ) {
    const routine =
      print.getRoutine(
        routineId
      );

    if (!routine) {
      return false;
    }

    if (
      !Array.isArray(days) ||
      !days.length
    ) {
      return print.printRoutine(
        routine.id,
        options
      );
    }

    const originalDays =
      print.getDays;

    print.getDays =
      function () {
        return days;
      };

    try {
      return print.printRoutine(
        routine.id,
        options
      );
    } finally {
      print.getDays =
        originalDays;
    }
  }

  /* ---------------------------------------------------------
     Print subject list
     --------------------------------------------------------- */

  function printSubjectList(
    routineId
  ) {
    const routine =
      print.getRoutine(
        routineId
      );

    if (!routine) {
      return false;
    }

    const subjects =
      Array.isArray(
        routine.subjects
      )
        ? routine.subjects
        : [];

    const rows =
      subjects
        .map(
          function (subject) {
            const code =
              subject.code ||
              "";

            const teacher =
              subject.teacher ||
              "";

            const room =
              subject.room ||
              "";

            return `
              <tr>
                <td>
                  ${escapeHTML(
                    subject.name ||
                    subject.title ||
                    "Untitled"
                  )}
                </td>

                <td>
                  ${escapeHTML(
                    code
                  )}
                </td>

                <td>
                  ${escapeHTML(
                    teacher
                  )}
                </td>

                <td>
                  ${escapeHTML(
                    room
                  )}
                </td>
              </tr>
            `;
          }
        )
        .join("");

    const html = `
      <!DOCTYPE html>

      <html>

      <head>

        <meta charset="UTF-8">

        <title>
          ${escapeHTML(
            routine.name ||
            "Subjects"
          )}
        </title>

        <style>

          body {
            font-family:
              Arial,
              Helvetica,
              sans-serif;

            padding: 30px;
            color: #111827;
          }

          h1 {
            margin-bottom: 5px;
          }

          .subtitle {
            color: #6b7280;
            margin-bottom: 25px;
          }

          table {
            width: 100%;
            border-collapse:
              collapse;
          }

          th,
          td {
            border:
              1px solid #d1d5db;

            padding: 10px;
            text-align: left;
          }

          th {
            background:
              #f3f4f6;
          }

          @page {
            size: portrait;
            margin: 15mm;
          }

        </style>

      </head>

      <body>

        <h1>
          ${escapeHTML(
            routine.name ||
            "Subjects"
          )}
        </h1>

        <div class="subtitle">
          Subject List
        </div>

        <table>

          <thead>
            <tr>
              <th>Subject</th>
              <th>Code</th>
              <th>Teacher</th>
              <th>Room</th>
            </tr>
          </thead>

          <tbody>
            ${
              rows ||
              `
                <tr>
                  <td colspan="4">
                    No subjects found.
                  </td>
                </tr>
              `
            }
          </tbody>

        </table>

      </body>

      </html>
    `;

    return openPrintWindow(
      html,
      true
    );
  }

  /* ---------------------------------------------------------
     Print calendar events
     --------------------------------------------------------- */

  function printEvents(
    routineId
  ) {
    const routine =
      print.getRoutine(
        routineId
      );

    if (!routine) {
      return false;
    }

    const events =
      Array.isArray(
        routine.events
      )
        ? routine.events
        : [];

    const rows =
      events
        .slice()
        .sort(
          function (a, b) {
            return String(
              a.date || ""
            ).localeCompare(
              String(
                b.date || ""
              )
            );
          }
        )
        .map(
          function (event) {
            return `
              <tr>

                <td>
                  ${escapeHTML(
                    event.date ||
                    ""
                  )}
                </td>

                <td>
                  ${escapeHTML(
                    event.title ||
                    event.name ||
                    "Event"
                  )}
                </td>

                <td>
                  ${escapeHTML(
                    event.type ||
                    "event"
                  )}
                </td>

                <td>
                  ${escapeHTML(
                    event.description ||
                    event.note ||
                    ""
                  )}
                </td>

              </tr>
            `;
          }
        )
        .join("");

    const html = `
      <!DOCTYPE html>

      <html>

      <head>

        <meta charset="UTF-8">

        <title>
          ${escapeHTML(
            routine.name ||
            "Calendar"
          )}
        </title>

        <style>

          body {
            font-family:
              Arial,
              Helvetica,
              sans-serif;

            padding: 30px;
            color: #111827;
          }

          h1 {
            margin-bottom: 5px;
          }

          .subtitle {
            color: #6b7280;
            margin-bottom: 25px;
          }

          table {
            width: 100%;
            border-collapse:
              collapse;
          }

          th,
          td {
            border:
              1px solid #d1d5db;

            padding: 10px;
            text-align: left;
            vertical-align: top;
          }

          th {
            background:
              #f3f4f6;
          }

          @page {
            size: portrait;
            margin: 15mm;
          }

        </style>

      </head>

      <body>

        <h1>
          ${escapeHTML(
            routine.name ||
            "Calendar"
          )}
        </h1>

        <div class="subtitle">
          Calendar & Events
        </div>

        <table>

          <thead>
            <tr>
              <th>Date</th>
              <th>Event</th>
              <th>Type</th>
              <th>Description</th>
            </tr>
          </thead>

          <tbody>
            ${
              rows ||
              `
                <tr>
                  <td colspan="4">
                    No events found.
                  </td>
                </tr>
              `
            }
          </tbody>

        </table>

      </body>

      </html>
    `;

    return openPrintWindow(
      html,
      false
    );
  }

  /* ---------------------------------------------------------
     Generic print window
     --------------------------------------------------------- */

  function openPrintWindow(
    html,
    autoPrint
  ) {
    const printWindow =
      window.open(
        "",
        "_blank",
        "width=1200,height=800"
      );

    if (!printWindow) {
      alert(
        "Please allow pop-ups to print."
      );

      return false;
    }

    printWindow.document.open();

    printWindow.document.write(
      html
    );

    printWindow.document.close();

    if (autoPrint !== false) {
      setTimeout(
        function () {
          try {
            printWindow.focus();
            printWindow.print();
          } catch (error) {
            console.warn(
              "Print failed.",
              error
            );
          }
        },
        400
      );
    }

    return true;
  }

  /* ---------------------------------------------------------
     Escape HTML
     --------------------------------------------------------- */

  function escapeHTML(value) {
    return String(
      value === undefined ||
      value === null
        ? ""
        : value
    )
      .replace(
        /&/g,
        "&amp;"
      )
      .replace(
        /</g,
        "&lt;"
      )
      .replace(
        />/g,
        "&gt;"
      )
      .replace(
        /"/g,
        "&quot;"
      )
      .replace(
        /'/g,
        "&#039;"
      );
  }

  /* ---------------------------------------------------------
     Public API
     --------------------------------------------------------- */

  print.printDays =
    printDays;

  print.printSubjectList =
    printSubjectList;

  print.printEvents =
    printEvents;

  print.openPrintWindow =
    openPrintWindow;

  console.log(
    "MyRoutine Print & Export ready."
  );

})();