/* MyRoutine — Universal UI System */

(function () {
  "use strict";

  const VERSION = "1.0.0";

  let toastContainer = null;
  let modalContainer = null;

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
        "myroutine-ui-styles"
      )
    ) {
      return;
    }

    const style =
      document.createElement("style");

    style.id =
      "myroutine-ui-styles";

    style.textContent = `
      .mr-ui-toast-container {
        position: fixed;
        z-index: 20000;
        right: 18px;
        bottom: 18px;
        display: flex;
        flex-direction: column;
        gap: 9px;
        width: min(360px, calc(100vw - 36px));
        pointer-events: none;
        font-family:
          Inter,
          system-ui,
          -apple-system,
          BlinkMacSystemFont,
          "Segoe UI",
          sans-serif;
      }

      .mr-ui-toast {
        pointer-events: auto;
        display: flex;
        align-items: flex-start;
        gap: 10px;
        padding: 13px 14px;
        background: #111827;
        color: #fff;
        border-radius: 12px;
        box-shadow:
          0 12px 35px rgba(0,0,0,.18);
        font-size: 13px;
        animation:
          mrToastIn .2s ease-out;
      }

      .mr-ui-toast.success {
        background: #166534;
      }

      .mr-ui-toast.error {
        background: #991b1b;
      }

      .mr-ui-toast.warning {
        background: #92400e;
      }

      .mr-ui-toast.info {
        background: #1e40af;
      }

      .mr-ui-toast-content {
        flex: 1;
        line-height: 1.45;
      }

      .mr-ui-toast-close {
        border: 0;
        background: transparent;
        color: inherit;
        opacity: .8;
        cursor: pointer;
        font-size: 17px;
        padding: 0;
      }

      .mr-ui-modal-overlay {
        position: fixed;
        inset: 0;
        z-index: 19000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 18px;
        background:
          rgba(15, 23, 42, .5);
        backdrop-filter: blur(7px);
        font-family:
          Inter,
          system-ui,
          -apple-system,
          BlinkMacSystemFont,
          "Segoe UI",
          sans-serif;
      }

      .mr-ui-modal {
        width: min(560px, 100%);
        max-height: min(760px, 90vh);
        overflow: hidden;
        display: flex;
        flex-direction: column;
        background: #fff;
        color: #111827;
        border-radius: 18px;
        box-shadow:
          0 25px 80px rgba(0,0,0,.25);
      }

      .mr-ui-modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 17px 18px;
        border-bottom:
          1px solid #e5e7eb;
      }

      .mr-ui-modal-title {
        margin: 0;
        font-size: 18px;
        font-weight: 750;
      }

      .mr-ui-modal-close {
        width: 35px;
        height: 35px;
        border: 0;
        border-radius: 9px;
        background: #f3f4f6;
        cursor: pointer;
        font-size: 19px;
      }

      .mr-ui-modal-body {
        padding: 18px;
        overflow-y: auto;
      }

      .mr-ui-modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        padding: 13px 18px;
        border-top:
          1px solid #e5e7eb;
        background: #fafafa;
      }

      .mr-ui-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 7px;
        border: 1px solid #d1d5db;
        background: #fff;
        color: #111827;
        border-radius: 10px;
        padding: 9px 13px;
        font-size: 13px;
        line-height: 1.2;
        cursor: pointer;
        transition:
          transform .12s ease,
          background .12s ease,
          border-color .12s ease;
      }

      .mr-ui-btn:hover {
        background: #f3f4f6;
      }

      .mr-ui-btn:active {
        transform: scale(.98);
      }

      .mr-ui-btn.primary {
        background: #111827;
        border-color: #111827;
        color: #fff;
      }

      .mr-ui-btn.primary:hover {
        background: #000;
      }

      .mr-ui-btn.danger {
        color: #b91c1c;
        border-color: #fecaca;
      }

      .mr-ui-btn.danger:hover {
        background: #fef2f2;
      }

      .mr-ui-btn.success {
        color: #166534;
        border-color: #bbf7d0;
      }

      .mr-ui-btn:disabled {
        opacity: .5;
        cursor: not-allowed;
        transform: none;
      }

      .mr-ui-card {
        background: #fff;
        border: 1px solid #e5e7eb;
        border-radius: 15px;
        padding: 16px;
      }

      .mr-ui-badge {
        display: inline-flex;
        align-items: center;
        padding: 4px 8px;
        border-radius: 999px;
        background: #f3f4f6;
        color: #374151;
        font-size: 10px;
        font-weight: 700;
      }

      .mr-ui-badge.success {
        background: #dcfce7;
        color: #166534;
      }

      .mr-ui-badge.warning {
        background: #fef3c7;
        color: #92400e;
      }

      .mr-ui-badge.danger {
        background: #fee2e2;
        color: #991b1b;
      }

      .mr-ui-badge.info {
        background: #dbeafe;
        color: #1e40af;
      }

      .mr-ui-loading {
        display: inline-flex;
        align-items: center;
        gap: 9px;
        color: #6b7280;
        font-size: 13px;
      }

      .mr-ui-spinner {
        width: 17px;
        height: 17px;
        border: 2px solid #d1d5db;
        border-top-color: #111827;
        border-radius: 50%;
        animation:
          mrUiSpin .7s linear infinite;
      }

      .mr-ui-tabs {
        display: flex;
        gap: 4px;
        overflow-x: auto;
        padding: 4px;
        background: #f3f4f6;
        border-radius: 11px;
      }

      .mr-ui-tab {
        flex: 0 0 auto;
        border: 0;
        border-radius: 8px;
        background: transparent;
        color: #6b7280;
        padding: 8px 12px;
        cursor: pointer;
        font-size: 12px;
      }

      .mr-ui-tab.active {
        background: #fff;
        color: #111827;
        box-shadow:
          0 1px 3px rgba(0,0,0,.08);
        font-weight: 700;
      }

      @keyframes mrToastIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }

        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes mrUiSpin {
        to {
          transform: rotate(360deg);
        }
      }

      @media (max-width: 600px) {
        .mr-ui-toast-container {
          right: 10px;
          bottom: 10px;
          width:
            calc(100vw - 20px);
        }

        .mr-ui-modal-overlay {
          padding: 0;
        }

        .mr-ui-modal {
          width: 100%;
          min-height: 100vh;
          max-height: 100vh;
          border-radius: 0;
        }
      }
    `;

    document.head.appendChild(
      style
    );
  }

  function ensureToastContainer() {
    injectStyles();

    if (
      toastContainer &&
      document.body.contains(
        toastContainer
      )
    ) {
      return toastContainer;
    }

    toastContainer =
      document.createElement(
        "div"
      );

    toastContainer.className =
      "mr-ui-toast-container";

    document.body.appendChild(
      toastContainer
    );

    return toastContainer;
  }

  function toast(
    message,
    options = {}
  ) {
    const container =
      ensureToastContainer();

    const type =
      options.type || "info";

    const duration =
      Number(
        options.duration
      ) || 3000;

    const item =
      document.createElement(
        "div"
      );

    item.className =
      `mr-ui-toast ${type}`;

    item.innerHTML = `
      <div class="mr-ui-toast-content">
        ${escapeHTML(message)}
      </div>

      <button
        type="button"
        class="mr-ui-toast-close"
        aria-label="Close"
      >
        ×
      </button>
    `;

    const close =
      item.querySelector(
        ".mr-ui-toast-close"
      );

    const remove = () => {
      if (
        item.parentNode
      ) {
        item.remove();
      }
    };

    close.onclick =
      remove;

    container.appendChild(
      item
    );

    if (
      duration > 0
    ) {
      window.setTimeout(
        remove,
        duration
      );
    }

    return {
      element: item,
      close: remove
    };
  }
  function ensureModalContainer() {
    injectStyles();

    if (
      modalContainer &&
      document.body.contains(
        modalContainer
      )
    ) {
      return modalContainer;
    }

    modalContainer =
      document.createElement(
        "div"
      );

    modalContainer.id =
      "myroutine-ui-modal-container";

    document.body.appendChild(
      modalContainer
    );

    return modalContainer;
  }

  function closeModal() {
    if (
      !modalContainer
    ) {
      return;
    }

    modalContainer.innerHTML =
      "";

    document.body.style.overflow =
      "";
  }

  function modal(options = {}) {
    const container =
      ensureModalContainer();

    const title =
      options.title ||
      "MyRoutine";

    const content =
      options.content ||
      "";

    const showClose =
      options.showClose !== false;

    const footer =
      options.footer ||
      "";

    container.innerHTML = `
      <div
        class="mr-ui-modal-overlay"
        role="dialog"
        aria-modal="true"
      >

        <div class="mr-ui-modal">

          <div
            class="mr-ui-modal-header"
          >
            <h2
              class="mr-ui-modal-title"
            >
              ${escapeHTML(title)}
            </h2>

            ${
              showClose
                ? `
                  <button
                    type="button"
                    class="mr-ui-modal-close"
                    aria-label="Close"
                  >
                    ×
                  </button>
                `
                : ""
            }
          </div>

          <div
            class="mr-ui-modal-body"
          >
            ${content}
          </div>

          ${
            footer
              ? `
                <div
                  class="mr-ui-modal-footer"
                >
                  ${footer}
                </div>
              `
              : ""
          }

        </div>
      </div>
    `;

    container
      .querySelector(
        ".mr-ui-modal-overlay"
      )
      ?.addEventListener(
        "click",
        event => {
          if (
            event.target.classList.contains(
              "mr-ui-modal-overlay"
            )
          ) {
            if (
              options.closeOnBackdrop !==
              false
            ) {
              closeModal();
            }
          }
        }
      );

    const closeButton =
      container.querySelector(
        ".mr-ui-modal-close"
      );

    if (closeButton) {
      closeButton.onclick =
        closeModal;
    }

    document.body.style.overflow =
      "hidden";

    if (
      typeof options.onOpen ===
      "function"
    ) {
      options.onOpen(
        container
      );
    }

    return {
      element: container,
      close: closeModal
    };
  }

  function confirm(
    message,
    options = {}
  ) {
    return new Promise(
      resolve => {
        let settled = false;

        const finish =
          value => {
            if (settled) {
              return;
            }

            settled = true;

            closeModal();

            resolve(value);
          };

        const title =
          options.title ||
          "Confirm";

        const confirmText =
          options.confirmText ||
          "Confirm";

        const cancelText =
          options.cancelText ||
          "Cancel";

        const danger =
          options.danger !== false;

        const footer = `
          <button
            type="button"
            class="mr-ui-btn"
            id="mr-confirm-cancel"
          >
            ${escapeHTML(
              cancelText
            )}
          </button>

          <button
            type="button"
            class="
              mr-ui-btn
              ${
                danger
                  ? "danger"
                  : "primary"
              }
            "
            id="mr-confirm-ok"
          >
            ${escapeHTML(
              confirmText
            )}
          </button>
        `;

        modal({
          title,
          content: `
            <div
              style="
                line-height:1.6;
                color:#4b5563;
                font-size:14px;
              "
            >
              ${escapeHTML(message)}
            </div>
          `,
          footer,
          closeOnBackdrop: false,
          onOpen: container => {
            container
              .querySelector(
                "#mr-confirm-cancel"
              )
              ?.addEventListener(
                "click",
                () => finish(false)
              );

            container
              .querySelector(
                "#mr-confirm-ok"
              )
              ?.addEventListener(
                "click",
                () => finish(true)
              );
          }
        });
      }
    );
  }

  function prompt(
    message,
    options = {}
  ) {
    return new Promise(
      resolve => {
        let settled = false;

        const finish =
          value => {
            if (settled) {
              return;
            }

            settled = true;

            closeModal();

            resolve(value);
          };

        const title =
          options.title ||
          "Enter value";

        const defaultValue =
          options.defaultValue ??
          "";

        const placeholder =
          options.placeholder ||
          "";

        const confirmText =
          options.confirmText ||
          "Save";

        const cancelText =
          options.cancelText ||
          "Cancel";

        const inputType =
          options.type ||
          "text";

        const footer = `
          <button
            type="button"
            class="mr-ui-btn"
            id="mr-prompt-cancel"
          >
            ${escapeHTML(
              cancelText
            )}
          </button>

          <button
            type="button"
            class="
              mr-ui-btn
              primary
            "
            id="mr-prompt-ok"
          >
            ${escapeHTML(
              confirmText
            )}
          </button>
        `;

        modal({
          title,
          content: `
            <div
              style="
                color:#4b5563;
                font-size:13px;
                margin-bottom:10px;
                line-height:1.5;
              "
            >
              ${escapeHTML(message)}
            </div>

            <input
              id="mr-prompt-input"
              type="${escapeHTML(
                inputType
              )}"
              value="${escapeHTML(
                defaultValue
              )}"
              placeholder="${escapeHTML(
                placeholder
              )}"
              style="
                width:100%;
                border:1px solid #d1d5db;
                border-radius:10px;
                padding:11px;
                outline:none;
              "
            />
          `,
          footer,
          closeOnBackdrop: false,
          onOpen: container => {
            const input =
              container.querySelector(
                "#mr-prompt-input"
              );

            const submit =
              () => {
                finish(
                  input?.value ?? ""
                );
              };

            container
              .querySelector(
                "#mr-prompt-cancel"
              )
              ?.addEventListener(
                "click",
                () => finish(null)
              );

            container
              .querySelector(
                "#mr-prompt-ok"
              )
              ?.addEventListener(
                "click",
                submit
              );

            input?.addEventListener(
              "keydown",
              event => {
                if (
                  event.key ===
                  "Enter"
                ) {
                  submit();
                }
              }
            );

            window.setTimeout(
              () => input?.focus(),
              30
            );
          }
        });
      }
    );
  }
  function button(
    text,
    options = {}
  ) {
    const element =
      document.createElement(
        "button"
      );

    element.type =
      options.type ||
      "button";

    element.className =
      `mr-ui-btn ${
        options.variant || ""
      }`;

    if (
      options.className
    ) {
      element.className +=
        ` ${options.className}`;
    }

    if (
      options.title
    ) {
      element.title =
        options.title;
    }

    if (
      options.disabled
    ) {
      element.disabled =
        true;
    }

    element.textContent =
      text;

    if (
      typeof options.onClick ===
      "function"
    ) {
      element.addEventListener(
        "click",
        options.onClick
      );
    }

    return element;
  }

  function badge(
    text,
    type = ""
  ) {
    const element =
      document.createElement(
        "span"
      );

    element.className =
      `mr-ui-badge ${type}`;

    element.textContent =
      text;

    return element;
  }

  function card(
    content,
    options = {}
  ) {
    const element =
      document.createElement(
        "div"
      );

    element.className =
      "mr-ui-card";

    if (
      options.className
    ) {
      element.className +=
        ` ${options.className}`;
    }

    if (
      typeof content ===
      "string"
    ) {
      element.innerHTML =
        content;
    } else if (
      content instanceof
      Node
    ) {
      element.appendChild(
        content
      );
    }

    return element;
  }

  function loading(
    text = "Loading..."
  ) {
    const element =
      document.createElement(
        "div"
      );

    element.className =
      "mr-ui-loading";

    element.innerHTML = `
      <span
        class="mr-ui-spinner"
        aria-hidden="true"
      ></span>

      <span>
        ${escapeHTML(text)}
      </span>
    `;

    return element;
  }

  function emptyState(
    title,
    description = "",
    options = {}
  ) {
    const element =
      document.createElement(
        "div"
      );

    element.style.cssText = `
      padding:35px 20px;
      text-align:center;
      color:#6b7280;
    `;

    element.innerHTML = `
      <div
        style="
          font-size:16px;
          font-weight:750;
          color:#111827;
          margin-bottom:6px;
        "
      >
        ${escapeHTML(title)}
      </div>

      ${
        description
          ? `
            <div
              style="
                font-size:12px;
                line-height:1.5;
              "
            >
              ${escapeHTML(
                description
              )}
            </div>
          `
          : ""
      }
    `;

    if (
      options.buttonText
    ) {
      const action =
        button(
          options.buttonText,
          {
            variant:
              "primary",
            onClick:
              options.onClick
          }
        );

      action.style.marginTop =
        "14px";

      element.appendChild(
        action
      );
    }

    return element;
  }

  function tabs(
    items,
    active,
    onChange
  ) {
    const container =
      document.createElement(
        "div"
      );

    container.className =
      "mr-ui-tabs";

    items.forEach(item => {
      const tab =
        document.createElement(
          "button"
        );

      tab.type =
        "button";

      tab.className =
        "mr-ui-tab";

      if (
        item.id === active
      ) {
        tab.classList.add(
          "active"
        );
      }

      tab.textContent =
        item.label;

      tab.addEventListener(
        "click",
        () => {
          if (
            typeof onChange ===
            "function"
          ) {
            onChange(
              item.id
            );
          }
        }
      );

      container.appendChild(
        tab
      );
    });

    return container;
  }

  function setLoading(
    element,
    state,
    text = "Loading..."
  ) {
    if (!element) {
      return;
    }

    if (state) {
      element.dataset
        .mrOriginalContent =
        element.innerHTML;

      element.innerHTML =
        "";

      element.appendChild(
        loading(text)
      );

      element.setAttribute(
        "aria-busy",
        "true"
      );
    } else {
      const original =
        element.dataset
          .mrOriginalContent;

      if (
        original !== undefined
      ) {
        element.innerHTML =
          original;

        delete element
          .dataset
          .mrOriginalContent;
      }

      element.removeAttribute(
        "aria-busy"
      );
    }
  }
  function notify(
    message,
    type = "info",
    duration = 3000
  ) {
    return toast(
      message,
      {
        type,
        duration
      }
    );
  }

  function success(
    message
  ) {
    return notify(
      message,
      "success"
    );
  }

  function error(
    message
  ) {
    return notify(
      message,
      "error"
    );
  }

  function warning(
    message
  ) {
    return notify(
      message,
      "warning"
    );
  }

  function info(
    message
  ) {
    return notify(
      message,
      "info"
    );
  }

  function setThemeClass(
    theme
  ) {
    document.documentElement
      .dataset
      .myroutineTheme =
      theme || "system";
  }

  function getThemeClass() {
    return (
      document.documentElement
        .dataset
        .myroutineTheme ||
      "system"
    );
  }

  function destroy() {
    if (
      toastContainer
    ) {
      toastContainer.remove();
      toastContainer = null;
    }

    if (
      modalContainer
    ) {
      modalContainer.remove();
      modalContainer = null;
    }

    const style =
      document.getElementById(
        "myroutine-ui-styles"
      );

    if (style) {
      style.remove();
    }
  }

  window.MyRoutineUI = {
    version:
      VERSION,

    escapeHTML,

    injectStyles,

    toast,
    notify,
    success,
    error,
    warning,
    info,

    modal,
    closeModal,
    confirm,
    prompt,

    button,
    badge,
    card,
    loading,
    emptyState,
    tabs,

    setLoading,

    setThemeClass,
    getThemeClass,

    destroy
  };

  window.addEventListener(
    "myroutine:ready",
    function () {
      injectStyles();
    }
  );

})();