/* =========================================================
   MyRoutine — Analytics Engine
   routine-analytics.js
   Part 1/4
   ========================================================= */

(function () {
  "use strict";

  const state = {
    currentRoutineId: null,
    lastReport: null,
    autoRefresh: true
  };

  function getMyRoutine() {
    return window.MyRoutine || null;
  }

  function getData() {
    const app = getMyRoutine();
    if (!app) return null;

    if (typeof app.getData === "function") {
      return app.getData();
    }

    if (app.state && app.state.data) {
      return app.state.data;
    }

    if (app.data) {
      return app.data;
    }

    return null;
  }

  function getActiveRoutine() {
    const app = getMyRoutine();
    if (!app) return null;

    if (typeof app.getActiveRoutine === "function") {
      return app.getActiveRoutine();
    }

    const data = getData();
    if (!data) return null;

    const id =
      state.currentRoutineId ||
      (app.state && app.state.activeRoutineId);

    if (Array.isArray(data.routines)) {
      return (
        data.routines.find(function (routine) {
          return routine.id === id;
        }) || data.routines[0] || null
      );
    }

    return null;
  }

  function getRoutines() {
    const data = getData();

    if (!data) return [];

    if (Array.isArray(data)) {
      return data;
    }

    if (Array.isArray(data.routines)) {
      return data.routines;
    }

    return [];
  }

  function getSchedule(routine) {
    if (!routine) return [];

    if (Array.isArray(routine.schedule)) {
      return routine.schedule;
    }

    if (
      routine.weeklySchedule &&
      Array.isArray(routine.weeklySchedule)
    ) {
      return routine.weeklySchedule;
    }

    if (
      routine.schedule &&
      typeof routine.schedule === "object"
    ) {
      const result = [];

      Object.keys(routine.schedule).forEach(function (day) {
        const items = routine.schedule[day];

        if (!Array.isArray(items)) return;

        items.forEach(function (item) {
          result.push(
            Object.assign(
              {
                day: day
              },
              item
            )
          );
        });
      });

      return result;
    }

    return [];
  }

  function getSubjects(routine) {
    if (!routine) return [];

    return Array.isArray(routine.subjects)
      ? routine.subjects
      : [];
  }

  function getPeriods(routine) {
    if (!routine) return [];

    return Array.isArray(routine.periods)
      ? routine.periods
      : [];
  }

  function getEvents(routine) {
    if (!routine) return [];

    if (Array.isArray(routine.events)) {
      return routine.events;
    }

    if (
      routine.calendar &&
      Array.isArray(routine.calendar.events)
    ) {
      return routine.calendar.events;
    }

    return [];
  }

  function getSubjectId(item) {
    if (!item) return null;

    return (
      item.subjectId ||
      item.subjectID ||
      item.subject ||
      item.id ||
      null
    );
  }

  function getPeriodId(item) {
    if (!item) return null;

    return (
      item.periodId ||
      item.periodID ||
      item.period ||
      null
    );
  }

  function getDay(item) {
    if (!item) return "";

    return String(
      item.day ||
      item.dayName ||
      item.weekday ||
      ""
    );
  }

  function countBy(list, getter) {
    const result = {};

    list.forEach(function (item) {
      const key = getter(item);

      if (!key) return;

      result[key] = (result[key] || 0) + 1;
    });

    return result;
  }

  function getBasicStats(routine) {
    const subjects = getSubjects(routine);
    const periods = getPeriods(routine);
    const schedule = getSchedule(routine);
    const events = getEvents(routine);

    const activeSchedule = schedule.filter(function (item) {
      return item && item.subjectId;
    });

    const uniqueTeachers = new Set();
    const uniqueRooms = new Set();

    subjects.forEach(function (subject) {
      if (subject.teacher) {
        uniqueTeachers.add(String(subject.teacher));
      }

      if (subject.room) {
        uniqueRooms.add(String(subject.room));
      }
    });

    return {
      routineId: routine ? routine.id || null : null,

      routineName: routine
        ? routine.name || "Untitled Routine"
        : "Untitled Routine",

      subjects: subjects.length,

      periods: periods.length,

      scheduledClasses: activeSchedule.length,

      totalScheduleEntries: schedule.length,

      teachers: uniqueTeachers.size,

      rooms: uniqueRooms.size,

      events: events.length,

      generatedAt: new Date().toISOString()
    };
  }

  /*
   * Public analytics object.
   *
   * IMPORTANT:
   * This object is created in Part 1 so the remaining
   * parts can safely extend it.
   */

  window.MyRoutineAnalytics = {
    state: state,

    getData: getData,

    getActiveRoutine: getActiveRoutine,

    getRoutines: getRoutines,

    getSchedule: getSchedule,

    getSubjects: getSubjects,

    getPeriods: getPeriods,

    getEvents: getEvents,

    getBasicStats: getBasicStats,

    setRoutine: function (routineId) {
      state.currentRoutineId = routineId;
      return getActiveRoutine();
    },

    clearRoutine: function () {
      state.currentRoutineId = null;
      state.lastReport = null;
    }
  };

  /*
   * Wait for MyRoutine when the main engine initializes.
   */

  document.addEventListener(
    "myroutine:ready",
    function () {
      if (!state.currentRoutineId) {
        const app = getMyRoutine();

        if (
          app &&
          app.state &&
          app.state.activeRoutineId
        ) {
          state.currentRoutineId =
            app.state.activeRoutineId;
        }
      }
    }
  );

  console.log(
    "[MyRoutine] Analytics engine initialized."
  );
})();
/* =========================================================
   MyRoutine — Analytics Calculations
   Part 2/4
   ========================================================= */

