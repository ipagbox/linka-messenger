class MatrixAdminService
  include HTTParty

  BASE_URL = ENV.fetch("MATRIX_HOMESERVER_URL", "http://localhost:8008")
  SHARED_SECRET = ENV.fetch("SYNAPSE_SHARED_SECRET", ENV.fetch("SYNAPSE_ADMIN_TOKEN", ""))

  def initialize
    @base_url = BASE_URL
    @shared_secret = SHARED_SECRET
    @admin_access_token = nil
  end

  def create_user(username, display_name, password, admin: false)
    nonce_response = self.class.get("#{@base_url}/_synapse/admin/v1/register")
    raise MatrixError, "Failed to fetch registration nonce: #{nonce_response.body}" unless nonce_response.success?

    nonce = nonce_response.parsed_response["nonce"]
    role = admin ? "admin" : "notadmin"
    mac = OpenSSL::HMAC.hexdigest(
      "SHA1",
      @shared_secret,
      [ nonce, username, password, role ].join("\x00")
    )

    response = self.class.post(
      "#{@base_url}/_synapse/admin/v1/register",
      headers: { "Content-Type" => "application/json" },
      body: {
        nonce: nonce,
        username: username,
        displayname: display_name,
        password: password,
        admin: admin,
        mac: mac
      }.to_json
    )
    raise MatrixError, "Failed to create user: #{response.body}" unless response.success?

    response.parsed_response
  end

  def create_space(name, creator_user_id)
    response = post_as_user(
      "/_matrix/client/v3/createRoom",
      {
        name: name,
        topic: "#{name} Circle",
        creation_content: { "type" => "m.space" },
        preset: "private_chat",
        power_level_content_override: {
          users: { creator_user_id => 100 }
        }
      },
      creator_user_id
    )
    raise MatrixError, "Failed to create space: #{response.body}" unless response.success?

    response.parsed_response["room_id"]
  end

  def create_room(name, space_id, creator_user_id)
    response = post_as_user(
      "/_matrix/client/v3/createRoom",
      {
        name: name,
        preset: "private_chat",
        initial_state: [
          {
            type: "m.room.guest_access",
            state_key: "",
            content: { "guest_access" => "forbidden" }
          }
        ]
      },
      creator_user_id
    )
    raise MatrixError, "Failed to create room: #{response.body}" unless response.success?

    room_id = response.parsed_response["room_id"]
    add_room_to_space(room_id, space_id, creator_user_id) if space_id
    room_id
  end

  def join_room(user_id, room_id)
    response = admin_post(
      "/_synapse/admin/v1/join/#{URI.encode_www_form_component(room_id)}",
      { user_id: user_id }
    )
    raise MatrixError, "Failed to join room: #{response.body}" unless response.success?

    response.parsed_response
  end

  def invite_to_room(user_id, room_id)
    response = post(
      "/_matrix/client/v3/rooms/#{URI.encode_www_form_component(room_id)}/invite",
      { user_id: user_id }
    )
    raise MatrixError, "Failed to invite to room: #{response.body}" unless response.success?

    response.parsed_response
  end

  def deactivate_user(user_id)
    response = post(
      "/_synapse/admin/v1/deactivate/#{URI.encode_www_form_component(user_id)}",
      { erase: true }
    )
    raise MatrixError, "Failed to deactivate user: #{response.body}" unless response.success?

    response.parsed_response
  end

  def get_user_access_token(username)
    user_id = "@#{username}:#{server_name}"
    response = post(
      "/_synapse/admin/v1/users/#{URI.encode_www_form_component(user_id)}/login",
      {}
    )
    raise MatrixError, "Failed to get access token: #{response.body}" unless response.success?

    response.parsed_response["access_token"]
  end

  def login_with_password(matrix_user_id, password)
    response = self.class.post(
      "#{@base_url}/_matrix/client/v3/login",
      headers: { "Content-Type" => "application/json" },
      body: {
        type: "m.login.password",
        identifier: { type: "m.id.user", user: matrix_user_id },
        password: password
      }.to_json
    )
    raise MatrixError, "Invalid credentials" unless response.success?

    response.parsed_response
  end

  def admin_headers
    headers
  end

  private

  def server_name
    ENV.fetch("MATRIX_SERVER_NAME", "localhost")
  end

  def headers
    {
      "Authorization" => "Bearer #{admin_access_token}",
      "Content-Type" => "application/json"
    }
  end

  def get(path)
    self.class.get("#{@base_url}#{path}", headers: headers)
  end

  def post(path, body)
    self.class.post("#{@base_url}#{path}", headers: headers, body: body.to_json)
  end

  def put(path, body)
    self.class.put("#{@base_url}#{path}", headers: headers, body: body.to_json)
  end

  def admin_post(path, body)
    self.class.post("#{@base_url}#{path}", headers: headers, body: body.to_json)
  end

  def post_as_user(path, body, user_id)
    access_token = get_user_access_token(user_id.gsub(/@|:.*/, ""))
    user_headers = {
      "Authorization" => "Bearer #{access_token}",
      "Content-Type" => "application/json"
    }
    self.class.post("#{@base_url}#{path}", headers: user_headers, body: body.to_json)
  end

  def add_room_to_space(room_id, space_id, user_id)
    access_token = get_user_access_token(user_id.gsub(/@|:.*/, ""))
    user_headers = {
      "Authorization" => "Bearer #{access_token}",
      "Content-Type" => "application/json"
    }
    self.class.put(
      "#{@base_url}/_matrix/client/v3/rooms/#{URI.encode_www_form_component(space_id)}/state/m.space.child/#{URI.encode_www_form_component(room_id)}",
      headers: user_headers,
      body: { via: [ server_name ], suggested: false }.to_json
    )
  end

  def admin_access_token
    @admin_access_token ||= begin
      env_token = ENV["SYNAPSE_ADMIN_TOKEN"]
      if env_token.present?
        env_token
      else
        admin_password = ENV.fetch("ADMIN_PASSWORD", "")
        raise MatrixError, "ADMIN_PASSWORD is not configured" if admin_password.blank?

        begin
          login_with_password("@admin:#{server_name}", admin_password)["access_token"]
        rescue MatrixError
          bootstrap_admin_via_shared_secret(admin_password)
          login_with_password("@admin:#{server_name}", admin_password)["access_token"]
        end
      end
    end
  end

  def bootstrap_admin_via_shared_secret(admin_password)
    create_user(
      "admin",
      ENV.fetch("ADMIN_DISPLAY_NAME", "Admin"),
      admin_password,
      admin: true
    )
  rescue MatrixError => e
    raise MatrixError, "Failed to bootstrap admin via shared secret: #{e.message}"
  end

  class MatrixError < StandardError; end
end
