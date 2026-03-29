require 'rails_helper'

RSpec.describe 'Onboarding API', type: :request do
  let(:user) { create(:user) }
  let(:circle) { create(:circle, :with_matrix, creator: user) }

  before do
    create(:server_setting, key: 'default_invite_max_uses', value: '15', value_type: 'integer')
  end

  describe 'POST /api/v1/onboarding' do
    let(:invite) do
      invite = build(:invite, circle: circle, creator: user, token_digest: nil)
      @token = invite.generate_token
      invite.save!
      invite
    end

    before do
      invite
      stub_matrix_create_user
      stub_matrix_password_login
      stub_matrix_join_room
    end

    context 'with valid request' do
      it 'creates user and returns credentials' do
        post '/api/v1/onboarding', params: { token: @token, display_name: 'New User' }
        expect(response).to have_http_status(:created)
        json = JSON.parse(response.body)
        expect(json['matrix_user_id']).to be_present
        expect(json['rails_token']).to be_present
      end

      it 'consumes the invite' do
        post '/api/v1/onboarding', params: { token: @token, display_name: 'New User' }
        expect(invite.reload.uses_count).to eq(1)
      end
    end

    context 'with invalid invite' do
      it 'returns 422' do
        post '/api/v1/onboarding', params: { token: 'invalid_token', display_name: 'New User' }
        expect(response).to have_http_status(:unprocessable_entity)
      end
    end

    context 'when matrix room join fails' do
      it 'returns 503 and does not consume invite' do
        stub_request(:post, /#{Regexp.escape(MatrixStubs::MATRIX_URL)}\/_synapse\/admin\/v1\/join\//)
          .to_return(
            status: 403,
            body: { errcode: 'M_FORBIDDEN', error: 'User not in room' }.to_json,
            headers: { 'Content-Type' => 'application/json' }
          )

        post '/api/v1/onboarding', params: { token: @token, display_name: 'New User' }
        expect(response).to have_http_status(:service_unavailable)
        expect(invite.reload.uses_count).to eq(0)
      end
    end
  end
end
