import { prettyBytes } from "https://deno.land/x/pretty_bytes@v2.0.0/mod.ts";
import ProgressBar from "https://deno.land/x/progress@v1.3.9/mod.ts";
import { readZip } from "https://deno.land/x/jszip@0.11.0/mod.ts";
import { join } from "https://deno.land/std@0.201.0/path/mod.ts";
import { DLWP } from "https://deno.land/x/dlwp@v0.2.2/mod.ts";

const xboxPath = join("C:", "XboxGames", "Starfield", "Content");
const currentUserName = Deno.env.get("USERPROFILE")?.split("\\").at(-1)!;
const starfiledPath = join(
  "C:",
  "Users",
  currentUserName,
  "Documents",
  "My Games"
);

const cwd = Deno.cwd();

const dlwp = new DLWP();

const files = [
  {
    name: "mods.zip",
    url: "https://github.com/buttercubz/starfield/releases/download/v1.0.0/mods.zip",
    move: xboxPath,
    zip: true,
  },
  {
    name: "dxgi.dll",
    url: "https://github.com/buttercubz/starfield/releases/download/v1.0.0/dxgi.dll",
    move: xboxPath,
    zip: false,
  },
  {
    name: "Starfield.zip",
    url: "https://github.com/buttercubz/starfield/releases/download/v1.0.0/Starfield.zip",
    move: starfiledPath,
    zip: true,
  },
];

function calculatePercentage(part: number, whole: number) {
  return Math.round((part / whole) * 100);
}

async function DownloadMod(url: string, path: string = "./downloads") {
  const progress = new ProgressBar({
    total: 100,
    complete: "=",
    incomplete: "-",
  });

  const name = url.split("/").at(-1);

  console.log(`\nstart download ${name} \n`);

  function run() {
    const complete = calculatePercentage(
      dlwp.status.currentProgress,
      dlwp.status.totalLength as number
    );

    progress.render(complete, {
      title: name,
      text: `${prettyBytes(dlwp.status.currentProgress)} of ${[
        prettyBytes(dlwp.status.totalLength as number),
      ]}`,
    });
  }

  await dlwp.download(url, {
    delay: 1,
    onProgress: run,
    dir: path,
  });
}

async function unzip(name: string, path: string) {
  const zip = await readZip(join(cwd, "downloads", name));

  for (const chunk of zip) {
    if (chunk.dir) {
      await Deno.mkdir(join(path, chunk.name), { recursive: true });
    } else {
      const file = await zip.file(chunk.name).async("uint8array");
      await Deno.writeFile(join(path, chunk.name), file, { create: true });
    }
  }
}

async function main() {
  try {
    await Deno.mkdir("./downloads", { recursive: true });

    for (const file of files) {
      if (file.zip) {
        await DownloadMod(file.url);
        unzip(file.name, file.move);
      } else {
        await DownloadMod(file.url, file.move);
      }
    }

    await Deno.remove("./downloads", { recursive: true });
  } catch (error) {
    console.log(error);
  }
}

await main();
