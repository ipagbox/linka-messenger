require 'rails_helper'

RSpec.describe CircleMembership, type: :model do
  describe 'validations' do
    it 'requires uniqueness of user per circle' do
      user = create(:user)
      circle = create(:circle)
      create(:circle_membership, user: user, circle: circle)
      duplicate = build(:circle_membership, user: user, circle: circle)
      expect(duplicate).not_to be_valid
    end

    it 'validates role' do
      membership = build(:circle_membership, role: 'superadmin')
      expect(membership).not_to be_valid
    end

    it 'allows valid roles' do
      expect(build(:circle_membership, role: 'member')).to be_valid
      expect(build(:circle_membership, role: 'admin')).to be_valid
    end
  end
end
