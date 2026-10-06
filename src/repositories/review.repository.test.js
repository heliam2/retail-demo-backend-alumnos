jest.mock("../db", () => ({ getState: jest.fn(), persist: jest.fn() }));

const { getState, persist } = require("../db");
const reviewRepo = require("./review.repository");

let state;

beforeEach(() => {
  state = {
    reviews: [{ id: 1, productId: 10, userId: 1, rating: 5, comment: "Buena" }],
    nextIds: { review: 2 },
  };
  getState.mockReturnValue(state);
  persist.mockClear();
});

describe("review.repository", () => {
  it("findByProduct devuelve solo las reseñas del producto", () => {
    expect(reviewRepo.findByProduct(10)).toHaveLength(1);
    expect(reviewRepo.findByProduct(999)).toEqual([]);
  });

  it("findByUserAndProduct devuelve la reseña existente o null", () => {
    expect(reviewRepo.findByUserAndProduct(1, 10)).toMatchObject({ id: 1 });
    expect(reviewRepo.findByUserAndProduct(2, 10)).toBeNull();
  });

  it("findById devuelve la reseña o null", () => {
    expect(reviewRepo.findById(1)).toMatchObject({ id: 1 });
    expect(reviewRepo.findById(999)).toBeNull();
  });

  it("create asigna el siguiente id, empuja y persiste", () => {
    const review = reviewRepo.create({ productId: 20, userId: 2, rating: 4, comment: "" });
    expect(review).toMatchObject({ id: 2, productId: 20 });
    expect(state.reviews).toHaveLength(2);
    expect(persist).toHaveBeenCalledTimes(1);
  });

  it("update mezcla los cambios y persiste", () => {
    const updated = reviewRepo.update(1, { rating: 3, comment: "Cambie de opinion" });
    expect(updated).toMatchObject({ id: 1, rating: 3, comment: "Cambie de opinion" });
    expect(persist).toHaveBeenCalledTimes(1);
  });

  it("remove elimina y persiste, devuelve true", () => {
    expect(reviewRepo.remove(1)).toBe(true);
    expect(state.reviews).toHaveLength(0);
    expect(persist).toHaveBeenCalledTimes(1);
  });

  it("remove devuelve false si no existe", () => {
    expect(reviewRepo.remove(999)).toBe(false);
    expect(persist).not.toHaveBeenCalled();
  });
});
