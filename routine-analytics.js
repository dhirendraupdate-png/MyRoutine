/* =========================================================
   MyRoutine — Analytics Engine
   Part 1/4
   ========================================================= */

(function () {
  "use strict";

  const ANALYTICS_VERSION = "1.0.0";

  const state = {
    lastReport: null,
    lastUpdated: null
  };

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

  function getRoutines() {
    if (
      window.MyRoutine &&
      window.MyRoutine.state &&
      window.MyRoutine.state.data &&
      Array.isArray(
        window.MyRoutine.state.data.routines
      )
    ) {
      return window.MyRoutine.state.data.routines;
    }

    return [];
  }

  function safeArray(value) {
    return Array.isArray(value)
      ? value
      : [];
  }

  function emit(name, detail) {
    document.dispatchEvent(
      new CustomEvent(name, {
        detail: detail || {}
      })
    );
  }

  function getWorkingDays(routine) {
    if (!routine) return [];

    const settings =
      routine.settings || {};

    if (
      Array.isArray(
        settings.workingDays
      )
    ) {
      return settings.workingDays;
    }

    return [];
  }

  function getScheduleEntries(routine) {
    if (!routine) return [];

    const schedule =
      routine.schedule || {};

    const entries = [];

    Object.keys(schedule).forEach(
      function (day) {
        const dayData =
          schedule[day];

        if (Array.isArray(dayData)) {
          dayData.forEach(
            function (entry, index) {
              if (
                entry !== null &&
                entry !== undefined &&
                entry !== ""
              ) {
                entries.push({
                  day: day,
                  periodId: null,
                  index: index,
                  entry: entry
                });
              }
            }
          );

          return;
        }

        if (
          dayData &&
          typeof dayData === "object"
        ) {
          Object.keys(dayData).forEach(
            function (periodId) {
              const entry =
                dayData[periodId];

              if (
                entry !== null &&
                entry !== undefined &&
                entry !== ""
              ) {
                entries.push({
                  day: day,
                  periodId: periodId,
                  index: null,
                  entry: entry
                });
              }
            }
          );
        }
      }
    );

    return entries;
  }

  function countScheduleEntries(routine) {
    return getScheduleEntries(
      routine
    ).length;
  }

  function getSubjectFromEntry(
    routine,
    entry
  ) {
    if (!routine || !entry) {
      return null;
    }

    const subjects =
      safeArray(
        routine.subjects
      );

    let subjectId = null;
    let subjectName = null;

    if (
      typeof entry === "string"
    ) {
      subjectId = entry;
      subjectName = entry;
    } else if (
      typeof entry === "object"
    ) {
      subjectId =
        entry.subjectId ||
        entry.subject_id ||
        entry.subject ||
        entry.id ||
        null;

      subjectName =
        entry.subjectName ||
        entry.subjectTitle ||
        entry.name ||
        null;
    }

    return (
      subjects.find(
        function (subject) {
          return (
            subject.id ===
              subjectId ||
            subject.name ===
              subjectId ||
            subject.title ===
              subjectId ||
            subject.id ===
              subjectName ||
            subject.name ===
              subjectName ||
            subject.title ===
              subjectName
          );
        }
      ) || null
    );
  }

  /* ---------------------------------------------------------
     Basic statistics
     --------------------------------------------------------- */

  function getBasicStats(routine) {
    routine =
      routine || getRoutine();

    if (!routine) {
      return {
        subjects: 0,
        periods: 0,
        scheduledClasses: 0,
        events: 0,
        workingDays: 0
      };
    }

    return {
      subjects:
        safeArray(
          routine.subjects
        ).length,

      periods:
        safeArray(
          routine.periods
        ).length,

      scheduledClasses:
        countScheduleEntries(
          routine
        ),

      events:
        safeArray(
          routine.events
        ).length,

      workingDays:
        getWorkingDays(
          routine
        ).length
    };
  }
/* =========================================================
   MyRoutine — Analytics Engine
   Part 2/4
   ========================================================= */

(function () {
  "use strict";

  const analytics =
    window.MyRoutineAnalytics;

  /*
   * Part 1 creates the base object later in the file.
   * This part waits safely if the object is not available.
   */
  if (!analytics) {
    console.warn(
      "MyRoutine Analytics: base module not found."
    );
    return;
  }

  /* ---------------------------------------------------------
     Subject statistics
     --------------------------------------------------------- */

  function countSubjectClasses(
    routine,
    subject
  ) {
    if (!routine || !subject) {
      return 0;
    }

    const entries =
      getScheduleEntries(routine);

    return entries.filter(
      function (item) {
        const matched =
          getSubjectFromEntry(
            routine,
            item.entry
          );

        return matched === subject;
      }
    ).length;
  }

  function getSubjectStats(routine) {
    routine =
      routine ||
      analytics.getRoutine();

    if (!routine) {
      return [];
    }

    return (
      Array.isArray(
        routine.subjects
      )
        ? routine.subjects
        : []
    ).map(
      function (subject) {
        return {
          id:
            subject.id ||
            null,

          name:
            subject.name ||
            subject.title ||
            "Untitled",

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

          classesPerWeek:
            countSubjectClasses(
              routine,
              subject
            )
        };
      }
    );
  }

  /* ---------------------------------------------------------
     Day statistics
     --------------------------------------------------------- */

  function getDayStats(routine) {
    routine =
      routine ||
      analytics.getRoutine();

    if (!routine) {
      return [];
    }

    const schedule =
      routine.schedule ||
      {};

    const settings =
      routine.settings ||
      {};

    const workingDays =
      Array.isArray(
        settings.workingDays
      )
        ? settings.workingDays
        : Object.keys(schedule);

    const periods =
      Array.isArray(
        routine.periods
      )
        ? routine.periods
        : [];

    return workingDays.map(
      function (day) {
        const entries =
          getScheduleEntries(
            routine
          ).filter(
            function (item) {
              return (
                item.day === day
              );
            }
          );

        return {
          day:
            day,

          classes:
            entries.length,

          emptyPeriods:
            Math.max(
              0,
              periods.length -
                entries.length
            )
        };
      }
    );
  }

  /* ---------------------------------------------------------
     Period statistics
     --------------------------------------------------------- */

  function getPeriodStats(routine) {
    routine =
      routine ||
      analytics.getRoutine();

    if (!routine) {
      return [];
    }

    const periods =
      Array.isArray(
        routine.periods
      )
        ? routine.periods
        : [];

    return periods.map(
      function (period) {
        const usageCount =
          getScheduleEntries(
            routine
          ).filter(
            function (item) {
              return (
                String(
                  item.periodId
                ) ===
                String(
                  period.id
                )
              );
            }
          ).length;

        return {
          id:
            period.id ||
            null,

          name:
            period.name ||
            period.title ||
            "Period",

          startTime:
            period.startTime ||
            period.start ||
            "",

          endTime:
            period.endTime ||
            period.end ||
            "",

          type:
            period.type ||
            "class",

          usageCount:
            usageCount
        };
      }
    );
  }

  /* ---------------------------------------------------------
     Teacher statistics
     --------------------------------------------------------- */

  function getTeacherStats(routine) {
    routine =
      routine ||
      analytics.getRoutine();

    if (!routine) {
      return [];
    }

    const map = {};

    (
      Array.isArray(
        routine.subjects
      )
        ? routine.subjects
        : []
    ).forEach(
      function (subject) {
        const teacher =
          String(
            subject.teacher ||
              ""
          ).trim();

        if (!teacher) {
          return;
        }

        if (!map[teacher]) {
          map[teacher] = {
            teacher:
              teacher,

            subjects:
              0,

            classes:
              0,

            subjectNames:
              []
          };
        }

        map[teacher].subjects +=
          1;

        map[teacher].classes +=
          countSubjectClasses(
            routine,
            subject
          );

        map[
          teacher
        ].subjectNames.push(
          subject.name ||
            subject.title ||
            "Untitled"
        );
      }
    );

    return Object.values(
      map
    ).sort(
      function (a, b) {
        return (
          b.classes -
          a.classes
        );
      }
    );
  }

  /* ---------------------------------------------------------
     Room statistics
     --------------------------------------------------------- */

  function getRoomStats(routine) {
    routine =
      routine ||
      analytics.getRoutine();

    if (!routine) {
      return [];
    }

    const map = {};

    (
      Array.isArray(
        routine.subjects
      )
        ? routine.subjects
        : []
    ).forEach(
      function (subject) {
        const room =
          String(
            subject.room ||
              ""
          ).trim();

        if (!room) {
          return;
        }

        if (!map[room]) {
          map[room] = {
            room:
              room,

            subjects:
              0,

            classes:
              0,

            subjectNames:
              []
          };
        }

        map[room].subjects +=
          1;

        map[room].classes +=
          countSubjectClasses(
            routine,
            subject
          );

        map[
          room
        ].subjectNames.push(
          subject.name ||
            subject.title ||
            "Untitled"
        );
      }
    );

    return Object.values(
      map
    ).sort(
      function (a, b) {
        return (
          b.classes -
          a.classes
        );
      }
    );
  }

  /* ---------------------------------------------------------
     Internal helpers
     --------------------------------------------------------- */

  function getScheduleEntries(
    routine
  ) {
    if (!routine) {
      return [];
    }

    const schedule =
      routine.schedule ||
      {};

    const entries = [];

    Object.keys(
      schedule
    ).forEach(
      function (day) {
        const dayData =
          schedule[day];

        if (
          Array.isArray(
            dayData
          )
        ) {
          dayData.forEach(
            function (
              entry,
              index
            ) {
              if (
                entry !==
                  null &&
                entry !==
                  undefined &&
                entry !== ""
              ) {
                entries.push({
                  day:
                    day,

                  periodId:
                    null,

                  index:
                    index,

                  entry:
                    entry
                });
              }
            }
          );

          return;
        }

        if (
          dayData &&
          typeof dayData ===
            "object"
        ) {
          Object.keys(
            dayData
          ).forEach(
            function (
              periodId
            ) {
              const entry =
                dayData[
                  periodId
                ];

              if (
                entry !==
                  null &&
                entry !==
                  undefined &&
                entry !== ""
              ) {
                entries.push({
                  day:
                    day,

                  periodId:
                    periodId,

                  index:
                    null,

                  entry:
                    entry
                });
              }
            }
          );
        }
      }
    );

    return entries;
  }

  function getSubjectFromEntry(
    routine,
    entry
  ) {
    if (
      !routine ||
      !entry
    ) {
      return null;
    }

    const subjects =
      Array.isArray(
        routine.subjects
      )
        ? routine.subjects
        : [];

    let subjectId =
      null;

    let subjectName =
      null;

    if (
      typeof entry ===
      "string"
    ) {
      subjectId =
        entry;

      subjectName =
        entry;
    } else if (
      typeof entry ===
      "object"
    ) {
      subjectId =
        entry.subjectId ||
        entry.subject_id ||
        entry.subject ||
        entry.id ||
        null;

      subjectName =
        entry.subjectName ||
        entry.subjectTitle ||
        entry.name ||
        null;
    }

    return (
      subjects.find(
        function (subject) {
          return (
            subject.id ===
              subjectId ||
            subject.name ===
              subjectId ||
            subject.title ===
              subjectId ||
            subject.id ===
              subjectName ||
            subject.name ===
              subjectName ||
            subject.title ===
              subjectName
          );
        }
      ) || null
    );
  }

  /* ---------------------------------------------------------
     Expose functions
     --------------------------------------------------------- */

  analytics.countSubjectClasses =
    countSubjectClasses;

  analytics.getSubjectStats =
    getSubjectStats;

  analytics.getDayStats =
    getDayStats;

  analytics.getPeriodStats =
    getPeriodStats;

  analytics.getTeacherStats =
    getTeacherStats;

  analytics.getRoomStats =
    getRoomStats;

})();
/* =========================================================
   MyRoutine — Analytics Engine
   Part 3/4
   ========================================================= */

(function () {
  "use strict";

  const analytics =
    window.MyRoutineAnalytics;

  if (!analytics) return;

  /* ---------------------------------------------------------
     Subject distribution
     --------------------------------------------------------- */

  function getSubjectDistribution(routine) {
    routine =
      routine ||
      analytics.getRoutine();

    const subjects =
      analytics.getSubjectStats(
        routine
      );

    const total =
      subjects.reduce(
        function (sum, subject) {
          return (
            sum +
            subject.classesPerWeek
          );
        },
        0
      );

    return subjects.map(
      function (subject) {
        return {
          ...subject,

          percentage:
            total > 0
              ? Math.round(
                  (
                    subject.classesPerWeek /
                    total
                  ) * 100
                )
              : 0
        };
      }
    );
  }

  /* ---------------------------------------------------------
     Schedule density
     --------------------------------------------------------- */

  function getScheduleDensity(routine) {
    routine =
      routine ||
      analytics.getRoutine();

    if (!routine) {
      return {
        totalSlots: 0,
        occupiedSlots: 0,
        emptySlots: 0,
        occupancyPercentage: 0
      };
    }

    const settings =
      routine.settings ||
      {};

    const days =
      Array.isArray(
        settings.workingDays
      )
        ? settings.workingDays
        : [];

    const periods =
      Array.isArray(
        routine.periods
      )
        ? routine.periods
        : [];

    const totalSlots =
      days.length *
      periods.length;

    const occupiedSlots =
      countScheduleEntries(
        routine
      );

    const emptySlots =
      Math.max(
        0,
        totalSlots -
          occupiedSlots
      );

    return {
      totalSlots:
        totalSlots,

      occupiedSlots:
        occupiedSlots,

      emptySlots:
        emptySlots,

      occupancyPercentage:
        totalSlots > 0
          ? Math.round(
              (
                occupiedSlots /
                totalSlots
              ) * 100
            )
          : 0
    };
  }

  /* ---------------------------------------------------------
     Event statistics
     --------------------------------------------------------- */

  function getEventStats(routine) {
    routine =
      routine ||
      analytics.getRoutine();

    if (!routine) {
      return {
        total: 0,
        byType: {}
      };
    }

    const events =
      Array.isArray(
        routine.events
      )
        ? routine.events
        : [];

    const byType = {};

    events.forEach(
      function (event) {
        const type =
          event.type ||
          "event";

        byType[type] =
          (
            byType[type] ||
            0
          ) + 1;
      }
    );

    return {
      total:
        events.length,

      byType:
        byType
    };
  }

  /* ---------------------------------------------------------
     Full analytics report
     --------------------------------------------------------- */

  function generateReport(routine) {
    routine =
      routine ||
      analytics.getRoutine();

    if (!routine) {
      analytics.state.lastReport =
        null;

      analytics.state.lastUpdated =
        new Date().toISOString();

      return null;
    }

    const report = {
      version:
        analytics.version,

      generatedAt:
        new Date().toISOString(),

      routine: {
        id:
          routine.id ||
          null,

        name:
          routine.name ||
          "Untitled Routine",

        institution:
          routine.institutionName ||
          routine.institution ||
          "",

        course:
          routine.course ||
          "",

        section:
          routine.section ||
          "",

        session:
          routine.session ||
          ""
      },

      basic:
        analytics.getBasicStats(
          routine
        ),

      subjects:
        analytics.getSubjectStats(
          routine
        ),

      subjectDistribution:
        getSubjectDistribution(
          routine
        ),

      days:
        analytics.getDayStats(
          routine
        ),

      periods:
        analytics.getPeriodStats(
          routine
        ),

      teachers:
        analytics.getTeacherStats(
          routine
        ),

      rooms:
        analytics.getRoomStats(
          routine
        ),

      density:
        getScheduleDensity(
          routine
        ),

      events:
        getEventStats(
          routine
        )
    };

    analytics.state.lastReport =
      report;

    analytics.state.lastUpdated =
      report.generatedAt;

    document.dispatchEvent(
      new CustomEvent(
        "myroutine:analytics-updated",
        {
          detail: {
            report:
              report
          }
        }
      )
    );

    return report;
  }

  /* ---------------------------------------------------------
     Summary
     --------------------------------------------------------- */

  function getSummary(routine) {
    const report =
      generateReport(
        routine
      );

    if (!report) {
      return null;
    }

    const busiestSubject =
      report.subjects.length
        ? report.subjects
            .slice()
            .sort(
              function (a, b) {
                return (
                  b.classesPerWeek -
                  a.classesPerWeek
                );
              }
            )[0]
        : null;

    const busiestDay =
      report.days.length
        ? report.days
            .slice()
            .sort(
              function (a, b) {
                return (
                  b.classes -
                  a.classes
                );
              }
            )[0]
        : null;

    return {
      routineName:
        report.routine.name,

      subjects:
        report.basic.subjects,

      periods:
        report.basic.periods,

      classes:
        report.basic.scheduledClasses,

      events:
        report.basic.events,

      workingDays:
        report.basic.workingDays,

      occupancy:
        report.density
          .occupancyPercentage,

      busiestSubject:
        busiestSubject,

      busiestDay:
        busiestDay
    };
  }

  /* ---------------------------------------------------------
     Compare routines
     --------------------------------------------------------- */

  function compareRoutines(
    firstRoutine,
    secondRoutine
  ) {
    const first =
      generateReport(
        firstRoutine
      );

    const second =
      generateReport(
        secondRoutine
      );

    if (
      !first ||
      !second
    ) {
      return null;
    }

    return {
      subjects: {
        first:
          first.basic.subjects,

        second:
          second.basic.subjects,

        difference:
          second.basic.subjects -
          first.basic.subjects
      },

      periods: {
        first:
          first.basic.periods,

        second:
          second.basic.periods,

        difference:
          second.basic.periods -
          first.basic.periods
      },

      classes: {
        first:
          first.basic.scheduledClasses,

        second:
          second.basic.scheduledClasses,

        difference:
          second.basic.scheduledClasses -
          first.basic.scheduledClasses
      },

      events: {
        first:
          first.basic.events,

        second:
          second.basic.events,

        difference:
          second.basic.events -
          first.basic.events
      },

      occupancy: {
        first:
          first.density
            .occupancyPercentage,

        second:
          second.density
            .occupancyPercentage,

        difference:
          second.density
            .occupancyPercentage -
          first.density
            .occupancyPercentage
      }
    };
  }

  /* ---------------------------------------------------------
     Internal helpers
     --------------------------------------------------------- */

  function countScheduleEntries(
    routine
  ) {
    if (!routine) {
      return 0;
    }

    const schedule =
      routine.schedule ||
      {};

    let count = 0;

    Object.keys(schedule)
      .forEach(
        function (day) {
          const dayData =
            schedule[day];

          if (
            Array.isArray(
              dayData
            )
          ) {
            count +=
              dayData.filter(
                function (entry) {
                  return (
                    entry !==
                      null &&
                    entry !==
                      undefined &&
                    entry !== ""
                  );
                }
              ).length;

            return;
          }

          if (
            dayData &&
            typeof dayData ===
              "object"
          ) {
            count +=
              Object.values(
                dayData
              ).filter(
                function (entry) {
                  return (
                    entry !==
                      null &&
                    entry !==
                      undefined &&
                    entry !== ""
                  );
                }
              ).length;
          }
        }
      );

    return count;
  }

  /* ---------------------------------------------------------
     Expose functions
     --------------------------------------------------------- */

  analytics.getSubjectDistribution =
    getSubjectDistribution;

  analytics.getScheduleDensity =
    getScheduleDensity;

  analytics.getEventStats =
    getEventStats;

  analytics.generateReport =
    generateReport;

  analytics.getSummary =
    getSummary;

  analytics.compareRoutines =
    compareRoutines;

})();
/* =========================================================
   MyRoutine — Analytics Engine
   Part 4/4
   ========================================================= */

(function () {
  "use strict";

  const analytics =
    window.MyRoutineAnalytics;

  if (!analytics) return;

  /* ---------------------------------------------------------
     Export report
     --------------------------------------------------------- */

  function exportReport(routine) {
    const report =
      analytics.generateReport(
        routine ||
        analytics.getRoutine()
      );

    if (!report) {
      return null;
    }

    const json =
      JSON.stringify(
        report,
        null,
        2
      );

    const blob =
      new Blob(
        [json],
        {
          type:
            "application/json"
        }
      );

    const url =
      URL.createObjectURL(
        blob
      );

    const link =
      document.createElement(
        "a"
      );

    link.href =
      url;

    link.download =
      "myroutine-analytics-" +
      Date.now() +
      ".json";

    document.body.appendChild(
      link
    );

    link.click();

    link.remove();

    setTimeout(
      function () {
        URL.revokeObjectURL(
          url
        );
      },
      1000
    );

    return report;
  }

  /* ---------------------------------------------------------
     Refresh analytics
     --------------------------------------------------------- */

  function refresh(routine) {
    return analytics.generateReport(
      routine ||
      analytics.getRoutine()
    );
  }

  /* ---------------------------------------------------------
     Get last generated report
     --------------------------------------------------------- */

  function getLastReport() {
    return (
      analytics.state
        .lastReport || null
    );
  }

  /* ---------------------------------------------------------
     Get analytics state
     --------------------------------------------------------- */

  function getAnalyticsState() {
    return {
      lastUpdated:
        analytics.state
          .lastUpdated,

      hasReport:
        !!analytics.state
          .lastReport
    };
  }

  /* ---------------------------------------------------------
     Auto refresh
     --------------------------------------------------------- */

  document.addEventListener(
    "myroutine:ready",
    function () {
      refresh();
    }
  );

  document.addEventListener(
    "myroutine:routine-selected",
    function () {
      refresh();
    }
  );

  document.addEventListener(
    "myroutine:routine-changed",
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

  /* ---------------------------------------------------------
     Public API
     --------------------------------------------------------- */

  analytics.exportReport =
    exportReport;

  analytics.refresh =
    refresh;

  analytics.getLastReport =
    getLastReport;

  analytics.getAnalyticsState =
    getAnalyticsState;

  console.log(
    "MyRoutine Analytics ready."
  );

})();