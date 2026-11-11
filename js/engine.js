/* Business rules for appointments, station/staff locks, day-based boarding, and pass cards. */
(function (global) {
  "use strict";

  var ACTIVE_APPT = ["待确认", "已确认", "已到店", "服务中"];
  var LOCK_APPT = ["待确认", "已确认", "已到店", "服务中"];
  var CANCELABLE = ["待确认", "已确认"];
  var ACTIVE_BOARDING = ["待入住", "已入住"];
  var SIZE_LABEL = { small: "小型", medium: "中型", large: "大型" };
  var COAT_LABEL = { short: "短毛", long: "长毛" };
  var WEEKDAYS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

  function state() { return PFStore.get(); }

  function byId(list, id) {
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  function shop() { return state().shop; }
  function staff() { return state().staff; }
  function stations() { return state().stations; }
  function kennels() { return state().kennels; }
  function services() { return state().services; }
  function customers() { return state().customers; }
  function pets() { return state().pets; }
  function appointments() { return state().appointments; }
  function boardings() { return state().boardings; }
  function cards() { return state().cards; }
  function consumptions() { return state().consumptions; }

  function getStaff(id) { return byId(staff(), id); }
  function getStation(id) { return byId(stations(), id); }
  function getKennel(id) { return byId(kennels(), id); }
  function getService(id) { return byId(services(), id); }
  function getCustomer(id) { return byId(customers(), id); }
  function getPet(id) { return byId(pets(), id); }
  function getAppt(id) { return byId(appointments(), id); }
  function getBoarding(id) { return byId(boardings(), id); }
  function getCard(id) { return byId(cards(), id); }

  function petsOf(customerId) {
    return pets().filter(function (p) { return p.customerId === customerId; });
  }

  function ownerOfPet(petId) {
    var p = getPet(petId);
    return p ? getCustomer(p.customerId) : null;
  }

  function now() { return PFData.nowInShanghai(); }
  function today() { return PFData.toYmd(now()); }

  function parseYmd(ymd) {
    var p = ymd.split("-");
    return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
  }

  function formatDate(ymd, withWeek) {
    if (!ymd) return "";
    var p = ymd.split("-");
    var text = Number(p[0]) + "年" + Number(p[1]) + "月" + Number(p[2]) + "日";
    if (withWeek) text += " " + WEEKDAYS[parseYmd(ymd).getDay()];
    return text;
  }

  function formatDateShort(ymd) {
    var p = ymd.split("-");
    return Number(p[1]) + "月" + Number(p[2]) + "日";
  }

  function toMin(hhmm) {
    var p = hhmm.split(":");
    return Number(p[0]) * 60 + Number(p[1]);
  }

  function fromMin(min) {
    var h = Math.floor(min / 60);
    var m = min % 60;
    return PFData.pad(h) + ":" + PFData.pad(m);
  }

  function overlapsTime(aStart, aEnd, bStart, bEnd) {
    return toMin(aStart) < toMin(bEnd) && toMin(aEnd) > toMin(bStart);
  }

  function daysBetween(start, end) {
    return Math.round((parseYmd(end) - parseYmd(start)) / 86400000);
  }

  function eachDate(start, endExclusive, fn) {
    var d = parseYmd(start);
    var end = parseYmd(endExclusive);
    while (d < end) {
      fn(PFData.toYmd(d));
      d.setDate(d.getDate() + 1);
    }
  }

  function occupiedDates(checkIn, checkOut) {
    var list = [];
    eachDate(checkIn, checkOut, function (ymd) { list.push(ymd); });
    return list;
  }

  function formatYuan(fen) {
    var n = Number(fen) || 0;
    var sign = n < 0 ? "-" : "";
    n = Math.abs(n);
    var yuan = Math.floor(n / 100);
    var cent = n % 100;
    return sign + "¥" + yuan + "." + PFData.pad(cent);
  }

  function formatYuanPlain(fen) {
    var n = Number(fen) || 0;
    return (n / 100).toFixed(2);
  }

  function specKey(pet) {
    return pet.size + "_" + pet.coat;
  }

  function specLabel(pet) {
    return SIZE_LABEL[pet.size] + " / " + COAT_LABEL[pet.coat];
  }

  function sizeLabel(size) { return SIZE_LABEL[size] || size; }
  function coatLabel(coat) { return COAT_LABEL[coat] || coat; }

  function servicePrice(service, pet) {
    if (!service || !pet) return 0;
    return service.prices[specKey(pet)] || 0;
  }

  function ageText(pet) {
    if (!pet.birthday) return "年龄未登记";
    var b = parseYmd(pet.birthday);
    var n = now();
    var months = (n.getFullYear() - b.getFullYear()) * 12 + (n.getMonth() - b.getMonth());
    if (n.getDate() < b.getDate()) months -= 1;
    if (months < 0) months = 0;
    if (months < 12) return months + " 个月";
    var y = Math.floor(months / 12);
    var m = months % 12;
    return m ? y + " 岁 " + m + " 个月" : y + " 岁";
  }

  function maskPhone(phone) {
    if (!phone) return "";
    var d = phone.replace(/\s/g, "");
    if (d.length >= 11) return d.slice(0, 3) + " " + d.slice(3, 7) + " " + d.slice(7);
    return phone;
  }

  function staffWorksOn(st, ymd) {
    if (!st) return false;
    return st.workDays.indexOf(parseYmd(ymd).getDay()) !== -1;
  }

  function isLockStatus(status) {
    return LOCK_APPT.indexOf(status) !== -1;
  }

  function apptOverlaps(appt, date, start, end) {
    return appt.date === date && isLockStatus(appt.status) && overlapsTime(appt.start, appt.end, start, end);
  }

  function staffConflict(staffId, date, start, end, excludeId) {
    var list = appointments();
    for (var i = 0; i < list.length; i++) {
      var a = list[i];
      if (excludeId && a.id === excludeId) continue;
      if (a.staffId !== staffId) continue;
      if (apptOverlaps(a, date, start, end)) return a;
    }
    return null;
  }

  function stationConflict(stationId, date, start, end, excludeId) {
    var list = appointments();
    for (var i = 0; i < list.length; i++) {
      var a = list[i];
      if (excludeId && a.id === excludeId) continue;
      if (a.stationId !== stationId) continue;
      if (apptOverlaps(a, date, start, end)) return a;
    }
    return null;
  }

  function stationFits(station, pet) {
    if (!station || !station.enabled) return false;
    if (station.species.indexOf(pet.species) === -1) return false;
    return station.sizes.indexOf(pet.size) !== -1;
  }

  function candidateStations(pet) {
    return stations().filter(function (s) { return stationFits(s, pet); });
  }

  function preferredStations(pet) {
    var list = candidateStations(pet).slice();
    list.sort(function (a, b) {
      var score = function (s) {
        if (pet.species === "猫" && s.id === "st_3") return 0;
        if (pet.size === "large" && s.id === "st_1") return 0;
        if (pet.size === "small" && s.id === "st_2") return 0;
        return 1;
      };
      return score(a) - score(b);
    });
    return list;
  }

  function findAvailableStation(pet, date, start, end, excludeId, preferredId) {
    var list = preferredStations(pet);
    if (preferredId) {
      list = list.slice().sort(function (a, b) {
        if (a.id === preferredId) return -1;
        if (b.id === preferredId) return 1;
        return 0;
      });
    }
    for (var i = 0; i < list.length; i++) {
      if (!stationConflict(list[i].id, date, start, end, excludeId)) return list[i];
    }
    return null;
  }

  function endTime(start, durationMin) {
    return fromMin(toMin(start) + durationMin);
  }

  function listSlots(staffId, pet, service, date, excludeId) {
    var st = getStaff(staffId);
    var svc = typeof service === "string" ? getService(service) : service;
    if (!st || !svc || !pet) return [];
    var result = [];
    if (!staffWorksOn(st, date)) {
      return [{ start: null, available: false, reason: st.name + " 当天休息" }];
    }
    var open = Math.max(toMin(shop().openTime), toMin(st.workStart));
    var close = Math.min(toMin(shop().closeTime), toMin(st.workEnd));
    var step = shop().slotMinutes || 30;
    for (var t = open; t + svc.durationMin <= close; t += step) {
      var start = fromMin(t);
      var end = fromMin(t + svc.durationMin);
      var sc = staffConflict(staffId, date, start, end, excludeId);
      var station = findAvailableStation(pet, date, start, end, excludeId);
      var item = { start: start, end: end, available: true, reason: "", stationId: station ? station.id : null };
      if (sc) {
        item.available = false;
        item.reason = st.name + " 该时段已有预约";
        item.stationId = null;
      } else if (!station) {
        item.available = false;
        item.reason = "该时段没有适合" + pet.name + "的空闲美容台位";
      }
      result.push(item);
    }
    return result;
  }

  function canRole(role, action) {
    if (role === "boss") return true;
    if (role === "staff") {
      return [
        "confirm", "cancel", "arrive", "start", "complete", "pay", "noshow",
        "proxy-book", "boarding-checkin", "boarding-report", "boarding-checkout",
        "boarding-cancel", "view-phone", "issue-card"
      ].indexOf(action) !== -1;
    }
    return ["book", "cancel-own", "boarding-book", "boarding-cancel-own", "buy-card", "edit-own-pet"].indexOf(action) !== -1;
  }

  function uid(prefix) {
    return prefix + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function nowStamp() {
    var d = now();
    return PFData.toYmd(d) + "T" + PFData.pad(d.getHours()) + ":" + PFData.pad(d.getMinutes()) + ":" + PFData.pad(d.getSeconds()) + "+08:00";
  }

  function createAppointment(payload) {
    var pet = getPet(payload.petId);
    var customerId = payload.customerId || (pet && pet.customerId);
    var customer = getCustomer(customerId);
    var service = getService(payload.serviceId);
    var st = getStaff(payload.staffId);
    if (!pet) return { ok: false, error: "请先选择宠物，再选择项目和时段。" };
    if (!customer) return { ok: false, error: "找不到对应的主人档案。" };
    if (!service) return { ok: false, error: "请选择洗护或美容项目。" };
    if (!st) return { ok: false, error: "请选择洗美师。" };
    if (!payload.date || !payload.start) return { ok: false, error: "请选择预约日期和时段。" };
    if (!staffWorksOn(st, payload.date)) return { ok: false, error: st.name + " 当天休息，请另选洗美师或日期。" };

    var end = endTime(payload.start, service.durationMin);
    if (toMin(end) > toMin(shop().closeTime)) return { ok: false, error: "该时段会超出营业时间。" };

    var staffHit = staffConflict(st.id, payload.date, payload.start, end, payload.excludeId);
    if (staffHit) {
      return {
        ok: false,
        error: "无法预约：" + st.name + " 在 " + formatDateShort(payload.date) + " " + payload.start + "–" + end + " 已有预约（" + (getPet(staffHit.petId) || {}).name + "），请另选洗美师或时段。",
        code: "STAFF_CONFLICT",
        conflict: staffHit
      };
    }

    var station = null;
    if (payload.stationId) {
      station = getStation(payload.stationId);
      if (!station || !stationFits(station, pet)) {
        return { ok: false, error: "所选美容台位不适合这只宠物的体型或物种。" };
      }
      var stHit = stationConflict(station.id, payload.date, payload.start, end, payload.excludeId);
      if (stHit) {
        return {
          ok: false,
          error: "无法预约：" + station.name + " 在 " + formatDateShort(payload.date) + " " + payload.start + "–" + end + " 已被占用（" + (getPet(stHit.petId) || {}).name + "），请另选时段或台位。",
          code: "STATION_CONFLICT",
          conflict: stHit
        };
      }
    } else {
      station = findAvailableStation(pet, payload.date, payload.start, end, payload.excludeId);
      if (!station) {
        return {
          ok: false,
          error: "无法预约：该时段没有适合 " + pet.name + "（" + pet.species + " · " + specLabel(pet) + "）的空闲美容台位。台位占用与员工排班是两套锁，不会只改名称。",
          code: "STATION_CONFLICT"
        };
      }
    }

    var status = shop().confirmMode === "auto" ? "已确认" : "待确认";
    var appt = {
      id: uid("apt"),
      shopId: shop().shopId,
      customerId: customer.id,
      petId: pet.id,
      serviceId: service.id,
      staffId: st.id,
      stationId: station.id,
      date: payload.date,
      start: payload.start,
      end: end,
      status: status,
      priceFen: servicePrice(service, pet),
      payStatus: "unpaid",
      payMethod: null,
      cardId: null,
      consumptionId: null,
      note: payload.note || "",
      createdAt: nowStamp()
    };
    if (status === "已确认") appt.confirmedAt = nowStamp();

    PFStore.update(function (s) { s.appointments.push(appt); });
    return { ok: true, appointment: getAppt(appt.id) };
  }

  function assertStaffAction(role, action) {
    if (!canRole(role, action)) return { ok: false, error: "当前角色无权执行该操作。顾客端只能查看、预约或取消自己的待确认/已确认预约。" };
    return { ok: true };
  }

  function cancelAppointment(id, role, asCustomerId) {
    var appt = getAppt(id);
    if (!appt) return { ok: false, error: "找不到预约。" };
    if (CANCELABLE.indexOf(appt.status) === -1) {
      return { ok: false, error: "仅「待确认」或「已确认」的预约可以取消。" };
    }
    if (role === "customer") {
      if (appt.customerId !== asCustomerId) return { ok: false, error: "只能取消自己的预约。" };
    } else if (!canRole(role, "cancel")) {
      return { ok: false, error: "当前角色无权取消预约。" };
    }
    PFStore.update(function (s) {
      var a = byId(s.appointments, id);
      a.status = "已取消";
      a.cancelledAt = nowStamp();
    });
    return { ok: true, appointment: getAppt(id), message: "预约已取消，洗美师时段与美容台位均已释放。" };
  }

  function markNoShow(id, role) {
    var gate = assertStaffAction(role, "noshow");
    if (!gate.ok) return gate;
    var appt = getAppt(id);
    if (!appt) return { ok: false, error: "找不到预约。" };
    if (appt.status !== "已确认") return { ok: false, error: "只有已确认且尚未到店的预约可以标记逾期未到。" };
    PFStore.update(function (s) {
      var a = byId(s.appointments, id);
      a.status = "逾期未到";
      a.noShowAt = nowStamp();
    });
    return { ok: true, appointment: getAppt(id), message: "已标记逾期未到，洗美师时段与美容台位均已释放。" };
  }

  function transitionAppointment(id, toStatus, role) {
    var map = { "已确认": "confirm", "已到店": "arrive", "服务中": "start" };
    var action = map[toStatus];
    if (!action) return { ok: false, error: "不支持的状态变更。" };
    var gate = assertStaffAction(role, action);
    if (!gate.ok) return gate;
    var appt = getAppt(id);
    if (!appt) return { ok: false, error: "找不到预约。" };
    var allowed = {
      "已确认": ["待确认"],
      "已到店": ["已确认"],
      "服务中": ["已到店"]
    };
    if (allowed[toStatus].indexOf(appt.status) === -1) {
      return { ok: false, error: "当前状态为「" + appt.status + "」，不能改为「" + toStatus + "」。" };
    }
    PFStore.update(function (s) {
      var a = byId(s.appointments, id);
      a.status = toStatus;
      if (toStatus === "已确认") a.confirmedAt = nowStamp();
      if (toStatus === "已到店") a.arrivedAt = nowStamp();
      if (toStatus === "服务中") a.startedAt = nowStamp();
    });
    return { ok: true, appointment: getAppt(id) };
  }

  function eligibleCards(customerId, serviceId) {
    return cards().filter(function (c) {
      return c.customerId === customerId && c.serviceId === serviceId && c.status === "有效" && c.remainingTimes > 0;
    });
  }

  function completeAndPay(id, payload, role) {
    var gate = assertStaffAction(role, "pay");
    if (!gate.ok) return gate;
    var appt = getAppt(id);
    if (!appt) return { ok: false, error: "找不到预约。" };
    if (appt.payStatus === "paid" || appt.consumptionId) {
      return { ok: false, error: "这一笔已经核销过，不能重复核销。", code: "DUPLICATE_REDEEM" };
    }
    if (appt.status !== "服务中") return { ok: false, error: "请先将预约推进到「服务中」，再完成并核销。" };
    var method = payload && payload.method;
    if (method !== "cash" && method !== "wechat_sim" && method !== "card") {
      return { ok: false, error: "请选择到店收款（现金/模拟微信）或次卡核销。" };
    }

    var card = null;
    var timesUsed = 0;
    if (method === "card") {
      card = getCard(payload.cardId);
      if (!card) return { ok: false, error: "请选择要核销的次卡。" };
      if (card.customerId !== appt.customerId) return { ok: false, error: "次卡不属于该顾客。" };
      if (card.serviceId !== appt.serviceId) return { ok: false, error: "次卡项目与本次服务不一致，不能核销。" };
      if (card.remainingTimes <= 0) {
        return { ok: false, error: "次卡余次不足，不能核销成负数。请改用到店收款，或先发放新卡。", code: "INSUFFICIENT_TIMES" };
      }
      timesUsed = 1;
    }

    var conId = uid("con");
    PFStore.update(function (s) {
      var a = byId(s.appointments, id);
      var svc = byId(s.services, a.serviceId);
      a.status = "已完成";
      a.completedAt = nowStamp();
      a.payStatus = "paid";
      a.payMethod = method;
      a.cardId = card ? card.id : null;
      a.consumptionId = conId;
      if (card) {
        var c = byId(s.cards, card.id);
        c.remainingTimes -= 1;
        if (c.remainingTimes <= 0) {
          c.remainingTimes = 0;
          c.status = "已用完";
        }
      }
      s.consumptions.push({
        id: conId,
        shopId: s.shop.shopId,
        customerId: a.customerId,
        petId: a.petId,
        type: "grooming",
        relatedId: a.id,
        title: svc ? svc.name : "洗护美容",
        amountFen: method === "card" ? 0 : a.priceFen,
        listFen: a.priceFen,
        method: method,
        cardId: card ? card.id : null,
        timesUsed: timesUsed,
        createdAt: nowStamp()
      });
    });
    return { ok: true, appointment: getAppt(id), consumption: byId(consumptions(), conId) };
  }

  function kennelConflict(kennelId, checkIn, checkOut, excludeId) {
    var list = boardings();
    var hits = [];
    for (var i = 0; i < list.length; i++) {
      var b = list[i];
      if (excludeId && b.id === excludeId) continue;
      if (b.kennelId !== kennelId) continue;
      if (ACTIVE_BOARDING.indexOf(b.status) === -1) continue;
      if (b.checkInDate < checkOut && b.checkOutDate > checkIn) hits.push(b);
    }
    return hits;
  }

  function nightsOf(checkIn, checkOut) {
    var n = daysBetween(checkIn, checkOut);
    return n;
  }

  function createBoarding(payload) {
    var pet = getPet(payload.petId);
    var customer = getCustomer(payload.customerId || (pet && pet.customerId));
    var kennel = getKennel(payload.kennelId);
    if (!pet) return { ok: false, error: "请先选择要寄养的宠物。" };
    if (!customer) return { ok: false, error: "找不到主人档案。" };
    if (!kennel || !kennel.enabled) return { ok: false, error: "请选择房型 / 笼位。" };
    if (kennel.species.indexOf(pet.species) === -1) {
      return { ok: false, error: kennel.name + " 不接收" + pet.species + "。" };
    }
    if (!payload.checkInDate || !payload.checkOutDate) return { ok: false, error: "请选择入住和离店日期。" };
    if (payload.checkOutDate <= payload.checkInDate) return { ok: false, error: "离店日期必须晚于入住日期。寄养按天占笼，至少入住 1 晚。" };
    var nights = nightsOf(payload.checkInDate, payload.checkOutDate);
    var hits = kennelConflict(kennel.id, payload.checkInDate, payload.checkOutDate);
    if (hits.length) {
      var h = hits[0];
      var hp = getPet(h.petId);
      return {
        ok: false,
        code: "KENNEL_CONFLICT",
        error: "无法预订：" + kennel.name + " 在 " + formatDateShort(h.checkInDate) + " 至 " + formatDateShort(h.checkOutDate) + " 已由" + (hp ? hp.name : "其他宠物") + "占用（按天占笼，不含离店当天）。请改日期或换房型。"
      };
    }
    var rec = {
      id: uid("brd"),
      shopId: shop().shopId,
      customerId: customer.id,
      petId: pet.id,
      kennelId: kennel.id,
      checkInDate: payload.checkInDate,
      checkOutDate: payload.checkOutDate,
      status: "待入住",
      nights: nights,
      priceFen: kennel.pricePerDayFen * nights,
      payStatus: "unpaid",
      payMethod: null,
      consumptionId: null,
      note: payload.note || "",
      createdAt: nowStamp(),
      reports: []
    };
    PFStore.update(function (s) { s.boardings.push(rec); });
    return { ok: true, boarding: getBoarding(rec.id) };
  }

  function cancelBoarding(id, role, asCustomerId) {
    var b = getBoarding(id);
    if (!b) return { ok: false, error: "找不到寄养单。" };
    if (b.status !== "待入住") return { ok: false, error: "仅待入住的寄养单可以取消，取消后按天占用的笼位日期会释放。" };
    if (role === "customer") {
      if (b.customerId !== asCustomerId) return { ok: false, error: "只能取消自己的寄养单。" };
    } else if (!canRole(role, "boarding-cancel")) {
      return { ok: false, error: "当前角色无权取消寄养单。" };
    }
    PFStore.update(function (s) {
      var x = byId(s.boardings, id);
      x.status = "已取消";
      x.cancelledAt = nowStamp();
    });
    return { ok: true, boarding: getBoarding(id), message: "寄养单已取消，笼位日期已释放。" };
  }

  function checkInBoarding(id, role) {
    var gate = assertStaffAction(role, "boarding-checkin");
    if (!gate.ok) return gate;
    var b = getBoarding(id);
    if (!b) return { ok: false, error: "找不到寄养单。" };
    if (b.status !== "待入住") return { ok: false, error: "只有待入住的寄养单可以办理入住。" };
    PFStore.update(function (s) {
      var x = byId(s.boardings, id);
      x.status = "已入住";
      x.checkedInAt = nowStamp();
    });
    return { ok: true, boarding: getBoarding(id) };
  }

  function addBoardingReport(id, content, role, authorId) {
    var gate = assertStaffAction(role, "boarding-report");
    if (!gate.ok) return gate;
    var b = getBoarding(id);
    if (!b) return { ok: false, error: "找不到寄养单。" };
    if (b.status !== "已入住") return { ok: false, error: "只有已入住的寄养单可以写日报。" };
    var text = (content || "").trim();
    if (!text) return { ok: false, error: "请填写日报内容。" };
    var rec = { id: uid("rpt"), date: today(), authorId: authorId || state().session.staffId, content: text };
    PFStore.update(function (s) {
      byId(s.boardings, id).reports.push(rec);
    });
    return { ok: true, report: rec, boarding: getBoarding(id) };
  }

  function checkOutBoarding(id, payload, role) {
    var gate = assertStaffAction(role, "boarding-checkout");
    if (!gate.ok) return gate;
    var b = getBoarding(id);
    if (!b) return { ok: false, error: "找不到寄养单。" };
    if (b.status !== "已入住") return { ok: false, error: "只有已入住的寄养单可以办理离店。" };
    if (b.payStatus === "paid" || b.consumptionId) return { ok: false, error: "这一笔寄养已经收款核销，不能重复核销。" };
    var method = payload && payload.method;
    if (method !== "cash" && method !== "wechat_sim") {
      return { ok: false, error: "寄养离店请模拟到店收款（现金或模拟微信）。" };
    }
    var conId = uid("con");
    PFStore.update(function (s) {
      var x = byId(s.boardings, id);
      var kn = byId(s.kennels, x.kennelId);
      x.status = "已离店";
      x.checkedOutAt = nowStamp();
      x.payStatus = "paid";
      x.payMethod = method;
      x.consumptionId = conId;
      s.consumptions.push({
        id: conId,
        shopId: s.shop.shopId,
        customerId: x.customerId,
        petId: x.petId,
        type: "boarding",
        relatedId: x.id,
        title: "寄养 · " + (kn ? kn.name : "笼位") + " · " + x.nights + " 晚",
        amountFen: x.priceFen,
        listFen: x.priceFen,
        method: method,
        cardId: null,
        timesUsed: 0,
        createdAt: nowStamp()
      });
    });
    return { ok: true, boarding: getBoarding(id) };
  }

  function issueCard(payload, role) {
    if (!canRole(role, "issue-card") && !canRole(role, "buy-card")) {
      return { ok: false, error: "当前角色不能发放或购买次卡。" };
    }
    var customer = getCustomer(payload.customerId);
    var service = getService(payload.serviceId);
    var times = Number(payload.times) || 0;
    if (!customer) return { ok: false, error: "请选择顾客。" };
    if (!service) return { ok: false, error: "请选择次卡对应的项目。" };
    if (times < 1) return { ok: false, error: "次数至少为 1。" };
    var card = {
      id: uid("card"),
      shopId: shop().shopId,
      customerId: customer.id,
      name: service.name + " " + times + " 次卡",
      serviceId: service.id,
      totalTimes: times,
      remainingTimes: times,
      issuedAt: today(),
      expiresAt: PFData.addDaysYmd(today(), 365),
      status: "有效"
    };
    PFStore.update(function (s) { s.cards.push(card); });
    return { ok: true, card: getCard(card.id) };
  }

  function savePet(payload, role, asCustomerId) {
    if (role === "customer") {
      if (payload.id) {
        var existing = getPet(payload.id);
        if (!existing || existing.customerId !== asCustomerId) return { ok: false, error: "只能编辑自己的宠物档案。" };
      }
      payload.customerId = asCustomerId;
    }
    if (!payload.name || !payload.name.trim()) return { ok: false, error: "请填写宠物名字。" };
    if (!payload.customerId) return { ok: false, error: "宠物必须关联到主人。" };
    if (!getCustomer(payload.customerId)) return { ok: false, error: "找不到主人档案。" };
    var rec;
    if (payload.id && getPet(payload.id)) {
      PFStore.update(function (s) {
        var p = byId(s.pets, payload.id);
        p.name = payload.name.trim();
        p.species = payload.species || p.species;
        p.breed = payload.breed || "";
        p.birthday = payload.birthday || "";
        p.weightKg = Number(payload.weightKg) || 0;
        p.size = payload.size || p.size;
        p.coat = payload.coat || p.coat;
        p.neutered = !!payload.neutered;
        p.allergies = payload.allergies || "无";
        p.groomingNotes = payload.groomingNotes || "";
      });
      rec = getPet(payload.id);
    } else {
      rec = {
        id: uid("pet"),
        shopId: shop().shopId,
        customerId: payload.customerId,
        name: payload.name.trim(),
        species: payload.species || "狗",
        breed: payload.breed || "",
        birthday: payload.birthday || "",
        weightKg: Number(payload.weightKg) || 0,
        size: payload.size || "medium",
        coat: payload.coat || "short",
        neutered: !!payload.neutered,
        allergies: payload.allergies || "无",
        groomingNotes: payload.groomingNotes || "",
        accent: payload.species === "猫" ? "#7A847F" : "#2D6A57"
      };
      PFStore.update(function (s) { s.pets.push(rec); });
      rec = getPet(rec.id);
    }
    return { ok: true, pet: rec };
  }

  function updateShop(patch) {
    PFStore.update(function (s) {
      Object.keys(patch).forEach(function (k) { s.shop[k] = patch[k]; });
    });
    return { ok: true, shop: shop() };
  }

  function updateStaffSchedule(staffId, patch) {
    PFStore.update(function (s) {
      var st = byId(s.staff, staffId);
      if (!st) return;
      if (patch.workDays) st.workDays = patch.workDays.slice();
      if (patch.workStart) st.workStart = patch.workStart;
      if (patch.workEnd) st.workEnd = patch.workEnd;
      if (patch.title) st.title = patch.title;
      if (patch.bio) st.bio = patch.bio;
    });
    return { ok: true, staff: getStaff(staffId) };
  }

  function recordsFilter(opts) {
    return consumptions().filter(function (c) {
      if (opts.customerId && c.customerId !== opts.customerId) return false;
      if (opts.petId && c.petId !== opts.petId) return false;
      return true;
    }).slice().sort(function (a, b) { return a.createdAt < b.createdAt ? 1 : -1; });
  }

  function dashboard() {
    var t = today();
    var todays = appointments().filter(function (a) { return a.date === t && a.status !== "已取消"; });
    var pending = appointments().filter(function (a) { return a.status === "待确认"; });
    var inShop = appointments().filter(function (a) { return a.date === t && (a.status === "已到店" || a.status === "服务中"); });
    var todayPaid = consumptions().filter(function (c) { return c.createdAt && c.createdAt.slice(0, 10) === t; });
    var revenue = todayPaid.reduce(function (sum, c) { return sum + (c.amountFen || 0); }, 0);
    var stay = boardings().filter(function (b) { return b.status === "已入住"; });
    var kennelBusy = stay.length;
    return {
      today: t,
      todayCount: todays.length,
      pendingCount: pending.length,
      inShopCount: inShop.length,
      todayRevenueFen: revenue,
      todayPaidCount: todayPaid.length,
      boardingInCount: kennelBusy,
      kennelTotal: kennels().filter(function (k) { return k.enabled; }).length,
      memberCount: customers().length,
      petCount: pets().length,
      todays: todays,
      pending: pending
    };
  }

  function payMethodLabel(m) {
    if (m === "card") return "次卡核销";
    if (m === "cash") return "到店现金";
    if (m === "wechat_sim") return "到店模拟微信";
    return "未收款";
  }

  function statusTone(status) {
    var map = {
      "待确认": "warn",
      "已确认": "ok",
      "已到店": "ok",
      "服务中": "accent",
      "已完成": "muted",
      "已取消": "muted",
      "逾期未到": "danger",
      "待入住": "warn",
      "已入住": "ok",
      "已离店": "muted"
    };
    return map[status] || "muted";
  }

  global.PF = {
    ACTIVE_APPT: ACTIVE_APPT,
    LOCK_APPT: LOCK_APPT,
    SIZE_LABEL: SIZE_LABEL,
    COAT_LABEL: COAT_LABEL,
    WEEKDAYS: WEEKDAYS,
    byId: byId,
    shop: shop,
    staff: staff,
    stations: stations,
    kennels: kennels,
    services: services,
    customers: customers,
    pets: pets,
    appointments: appointments,
    boardings: boardings,
    cards: cards,
    consumptions: consumptions,
    getStaff: getStaff,
    getStation: getStation,
    getKennel: getKennel,
    getService: getService,
    getCustomer: getCustomer,
    getPet: getPet,
    getAppt: getAppt,
    getBoarding: getBoarding,
    getCard: getCard,
    petsOf: petsOf,
    ownerOfPet: ownerOfPet,
    today: today,
    now: now,
    formatDate: formatDate,
    formatDateShort: formatDateShort,
    formatYuan: formatYuan,
    formatYuanPlain: formatYuanPlain,
    specKey: specKey,
    specLabel: specLabel,
    sizeLabel: sizeLabel,
    coatLabel: coatLabel,
    servicePrice: servicePrice,
    ageText: ageText,
    maskPhone: maskPhone,
    staffWorksOn: staffWorksOn,
    staffConflict: staffConflict,
    stationConflict: stationConflict,
    candidateStations: candidateStations,
    findAvailableStation: findAvailableStation,
    listSlots: listSlots,
    endTime: endTime,
    canRole: canRole,
    createAppointment: createAppointment,
    cancelAppointment: cancelAppointment,
    markNoShow: markNoShow,
    transitionAppointment: transitionAppointment,
    completeAndPay: completeAndPay,
    eligibleCards: eligibleCards,
    occupiedDates: occupiedDates,
    nightsOf: nightsOf,
    kennelConflict: kennelConflict,
    createBoarding: createBoarding,
    cancelBoarding: cancelBoarding,
    checkInBoarding: checkInBoarding,
    addBoardingReport: addBoardingReport,
    checkOutBoarding: checkOutBoarding,
    issueCard: issueCard,
    savePet: savePet,
    updateShop: updateShop,
    updateStaffSchedule: updateStaffSchedule,
    recordsFilter: recordsFilter,
    dashboard: dashboard,
    payMethodLabel: payMethodLabel,
    statusTone: statusTone,
    daysBetween: daysBetween,
    toMin: toMin
  };
})(window);
