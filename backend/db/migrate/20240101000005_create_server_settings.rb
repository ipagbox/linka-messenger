class CreateServerSettings < ActiveRecord::Migration[8.1]
  def change
    create_table :server_settings do |t|
      t.string :key, null: false
      t.string :value
      t.string :value_type, default: 'string', null: false
      t.string :description

      t.timestamps
    end

    add_index :server_settings, :key, unique: true
  end
end
