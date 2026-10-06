jest.mock("../db", () => ({ getState: jest.fn(), persist: jest.fn() }));

const { getState, persist } = require("../db");
const orderRepo = require("./order.repository");

let state;

beforeEach(() => {
  state = {
    orders: [
      { id: 1, userId: 1, total: 1000 },
      { id: 2, userId: 2, total: 2000 },
    ],
    nextIds: { order: 3 },
  };
  getState.mockReturnValue(state);
  persist.mockClear();
});

describe("order.repository", () => {
  it("findAllByUser devuelve solo las ordenes del usuario", () => {
    expect(orderRepo.findAllByUser(1)).toEqual([{ id: 1, userId: 1, total: 1000 }]);
  });

  it("findById devuelve la orden cuando existe", () => {
    expect(orderRepo.findById(2)).toMatchObject({ id: 2, userId: 2 });
  });

  it("findById devuelve null cuando no existe", () => {
    expect(orderRepo.findById(999)).toBeNull();
  });

  it("create asigna el siguiente id, agrega createdAt, empuja la orden y persiste", () => {
    const order = orderRepo.create(1, { total: 5000, status: "pagado" });
    expect(order).toMatchObject({ id: 3, userId: 1, total: 5000, status: "pagado" });
    expect(order.createdAt).toEqual(expect.any(String));
    expect(state.orders).toHaveLength(3);
    expect(state.nextIds.order).toBe(4);
    expect(persist).toHaveBeenCalledTimes(1);
  });

  it("findAll devuelve todas las ordenes de todos los usuarios", () => {
    expect(orderRepo.findAll()).toHaveLength(2);
  });

  describe("updateStatus", () => {
    it("actualiza el status y persiste", () => {
      const updated = orderRepo.updateStatus(1, "enviado");
      expect(updated).toMatchObject({ id: 1, status: "enviado" });
      expect(persist).toHaveBeenCalledTimes(1);
    });

    it("devuelve null si la orden no existe", () => {
      expect(orderRepo.updateStatus(999, "enviado")).toBeNull();
      expect(persist).not.toHaveBeenCalled();
    });
  });
});
