/* Router, role switch, and action handlers. */
(function () {
  "use strict";

  var TABS = {
    customer: [
      { href: "#/c/home", key: "home", label: "首页", icon: "home" },
      { href: "#/c/book", key: "book", label: "预约", icon: "book" },
      { href: "#/c/member", key: "member", label: "会员", icon: "member" },
      { href: "#/c/me", key: "me", label: "我的", icon: "me" }
    ],
    staff: [
      { href: "#/s/today", key: "today", label: "今日", icon: "today" },
      { href: "#/s/customers", key: "customers", label: "顾客", icon: "people" },
      { href: "#/s/schedule", key: "schedule", label: "我的排班", icon: "calendar" },
      { href: "#/s/me", key: "me", label: "我的", icon: "me" }
    ],
    boss: [
      { href: "#/b/dashboard", key: "dashboard", label: "看板", icon: "board" },
      { href: "#/b/appointments", key: "appointments", label: "预约", icon: "appt" },
      { href: "#/b/ops", key: "ops", label: "经营", icon: "shop" },
      { href: "#/b/settings", key: "settings", label: "设置", icon: "gear" }
    ]
  };

  var DEFAULTS = { customer: "#/c/home", staff: "#/s/today", boss: "#/b/dashboard" };

  var ROUTES = {
    "c/home": ["cHome"],
    "c/services": ["cServices"],
    "c/service": ["cService", "id"],
    "c/stylists": ["cStylists"],
    "c/stylist": ["cStylist", "id"],
    "c/pets": ["cPets"],
    "c/pet": ["cPet", "id"],
    "c/book": ["cBook", "query"],
    "c/book/result": ["cBookResult", "id"],
    "c/appointments": ["cAppointments"],
    "c/appointment": ["cAppointment", "id"],
    "c/boarding": ["cBoardingList"],
    "c/boarding/new": ["cBoardingNew", "query"],
    "c/member": ["cMember"],
    "c/cards": ["cCards"],
    "c/records": ["cRecords", "query"],
    "c/me": ["cMe"],
    "s/today": ["sToday", "query"],
    "s/book": ["sBook", "query"],
    "s/appointment": ["sAppointment", "id"],
    "s/customers": ["sCustomers"],
    "s/customer": ["sCustomer", "id"],
    "s/boarding": ["sBoarding"],
    "s/boarding/new": ["sBoardingNew", "query"],
    "s/schedule": ["sSchedule"],
    "s/me": ["sMe"],
    "s/pet": ["sPet", "id"],
    "b/dashboard": ["bDashboard"],
    "b/appointments": ["bAppointments", "query"],
    "b/appointment": ["bAppointment", "id"],
    "b/ops": ["bOpsHome"],
    "b/services": ["bServices"],
    "b/service": ["bService", "id"],
    "b/staff": ["bStaff"],
    "b/stations": ["bStations"],
    "b/kennels": ["bKennels"],
    "b/customers": ["bCustomers"],
    "b/customer": ["bCustomer", "id"],
    "b/pet": ["bPet", "id"],
    "b/cards": ["bCards"],
    "b/records": ["bRecords", "query"],
    "b/hours": ["bHours"],
    "b/shop": ["bShop"],
    "b/roles": ["bRoles"],
    "b/settings": ["bSettingsHome"],
    "b/book": ["bBook", "query"]
  };

  function parseHash() {
    var raw = (location.hash || "").replace(/^#\/?/, "");
    var qIndex = raw.indexOf("?");
    var path = qIndex >= 0 ? raw.slice(0, qIndex) : raw;
    var qs = qIndex >= 0 ? raw.slice(qIndex + 1) : "";
    var query = {};
    if (qs) {
      qs.split("&").forEach(function (pair) {
        if (!pair) return;
        var kv = pair.split("=");
        query[decodeURIComponent(kv[0])] = decodeURIComponent((kv[1] || "").replace(/\+/g, " "));
      });
    }
    var segs = path.split("/").filter(Boolean);
    return { path: path, segs: segs, query: query, raw: location.hash };
  }

  function matchRoute(info) {
    var segs = info.segs.slice();
    // special cases with extra segment: pet/:id/edit, book/result/:id, boarding/new, pet/new
    if (segs[0] === "c" && segs[1] === "pet" && segs[2] && segs[3] === "edit") {
      return { fn: "cPetEdit", arg: segs[2], query: info.query };
    }
    if (segs[0] === "s" && segs[1] === "pet" && segs[2] === "new") {
      return { fn: "sPetNew", arg: info.query, query: info.query };
    }
    if (segs[0] === "b" && segs[1] === "pet" && segs[2] === "new") {
      return { fn: "bPetNew", arg: info.query, query: info.query };
    }
    if (segs[0] === "b" && segs[1] === "pet" && segs[2] && segs[3] === "edit") {
      return { fn: "bPetEdit", arg: segs[2], query: info.query };
    }
    if (segs[0] === "c" && segs[1] === "book" && segs[2] === "result") {
      return { fn: "cBookResult", arg: segs[3], query: info.query };
    }
    if (segs[1] === "boarding" && segs[2] && segs[2] !== "new") {
      var fnb = segs[0] === "c" ? "cBoarding" : (segs[0] === "s" ? "sBoardingDetail" : "sBoardingDetail");
      if (segs[0] === "b") fnb = "sBoardingDetail"; // reuse staff/boss same detail via role in actions? boss uses staff view? Better add boss boarding later.
      // Boss can use staff-like detail; we'll route boss boarding to a role-aware function by reusing sBoardingDetail and appointment-like pages.
      return { fn: segs[0] === "c" ? "cBoarding" : "sBoardingDetail", arg: segs[2], query: info.query };
    }
    if (segs[0] === "b" && segs[1] === "staff" && segs[2]) {
      return { fn: "bStaffDetail", arg: segs[2], query: info.query };
    }
    var key2 = segs.slice(0, 2).join("/");
    var key3 = segs.slice(0, 3).join("/");
    var def = ROUTES[key3] || ROUTES[key2];
    if (!def) return null;
    var arg = null;
    if (def[1] === "id") arg = segs[2];
    if (def[1] === "query") arg = info.query;
    return { fn: def[0], arg: arg, query: info.query };
  }

  function activeTab(role, path) {
    if (role === "customer") {
      if (path.indexOf("c/member") === 0 || path.indexOf("c/cards") === 0) return "member";
      if (path.indexOf("c/me") === 0 || path.indexOf("c/pets") === 0 || path.indexOf("c/pet") === 0 || path.indexOf("c/records") === 0 || path.indexOf("c/appointments") === 0 || path.indexOf("c/appointment") === 0 || path.indexOf("c/boarding") === 0) return "me";
      if (path.indexOf("c/book") === 0 || path.indexOf("c/services") === 0 || path.indexOf("c/service") === 0 || path.indexOf("c/stylist") === 0) return "book";
      return "home";
    }
    if (role === "staff") {
      if (path.indexOf("s/customer") === 0 || path.indexOf("s/pet") === 0) return "customers";
      if (path.indexOf("s/schedule") === 0) return "schedule";
      if (path.indexOf("s/me") === 0) return "me";
      return "today";
    }
    if (path.indexOf("b/appointment") === 0) return "appointments";
    if (path.indexOf("b/hours") === 0 || path.indexOf("b/shop") === 0 || path.indexOf("b/roles") === 0 || path.indexOf("b/settings") === 0) return "settings";
    if (path.indexOf("b/dashboard") === 0) return "dashboard";
    return "ops";
  }

  function go(href) {
    if (!href) return;
    if (href.charAt(0) !== "#") href = "#" + href;
    location.hash = href;
  }

  function currentRole() {
    return PFStore.session().role;
  }

  function setRole(role) {
    PFStore.update(function (s) { s.session.role = role; });
    go(DEFAULTS[role]);
  }

  function renderDemoBar() {
    var role = currentRole();
    var names = { customer: "顾客", staff: "店员", boss: "老板" };
    return '<div class="demo-wrap">' +
      '<div class="demo-bar">' +
      "<strong>PetFlow</strong>" +
      '<span class="mark">演示样品 · 虚拟数据 · 非真实经营数据</span>' +
      '<div class="demo-roles">' +
      ["customer", "staff", "boss"].map(function (r) {
        return '<button data-action="role" data-role="' + r + '" class="' + (role === r ? "active" : "") + '">' + names[r] + "</button>";
      }).join("") +
      "</div>" +
      '<button class="btn-reset" data-action="reset">初始化 / 重置</button></div>' +
      '<div class="demo-visual-note">品牌与视觉为 P2 提案，待确认，未锁定</div></div>';
  }

  function renderNav(role, path) {
    var tab = activeTab(role, path);
    return '<nav class="tabbar"><div class="tabbar-inner">' + TABS[role].map(function (t) {
      return '<button data-action="go" data-href="' + t.href + '" class="' + (tab === t.key ? "active" : "") + '">' +
        PFUI.icon(t.icon) + "<span>" + t.label + "</span></button>";
    }).join("") + "</div></nav>";
  }

  function render() {
    PFStore.init();
    var info = parseHash();
    var role = currentRole();
    if (!info.segs.length) {
      go(DEFAULTS[role]);
      return;
    }
    var prefix = { c: "customer", s: "staff", b: "boss" }[info.segs[0]];
    if (prefix && prefix !== role) {
      // Keep URL if user pasted a link; switch role to match the route so pages work.
      PFStore.update(function (s) { s.session.role = prefix; });
      role = prefix;
    }
    var matched = matchRoute(info);
    var content;
    try {
      if (!matched || !PFViews[matched.fn]) {
        content = '<div class="page-head"><h1>未找到页面</h1></div><div class="card empty">没有这条路径，请从底部导航进入。</div>';
      } else if (matched.arg !== null && matched.arg !== undefined && PFViews[matched.fn].length) {
        content = PFViews[matched.fn](matched.arg);
      } else if (matched.fn.indexOf("Book") >= 0 || matched.fn.indexOf("Records") >= 0 || matched.fn.indexOf("Today") >= 0 || matched.fn.indexOf("Appointments") >= 0 || matched.fn === "bPet" || matched.fn === "bPetNew" || matched.fn.indexOf("BoardingNew") >= 0) {
        content = PFViews[matched.fn](info.query);
      } else {
        content = PFViews[matched.fn](matched.arg);
      }
    } catch (err) {
      console.error(err);
      content = '<div class="card notice danger">页面渲染出错：' + PFUI.escape(err.message) + "</div>";
    }
    var root = document.getElementById("app");
    root.innerHTML = renderDemoBar() +
      '<main class="app-shell">' + content +
      '<p class="foot-note">绒所 · PET GROOMING &amp; BOARDING · 演示样品 · 虚拟数据 · 非真实经营数据</p>' +
      "</main>" + renderNav(role, info.path);
    bindAfter();
  }

  function currentQuery() {
    return parseHash().query;
  }

  function mergeQuery(patch) {
    var info = parseHash();
    var q = Object.assign({}, info.query, patch);
    Object.keys(q).forEach(function (k) { if (q[k] === "" || q[k] == null) delete q[k]; });
    var qs = Object.keys(q).map(function (k) { return encodeURIComponent(k) + "=" + encodeURIComponent(q[k]); }).join("&");
    var path = info.path;
    // drop trailing empty
    go("#/" + path + (qs ? "?" + qs : ""));
  }

  function formToObj(form) {
    var data = {};
    new FormData(form).forEach(function (v, k) {
      if (k in data) {
        if (!Array.isArray(data[k])) data[k] = [data[k]];
        data[k].push(v);
      } else data[k] = v;
    });
    return data;
  }

  function resultPrefix() {
    var role = currentRole();
    if (role === "staff") return "#/s";
    if (role === "boss") return "#/b";
    return "#/c";
  }

  function onAction(action, el, ev) {
    if (action === "go") { go(el.getAttribute("data-href")); return; }
    if (action === "back") { history.length > 1 ? history.back() : go(DEFAULTS[currentRole()]); return; }
    if (action === "role") { setRole(el.getAttribute("data-role")); return; }
    if (action === "reset") {
      PFUI.confirm("将恢复为初始演示数据，当前在本浏览器里做的预约、核销和寄养操作会被清除。", "初始化 / 重置").then(function (ok) {
        if (!ok) return;
        PFStore.reset();
        PFUI.toast("已恢复初始演示数据", "ok");
        render();
      });
      return;
    }
    if (action === "switch-customer") {
      PFStore.update(function (s) { s.session.customerId = el.getAttribute("data-id"); });
      PFUI.toast("已切换演示顾客", "ok");
      render();
      return;
    }
    if (action === "switch-staff") {
      PFStore.update(function (s) { s.session.staffId = el.getAttribute("data-id"); });
      PFUI.toast("已切换演示店员", "ok");
      render();
      return;
    }
    if (action === "book-set") {
      var noteEl = document.querySelector("[data-book-note]");
      var patch = {};
      patch[el.getAttribute("data-key")] = el.getAttribute("data-value") || "";
      if (el.getAttribute("data-key") === "date" || el.getAttribute("data-key") === "staff" || el.getAttribute("data-key") === "service" || el.getAttribute("data-key") === "pet") {
        if (el.getAttribute("data-key") !== "date") { /* keep date */ }
        if (el.getAttribute("data-key") !== "start") patch.start = "";
      }
      if (noteEl) patch.note = noteEl.value;
      mergeQuery(patch);
      return;
    }
    if (action === "book-submit") {
      var q = currentQuery();
      var note = (document.querySelector("[data-book-note]") || {}).value || q.note || "";
      var payload = {
        customerId: currentRole() === "customer" ? PFStore.session().customerId : q.customer,
        petId: q.pet,
        serviceId: q.service,
        staffId: q.staff,
        date: q.date || PF.today(),
        start: q.start,
        stationId: q.station || "",
        note: note
      };
      var res = PF.createAppointment(payload);
      if (!res.ok) { PFUI.toast(res.error, "err"); return; }
      PFUI.toast(res.appointment.status === "已确认" ? "预约已提交并自动确认" : "预约已提交，待店员确认", "ok");
      var role = currentRole();
      if (role === "customer") go("#/c/book/result/" + res.appointment.id);
      else go((role === "boss" ? "#/b" : "#/s") + "/appointment/" + res.appointment.id);
      return;
    }
    if (action === "cancel-appt") {
      PFUI.confirm("取消后，洗美师时段与美容台位都会释放。确定取消吗？", "取消预约").then(function (ok) {
        if (!ok) return;
        var r = PF.cancelAppointment(el.getAttribute("data-id"), currentRole(), PFStore.session().customerId);
        PFUI.toast(r.ok ? r.message : r.error, r.ok ? "ok" : "err");
        if (r.ok) render();
      });
      return;
    }
    if (action === "appt-next") {
      var r1 = PF.transitionAppointment(el.getAttribute("data-id"), el.getAttribute("data-to"), currentRole());
      PFUI.toast(r1.ok ? "状态已更新为「" + el.getAttribute("data-to") + "」" : r1.error, r1.ok ? "ok" : "err");
      if (r1.ok) render();
      return;
    }
    if (action === "appt-noshow") {
      PFUI.confirm("标记逾期未到后，将释放洗美师时段和美容台位。", "逾期未到").then(function (ok) {
        if (!ok) return;
        var r = PF.markNoShow(el.getAttribute("data-id"), currentRole());
        PFUI.toast(r.ok ? r.message : r.error, r.ok ? "ok" : "err");
        if (r.ok) render();
      });
      return;
    }
    if (action === "appt-pay") {
      openPayModal(el.getAttribute("data-id"));
      return;
    }
    if (action === "brd-set") {
      var patch2 = {};
      patch2[el.getAttribute("data-key")] = el.value || el.getAttribute("data-value") || "";
      mergeQuery(patch2);
      return;
    }
    if (action === "brd-submit") {
      var q2 = currentQuery();
      var res2 = PF.createBoarding({
        customerId: currentRole() === "customer" ? PFStore.session().customerId : q2.customer,
        petId: q2.pet,
        kennelId: q2.kennel,
        checkInDate: q2.checkIn,
        checkOutDate: q2.checkOut,
        note: (document.querySelector("[data-brd-note]") || {}).value || ""
      });
      if (!res2.ok) { PFUI.toast(res2.error, "err"); return; }
      PFUI.toast("寄养单已提交，笼位已按天占用", "ok");
      go(resultPrefix() + "/boarding/" + res2.boarding.id);
      return;
    }
    if (action === "brd-cancel") {
      PFUI.confirm("取消后，按天占用的笼位日期将释放。", "取消寄养").then(function (ok) {
        if (!ok) return;
        var r = PF.cancelBoarding(el.getAttribute("data-id"), currentRole(), PFStore.session().customerId);
        PFUI.toast(r.ok ? r.message : r.error, r.ok ? "ok" : "err");
        if (r.ok) render();
      });
      return;
    }
    if (action === "brd-checkin") {
      var rci = PF.checkInBoarding(el.getAttribute("data-id"), currentRole());
      PFUI.toast(rci.ok ? "已办理入住" : rci.error, rci.ok ? "ok" : "err");
      if (rci.ok) render();
      return;
    }
    if (action === "brd-report") {
      openReportModal(el.getAttribute("data-id"));
      return;
    }
    if (action === "brd-checkout") {
      openCheckoutModal(el.getAttribute("data-id"));
      return;
    }
  }

  function openPayModal(id) {
    var a = PF.getAppt(id);
    var cards = PF.cards().filter(function (c) { return c.customerId === a.customerId && c.serviceId === a.serviceId; });
    var html = '<p>完成服务并核销。默认到店收款，也可使用匹配项目的次卡。已核销的预约不能再扣一次。余次为 0 的次卡可用于演示“余次不足”。</p>' +
      '<p>应收标价 <strong>' + PF.formatYuan(a.priceFen) + "</strong></p>" +
      '<label class="field"><span class="lbl">收款方式</span><select id="pay-method">' +
      '<option value="cash">到店现金</option><option value="wechat_sim">到店模拟微信</option>' +
      (cards.length ? '<option value="card">次卡核销</option>' : "") +
      "</select></label>";
    if (cards.length) {
      html += '<label class="field" id="pay-card-wrap"><span class="lbl">次卡</span><select id="pay-card">';
      cards.forEach(function (c) {
        html += '<option value="' + c.id + '">' + PFUI.escape(c.name) + "（余 " + c.remainingTimes + " 次）</option>";
      });
      html += "</select></label>";
    } else {
      html += '<p class="tiny muted">该顾客没有对应本项目的次卡。可改用到店收款，或先到会员处演示购卡/发放。</p>';
    }
    PFUI.modal({ title: "完成并核销", html: html, okText: "确认核销" }).then(function (ok) {
      if (!ok) return;
      // modal already closed; we need values before close. So don't use this pattern.
    });
    // Re-bind so we capture values before close: replace ok handler.
    var root = document.getElementById("modal-root");
    var okBtn = root.querySelector('[data-ui="ok"]');
    okBtn.onclick = function () {
      var method = (document.getElementById("pay-method") || {}).value;
      var cardId = (document.getElementById("pay-card") || {}).value;
      PFUI.closeModal();
      var r = PF.completeAndPay(id, { method: method, cardId: cardId }, currentRole());
      PFUI.toast(r.ok ? "已完成并记账" : r.error, r.ok ? "ok" : "err");
      if (r.ok) render();
    };
  }

  function openReportModal(id) {
    PFUI.modal({
      title: "写寄养日报",
      html: '<label class="field"><span class="lbl">今日情况</span><textarea id="rpt-text" placeholder="饮食、精神、活动等"></textarea></label>',
      okText: "保存日报"
    });
    var root = document.getElementById("modal-root");
    root.querySelector('[data-ui="ok"]').onclick = function () {
      var text = (document.getElementById("rpt-text") || {}).value;
      PFUI.closeModal();
      var r = PF.addBoardingReport(id, text, currentRole(), PFStore.session().staffId);
      PFUI.toast(r.ok ? "日报已保存" : r.error, r.ok ? "ok" : "err");
      if (r.ok) render();
    };
  }

  function openCheckoutModal(id) {
    var b = PF.getBoarding(id);
    PFUI.modal({
      title: "离店并收款",
      html: "<p>寄养 " + b.nights + " 晚，应收 <strong>" + PF.formatYuan(b.priceFen) + "</strong>。仅模拟到店收款，不接入真实支付。</p>" +
        '<label class="field"><span class="lbl">收款方式</span><select id="co-method"><option value="cash">到店现金</option><option value="wechat_sim">到店模拟微信</option></select></label>',
      okText: "确认收款并离店"
    });
    var root = document.getElementById("modal-root");
    root.querySelector('[data-ui="ok"]').onclick = function () {
      var method = (document.getElementById("co-method") || {}).value;
      PFUI.closeModal();
      var r = PF.checkOutBoarding(id, { method: method }, currentRole());
      PFUI.toast(r.ok ? "已离店并记账" : r.error, r.ok ? "ok" : "err");
      if (r.ok) render();
    };
  }

  function bindAfter() {
    var filter = document.querySelector("[data-filter-customers]");
    if (filter) {
      filter.addEventListener("input", function () {
        var q = filter.value.trim();
        document.querySelectorAll(".cust-row").forEach(function (row) {
          row.style.display = !q || (row.getAttribute("data-name") || "").indexOf(q) !== -1 ? "" : "none";
        });
      });
    }
  }

  document.addEventListener("click", function (ev) {
    var el = ev.target.closest("[data-action]");
    if (!el) return;
    ev.preventDefault();
    onAction(el.getAttribute("data-action"), el, ev);
  });

  document.addEventListener("change", function (ev) {
    var el = ev.target.closest("[data-action-change]");
    if (!el) return;
    var patch = {};
    patch[el.getAttribute("data-key")] = el.value;
    mergeQuery(patch);
  });

  document.addEventListener("submit", function (ev) {
    var form = ev.target.closest("[data-form]");
    if (!form) return;
    ev.preventDefault();
    var kind = form.getAttribute("data-form");
    var data = formToObj(form);
    if (kind === "save-pet") {
      data.neutered = data.neutered === "1" || data.neutered === 1;
      var r = PF.savePet(data, currentRole(), PFStore.session().customerId);
      PFUI.toast(r.ok ? "宠物档案已保存" : r.error, r.ok ? "ok" : "err");
      if (r.ok) {
        var prefix = currentRole() === "customer" ? "#/c" : (currentRole() === "boss" ? "#/b" : "#/s");
        go(prefix + "/pet/" + r.pet.id);
      }
      return;
    }
    if (kind === "buy-card") {
      var r2 = PF.issueCard({ customerId: data.customerId, serviceId: data.serviceId, times: Number(data.times) }, currentRole());
      PFUI.toast(r2.ok ? "次卡已发放到顾客名下" : r2.error, r2.ok ? "ok" : "err");
      if (r2.ok) render();
      return;
    }
    if (kind === "staff-schedule") {
      var days = form.querySelectorAll('input[name="workDays"]:checked');
      var workDays = [];
      days.forEach(function (i) { workDays.push(Number(i.value)); });
      var r3 = PF.updateStaffSchedule(data.staffId, { workDays: workDays, workStart: data.workStart, workEnd: data.workEnd });
      PFUI.toast(r3.ok ? "排班已保存" : "保存失败", r3.ok ? "ok" : "err");
      if (r3.ok) render();
      return;
    }
    if (kind === "shop-rules") {
      PF.updateShop({ openTime: data.openTime, closeTime: data.closeTime, confirmMode: data.confirmMode, hoursText: "每日 " + data.openTime + "–" + data.closeTime });
      PFUI.toast("规则已保存", "ok");
      render();
      return;
    }
    if (kind === "shop-profile") {
      PF.updateShop({ name: data.name, nameEn: data.nameEn, tagline: data.tagline, address: data.address, phone: data.phone, intro: data.intro });
      PFUI.toast("门店资料已保存", "ok");
      render();
    }
  });

  window.addEventListener("hashchange", render);
  PFStore.init();
  if (!location.hash) location.hash = DEFAULTS[currentRole()];
  else render();

  window.PetFlow = { go: go, render: render, store: PFStore, engine: PF };
})();
