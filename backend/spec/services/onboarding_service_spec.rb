require 'rails_helper'

RSpec.describe OnboardingService, type: :service do
  let(:service) { described_class.new }
  let(:creator) { create(:user) }
  let(:circle) { create(:circle, :with_matrix, creator: creator) }

  before do
    create(:server_setting, key: 'default_invite_max_uses', value: '15', value_type: 'integer')
  end

  describe '#register' do
    let(:invite) do
      invite = build(:invite, circle: circle, creator: creator, token_digest: nil)
      @token = invite.generate_token
      invite.save!
      invite
    end

    before do
      invite
      stub_matrix_create_user
      stub_matrix_get_user_access_token
      stub_matrix_join_room
    end

    it 'validates invite token' do
      expect { service.register(token: 'invalid_token', display_name: 'Test User') }
        .to raise_error(OnboardingService::InvalidInviteError)
    end

    it 'creates a local user record' do
      expect { service.register(token: @token, display_name: 'Test User') }
        .to change(User, :count).by(1)
    end

    it 'consumes the invite' do
      service.register(token: @token, display_name: 'Test User')
      expect(invite.reload.uses_count).to eq(1)
    end

    it 'returns user with credentials' do
      result = service.register(token: @token, display_name: 'Test User')
      expect(result[:user]).to be_a(User)
      expect(result[:rails_token]).to be_present
    end

    it 'creates circle membership' do
      service.register(token: @token, display_name: 'Test User')
      user = User.last
      expect(circle.has_member?(user)).to be true
    end

    it 'raises InvalidInviteError for expired invite' do
      invite.update!(expires_at: 1.day.ago)
      expect { service.register(token: @token, display_name: 'Test User') }
        .to raise_error(OnboardingService::InvalidInviteError)
    end
  end
end
