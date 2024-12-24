"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const hono_1 = require("hono");
const client_1 = require("@prisma/client");
const logger_1 = require("hono/logger");
const app = new hono_1.Hono();
const prisma = new client_1.PrismaClient();
async function fetchCountries() {
    try {
        const response = await fetch("https://restcountries.com/v3.1/all");
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    }
    catch (error) {
        console.error("Error fetching countries:", error);
        throw error;
    }
}
async function populateDatabase() {
    var _a, _b;
    try {
        const countries = await fetchCountries();
        for (const country of countries) {
            await prisma.country.upsert({
                where: { code: country.cca3 },
                update: {
                    name: country.name.common,
                    officialName: country.name.official,
                    capital: ((_a = country.capital) === null || _a === void 0 ? void 0 : _a[0]) || null,
                    region: country.region,
                    population: country.population,
                    flagUrl: country.flags.png,
                    currencies: country.currencies
                        ? Object.entries(country.currencies).map(([code, details]) => ({
                            code,
                            name: details.name,
                            symbol: details.symbol,
                        }))
                        : [],
                    languages: country.languages
                        ? Object.entries(country.languages).map(([code, name]) => ({
                            code,
                            name,
                        }))
                        : [],
                    borders: country.borders || [],
                },
                create: {
                    name: country.name.common,
                    officialName: country.name.official,
                    capital: ((_b = country.capital) === null || _b === void 0 ? void 0 : _b[0]) || null,
                    region: country.region,
                    population: country.population,
                    flagUrl: country.flags.png,
                    currencies: country.currencies
                        ? Object.entries(country.currencies).map(([code, details]) => ({
                            code,
                            name: details.name,
                            symbol: details.symbol,
                        }))
                        : [],
                    languages: country.languages
                        ? Object.entries(country.languages).map(([code, name]) => ({
                            code,
                            name,
                        }))
                        : [],
                    borders: country.borders || [],
                    code: country.cca3,
                },
            });
        }
        console.log("Database populated successfully");
    }
    catch (error) {
        console.error("Error populating database:", error);
        throw error;
    }
}
app.use((0, logger_1.logger)());
// API Routes
app.get("/populate", async (c) => {
    try {
        await populateDatabase();
        return c.json({ message: "Database populated successfully" });
    }
    catch (error) {
        if (error instanceof Error) {
            console.error("Detailed error:", error);
            return c.json({ error: error.message }, 500);
        }
        console.error("Unknown error:", error);
        return c.json({ error: "An unknown error occurred" }, 500);
    }
});
app.get("/api/v1/countries", async (c) => {
    const { limit = "10", offset = "0", sort = "name", order = "asc", } = c.req.query();
    try {
        const countries = await prisma.country.findMany({
            take: parseInt(limit),
            skip: parseInt(offset),
            orderBy: {
                [sort]: order,
            },
        });
        return c.json({
            success: true,
            data: countries,
            metadata: {
                limit: parseInt(limit),
                offset: parseInt(offset),
                total: await prisma.country.count(),
            },
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        return c.json({
            success: false,
            error: "Failed to fetch countries",
            timestamp: new Date().toISOString(),
        }, 500);
    }
});
app.get("/api/v1/countries/:name", async (c) => {
    const { name } = c.req.param();
    if (!name) {
        return c.json({ error: "Name is required" }, 400);
    }
    const country = await prisma.country.findFirst({
        where: {
            name: {
                equals: name,
                mode: "insensitive",
            },
        },
    });
    if (!country) {
        return c.json({ error: "Country not found" }, 404);
    }
    return c.json(country);
});
app.get("/api/v1/countries/region/:region", async (c) => {
    const { region } = c.req.param();
    const countries = await prisma.country.findMany({
        where: {
            region,
        },
    });
    return c.json(countries);
});
app.get("/api/v1/countries/code/:code", async (c) => {
    const { code } = c.req.param();
    const country = await prisma.country.findFirst({
        where: {
            code,
        },
    });
    if (!country) {
        return c.json({ error: "Country not found" }, 404);
    }
    return c.json(country);
});
// Export handler for Vercel
async function handler(req) {
    return app.fetch(req, {
        headers: req.headers,
    });
}
