ServerSetting.load_defaults!
puts 'Server settings loaded'

admin_display_name = ENV.fetch('ADMIN_DISPLAY_NAME', 'Admin')
admin_password = ENV.fetch('ADMIN_PASSWORD', nil)
server_name = ENV.fetch('MATRIX_SERVER_NAME', 'localhost')
admin_matrix_id = "@admin:#{server_name}"

admin = User.find_by(matrix_user_id: admin_matrix_id)

if admin.nil?
  # First run — create admin in both Synapse and Rails
  begin
    raise 'ADMIN_PASSWORD not set' if admin_password.blank?

    OnboardingService.new.bootstrap_admin(
      display_name: admin_display_name,
      password: admin_password
    )
    puts "Admin created: #{admin_matrix_id}"
  rescue StandardError => e
    puts "Admin creation failed: #{e.message}"
    puts "Admin will NOT be created without Synapse — fix the issue and run db:seed again"
  end
elsif admin_password.present?
  # Admin exists in Rails — ensure they also exist in Synapse with correct password
  begin
    matrix_service = MatrixAdminService.new
    matrix_service.create_user('admin', admin_display_name, admin_password)
    puts "Admin synced to Synapse: #{admin_matrix_id}"
  rescue MatrixAdminService::MatrixError => e
    # User might already exist — try to reset password via admin API
    begin
      response = HTTParty.put(
        "#{ENV.fetch('MATRIX_HOMESERVER_URL', 'http://synapse:8008')}/_synapse/admin/v2/users/#{URI.encode_www_form_component(admin_matrix_id)}",
        headers: {
          'Authorization' => "Bearer #{ENV.fetch('SYNAPSE_ADMIN_TOKEN', '')}",
          'Content-Type' => 'application/json'
        },
        body: { password: admin_password, admin: true }.to_json
      )
      if response.success?
        puts "Admin password updated in Synapse: #{admin_matrix_id}"
      else
        puts "Failed to update admin in Synapse: #{response.body}"
      end
    rescue StandardError => e2
      puts "Synapse admin sync failed: #{e2.message}"
    end
  end
end
