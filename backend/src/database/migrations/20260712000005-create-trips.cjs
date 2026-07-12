'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Trips', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      source: {
        allowNull: false,
        type: Sequelize.STRING
      },
      destination: {
        allowNull: false,
        type: Sequelize.STRING
      },
      vehicleId: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: 'Vehicles',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      driverId: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: 'Drivers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      cargoWeight: {
        allowNull: false,
        type: Sequelize.FLOAT
      },
      plannedDistance: {
        allowNull: false,
        type: Sequelize.FLOAT
      },
      actualDistance: {
        allowNull: true,
        type: Sequelize.FLOAT
      },
      fuelConsumed: {
        allowNull: true,
        type: Sequelize.FLOAT
      },
      revenue: {
        allowNull: false,
        type: Sequelize.FLOAT,
        defaultValue: 0.0
      },
      status: {
        allowNull: false,
        type: Sequelize.ENUM('Draft', 'Dispatched', 'Completed', 'Cancelled'),
        defaultValue: 'Draft'
      },
      dispatchDate: {
        allowNull: true,
        type: Sequelize.DATE
      },
      completionDate: {
        allowNull: true,
        type: Sequelize.DATE
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
    await queryInterface.dropTable('Trips');
  }
};
