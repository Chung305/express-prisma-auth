"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_1 = __importDefault(require("http"));
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
//adjust server timeout settings
server.keepAliveTimeout = 61 * 1000;
server.headersTimeout = 65 * 1000;
//middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
//routes
const PORT = parseInt(process.env.PORT || "3000", 10);
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
//# sourceMappingURL=index.js.map