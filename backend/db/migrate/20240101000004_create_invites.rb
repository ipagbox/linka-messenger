class CreateInvites < ActiveRecord::Migration[8.1]
  def change
    create_table :invites do |t|
      t.string :token_digest, null: false
      t.references :circle, null: false, foreign_key: true
      t.references :creator, null: false, foreign_key: { to_table: :users }
      t.integer :max_uses, default: 15, null: false
      t.integer :uses_count, default: 0, null: false
      t.datetime :expires_at

      t.timestamps
    end

    add_index :invites, :token_digest, unique: true
  end
end
