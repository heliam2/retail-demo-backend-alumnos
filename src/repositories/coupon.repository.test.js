jest.mock("../db", () => ({ getState: jest.fn() }));

const { getState } = require("../db");
const couponRepo = require("./coupon.repository");

describe("coupon.repository", () => {
  it("findAll devuelve los cupones del estado", () => {
    getState.mockReturnValue({ coupons: [{ code: "DESC10" }] });
    expect(couponRepo.findAll()).toEqual([{ code: "DESC10" }]);
  });
});
