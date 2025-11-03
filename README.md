# Express + PostgreSQL + Prisma Guide

A practical guide to connecting Express.js with PostgreSQL using Prisma ORM.

## What This Project Does

- Express API server on port 3000
- PostgreSQL database on port 5432
- Prisma ORM for type-safe database queries
- CRUD operations for users

---

## PostgreSQL Basics

### What is PostgreSQL?

A database server that stores data in tables (like Excel, but much more powerful).

**Default port:** 5432

### Start PostgreSQL

```bash
# Mac
brew services start postgresql@15

# Linux
sudo systemctl start postgresql
```

### Connect to PostgreSQL (psql)

```bash
# Connect to default database
psql postgres

# Connect to specific database
psql myapp
```

### Common psql Commands

```sql
\l                          -- List all databases
\c database_name            -- Connect to a database
\dt                         -- List all tables in current database
\d table_name               -- Describe a table structure
\q                          -- Quit psql

-- Create database
CREATE DATABASE myapp;

-- Create table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE
);

-- Insert data
INSERT INTO users (name, email) VALUES ('Alice', 'alice@example.com');

-- Query data
SELECT * FROM users;

-- Delete database (must be connected to different DB first)
DROP DATABASE myapp;
```

---

## Database URL Explained

```
postgresql://user:password@host:port/database
           ↓      ↓        ↓     ↓      ↓
       username password  host  port  db_name
```

**Example:**
```
postgresql://chakitrocks@localhost:5432/myapp
```

- **user:** chakitrocks (your PostgreSQL username)
- **host:** localhost (your machine)
- **port:** 5432 (PostgreSQL default)
- **database:** myapp (the database name)

If you have a password:
```
postgresql://chakitrocks:mypassword@localhost:5432/myapp
```

---

## Project Setup

### Install Dependencies

```bash
npm install express pg
npm install prisma @prisma/client
```

### Initialize Prisma

```bash
npx prisma init
```

This creates:
- `prisma/schema.prisma` - Your database schema
- `.env` - Environment variables

### Configure .env

```bash
DATABASE_URL="postgresql://chakitrocks@localhost:5432/myapp"
```

---

## Prisma Commands Explained

### `npx prisma db pull`

**What it does:** Syncs your `schema.prisma` file with your existing database.

**Use when:** You already have tables in PostgreSQL and want Prisma to know about them.

```bash
# You created tables manually in psql
CREATE TABLE posts (id SERIAL PRIMARY KEY, title TEXT);

# Pull them into schema.prisma
npx prisma db pull

# Now schema.prisma has a posts model!
```

**Flow:**
```
PostgreSQL database (has tables)
         ↓
   npx prisma db pull
         ↓
Updates schema.prisma
```

---

### `npx prisma generate`

**What it does:** Generates the Prisma Client code so you can use `prisma.users.findMany()` in JavaScript.

**Use when:** After ANY change to `schema.prisma` (manual edits or after db pull).

```bash
# After editing schema.prisma or running db pull
npx prisma generate

# Now you can use in code:
await prisma.users.findMany()
```

**Flow:**
```
schema.prisma
      ↓
npx prisma generate
      ↓
Creates code in node_modules/.prisma/client/
(and updates node_modules/@prisma/client/ wrapper)
```

**Where the code lives:**
- Generated models: `node_modules/.prisma/client/`
- Wrapper you import: `node_modules/@prisma/client/`

---

### `npx prisma db push`

**What it does:** Pushes your `schema.prisma` changes to the database (creates/updates tables).

**Use when:** You manually edited `schema.prisma` and want to update the database.

```bash
# Edit schema.prisma (add new model)
model Post {
  id    Int    @id @default(autoincrement())
  title String
}

# Push to database
npx prisma db push

# Don't forget to generate client
npx prisma generate
```

