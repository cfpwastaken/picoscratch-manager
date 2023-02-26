var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { DataTypes } from "sequelize";
import { hashSync } from "bcrypt";
import { Column, AllowNull, PrimaryKey, Table, Model, HasMany } from "sequelize-typescript";
import Teacher from "./teacher.js";
import Course from "./course.js";
import Room from "./room.js";
let School = class School extends Model {
};
__decorate([
    AllowNull(false),
    Column(DataTypes.STRING)
], School.prototype, "name", void 0);
__decorate([
    AllowNull(false),
    PrimaryKey,
    Column({
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4
    })
], School.prototype, "uuid", void 0);
__decorate([
    AllowNull(false),
    Column({
        type: DataTypes.STRING,
        set(value) {
            this.setDataValue("adminPassword", hashSync(String(value), 10));
        }
    })
], School.prototype, "adminPassword", void 0);
__decorate([
    AllowNull(false),
    Column(DataTypes.STRING)
], School.prototype, "code", void 0);
__decorate([
    AllowNull(false),
    Column({
        type: DataTypes.STRING,
        defaultValue: "en"
    })
], School.prototype, "lang", void 0);
__decorate([
    AllowNull(false),
    Column({
        type: DataTypes.STRING,
        defaultValue: "latest"
    })
], School.prototype, "channel", void 0);
__decorate([
    HasMany(() => Teacher)
], School.prototype, "teachers", void 0);
__decorate([
    HasMany(() => Course)
], School.prototype, "courses", void 0);
__decorate([
    HasMany(() => Room)
], School.prototype, "rooms", void 0);
School = __decorate([
    Table({
        paranoid: true,
        modelName: "school"
    })
], School);
export default School;
