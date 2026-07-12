import { sequelize } from '../config/database.js';
import { Role } from './Role.js';
import { User } from './User.js';
import { RefreshToken } from './RefreshToken.js';
import { Vehicle } from './Vehicle.js';
import { Driver } from './Driver.js';
import { Trip } from './Trip.js';
import { MaintenanceLog } from './MaintenanceLog.js';
import { FuelLog } from './FuelLog.js';
import { Expense } from './Expense.js';
import { Otp } from './Otp.js';
import { VehicleDocument } from './VehicleDocument.js';
import { Setting } from './Setting.js';

// --- Associations ---

// Role <-> User
Role.hasMany(User, { foreignKey: 'roleId', as: 'users' });
User.belongsTo(Role, { foreignKey: 'roleId', as: 'role' });

// User <-> RefreshToken
User.hasMany(RefreshToken, { foreignKey: 'userId', as: 'refreshTokens' });
RefreshToken.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User <-> Otp
User.hasMany(Otp, { foreignKey: 'userId', as: 'otps' });
Otp.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User <-> Driver (Driver may be linked to a User login)
User.hasOne(Driver, { foreignKey: 'userId', as: 'driverProfile' });
Driver.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Vehicle <-> Trip
Vehicle.hasMany(Trip, { foreignKey: 'vehicleId', as: 'trips' });
Trip.belongsTo(Vehicle, { foreignKey: 'vehicleId', as: 'vehicle' });

// Driver <-> Trip
Driver.hasMany(Trip, { foreignKey: 'driverId', as: 'trips' });
Trip.belongsTo(Driver, { foreignKey: 'driverId', as: 'driver' });

// Vehicle <-> MaintenanceLog
Vehicle.hasMany(MaintenanceLog, { foreignKey: 'vehicleId', as: 'maintenanceLogs' });
MaintenanceLog.belongsTo(Vehicle, { foreignKey: 'vehicleId', as: 'vehicle' });

// Vehicle <-> FuelLog
Vehicle.hasMany(FuelLog, { foreignKey: 'vehicleId', as: 'fuelLogs' });
FuelLog.belongsTo(Vehicle, { foreignKey: 'vehicleId', as: 'vehicle' });

// Trip <-> FuelLog
Trip.hasMany(FuelLog, { foreignKey: 'tripId', as: 'fuelLogs' });
FuelLog.belongsTo(Trip, { foreignKey: 'tripId', as: 'trip' });

// Vehicle <-> Expense
Vehicle.hasMany(Expense, { foreignKey: 'vehicleId', as: 'expenses' });
Expense.belongsTo(Vehicle, { foreignKey: 'vehicleId', as: 'vehicle' });

// Trip <-> Expense
Trip.hasMany(Expense, { foreignKey: 'tripId', as: 'expenses' });
Expense.belongsTo(Trip, { foreignKey: 'tripId', as: 'trip' });

// Vehicle <-> VehicleDocument
Vehicle.hasMany(VehicleDocument, { foreignKey: 'vehicleId', as: 'documents' });
VehicleDocument.belongsTo(Vehicle, { foreignKey: 'vehicleId', as: 'vehicle' });

export {
  sequelize,
  Role,
  User,
  RefreshToken,
  Vehicle,
  Driver,
  Trip,
  MaintenanceLog,
  FuelLog,
  Expense,
  Otp,
  VehicleDocument,
  Setting
};
