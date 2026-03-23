ServerSetting.load_defaults!
puts 'Server settings loaded'

if User.count == 0
  begin
    admin = OnboardingService.new.bootstrap_admin(
      display_name: ENV.fetch('ADMIN_DISPLAY_NAME', 'Admin'),
      password: ENV.fetch('ADMIN_PASSWORD', SecureRandom.hex(16))
    )
    puts "Admin created: #{admin.matrix_user_id}"
  rescue StandardError => e
    puts "Admin creation failed (Synapse may not be running): #{e.message}"
    admin = User.create!(
      matrix_user_id: "@admin:#{ENV.fetch('MATRIX_SERVER_NAME', 'localhost')}",
      display_name: ENV.fetch('ADMIN_DISPLAY_NAME', 'Admin'),
      is_admin: true
    )
    puts "Local admin user created: #{admin.matrix_user_id}"
  end
end
