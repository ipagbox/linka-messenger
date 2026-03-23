class CreateUsers < ActiveRecord::Migration[8.1]
  def change
    create_table :users do |t|
      t.string :matrix_user_id, null: false
      t.string :display_name, null: false
      t.boolean :is_admin, default: false, null: false
      t.string :auth_token_digest

      t.timestamps
    end

    add_index :users, :matrix_user_id, unique: true
  end
end
