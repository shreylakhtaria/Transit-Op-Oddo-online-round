import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export class Setting extends Model {}

Setting.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    key: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    value: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'Settings',
    timestamps: true,
  }
);
