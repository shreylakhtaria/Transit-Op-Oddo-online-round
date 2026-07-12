import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export class Vehicle extends Model {}

Vehicle.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    registrationNumber: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    model: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    maxLoadCapacity: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    odometer: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    acquisitionCost: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('Available', 'On Trip', 'In Shop', 'Retired'),
      allowNull: false,
      defaultValue: 'Available',
    },
  },
  {
    sequelize,
    tableName: 'Vehicles',
    timestamps: true,
  }
);
