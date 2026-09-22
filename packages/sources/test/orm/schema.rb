# This file is auto-generated from the current state of the database.
ActiveRecord::Schema[7.1].define(version: 2026_09_01_120000) do
  enable_extension "plpgsql"

  create_table "users", force: :cascade do |t|
    t.string "email", limit: 255, null: false
    t.text "bio"
    t.boolean "admin", default: false, null: false
    t.timestamps
    t.index ["email"], name: "index_users_on_email", unique: true
  end

  create_table "companies", force: :cascade do |t|
    t.string "name", null: false
    t.jsonb "settings"
  end

  create_table "orders", force: :cascade do |t|
    t.references :user, null: false
    t.decimal "total", precision: 12, scale: 2
    t.datetime "placed_at"
    t.bigint "company_id"
    t.index ["user_id"], name: "index_orders_on_user_id"
  end

  create_table "line_items", id: false, force: :cascade do |t|
    t.bigint "order_ref"
    t.integer "quantity", null: false
  end

  create_table "audits", primary_key: "uuid", id: :uuid, force: :cascade do |t|
    t.string "action"
  end

  add_foreign_key "orders", "users"
  add_foreign_key "line_items", "orders", column: "order_ref", name: "li_order_fk"
  add_foreign_key "orders", "companies"
end
