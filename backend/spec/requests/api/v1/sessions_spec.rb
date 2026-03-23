require 'rails_helper'

RSpec.describe 'Sessions API', type: :request do
  let(:user) { create(:user, matrix_user_id: '@testuser:localhost') }

  describe 'POST /api/v1/sessions' do
    let(:matrix_login_response) do
      { "access_token" => "syt_abc123", "device_id" => "DEVICE01" }
    end

    before do
      allow_any_instance_of(MatrixAdminService).to receive(:login_with_password)
        .and_return(matrix_login_response)
    end

    it 'returns token for valid user with password' do
      post '/api/v1/sessions', params: { matrix_user_id: user.matrix_user_id, password: 'secret123' }
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['token']).to be_present
      expect(json['matrix_access_token']).to eq('syt_abc123')
      expect(json['matrix_device_id']).to eq('DEVICE01')
      expect(json['user']['matrix_user_id']).to eq(user.matrix_user_id)
    end

    it 'returns 401 for unknown user' do
      post '/api/v1/sessions', params: { matrix_user_id: '@unknown:localhost', password: 'secret123' }
      expect(response).to have_http_status(:unauthorized)
    end

    it 'returns 401 when password is missing' do
      post '/api/v1/sessions', params: { matrix_user_id: user.matrix_user_id }
      expect(response).to have_http_status(:unauthorized)
    end

    it 'returns 401 when Matrix rejects credentials' do
      allow_any_instance_of(MatrixAdminService).to receive(:login_with_password)
        .and_raise(MatrixAdminService::MatrixError, 'Invalid credentials')
      post '/api/v1/sessions', params: { matrix_user_id: user.matrix_user_id, password: 'wrong' }
      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe 'DELETE /api/v1/sessions/:id' do
    let(:token) do
      payload = { user_id: user.id, exp: 30.days.from_now.to_i }
      JWT.encode(payload, ENV.fetch('JWT_SECRET', 'development_jwt_secret'), 'HS256')
    end

    it 'logs out successfully' do
      delete '/api/v1/sessions/1', headers: { 'Authorization' => "Bearer #{token}" }
      expect(response).to have_http_status(:ok)
    end
  end
end
