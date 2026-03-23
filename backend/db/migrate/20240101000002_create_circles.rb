class CreateCircles < ActiveRecord::Migration[8.1]
  def change
    create_table :circles do |t|
      t.string :name, null: false
      t.string :matrix_space_id
      t.string :matrix_general_room_id
      t.string :matrix_announcements_room_id
      t.references :creator, foreign_key: { to_table: :users }, null: true
      t.integer :max_members, default: 15, null: false

      t.timestamps
    end

    add_index :circles, :matrix_space_id, unique: true, where: 'matrix_space_id IS NOT NULL'
  end
end
