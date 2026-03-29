class OnboardingService
  def register(token:, display_name:)
    invite = InviteService.new.validate(token)
    raise InvalidInviteError, "Invalid or expired invite" unless invite

    username = generate_username(display_name)
    password = SecureRandom.hex(16)

    matrix_service = MatrixAdminService.new

    ActiveRecord::Base.transaction do
      begin
        matrix_response = matrix_service.create_user(username, display_name, password)
      rescue MatrixAdminService::MatrixError => e
        raise MatrixError, "Matrix user creation failed: #{e.message}"
      end

      user = User.create!(
        matrix_user_id: "@#{username}:#{ENV.fetch('MATRIX_SERVER_NAME', 'localhost')}",
        display_name: display_name
      )

      InviteService.new.consume(token, user)

      begin
        login_result = matrix_service.login_with_password(user.matrix_user_id, password)
        access_token = login_result["access_token"]
        device_id = login_result["device_id"]

        [ invite.circle.matrix_general_room_id, invite.circle.matrix_announcements_room_id ].compact.each do |room_id|
          join_room_with_retry(matrix_service, user.matrix_user_id, room_id)
        rescue MatrixAdminService::MatrixError => e
          Rails.logger.error("Failed to join user #{user.matrix_user_id} to room #{room_id}: #{e.message}")
        end
      rescue MatrixAdminService::MatrixError => e
        access_token = nil
        device_id = nil
      end

      rails_token = generate_rails_token(user)

      {
        user: user,
        access_token: access_token,
        device_id: device_id,
        rails_token: rails_token
      }
    end
  rescue ActiveRecord::RecordNotUnique
    raise ConflictError, "Username already taken"
  end

  def bootstrap_admin(display_name:, password:)
    username = "admin"
    matrix_service = MatrixAdminService.new

    matrix_service.create_user(username, display_name, password, admin: true)

    User.find_or_create_by!(
      matrix_user_id: "@#{username}:#{ENV.fetch('MATRIX_SERVER_NAME', 'localhost')}"
    ) do |u|
      u.display_name = display_name
      u.is_admin = true
    end
  end

  private

  def generate_username(display_name)
    base = display_name.downcase.gsub(/[^a-z0-9]/, "_").squeeze("_").gsub(/^_|_$/, "")
    base = "user" if base.blank?
    "#{base}_#{SecureRandom.hex(4)}"
  end

  def join_room_with_retry(matrix_service, user_id, room_id, retries: 3)
    attempts = 0
    begin
      attempts += 1
      matrix_service.join_room(user_id, room_id)
    rescue MatrixAdminService::MatrixError => e
      if attempts < retries
        sleep(0.5 * attempts)
        retry
      end
      raise e
    end
  end

  def generate_rails_token(user)
    payload = {
      user_id: user.id,
      exp: 30.days.from_now.to_i
    }
    JWT.encode(payload, ENV.fetch("JWT_SECRET", "development_jwt_secret"), "HS256")
  end

  class InvalidInviteError < StandardError; end
  class MatrixError < StandardError; end
  class ConflictError < StandardError; end
end
