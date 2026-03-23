require 'rails_helper'

RSpec.describe CircleService, type: :service do
  let(:service) { described_class.new }
  let(:creator) { create(:user) }

  before do
    create(:server_setting, key: 'max_circles_per_user', value: '5', value_type: 'integer')
    create(:server_setting, key: 'default_invite_max_uses', value: '15', value_type: 'integer')
    stub_matrix_get_user_access_token(/.*/)
    stub_matrix_create_room
    stub_matrix_space_child(nil, nil)
    allow_any_instance_of(MatrixAdminService).to receive(:create_space).and_return('!space123:localhost')
    allow_any_instance_of(MatrixAdminService).to receive(:create_room).and_return('!room123:localhost')
  end

  describe '#create' do
    it 'creates a circle' do
      expect { service.create(name: 'Test Circle', creator: creator) }.to change(Circle, :count).by(1)
    end

    it 'creates creator membership as admin' do
      service.create(name: 'Test Circle', creator: creator)
      circle = Circle.last
      membership = CircleMembership.find_by(user: creator, circle: circle)
      expect(membership.role).to eq('admin')
    end

    it 'creates an invite for the circle' do
      service.create(name: 'Test Circle', creator: creator)
      circle = Circle.last
      expect(circle.invites.count).to be >= 1
    end

    it 'returns circle and invite_link' do
      result = service.create(name: 'Test Circle', creator: creator)
      expect(result[:circle]).to be_a(Circle)
      expect(result[:invite_link]).to be_present
    end

    it 'raises LimitError when at circle limit' do
      allow(creator).to receive(:can_create_circle?).and_return(false)

      expect { service.create(name: 'Test Circle', creator: creator) }
        .to raise_error(CircleService::LimitError)
    end
  end
end
