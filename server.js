const express = require('express');
const { PrismaClient } = require('@prisma/client');

const app = express();
app.use(express.json());

const prisma = new PrismaClient();

// GET all users
app.get('/users', async (req, res) => {
  try {
    const users = await prisma.users.findMany();
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// POST new user
app.post('/users', async (req, res) => {
  const { name, email } = req.body;
  try {
    const user = await prisma.users.create({
      data: { name, email }
    });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// FETCH ALL POSTS
app.get('/posts', async (req, res) => {
  try {
    const posts = await prisma.posts.findMany();
    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
