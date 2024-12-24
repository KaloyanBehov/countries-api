import { Hono } from "hono";
import { PrismaClient } from "@prisma/client";
import { logger } from "hono/logger";

const app = new Hono();
const prisma = new PrismaClient();

interface Country {
  name: {
    common: string;
    official: string;
  };
  capital: string[];
  region: string;
  population: number;
  flags: {
    png: string;
    svg: string;
  };
  currencies: Record<
    string,
    {
      name: string;
      symbol: string;
    }
  >;
  languages: Record<string, string>;
  borders: string[];
  cca3: string;
}

async function fetchCountries(): Promise<Country[]> {
  try {
    const response = await fetch("https://restcountries.com/v3.1/all");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching countries:", error);
    throw error;
  }
}

app.use(logger());

// API Routes
app.get("/populate/:batch", async (c) => {
  try {
    const { batch } = c.req.param();
    const batchSize = 5;
    const countries = await fetchCountries();
    const start = parseInt(batch) * batchSize;
    const end = start + batchSize;
    const batchCountries = countries.slice(start, end);

    await Promise.all(
      batchCountries.map((country) =>
        prisma.country.upsert({
          where: { code: country.cca3 },
          update: {
            name: country.name.common,
            officialName: country.name.official,
            capital: country.capital?.[0] || null,
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
            capital: country.capital?.[0] || null,
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
        })
      )
    );

    return c.json({
      success: true,
      message: `Batch ${batch} processed`,
      remaining: countries.length - end,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return c.json({ error: error.message }, 500);
    }
    return c.json({ error: "An unknown error occurred" }, 500);
  }
});

app.get("/api/v1/countries", async (c) => {
  const {
    limit = "10",
    offset = "0",
    sort = "name",
    order = "asc",
  } = c.req.query();

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
  } catch (error) {
    return c.json(
      {
        success: false,
        error: "Failed to fetch countries",
        timestamp: new Date().toISOString(),
      },
      500
    );
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

export default async function handler(req: Request) {
  return app.fetch(req, {
    headers: req.headers,
  });
}
