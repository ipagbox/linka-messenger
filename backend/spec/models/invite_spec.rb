require 'rails_helper'

RSpec.describe Invite, type: :model do
  describe 'validations' do
    it 'requires token_digest' do
      invite = build(:invite, token_digest: nil)
      expect(invite).not_to be_valid
      expect(invite.errors[:token_digest]).to be_present
    end

    it 'requires circle' do
      invite = build(:invite, circle: nil)
      expect(invite).not_to be_valid
    end

    it 'requires max_uses > 0' do
      invite = build(:invite, max_uses: 0)
      expect(invite).not_to be_valid
    end

    it 'requires max_uses to be positive' do
      invite = build(:invite, max_uses: -1)
      expect(invite).not_to be_valid
    end

    it 'is valid with proper attributes' do
      invite = build(:invite)
      expect(invite).to be_valid
    end
  end

  describe '#valid_for_use?' do
    it 'returns true when not expired and not exhausted' do
      invite = build(:invite, expires_at: 1.day.from_now, uses_count: 0)
      expect(invite.valid_for_use?).to be true
    end

    it 'returns true when no expiry set' do
      invite = build(:invite, expires_at: nil, uses_count: 0)
      expect(invite.valid_for_use?).to be true
    end

    it 'returns false when expired' do
      invite = build(:invite, :expired)
      expect(invite.valid_for_use?).to be false
    end

    it 'returns false when uses exhausted' do
      invite = build(:invite, :exhausted)
      expect(invite.valid_for_use?).to be false
    end
  end

  describe '#expired?' do
    it 'returns false when expires_at is nil' do
      invite = build(:invite, expires_at: nil)
      expect(invite.expired?).to be false
    end

    it 'returns true when past expires_at' do
      invite = build(:invite, expires_at: 1.second.ago)
      expect(invite.expired?).to be true
    end

    it 'returns false when expires_at is in future' do
      invite = build(:invite, expires_at: 1.day.from_now)
      expect(invite.expired?).to be false
    end
  end

  describe '#exhausted?' do
    it 'returns false when uses < max_uses' do
      invite = build(:invite, uses_count: 5, max_uses: 15)
      expect(invite.exhausted?).to be false
    end

    it 'returns true when uses >= max_uses' do
      invite = build(:invite, uses_count: 15, max_uses: 15)
      expect(invite.exhausted?).to be true
    end
  end

  describe '#consume!' do
    it 'increments uses_count' do
      invite = create(:invite, uses_count: 0, max_uses: 15)
      expect { invite.consume! }.to change { invite.uses_count }.by(1)
    end

    it 'raises error if not valid for use' do
      invite = create(:invite, :exhausted)
      expect { invite.consume! }.to raise_error(RuntimeError)
    end
  end

  describe 'TokenDigestable' do
    it 'generates a token and sets digest' do
      invite = build(:invite, token_digest: nil)
      token = invite.generate_token
      expect(token).to be_present
      expect(invite.token_digest).to eq(Invite.digest_token(token))
    end

    it 'finds by token' do
      invite = build(:invite, token_digest: nil)
      token = invite.generate_token
      invite.save!
      found = Invite.find_by_token(token)
      expect(found).to eq(invite)
    end
  end
end