Have a look a this on when to use `npx prisma db push` and when to use `npx prisma migrate dev -name migration_name` : [https://www.prisma.io/docs/getting-started/setup-prisma/start-from-scratch/relational-databases/install-prisma-client-typescript-postgresql#npx-prisma-migrate-dev](https://www.prisma.io/docs/getting-started/setup-prisma/start-from-scratch/relational-databases/install-prisma-client-typescript-postgresql#npx-prisma-migrate-dev)

**Flow:**
```
schema.prisma
      ↓
npx prisma db push
      ↓
Creates tables in PostgreSQL
```

---

## Where Prisma Stores Generated Code

When you run `npx prisma generate`, Prisma creates code in two locations:

### 1. `node_modules/.prisma/client/`

This is where the **actual generated code** lives (note the hidden `.prisma` folder).

```bash
node_modules/.prisma/client/
├── index.js          # Main client code
├── index.d.ts        # TypeScript definitions
└── schema.prisma     # Copy of your schema
```

**To view generated models:**
```bash
# See TypeScript definitions for your models
cat node_modules/.prisma/client/index.d.ts | grep "users"

# Or list the directory
ls -la node_modules/.prisma/client/
```

### 2. `node_modules/@prisma/client/`

This is the **wrapper/interface** that your code imports.

```bash
node_modules/@prisma/client/
├── index.js          # Re-exports from .prisma/client
├── index.d.ts        # Type definitions
└── package.json      # Package metadata
```

**How it works:**
```javascript
// When you write:
const { PrismaClient } = require('@prisma/client');

// It imports from: node_modules/@prisma/client/index.js
// Which points to: node_modules/.prisma/client/index.js
// Where your actual generated models live
```

### Why Two Locations?

- **@prisma/client** = The stable package you install via npm
- **.prisma/client** = The dynamically generated code based on YOUR schema

This separation allows Prisma to:
- Keep the installed package stable
- Regenerate only the schema-specific code when you run `generate`
- Support multiple projects with different schemas

### Viewing Your Generated Models

```bash
# See all generated Prisma types
cat node_modules/.prisma/client/index.d.ts | grep -A 10 "PrismaClient"

# See specific model delegates
cat node_modules/.prisma/client/index.d.ts | grep "users"

# See the runtime code
ls node_modules/.prisma/client/runtime/
```

### What Gets Generated?

For each model in `schema.prisma`, Prisma generates:
- `findMany()` - Get all records
- `findUnique()` - Get one by unique field
- `create()` - Insert new record
- `update()` - Modify existing record
- `delete()` - Remove record
- `count()` - Count records
- And many more methods

---

## Typical Workflows

### Workflow 1: Existing Database (what we did)

```bash
# 1. You have tables in PostgreSQL
# 2. Pull schema from database
npx prisma db pull

# 3. Generate client code
npx prisma generate

# 4. Use in code
await prisma.users.findMany()
```

### Workflow 2: New Project (Prisma-first)

```bash
# 1. Write schema.prisma manually
model User {
  id    Int    @id @default(autoincrement())
  name  String
  email String @unique
}

# 2. Push to database (creates tables)
npx prisma db push

# 3. Generate client code
npx prisma generate

# 4. Use in code
await prisma.user.findMany()
```

### Workflow 3: Schema Changes

```bash
# 1. Edit schema.prisma
# 2. Push changes to database
npx prisma db push

# 3. Regenerate client
npx prisma generate

# 4. Restart server
```

---

## Express Server Code

### Without Prisma (raw pg)

```javascript
const { Pool } = require('pg');

const pool = new Pool({
  user: 'chakitrocks',
  host: 'localhost',
  database: 'myapp',
  port: 5432,
});

app.get('/users', async (req, res) => {
  const result = await pool.query('SELECT * FROM users');
  res.json(result.rows);
});
```

### With Prisma (cleaner)

```javascript
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

app.get('/users', async (req, res) => {
  const users = await prisma.users.findMany();
  res.json(users);
});

app.post('/users', async (req, res) => {
  const { name, email } = req.body;
  const user = await prisma.users.create({
    data: { name, email }
  });
  res.json(user);
});
```

---

## Useful Commands

### Check PostgreSQL Status

```bash
# Check if running on port 5432
lsof -i :5432

# Or
ps aux | grep postgres
```

### Stop PostgreSQL

```bash
# Mac
brew services stop postgresql@15

# Linux
sudo systemctl stop postgresql
```

### Prisma Studio (Database GUI)

```bash
npx prisma studio
```

Opens a browser interface to view/edit database data.

---

## Troubleshooting

### Error: "Cannot read properties of undefined (reading 'findMany')"

**Fix:** Run `npx prisma generate` and restart server.

### Error: "Can't reach database server"

**Fix:** Check if PostgreSQL is running: `lsof -i :5432`

### Model name confusion

If your table is `users` (plural), use:
```javascript
await prisma.users.findMany()  // lowercase, plural
```

Check `schema.prisma` for the exact model name.

---

## Key Takeaways

1. **PostgreSQL** runs on port 5432 and stores your data
2. **Prisma** is a layer between your code and PostgreSQL
3. **db pull** = Database → schema.prisma (sync schema file)
4. **generate** = schema.prisma → JavaScript code (make it usable)
5. **db push** = schema.prisma → Database (create tables)
6. Always run `generate` after schema changes
7. Database URL format: `postgresql://user@host:port/database`

---

## Next Steps

- Learn Docker Compose to containerize this setup
- Add migrations with `npx prisma migrate dev`
- Deploy to production (RDS + ECS/Railway)
- Add authentication and authorization