(function () {
  "use strict";

  const analytics = window.MyRoutineAnalytics;

  if (!analytics) {
    console.error(
      "[MyRoutine] Analytics engine not initialized."
    );
    return;
  }

  function getRoutine() {
    return analytics.getActiveRoutine();
  }

  function getSchedule() {
    return analytics.getSchedule(getRoutine());
  }

  function getSubjects() {
    return analytics.getSubjects(getRoutine());
  }

  function getPeriods() {
    return analytics.getPeriods(getRoutine());
  }

  function getEvents() {
    return analytics.getEvents(getRoutine());
  }

  function subjectStats() {
    const subjects = getSubjects();
    const schedule = getSchedule();

    return subjects.map(function (subject) {
      const id = subject.id;

      const classes = schedule.filter(function (item) {
        return (
          item &&
          (
            item.subjectId === id ||
            item.subjectID === id ||
            item.subject === id
          )
        );
      });

      return {
        id: id || null,

        name:
          subject.name ||
          subject.title ||
          "Untitled Subject",

        code: subject.code || "",

        teacher: subject.teacher || "",

        room: subject.room || "",

        classesPerWeek: classes.length
      };
    });
  }

  function dayStats() {
    const schedule = getSchedule();

    const result = {};

    schedule.forEach(function (item) {
      const day =
        item.day ||
        item.dayName ||
        item.weekday ||
        "Unknown";

      if (!result[day]) {
        result[day] = {
          day: day,
          classes: 0
        };
      }

      if (item.subjectId || item.subjectID || item.subject) {
        result[day].classes++;
      }
    });

    return Object.values(result);
  }

  function periodStats() {
    const schedule = getSchedule();
    const periods = getPeriods();

    return periods.map(function (period) {
      const id = period.id;

      const classes = schedule.filter(function (item) {
        return (
          item.periodId === id ||
          item.periodID === id ||
          item.period === id
        );
      });

      return {
        id: id || null,

        name:
          period.name ||
          period.title ||
          "Period",

        start: period.start || "",

        end: period.end || "",

        classes: classes.length
      };
    });
  }

  function teacherStats() {
    const subjects = getSubjects();
    const schedule = getSchedule();

    const result = {};

    subjects.forEach(function (subject) {
      const teacher =
        subject.teacher ||
        "Unassigned";

      const count = schedule.filter(function (item) {
        return (
          item.subjectId === subject.id ||
          item.subjectID === subject.id ||
          item.subject === subject.id
        );
      }).length;

      if (!result[teacher]) {
        result[teacher] = 0;
      }

      result[teacher] += count;
    });

    return Object.keys(result).map(function (teacher) {
      return {
        teacher: teacher,
        classes: result[teacher]
      };
    });
  }

  function roomStats() {
    const subjects = getSubjects();
    const schedule = getSchedule();

    const result = {};

    subjects.forEach(function (subject) {
      const room =
        subject.room ||
        "Unassigned";

      const count = schedule.filter(function (item) {
        return (
          item.subjectId === subject.id ||
          item.subjectID === subject.id ||
          item.subject === subject.id
        );
      }).length;

      if (!result[room]) {
        result[room] = 0;
      }

      result[room] += count;
    });

    return Object.keys(result).map(function (room) {
      return {
        room: room,
        classes: result[room]
      };
    });
  }

  analytics.getSubjectStats = subjectStats;

  analytics.getDayStats = dayStats;

  analytics.getPeriodStats = periodStats;

  analytics.getTeacherStats = teacherStats;

  analytics.getRoomStats = roomStats;

  console.log(
    "[MyRoutine] Analytics calculations loaded."
  );
})();
/* =========================================================
   MyRoutine — Analytics Reports
   Part 3/4
   ========================================================= */

