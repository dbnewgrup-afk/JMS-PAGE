"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const node_crypto_1 = __importDefault(require("node:crypto"));
const prisma = new client_1.PrismaClient();
async function main() {
    const items = [
        { name: "Gitar", price: 250000 },
        { name: "Vocal", price: 250000 },
        { name: "Drum", price: 250000 },
        { name: "Piano", price: 250000 },
        { name: "Biola", price: 250000 },
        { name: "Bass", price: 250000 },
        { name: "Keyboard", price: 250000 },
        { name: "Flute", price: 250000 },
        { name: "Saxophone", price: 300000 },
    ];
    for (const it of items) {
        await prisma.lessonProduct.upsert({
            where: { name: it.name }, // asumsi name UNIQUE
            create: {
                id: node_crypto_1.default.randomUUID(), // penuhi kolom id yang wajib
                name: it.name,
                price: it.price,
            },
            update: { price: it.price },
        });
    }
    console.log("✅ Seeded LessonProduct (9 kelas).");
}
main()
    .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exitCode = 1;
})
    .finally(async () => {
    await prisma.$disconnect();
});
