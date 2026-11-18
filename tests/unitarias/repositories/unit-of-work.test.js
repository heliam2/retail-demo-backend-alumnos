jest.mock("../../../src/db", () => ({ runInTransaction: jest.fn((fn) => fn()) }));

const { runInTransaction } = require("../../../src/db");
const uow = require("../../../src/repositories/unit-of-work");

describe("unit-of-work", () => {
  it("runInTransaction delega en db.runInTransaction y devuelve su resultado", () => {
    const result = uow.runInTransaction(() => 42);
    expect(result).toBe(42);
    expect(runInTransaction).toHaveBeenCalledTimes(1);
  });
});
