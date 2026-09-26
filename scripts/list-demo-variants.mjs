import { readFile, writeFile } from "node:fs/promises";
import { listVariants } from "../assets/js/demo-model.mjs";

const config = JSON.parse(await readFile(new URL("../assets/data/interactive-demo.json", import.meta.url)));
const quote = value => `"${String(value).replaceAll('"', '""')}"`;
const rows = [["scene", "variant_key", "instruction", "suggested_video_path"]];
for (const scene of config.scenes) {
  for (const variant of listVariants(scene, config.controls)) {
    rows.push([scene.id, variant.key, variant.instruction, `assets/videos/interactive/${scene.id}/${variant.key.replaceAll(":", "-")}.mp4`]);
  }
}
const csv = rows.map(row => row.map(quote).join(",")).join("\n") + "\n";
if (process.argv[2]) {
  await writeFile(process.argv[2], csv, "utf8");
  console.log(`Wrote ${rows.length - 1} video entries to ${process.argv[2]}`);
} else process.stdout.write(csv);
