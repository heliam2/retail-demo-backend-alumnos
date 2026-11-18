jest.mock("../../../src/db", () => ({ getState: jest.fn() }));

const { getState } = require("../../../src/db");
const couponRepo = require("../../../src/repositories/coupon.repository");

describe("coupon.repository", () => {
  it("findAll devuelve los cupones del estado", () => {
    getState.mockReturnValue({ coupons: [{ code: "DESC10" }] });
    expect(couponRepo.findAll()).toEqual([{ code: "DESC10" }]);
  });
});
