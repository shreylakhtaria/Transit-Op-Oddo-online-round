import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export class MaintenanceLog extends Model {}

MaintenanceLog.init(
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
    description: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    cost: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('Active', 'Closed'),
      allowNull: false,
      defaultValue: 'Active',
    },
  },
  {
    sequelize,
    tableName: 'MaintenanceLogs',
    timestamps: true,
  }
);
