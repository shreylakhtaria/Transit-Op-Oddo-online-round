'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('VehicleDocuments', {
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
      documentType: {
        allowNull: false,
        type: Sequelize.STRING
      },
      documentNumber: {
        allowNull: false,
        type: Sequelize.STRING
      },
      expiryDate: {
        allowNull: false,
        type: Sequelize.DATEONLY
      },
      documentUrl: {
        allowNull: true,
        type: Sequelize.STRING
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
    await queryInterface.dropTable('VehicleDocuments');
  }
};
