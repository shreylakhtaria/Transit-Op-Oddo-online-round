import { Sequelize } from 'sequelize';

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: ':memory:',
  logging: false,
  define: {
    timestamps: true,
  },
});

export { sequelize };

export const testDbConnection = async () => {
  await sequelize.authenticate();
};
