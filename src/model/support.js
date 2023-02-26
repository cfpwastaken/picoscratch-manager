var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { DataTypes } from "sequelize";
import { Column, Model, AllowNull, PrimaryKey, Table } from "sequelize-typescript";
// export let Support = (sql) => {
// 	Support = sql.define("support", {
// 		id: {
// 			type: DataTypes.STRING,
// 			primaryKey: true
// 		},
// 		data: {
// 			type: DataTypes.TEXT,
// 			allowNull: false
// 		}
// 	}, {
// 		paranoid: true
// 	})
// }
let Support = class Support extends Model {
};
__decorate([
    AllowNull(false),
    PrimaryKey,
    Column(DataTypes.STRING)
], Support.prototype, "code", void 0);
__decorate([
    AllowNull(false),
    Column(DataTypes.TEXT)
], Support.prototype, "data", void 0);
Support = __decorate([
    Table({
        paranoid: true,
        modelName: "support"
    })
], Support);
export default Support;
