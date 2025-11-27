import { Lens } from "monocle-ts";
import { Costume } from "@/domain/costume/costume";
import { normalizeJobName } from "@/domain/costume/function";

export const costumeLens = {
  id: Lens.fromPath<Costume>()(["id"]),
  name: {
    full: Lens.fromPath<Costume>()(["name"]),
    lily: { get: (costume: Costume) => costume.name.split("/")[0] },
    job: { get: (costume: Costume) => costume.name.split("/").slice(1).join("/") },
    normalized: {
      URI: {
        get: (costume: Costume) =>
          [
            encodeURI(costume.name.split("/")[0]),
            encodeURI(normalizeJobName(costume.name.split("/").slice(1).join("/"))),
          ].join("/"),
      },
      full: {
        get: (costume: Costume) =>
          costume.name.split("/")[0] +
          "/" +
          normalizeJobName(costume.name.split("/").slice(1).join("/")),
      },
      lily: { get: (costume: Costume) => costume.name.split("/")[0] },
      job: {
        get: (costume: Costume) => normalizeJobName(costume.name.split("/").slice(1).join("/")),
      },
    },
  },
  atk: { get: (costume: Costume) => costume.status.summary.particular[0] },
  spatk: { get: (costume: Costume) => costume.status.summary.particular[1] },
  def: { get: (costume: Costume) => costume.status.summary.particular[2] },
  spdef: { get: (costume: Costume) => costume.status.summary.particular[3] },
  cardType: Lens.fromPath<Costume>()(["cardType"]),
  status: Lens.fromPath<Costume>()(["status"]),
  rate: Lens.fromPath<Costume>()(["rate"]),
  released: Lens.fromPath<Costume>()(["released"]),
};
