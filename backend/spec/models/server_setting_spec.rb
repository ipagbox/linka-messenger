require 'rails_helper'

RSpec.describe ServerSetting, type: :model do
  describe '.get' do
    it 'returns value from database' do
      create(:server_setting, key: 'test_key', value: 'test_value')
      expect(ServerSetting.get('test_key')).to eq('test_value')
    end

    it 'returns default value when not in database' do
      expect(ServerSetting.get('max_circles_per_user')).to eq('5')
    end

    it 'returns nil for unknown key with no default' do
      expect(ServerSetting.get('nonexistent_key')).to be_nil
    end
  end

  describe '.set' do
    it 'creates a new setting' do
      ServerSetting.set('new_key', 'new_value')
      expect(ServerSetting.find_by(key: 'new_key').value).to eq('new_value')
    end

    it 'updates existing setting' do
      create(:server_setting, key: 'existing_key', value: 'old_value')
      ServerSetting.set('existing_key', 'new_value')
      expect(ServerSetting.find_by(key: 'existing_key').value).to eq('new_value')
    end
  end

  describe '.load_defaults!' do
    it 'creates default settings' do
      ServerSetting.load_defaults!
      expect(ServerSetting.find_by(key: 'max_circles_per_user')).to be_present
      expect(ServerSetting.find_by(key: 'default_invite_max_uses')).to be_present
    end

    it 'does not overwrite existing settings' do
      create(:server_setting, key: 'max_circles_per_user', value: '10', value_type: 'integer')
      ServerSetting.load_defaults!
      expect(ServerSetting.find_by(key: 'max_circles_per_user').value).to eq('10')
    end
  end
end
