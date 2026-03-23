# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2024_01_01_000005) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "circle_memberships", force: :cascade do |t|
    t.bigint "circle_id", null: false
    t.datetime "created_at", null: false
    t.string "role", default: "member", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["circle_id"], name: "index_circle_memberships_on_circle_id"
    t.index ["user_id", "circle_id"], name: "index_circle_memberships_on_user_id_and_circle_id", unique: true
    t.index ["user_id"], name: "index_circle_memberships_on_user_id"
  end

  create_table "circles", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "creator_id"
    t.string "matrix_announcements_room_id"
    t.string "matrix_general_room_id"
    t.string "matrix_space_id"
    t.integer "max_members", default: 15, null: false
    t.string "name", null: false
    t.datetime "updated_at", null: false
    t.index ["creator_id"], name: "index_circles_on_creator_id"
    t.index ["matrix_space_id"], name: "index_circles_on_matrix_space_id", unique: true, where: "(matrix_space_id IS NOT NULL)"
  end

  create_table "invites", force: :cascade do |t|
    t.bigint "circle_id", null: false
    t.datetime "created_at", null: false
    t.bigint "creator_id", null: false
    t.datetime "expires_at"
    t.integer "max_uses", default: 15, null: false
    t.string "token_digest", null: false
    t.datetime "updated_at", null: false
    t.integer "uses_count", default: 0, null: false
    t.index ["circle_id"], name: "index_invites_on_circle_id"
    t.index ["creator_id"], name: "index_invites_on_creator_id"
    t.index ["token_digest"], name: "index_invites_on_token_digest", unique: true
  end

  create_table "server_settings", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "description"
    t.string "key", null: false
    t.datetime "updated_at", null: false
    t.string "value"
    t.string "value_type", default: "string", null: false
    t.index ["key"], name: "index_server_settings_on_key", unique: true
  end

  create_table "users", force: :cascade do |t|
    t.string "auth_token_digest"
    t.datetime "created_at", null: false
    t.string "display_name", null: false
    t.boolean "is_admin", default: false, null: false
    t.string "matrix_user_id", null: false
    t.datetime "updated_at", null: false
    t.index ["matrix_user_id"], name: "index_users_on_matrix_user_id", unique: true
  end

  add_foreign_key "circle_memberships", "circles"
  add_foreign_key "circle_memberships", "users"
  add_foreign_key "circles", "users", column: "creator_id"
  add_foreign_key "invites", "circles"
  add_foreign_key "invites", "users", column: "creator_id"
end
