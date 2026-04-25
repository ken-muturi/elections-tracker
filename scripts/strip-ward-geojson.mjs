/**
 * Strips the 66MB ward.results.geojson down to boundaries-only (~3MB).
 * Keeps only the geometry and the NAME property.
 *
 * Usage:
 *   node scripts/strip-ward-geojson.mjs \
 *     /path/to/ward.results.geojson \
 *     public/geodata/ke_wards.geojson
 */
import { createReadStream, createWriteStream } from "fs";
import { argv } from "process";

const [, , input, output] = argv;
if (!input || !output) {
  console.error("Usage: node strip-ward-geojson.mjs <input.geojson> <output.geojson>");
  process.exit(1);
}

let raw = "";
const stream = createReadStream(input, "utf8");
for await (const chunk of stream) raw += chunk;

const fc = JSON.parse(raw);
const stripped = {
  type: "FeatureCollection",
  features: fc.features.map((f) => ({
    type: "Feature",
    properties: {
      NAME: f.properties.NAME ?? f.properties.WARD_NAME ?? f.properties.Ward ?? "",
    },
    geometry: f.geometry,
  })),
};

createWriteStream(output).write(JSON.stringify(stripped));
console.log(`Done — ${stripped.features.length} wards → ${output}`);
