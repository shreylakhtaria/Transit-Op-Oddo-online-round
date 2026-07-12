import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export class Trip extends Model {}

Trip.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    source: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    destination: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    vehicleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    driverId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    cargoWeight: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    plannedDistance: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    actualDistance: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    fuelConsumed: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    revenue: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0.0,
    },
    status: {
      type: DataTypes.ENUM('Draft', 'Dispatched', 'Completed', 'Cancelled'),
      allowNull: false,
      defaultValue: 'Draft',
    },
    dispatchDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    completionDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'Trips',
    timestamps: true,
  }
);
