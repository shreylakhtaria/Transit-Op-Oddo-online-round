import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export class Expense extends Model {}

Expense.init(
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
    description: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    amount: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    category: {
      type: DataTypes.ENUM('Fuel', 'Maintenance', 'Toll', 'Other'),
      allowNull: false,
      defaultValue: 'Other',
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'Expenses',
    timestamps: true,
  }
);
