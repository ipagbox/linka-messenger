class MatrixAdminService
  include HTTParty

  BASE_URL = ENV.fetch("MATRIX_HOMESERVER_URL", "http://localhost:8008")
  ADMIN_TOKEN = ENV.fetch("SYNAPSE_ADMIN_TOKEN", "")

  def initialize
    @base_url = BASE_URL
    @admin_token = ADMIN_TOKEN
  end

  def create_user(username, display_name, password)
    user_id = "@#{username}:#{server_name}"
    response = put(
      "/_synapse/admin/v2/users/#{URI.encode_www_form_component(user_id)}",
      {
        password: password,
        displayname: display_name,
        admin: false,
        deactivated: false
      }
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

  private

  def server_name
    ENV.fetch("MATRIX_SERVER_NAME", "localhost")
  end

  def headers
    {
      "Authorization" => "Bearer #{@admin_token}",
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

  class MatrixError < StandardError; end
end
