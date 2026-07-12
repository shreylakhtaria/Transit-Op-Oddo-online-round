import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User, Role } from '../models/index.js';

export const requireAuth = async (req, res, next) => {
  try {
    let token = null;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ error: 'Access token is missing or invalid' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: 'Access token is expired or invalid' });
    }

    const user = await User.findByPk(decoded.id, {
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['name']
        }
      ]
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};
