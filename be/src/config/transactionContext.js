const { AsyncLocalStorage } = require("node:async_hooks");

// Sequelize v6 CLS contract, backed by Node's built-in AsyncLocalStorage.
// Managed transactions propagate to legacy catalog queries without a new dependency.
const storage = new AsyncLocalStorage();
module.exports = {
  run(callback) { return storage.run(new Map(storage.getStore()), callback); },
  bind(callback) {
    const context = storage.getStore();
    return (...args) => storage.run(context || new Map(), () => callback(...args));
  },
  get(key) { return storage.getStore()?.get(key); },
  set(key, value) { storage.getStore()?.set(key, value); return value; },
};
