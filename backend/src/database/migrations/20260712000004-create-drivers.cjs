'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Drivers', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        allowNull: false,
        type: Sequelize.STRING
      },
      licenseNumber: {
        allowNull: false,
        type: Sequelize.STRING,
        unique: true
      },
      licenseCategory: {
        allowNull: false,
        type: Sequelize.STRING
      },
      licenseExpiryDate: {
        allowNull: false,
        type: Sequelize.DATEONLY
      },
      contactNumber: {
        allowNull: false,
        type: Sequelize.STRING
      },
      safetyScore: {
        allowNull: false,
        type: Sequelize.FLOAT,
        defaultValue: 100.0
      },
      status: {
        allowNull: false,
        type: Sequelize.ENUM('Available', 'On Trip', 'Off Duty', 'Suspended'),
        defaultValue: 'Available'
      },
      userId: {
        allowNull: true,
        type: Sequelize.UUID,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
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
    await queryInterface.dropTable('Drivers');
  }
};
