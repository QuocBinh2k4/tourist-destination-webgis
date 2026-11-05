
require("dotenv").config();

const app = require("./app");
const { testConnection } = require("./config/db");

const PORT = Number(process.env.PORT || 5000);

async function startServer() {
  try {
    await testConnection();

    app.listen(PORT, "127.0.0.1", () => {
      console.log("============================");
      console.log("TOURISMGIS BACKEND");
      console.log(`http://localhost:${PORT}`);
      console.log("============================");
    });
  } catch (error) {
    console.error(
      "Không khởi động được Backend:",
      error.message
    );

    process.exit(1);
  }
}

startServer();
