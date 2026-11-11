/* Shared UI helpers: icons, toasts, modals, avatars. No external assets. */
(function (global) {
  "use strict";

  function svg(inner, attrs) {
    attrs = attrs || 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"';
    return '<svg ' + attrs + '>' + inner + '</svg>';
  }

  var ICONS = {
    home: svg('<path d="M4 11.5 12 5l8 6.5"/><path d="M6 10.5V19h12v-8.5"/>'),
    book: svg('<rect x="5" y="4" width="14" height="16" rx="2"/><path d="M8 9h8M8 13h5"/>'),
    member: svg('<path d="M12 3.5 14.2 8l4.8.7-3.5 3.4.8 4.8L12 14.8 7.7 16.9l.8-4.8L5 8.7 9.8 8z"/>'),
    me: svg('<circle cx="12" cy="8" r="3.2"/><path d="M5 19c1.5-3.2 3.8-4.8 7-4.8s5.5 1.6 7 4.8"/>'),
    today: svg('<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M8 3v4M16 3v4"/>'),
    people: svg('<circle cx="9" cy="8" r="2.6"/><path d="M4.5 18c.8-3 2.4-4.4 4.5-4.4S13 15 13.8 18"/><circle cx="16.5" cy="9" r="2.1"/><path d="M15 18c.4-1.8 1.4-2.8 3-3"/>'),
    calendar: svg('<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M8 3v4M16 3v4M8 14h3"/>'),
    board: svg('<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 9h8M8 12h8M8 15h5"/>'),
    appt: svg('<circle cx="12" cy="12" r="8"/><path d="M12 8v5l3 2"/>'),
    shop: svg('<path d="M4 10h16l-1 10H5L4 10z"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>'),
    gear: svg('<circle cx="12" cy="12" r="3"/><path d="M12 3.5v2.2M12 18.3V21M4.6 6.5l1.6 1.6M17.8 15.9l1.6 1.6M3.5 12h2.2M18.3 12H21M4.6 17.5l1.6-1.6M17.8 8.1l1.6-1.6"/>'),
    chevron: svg('<path d="M15 6l-6 6 6 6"/>'),
    plus: svg('<path d="M12 6v12M6 12h12"/>'),
    paw: svg('<circle cx="7" cy="9" r="1.6" fill="currentColor" stroke="none"/><circle cx="11" cy="6.5" r="1.6" fill="currentColor" stroke="none"/><circle cx="15.5" cy="6.8" r="1.6" fill="currentColor" stroke="none"/><circle cx="18.2" cy="9.5" r="1.6" fill="currentColor" stroke="none"/><path d="M8.2 16.2c1.4-2.4 6.4-2.4 7.6 0 1 2-1.1 3.5-3.8 3.5s-4.7-1.4-3.8-3.5z" fill="currentColor" stroke="none"/>'),
    leaf: svg('<path d="M5 13c6-8 13-9 15-9-1 8-5 14-13 14 0-2 0-3-2-5z"/><path d="M8 14c3-3 6-5 10-7"/>'),
    kennel: svg('<path d="M4 19V10l8-6 8 6v9"/><path d="M9 19v-6h6v6"/>'),
    card: svg('<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18"/>')
  };

  function icon(name) { return ICONS[name] || ICONS.paw; }

  function escapeHtml(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function portrait(pet, size) {
    size = size || 72;
    var bg = (pet && pet.accent) || "#2D6A57";
    var isCat = pet && pet.species === "猫";
    var svgInner;
    if (isCat) {
      svgInner = '<path d="M18 38c0-10 10-16 22-16s22 6 22 16v10c0 12-10 22-22 22S18 60 18 48z" fill="#fff" fill-opacity=".9"/><path d="M24 24l-6-14 16 8zM56 24l6-14-16 8z" fill="#fff" fill-opacity=".9"/><circle cx="32" cy="42" r="2.2" fill="#1E2422"/><circle cx="48" cy="42" r="2.2" fill="#1E2422"/><path d="M40 46v4M36 52c2 2 6 2 8 0" stroke="#1E2422" stroke-width="1.6" fill="none"/>';
    } else {
      svgInner = '<ellipse cx="40" cy="46" rx="20" ry="18" fill="#fff" fill-opacity=".9"/><circle cx="28" cy="28" r="8" fill="#fff" fill-opacity=".9"/><circle cx="52" cy="28" r="8" fill="#fff" fill-opacity=".9"/><circle cx="34" cy="44" r="2.1" fill="#1E2422"/><circle cx="46" cy="44" r="2.1" fill="#1E2422"/><path d="M40 48v5M36 56c3 3 5 3 8 0" stroke="#1E2422" stroke-width="1.6" fill="none"/>';
    }
    return '<div class="avatar portrait-wrap" style="width:' + size + 'px;height:' + size + 'px;background:' + bg + '">' +
      '<svg viewBox="0 0 80 80" width="' + (size * 0.86) + '" height="' + (size * 0.86) + '">' + svgInner + '</svg></div>';
  }

  function initialsAvatar(name, color, size) {
    size = size || 48;
    var ch = (name || "?").slice(0, 1);
    return '<div class="avatar" style="width:' + size + 'px;height:' + size + 'px;background:' + (color || "#2D6A57") + ';font-size:' + Math.round(size * 0.36) + 'px">' + escapeHtml(ch) + '</div>';
  }

  function leafMark() {
    return '<svg class="leaf-mark" viewBox="0 0 200 200" fill="none" aria-hidden="true">' +
      '<path d="M40 120c40-70 90-90 140-96-8 70-40 126-110 140 4-20 2-32-12-44z" fill="#2D6A57" opacity=".25"/>' +
      '<path d="M70 130c30-28 60-48 100-66" stroke="#2D6A57" stroke-width="3" opacity=".35"/>' +
      '</svg>';
  }

  function pill(status) {
    return '<span class="pill ' + PF.statusTone(status) + '">' + escapeHtml(status) + '</span>';
  }

  function toast(message, type) {
    var root = document.getElementById("toast-root");
    while (root.children.length >= 2) root.firstChild.remove();
    var el = document.createElement("div");
    el.className = "toast " + (type || "");
    el.textContent = message;
    root.appendChild(el);
    setTimeout(function () { if (el.parentNode) el.remove(); }, 2600);
  }

  function closeModal() {
    var root = document.getElementById("modal-root");
    root.classList.remove("show");
    root.innerHTML = "";
  }

  function modal(opts) {
    var root = document.getElementById("modal-root");
    root.innerHTML = '<div class="modal" role="dialog" aria-modal="true">' +
      '<h3>' + escapeHtml(opts.title || "请确认") + '</h3>' +
      '<div class="modal-body">' + (opts.html || ("<p>" + escapeHtml(opts.message || "") + "</p>")) + '</div>' +
      '<div class="btn-row">' +
        (opts.hideCancel ? "" : '<button class="btn btn-ghost" data-ui="cancel">' + escapeHtml(opts.cancelText || "取消") + '</button>') +
        '<button class="btn ' + (opts.danger ? "btn-coral" : "btn-primary") + '" data-ui="ok">' + escapeHtml(opts.okText || "确定") + '</button>' +
      '</div></div>';
    root.classList.add("show");
    return new Promise(function (resolve) {
      root.querySelector('[data-ui="ok"]').onclick = function () { closeModal(); resolve(true); };
      var c = root.querySelector('[data-ui="cancel"]');
      if (c) c.onclick = function () { closeModal(); resolve(false); };
      root.onclick = function (e) { if (e.target === root) { closeModal(); resolve(false); } };
    });
  }

  function confirmBox(message, title) {
    return modal({ title: title || "请确认", message: message });
  }

  global.PFUI = {
    icon: icon,
    escape: escapeHtml,
    portrait: portrait,
    initialsAvatar: initialsAvatar,
    leafMark: leafMark,
    pill: pill,
    toast: toast,
    modal: modal,
    closeModal: closeModal,
    confirm: confirmBox
  };
})(window);
