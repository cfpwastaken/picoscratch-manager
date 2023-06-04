var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { DataTypes } from "sequelize";
import { BelongsTo, Column, Model, AllowNull, PrimaryKey, Table, ForeignKey } from "sequelize-typescript";
import Course from "./course.js";
let CodeGroup = class CodeGroup extends Model {
};
__decorate([
    AllowNull(false),
    Column(DataTypes.STRING)
], CodeGroup.prototype, "code", void 0);
__decorate([
    AllowNull(false),
    PrimaryKey,
    Column({
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4
    })
], CodeGroup.prototype, "uuid", void 0);
__decorate([
    ForeignKey(() => Course)
], CodeGroup.prototype, "courseUuid", void 0);
__decorate([
    BelongsTo(() => Course)
], CodeGroup.prototype, "course", void 0);
CodeGroup = __decorate([
    Table({
        modelName: "codegroup"
    })
], CodeGroup);
export default CodeGroup;
