class ServerSetting < ApplicationRecord
  validates :key, presence: true, uniqueness: true
  validates :value_type, inclusion: { in: %w[string integer boolean] }

  DEFAULTS = {
    "max_circles_per_user" => { value: "5", value_type: "integer", description: "Maximum circles a user can create" },
    "default_invite_max_uses" => { value: "15", value_type: "integer", description: "Default max uses for invites" },
    "default_invite_expiry_days" => { value: "7", value_type: "integer", description: "Default invite expiry in days" },
    "max_members_per_circle" => { value: "50", value_type: "integer", description: "Maximum members per circle" },
    "registration_enabled" => { value: "false", value_type: "boolean", description: "Allow new registrations" }
  }.freeze

  def self.get(key)
    Rails.cache.fetch("server_setting:#{key}", expires_in: 5.minutes) do
      find_by(key: key)&.value || DEFAULTS.dig(key, :value)
    end
  end

  def self.set(key, value)
    Rails.cache.delete("server_setting:#{key}")
    setting = find_or_initialize_by(key: key)
    default = DEFAULTS[key] || {}
    setting.update!(
      value: value.to_s,
      value_type: default[:value_type] || "string",
      description: setting.description || default[:description]
    )
  end

  def self.load_defaults!
    DEFAULTS.each do |key, attrs|
      find_or_create_by(key: key) do |s|
        s.value = attrs[:value]
        s.value_type = attrs[:value_type]
        s.description = attrs[:description]
      end
    end
  end
end