(function () {
  "use strict";

  const analytics = window.MyRoutineAnalytics;

  if (!analytics) {
    console.error("[MyRoutine] Analytics engine missing.");
    return;
  }

  function getRoutine() {
    return analytics.getActiveRoutine();
  }

  function getSubjectDistribution() {
    const stats = analytics.getSubjectStats();

    const total = stats.reduce(function (sum, item) {
      return sum + item.classesPerWeek;
    }, 0);

    return stats.map(function (item) {
      return {
        id: item.id,
        name: item.name,
        classes: item.classesPerWeek,
        percentage: total
          ? Math.round((item.classesPerWeek / total) * 100)
          : 0
      };
    });
  }

  function getScheduleDensity() {
    const routine = getRoutine();

    if (!routine) {
      return {
        totalSlots: 0,
        occupiedSlots: 0,
        emptySlots: 0,
        percentage: 0
      };
    }

    const periods = analytics.getPeriods(routine);
    const settings = routine.settings || {};

    const workingDays =
      Array.isArray(settings.workingDays)
        ? settings.workingDays
        : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

    const totalSlots =
      periods.length * workingDays.length;

    const schedule = analytics.getSchedule(routine);

    const occupiedSlots = schedule.filter(function (item) {
      return (
        item &&
        (
          item.subjectId ||
          item.subjectID ||
          item.subject
        )
      );
    }).length;

    const emptySlots = Math.max(
      0,
      totalSlots - occupiedSlots
    );

    return {
      totalSlots: totalSlots,
      occupiedSlots: occupiedSlots,
      emptySlots: emptySlots,
      percentage: totalSlots
        ? Math.round((occupiedSlots / totalSlots) * 100)
        : 0
    };
  }

  function getEventStats() {
    const events = analytics.getEvents(getRoutine());

    const result = {
      total: events.length,
      classes: 0,
      exams: 0,
      holidays: 0,
      events: 0,
      notes: 0
    };

    events.forEach(function (event) {
      const type = String(
        event.type || "event"
      ).toLowerCase();

      if (type === "class") {
        result.classes++;
      } else if (type === "exam") {
        result.exams++;
      } else if (type === "holiday") {
        result.holidays++;
      } else if (type === "note") {
        result.notes++;
      } else {
        result.events++;
      }
    });

    return result;
  }

  function generateReport() {
    const routine = getRoutine();

    if (!routine) {
      return null;
    }

    const report = {
      routine: {
        id: routine.id || null,
        name: routine.name || "Untitled Routine"
      },

      generatedAt: new Date().toISOString(),

      basic: analytics.getBasicStats(routine),

      subjects: analytics.getSubjectStats(),

      days: analytics.getDayStats(),

      periods: analytics.getPeriodStats(),

      teachers: analytics.getTeacherStats(),

      rooms: analytics.getRoomStats(),

      subjectDistribution:
        getSubjectDistribution(),

      scheduleDensity:
        getScheduleDensity(),

      events:
        getEventStats()
    };

    analytics.state.lastReport = report;

    return report;
  }

  function getSummary() {
    const report = generateReport();

    if (!report) {
      return {
        available: false,
        message: "No routine selected."
      };
    }

    return {
      available: true,

      routineName:
        report.routine.name,

      subjects:
        report.basic.subjects,

      periods:
        report.basic.periods,

      weeklyClasses:
        report.basic.scheduledClasses,

      teachers:
        report.basic.teachers,

      rooms:
        report.basic.rooms,

      events:
        report.basic.events,

      scheduleUsage:
        report.scheduleDensity.percentage
    };
  }

  function compareRoutines(first, second) {
    if (!first || !second) {
      return null;
    }

    const firstStats =
      analytics.getBasicStats(first);

    const secondStats =
      analytics.getBasicStats(second);

    return {
      first: {
        id: first.id || null,
        name: first.name || "Routine 1",
        stats: firstStats
      },

      second: {
        id: second.id || null,
        name: second.name || "Routine 2",
        stats: secondStats
      },

      differences: {
        subjects:
          secondStats.subjects -
          firstStats.subjects,

        periods:
          secondStats.periods -
          firstStats.periods,

        classes:
          secondStats.scheduledClasses -
          firstStats.scheduledClasses,

        teachers:
          secondStats.teachers -
          firstStats.teachers,

        rooms:
          secondStats.rooms -
          firstStats.rooms,

        events:
          secondStats.events -
          firstStats.events
      }
    };
  }

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

  console.log(
    "[MyRoutine] Analytics reports loaded."
  );
})();
/* =========================================================
   MyRoutine — Analytics Export & Auto Refresh
   Part 4/4
   ========================================================= */

