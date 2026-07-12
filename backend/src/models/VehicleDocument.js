import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export class VehicleDocument extends Model {}

VehicleDocument.init(
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
    documentType: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    documentNumber: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    expiryDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    documentUrl: {
      type: DataTypes.STRING(1000),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'VehicleDocuments',
    timestamps: true,
  }
);
