import { describe, it, expect } from "bun:test";
import rExtension, { transformTmuxName } from "./r.ts";

describe("/r transformTmuxName", () => {
  it("регистрирует /к и очищает кавычки в имени", async () => {
    const commands: string[] = [];
    let inputHandler:
      | ((event: { text: string }) => Promise<unknown>)
      | undefined;
    rExtension({
      registerCommand: (name: string) => commands.push(name),
      on: (_event: string, handler: typeof inputHandler) => {
        inputHandler = handler;
      },
      exec: async () => ({ stdout: "" }),
    } as any);
    expect(commands).toEqual(["r", "к"]);
    expect(await inputHandler?.({ text: "/к “code task”" })).toEqual({
      text: "/rename code task",
    });
  });
  it("'owner phone' → 'ownr-phn' (гласная в начале — сохраняется первая)", () => {
    expect(transformTmuxName("owner phone")).toBe("ownr-phn");
  });

  it("'search by id' → 'srch-by-id' (короткие слова не трогать)", () => {
    expect(transformTmuxName("search by id")).toBe("srch-by-id");
  });
  it("'code task' → 'code-task' (4-буквенные слова не трогать)", () => {
    expect(transformTmuxName("code task")).toBe("code-task");
  });

  it("'reasoning main omni' → 'rsnng-main-omni' (4-буквенные слова не сокращаются)", () => {
    expect(transformTmuxName("reasoning main omni")).toBe("rsnng-main-omni");
  });

  it("'abbr -a щ omp' → 'abbr-a-щ-omp' (дубли тире схлопнуты)", () => {
    expect(transformTmuxName("abbr -a щ omp")).toBe("abbr-a-щ-omp");
  });

  it("'check-admin-surface' → 'chck-admn-srfc' (дефисные слова раздельно)", () => {
    expect(transformTmuxName("check-admin-surface")).toBe("chck-admn-srfc");
  });

  it("'some config, bro' → 'some-cnfg-bro' (4-буквенные слова не режем)", () => {
    expect(transformTmuxName("some config, bro")).toBe("some-cnfg-bro");
  });

  it("пустая строка → ''", () => {
    expect(transformTmuxName("")).toBe("");
  });

  it("одно короткое слово 'in' → 'in'", () => {
    expect(transformTmuxName("in")).toBe("in");
  });

  it("кириллица 'яблоко дело' → 'яблк-дело' (4-буквенное слово не сокращается)", () => {
    expect(transformTmuxName("яблоко дело")).toBe("яблк-дело");
  });
});
