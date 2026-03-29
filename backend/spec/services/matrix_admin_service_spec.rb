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
    before do
      allow(ENV).to receive(:fetch).and_call_original
      allow(ENV).to receive(:fetch).with('ADMIN_PASSWORD', '').and_return('admin_password_123')
      allow(ENV).to receive(:fetch).with('ADMIN_DISPLAY_NAME', 'Admin').and_return('Admin')
      allow(ENV).to receive(:fetch).with('MATRIX_SERVER_NAME', 'localhost').and_return('localhost')
      allow(ENV).to receive(:[]).and_call_original
      allow(ENV).to receive(:[]).with('SYNAPSE_ADMIN_TOKEN').and_return(nil)
    end

    it 'falls back to shared-secret bootstrap when admin login fails' do
      expect(service).to receive(:login_with_password)
        .with('@admin:localhost', 'admin_password_123')
        .ordered
        .and_raise(MatrixAdminService::MatrixError, 'Invalid credentials')
      expect(service).to receive(:create_user)
        .with('admin', 'Admin', 'admin_password_123', admin: true)
        .ordered
        .and_return({})
      expect(service).to receive(:login_with_password)
        .with('@admin:localhost', 'admin_password_123')
        .ordered
        .and_return({ 'access_token' => 'syt_bootstrap_token' })

      headers = service.admin_headers
      expect(headers['Authorization']).to eq('Bearer syt_bootstrap_token')
      expect(headers['Content-Type']).to eq('application/json')
    end
  end
end
