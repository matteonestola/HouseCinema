// Rigenera background_img/manifest.json con le immagini presenti nella cartella.
// Stesso risultato del passo "Genera l'elenco delle copertine" del workflow di deploy.
const fs = require("fs");
const path = require("path");

const dir = path.resolve(__dirname, "../../../../background_img");
fs.mkdirSync(dir, { recursive: true });
const names = fs
  .readdirSync(dir)
  .filter((n) => /\.(jpe?g|png|webp|avif|gif)$/i.test(n))
  .sort((a, b) => a.localeCompare(b));
fs.writeFileSync(path.join(dir, "manifest.json"), JSON.stringify(names) + "\n");
console.log(`MANIFEST: ${names.length} immagini${names.length ? " (" + names.join(", ") + ")" : ""}`);
