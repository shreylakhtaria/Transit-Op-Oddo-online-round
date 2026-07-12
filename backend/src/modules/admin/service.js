import { User, Role, sequelize } from '../../models/index.js';

// The password hash must never leave this module: whitelist the columns we are willing to
// select instead of relying on the model's toJSON() to strip it after the fact.
const USER_ATTRIBUTES = ['id', 'name', 'email', 'createdAt'];
const ROLE_ATTRIBUTES = ['id', 'name'];

const toUserResponse = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role ? { id: user.role.id, name: user.role.name } : null,
  createdAt: user.createdAt
});

const notFound = (message) => {
  const error = new Error(message);
  error.status = 404;
  return error;
};

export class AdminService {
  static async getAllRoles() {
    // Two queries rather than a correlated per-role count: one for the roles, one grouped
    // count over Users, joined in memory.
    const [roles, counts] = await Promise.all([
      Role.findAll({
        attributes: ROLE_ATTRIBUTES,
        order: [['id', 'ASC']]
      }),
      User.findAll({
        attributes: ['roleId', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
        group: ['roleId'],
        raw: true
      })
    ]);

    // COUNT() comes back as a string on some dialects, so normalise it.
    const usersByRoleId = new Map(counts.map((row) => [row.roleId, Number(row.count)]));

    return roles.map((role) => ({
      id: role.id,
      name: role.name,
      userCount: usersByRoleId.get(role.id) ?? 0
    }));
  }

  static async getAllUsers() {
    const users = await User.findAll({
      attributes: USER_ATTRIBUTES,
      include: [{ model: Role, as: 'role', attributes: ROLE_ATTRIBUTES }],
      order: [['createdAt', 'DESC']]
    });

    return users.map(toUserResponse);
  }

  static async getUserById(id) {
    const user = await User.findByPk(id, {
      attributes: USER_ATTRIBUTES,
      include: [{ model: Role, as: 'role', attributes: ROLE_ATTRIBUTES }]
    });
    if (!user) throw notFound('User not found');

    return toUserResponse(user);
  }

  static async updateUserRole(id, { roleName }) {
    const user = await User.findByPk(id);
    if (!user) throw notFound('User not found');

    const role = await Role.findOne({ where: { name: roleName } });
    if (!role) {
      throw new Error('Invalid role specified');
    }

    await user.update({ roleId: role.id });

    return await this.getUserById(user.id);
  }
}
