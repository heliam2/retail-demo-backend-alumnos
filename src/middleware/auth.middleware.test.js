const jwt = require("jsonwebtoken");
const { authRequired, adminRequired, JWT_SECRET } = require("./auth.middleware");

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe("authRequired", () => {
  it("responde 401 si no hay header Authorization", () => {
    const req = { headers: {} };
    const res = mockRes();
    const next = jest.fn();

    authRequired(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Token no proporcionado" });
    expect(next).not.toHaveBeenCalled();
  });

  it("responde 401 si el header no usa el esquema Bearer", () => {
    const req = { headers: { authorization: "Basic abc123" } };
    const res = mockRes();
    const next = jest.fn();

    authRequired(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("responde 401 si el token es invalido", () => {
    const req = { headers: { authorization: "Bearer token-invalido" } };
    const res = mockRes();
    const next = jest.fn();

    authRequired(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Token invalido o expirado" });
    expect(next).not.toHaveBeenCalled();
  });

  it("responde 401 si el token esta expirado", () => {
    const expired = jwt.sign({ id: 1, role: "customer" }, JWT_SECRET, { expiresIn: -10 });
    const req = { headers: { authorization: `Bearer ${expired}` } };
    const res = mockRes();
    const next = jest.fn();

    authRequired(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("deja pasar y expone req.user con un token valido", () => {
    const token = jwt.sign({ id: 42, role: "customer" }, JWT_SECRET);
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    const next = jest.fn();

    authRequired(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    expect(req.user).toMatchObject({ id: 42, role: "customer" });
  });
});

describe("adminRequired", () => {
  it("responde 403 si no hay req.user", () => {
    const req = {};
    const res = mockRes();
    const next = jest.fn();

    adminRequired(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: "Requiere rol admin" });
    expect(next).not.toHaveBeenCalled();
  });

  it("responde 403 si el rol no es admin", () => {
    const req = { user: { id: 1, role: "customer" } };
    const res = mockRes();
    const next = jest.fn();

    adminRequired(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("deja pasar si el rol es admin", () => {
    const req = { user: { id: 1, role: "admin" } };
    const res = mockRes();
    const next = jest.fn();

    adminRequired(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});
