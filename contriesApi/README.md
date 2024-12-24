# Countries API

A RESTful API service that provides detailed information about countries worldwide. Built with Hono.js, TypeScript, and Prisma.

## Features

- Fetch all countries with pagination and sorting
- Search countries by name
- Filter countries by region
- Lookup country by code
- Data sourced from REST Countries API
- PostgreSQL database for persistent storage

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL database
- npm or yarn

## Installation

1. Clone the repository:

2. Install dependencies:

## API Endpoints

### Populate Database

- **GET** `/populate`
  - Fetches data from REST Countries API and populates the database
  - Response: `{ message: "Database populated successfully" }`

### Get All Countries

- **GET** `/api/v1/countries`
  - Query Parameters:
    - `limit` (default: 10) - Number of records to return
    - `offset` (default: 0) - Number of records to skip
    - `sort` (default: "name") - Field to sort by
    - `order` (default: "asc") - Sort order ("asc" or "desc")
  - Response:
    ```json
    {
      "success": true,
      "data": [...],
      "metadata": {
        "limit": 10,
        "offset": 0,
        "total": 250
      },
      "timestamp": "2024-03-XX..."
    }
    ```

### Get Country by Name

- **GET** `/api/v1/countries/:name`
  - Case-insensitive search
  - Response: Country object or 404 error

### Get Countries by Region

- **GET** `/api/v1/countries/region/:region`
  - Response: Array of countries in the specified region

### Get Country by Code

- **GET** `/api/v1/countries/code/:code`
  - Uses CCA3 country code
  - Response: Country object or 404 error

## Data Structure

### Country Object
