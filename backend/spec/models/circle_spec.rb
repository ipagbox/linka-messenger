require 'rails_helper'

RSpec.describe Circle, type: :model do
  describe 'validations' do
    it 'requires name' do
      circle = build(:circle, name: nil)
      expect(circle).not_to be_valid
      expect(circle.errors[:name]).to be_present
    end

    it 'requires max_members' do
      circle = build(:circle, max_members: nil)
      expect(circle).not_to be_valid
    end

    it 'requires max_members > 0' do
      circle = build(:circle, max_members: 0)
      expect(circle).not_to be_valid
    end

    it 'is valid with proper attributes' do
      circle = build(:circle)
      expect(circle).to be_valid
    end
  end

  describe '#full?' do
    it 'returns false when below max members' do
      circle = create(:circle, max_members: 5)
      2.times { create(:circle_membership, circle: circle) }
      expect(circle.full?).to be false
    end

    it 'returns true when at max members' do
      circle = create(:circle, max_members: 2)
      2.times { create(:circle_membership, circle: circle) }
      expect(circle.full?).to be true
    end
  end

  describe '#member_count' do
    it 'returns the number of memberships' do
      circle = create(:circle, max_members: 15)
      3.times { create(:circle_membership, circle: circle) }
      expect(circle.member_count).to eq(3)
    end
  end

  describe '#has_member?' do
    it 'returns true if user is a member' do
      circle = create(:circle)
      user = create(:user)
      create(:circle_membership, user: user, circle: circle)
      expect(circle.has_member?(user)).to be true
    end

    it 'returns false if user is not a member' do
      circle = create(:circle)
      user = create(:user)
      expect(circle.has_member?(user)).to be false
    end
  end
end
