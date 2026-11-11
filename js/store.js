/* Local persistence for the PetFlow demo. Refresh keeps data; reset restores seed. */
(function (global) {
  "use strict";

  var KEY = "petflow-demo-v1";
  var listeners = [];

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function loadRaw() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (!parsed || parsed.version !== PFData.SEED_VERSION || !parsed.data) return null;
      return parsed;
    } catch (e) {
      return null;
    }
  }

  function persist(state) {
    var packed = {
      version: PFData.SEED_VERSION,
      savedAt: new Date().toISOString(),
      data: state
    };
    localStorage.setItem(KEY, JSON.stringify(packed));
  }

  var state = null;

  function init() {
    var saved = loadRaw();
    state = saved ? saved.data : PFData.buildSeed();
    if (!saved) persist(state);
    return state;
  }

  function get() {
    if (!state) init();
    return state;
  }

  function set(next) {
    state = next;
    persist(state);
    listeners.forEach(function (fn) {
      try { fn(state); } catch (e) { console.error(e); }
    });
  }

  function update(mutator) {
    var next = clone(get());
    mutator(next);
    set(next);
    return next;
  }

  function reset() {
    var role = state && state.session ? state.session.role : "customer";
    var customerId = state && state.session ? state.session.customerId : "cust_chen";
    var staffId = state && state.session ? state.session.staffId : "staff_lin";
    var fresh = PFData.buildSeed();
    fresh.session.role = role;
    fresh.session.customerId = customerId;
    fresh.session.staffId = staffId;
    set(fresh);
    return fresh;
  }

  function subscribe(fn) {
    listeners.push(fn);
    return function () {
      listeners = listeners.filter(function (x) { return x !== fn; });
    };
  }

  function session() {
    return get().session;
  }

  global.PFStore = {
    KEY: KEY,
    clone: clone,
    init: init,
    get: get,
    set: set,
    update: update,
    reset: reset,
    subscribe: subscribe,
    session: session
  };
})(window);