(function () {
  "use strict";

  const analytics = window.MyRoutineAnalytics;

  if (!analytics) {
    console.error("[MyRoutine] Analytics engine missing.");
    return;
  }

  function downloadFile(filename, content, type) {
    const blob = new Blob(
      [content],
      { type: type || "application/json" }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1000);
  }

  function exportReport() {
    const report = analytics.generateReport();

    if (!report) {
      console.warn(
        "[MyRoutine] No routine available for analytics export."
      );
      return null;
    }

    const json = JSON.stringify(
      report,
      null,
      2
    );

    const safeName =
      String(
        report.routine.name ||
        "routine"
      )
        .replace(/[^a-z0-9]+/gi, "-")
        .replace(/^-+|-+$/g, "")
        .toLowerCase() ||
      "routine";

    downloadFile(
      safeName + "-analytics.json",
      json,
      "application/json"
    );

    return report;
  }

  function exportSummary() {
    const summary =
      analytics.getSummary();

    const json = JSON.stringify(
      summary,
      null,
      2
    );

    downloadFile(
      "myroutine-summary.json",
      json,
      "application/json"
    );

    return summary;
  }

  function refresh() {
    if (!analytics.state.autoRefresh) {
      return null;
    }

    return analytics.generateReport();
  }

  function setAutoRefresh(enabled) {
    analytics.state.autoRefresh =
      Boolean(enabled);

    return analytics.state.autoRefresh;
  }

  function getLastReport() {
    return analytics.state.lastReport;
  }

  function getStatus() {
    const routine =
      analytics.getActiveRoutine();

    return {
      available: Boolean(routine),

      routineId:
        routine
          ? routine.id || null
          : null,

      routineName:
        routine
          ? routine.name || "Untitled Routine"
          : null,

      hasReport:
        Boolean(
          analytics.state.lastReport
        ),

      autoRefresh:
        analytics.state.autoRefresh
    };
  }

  analytics.exportReport =
    exportReport;

  analytics.exportSummary =
    exportSummary;

  analytics.refresh =
    refresh;

  analytics.setAutoRefresh =
    setAutoRefresh;

  analytics.getLastReport =
    getLastReport;

  analytics.getStatus =
    getStatus;

  /*
   * Refresh analytics whenever the routine engine changes.
   */

  [
    "myroutine:ready",
    "myroutine:changed",
    "myroutine:updated",
    "myroutine:saved"
  ].forEach(function (eventName) {
    document.addEventListener(
      eventName,
      function () {
        if (analytics.state.autoRefresh) {
          analytics.refresh();
        }
      }
    );
  });

  /*
   * Keep the report reasonably fresh while the
   * analytics page is open.
   */

  setInterval(function () {
    if (
      analytics.state.autoRefresh &&
      analytics.getActiveRoutine()
    ) {
      analytics.refresh();
    }
  }, 60000);

  console.log(
    "[MyRoutine] Analytics module ready."
  );
})();