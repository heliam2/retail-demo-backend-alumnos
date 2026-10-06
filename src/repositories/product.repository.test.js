jest.mock("../db", () => ({ getState: jest.fn(), persist: jest.fn() }));

const { getState, persist } = require("../db");
const productRepo = require("./product.repository");

let state;

beforeEach(() => {
  state = {
    products: [
      { id: 1, name: "Zapatillas Urban", category: "Calzado", price: 10000, stock: 5 },
      { id: 2, name: "Polera Basica", category: "Ropa", price: 5000, stock: 0 },
    ],
    stores: [{ id: 1, name: "Tienda Centro" }],
    storeInventory: [{ productId: 1, storeId: 1, qty: 3 }],
  };
  getState.mockReturnValue(state);
  persist.mockClear();
});

describe("product.repository", () => {
  it("findAll devuelve todos los productos del estado", () => {
    expect(productRepo.findAll()).toHaveLength(2);
  });

  it("findById devuelve el producto cuando existe", () => {
    expect(productRepo.findById(1)).toMatchObject({ id: 1, name: "Zapatillas Urban" });
  });

  it("findById devuelve null cuando no existe", () => {
    expect(productRepo.findById(999)).toBeNull();
  });

  describe("findByFilters", () => {
    it("sin filtros devuelve todos los productos", () => {
      expect(productRepo.findByFilters({})).toHaveLength(2);
    });

    it("filtra por categoria, case-insensitive", () => {
      const result = productRepo.findByFilters({ category: "ropa" });
      expect(result).toEqual([expect.objectContaining({ id: 2 })]);
    });

    it("filtra por texto de busqueda en el nombre, case-insensitive", () => {
      const result = productRepo.findByFilters({ search: "zapatillas" });
      expect(result).toEqual([expect.objectContaining({ id: 1 })]);
    });
  });

  describe("findStoreAvailability", () => {
    it("devuelve la disponibilidad por tienda con el nombre resuelto", () => {
      expect(productRepo.findStoreAvailability(1)).toEqual([{ storeId: 1, storeName: "Tienda Centro", qty: 3 }]);
    });

    it("devuelve arreglo vacio si el producto no tiene inventario en tiendas", () => {
      expect(productRepo.findStoreAvailability(2)).toEqual([]);
    });
  });

  describe("create", () => {
    it("asigna el siguiente id disponible y persiste", () => {
      const created = productRepo.create({ sku: "X", name: "Nuevo", price: 1000, stock: 1, category: "Test" });
      expect(created).toMatchObject({ id: 3, name: "Nuevo" });
      expect(state.products).toHaveLength(3);
      expect(persist).toHaveBeenCalledTimes(1);
    });
  });

  describe("update", () => {
    it("actualiza solo los campos provistos y persiste", () => {
      const updated = productRepo.update(1, { price: 12000, stock: undefined });
      expect(updated).toMatchObject({ id: 1, price: 12000, stock: 5 });
      expect(persist).toHaveBeenCalledTimes(1);
    });

    it("devuelve null si el producto no existe", () => {
      expect(productRepo.update(999, { price: 1 })).toBeNull();
      expect(persist).not.toHaveBeenCalled();
    });
  });

  describe("remove", () => {
    it("elimina el producto y persiste, devuelve true", () => {
      expect(productRepo.remove(1)).toBe(true);
      expect(state.products.find((p) => p.id === 1)).toBeUndefined();
      expect(persist).toHaveBeenCalledTimes(1);
    });

    it("devuelve false si el producto no existe", () => {
      expect(productRepo.remove(999)).toBe(false);
      expect(persist).not.toHaveBeenCalled();
    });
  });

  describe("decrementStock", () => {
    it("resta la cantidad indicada y persiste", () => {
      const product = productRepo.decrementStock(1, 2);
      expect(product).toMatchObject({ id: 1, stock: 3 });
      expect(persist).toHaveBeenCalledTimes(1);
    });

    it("devuelve null si el producto no existe", () => {
      expect(productRepo.decrementStock(999, 1)).toBeNull();
      expect(persist).not.toHaveBeenCalled();
    });
  });
});
