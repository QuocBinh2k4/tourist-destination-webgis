const test = require("node:test");
const assert = require("node:assert/strict");
const { destinations, services, checkedAt } = require("../../database/data/northernTourism");

test("Northern tourism seed has unique, sourced records", () => {
  assert.equal(destinations.length, 24);
  assert.equal(services.length, 18);
  const all = [...destinations, ...services];
  assert.equal(new Set(all.map(item => item.ma)).size, all.length);
  assert.equal(new Set(all.map(item => item.ten.toLocaleLowerCase("vi"))).size, all.length);
  for (const item of all) {
    assert.match(item.ma, /^MB_D[LV]_/);
    assert.ok(item.ten && item.dia_chi);
    assert.ok(item.longitude >= 102 && item.longitude <= 110);
    assert.ok(item.latitude >= 8 && item.latitude <= 24);
    assert.equal(new URL(item.source).hostname, "www.openstreetmap.org");
  }
  assert.match(checkedAt, /^\d{4}-\d{2}-\d{2}$/);
});

test("Destinations and services use supported classifications", () => {
  const categories = new Set(["VH", "LS", "ST", "DI_TICH", "PHI_VAT_THE", "BAO_VAT", "BAO_TANG", "TU_LIEU"]);
  const types = new Set(["AN_UONG", "LUU_TRU", "Y_TE", "DO_XE", "HD_VUI_CHOi", "VAN_CHUYEN"]);
  for (const item of destinations) {
    assert.ok(item.categories.length > 0);
    assert.ok(item.categories.every(code => categories.has(code)));
  }
  for (const item of services) {
    assert.ok(item.types.length > 0);
    assert.ok(item.types.every(code => types.has(code)));
  }
  assert.ok(services.some(item => item.types.includes("LUU_TRU")));
  assert.ok(services.some(item => item.types.includes("Y_TE")));
  assert.ok(services.some(item => item.types.includes("VAN_CHUYEN")));
});
