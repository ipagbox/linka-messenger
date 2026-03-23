class CreateCircleMemberships < ActiveRecord::Migration[8.1]
  def change
    create_table :circle_memberships do |t|
      t.references :user, null: false, foreign_key: true
      t.references :circle, null: false, foreign_key: true
      t.string :role, default: 'member', null: false

      t.timestamps
    end

    add_index :circle_memberships, [:user_id, :circle_id], unique: true
  end
end
