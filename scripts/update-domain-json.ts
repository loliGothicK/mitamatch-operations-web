import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

type DomainFile<T> = {
  data: T[];
};

type MemoriaRow = {
  id: string;
  uniqueId?: string;
  name: string;
  phantasm?: boolean;
};

type CostumeRow = {
  id: string;
  name: string;
  released_at: string;
  phantasm?: boolean;
};

type EntityKind = "memoria" | "costume";
type SelectorField = "name" | "id" | "uniqueId";

type CliOptions = {
  kind: EntityKind;
  selector: SelectorField;
  values: string[];
  all: boolean;
  dryRun: boolean;
  costumeDate: string;
};

const rootDir = path.resolve(__dirname, "..");
const memoriaPath = path.join(rootDir, "src/domain/memoria/memoria.json");
const costumePath = path.join(rootDir, "src/domain/costume/costume.json");

async function main() {
  const options = parseArgs(process.argv.slice(2));
  validateOptions(options);

  const result =
    options.kind === "memoria"
      ? await updateMemoriaJson(options)
      : await updateCostumeJson(options);

  console.log(
    [
      `${options.kind}: removed phantasm from ${result.updated} rows`,
      `${options.kind}: matched ${result.matched} rows`,
      options.kind === "costume"
        ? `costume: set released_at=${options.costumeDate} on ${result.updated} rows`
        : null,
      options.dryRun ? "mode: dry-run" : "mode: write",
    ]
      .filter((line): line is string => line !== null)
      .join("\n"),
  );
}

function parseArgs(args: string[]): CliOptions {
  const [kindArg, ...rest] = args;

  if (kindArg !== "memoria" && kindArg !== "costume") {
    printHelp();
    throw new Error("First argument must be 'memoria' or 'costume'.");
  }

  let selector: SelectorField = "name";
  let all = false;
  let dryRun = false;
  let costumeDate = todayInTokyo();
  const values: string[] = [];

  for (let index = 0; index < rest.length; index++) {
    const arg = rest[index];

    if (arg === "--help") {
      printHelp();
      process.exit(0);
    }

    if (arg === "--all") {
      all = true;
      continue;
    }

    if (arg === "--dry-run") {
      dryRun = true;
      continue;
    }

    if (arg === "--by") {
      const value = rest[index + 1];
      if (!value) {
        throw new Error("--by requires one of: name, id, uniqueId");
      }
      if (value !== "name" && value !== "id" && value !== "uniqueId") {
        throw new Error(`Unsupported selector: ${value}`);
      }
      selector = value;
      index++;
      continue;
    }

    if (arg === "--costume-date") {
      const value = rest[index + 1];
      if (!value) {
        throw new Error("--costume-date requires a YYYY-MM-DD value");
      }
      costumeDate = value;
      index++;
      continue;
    }

    if (arg.startsWith("--")) {
      throw new Error(`Unknown argument: ${arg}`);
    }

    values.push(arg);
  }

  return {
    kind: kindArg,
    selector,
    values,
    all,
    dryRun,
    costumeDate,
  };
}

async function updateMemoriaJson(options: CliOptions) {
  const json = await loadJson<DomainFile<MemoriaRow>>(memoriaPath);
  const matcher = createMatcher(options, "memoria");
  let matched = 0;
  let updated = 0;

  const next = {
    ...json,
    data: json.data.map((row) => {
      if (!matcher(row)) {
        return row;
      }

      matched++;

      if (row.phantasm !== true) {
        return row;
      }

      updated++;
      return omitPhantasm(row);
    }),
  };

  if (!options.dryRun) {
    await saveJson(memoriaPath, next);
  }

  return { matched, updated };
}

async function updateCostumeJson(options: CliOptions) {
  const json = await loadJson<DomainFile<CostumeRow>>(costumePath);
  const matcher = createMatcher(options, "costume");
  let matched = 0;
  let updated = 0;

  const next = {
    ...json,
    data: json.data.map((row) => {
      if (!matcher(row)) {
        return row;
      }

      matched++;

      if (row.phantasm !== true) {
        return row;
      }

      updated++;
      return {
        ...omitPhantasm(row),
        released_at: options.costumeDate,
      };
    }),
  };

  if (!options.dryRun) {
    await saveJson(costumePath, next);
  }

  return { matched, updated };
}

function validateOptions(options: CliOptions) {
  validateDate(options.costumeDate);

  if (options.kind === "costume" && options.selector === "uniqueId") {
    throw new Error("costume does not support --by uniqueId");
  }

  if (!options.all && options.values.length === 0) {
    throw new Error("At least one target is required. Use --all to update every phantasm row.");
  }
}

function createMatcher(
  options: CliOptions,
  kind: EntityKind,
): (row: { id: string; name: string; uniqueId?: string }) => boolean {
  if (options.all) {
    return () => true;
  }

  const valueSet = new Set(options.values);

  if (options.selector === "name") {
    return (row) => valueSet.has(row.name);
  }

  if (options.selector === "id") {
    return (row) => valueSet.has(row.id);
  }

  if (kind === "memoria") {
    return (row) => row.uniqueId !== undefined && valueSet.has(row.uniqueId);
  }

  throw new Error("uniqueId selector is only supported for memoria");
}

function printHelp() {
  console.log(
    [
      "Usage:",
      "  pnpm domain:update:memoria [...targets] [options]",
      "  pnpm domain:update:costume [...targets] [options]",
      "",
      "Targets:",
      "  Default selector is exact name match.",
      "  Use --by id or --by uniqueId to match different fields.",
      "",
      "Options:",
      "  --all                    Update every phantasm row.",
      "  --by name|id|uniqueId    Change selector field.",
      "  --costume-date YYYY-MM-DD  Released date for costume updates.",
      "  --dry-run                Print counts without writing files.",
      "",
      "Examples:",
      '  pnpm domain:update:costume "一柳梨璃/百合ヶ丘標準制服" --costume-date 2026-04-01',
      '  pnpm domain:update:memoria "クリエイターズコラボ-桜の下の約束-"',
      "  pnpm domain:update:memoria 01KMQTMCSF3HYX41GXJXXZ2WVV --by uniqueId",
      "  pnpm domain:update:costume --all --dry-run",
    ].join("\n"),
  );
}

async function loadJson<T>(filePath: string): Promise<T> {
  const text = await readFile(filePath, "utf8");
  return JSON.parse(text) as T;
}

async function saveJson(filePath: string, data: unknown) {
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function omitPhantasm<T extends { phantasm?: boolean }>(row: T): Omit<T, "phantasm"> {
  const { phantasm: _phantasm, ...rest } = row;
  return rest;
}

function validateDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`Invalid date: ${value}`);
  }
}

function todayInTokyo() {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Tokyo",
  }).format(new Date());
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
