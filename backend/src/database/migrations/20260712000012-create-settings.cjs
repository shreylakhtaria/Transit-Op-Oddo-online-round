'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Settings', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      key: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      value: {
        type: Sequelize.STRING,
        allowNull: false
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Seed default settings
    const now = new Date();
    await queryInterface.bulkInsert('Settings', [
      { key: 'DEPOT_NAME', value: 'TransitOps Central', createdAt: now, updatedAt: now },
      { key: 'CURRENCY', value: 'USD ($)', createdAt: now, updatedAt: now },
      { key: 'DISTANCE_UNIT', value: 'Kilometers', createdAt: now, updatedAt: now }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Settings');
  }
};
