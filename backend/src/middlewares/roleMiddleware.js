export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized: Authentication required' });
      }

      const userRole = req.user.role?.name;
      if (!userRole || !allowedRoles.includes(userRole)) {
        return res.status(403).json({ error: `Forbidden: Access restricted to roles [${allowedRoles.join(', ')}]` });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
