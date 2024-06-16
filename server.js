const Hapi = require("@hapi/hapi");
const path = require("path");
const fs = require("fs");
const routes = require("./routes");

const init = async () => {
  const server = Hapi.server({
    port: 3000,
    host: "0.0.0.0",
  });

  // Registrasi routes
  server.route(routes);

  // Menambahkan route untuk menangani 404
  server.ext("onPreResponse", (request, h) => {
    const response = request.response;
    if (response.isBoom && response.output.statusCode === 404) {
      const filePath = path.join(__dirname, "404.html");
      const fileContent = fs.readFileSync(filePath, "utf8");
      return h.response(fileContent).code(404).type("text/html");
    }
    return h.continue;
  });

  await server.start();
  console.log("Server running on %s", server.info.uri);
};

process.on("unhandledRejection", (err) => {
  console.error(err);
  process.exit(1);
});

init();
