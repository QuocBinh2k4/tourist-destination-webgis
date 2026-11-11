const test = require("node:test");
const assert = require("node:assert/strict");
const { categories, records, checkedAt } = require("../../database/data/diSanVietNam");

test("Heritage records have unique identifiers, a known category and source", () => {
  const codes = new Set(categories.map(category => category.ma));
  assert.equal(codes.size, 5);
  assert.equal(new Set(records.map(record => record.ma)).size, records.length);
  assert.equal(records.length, 30);
  for (const record of records) {
    assert.ok(codes.has(record.category));
    assert.ok(record.ten && record.phan_loai);
    assert.equal(new URL(record.nguon_url).protocol, "https:");
  }
  assert.match(checkedAt, /^\d{4}-\d{2}-\d{2}$/);
});

test("Only verified geographic sites have map coordinates", () => {
  const mapped = records.filter(record => record.coordinates);
  assert.equal(mapped.length, 6);
  for (const record of mapped) {
    const [lon, lat] = record.coordinates;
    assert.ok(lon > 102 && lon < 110 && lat > 8 && lat < 24);
    assert.equal(new URL(record.coordinateSource).hostname, "whc.unesco.org");
    assert.ok(record.ghi_chu_toa_do.includes("không phải"));
  }
  assert.ok(records.filter(record => record.category === "PHI_VAT_THE").every(record => !record.coordinates));
  const hue = records.find(record => record.ma === "DS_HUE");
  assert.ok(Math.abs(hue.coordinates[0] - 107.5777778) < 0.000001);
  assert.ok(Math.abs(hue.coordinates[1] - 16.4694444) < 0.000001);
});
