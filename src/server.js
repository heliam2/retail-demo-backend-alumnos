require("dotenv").config();
const app = require("./app");

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`QA Retail API escuchando en http://localhost:${PORT}`);
  console.log(`Salud: http://localhost:${PORT}/api/health`);
});
