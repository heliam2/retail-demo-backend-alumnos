jest.mock("../db", () => ({ getState: jest.fn(), persist: jest.fn() }));

const { getState, persist } = require("../db");
const wishlistRepo = require("./wishlist.repository");

let state;

beforeEach(() => {
  state = { wishlists: {} };
  getState.mockReturnValue(state);
  persist.mockClear();
});

describe("wishlist.repository", () => {
  it("getItems crea una lista vacia la primera vez y la reutiliza", () => {
    const items = wishlistRepo.getItems(1);
    expect(items).toEqual([]);
    expect(state.wishlists[1]).toBe(items);
  });

  it("addItem agrega el producto y persiste", () => {
    const items = wishlistRepo.addItem(1, 10);
    expect(items).toEqual([10]);
    expect(persist).toHaveBeenCalledTimes(1);
  });

  it("addItem es idempotente: no duplica ni persiste de nuevo", () => {
    wishlistRepo.addItem(1, 10);
    const items = wishlistRepo.addItem(1, 10);
    expect(items).toEqual([10]);
    expect(persist).toHaveBeenCalledTimes(1);
  });

  it("removeItem quita el producto y persiste", () => {
    wishlistRepo.addItem(1, 10);
    const items = wishlistRepo.removeItem(1, 10);
    expect(items).toEqual([]);
    expect(persist).toHaveBeenCalledTimes(2);
  });
});
