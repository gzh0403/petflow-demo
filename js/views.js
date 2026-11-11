/* All role views for the PetFlow clickable prototype. */
(function (global) {
  "use strict";

  var E = PFUI.escape;

  function head(title, sub, back) {
    return '<div class="page-head">' +
      (back ? '<button class="back-btn" data-action="back" aria-label="返回">' + PFUI.icon("chevron") + '</button>' : "") +
      '<div><h1>' + E(title) + '</h1>' + (sub ? '<p class="sub">' + sub + '</p>' : "") + '</div></div>';
  }

  function goBtn(href, label, cls) {
    return '<button class="' + (cls || "link") + '" data-action="go" data-href="' + E(href) + '">' + label + '</button>';
  }

  function apptLine(a) {
    var pet = PF.getPet(a.petId) || { name: "?" };
    var svc = PF.getService(a.serviceId) || { name: "?" };
    var st = PF.getStaff(a.staffId) || { name: "?" };
    var station = PF.getStation(a.stationId);
    var cust = PF.getCustomer(a.customerId);
    return {
      pet: pet, svc: svc, st: st, station: station, cust: cust,
      when: PF.formatDateShort(a.date) + " " + a.start + "–" + a.end,
      title: pet.name + " · " + svc.name
    };
  }

  function apptCard(a, href) {
    var x = apptLine(a);
    return '<article class="card hoverable" data-action="go" data-href="' + E(href) + '">' +
      '<div class="row-card">' + PFUI.portrait(x.pet, 48) +
      '<div class="grow"><h3>' + E(x.title) + " " + PFUI.pill(a.status) + '</h3>' +
      '<p>' + E(x.when) + " · " + E(x.st.name) + (x.station ? " · " + E(x.station.name) : "") + '</p>' +
      '<p class="price">' + PF.formatYuan(a.priceFen) + (a.payStatus === "paid" ? " · 已收款" : " · 到店收款") + '</p>' +
      '</div></div></article>';
  }

  function petCard(pet, href) {
    var owner = PF.getCustomer(pet.customerId);
    return '<article class="card hoverable" data-action="go" data-href="' + E(href) + '">' +
      '<div class="row-card">' + PFUI.portrait(pet, 52) +
      '<div class="grow"><h3>' + E(pet.name) + ' <span class="pill muted">' + E(pet.species) + '</span></h3>' +
      '<p>' + E(pet.breed || "品种未登记") + " · " + E(PF.specLabel(pet)) + " · " + E(PF.ageText(pet)) + '</p>' +
      (owner ? '<p>主人 ' + E(owner.name) + '</p>' : "") +
      '</div></div></article>';
  }

  function empty(text) {
    return '<div class="card empty"><div class="glyph">◌</div><div>' + E(text || "暂无内容") + '</div></div>';
  }

  function servicePriceLine(svc, pet) {
    if (pet) return PF.formatYuan(PF.servicePrice(svc, pet)) + '<span class="tiny soft"> · ' + E(PF.specLabel(pet)) + '</span>';
    var vals = Object.keys(svc.prices).map(function (k) { return svc.prices[k]; });
    var min = Math.min.apply(null, vals), max = Math.max.apply(null, vals);
    return PF.formatYuan(min) + (min !== max ? " 起" : "");
  }

  function priceTable(svc) {
    var sizes = ["small", "medium", "large"];
    var coats = ["short", "long"];
    var html = '<div class="table-wrap"><table class="data"><thead><tr><th>规格</th><th>短毛</th><th>长毛</th></tr></thead><tbody>';
    sizes.forEach(function (s) {
      html += '<tr><td>' + E(PF.sizeLabel(s)) + '</td>';
      coats.forEach(function (c) {
        html += '<td class="price">' + PF.formatYuan(svc.prices[s + "_" + c]) + '</td>';
      });
      html += '</tr>';
    });
    return html + '</tbody></table></div><p class="tiny muted">首版按规格取价，不做自动核价引擎。</p>';
  }

  function nextDays(n) {
    var list = [], t = PF.today();
    for (var i = 0; i < n; i++) list.push(PFData.addDaysYmd(t, i));
    return list;
  }

  function recordCard(r) {
    var pet = PF.getPet(r.petId) || { name: "?" };
    var cust = PF.getCustomer(r.customerId) || { name: "?" };
    var when = r.createdAt ? r.createdAt.replace("T", " ").slice(0, 16) : "";
    var price = r.method === "card"
      ? ("次卡 ×" + (r.timesUsed || 1) + "（标价 " + PF.formatYuan(r.listFen || r.amountFen) + "）")
      : PF.formatYuan(r.amountFen);
    return '<article class="card"><div class="row-card">' + PFUI.portrait(pet, 44) + '<div class="grow">' +
      '<h3>' + E(r.title) + '</h3>' +
      '<p>' + E(cust.name) + " · " + E(pet.name) + " · " + E(when) + '</p>' +
      '<p class="price">' + price + " · " + E(PF.payMethodLabel(r.method)) + '</p></div></div></article>';
  }

  function cardCard(c) {
    var svc = PF.getService(c.serviceId);
    var cust = PF.getCustomer(c.customerId);
    return '<article class="card"><div class="row-card">' +
      '<div class="avatar kennel">' + PFUI.icon("card") + '</div><div class="grow">' +
      '<h3>' + E(c.name) + " " + PFUI.pill(c.status) + '</h3>' +
      '<p>' + (cust ? E(cust.name) + " · " : "") + "余 <strong>" + c.remainingTimes + "</strong> / " +
      c.totalTimes + " 次 · 对应 " + E(svc ? svc.name : "") + " · " + E(c.expiresAt) + " 到期</p>" +
      '</div></div></article>';
  }

  function kennelBoard() {
    var days = nextDays(7);
    var html = '<div class="card"><h3 style="margin-top:0">未来 7 天笼位占用</h3><p class="tiny muted">色块表示该日已被按天占用（不含离店日）。这不是把同日半小时区间锁改个名字。</p><div class="table-wrap"><table class="data"><thead><tr><th>笼位</th>';
    days.forEach(function (d) { html += "<th>" + PF.formatDateShort(d) + "</th>"; });
    html += "</tr></thead><tbody>";
    PF.kennels().forEach(function (k) {
      html += "<tr><td>" + E(k.name) + "</td>";
      days.forEach(function (d) {
        var hits = PF.kennelConflict(k.id, d, PFData.addDaysYmd(d, 1));
        if (hits.length) {
          var p = PF.getPet(hits[0].petId);
          html += '<td><span class="pill accent">' + E(p ? p.name : "占用") + "</span></td>";
        } else html += '<td class="muted">空</td>';
      });
      html += "</tr>";
    });
    return html + "</tbody></table></div></div>";
  }

  function petForm(pet, customerId) {
    pet = pet || { name: "", species: "狗", breed: "", birthday: "", weightKg: "", size: "medium", coat: "short", neutered: false, allergies: "无", groomingNotes: "" };
    var ownerId = customerId || pet.customerId || "";
    var owner = ownerId ? PF.getCustomer(ownerId) : null;
    var ownerField;
    if (pet.id) {
      ownerField = '<input type="hidden" name="customerId" value="' + E(ownerId) + '">';
    } else if (owner) {
      ownerField = '<input type="hidden" name="customerId" value="' + E(ownerId) + '">' +
        '<p class="soft" style="margin-top:0">主人：' + E(owner.name) + "</p>";
    } else {
      ownerField = '<label class="field"><span class="lbl">主人</span><select name="customerId" required>' +
        '<option value="">请选择主人</option>' +
        PF.customers().map(function (c) {
          return '<option value="' + c.id + '">' + E(c.name) + "</option>";
        }).join("") +
        "</select></label>";
    }
    return '<form data-form="save-pet" class="card">' +
      '<input type="hidden" name="id" value="' + E(pet.id || "") + '">' +
      ownerField +
      '<label class="field"><span class="lbl">名字</span><input name="name" required value="' + E(pet.name) + '"></label>' +
      '<label class="field"><span class="lbl">物种</span><select name="species"><option value="狗"' + (pet.species === "狗" ? " selected" : "") + '>狗</option><option value="猫"' + (pet.species === "猫" ? " selected" : "") + '>猫</option></select></label>' +
      '<label class="field"><span class="lbl">品种</span><input name="breed" value="' + E(pet.breed || "") + '"></label>' +
      '<label class="field"><span class="lbl">生日</span><input type="date" name="birthday" value="' + E(pet.birthday || "") + '"></label>' +
      '<label class="field"><span class="lbl">体重（kg）</span><input type="number" step="0.1" name="weightKg" value="' + E(pet.weightKg || "") + '"></label>' +
      '<label class="field"><span class="lbl">体型规格</span><select name="size">' +
        ["small", "medium", "large"].map(function (s) { return '<option value="' + s + '"' + (pet.size === s ? " selected" : "") + ">" + PF.sizeLabel(s) + "</option>"; }).join("") +
      '</select></label>' +
      '<label class="field"><span class="lbl">毛量规格</span><select name="coat">' +
        ["short", "long"].map(function (s) { return '<option value="' + s + '"' + (pet.coat === s ? " selected" : "") + ">" + PF.coatLabel(s) + "</option>"; }).join("") +
      '</select></label>' +
      '<label class="field"><span class="lbl">绝育</span><select name="neutered"><option value="1"' + (pet.neutered ? " selected" : "") + '>已绝育</option><option value="0"' + (!pet.neutered ? " selected" : "") + '>未绝育</option></select></label>' +
      '<label class="field"><span class="lbl">过敏</span><input name="allergies" value="' + E(pet.allergies || "无") + '"></label>' +
      '<label class="field"><span class="lbl">美容备注</span><textarea name="groomingNotes">' + E(pet.groomingNotes || "") + "</textarea></label>" +
      '<button class="btn btn-primary btn-block" type="submit">保存档案</button></form>';
  }

  function cHome() {
    var shop = PF.shop();
    var me = PFStore.session().customerId;
    var mine = PF.appointments().filter(function (a) {
      return a.customerId === me && ["待确认", "已确认", "已到店", "服务中"].indexOf(a.status) !== -1;
    }).sort(function (a, b) { return (a.date + a.start) > (b.date + b.start) ? 1 : -1; });
    var html = '<section class="hero">' + PFUI.leafMark() +
      '<div class="tiny soft">社区洗护 · 单店演示</div>' +
      "<h1>" + E(shop.name) + "</h1>" +
      '<p class="brand-en">' + E(shop.nameEn) + "</p>" +
      '<p class="tagline">' + E(shop.tagline) + "</p>" +
      '<div class="meta"><span>' + E(shop.address) + "</span><span>" + E(shop.hoursText) + "</span><span>" + E(shop.phone) + "</span></div>" +
      '<div class="quick-actions">' +
        goBtn("#/c/book", PFUI.icon("book") + "预约洗美") +
        goBtn("#/c/pets", PFUI.icon("paw") + "我的宠物") +
        goBtn("#/c/boarding/new", PFUI.icon("kennel") + "寄养") +
      "</div></section>";
    html += '<div class="section-title"><h2>门店介绍</h2></div><div class="card"><p class="soft" style="margin:0;line-height:1.7">' + E(shop.intro) + "</p>" +
      '<p class="tiny muted" style="margin:10px 0 0">' + E(shop.addressNote) + "</p></div>";
    html += '<div class="section-title"><h2>服务项目</h2>' + goBtn("#/c/services", "全部") + '</div><div class="grid grid-2">';
    PF.services().forEach(function (s) {
      html += '<article class="card hoverable" data-action="go" data-href="#/c/service/' + s.id + '"><h3 style="margin:0 0 6px">' + E(s.name) + "</h3>" +
        '<p class="tiny soft" style="margin:0 0 8px">' + E(s.durationMin + " 分钟 · " + s.category) + "</p>" +
        '<div class="price">' + servicePriceLine(s, null) + "</div></article>";
    });
    html += '</div><div class="section-title"><h2>洗美师</h2>' + goBtn("#/c/stylists", "全部") + '</div><div class="grid grid-3">';
    PF.staff().forEach(function (s) {
      html += '<article class="card hoverable" data-action="go" data-href="#/c/stylist/' + s.id + '"><div class="row-card">' +
        PFUI.initialsAvatar(s.name, s.color, 44) + '<div class="grow"><h3>' + E(s.name) + "</h3><p>" + E(s.title) + "</p></div></div></article>";
    });
    html += "</div>";
    if (mine.length) {
      html += '<div class="section-title"><h2>进行中的预约</h2>' + goBtn("#/c/appointments", "我的预约") + "</div>";
      mine.slice(0, 3).forEach(function (a) { html += apptCard(a, "#/c/appointment/" + a.id); });
    }
    return html;
  }

  function cServices() {
    var html = head("服务项目", "价格按宠物体型与毛量规格显示", null);
    PF.services().forEach(function (s) {
      html += '<article class="card hoverable" data-action="go" data-href="#/c/service/' + s.id + '">' +
        '<div class="row-card"><div class="grow"><h3>' + E(s.name) + ' <span class="pill muted">' + E(s.category) + "</span></h3>" +
        "<p>" + E(s.desc) + '</p></div><div class="price">' + servicePriceLine(s, null) + "</div></div></article>";
    });
    return html;
  }

  function cService(id) {
    var s = PF.getService(id);
    if (!s) return head("未找到项目", "", true) + empty("项目不存在");
    var html = head(s.name, s.durationMin + " 分钟 · " + s.category, true);
    html += '<div class="card"><p class="soft" style="margin-top:0">' + E(s.desc) + "</p>" + priceTable(s) +
      '<div class="btn-row">' + goBtn("#/c/book?service=" + s.id, "预约此项目", "btn btn-primary btn-block") + "</div></div>";
    return html;
  }

  function cStylists() {
    var html = head("洗美师", "可在预约时选择", null);
    PF.staff().forEach(function (s) {
      var days = s.workDays.map(function (d) { return PF.WEEKDAYS[d]; }).join("、");
      html += '<article class="card hoverable" data-action="go" data-href="#/c/stylist/' + s.id + '"><div class="row-card">' +
        PFUI.initialsAvatar(s.name, s.color, 56) + '<div class="grow"><h3>' + E(s.name) + "</h3><p>" + E(s.title) + "</p>" +
        "<p>" + E(s.workStart + "–" + s.workEnd + " · " + days) + "</p></div></div></article>";
    });
    return html;
  }

  function cStylist(id) {
    var s = PF.getStaff(id);
    if (!s) return head("未找到", "", true) + empty("洗美师不存在");
    var days = s.workDays.map(function (d) { return PF.WEEKDAYS[d]; }).join("、");
    var html = head(s.name, s.title, true);
    html += '<div class="card"><div class="row-card">' + PFUI.initialsAvatar(s.name, s.color, 72) +
      '<div class="grow"><p>' + E(s.bio) + '</p><p class="soft">出诊 ' + E(days) + " " + E(s.workStart + "–" + s.workEnd) + "</p></div></div>" +
      '<div class="btn-row">' + goBtn("#/c/book?staff=" + s.id, "向" + E(s.name) + "预约", "btn btn-primary btn-block") + "</div></div>";
    return html;
  }

  function cPets() {
    var me = PFStore.session().customerId;
    var list = PF.petsOf(me);
    var html = head("我的宠物", "一位主人可以关联多只宠物", null);
    if (!list.length) html += empty("还没有宠物档案");
    list.forEach(function (p) { html += petCard(p, "#/c/pet/" + p.id); });
    html += '<div class="btn-row">' + goBtn("#/c/pet/new", "新增宠物档案", "btn btn-primary btn-block") + "</div>";
    return html;
  }

  function cPet(id) {
    if (id === "new") return head("新增宠物", "档案将关联到当前顾客", true) + petForm(null, PFStore.session().customerId);
    var pet = PF.getPet(id);
    if (!pet) return head("未找到", "", true) + empty("没有这只宠物");
    var html = head(pet.name, (pet.breed || "") + " · " + PF.specLabel(pet), true);
    html += '<div class="card"><div class="row-card">' + PFUI.portrait(pet, 84) +
      '<div class="grow"><dl class="kv">' +
      "<dt>物种</dt><dd>" + E(pet.species) + "</dd>" +
      "<dt>年龄</dt><dd>" + E(PF.ageText(pet)) + "</dd>" +
      "<dt>体重</dt><dd>" + E((pet.weightKg || "—") + (pet.weightKg ? " kg" : "")) + "</dd>" +
      "<dt>绝育</dt><dd>" + (pet.neutered ? "已绝育" : "未绝育") + "</dd>" +
      "<dt>过敏</dt><dd>" + E(pet.allergies || "无") + "</dd>" +
      "<dt>备注</dt><dd>" + E(pet.groomingNotes || "无") + "</dd>" +
      '</dl></div></div><div class="btn-row">' + goBtn("#/c/book?pet=" + pet.id, "为" + E(pet.name) + "预约", "btn btn-primary") +
      goBtn("#/c/pet/" + pet.id + "/edit", "编辑档案", "btn btn-ghost") + "</div></div>";
    var recs = PF.recordsFilter({ petId: pet.id });
    html += '<div class="section-title"><h2>这只宠物的消费记录</h2></div>';
    if (!recs.length) html += empty("还没有消费记录");
    recs.forEach(function (r) { html += recordCard(r); });
    return html;
  }

  function cPetEdit(id) {
    var pet = PF.getPet(id);
    if (!pet) return head("未找到", "", true) + empty("没有这只宠物");
    return head("编辑 " + pet.name, "保持字段轻量", true) + petForm(pet, pet.customerId);
  }

  function cMe() {
    var me = PF.getCustomer(PFStore.session().customerId);
    var html = head("我的", "当前演示顾客可在此切换", null);
    html += '<div class="card"><div class="row-card">' + PFUI.initialsAvatar(me.name, "#2D6A57", 56) +
      '<div class="grow"><h3>' + E(me.name) + "</h3><p>" + E(PF.maskPhone(me.phone)) + " · " + E(me.memberLevel) + "</p></div></div>" +
      '<div class="btn-row" style="margin-top:12px">' +
      goBtn("#/c/pets", "宠物档案", "btn btn-ghost") +
      goBtn("#/c/appointments", "我的预约", "btn btn-ghost") +
      goBtn("#/c/boarding", "寄养单", "btn btn-ghost") +
      goBtn("#/c/cards", "次卡", "btn btn-ghost") +
      goBtn("#/c/records", "消费记录", "btn btn-ghost") +
      "</div></div>";
    html += '<div class="card"><h3 style="margin-top:0">切换演示顾客</h3><p class="soft">便于体验多宠物与他人数据隔离。不会改变店员或老板看到的全店数据。</p><div class="chips">';
    PF.customers().forEach(function (c) {
      html += '<button class="chip' + (c.id === me.id ? " active" : "") + '" data-action="switch-customer" data-id="' + c.id + '">' + E(c.name) + "</button>";
    });
    html += "</div></div>";
    return html;
  }

  function bookView(role, query) {
    query = query || {};
    var isStaff = role !== "customer";
    var customerId = isStaff ? (query.customer || "") : PFStore.session().customerId;
    var petId = query.pet || "";
    var serviceId = query.service || "";
    var staffId = query.staff || "";
    var date = query.date || PF.today();
    var start = query.start || "";
    var stationId = query.station || "";
    var note = query.note || "";
    var html = head(isStaff ? "代客预约" : "填写预约", "必须先选择宠物，再选项目、洗美师和时段", true);

    if (isStaff) {
      html += '<div class="card"><div class="lbl tiny soft" style="margin-bottom:8px">顾客</div><div class="chips">';
      PF.customers().forEach(function (c) {
        html += '<button class="chip' + (customerId === c.id ? " active" : "") + '" data-action="book-set" data-key="customer" data-value="' + c.id + '">' + E(c.name) + "</button>";
      });
      html += "</div></div>";
    }

    var petList = customerId ? PF.petsOf(customerId) : [];
    html += '<div class="card"><div class="lbl tiny soft" style="margin-bottom:8px">1. 选择宠物（必选）</div>';
    if (!customerId && isStaff) html += '<p class="soft">请先选择顾客。</p>';
    else if (!petList.length) html += '<p class="soft">这位顾客还没有宠物档案，请先补建。</p>';
    else {
      html += '<div class="chips">';
      petList.forEach(function (p) {
        html += '<button class="chip' + (petId === p.id ? " active" : "") + '" data-action="book-set" data-key="pet" data-value="' + p.id + '">' + E(p.name) + " · " + E(PF.specLabel(p)) + "</button>";
      });
      html += "</div>";
    }
    html += "</div>";

    var pet = petId ? PF.getPet(petId) : null;
    if (!pet) return html + '<div class="notice warn">请先选择宠物。价格、可预约台位和时段都依赖宠物的物种、体型与毛量。</div>';

    html += '<div class="card"><div class="lbl tiny soft" style="margin-bottom:8px">2. 选择项目</div><div class="chips">';
    PF.services().forEach(function (s) {
      html += '<button class="chip' + (serviceId === s.id ? " active" : "") + '" data-action="book-set" data-key="service" data-value="' + s.id + '">' +
        E(s.name) + " · " + PF.formatYuan(PF.servicePrice(s, pet)) + " · " + s.durationMin + "分钟</button>";
    });
    html += "</div></div>";

    var svc = serviceId ? PF.getService(serviceId) : null;
    if (!svc) return html + '<div class="notice">已选择 ' + E(pet.name) + "（" + E(PF.specLabel(pet)) + "）。请继续选择项目。</div>";

    html += '<div class="card"><div class="row-card"><div class="grow"><h3 style="margin:0">' + E(svc.name) + "</h3>" +
      "<p>按 " + E(pet.name) + " 的规格「" + E(PF.specLabel(pet)) + "」取价</p></div>" +
      '<div class="price">' + PF.formatYuan(PF.servicePrice(svc, pet)) + "</div></div></div>";

    html += '<div class="card"><div class="lbl tiny soft" style="margin-bottom:8px">3. 选择洗美师</div><div class="chips">';
    PF.staff().forEach(function (s) {
      var off = !PF.staffWorksOn(s, date);
      html += '<button class="chip' + (staffId === s.id ? " active" : "") + '" data-action="book-set" data-key="staff" data-value="' + s.id + '">' +
        E(s.name) + (off ? "（所选日休息）" : "") + "</button>";
    });
    html += "</div></div>";

    html += '<div class="card"><div class="lbl tiny soft" style="margin-bottom:8px">4. 选择日期与时段</div><div class="chips" style="margin-bottom:12px">';
    nextDays(10).forEach(function (d) {
      html += '<button class="chip' + (date === d ? " active" : "") + '" data-action="book-set" data-key="date" data-value="' + d + '">' +
        (d === PF.today() ? "今天 " : "") + E(PF.formatDateShort(d)) + "</button>";
    });
    html += "</div>";

    var stf = staffId ? PF.getStaff(staffId) : null;
    if (!stf) return html + '<p class="soft">请选择洗美师后查看可约时段。</p></div>';

    var slots = PF.listSlots(staffId, pet, svc, date);
    if (slots.length === 1 && !slots[0].start) {
      html += '<div class="notice warn">' + E(slots[0].reason) + "</div>";
    } else {
      html += '<div class="slots">';
      slots.forEach(function (sl) {
        if (sl.available) {
          html += '<button class="slot' + (start === sl.start ? " active" : "") + '" data-action="book-set" data-key="start" data-value="' + sl.start + '">' + sl.start + "</button>";
        } else {
          html += '<button class="slot disabled" disabled title="' + E(sl.reason) + '">' + sl.start + "</button>";
        }
      });
      html += '</div><p class="tiny muted">划线时段不可选。可能是洗美师已被预约，或没有适合该宠物的空闲美容台位。</p>';
    }
    html += "</div>";

    if (isStaff) {
      html += '<div class="card"><div class="lbl tiny soft" style="margin-bottom:8px">美容台位（可指定；不指定则按宠物自动匹配空闲台位）</div><div class="chips">';
      html += '<button class="chip' + (!stationId ? " active" : "") + '" data-action="book-set" data-key="station" data-value="">自动匹配</button>';
      PF.candidateStations(pet).forEach(function (st) {
        html += '<button class="chip' + (stationId === st.id ? " active" : "") + '" data-action="book-set" data-key="station" data-value="' + st.id + '">' + E(st.name) + " · " + E(st.subtitle) + "</button>";
      });
      html += "</div></div>";
    }

    html += '<div class="card"><label class="field"><span class="lbl">备注（可选）</span>' +
      '<input name="note" data-book-note value="' + E(note) + '" placeholder="例如：请用低敏香波"></label>' +
      '<button class="btn btn-primary btn-block" data-action="book-submit"' + (start ? "" : " disabled") + ">提交预约</button>" +
      '<p class="tiny muted" style="margin:10px 0 0">提交后将同时占用洗美师时段锁和美容台位锁。默认' +
      (PF.shop().confirmMode === "auto" ? "自动确认。" : "待店员确认。") + "先约后付，到店收款。</p></div>";
    return html;
  }

  function cBookResult(id) {
    var a = PF.getAppt(id);
    if (!a) return head("提交结果", "", true) + empty("找不到预约");
    var x = apptLine(a);
    return head("预约已提交", a.status === "已确认" ? "系统已自动确认" : "等待店员确认", true) +
      '<div class="card"><div class="notice" style="margin-bottom:12px">演示样品已写入本地数据。店员或老板端刷新同一浏览器即可看到。</div>' +
      '<h3 style="margin-top:0">' + E(x.title) + " " + PFUI.pill(a.status) + "</h3>" +
      '<dl class="kv"><dt>时间</dt><dd>' + E(PF.formatDate(a.date, true) + " " + a.start + "–" + a.end) + "</dd>" +
      "<dt>洗美师</dt><dd>" + E(x.st.name) + "</dd>" +
      "<dt>美容台位</dt><dd>" + E(x.station ? x.station.name : "—") + '</dd>' +
      '<dt>价格</dt><dd class="price">' + PF.formatYuan(a.priceFen) + "（到店收款）</dd></dl>" +
      '<div class="btn-row">' + goBtn("#/c/appointment/" + a.id, "查看预约详情", "btn btn-primary") +
      goBtn("#/c/appointments", "我的预约", "btn btn-ghost") + "</div></div>";
  }

  function cAppointments() {
    var me = PFStore.session().customerId;
    var list = PF.appointments().filter(function (a) { return a.customerId === me; })
      .sort(function (a, b) { return (a.date + a.start) > (b.date + b.start) ? 1 : -1; });
    var html = head("我的预约", "含历史与进行中", null);
    if (!list.length) html += empty("暂无预约");
    list.forEach(function (a) { html += apptCard(a, "#/c/appointment/" + a.id); });
    return html;
  }

  function apptDetail(id, role) {
    var a = PF.getAppt(id);
    if (!a) return head("未找到预约", "", true) + empty("预约不存在或已重置");
    var x = apptLine(a);
    var html = head(x.title, PF.formatDate(a.date, true) + " " + a.start + "–" + a.end, true);
    html += '<div class="card"><div class="row-card">' + PFUI.portrait(x.pet, 64) +
      '<div class="grow"><h3 style="margin:0">' + E(x.pet.name) + " " + PFUI.pill(a.status) + "</h3>" +
      "<p>主人 " + E(x.cust.name) + (role === "customer" ? "" : " · " + E(PF.maskPhone(x.cust.phone))) + "</p>" +
      "<p>" + E(x.pet.breed) + " · " + E(PF.specLabel(x.pet)) + " · " + E(PF.ageText(x.pet)) + "</p></div></div>" +
      '<dl class="kv" style="margin-top:14px">' +
      "<dt>项目</dt><dd>" + E(x.svc.name) + "（" + x.svc.durationMin + " 分钟）</dd>" +
      "<dt>洗美师</dt><dd>" + E(x.st.name) + "</dd>" +
      "<dt>美容台位</dt><dd>" + E(x.station ? x.station.name + " · " + x.station.subtitle : "—") + "</dd>" +
      '<dt>价格</dt><dd class="price">' + PF.formatYuan(a.priceFen) + " · " + E(PF.specLabel(x.pet)) + "</dd>" +
      "<dt>收款</dt><dd>" + (a.payStatus === "paid" ? E(PF.payMethodLabel(a.payMethod)) : "未收款（先约后付）") + "</dd>" +
      (a.note ? "<dt>备注</dt><dd>" + E(a.note) + "</dd>" : "") +
      "</dl>";
    if (x.pet.allergies && x.pet.allergies !== "无") html += '<div class="notice warn" style="margin-top:12px">过敏：' + E(x.pet.allergies) + "</div>";
    if (x.pet.groomingNotes) html += '<div class="notice" style="margin-top:8px">美容备注：' + E(x.pet.groomingNotes) + "</div>";
    html += '<div class="section-title"><h2>状态</h2></div><ul class="timeline">';
    [["创建", a.createdAt], ["确认", a.confirmedAt], ["到店", a.arrivedAt], ["开始服务", a.startedAt], ["完成核销", a.completedAt], ["取消", a.cancelledAt], ["逾期未到", a.noShowAt]]
      .forEach(function (row) {
        if (row[1]) html += "<li>" + E(row[0]) + " · " + E(String(row[1]).replace("T", " ").slice(0, 16)) + "</li>";
      });
    html += "</ul>";
    if (a.status === "已取消" || a.status === "逾期未到") {
      html += '<div class="notice" style="margin-top:12px">该预约已结束占用。洗美师时段锁与美容台位锁均已释放，可以重新预约同一时段。</div>';
    } else if (a.status !== "已完成") {
      html += '<div class="notice" style="margin-top:12px">进行中的预约同时占用「' + E(x.st.name) + "」的时段锁和「" + E(x.station ? x.station.name : "台位") + "」的台位锁。</div>";
    }
    if (a.consumptionId) {
      var rec = PF.byId(PF.consumptions(), a.consumptionId);
      if (rec) html += '<div class="section-title"><h2>消费记录</h2></div>' + recordCard(rec);
    }
    html += '<div class="btn-row">';
    if (role === "customer") {
      if (["待确认", "已确认"].indexOf(a.status) !== -1) {
        html += '<button class="btn btn-danger" data-action="cancel-appt" data-id="' + a.id + '">取消预约</button>';
      } else {
        html += '<p class="tiny muted">顾客不能将预约改为已完成，也不能自行核销收款。</p>';
      }
    } else {
      if (a.status === "待确认") {
        html += '<button class="btn btn-primary" data-action="appt-next" data-id="' + a.id + '" data-to="已确认">确认预约</button>';
        html += '<button class="btn btn-danger" data-action="cancel-appt" data-id="' + a.id + '">取消</button>';
      }
      if (a.status === "已确认") {
        html += '<button class="btn btn-primary" data-action="appt-next" data-id="' + a.id + '" data-to="已到店">标记到店</button>';
        html += '<button class="btn btn-ghost" data-action="appt-noshow" data-id="' + a.id + '">逾期未到</button>';
        html += '<button class="btn btn-danger" data-action="cancel-appt" data-id="' + a.id + '">取消</button>';
      }
      if (a.status === "已到店") {
        html += '<button class="btn btn-primary" data-action="appt-next" data-id="' + a.id + '" data-to="服务中">开始服务</button>';
      }
      if (a.status === "服务中") {
        html += '<button class="btn btn-primary" data-action="appt-pay" data-id="' + a.id + '">完成并核销</button>';
      }
      if (a.status === "已完成") {
        html += '<button class="btn btn-ghost" data-action="appt-pay" data-id="' + a.id + '">再次核销（演示拒绝）</button>';
      }
    }
    html += "</div></div>";
    return html;
  }

  function boardingCard(b, href) {
    var pet = PF.getPet(b.petId) || { name: "?" };
    var kn = PF.getKennel(b.kennelId) || { name: "?" };
    return '<article class="card hoverable" data-action="go" data-href="' + E(href) + '"><div class="row-card">' +
      PFUI.portrait(pet, 48) + '<div class="grow"><h3>' + E(pet.name) + " · " + E(kn.name) + " " + PFUI.pill(b.status) + "</h3>" +
      "<p>" + E(PF.formatDateShort(b.checkInDate) + " 入住 — " + PF.formatDateShort(b.checkOutDate) + " 离店 · " + b.nights + " 晚（按天占笼）") + "</p>" +
      '<p class="price">' + PF.formatYuan(b.priceFen) + (b.payStatus === "paid" ? " · 已收款" : " · 离店收款") + "</p></div></div></article>";
  }

  function cBoardingList() {
    var me = PFStore.session().customerId;
    var list = PF.boardings().filter(function (b) { return b.customerId === me; });
    var html = head("寄养单", "轻量寄养演示 · 按天占笼", null);
    html += '<div class="btn-row" style="margin-bottom:12px">' + goBtn("#/c/boarding/new", "预约寄养", "btn btn-primary") + "</div>";
    if (!list.length) html += empty("还没有寄养单");
    list.forEach(function (b) { html += boardingCard(b, "#/c/boarding/" + b.id); });
    return html;
  }

  function boardingForm(role, query) {
    query = query || {};
    var isStaff = role !== "customer";
    var customerId = isStaff ? (query.customer || "") : PFStore.session().customerId;
    var petId = query.pet || "";
    var kennelId = query.kennel || "";
    var checkIn = query.checkIn || PFData.addDaysYmd(PF.today(), 1);
    var checkOut = query.checkOut || PFData.addDaysYmd(checkIn, 2);
    var html = head(isStaff ? "代客登记寄养" : "预约寄养", "按天占用笼位，离店日不计入", true);
    if (isStaff) {
      html += '<div class="card"><div class="lbl tiny soft" style="margin-bottom:8px">顾客</div><div class="chips">';
      PF.customers().forEach(function (c) {
        html += '<button class="chip' + (customerId === c.id ? " active" : "") + '" data-action="brd-set" data-key="customer" data-value="' + c.id + '">' + E(c.name) + "</button>";
      });
      html += "</div></div>";
    }
    var petList = customerId ? PF.petsOf(customerId) : [];
    html += '<div class="card"><div class="lbl tiny soft" style="margin-bottom:8px">选择宠物</div><div class="chips">';
    petList.forEach(function (p) {
      html += '<button class="chip' + (petId === p.id ? " active" : "") + '" data-action="brd-set" data-key="pet" data-value="' + p.id + '">' + E(p.name) + "</button>";
    });
    html += "</div></div>";
    var pet = petId ? PF.getPet(petId) : null;
    if (!pet) return html + '<div class="notice warn">请先选择宠物。</div>';

    html += '<div class="card"><div class="lbl tiny soft" style="margin-bottom:8px">房型 / 笼位</div><div class="chips">';
    PF.kennels().filter(function (k) { return k.enabled; }).forEach(function (k) {
      var fit = k.species.indexOf(pet.species) !== -1;
      var hits = (checkIn && checkOut && checkOut > checkIn) ? PF.kennelConflict(k.id, checkIn, checkOut) : [];
      var busy = hits.length > 0;
      html += '<button class="chip' + (kennelId === k.id ? " active" : "") + '"' + (!fit ? " disabled" : "") +
        ' data-action="brd-set" data-key="kennel" data-value="' + k.id + '">' +
        E(k.name) + " · " + PF.formatYuan(k.pricePerDayFen) + "/晚" + (!fit ? "（不接收" + pet.species + "）" : busy ? "（所选日期已被占用）" : "") + "</button>";
    });
    html += "</div></div>";

    html += '<div class="card"><label class="field"><span class="lbl">入住日期</span>' +
      '<input type="date" data-action-change="brd-set" data-key="checkIn" value="' + E(checkIn) + '"></label>' +
      '<label class="field"><span class="lbl">离店日期（当天不占笼）</span>' +
      '<input type="date" data-action-change="brd-set" data-key="checkOut" value="' + E(checkOut) + '"></label>';
    var nights = (checkIn && checkOut && checkOut > checkIn) ? PF.nightsOf(checkIn, checkOut) : 0;
    var kn = kennelId ? PF.getKennel(kennelId) : null;
    if (nights > 0 && kn) {
      html += "<p>共 <strong>" + nights + '</strong> 晚，预计 <span class="price">' + PF.formatYuan(kn.pricePerDayFen * nights) + "</span></p>" +
        '<p class="tiny muted">占用日期：' + PF.occupiedDates(checkIn, checkOut).map(function (d) { return PF.formatDateShort(d); }).join("、") + "。离店日 " + PF.formatDateShort(checkOut) + " 不占用。</p>";
    }
    html += '<label class="field"><span class="lbl">备注</span><input data-brd-note placeholder="饮食、用药或习性说明"></label>' +
      '<button class="btn btn-primary btn-block" data-action="brd-submit">提交寄养单</button></div>';
    return html;
  }

  function boardingDetail(id, role) {
    var b = PF.getBoarding(id);
    if (!b) return head("未找到寄养单", "", true) + empty("寄养单不存在");
    var pet = PF.getPet(b.petId);
    var kn = PF.getKennel(b.kennelId);
    var cust = PF.getCustomer(b.customerId);
    var html = head((pet ? pet.name : "宠物") + " 的寄养", (kn ? kn.name : "") + " · " + b.nights + " 晚", true);
    html += '<div class="card"><div class="row-card">' + PFUI.portrait(pet, 64) +
      '<div class="grow"><h3 style="margin:0">' + E(pet.name) + " " + PFUI.pill(b.status) + "</h3>" +
      "<p>主人 " + E(cust.name) + "</p></div></div>" +
      '<dl class="kv" style="margin-top:14px">' +
      "<dt>笼位</dt><dd>" + E(kn.name) + " · " + E(kn.type) + "</dd>" +
      "<dt>入住</dt><dd>" + E(PF.formatDate(b.checkInDate, true)) + "</dd>" +
      "<dt>离店</dt><dd>" + E(PF.formatDate(b.checkOutDate, true)) + "（当天不占笼）</dd>" +
      "<dt>占用日</dt><dd>" + E(PF.occupiedDates(b.checkInDate, b.checkOutDate).map(function (d) { return PF.formatDateShort(d); }).join("、")) + "</dd>" +
      '<dt>费用</dt><dd class="price">' + PF.formatYuan(b.priceFen) + "（" + PF.formatYuan(kn.pricePerDayFen) + " × " + b.nights + " 晚）</dd>" +
      "<dt>收款</dt><dd>" + (b.payStatus === "paid" ? E(PF.payMethodLabel(b.payMethod)) : "离店时到店收款") + "</dd>" +
      (b.note ? "<dt>备注</dt><dd>" + E(b.note) + "</dd>" : "") +
      "</dl>";
    html += '<div class="section-title"><h2>寄养日报</h2></div>';
    if (!b.reports.length) html += '<p class="soft">还没有日报。</p>';
    b.reports.forEach(function (r) {
      var author = PF.getStaff(r.authorId);
      html += '<div class="card" style="margin-top:8px"><p class="tiny soft" style="margin:0 0 6px">' + E(PF.formatDate(r.date, true)) + (author ? " · " + author.name : "") + '</p><p style="margin:0">' + E(r.content) + "</p></div>";
    });
    html += '<div class="btn-row">';
    if (role === "customer") {
      if (b.status === "待入住") html += '<button class="btn btn-danger" data-action="brd-cancel" data-id="' + b.id + '">取消寄养</button>';
      else html += '<p class="tiny muted">顾客可查看日报，入住、写日报与离店收款由店员或店长完成。</p>';
    } else {
      if (b.status === "待入住") {
        html += '<button class="btn btn-primary" data-action="brd-checkin" data-id="' + b.id + '">办理入住</button>';
        html += '<button class="btn btn-danger" data-action="brd-cancel" data-id="' + b.id + '">取消</button>';
      }
      if (b.status === "已入住") {
        html += '<button class="btn btn-ghost" data-action="brd-report" data-id="' + b.id + '">写日报</button>';
        html += '<button class="btn btn-primary" data-action="brd-checkout" data-id="' + b.id + '">离店并收款</button>';
      }
    }
    html += "</div></div>";
    return html;
  }

  function cMember() {
    var me = PF.getCustomer(PFStore.session().customerId);
    var cards = PF.cards().filter(function (c) { return c.customerId === me.id; });
    var html = head("会员权益", me.name + " · " + me.memberLevel, null);
    html += '<div class="hero"><p class="brand-en">' + E(PF.shop().nameEn) + '</p><h1 style="font-size:28px">绒所会员</h1>' +
      '<p class="tagline">到店预约、次卡核销、宠物档案都记在同一位主人名下。</p>' +
      '<p class="soft" style="margin-top:12px">本样品不提供积分商城、返现或分销。次卡可在店内演示购买或发放。</p></div>';
    html += '<div class="section-title"><h2>我的次卡</h2>' + goBtn("#/c/cards", "全部") + "</div>";
    if (!cards.length) html += empty("还没有次卡");
    cards.forEach(function (c) { html += cardCard(c); });
    html += '<div class="btn-row">' + goBtn("#/c/records", "查看消费记录", "btn btn-ghost btn-block") + "</div>";
    return html;
  }

  function cCards() {
    var me = PFStore.session().customerId;
    var cards = PF.cards().filter(function (c) { return c.customerId === me; });
    var html = head("我的次卡", "核销扣次，余次不能为负，同一笔不能重复核销", null);
    if (!cards.length) html += empty("还没有次卡");
    cards.forEach(function (c) { html += cardCard(c); });
    html += '<div class="card"><h3 style="margin-top:0">演示购卡</h3><p class="soft">选择项目与次数，立即发放到当前顾客名下（虚拟数据，不产生费用）。</p>' +
      '<form data-form="buy-card"><input type="hidden" name="customerId" value="' + E(me) + '">' +
      '<label class="field"><span class="lbl">项目</span><select name="serviceId">' +
      PF.services().map(function (s) { return '<option value="' + s.id + '">' + E(s.name) + "</option>"; }).join("") +
      '</select></label><label class="field"><span class="lbl">次数</span><select name="times"><option>5</option><option selected>10</option></select></label>' +
      '<button class="btn btn-primary btn-block" type="submit">演示购卡</button></form></div>';
    return html;
  }

  function recordsPage(opts, title, sub) {
    var recs = PF.recordsFilter(opts || {});
    var html = head(title, sub, opts && (opts.customerId || opts.petId) && opts._back ? true : null);
    if (opts && opts.customerId && opts._role) {
      html += '<div class="chips" style="margin-bottom:12px">';
      html += '<button class="chip' + (!opts.petId ? " active" : "") + '" data-action="go" data-href="#/' + opts._role + "/records" + (opts.customerId && opts._role !== "c" ? "?customer=" + opts.customerId : "") + '">全部</button>';
      PF.petsOf(opts.customerId).forEach(function (p) {
        var href = "#/" + opts._role + "/records?pet=" + p.id + (opts._role !== "c" ? "&customer=" + opts.customerId : "");
        html += '<button class="chip' + (opts.petId === p.id ? " active" : "") + '" data-action="go" data-href="' + href + '">' + E(p.name) + "</button>";
      });
      html += "</div>";
    }
    if (!recs.length) html += empty("还没有消费记录");
    recs.forEach(function (r) { html += recordCard(r); });
    return html;
  }

  function sToday(query) {
    query = query || {};
    var tab = query.tab || "all";
    var staffId = PFStore.session().staffId;
    var t = PF.today();
    var list = PF.appointments().filter(function (a) { return a.date === t && a.status !== "已取消"; });
    if (tab === "mine") list = list.filter(function (a) { return a.staffId === staffId; });
    if (tab === "pending") list = PF.appointments().filter(function (a) { return a.status === "待确认"; });
    list.sort(function (a, b) { return a.start > b.start ? 1 : -1; });
    var me = PF.getStaff(staffId);
    var html = head("今日", PF.formatDate(t, true) + " · " + me.name, null);
    html += '<div class="filter-tabs">' +
      goBtn("#/s/today?tab=all", "全店今日", tab === "all" ? "active" : "") +
      goBtn("#/s/today?tab=mine", "我的预约", tab === "mine" ? "active" : "") +
      goBtn("#/s/today?tab=pending", "待确认", tab === "pending" ? "active" : "") +
      "</div>";
    html += '<div class="btn-row" style="margin:12px 0">' + goBtn("#/s/book", "代客预约", "btn btn-primary") + goBtn("#/s/boarding", "寄养看板", "btn btn-ghost") + "</div>";
    if (!list.length) html += empty("这一栏暂时没有预约");
    list.forEach(function (a) { html += apptCard(a, "#/s/appointment/" + a.id); });
    return html;
  }

  function sCustomers() {
    var html = head("顾客", "查询顾客与宠物档案", null);
    html += '<div class="card"><input data-filter-customers placeholder="输入姓名或手机号" style="margin:0"></div><div id="cust-list">';
    PF.customers().forEach(function (c) {
      var ps = PF.petsOf(c.id).map(function (p) { return p.name; }).join("、");
      html += '<article class="card hoverable cust-row" data-name="' + E(c.name + c.phone) + '" data-action="go" data-href="#/s/customer/' + c.id + '">' +
        '<div class="row-card">' + PFUI.initialsAvatar(c.name, "#4F8A76", 44) + '<div class="grow"><h3>' + E(c.name) + "</h3>" +
        "<p>" + E(PF.maskPhone(c.phone)) + " · 宠物：" + E(ps || "无") + "</p></div></div></article>";
    });
    html += "</div>";
    return html;
  }

  function customerDetail(id, role) {
    var c = PF.getCustomer(id);
    if (!c) return head("未找到顾客", "", true) + empty("顾客不存在");
    var prefix = role === "boss" ? "b" : "s";
    var html = head(c.name, PF.maskPhone(c.phone) + " · " + c.memberLevel, true);
    html += '<div class="section-title"><h2>宠物</h2>' + (role !== "customer" ? goBtn("#/" + prefix + "/pet/new?customer=" + c.id, "新增") : "") + "</div>";
    PF.petsOf(c.id).forEach(function (p) { html += petCard(p, "#/" + prefix + "/pet/" + p.id); });
    html += '<div class="section-title"><h2>预约</h2></div>';
    var aps = PF.appointments().filter(function (a) { return a.customerId === c.id; }).sort(function (a, b) { return (a.date + a.start) < (b.date + b.start) ? 1 : -1; });
    aps.slice(0, 6).forEach(function (a) { html += apptCard(a, "#/" + prefix + "/appointment/" + a.id); });
    html += '<div class="section-title"><h2>次卡</h2></div>';
    PF.cards().filter(function (x) { return x.customerId === c.id; }).forEach(function (card) { html += cardCard(card); });
    if (role !== "customer") {
      html += '<div class="btn-row">' + goBtn("#/" + prefix + "/book?customer=" + c.id, "代客预约", "btn btn-primary") +
        goBtn("#/" + prefix + "/records?customer=" + c.id, "消费记录", "btn btn-ghost") + "</div>";
    }
    return html;
  }

  function sBoarding() {
    var html = head("寄养看板", "按天查看笼位占用", null);
    html += '<div class="btn-row" style="margin-bottom:12px">' + goBtn("#/s/boarding/new", "代客登记寄养", "btn btn-primary") + "</div>";
    html += kennelBoard();
    html += '<div class="section-title"><h2>寄养单</h2></div>';
    PF.boardings().slice().sort(function (a, b) { return a.checkInDate > b.checkInDate ? 1 : -1; })
      .forEach(function (b) { html += boardingCard(b, "#/s/boarding/" + b.id); });
    return html;
  }

  function sSchedule() {
    var me = PF.getStaff(PFStore.session().staffId);
    var days = nextDays(7);
    var html = head("我的排班", me.name + " · " + me.workStart + "–" + me.workEnd, null);
    html += '<div class="card"><p>' + E(me.bio) + '</p><p class="soft">工作日：' + me.workDays.map(function (d) { return PF.WEEKDAYS[d]; }).join("、") + "</p></div>";
    html += '<div class="section-title"><h2>近 7 天安排</h2></div>';
    days.forEach(function (d) {
      var off = !PF.staffWorksOn(me, d);
      var aps = PF.appointments().filter(function (a) { return a.staffId === me.id && a.date === d && a.status !== "已取消" && a.status !== "逾期未到"; })
        .sort(function (a, b) { return a.start > b.start ? 1 : -1; });
      html += '<div class="card"><h3 style="margin:0 0 6px">' + E(PF.formatDate(d, true)) + (off ? ' <span class="pill muted">休息</span>' : "") + "</h3>";
      if (off && !aps.length) html += '<p class="muted">当天休息</p>';
      if (!aps.length && !off) html += '<p class="muted">暂无预约</p>';
      aps.forEach(function (a) {
        var x = apptLine(a);
        html += "<p>" + E(a.start + "–" + a.end + " · " + x.pet.name + " · " + x.svc.name) + " " + PFUI.pill(a.status) + "</p>";
      });
      html += "</div>";
    });
    return html;
  }

  function sMe() {
    var me = PF.getStaff(PFStore.session().staffId);
    var html = head("店员中心", "切换当前演示店员身份", null);
    html += '<div class="card"><div class="row-card">' + PFUI.initialsAvatar(me.name, me.color, 64) +
      '<div class="grow"><h3>' + E(me.name) + "</h3><p>" + E(me.title) + '</p><p class="soft">' + E(me.bio) + "</p></div></div></div>";
    html += '<div class="card"><h3 style="margin-top:0">切换演示店员</h3><div class="chips">';
    PF.staff().forEach(function (s) {
      html += '<button class="chip' + (s.id === me.id ? " active" : "") + '" data-action="switch-staff" data-id="' + s.id + '">' + E(s.name) + "</button>";
    });
    html += "</div></div>";
    return html;
  }

  function sPet(id, query) {
    query = query || {};
    if (id === "new") return head("新增宠物档案", "必须关联到一位主人", true) + petForm(null, query.customer || "");
    var pet = PF.getPet(id);
    if (!pet) return head("未找到", "", true) + empty("没有这只宠物");
    var owner = PF.getCustomer(pet.customerId);
    var html = head(pet.name, "主人 " + owner.name, true);
    html += '<div class="card"><div class="row-card">' + PFUI.portrait(pet, 84) + '<div class="grow"><dl class="kv">' +
      "<dt>品种</dt><dd>" + E(pet.breed) + "</dd><dt>规格</dt><dd>" + E(PF.specLabel(pet)) + "</dd>" +
      "<dt>年龄</dt><dd>" + E(PF.ageText(pet)) + "</dd><dt>过敏</dt><dd>" + E(pet.allergies || "无") + "</dd>" +
      "<dt>备注</dt><dd>" + E(pet.groomingNotes || "无") + "</dd></dl></div></div></div>";
    PF.recordsFilter({ petId: pet.id }).forEach(function (r) { html += recordCard(r); });
    return html;
  }

  function bDashboard() {
    var d = PF.dashboard();
    var shop = PF.shop();
    var html = head(shop.name + "经营看板", PF.formatDate(d.today, true), null);
    html += '<div class="grid grid-4">' +
      '<div class="stat"><div class="num">' + d.todayCount + '</div><div class="lbl">今日预约</div></div>' +
      '<div class="stat"><div class="num">' + d.pendingCount + '</div><div class="lbl">待确认</div></div>' +
      '<div class="stat"><div class="num">' + d.inShopCount + '</div><div class="lbl">在店服务</div></div>' +
      '<div class="stat"><div class="num">' + PF.formatYuan(d.todayRevenueFen) + '</div><div class="lbl">今日已收款</div></div>' +
      '<div class="stat"><div class="num">' + d.boardingInCount + "/" + d.kennelTotal + '</div><div class="lbl">在住寄养 / 笼位</div></div>' +
      '<div class="stat"><div class="num">' + d.memberCount + '</div><div class="lbl">顾客数</div></div>' +
      '<div class="stat"><div class="num">' + d.petCount + '</div><div class="lbl">宠物档案</div></div>' +
      '<div class="stat"><div class="num">' + d.todayPaidCount + '</div><div class="lbl">今日核销笔数</div></div></div>';
    html += '<div class="section-title"><h2>待确认</h2>' + goBtn("#/b/appointments?tab=pending", "预约管理") + "</div>";
    if (!d.pending.length) html += empty("没有待确认预约");
    d.pending.forEach(function (a) { html += apptCard(a, "#/b/appointment/" + a.id); });
    html += '<div class="section-title"><h2>今日预约</h2></div>';
    d.todays.sort(function (a, b) { return a.start > b.start ? 1 : -1; }).forEach(function (a) { html += apptCard(a, "#/b/appointment/" + a.id); });
    return html;
  }

  function bAppointments(query) {
    query = query || {};
    var tab = query.tab || "upcoming";
    var html = head("预约管理", "全店预约与状态流转", null);
    html += '<div class="filter-tabs">' +
      goBtn("#/b/appointments?tab=upcoming", "即将到来", tab === "upcoming" ? "active" : "") +
      goBtn("#/b/appointments?tab=pending", "待确认", tab === "pending" ? "active" : "") +
      goBtn("#/b/appointments?tab=all", "全部", tab === "all" ? "active" : "") +
      "</div>";
    var t = PF.today();
    var list = PF.appointments().slice();
    if (tab === "pending") list = list.filter(function (a) { return a.status === "待确认"; });
    if (tab === "upcoming") list = list.filter(function (a) { return a.date >= t && ["待确认", "已确认", "已到店", "服务中"].indexOf(a.status) !== -1; });
    list.sort(function (a, b) { return (a.date + a.start) > (b.date + b.start) ? 1 : -1; });
    if (!list.length) html += empty("没有符合条件的预约");
    list.forEach(function (a) { html += apptCard(a, "#/b/appointment/" + a.id); });
    return html;
  }

  function bServices() {
    var html = head("服务项目", "含体型 / 毛量规格价", null);
    PF.services().forEach(function (s) {
      html += '<article class="card hoverable" data-action="go" data-href="#/b/service/' + s.id + '"><h3 style="margin:0 0 6px">' + E(s.name) + ' <span class="pill muted">' + s.durationMin + " 分钟</span></h3>" +
        '<p class="soft">' + E(s.desc) + "</p>" + priceTable(s) + "</article>";
    });
    return html;
  }

  function bService(id) {
    var s = PF.getService(id);
    if (!s) return head("未找到", "", true) + empty("项目不存在");
    return head(s.name, "规格价可在此查看（样品不提供复杂改价表单）", true) +
      '<div class="card"><p>' + E(s.desc) + "</p><p>时长 " + s.durationMin + " 分钟</p>" + priceTable(s) + "</div>";
  }

  function bStaff() {
    var html = head("员工与排班", "资料、出诊日与时段", null);
    PF.staff().forEach(function (s) {
      html += '<article class="card hoverable" data-action="go" data-href="#/b/staff/' + s.id + '"><div class="row-card">' +
        PFUI.initialsAvatar(s.name, s.color, 52) + '<div class="grow"><h3>' + E(s.name) + "</h3><p>" + E(s.title) + " · " +
        E(s.workDays.map(function (d) { return PF.WEEKDAYS[d]; }).join("、") + " " + s.workStart + "–" + s.workEnd) + "</p></div></div></article>";
    });
    return html;
  }

  function schedulePeek(me) {
    var html = '<div class="section-title"><h2>近 7 天预约</h2></div>';
    nextDays(7).forEach(function (d) {
      var aps = PF.appointments().filter(function (a) { return a.staffId === me.id && a.date === d && PF.LOCK_APPT.indexOf(a.status) !== -1; });
      html += '<div class="card"><strong>' + E(PF.formatDate(d, true)) + "</strong> " + (PF.staffWorksOn(me, d) ? "" : PFUI.pill("休息"));
      if (!aps.length) html += '<p class="muted">无占用</p>';
      aps.forEach(function (a) { html += "<p>" + a.start + "–" + a.end + " · " + E((PF.getPet(a.petId) || {}).name) + "</p>"; });
      html += "</div>";
    });
    return html;
  }

  function bStaffDetail(id) {
    var s = PF.getStaff(id);
    if (!s) return head("未找到", "", true) + empty("员工不存在");
    var html = head(s.name, s.title, true);
    html += '<div class="card"><p>' + E(s.bio) + "</p>" +
      '<form data-form="staff-schedule"><input type="hidden" name="staffId" value="' + s.id + '">' +
      '<div class="lbl tiny soft" style="margin-bottom:8px">工作日</div><div class="chips" style="margin-bottom:12px">';
    for (var d = 0; d < 7; d++) {
      html += '<label class="chip' + (s.workDays.indexOf(d) !== -1 ? " active" : "") + '"><input type="checkbox" name="workDays" value="' + d + '"' +
        (s.workDays.indexOf(d) !== -1 ? " checked" : "") + ' style="margin-right:6px">' + PF.WEEKDAYS[d] + "</label>";
    }
    html += '</div><div class="grid grid-2"><label class="field"><span class="lbl">开始</span><input type="time" name="workStart" value="' + s.workStart + '"></label>' +
      '<label class="field"><span class="lbl">结束</span><input type="time" name="workEnd" value="' + s.workEnd + '"></label></div>' +
      '<button class="btn btn-primary" type="submit">保存排班</button></form></div>';
    html += schedulePeek(s);
    return html;
  }

  function bStations() {
    var t = PF.today();
    var html = head("台位管理", "提交预约时占用台位锁；取消或逾期未到释放。不是把椅位改名。", null);
    PF.stations().forEach(function (st) {
      var occ = PF.appointments().filter(function (a) { return a.stationId === st.id && a.date === t && PF.LOCK_APPT.indexOf(a.status) !== -1; })
        .sort(function (a, b) { return a.start > b.start ? 1 : -1; });
      html += '<div class="card"><div class="row-card"><div class="avatar station">' + E(st.name.slice(0, 1)) + "</div>" +
        '<div class="grow"><h3>' + E(st.name) + (st.enabled ? "" : " " + PFUI.pill("停用")) + "</h3>" +
        "<p>" + E(st.subtitle) + " · 适用：" + E(st.species.join("、")) + " · " + E(st.sizes.map(PF.sizeLabel).join("/")) + "</p></div></div>";
      html += '<p class="tiny soft" style="margin-top:10px">今日占用</p>';
      if (!occ.length) html += '<p class="muted">今日空闲</p>';
      occ.forEach(function (a) {
        var p = PF.getPet(a.petId);
        html += "<p>" + E(a.start + "–" + a.end + " · " + (p ? p.name : "") + " · " + a.status) + "</p>";
      });
      html += "</div>";
    });
    return html;
  }

  function bKennels() {
    var html = head("笼位管理", "寄养按天占笼，与洗美时段锁分离", null);
    PF.kennels().forEach(function (k) {
      html += '<div class="card"><h3 style="margin:0 0 6px">' + E(k.name) + ' <span class="pill muted">' + E(k.type) + "</span></h3>" +
        "<p>" + E(k.species.join("、")) + " · " + PF.formatYuan(k.pricePerDayFen) + "/晚</p></div>";
    });
    html += kennelBoard();
    return html;
  }

  function bCustomers() {
    var html = head("顾客与宠物", "档案、预约与消费的入口", null);
    PF.customers().forEach(function (c) {
      var ps = PF.petsOf(c.id);
      html += '<article class="card hoverable" data-action="go" data-href="#/b/customer/' + c.id + '"><div class="row-card">' +
        PFUI.initialsAvatar(c.name, "#2D6A57", 44) + '<div class="grow"><h3>' + E(c.name) + "</h3><p>" +
        E(PF.maskPhone(c.phone)) + " · " + ps.length + " 只宠物（" + E(ps.map(function (p) { return p.name; }).join("、")) + "）</p></div></div></article>";
    });
    return html;
  }

  function bPet(id, query) {
    query = query || {};
    if (id === "new") return head("新增宠物档案", "必须关联到一位主人", true) + petForm(null, query.customer || "");
    var pet = PF.getPet(id);
    if (!pet) return head("未找到", "", true) + empty("没有这只宠物");
    var owner = PF.getCustomer(pet.customerId);
    var html = head(pet.name, "主人 " + owner.name, true);
    html += '<div class="card"><div class="row-card">' + PFUI.portrait(pet, 84) + '<div class="grow"><dl class="kv">' +
      "<dt>品种</dt><dd>" + E(pet.breed) + "</dd><dt>规格</dt><dd>" + E(PF.specLabel(pet)) + "</dd>" +
      "<dt>年龄</dt><dd>" + E(PF.ageText(pet)) + "</dd><dt>体重</dt><dd>" + E(pet.weightKg + " kg") + "</dd>" +
      "<dt>绝育</dt><dd>" + (pet.neutered ? "已绝育" : "未绝育") + "</dd><dt>过敏</dt><dd>" + E(pet.allergies || "无") + "</dd>" +
      "<dt>备注</dt><dd>" + E(pet.groomingNotes || "无") + "</dd></dl></div></div>" +
      '<div class="btn-row">' + goBtn("#/b/pet/" + pet.id + "/edit", "编辑档案", "btn btn-ghost") +
      goBtn("#/b/records?pet=" + pet.id, "宠物消费记录", "btn btn-ghost") + "</div></div>";
    return html;
  }

  function bCards() {
    var html = head("会员次卡", "发放、余次与去向", null);
    PF.cards().forEach(function (c) { html += cardCard(c); });
    html += '<div class="card"><h3 style="margin-top:0">为顾客发放次卡</h3><form data-form="buy-card">' +
      '<label class="field"><span class="lbl">顾客</span><select name="customerId">' +
      PF.customers().map(function (c) { return '<option value="' + c.id + '">' + E(c.name) + "</option>"; }).join("") +
      '</select></label><label class="field"><span class="lbl">项目</span><select name="serviceId">' +
      PF.services().map(function (s) { return '<option value="' + s.id + '">' + E(s.name) + "</option>"; }).join("") +
      '</select></label><label class="field"><span class="lbl">次数</span><select name="times"><option>5</option><option selected>10</option></select></label>' +
      '<button class="btn btn-primary" type="submit">发放</button></form></div>';
    return html;
  }

  function bHours() {
    var shop = PF.shop();
    return head("营业时间与规则", "确认方式可配置", null) +
      '<form class="card" data-form="shop-rules">' +
      '<label class="field"><span class="lbl">营业开始</span><input type="time" name="openTime" value="' + shop.openTime + '"></label>' +
      '<label class="field"><span class="lbl">营业结束</span><input type="time" name="closeTime" value="' + shop.closeTime + '"></label>' +
      '<label class="field"><span class="lbl">接单确认方式</span><select name="confirmMode">' +
      '<option value="staff_manual"' + (shop.confirmMode === "staff_manual" ? " selected" : "") + ">店员手动确认（默认）</option>" +
      '<option value="auto"' + (shop.confirmMode === "auto" ? " selected" : "") + ">提交后自动确认</option></select></label>" +
      '<p class="soft">预约状态机共用：待确认 → 已确认 → 已到店 → 服务中 → 已完成。待确认或已确认可取消；已确认可标逾期未到。取消与逾期未到都会释放员工锁和台位锁。</p>' +
      '<button class="btn btn-primary" type="submit">保存规则</button></form>';
  }

  function bShop() {
    var shop = PF.shop();
    return head("门店资料", "演示样品中的品牌设定，供审核", null) +
      '<div class="hero">' + PFUI.leafMark() + "<h1>" + E(shop.name) + '</h1><p class="brand-en">' + E(shop.nameEn) + '</p>' +
      '<p class="tagline">' + E(shop.tagline) + "</p></div>" +
      '<form class="card" data-form="shop-profile" style="margin-top:12px">' +
      '<label class="field"><span class="lbl">中文名</span><input name="name" value="' + E(shop.name) + '"></label>' +
      '<label class="field"><span class="lbl">英文副标题</span><input name="nameEn" value="' + E(shop.nameEn) + '"></label>' +
      '<label class="field"><span class="lbl">一句话</span><input name="tagline" value="' + E(shop.tagline) + '"></label>' +
      '<label class="field"><span class="lbl">地址</span><input name="address" value="' + E(shop.address) + '"></label>' +
      '<label class="field"><span class="lbl">电话</span><input name="phone" value="' + E(shop.phone) + '"></label>' +
      '<label class="field"><span class="lbl">介绍</span><textarea name="intro">' + E(shop.intro) + "</textarea></label>" +
      '<button class="btn btn-primary" type="submit">保存资料</button>' +
      '<p class="tiny muted">工作名仍为 PetFlow。绒所是 P2 提出的演示门店品牌，供总负责人审核，不是已冻结的正式商标。</p></form>';
  }

  function bRoles() {
    return head("身份与权限", "演示说明，非正式权限中心", null) +
      '<div class="card"><h3 style="margin-top:0">顾客</h3><p>浏览门店、管理自己的宠物档案、提交洗美预约与寄养、查看次卡和消费记录、取消自己的待确认/已确认预约或待入住寄养。不能确认预约、不能改状态为已完成、不能核销收款、不能写寄养日报或办理入住/离店。</p></div>' +
      '<div class="card"><h3 style="margin-top:0">店员</h3><p>查看今日预约、确认到核销、代客预约、查询顾客与宠物、寄养入住/日报/离店收款、查看自己的排班。不改门店规则与品牌资料。</p></div>' +
      '<div class="card"><h3 style="margin-top:0">老板</h3><p>经营看板、全店预约、项目规格、员工排班、台位与笼位、顾客档案、次卡发放、消费记录、营业规则（含确认方式）与门店资料。样品不提供多门店权限矩阵。</p></div>';
  }

  function bOpsHome() {
    var html = head("经营", "项目、人员、台位、笼位与记录", null);
    [["#/b/services", "服务项目与规格价"], ["#/b/staff", "员工资料与排班"], ["#/b/stations", "台位管理"],
     ["#/b/kennels", "笼位管理"], ["#/b/customers", "顾客与宠物档案"], ["#/b/cards", "会员次卡"], ["#/b/records", "消费记录"]]
      .forEach(function (it) {
        html += '<article class="card hoverable" data-action="go" data-href="' + it[0] + '"><h3 style="margin:0">' + it[1] + "</h3></article>";
      });
    return html;
  }

  function bSettingsHome() {
    var html = head("设置", "规则、资料与权限说明", null);
    [["#/b/hours", "营业时间与规则"], ["#/b/shop", "门店资料"], ["#/b/roles", "身份与权限"]].forEach(function (it) {
      html += '<article class="card hoverable" data-action="go" data-href="' + it[0] + '"><h3 style="margin:0">' + it[1] + "</h3></article>";
    });
    return html;
  }

  global.PFViews = {
    cHome: cHome,
    cServices: cServices,
    cService: cService,
    cStylists: cStylists,
    cStylist: cStylist,
    cPets: cPets,
    cPet: cPet,
    cPetEdit: cPetEdit,
    cBook: function (q) { return bookView("customer", q); },
    cBookResult: cBookResult,
    cAppointments: cAppointments,
    cAppointment: function (id) { return apptDetail(id, "customer"); },
    cBoardingList: cBoardingList,
    cBoardingNew: function (q) { return boardingForm("customer", q); },
    cBoarding: function (id) { return boardingDetail(id, "customer"); },
    cMember: cMember,
    cCards: cCards,
    cRecords: function (q) {
      return recordsPage({ customerId: PFStore.session().customerId, petId: q.pet || "", _role: "c" }, "消费记录", "可按宠物筛选");
    },
    cMe: cMe,
    sToday: sToday,
    sBook: function (q) { return bookView("staff", q); },
    sAppointment: function (id) { return apptDetail(id, "staff"); },
    sCustomers: sCustomers,
    sCustomer: function (id) { return customerDetail(id, "staff"); },
    sBoarding: sBoarding,
    sBoardingNew: function (q) { return boardingForm("staff", q); },
    sBoardingDetail: function (id) { return boardingDetail(id, "staff"); },
    sSchedule: sSchedule,
    sMe: sMe,
    sPet: sPet,
    sPetNew: function (q) { return sPet("new", q); },
    bDashboard: bDashboard,
    bAppointments: bAppointments,
    bAppointment: function (id) { return apptDetail(id, "boss"); },
    bServices: bServices,
    bService: bService,
    bStaff: bStaff,
    bStaffDetail: bStaffDetail,
    bStations: bStations,
    bKennels: bKennels,
    bCustomers: bCustomers,
    bCustomer: function (id) { return customerDetail(id, "boss"); },
    bPet: bPet,
    bPetEdit: function (id) {
      var pet = PF.getPet(id);
      if (!pet) return head("未找到", "", true) + empty("没有这只宠物");
      return head("编辑 " + pet.name, "", true) + petForm(pet, pet.customerId);
    },
    bPetNew: function (q) { return bPet("new", q); },
    bBook: function (q) { return bookView("boss", q); },
    bCards: bCards,
    bRecords: function (q) {
      var title = "消费记录";
      if (q.pet && PF.getPet(q.pet)) title = PF.getPet(q.pet).name + " 的消费记录";
      else if (q.customer && PF.getCustomer(q.customer)) title = PF.getCustomer(q.customer).name + " 的消费记录";
      return recordsPage({ customerId: q.customer || "", petId: q.pet || "", _role: "b", _back: !!(q.customer || q.pet) }, title, "按顾客或宠物查看核销记录");
    },
    bHours: bHours,
    bShop: bShop,
    bRoles: bRoles,
    bOpsHome: bOpsHome,
    bSettingsHome: bSettingsHome
  };
})(window);
