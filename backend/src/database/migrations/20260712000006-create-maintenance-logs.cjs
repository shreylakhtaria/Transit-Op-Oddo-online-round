'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('MaintenanceLogs', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      vehicleId: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: 'Vehicles',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      description: {
        allowNull: false,
        type: Sequelize.STRING
      },
      cost: {
        allowNull: false,
        type: Sequelize.FLOAT
      },
      startDate: {
        allowNull: false,
        type: Sequelize.DATEONLY
      },
      endDate: {
        allowNull: true,
        type: Sequelize.DATEONLY
      },
      status: {
        allowNull: false,
        type: Sequelize.ENUM('Active', 'Closed'),
        defaultValue: 'Active'
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
    await queryInterface.dropTable('MaintenanceLogs');
  }
};
