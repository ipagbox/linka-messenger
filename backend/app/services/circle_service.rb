class CircleService
  def create(name:, creator:, max_members: 15)
    raise LimitError, 'Circle creation limit reached' unless creator.can_create_circle?

    matrix_service = MatrixAdminService.new

    ActiveRecord::Base.transaction do
      begin
        space_id = matrix_service.create_space(name, creator.matrix_user_id)
        general_room_id = matrix_service.create_room("#{name} - General", space_id, creator.matrix_user_id)
        announcements_room_id = matrix_service.create_room("#{name} - Announcements", space_id, creator.matrix_user_id)
      rescue MatrixAdminService::MatrixError => e
        raise MatrixError, "Matrix space creation failed: #{e.message}"
      end

      circle = Circle.create!(
        name: name,
        creator: creator,
        max_members: max_members,
        matrix_space_id: space_id,
        matrix_general_room_id: general_room_id,
        matrix_announcements_room_id: announcements_room_id
      )

      CircleMembership.create!(
        user: creator,
        circle: circle,
        role: 'admin'
      )

      invite_token = InviteService.new.create(
        circle: circle,
        creator: creator
      )

      invite_link = "#{ENV.fetch('FRONTEND_URL', 'http://localhost:5173')}/invite/#{invite_token}"

      { circle: circle, invite_link: invite_link }
    end
  end

  class LimitError < StandardError; end
  class MatrixError < StandardError; end
end
