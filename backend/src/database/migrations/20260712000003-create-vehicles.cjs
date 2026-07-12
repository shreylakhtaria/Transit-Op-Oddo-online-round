'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Vehicles', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      registrationNumber: {
        allowNull: false,
        type: Sequelize.STRING,
        unique: true
      },
      model: {
        allowNull: false,
        type: Sequelize.STRING
      },
      type: {
        allowNull: false,
        type: Sequelize.STRING
      },
      maxLoadCapacity: {
        allowNull: false,
        type: Sequelize.FLOAT
      },
      odometer: {
        allowNull: false,
        type: Sequelize.FLOAT
      },
      acquisitionCost: {
        allowNull: false,
        type: Sequelize.FLOAT
      },
      status: {
        allowNull: false,
        type: Sequelize.ENUM('Available', 'On Trip', 'In Shop', 'Retired'),
        defaultValue: 'Available'
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
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Vehicles');
  }
};
