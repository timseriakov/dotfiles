import { describe, it, expect } from "bun:test";
import { transformTmuxName } from "./r.ts";

describe("/r transformTmuxName", () => {
  it("'owner phone' → 'ownr-phn' (гласная в начале — сохраняется первая)", () => {
    expect(transformTmuxName("owner phone")).toBe("ownr-phn");
  });

  it("'search by id' → 'srch-by-id' (короткие слова не трогать)", () => {
    expect(transformTmuxName("search by id")).toBe("srch-by-id");
  });

  it("'reasoning main omni' → 'rsnng-mn-omn' (omni начинается с гласной)", () => {
    expect(transformTmuxName("reasoning main omni")).toBe("rsnng-mn-omn");
  });

  it("'abbr -a щ omp' → 'abbr--a-щ-omp' (дефис сохраняется)", () => {
    expect(transformTmuxName("abbr -a щ omp")).toBe("abbr--a-щ-omp");
  });

  it("'some config, bro' → 'sm-cnfg-bro' (3-букв не режем)", () => {
    expect(transformTmuxName('some config, bro')).toBe("sm-cnfg-bro");
  });

  it("пустая строка → ''", () => {
    expect(transformTmuxName("")).toBe("");
  });

  it("одно короткое слово 'in' → 'in'", () => {
    expect(transformTmuxName("in")).toBe("in");
  });

  it("кириллица 'яблоко дело' → 'яблк-дл' (я — гласная, сохраняется)", () => {
    expect(transformTmuxName("яблоко дело")).toBe("яблк-дл");
  });
});
