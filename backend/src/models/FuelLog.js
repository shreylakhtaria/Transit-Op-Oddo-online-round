import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export class FuelLog extends Model {}

FuelLog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    vehicleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    tripId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    liters: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    cost: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'FuelLogs',
    timestamps: true,
  }
);
