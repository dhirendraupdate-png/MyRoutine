/* =========================================================
   MyRoutine — Global Search Engine
   Part 1/4
   ========================================================= */

(function () {
  "use strict";

  const SEARCH_VERSION = "1.0.0";

  const state = {
    query: "",
    results: [],
    filters: {
      type: "all",
      day: "all"
    },
    open: false,
    selectedIndex: -1
  };

  /* ---------------------------------------------------------
     Helpers
     --------------------------------------------------------- */

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

  function normalize(value) {
    return String(
      value === undefined ||
      value === null
        ? ""
        : value
    )
      .toLowerCase()
      .trim();
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

  function createResult(data) {
    return {
      id:
        data.id ||
        (
          "result-" +
          Math.random()
            .toString(36)
            .slice(2)
        ),

      type:
        data.type || "other",

      title:
        data.title || "",

      subtitle:
        data.subtitle || "",

      details:
        data.details || "",

      routineId:
        data.routineId || null,

      day:
        data.day || null,

      periodId:
        data.periodId || null,

      subjectId:
        data.subjectId || null,

      score:
        Number.isFinite(data.score)
          ? data.score
          : 0,

      data:
        data.data || null
    };
  }

  /* ---------------------------------------------------------
     Search state
     --------------------------------------------------------- */

  function getState() {
    return {
      query: state.query,

      results:
        state.results.slice(),

      filters: {
        ...state.filters
      },

      open:
        state.open,

      selectedIndex:
        state.selectedIndex
    };
  }

  function setQuery(query) {
    state.query =
      String(query || "");

    return search(
      state.query,
      state.filters
    );
  }

  function clear() {
    state.query = "";
    state.results = [];
    state.selectedIndex = -1;

    emit("myroutine:search-cleared");

    return getState();
  }

  /* ---------------------------------------------------------
     Event system
     --------------------------------------------------------- */

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
     Public API placeholder
     --------------------------------------------------------- */

  window.MyRoutineSearch = {
    version:
      SEARCH_VERSION,

    state,

    getState,

    setQuery,

    clear
  };

  console.log(
    "MyRoutine Search Engine loaded."
  );

})();
/* =========================================================
   MyRoutine — Global Search Engine
   Part 2/4
   ========================================================= */

(function () {
  "use strict";

  const search =
    window.MyRoutineSearch;

  if (!search) return;

  /* ---------------------------------------------------------
     Result matching
     --------------------------------------------------------- */

  function matchesText(item, query) {
    const q =
      String(query || "")
        .toLowerCase()
        .trim();

    if (!q) return true;

    const text = [
      item.title,
      item.subtitle,
      item.details,
      item.type,
      item.day
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return text.includes(q);
  }

  function scoreResult(item, query) {
    const q =
      String(query || "")
        .toLowerCase()
        .trim();

    if (!q) return 0;

    const title =
      String(item.title || "")
        .toLowerCase();

    const subtitle =
      String(item.subtitle || "")
        .toLowerCase();

    let score = 0;

    if (title === q) {
      score += 100;
    }

    if (title.startsWith(q)) {
      score += 50;
    }

    if (title.includes(q)) {
      score += 30;
    }

    if (subtitle.includes(q)) {
      score += 15;
    }

    return score;
  }

  /* ---------------------------------------------------------
     Subject indexing
     --------------------------------------------------------- */

  function indexSubjects(routine) {
    const results = [];

    if (!routine) return results;

    const subjects =
      Array.isArray(routine.subjects)
        ? routine.subjects
        : [];

    subjects.forEach(function (subject) {
      const name =
        subject.name ||
        subject.title ||
        "Untitled Subject";

      const teacher =
        subject.teacher ||
        "";

      const room =
        subject.room ||
        "";

      const code =
        subject.code ||
        "";

      results.push(
        searchResult({
          id:
            "subject-" +
            (
              subject.id ||
              name
            ),

          type:
            "subject",

          title:
            name,

          subtitle:
            [
              code,
              teacher
            ]
              .filter(Boolean)
              .join(" • "),

          details:
            room
              ? "Room: " + room
              : "",

          routineId:
            routine.id,

          subjectId:
            subject.id,

          data:
            subject
        })
      );
    });

    return results;
  }

  /* ---------------------------------------------------------
     Period indexing
     --------------------------------------------------------- */

  function indexPeriods(routine) {
    const results = [];

    if (!routine) return results;

    const periods =
      Array.isArray(routine.periods)
        ? routine.periods
        : [];

    periods.forEach(function (period) {
      const name =
        period.name ||
        period.title ||
        "Period";

      const start =
        period.startTime ||
        period.start ||
        "";

      const end =
        period.endTime ||
        period.end ||
        "";

      results.push(
        searchResult({
          id:
            "period-" +
            (
              period.id ||
              name
            ),

          type:
            "period",

          title:
            name,

          subtitle:
            [start, end]
              .filter(Boolean)
              .join(" – "),

          details:
            period.type ||
            "",

          routineId:
            routine.id,

          periodId:
            period.id,

          data:
            period
        })
      );
    });

    return results;
  }

  /* ---------------------------------------------------------
     Schedule indexing
     --------------------------------------------------------- */

  function indexSchedule(routine) {
    const results = [];

    if (!routine) return results;

    const schedule =
      routine.schedule ||
      {};

    Object.keys(schedule)
      .forEach(function (day) {
        const daySchedule =
          schedule[day];

        if (!daySchedule) return;

        if (Array.isArray(daySchedule)) {
          daySchedule.forEach(
            function (entry) {
              results.push(
                createScheduleResult(
                  routine,
                  day,
                  entry
                )
              );
            }
          );

          return;
        }

        Object.keys(daySchedule)
          .forEach(
            function (periodId) {
              const entry =
                daySchedule[periodId];

              results.push(
                createScheduleResult(
                  routine,
                  day,
                  {
                    ...entry,
                    periodId
                  }
                )
              );
            }
          );
      });

    return results
      .filter(Boolean);
  }

  function createScheduleResult(
    routine,
    day,
    entry
  ) {
    if (!entry) return null;

    const subjectId =
      typeof entry === "string"
        ? entry
        : (
            entry.subjectId ||
            entry.subject ||
            null
          );

    const subject =
      (
        routine.subjects ||
        []
      ).find(
        function (item) {
          return (
            item.id ===
              subjectId ||
            item.name ===
              subjectId
          );
        }
      );

    const subjectName =
      subject
        ? (
            subject.name ||
            subject.title
          )
        : (
            typeof entry === "string"
              ? entry
              : (
                  entry.name ||
                  "Scheduled Class"
                )
          );

    const periodId =
      typeof entry === "object"
        ? entry.periodId
        : null;

    return searchResult({
      id:
        "schedule-" +
        day +
        "-" +
        (
          periodId ||
          subjectId ||
          Math.random()
            .toString(36)
            .slice(2)
        ),

      type:
        "schedule",

      title:
        subjectName,

      subtitle:
        String(day),

      details:
        periodId
          ? "Period: " + periodId
          : "",

      routineId:
        routine.id,

      day:
        day,

      periodId:
        periodId,

      subjectId:
        subject
          ? subject.id
          : subjectId,

      data:
        entry
    });
  }

  /* ---------------------------------------------------------
     Event indexing
     --------------------------------------------------------- */

  function indexEvents(routine) {
    const results = [];

    if (!routine) return results;

    const events =
      Array.isArray(routine.events)
        ? routine.events
        : [];

    events.forEach(function (event) {
      results.push(
        searchResult({
          id:
            "event-" +
            (
              event.id ||
              event.date ||
              Math.random()
                .toString(36)
                .slice(2)
            ),

          type:
            "event",

          title:
            event.title ||
            event.name ||
            "Event",

          subtitle:
            event.date ||
            "",

          details:
            event.type ||
            "",

          routineId:
            routine.id,

          data:
            event
        })
      );
    });

    return results;
  }

  /* ---------------------------------------------------------
     Result normalization
     --------------------------------------------------------- */

  function searchResult(data) {
    return createResultSafe(data);
  }

  function createResultSafe(data) {
    return {
      id:
        data.id ||
        (
          "result-" +
          Math.random()
            .toString(36)
            .slice(2)
        ),

      type:
        data.type ||
        "other",

      title:
        data.title ||
        "",

      subtitle:
        data.subtitle ||
        "",

      details:
        data.details ||
        "",

      routineId:
        data.routineId ||
        null,

      day:
        data.day ||
        null,

      periodId:
        data.periodId ||
        null,

      subjectId:
        data.subjectId ||
        null,

      score:
        Number.isFinite(data.score)
          ? data.score
          : 0,

      data:
        data.data ||
        null
    };
  }

  /* ---------------------------------------------------------
     Index complete routine
     --------------------------------------------------------- */

  function buildIndex(routine) {
    if (!routine) {
      return [];
    }

    return [
      ...indexSubjects(routine),
      ...indexPeriods(routine),
      ...indexSchedule(routine),
      ...indexEvents(routine)
    ];
  }

  search.buildIndex =
    buildIndex;

})();
/* =========================================================
   MyRoutine — Global Search Engine
   Part 3/4
   ========================================================= */

(function () {
  "use strict";

  const search = window.MyRoutineSearch;

  if (!search) return;

  /* ---------------------------------------------------------
     Search
     --------------------------------------------------------- */

  function searchRoutine(query, filters) {
    const q =
      String(query || "")
        .toLowerCase()
        .trim();

    const activeFilters = {
      type:
        filters &&
        filters.type
          ? filters.type
          : "all",

      day:
        filters &&
        filters.day
          ? filters.day
          : "all"
    };

    const routines =
      typeof search.getRoutines ===
        "function"
        ? search.getRoutines()
        : getRoutinesFallback();

    let allResults = [];

    routines.forEach(function (routine) {
      allResults.push(
        ...search.buildIndex(routine)
      );
    });

    let results = allResults.filter(
      function (item) {
        if (
          activeFilters.type !== "all" &&
          item.type !== activeFilters.type
        ) {
          return false;
        }

        if (
          activeFilters.day !== "all" &&
          item.day !== activeFilters.day
        ) {
          return false;
        }

        if (!q) {
          return true;
        }

        return matches(item, q);
      }
    );

    results = results.map(
      function (item) {
        return {
          ...item,
          score:
            calculateScore(item, q)
        };
      }
    );

    results.sort(
      function (a, b) {
        return b.score - a.score;
      }
    );

    search.state.query = query || "";
    search.state.filters =
      activeFilters;

    search.state.results =
      results;

    search.state.selectedIndex =
      results.length
        ? 0
        : -1;

    emit(
      "myroutine:search-results",
      {
        query:
          search.state.query,

        results:
          results,

        count:
          results.length
      }
    );

    return results;
  }

  /* ---------------------------------------------------------
     Matching
     --------------------------------------------------------- */

  function matches(item, query) {
    const values = [
      item.title,
      item.subtitle,
      item.details,
      item.type,
      item.day
    ];

    return values.some(
      function (value) {
        return String(
          value || ""
        )
          .toLowerCase()
          .includes(query);
      }
    );
  }

  /* ---------------------------------------------------------
     Relevance scoring
     --------------------------------------------------------- */

  function calculateScore(item, query) {
    if (!query) {
      return 1;
    }

    const title =
      String(item.title || "")
        .toLowerCase();

    const subtitle =
      String(item.subtitle || "")
        .toLowerCase();

    const details =
      String(item.details || "")
        .toLowerCase();

    let score = 0;

    if (title === query) {
      score += 1000;
    }

    if (title.startsWith(query)) {
      score += 500;
    }

    if (title.includes(query)) {
      score += 300;
    }

    if (subtitle.includes(query)) {
      score += 150;
    }

    if (details.includes(query)) {
      score += 75;
    }

    if (
      String(item.type || "")
        .toLowerCase()
        .includes(query)
    ) {
      score += 25;
    }

    return score;
  }

  /* ---------------------------------------------------------
     Search helpers
     --------------------------------------------------------- */

  function getRoutinesFallback() {
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
     Filters
     --------------------------------------------------------- */

  function setFilter(name, value) {
    if (
      !Object.prototype.hasOwnProperty.call(
        search.state.filters,
        name
      )
    ) {
      return search.getState();
    }

    search.state.filters[name] =
      value || "all";

    return searchRoutine(
      search.state.query,
      search.state.filters
    );
  }

  function clearFilters() {
    search.state.filters = {
      type: "all",
      day: "all"
    };

    return searchRoutine(
      search.state.query,
      search.state.filters
    );
  }

  /* ---------------------------------------------------------
     Navigation
     --------------------------------------------------------- */

  function select(index) {
    const results =
      search.state.results;

    if (!results.length) {
      search.state.selectedIndex =
        -1;

      return null;
    }

    let next =
      Number(index);

    if (
      !Number.isFinite(next)
    ) {
      next = 0;
    }

    next = Math.max(
      0,
      Math.min(
        next,
        results.length - 1
      )
    );

    search.state.selectedIndex =
      next;

    emit(
      "myroutine:search-selection",
      {
        index: next,
        result:
          results[next]
      }
    );

    return results[next];
  }

  function moveSelection(direction) {
    const results =
      search.state.results;

    if (!results.length) {
      return null;
    }

    let index =
      search.state.selectedIndex;

    if (index < 0) {
      index = 0;
    }

    index += direction;

    if (index < 0) {
      index =
        results.length - 1;
    }

    if (
      index >= results.length
    ) {
      index = 0;
    }

    return select(index);
  }

  function getSelected() {
    const index =
      search.state.selectedIndex;

    if (
      index < 0 ||
      index >=
        search.state.results.length
    ) {
      return null;
    }

    return search.state
      .results[index];
  }

  /* ---------------------------------------------------------
     Public API
     --------------------------------------------------------- */

  search.search =
    searchRoutine;

  search.setFilter =
    setFilter;

  search.clearFilters =
    clearFilters;

  search.select =
    select;

  search.moveSelection =
    moveSelection;

  search.getSelected =
    getSelected;

  search.getRoutines =
    getRoutinesFallback;

})();
/* =========================================================
   MyRoutine — Global Search Engine
   Part 4/4
   ========================================================= */

(function () {
  "use strict";

  const search = window.MyRoutineSearch;

  if (!search) return;

  /* ---------------------------------------------------------
     Search UI
     --------------------------------------------------------- */

  function open() {
    search.state.open = true;

    render();

    emit("myroutine:search-opened");
  }

  function close() {
    search.state.open = false;

    const existing =
      document.getElementById(
        "myroutine-search-overlay"
      );

    if (existing) {
      existing.remove();
    }

    emit("myroutine:search-closed");
  }

  function render() {
    if (!search.state.open) return;

    let overlay =
      document.getElementById(
        "myroutine-search-overlay"
      );

    if (!overlay) {
      overlay =
        document.createElement("div");

      overlay.id =
        "myroutine-search-overlay";

      document.body.appendChild(
        overlay
      );
    }

    overlay.innerHTML = `
      <div class="mr-search-backdrop"></div>

      <div class="mr-search-panel">

        <div class="mr-search-header">

          <div>
            <div class="mr-search-title">
              Search MyRoutine
            </div>

            <div class="mr-search-subtitle">
              Find subjects, periods, classes and events
            </div>
          </div>

          <button
            type="button"
            class="mr-search-close"
            id="mr-search-close"
            aria-label="Close search"
          >
            ×
          </button>

        </div>

        <div class="mr-search-input-wrap">

          <span class="mr-search-icon">
            🔎
          </span>

          <input
            id="mr-search-input"
            class="mr-search-input"
            type="search"
            placeholder="Search subjects, teachers, rooms..."
            autocomplete="off"
          />

          <button
            type="button"
            class="mr-search-clear"
            id="mr-search-clear"
            aria-label="Clear search"
          >
            ×
          </button>

        </div>

        <div class="mr-search-filters">

          <button
            class="mr-search-filter active"
            data-search-type="all"
          >
            All
          </button>

          <button
            class="mr-search-filter"
            data-search-type="subject"
          >
            Subjects
          </button>

          <button
            class="mr-search-filter"
            data-search-type="period"
          >
            Periods
          </button>

          <button
            class="mr-search-filter"
            data-search-type="schedule"
          >
            Classes
          </button>

          <button
            class="mr-search-filter"
            data-search-type="event"
          >
            Events
          </button>

        </div>

        <div
          id="mr-search-results"
          class="mr-search-results"
        ></div>

        <div class="mr-search-footer">
          <span>↑ ↓ Navigate</span>
          <span>Enter Select</span>
          <span>Esc Close</span>
        </div>

      </div>
    `;

    injectStyles();

    bindEvents();

    const input =
      document.getElementById(
        "mr-search-input"
      );

    if (input) {
      input.focus();
    }

    renderResults();
  }

  /* ---------------------------------------------------------
     Event binding
     --------------------------------------------------------- */

  function bindEvents() {
    const overlay =
      document.getElementById(
        "myroutine-search-overlay"
      );

    if (!overlay) return;

    const input =
      document.getElementById(
        "mr-search-input"
      );

    const closeButton =
      document.getElementById(
        "mr-search-close"
      );

    const clearButton =
      document.getElementById(
        "mr-search-clear"
      );

    const backdrop =
      overlay.querySelector(
        ".mr-search-backdrop"
      );

    if (input) {
      input.addEventListener(
        "input",
        function () {
          search.search(
            input.value,
            search.state.filters
          );

          renderResults();
        }
      );

      input.addEventListener(
        "keydown",
        function (event) {
          if (event.key === "ArrowDown") {
            event.preventDefault();

            search.moveSelection(1);

            renderResults();
          }

          if (event.key === "ArrowUp") {
            event.preventDefault();

            search.moveSelection(-1);

            renderResults();
          }

          if (event.key === "Enter") {
            event.preventDefault();

            activateSelected();
          }

          if (event.key === "Escape") {
            event.preventDefault();

            close();
          }
        }
      );
    }

    if (closeButton) {
      closeButton.addEventListener(
        "click",
        close
      );
    }

    if (clearButton) {
      clearButton.addEventListener(
        "click",
        function () {
          if (input) {
            input.value = "";
          }

          search.clear();

          renderResults();

          if (input) {
            input.focus();
          }
        }
      );
    }

    if (backdrop) {
      backdrop.addEventListener(
        "click",
        close
      );
    }

    overlay
      .querySelectorAll(
        "[data-search-type]"
      )
      .forEach(function (button) {
        button.addEventListener(
          "click",
          function () {
            const type =
              button.getAttribute(
                "data-search-type"
              );

            search.setFilter(
              "type",
              type
            );

            overlay
              .querySelectorAll(
                "[data-search-type]"
              )
              .forEach(
                function (item) {
                  item.classList.toggle(
                    "active",
                    item === button
                  );
                }
              );

            renderResults();
          }
        );
      });
  }

  /* ---------------------------------------------------------
     Result rendering
     --------------------------------------------------------- */

  function renderResults() {
    const container =
      document.getElementById(
        "mr-search-results"
      );

    if (!container) return;

    const results =
      search.state.results;

    if (!results.length) {
      const query =
        String(
          search.state.query || ""
        ).trim();

      container.innerHTML = `
        <div class="mr-search-empty">

          <div class="mr-search-empty-icon">
            ${query ? "🔍" : "✨"}
          </div>

          <div class="mr-search-empty-title">
            ${
              query
                ? "No results found"
                : "Start searching"
            }
          </div>

          <div class="mr-search-empty-text">
            ${
              query
                ? "Try another subject, teacher, room or event."
                : "Type something above to search your routine."
            }
          </div>

        </div>
      `;

      return;
    }

    container.innerHTML =
      results
        .map(function (result, index) {
          const selected =
            index ===
            search.state.selectedIndex;

          return `
            <button
              type="button"
              class="mr-search-result ${
                selected
                  ? "selected"
                  : ""
              }"
              data-search-index="${index}"
            >

              <div class="mr-search-result-icon">
                ${getIcon(result.type)}
              </div>

              <div class="mr-search-result-content">

                <div class="mr-search-result-title">
                  ${escapeHTML(
                    result.title
                  )}
                </div>

                <div class="mr-search-result-subtitle">
                  ${escapeHTML(
                    result.subtitle
                  )}
                </div>

                ${
                  result.details
                    ? `
                      <div class="mr-search-result-details">
                        ${escapeHTML(
                          result.details
                        )}
                      </div>
                    `
                    : ""
                }

              </div>

              <div class="mr-search-result-type">
                ${escapeHTML(
                  result.type
                )}
              </div>

            </button>
          `;
        })
        .join("");

    container
      .querySelectorAll(
        "[data-search-index]"
      )
      .forEach(function (element) {
        element.addEventListener(
          "click",
          function () {
            const index =
              Number(
                element.getAttribute(
                  "data-search-index"
                )
              );

            search.select(index);

            activateSelected();
          }
        );
      });
  }

  /* ---------------------------------------------------------
     Activate result
     --------------------------------------------------------- */

  function activateSelected() {
    const result =
      search.getSelected();

    if (!result) return;

    emit(
      "myroutine:search-result-selected",
      {
        result:
          result
      }
    );

    /*
      Open the most relevant existing
      module where possible.
    */

    if (
      result.type === "subject" &&
      window.MyRoutineEditor &&
      typeof window.MyRoutineEditor.open ===
        "function"
    ) {
      close();

      window.MyRoutineEditor.open(
        result.routineId
      );

      return;
    }

    if (
      (
        result.type === "schedule" ||
        result.type === "period"
      ) &&
      window.MyRoutineViewer &&
      typeof window.MyRoutineViewer.open ===
        "function"
    ) {
      close();

      window.MyRoutineViewer.open(
        result.routineId
      );

      return;
    }

    if (
      result.type === "event" &&
      window.MyRoutineCalendar &&
      typeof window.MyRoutineCalendar.open ===
        "function"
    ) {
      close();

      window.MyRoutineCalendar.open(
        result.routineId
      );

      return;
    }

    close();
  }

  /* ---------------------------------------------------------
     Icons
     --------------------------------------------------------- */

  function getIcon(type) {
    const icons = {
      subject: "📚",
      period: "⏰",
      schedule: "🗓️",
      event: "📌",
      other: "🔎"
    };

    return (
      icons[type] ||
      icons.other
    );
  }

  /* ---------------------------------------------------------
     Utilities
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
     Keyboard shortcut
     --------------------------------------------------------- */

  document.addEventListener(
    "keydown",
    function (event) {
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

      if (
        event.key === "/" &&
        !search.state.open
      ) {
        event.preventDefault();

        open();
      }

      if (
        event.key === "Escape" &&
        search.state.open
      ) {
        close();
      }
    }
  );

  /* ---------------------------------------------------------
     Styles
     --------------------------------------------------------- */

  function injectStyles() {
    if (
      document.getElementById(
        "myroutine-search-styles"
      )
    ) {
      return;
    }

    const style =
      document.createElement("style");

    style.id =
      "myroutine-search-styles";

    style.textContent = `
      #myroutine-search-overlay {
        position: fixed;
        inset: 0;
        z-index: 99999;
        font-family: system-ui, -apple-system,
          BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      .mr-search-backdrop {
        position: absolute;
        inset: 0;
        background: rgba(0,0,0,.48);
        backdrop-filter: blur(5px);
      }

      .mr-search-panel {
        position: relative;
        width: min(720px, calc(100% - 24px));
        max-height: calc(100vh - 40px);
        margin: 20px auto;
        background: rgba(255,255,255,.97);
        color: #111827;
        border-radius: 22px;
        overflow: hidden;
        box-shadow:
          0 24px 70px rgba(0,0,0,.25);
        display: flex;
        flex-direction: column;
      }

      .mr-search-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        padding: 20px 20px 14px;
      }

      .mr-search-title {
        font-size: 20px;
        font-weight: 800;
      }

      .mr-search-subtitle {
        margin-top: 4px;
        font-size: 13px;
        opacity: .65;
      }

      .mr-search-close {
        width: 38px;
        height: 38px;
        border: 0;
        border-radius: 50%;
        background: rgba(0,0,0,.06);
        font-size: 25px;
        cursor: pointer;
      }

      .mr-search-input-wrap {
        display: flex;
        align-items: center;
        gap: 10px;
        margin: 0 18px;
        padding: 0 14px;
        height: 54px;
        border: 1px solid rgba(0,0,0,.12);
        border-radius: 15px;
        background: rgba(0,0,0,.025);
      }

      .mr-search-icon {
        font-size: 18px;
      }

      .mr-search-input {
        flex: 1;
        min-width: 0;
        border: 0;
        outline: 0;
        background: transparent;
        font-size: 16px;
      }

      .mr-search-clear {
        border: 0;
        background: transparent;
        cursor: pointer;
        font-size: 18px;
        opacity: .6;
      }

      .mr-search-filters {
        display: flex;
        gap: 7px;
        overflow-x: auto;
        padding: 14px 18px 10px;
      }

      .mr-search-filter {
        flex: 0 0 auto;
        border: 0;
        border-radius: 999px;
        padding: 8px 13px;
        background: rgba(0,0,0,.06);
        cursor: pointer;
        font-size: 13px;
      }

      .mr-search-filter.active {
        background: #111827;
        color: white;
      }

      .mr-search-results {
        overflow-y: auto;
        padding: 4px 12px 12px;
        min-height: 180px;
      }

      .mr-search-result {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 12px;
        text-align: left;
        border: 0;
        border-radius: 15px;
        padding: 12px;
        background: transparent;
        cursor: pointer;
      }

      .mr-search-result:hover,
      .mr-search-result.selected {
        background: rgba(0,0,0,.06);
      }

      .mr-search-result-icon {
        width: 42px;
        height: 42px;
        flex: 0 0 42px;
        display: grid;
        place-items: center;
        border-radius: 12px;
        background: rgba(0,0,0,.06);
        font-size: 19px;
      }

      .mr-search-result-content {
        min-width: 0;
        flex: 1;
      }

      .mr-search-result-title {
        font-weight: 750;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .mr-search-result-subtitle {
        margin-top: 3px;
        font-size: 13px;
        opacity: .65;
      }

      .mr-search-result-details {
        margin-top: 2px;
        font-size: 12px;
        opacity: .5;
      }

      .mr-search-result-type {
        font-size: 10px;
        text-transform: uppercase;
        opacity: .45;
      }

      .mr-search-empty {
        text-align: center;
        padding: 45px 20px;
      }

      .mr-search-empty-icon {
        font-size: 34px;
        margin-bottom: 10px;
      }

      .mr-search-empty-title {
        font-size: 16px;
        font-weight: 750;
      }

      .mr-search-empty-text {
        margin-top: 5px;
        font-size: 13px;
        opacity: .6;
      }

      .mr-search-footer {
        display: flex;
        justify-content: center;
        gap: 16px;
        flex-wrap: wrap;
        padding: 11px 16px;
        border-top: 1px solid rgba(0,0,0,.08);
        font-size: 11px;
        opacity: .55;
      }

      @media (max-width: 600px) {
        .mr-search-panel {
          width: 100%;
          max-height: 100vh;
          margin: 0;
          border-radius: 0;
        }

        .mr-search-result-type {
          display: none;
        }

        .mr-search-footer {
          padding-bottom: 18px;
        }
      }
    `;

    document.head.appendChild(style);
  }

  /* ---------------------------------------------------------
     Public API
     --------------------------------------------------------- */

  search.open = open;
  search.close = close;
  search.render = render;
  search.activateSelected =
    activateSelected;

  console.log(
    "MyRoutine Search UI ready."
  );

})();