require 'rails_helper'

RSpec.describe 'Invites API', type: :request do
  let(:user) { create(:user) }
  let(:circle) { create(:circle, creator: user) }

  before do
    create(:server_setting, key: 'default_invite_max_uses', value: '15', value_type: 'integer')
  end

  describe 'POST /api/v1/invites/validate' do
    context 'with valid token' do
      let(:invite) do
        invite = build(:invite, circle: circle, creator: user, token_digest: nil)
        @token = invite.generate_token
        invite.save!
        invite
      end

      before { invite }

      it 'returns circle info and valid: true' do
        post '/api/v1/invites/validate', params: { token: @token }
        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json['valid']).to be true
        expect(json['circle_name']).to eq(circle.name)
      end
    end

    context 'with expired token' do
      let(:invite) do
        invite = build(:invite, :expired, circle: circle, creator: user, token_digest: nil)
        @token = invite.generate_token
        invite.save!
        invite
      end

      before { invite }

      it 'returns valid: false with reason' do
        post '/api/v1/invites/validate', params: { token: @token }
        expect(response).to have_http_status(:not_found)
        json = JSON.parse(response.body)
        expect(json['valid']).to be false
      end
    end

    context 'with exhausted token' do
      let(:invite) do
        invite = build(:invite, :exhausted, circle: circle, creator: user, token_digest: nil)
        @token = invite.generate_token
        invite.save!
        invite
      end

      before { invite }

      it 'returns valid: false' do
        post '/api/v1/invites/validate', params: { token: @token }
        expect(response).to have_http_status(:not_found)
        json = JSON.parse(response.body)
        expect(json['valid']).to be false
      end
    end

    context 'with unknown token' do
      it 'returns 404' do
        post '/api/v1/invites/validate', params: { token: 'nonexistent_token' }
        expect(response).to have_http_status(:not_found)
      end
    end
  end
end
