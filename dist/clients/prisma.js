"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
exports.prisma = global.prisma ||
    new client_1.PrismaClient({
        log: ["query", "error", "warn"],
    });
if (process.env.NODE_ENV !== "production") {
    global.prisma = exports.prisma;
}
exports.prisma
    .$connect()
    .then(() => {
    console.log("Successfully connected to database");
})
    .catch((e) => {
    console.error("Failed to connect to database:", e);
});
exports.default = exports.prisma;
//# sourceMappingURL=prisma.js.map