import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export class Driver extends Model {}

Driver.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    licenseNumber: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    licenseCategory: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    licenseExpiryDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    contactNumber: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    safetyScore: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 100.0,
    },
    status: {
      type: DataTypes.ENUM('Available', 'On Trip', 'Off Duty', 'Suspended'),
      allowNull: false,
      defaultValue: 'Available',
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'Drivers',
    timestamps: true,
  }
);
