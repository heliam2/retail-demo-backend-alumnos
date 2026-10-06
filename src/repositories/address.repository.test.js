jest.mock("../db", () => ({ getState: jest.fn(), persist: jest.fn() }));

const { getState, persist } = require("../db");
const addressRepo = require("./address.repository");

let state;

beforeEach(() => {
  state = { addresses: {}, nextIds: { address: 1 } };
  getState.mockReturnValue(state);
  persist.mockClear();
});

describe("address.repository", () => {
  it("getAll crea una lista vacia la primera vez y la reutiliza", () => {
    const list = addressRepo.getAll(1);
    expect(list).toEqual([]);
    expect(state.addresses[1]).toBe(list);
  });

  it("create asigna el siguiente id, empuja y persiste", () => {
    const address = addressRepo.create(1, { label: "Casa", street: "Calle 1", city: "Santiago", region: "RM" });
    expect(address).toMatchObject({ id: 1, label: "Casa" });
    expect(addressRepo.getAll(1)).toHaveLength(1);
    expect(persist).toHaveBeenCalledTimes(1);
  });

  it("findById devuelve la direccion del usuario o null", () => {
    const address = addressRepo.create(1, { label: "Casa", street: "Calle 1", city: "Santiago", region: "RM" });
    expect(addressRepo.findById(1, address.id)).toMatchObject({ label: "Casa" });
    expect(addressRepo.findById(1, 999)).toBeNull();
  });

  it("update actualiza solo los campos provistos y persiste", () => {
    const address = addressRepo.create(1, { label: "Casa", street: "Calle 1", city: "Santiago", region: "RM" });
    const updated = addressRepo.update(1, address.id, { label: "Oficina", street: undefined });
    expect(updated).toMatchObject({ label: "Oficina", street: "Calle 1" });
  });

  it("update devuelve null si la direccion no existe", () => {
    expect(addressRepo.update(1, 999, { label: "X" })).toBeNull();
  });

  it("remove elimina y persiste, devuelve true", () => {
    const address = addressRepo.create(1, { label: "Casa", street: "Calle 1", city: "Santiago", region: "RM" });
    expect(addressRepo.remove(1, address.id)).toBe(true);
    expect(addressRepo.getAll(1)).toHaveLength(0);
  });

  it("remove devuelve false si no existe", () => {
    expect(addressRepo.remove(1, 999)).toBe(false);
  });
});
