jest.mock("../db", () => ({ getState: jest.fn(), persist: jest.fn() }));

const { getState, persist } = require("../db");
const cartRepo = require("./cart.repository");

let state;

beforeEach(() => {
  state = { carts: {} };
  getState.mockReturnValue(state);
  persist.mockClear();
});

describe("cart.repository", () => {
  it("getItems crea un carro vacio la primera vez y lo reutiliza despues", () => {
    const items = cartRepo.getItems(1);
    expect(items).toEqual([]);
    expect(state.carts[1]).toBe(items);
  });

  it("findItem devuelve null si el producto no esta en el carro", () => {
    expect(cartRepo.findItem(1, 99)).toBeNull();
  });

  it("findItem devuelve el item cuando existe", () => {
    state.carts[1] = [{ productId: 5, quantity: 2 }];
    expect(cartRepo.findItem(1, 5)).toMatchObject({ productId: 5, quantity: 2 });
  });

  it("addOrIncrementItem agrega un item nuevo y persiste", () => {
    const items = cartRepo.addOrIncrementItem(1, 5, 2);
    expect(items).toEqual([{ productId: 5, quantity: 2 }]);
    expect(persist).toHaveBeenCalledTimes(1);
  });

  it("addOrIncrementItem acumula cantidad si el item ya existe", () => {
    cartRepo.addOrIncrementItem(1, 5, 2);
    const items = cartRepo.addOrIncrementItem(1, 5, 3);
    expect(items).toEqual([{ productId: 5, quantity: 5 }]);
    expect(persist).toHaveBeenCalledTimes(2);
  });

  it("setItemQuantity actualiza la cantidad y persiste", () => {
    cartRepo.addOrIncrementItem(1, 5, 2);
    const items = cartRepo.setItemQuantity(1, 5, 9);
    expect(items).toEqual([{ productId: 5, quantity: 9 }]);
  });

  it("setItemQuantity devuelve null si el producto no esta en el carro", () => {
    expect(cartRepo.setItemQuantity(1, 999, 9)).toBeNull();
  });

  it("removeItem elimina el item y persiste", () => {
    cartRepo.addOrIncrementItem(1, 5, 2);
    const items = cartRepo.removeItem(1, 5);
    expect(items).toEqual([]);
  });

  it("removeItem devuelve null si el producto no esta en el carro", () => {
    expect(cartRepo.removeItem(1, 999)).toBeNull();
  });

  it("clearCart vacia el carro y persiste", () => {
    cartRepo.addOrIncrementItem(1, 5, 2);
    cartRepo.clearCart(1);
    expect(cartRepo.getItems(1)).toEqual([]);
    expect(persist).toHaveBeenCalledTimes(2);
  });
});
