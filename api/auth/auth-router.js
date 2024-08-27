const router = require('express').Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const JWT_SECRET  =  "mysecret";
const db = require('../../data/dbconfig.js');

// Helper function to create a JWT
function createToken(user) {
  const payload = { subject: user.id, username: user.username };
  const options = { expiresIn: '1d' };
  return jwt.sign(payload, JWT_SECRET || 'shh', options);
}

// Register endpoint
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'username and password required' });
    }

    const hash = bcrypt.hashSync(password, 8); // Hashing the password
    const [id] = await db('users').insert({ username, password: hash });

    const newUser = await db('users').where({ id }).first();
    res.status(201).json(newUser);
  } catch (err) {
    res.status(500).json({ message: 'username taken' });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'username and password required' });
    }

    const user = await db('users').where({ username }).first();
    if (user && bcrypt.compareSync(password, user.password)) {
      const token = createToken(user);
      res.status(200).json({ message: `welcome, ${user.username}`, token });
    } else {
      res.status(401).json({ message: 'invalid credentials' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Failed to log in' });
  }
});


module.exports = router;
