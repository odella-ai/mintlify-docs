// Progressive enhancement: native tables still scroll with JavaScript disabled.
// Show the affordance only when a real table overflows; support client navigation.
(() => {
  let scheduled = false;
  let nextId = 0;
  const tables = new Map();
  const attributes = ["tabindex", "role", "aria-label", "aria-describedby"];
  const observer = new ResizeObserver(() => schedule());
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => { scheduled = false; update(); });
  }
  function restore(state) {
    for (const [name, value] of state.original) {
      if (value === null) state.scroll.removeAttribute(name);
      else state.scroll.setAttribute(name, value);
    }
    state.scroll.removeAttribute("data-docs-table-scroll");
    state.hint?.remove();
    state.hint = null;
  }
  function update() {
    for (const [table, state] of tables) {
      if (!table.isConnected) {
        observer.unobserve(table);
        observer.unobserve(state.scroll);
        restore(state);
        tables.delete(table);
      }
    }
    for (const table of document.querySelectorAll("#content table")) {
      if (tables.has(table)) continue;
      let scroll = table.parentElement;
      while (scroll && scroll.id !== "content" && !/^(auto|scroll)$/.test(getComputedStyle(scroll).overflowX)) scroll = scroll.parentElement;
      if (!scroll || scroll.id === "content") continue;
      tables.set(table, { scroll, hint: null, original: attributes.map((name) => [name, scroll.getAttribute(name)]) });
      observer.observe(scroll);
      observer.observe(table);
    }
    for (const state of tables.values()) {
      if (state.scroll.scrollWidth > state.scroll.clientWidth + 1) {
        if (!state.hint) {
          const hint = document.createElement("p");
          hint.className = "docs-table-hint";
          hint.id = `docs-table-hint-${++nextId}`;
          hint.textContent = "Scroll horizontally to see all columns →";
          state.scroll.parentElement.before(hint);
          state.hint = hint;
          state.scroll.dataset.docsTableScroll = "";
          state.scroll.tabIndex = 0;
          state.scroll.setAttribute("role", "region");
          state.scroll.setAttribute("aria-label", "Scrollable table");
          const previous = state.original.find(([name]) => name === "aria-describedby")[1];
          state.scroll.setAttribute("aria-describedby", [previous, hint.id].filter(Boolean).join(" "));
        }
      } else if (state.hint) restore(state);
    }
  }
  function start() {
    new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
    schedule();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();
