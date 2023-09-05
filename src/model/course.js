var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { DataTypes } from "sequelize";
import { BelongsTo, Column, HasMany, HasOne, Model, AllowNull, PrimaryKey, Table, ForeignKey } from "sequelize-typescript";
import Room from "./room.js";
import School from "./school.js";
import Student from "./student.js";
import CodeGroup from "./codegroups.js";
let Course = class Course extends Model {
};
__decorate([
    AllowNull(false),
    Column(DataTypes.STRING)
], Course.prototype, "name", void 0);
__decorate([
    AllowNull(false),
    PrimaryKey,
    Column({
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4
    })
], Course.prototype, "uuid", void 0);
__decorate([
    AllowNull(false),
    Column({
        type: DataTypes.BOOLEAN,
        defaultValue: false
    })
], Course.prototype, "isRunning", void 0);
__decorate([
    AllowNull(false),
    Column({
        type: DataTypes.BOOLEAN,
        defaultValue: true
    })
], Course.prototype, "allowRegister", void 0);
__decorate([
    AllowNull(false),
    Column({
        type: DataTypes.INTEGER,
        defaultValue: -1
    })
], Course.prototype, "maxSection", void 0);
__decorate([
    AllowNull(false),
    Column({
        type: DataTypes.INTEGER,
        defaultValue: -1
    })
], Course.prototype, "maxLevel", void 0);
__decorate([
    AllowNull(false),
    Column({
        type: DataTypes.STRING,
        defaultValue: "coding"
    })
], Course.prototype, "courseType", void 0);
__decorate([
    ForeignKey(() => School)
], Course.prototype, "schoolUuid", void 0);
__decorate([
    BelongsTo(() => School)
], Course.prototype, "school", void 0);
__decorate([
    HasOne(() => Room)
], Course.prototype, "room", void 0);
__decorate([
    HasMany(() => Student)
], Course.prototype, "students", void 0);
__decorate([
    HasMany(() => CodeGroup)
], Course.prototype, "codeGroups", void 0);
Course = __decorate([
    Table({
        paranoid: true,
        modelName: "course"
    })
], Course);
export default Course;
