jest.mock("../db", () => ({ getState: jest.fn(), persist: jest.fn() }));

const { getState, persist } = require("../db");
const userRepo = require("./user.repository");

let state;

beforeEach(() => {
  state = {
    users: [{ id: 1, email: "cliente@demo.cl", name: "Cliente Demo", password: "hash" }],
    nextIds: { user: 2 },
  };
  getState.mockReturnValue(state);
  persist.mockClear();
});

describe("user.repository", () => {
  describe("findByEmail", () => {
    it("encuentra el usuario ignorando mayusculas/minusculas", () => {
      expect(userRepo.findByEmail("CLIENTE@demo.cl")).toMatchObject({ id: 1 });
    });

    it("devuelve null si no existe", () => {
      expect(userRepo.findByEmail("nadie@demo.cl")).toBeNull();
    });
  });

  describe("findById", () => {
    it("devuelve el usuario cuando existe", () => {
      expect(userRepo.findById(1)).toMatchObject({ email: "cliente@demo.cl" });
    });

    it("devuelve null cuando no existe", () => {
      expect(userRepo.findById(999)).toBeNull();
    });
  });

  describe("create", () => {
    it("asigna el siguiente id, empuja el usuario y persiste", () => {
      const user = userRepo.create({ email: "nuevo@demo.cl", name: "Nuevo", password: "hash2" });
      expect(user).toMatchObject({ id: 2, email: "nuevo@demo.cl" });
      expect(state.users).toHaveLength(2);
      expect(persist).toHaveBeenCalledTimes(1);
    });
  });

  describe("update", () => {
    it("actualiza solo los campos provistos y persiste", () => {
      const updated = userRepo.update(1, { name: "Cliente Actualizado", phone: undefined });
      expect(updated).toMatchObject({ id: 1, name: "Cliente Actualizado", email: "cliente@demo.cl" });
      expect(persist).toHaveBeenCalledTimes(1);
    });

    it("devuelve null si el usuario no existe", () => {
      expect(userRepo.update(999, { name: "X" })).toBeNull();
      expect(persist).not.toHaveBeenCalled();
    });
  });
});
