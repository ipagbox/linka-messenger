require 'rails_helper'

RSpec.describe InviteService, type: :service do
  let(:service) { described_class.new }
  let(:user) { create(:user) }
  let(:circle) { create(:circle) }

  before do
    create(:server_setting, key: 'default_invite_max_uses', value: '15', value_type: 'integer')
  end

  describe '#create' do
    it 'creates an invite with token digest' do
      expect { service.create(circle: circle, creator: user) }.to change(Invite, :count).by(1)
    end

    it 'returns a plaintext token' do
      token = service.create(circle: circle, creator: user)
      expect(token).to be_a(String)
      expect(token.length).to be > 10
    end

    it 'sets default max_uses from server settings' do
      service.create(circle: circle, creator: user)
      invite = Invite.last
      expect(invite.max_uses).to eq(15)
    end

    it 'sets expiry if specified' do
      service.create(circle: circle, creator: user, expires_in: 24.hours)
      invite = Invite.last
      expect(invite.expires_at).to be_within(5.seconds).of(24.hours.from_now)
    end

    it 'respects custom max_uses' do
      service.create(circle: circle, creator: user, max_uses: 5)
      invite = Invite.last
      expect(invite.max_uses).to eq(5)
    end
  end

  describe '#validate' do
    it 'finds invite by token' do
      invite = build(:invite, circle: circle, creator: user, token_digest: nil)
      token = invite.generate_token
      invite.save!
      found = service.validate(token)
      expect(found).to eq(invite)
    end

    it 'returns nil for invalid token' do
      expect(service.validate('invalid_token')).to be_nil
    end

    it 'returns nil for expired invite' do
      invite = build(:invite, :expired, circle: circle, creator: user, token_digest: nil)
      token = invite.generate_token
      invite.save!
      expect(service.validate(token)).to be_nil
    end

    it 'returns nil for exhausted invite' do
      invite = build(:invite, :exhausted, circle: circle, creator: user, token_digest: nil)
      token = invite.generate_token
      invite.save!
      expect(service.validate(token)).to be_nil
    end

    it 'returns nil for blank token' do
      expect(service.validate('')).to be_nil
      expect(service.validate(nil)).to be_nil
    end
  end

  describe '#consume' do
    it 'increments usage count' do
      invite = build(:invite, circle: circle, creator: user, token_digest: nil)
      token = invite.generate_token
      invite.save!
      service.consume(token, create(:user))
      expect(invite.reload.uses_count).to eq(1)
    end

    it 'creates circle membership' do
      invite = build(:invite, circle: circle, creator: user, token_digest: nil)
      token = invite.generate_token
      invite.save!
      new_user = create(:user)
      expect { service.consume(token, new_user) }.to change(CircleMembership, :count).by(1)
    end

    it 'raises on invalid token' do
      expect { service.consume('invalid', create(:user)) }
        .to raise_error(InviteService::InvalidTokenError)
    end
  end
end
