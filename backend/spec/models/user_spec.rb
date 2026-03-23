require 'rails_helper'

RSpec.describe User, type: :model do
  describe 'validations' do
    it 'requires matrix_user_id' do
      user = build(:user, matrix_user_id: nil)
      expect(user).not_to be_valid
      expect(user.errors[:matrix_user_id]).to be_present
    end

    it 'requires unique matrix_user_id' do
      create(:user, matrix_user_id: '@test:localhost')
      user = build(:user, matrix_user_id: '@test:localhost')
      expect(user).not_to be_valid
    end

    it 'requires display_name' do
      user = build(:user, display_name: nil)
      expect(user).not_to be_valid
      expect(user.errors[:display_name]).to be_present
    end

    it 'validates display_name max length' do
      user = build(:user, display_name: 'a' * 51)
      expect(user).not_to be_valid
    end

    it 'is valid with proper attributes' do
      user = build(:user)
      expect(user).to be_valid
    end
  end

  describe 'associations' do
    it 'has many circle_memberships' do
      user = create(:user)
      circle = create(:circle)
      create(:circle_membership, user: user, circle: circle)
      expect(user.circle_memberships.count).to eq(1)
    end

    it 'has many circles through memberships' do
      user = create(:user)
      circle = create(:circle)
      create(:circle_membership, user: user, circle: circle)
      expect(user.circles).to include(circle)
    end
  end

  describe '#admin?' do
    it 'returns true for admin user' do
      user = build(:user, :admin)
      expect(user.admin?).to be true
    end

    it 'returns false for regular user' do
      user = build(:user)
      expect(user.admin?).to be false
    end
  end

  describe '#can_create_circle?' do
    before do
      create(:server_setting, key: 'max_circles_per_user', value: '2', value_type: 'integer')
    end

    it 'returns true when under limit' do
      user = create(:user)
      expect(user.can_create_circle?).to be true
    end

    it 'returns false when at limit' do
      user = create(:user)
      create(:circle, creator: user)
      create(:circle, creator: user)
      expect(user.can_create_circle?).to be false
    end
  end
end
