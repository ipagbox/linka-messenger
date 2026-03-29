require 'rails_helper'

RSpec.describe 'Circle Join API', type: :request do
  let(:user) { create(:user) }
  let(:token) do
    payload = { user_id: user.id, exp: 30.days.from_now.to_i }
    JWT.encode(payload, ENV.fetch('JWT_SECRET', 'development_jwt_secret'), 'HS256')
  end
  let(:headers) { { 'Authorization' => "Bearer #{token}" } }
  let(:circle) { create(:circle, :with_matrix, creator: user) }

  describe 'POST /api/v1/circles/:circle_id/join' do
    context 'when user is a member of the circle' do
      before do
        create(:circle_membership, user: user, circle: circle)
        allow_any_instance_of(MatrixAdminService).to receive(:join_room).and_return({})
      end

      it 'joins the user to circle rooms' do
        post "/api/v1/circles/#{circle.id}/join", headers: headers

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json['joined_rooms']).to include(circle.matrix_general_room_id)
        expect(json['joined_rooms']).to include(circle.matrix_announcements_room_id)
      end

      it 'calls join_room for each room' do
        expect_any_instance_of(MatrixAdminService).to receive(:join_room)
          .with(user.matrix_user_id, circle.matrix_general_room_id)
        expect_any_instance_of(MatrixAdminService).to receive(:join_room)
          .with(user.matrix_user_id, circle.matrix_announcements_room_id)

        post "/api/v1/circles/#{circle.id}/join", headers: headers
      end
    end

    context 'when user is NOT a member of the circle' do
      it 'returns 403 forbidden' do
        post "/api/v1/circles/#{circle.id}/join", headers: headers

        expect(response).to have_http_status(:forbidden)
        json = JSON.parse(response.body)
        expect(json['error']).to include('not a member')
      end
    end

    context 'when circle does not exist' do
      it 'returns 404 not found' do
        post '/api/v1/circles/99999/join', headers: headers

        expect(response).to have_http_status(:not_found)
      end
    end

    context 'when Matrix join fails for some rooms' do
      before do
        create(:circle_membership, user: user, circle: circle)
        allow_any_instance_of(MatrixAdminService).to receive(:join_room)
          .with(user.matrix_user_id, circle.matrix_space_id)
          .and_return({})
        allow_any_instance_of(MatrixAdminService).to receive(:join_room)
          .with(user.matrix_user_id, circle.matrix_general_room_id)
          .and_return({})
        allow_any_instance_of(MatrixAdminService).to receive(:join_room)
          .with(user.matrix_user_id, circle.matrix_announcements_room_id)
          .and_raise(MatrixAdminService::MatrixError, 'Room not found')
      end

      it 'returns partial success with errors' do
        post "/api/v1/circles/#{circle.id}/join", headers: headers

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json['joined_rooms']).to include(circle.matrix_general_room_id)
        expect(json['errors'].length).to eq(1)
      end
    end

    context 'when all Matrix joins fail' do
      before do
        create(:circle_membership, user: user, circle: circle)
        allow_any_instance_of(MatrixAdminService).to receive(:join_room)
          .and_raise(MatrixAdminService::MatrixError, 'Server error')
      end

      it 'returns 503 service unavailable' do
        post "/api/v1/circles/#{circle.id}/join", headers: headers

        expect(response).to have_http_status(:service_unavailable)
      end
    end

    it 'requires authentication' do
      post "/api/v1/circles/#{circle.id}/join"
      expect(response).to have_http_status(:unauthorized)
    end
  end
end
