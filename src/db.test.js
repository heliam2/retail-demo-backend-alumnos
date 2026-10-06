jest.mock("fs");

describe("db - runInTransaction (Unit of Work)", () => {
  let db;
  let fs;

  beforeEach(() => {
    // jest.resetModules() da un modulo "fs" mockeado nuevo; hay que volver a
    // requerirlo despues del reset para que sea la MISMA instancia que usa
    // db.js internamente (si no, las aserciones apuntan a un mock distinto).
    jest.resetModules();
    fs = require("fs");
    fs.existsSync.mockReturnValue(false); // sin data.json -> load() corre seedData() + un persist()
    db = require("./db");
    fs.writeFileSync.mockClear(); // ignorar la escritura del seed inicial, no es parte del test
  });

  it("persist() fuera de una transaccion escribe a disco de inmediato", () => {
    db.persist();
    expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
  });

  it("colapsa varios persist() dentro de una transaccion en una sola escritura", () => {
    db.runInTransaction(() => {
      db.persist();
      db.persist();
      db.persist();
    });
    expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
  });

  it("no escribe nada si dentro de la transaccion no se llamo persist()", () => {
    db.runInTransaction(() => {});
    expect(fs.writeFileSync).not.toHaveBeenCalled();
  });

  it("no escribe a disco si la funcion de la transaccion lanza un error", () => {
    expect(() =>
      db.runInTransaction(() => {
        db.persist();
        throw new Error("boom");
      })
    ).toThrow("boom");
    expect(fs.writeFileSync).not.toHaveBeenCalled();
  });

  it("devuelve el valor de retorno de la funcion envuelta", () => {
    expect(db.runInTransaction(() => 42)).toBe(42);
  });

  it("soporta transacciones anidadas: solo escribe al salir de la mas externa", () => {
    db.runInTransaction(() => {
      db.persist();
      db.runInTransaction(() => {
        db.persist();
      });
      expect(fs.writeFileSync).not.toHaveBeenCalled();
    });
    expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
  });
});
