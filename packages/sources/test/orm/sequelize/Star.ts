import { BelongsTo, Column, DataType, ForeignKey, Table } from "sequelize-typescript";
import IdModel from "./Base";
import User from "./User";
import Widget from "./Widget";

@Table({ tableName: "stars" })
class Star extends IdModel<
  InferAttributes<Star>,
  Partial<InferCreationAttributes<Star>>
> {
  @Column(DataType.STRING)
  index: string | null;

  @BelongsTo(() => User, "userId")
  user: User;

  @ForeignKey(() => User)
  @Column(DataType.UUID)
  userId: string;

  @ForeignKey(() => Widget)
  @Column(DataType.UUID)
  widgetId: string | null;
}

export default Star;
