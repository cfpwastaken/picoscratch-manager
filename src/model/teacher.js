var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { DataTypes } from "sequelize";
import { hashSync } from "bcrypt";
import { BelongsTo, Column, Model, AllowNull, PrimaryKey, Table, ForeignKey } from "sequelize-typescript";
import School from "./school.js";
let Teacher = class Teacher extends Model {
};
__decorate([
    AllowNull(false),
    Column(DataTypes.STRING)
], Teacher.prototype, "name", void 0);
__decorate([
    AllowNull(false),
    PrimaryKey,
    Column({
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4
    })
], Teacher.prototype, "uuid", void 0);
__decorate([
    AllowNull(false),
    Column({
        type: DataTypes.STRING,
        set(value) {
            this.setDataValue("password", hashSync(String(value), 10));
        }
    })
], Teacher.prototype, "password", void 0);
__decorate([
    ForeignKey(() => School)
], Teacher.prototype, "schoolId", void 0);
__decorate([
    BelongsTo(() => School)
], Teacher.prototype, "school", void 0);
Teacher = __decorate([
    Table({
        paranoid: true,
        modelName: "teacher"
    })
], Teacher);
export default Teacher;
