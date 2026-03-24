require 'rails_helper'

RSpec.describe MatrixAdminService, type: :service do
  let(:service) { described_class.new }

  describe '#create_user' do
    it 'creates a user via admin API' do
      stub_matrix_create_user('testuser')
      expect { service.create_user('testuser', 'Test User', 'password123') }.not_to raise_error
    end

    it 'raises MatrixError on failure' do
      stub_matrix_create_user_failure('testuser', 500)
      expect { service.create_user('testuser', 'Test User', 'password123') }
        .to raise_error(MatrixAdminService::MatrixError)
    end
  end

  describe '#deactivate_user' do
    it 'deactivates a user' do
      user_id = '@testuser:localhost'
      stub_matrix_deactivate_user(user_id)
      expect { service.deactivate_user(user_id) }.not_to raise_error
    end
  end

  describe '#get_user_access_token' do
    it 'returns access token for user' do
      stub_matrix_get_user_access_token('testuser', 'test_token_123')
      token = service.get_user_access_token('testuser')
      expect(token).to eq('test_token_123')
    end
  end

  describe '#admin_headers' do
    around do |example|
      original_admin_token = ENV["SYNAPSE_ADMIN_TOKEN"]
      original_admin_password = ENV["ADMIN_PASSWORD"]
      original_shared_secret = ENV["SYNAPSE_SHARED_SECRET"]

      ENV["SYNAPSE_ADMIN_TOKEN"] = nil
      ENV["ADMIN_PASSWORD"] = "new-rotated-password"
      ENV["SYNAPSE_SHARED_SECRET"] = "shared-secret"

      example.run
    ensure
      ENV["SYNAPSE_ADMIN_TOKEN"] = original_admin_token
      ENV["ADMIN_PASSWORD"] = original_admin_password
      ENV["SYNAPSE_SHARED_SECRET"] = original_shared_secret
    end

    it 'falls back to shared-secret bootstrap when admin login fails' do
      stub_request(:post, "#{MatrixStubs::MATRIX_URL}/_matrix/client/v3/login")
        .with(body: /"user":"@admin:#{MatrixStubs::SERVER_NAME}".*new-rotated-password/)
        .to_return(status: 401, body: { errcode: "M_FORBIDDEN" }.to_json)

      stub_request(:post, "#{MatrixStubs::MATRIX_URL}/_matrix/client/v3/login")
        .with(body: /"user":"@seed_admin_/)
        .to_return(status: 200, body: { access_token: "bootstrap_token" }.to_json)

      stub_matrix_create_user("bootstrap_admin")
      stub_request(:post, /#{Regexp.escape(MatrixStubs::MATRIX_URL)}\/_synapse\/admin\/v1\/deactivate\/.*/)
        .to_return(status: 200, body: { id_server_unbind_result: "success" }.to_json)

      headers = service.admin_headers
      expect(headers["Authorization"]).to eq("Bearer bootstrap_token")
    end
  end
end
