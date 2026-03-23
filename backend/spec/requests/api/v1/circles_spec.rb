require 'rails_helper'

RSpec.describe 'Circles API', type: :request do
  let(:user) { create(:user) }
  let(:token) do
    payload = { user_id: user.id, exp: 30.days.from_now.to_i }
    JWT.encode(payload, ENV.fetch('JWT_SECRET', 'development_jwt_secret'), 'HS256')
  end
  let(:headers) { { 'Authorization' => "Bearer #{token}" } }

  before do
    create(:server_setting, key: 'max_circles_per_user', value: '5', value_type: 'integer')
    create(:server_setting, key: 'default_invite_max_uses', value: '15', value_type: 'integer')
  end

  describe 'GET /api/v1/circles' do
    before do
      circle = create(:circle, :with_matrix, creator: user)
      create(:circle_membership, user: user, circle: circle)
    end

    it 'returns user circles' do
      get '/api/v1/circles', headers: headers
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json.length).to eq(1)
    end

    it 'requires authentication' do
      get '/api/v1/circles'
      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe 'POST /api/v1/circles' do
    before do
      allow_any_instance_of(MatrixAdminService).to receive(:create_space).and_return('!space123:localhost')
      allow_any_instance_of(MatrixAdminService).to receive(:create_room).and_return('!room123:localhost')
    end

    it 'creates a circle' do
      post '/api/v1/circles', params: { name: 'My Circle', max_members: 10 }, headers: headers
      expect(response).to have_http_status(:created)
      json = JSON.parse(response.body)
      expect(json['circle']['name']).to eq('My Circle')
      expect(json['invite_link']).to be_present
    end

    it 'requires authentication' do
      post '/api/v1/circles', params: { name: 'My Circle' }
      expect(response).to have_http_status(:unauthorized)
    end
  end
end
