// :copyright: Copyright (c) 2019 ftrack
import normalizeString from "../source/util/normalize_string";

describe("Normalize string", () => {
  it("should normalize COMBINING DIAERESIS", () => {
    const normalized = normalizeString("Ra\u0308ksmo\u0308rga\u030as");
    expect(normalized).to.equal("Räksmörgås");
  });

  it("should not alter combined characters", () => {
    const normalized = normalizeString("R\u00e4ksm\u00f6rg\u00e5s");
    expect(normalized).to.equal("Räksmörgås");
  });

  it("Should not alter greek characters", () => {
    const normalized = normalizeString("Ψ Ω Ϊ Ϋ ά έ ή");
    expect(normalized).to.equal("Ψ Ω Ϊ Ϋ ά έ ή");
  });

  it("Should not alter chinese characters", () => {
    const normalized = normalizeString(
      "修改仅影响您个人帐户的语言、颜色或通知设置。"
    );
    expect(normalized).to.equal("修改仅影响您个人帐户的语言、颜色或通知设置。");
  });
});
