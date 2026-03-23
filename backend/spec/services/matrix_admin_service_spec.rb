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
end
