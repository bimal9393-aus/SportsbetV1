const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');

/**
 * TODO: implement JSON loading + validation to keep baseUrl + future fields centralized.
 */
class TestDataLoader {
  static cache;
  static dataPath = resolve(process.cwd(), 'TestData.json');

  /** Reads TestData.json once, caches it, and enforces a minimal schema (baseUrl today). */
  static load() {
    if (!this.cache) {
      // TODO: extend validation when schema grows (e.g., env toggles, credentials, etc.).
      const raw = readFileSync(this.dataPath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (!parsed.baseUrl) {
        throw new Error('TestData.json missing required field: baseUrl');
      }
      this.cache = { baseUrl: parsed.baseUrl };
    }
    return this.cache;
  }
}

module.exports = { TestDataLoader };
