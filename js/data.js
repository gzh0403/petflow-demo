/* PetFlow P2 demo seed data. All records are fictional. shopId reserved for later multi-shop. */
(function (global) {
  "use strict";

  var SHOP_ID = "shop_rongsuo";
  var TZ = "Asia/Shanghai";

  function pad(n) {
    return n < 10 ? "0" + n : String(n);
  }

  function nowInShanghai() {
    return new Date(new Date().toLocaleString("en-US", { timeZone: TZ }));
  }

  function toYmd(d) {
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }

  function addDaysYmd(ymd, days) {
    var p = ymd.split("-");
    var d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
    d.setDate(d.getDate() + days);
    return toYmd(d);
  }

  function weekdayOf(ymd) {
    var p = ymd.split("-");
    return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2])).getDay();
  }

  function isoStamp(ymd, hm) {
    return ymd + "T" + hm + ":00+08:00";
  }

  function buildSeed() {
    var today = toYmd(nowInShanghai());
    var y1 = addDaysYmd(today, -1);
    var y2 = addDaysYmd(today, -2);
    var y7 = addDaysYmd(today, -7);
    var t1 = addDaysYmd(today, 1);
    var t2 = addDaysYmd(today, 2);
    var t3 = addDaysYmd(today, 3);

    return {
      shopId: SHOP_ID,
      shop: {
        shopId: SHOP_ID,
        name: "绒所",
        nameEn: "PET GROOMING & BOARDING",
        tagline: "慢一点，被好好对待",
        phone: "0571-0000-0188",
        address: "杭州市西湖区绒芽巷 18 号",
        addressNote: "演示地址，非真实门店",
        hoursText: "每日 09:00–19:00",
        openTime: "09:00",
        closeTime: "19:00",
        slotMinutes: 30,
        confirmMode: "staff_manual",
        intro:
          "绒所是一家开在社区里的宠物洗护小店。我们把台位、用具和等候都放慢一些，让狗狗和猫咪在熟悉的节奏里被洗护、造型；需要时，也可以在店里安静地寄养几天。",
        notices: [
          "预约须先选择宠物，价格按体型与毛量规格显示。",
          "默认先预约、到店收款，本样品不接入真实支付。",
          "新预约默认由店员手动确认；老板可在规则里改为自动确认。"
        ],
        payModes: ["到店收款（模拟）", "次卡核销（演示）"]
      },
      staff: [
        {
          id: "staff_lin",
          shopId: SHOP_ID,
          name: "林予安",
          title: "首席洗美师",
          species: ["狗"],
          bio: "十年洗护经验，擅长安抚紧张的大型犬，手法稳定。",
          phone: "13800001001",
          color: "#2D6A57",
          workDays: [1, 2, 3, 4, 5, 6],
          workStart: "09:00",
          workEnd: "18:00"
        },
        {
          id: "staff_zhou",
          shopId: SHOP_ID,
          name: "周澄",
          title: "造型美容师",
          species: ["狗"],
          bio: "专注比熊、贵宾与泰迪的造型修剪，线条干净。",
          phone: "13800001002",
          color: "#4F8A76",
          workDays: [2, 3, 4, 5, 6, 0],
          workStart: "10:00",
          workEnd: "19:00"
        },
        {
          id: "staff_xu",
          shopId: SHOP_ID,
          name: "许晚晚",
          title: "猫咪专科 / 寄养护理",
          species: ["猫", "狗"],
          bio: "对猫咪很有耐心，也负责寄养日报与夜间巡视。",
          phone: "13800001003",
          color: "#C4893F",
          workDays: [1, 2, 3, 4, 5],
          workStart: "09:00",
          workEnd: "18:00"
        }
      ],
      stations: [
        { id: "st_1", shopId: SHOP_ID, name: "1 号台", subtitle: "大型犬优先", sizes: ["large", "medium"], species: ["狗"], enabled: true },
        { id: "st_2", shopId: SHOP_ID, name: "2 号台", subtitle: "中小型犬", sizes: ["medium", "small"], species: ["狗"], enabled: true },
        { id: "st_3", shopId: SHOP_ID, name: "3 号台", subtitle: "猫咪专用", sizes: ["small", "medium"], species: ["猫"], enabled: true }
      ],
      kennels: [
        { id: "kn_a1", shopId: SHOP_ID, name: "A1 阳光标准间", type: "标准间", species: ["狗"], pricePerDayFen: 12800, enabled: true },
        { id: "kn_a2", shopId: SHOP_ID, name: "A2 阳光标准间", type: "标准间", species: ["狗"], pricePerDayFen: 12800, enabled: true },
        { id: "kn_b1", shopId: SHOP_ID, name: "B1 豪华套房", type: "豪华套房", species: ["狗"], pricePerDayFen: 19800, enabled: true },
        { id: "kn_c1", shopId: SHOP_ID, name: "C1 猫咪静屋", type: "猫咪房", species: ["猫"], pricePerDayFen: 14800, enabled: true }
      ],
      services: [
        {
          id: "svc_bath",
          shopId: SHOP_ID,
          name: "基础洗澡",
          category: "洗护",
          durationMin: 60,
          desc: "沐浴、吹干、基础梳毛与耳部清洁。适合日常清洁。",
          prices: { small_short: 8800, small_long: 10800, medium_short: 12800, medium_long: 14800, large_short: 16800, large_long: 19800 }
        },
        {
          id: "svc_care",
          shopId: SHOP_ID,
          name: "精致洗护",
          category: "洗护",
          durationMin: 90,
          desc: "在基础洗澡之上增加护毛SPA、开结梳理与脚底修整。",
          prices: { small_short: 12800, small_long: 15800, medium_short: 17800, medium_long: 20800, large_short: 23800, large_long: 27800 }
        },
        {
          id: "svc_style",
          shopId: SHOP_ID,
          name: "全身造型美容",
          category: "美容",
          durationMin: 150,
          desc: "洗护后按品种或约定造型修剪，含面部与身体造型。",
          prices: { small_short: 19800, small_long: 23800, medium_short: 26800, medium_long: 30800, large_short: 35800, large_long: 39800 }
        },
        {
          id: "svc_nail",
          shopId: SHOP_ID,
          name: "指甲与耳部护理",
          category: "护理",
          durationMin: 30,
          desc: "修剪指甲、打磨、耳道清洁。可单独预约或与洗护叠加说明。",
          prices: { small_short: 4800, small_long: 4800, medium_short: 5800, medium_long: 5800, large_short: 6800, large_long: 6800 }
        }
      ],
      customers: [
        { id: "cust_chen", shopId: SHOP_ID, name: "陈夏", phone: "13800002001", memberLevel: "绒所会员", joinedAt: "2025-04-12" },
        { id: "cust_wang", shopId: SHOP_ID, name: "王启明", phone: "13800002002", memberLevel: "绒所会员", joinedAt: "2025-08-03" },
        { id: "cust_zhao", shopId: SHOP_ID, name: "赵晓柠", phone: "13800002003", memberLevel: "绒所会员", joinedAt: "2026-01-19" },
        { id: "cust_li", shopId: SHOP_ID, name: "李晚棠", phone: "13800002004", memberLevel: "绒所会员", joinedAt: "2025-11-02" }
      ],
      pets: [
        {
          id: "pet_doudou",
          shopId: SHOP_ID,
          customerId: "cust_chen",
          name: "豆豆",
          species: "狗",
          breed: "金毛寻回犬",
          birthday: "2021-06-02",
          weightKg: 28.5,
          size: "large",
          coat: "long",
          neutered: true,
          allergies: "对某些谷物香波过敏，请用低敏配方",
          groomingNotes: "性格温顺，吹风时需要先给零食适应。",
          accent: "#C4893F"
        },
        {
          id: "pet_huasheng",
          shopId: SHOP_ID,
          customerId: "cust_chen",
          name: "花生",
          species: "狗",
          breed: "柯基",
          birthday: "2023-03-18",
          weightKg: 11.2,
          size: "small",
          coat: "short",
          neutered: true,
          allergies: "无",
          groomingNotes: "好动，剪指甲时需两人配合。",
          accent: "#D77A6E"
        },
        {
          id: "pet_tudou",
          shopId: SHOP_ID,
          customerId: "cust_wang",
          name: "土豆",
          species: "猫",
          breed: "英国短毛猫",
          birthday: "2022-11-09",
          weightKg: 5.4,
          size: "medium",
          coat: "short",
          neutered: true,
          allergies: "无",
          groomingNotes: "怕生，建议在猫咪专用台位操作，减少等候。",
          accent: "#7A847F"
        },
        {
          id: "pet_cotton",
          shopId: SHOP_ID,
          customerId: "cust_zhao",
          name: "棉花",
          species: "狗",
          breed: "比熊",
          birthday: "2024-01-26",
          weightKg: 4.8,
          size: "small",
          coat: "long",
          neutered: false,
          allergies: "无",
          groomingNotes: "主人偏好圆脸造型，耳部周围请修短。",
          accent: "#E8DFD0"
        },
        {
          id: "pet_aleng",
          shopId: SHOP_ID,
          customerId: "cust_li",
          name: "阿楞",
          species: "狗",
          breed: "边境牧羊犬",
          birthday: "2020-09-14",
          weightKg: 18.6,
          size: "medium",
          coat: "long",
          neutered: true,
          allergies: "无",
          groomingNotes: "聪明但容易焦虑，寄养时需要每天散步记录。",
          accent: "#2D6A57"
        }
      ],
      appointments: [
        {
          id: "apt_y2_done",
          shopId: SHOP_ID,
          customerId: "cust_chen",
          petId: "pet_huasheng",
          serviceId: "svc_bath",
          staffId: "staff_zhou",
          stationId: "st_2",
          date: y2,
          start: "11:00",
          end: "12:00",
          status: "已完成",
          priceFen: 8800,
          payStatus: "paid",
          payMethod: "card",
          cardId: "card_chen_bath",
          consumptionId: "con_y2_huasheng",
          note: "",
          createdAt: isoStamp(y2, "09:12"),
          confirmedAt: isoStamp(y2, "09:20"),
          arrivedAt: isoStamp(y2, "10:55"),
          startedAt: isoStamp(y2, "11:00"),
          completedAt: isoStamp(y2, "12:04")
        },
        {
          id: "apt_y1_done",
          shopId: SHOP_ID,
          customerId: "cust_zhao",
          petId: "pet_cotton",
          serviceId: "svc_style",
          staffId: "staff_zhou",
          stationId: "st_2",
          date: y1,
          start: "14:00",
          end: "16:30",
          status: "已完成",
          priceFen: 23800,
          payStatus: "paid",
          payMethod: "cash",
          cardId: null,
          consumptionId: "con_y1_cotton",
          note: "圆脸造型",
          createdAt: isoStamp(addDaysYmd(y1, -1), "16:02"),
          confirmedAt: isoStamp(addDaysYmd(y1, -1), "16:08"),
          arrivedAt: isoStamp(y1, "13:50"),
          startedAt: isoStamp(y1, "14:00"),
          completedAt: isoStamp(y1, "16:28")
        },
        {
          id: "apt_today_doudou",
          shopId: SHOP_ID,
          customerId: "cust_chen",
          petId: "pet_doudou",
          serviceId: "svc_care",
          staffId: "staff_lin",
          stationId: "st_1",
          date: today,
          start: "10:00",
          end: "11:30",
          status: "已确认",
          priceFen: 27800,
          payStatus: "unpaid",
          payMethod: null,
          cardId: null,
          consumptionId: null,
          note: "",
          createdAt: isoStamp(y1, "18:20"),
          confirmedAt: isoStamp(y1, "18:26")
        },
        {
          id: "apt_today_cotton",
          shopId: SHOP_ID,
          customerId: "cust_zhao",
          petId: "pet_cotton",
          serviceId: "svc_bath",
          staffId: "staff_zhou",
          stationId: "st_2",
          date: today,
          start: "10:30",
          end: "11:30",
          status: "待确认",
          priceFen: 10800,
          payStatus: "unpaid",
          payMethod: null,
          cardId: null,
          consumptionId: null,
          note: "",
          createdAt: isoStamp(today, "08:16")
        },
        {
          id: "apt_today_tudou",
          shopId: SHOP_ID,
          customerId: "cust_wang",
          petId: "pet_tudou",
          serviceId: "svc_bath",
          staffId: "staff_xu",
          stationId: "st_3",
          date: today,
          start: "14:00",
          end: "15:00",
          status: "服务中",
          priceFen: 12800,
          payStatus: "unpaid",
          payMethod: null,
          cardId: null,
          consumptionId: null,
          note: "",
          createdAt: isoStamp(y1, "11:40"),
          confirmedAt: isoStamp(y1, "11:44"),
          arrivedAt: isoStamp(today, "13:50"),
          startedAt: isoStamp(today, "14:02")
        },
        {
          id: "apt_t1_aleng",
          shopId: SHOP_ID,
          customerId: "cust_li",
          petId: "pet_aleng",
          serviceId: "svc_care",
          staffId: "staff_lin",
          stationId: "st_1",
          date: t1,
          start: "13:00",
          end: "14:30",
          status: "已确认",
          priceFen: 20800,
          payStatus: "unpaid",
          payMethod: null,
          cardId: null,
          consumptionId: null,
          note: "寄养结束后顺便洗护",
          createdAt: isoStamp(y2, "15:01"),
          confirmedAt: isoStamp(y2, "15:10")
        }
      ],
      boardings: [
        {
          id: "brd_aleng",
          shopId: SHOP_ID,
          customerId: "cust_li",
          petId: "pet_aleng",
          kennelId: "kn_b1",
          checkInDate: y1,
          checkOutDate: t2,
          status: "已入住",
          priceFen: 19800 * 3,
          nights: 3,
          payStatus: "unpaid",
          payMethod: null,
          consumptionId: null,
          note: "需要每天户外活动记录",
          createdAt: isoStamp(y2, "15:01"),
          checkedInAt: isoStamp(y1, "09:30"),
          reports: [
            {
              id: "rpt_aleng_y1",
              date: y1,
              authorId: "staff_xu",
              content: "阿楞下午在室内活动场跑了两圈，食欲正常，晚上入睡前较安稳。已按嘱添加晚饭后散步。"
            }
          ]
        },
        {
          id: "brd_tudou_upcoming",
          shopId: SHOP_ID,
          customerId: "cust_wang",
          petId: "pet_tudou",
          kennelId: "kn_c1",
          checkInDate: t3,
          checkOutDate: addDaysYmd(t3, 2),
          status: "待入住",
          priceFen: 14800 * 2,
          nights: 2,
          payStatus: "unpaid",
          payMethod: null,
          consumptionId: null,
          note: "静音房，减少与犬只接触",
          createdAt: isoStamp(today, "09:40"),
          reports: []
        }
      ],
      cards: [
        {
          id: "card_chen_bath",
          shopId: SHOP_ID,
          customerId: "cust_chen",
          name: "基础洗澡 10 次卡",
          serviceId: "svc_bath",
          totalTimes: 10,
          remainingTimes: 6,
          issuedAt: y7,
          expiresAt: addDaysYmd(y7, 365),
          status: "有效"
        },
        {
          id: "card_zhao_care",
          shopId: SHOP_ID,
          customerId: "cust_zhao",
          name: "精致洗护 5 次卡",
          serviceId: "svc_care",
          totalTimes: 5,
          remainingTimes: 1,
          issuedAt: addDaysYmd(today, -40),
          expiresAt: addDaysYmd(today, 325),
          status: "有效"
        },
        {
          id: "card_wang_bath",
          shopId: SHOP_ID,
          customerId: "cust_wang",
          name: "基础洗澡 5 次卡",
          serviceId: "svc_bath",
          totalTimes: 5,
          remainingTimes: 0,
          issuedAt: addDaysYmd(today, -80),
          expiresAt: addDaysYmd(today, 285),
          status: "已用完"
        }
      ],
      consumptions: [
        {
          id: "con_y2_huasheng",
          shopId: SHOP_ID,
          customerId: "cust_chen",
          petId: "pet_huasheng",
          type: "grooming",
          relatedId: "apt_y2_done",
          title: "基础洗澡",
          amountFen: 8800,
          method: "card",
          cardId: "card_chen_bath",
          timesUsed: 1,
          createdAt: isoStamp(y2, "12:04")
        },
        {
          id: "con_y1_cotton",
          shopId: SHOP_ID,
          customerId: "cust_zhao",
          petId: "pet_cotton",
          type: "grooming",
          relatedId: "apt_y1_done",
          title: "全身造型美容",
          amountFen: 23800,
          method: "cash",
          cardId: null,
          timesUsed: 0,
          createdAt: isoStamp(y1, "16:28")
        }
      ],
      boss: { id: "boss_su", name: "苏宁枝", title: "店长" },
      session: {
        role: "customer",
        customerId: "cust_chen",
        staffId: "staff_lin",
        bossId: "boss_su"
      }
    };
  }

  global.PFData = {
    SHOP_ID: SHOP_ID,
    TZ: TZ,
    SEED_VERSION: "petflow-demo-v1",
    pad: pad,
    nowInShanghai: nowInShanghai,
    toYmd: toYmd,
    addDaysYmd: addDaysYmd,
    weekdayOf: weekdayOf,
    isoStamp: isoStamp,
    buildSeed: buildSeed
  };
})(window);
