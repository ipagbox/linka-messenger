module MatrixStubs
  MATRIX_URL = ENV.fetch('MATRIX_HOMESERVER_URL', 'http://localhost:8008')
  SERVER_NAME = ENV.fetch('MATRIX_SERVER_NAME', 'localhost')

  def stub_matrix_create_user(username = nil, response = {})
    stub_request(:get, "#{MATRIX_URL}/_synapse/admin/v1/register")
      .to_return(
        status: 200,
        body: { nonce: "test-nonce" }.to_json,
        headers: { 'Content-Type' => 'application/json' }
      )

    stub_request(:post, "#{MATRIX_URL}/_synapse/admin/v1/register")
      .to_return(
        status: 200,
        body: {
          user_id: "@#{username || 'user'}:#{SERVER_NAME}",
          access_token: "syt_#{SecureRandom.hex(16)}",
          device_id: "DEVICE123"
        }.merge(response).to_json,
        headers: { 'Content-Type' => 'application/json' }
      )
  end

  def stub_matrix_create_room(response = {})
    room_id = response[:room_id] || "!#{SecureRandom.hex(8)}:#{SERVER_NAME}"
    stub_request(:post, "#{MATRIX_URL}/_matrix/client/v3/createRoom")
      .to_return(
        status: 200,
        body: { room_id: room_id }.merge(response).to_json,
        headers: { 'Content-Type' => 'application/json' }
      )
  end

  def stub_matrix_join_room(room_id = nil, user_id = nil)
    path = room_id ? "#{MATRIX_URL}/_synapse/admin/v1/join/#{URI.encode_www_form_component(room_id)}" : /#{MATRIX_URL}\/_synapse\/admin\/v1\/join/
    stub_request(:post, path)
      .to_return(
        status: 200,
        body: { joined_rooms: [ room_id ].compact }.to_json,
        headers: { 'Content-Type' => 'application/json' }
      )
  end

  def stub_matrix_get_user_access_token(username = nil, access_token = nil)
    url = if username.nil? || username.is_a?(Regexp)
      /#{Regexp.escape(MATRIX_URL)}\/_synapse\/admin\/v1\/users\/.*\/login/
    else
      user_id = "@#{username}:#{SERVER_NAME}"
      "#{MATRIX_URL}/_synapse/admin/v1/users/#{URI.encode_www_form_component(user_id)}/login"
    end
    access_token ||= "syt_#{SecureRandom.hex(16)}"
    stub_request(:post, url)
      .to_return(
        status: 200,
        body: { access_token: access_token }.to_json,
        headers: { 'Content-Type' => 'application/json' }
      )
  end

  def stub_matrix_password_login(user_id = nil, response = {})
    body = {
      user_id: user_id || "@user:#{SERVER_NAME}",
      access_token: "syt_#{SecureRandom.hex(16)}",
      device_id: "DEVICE123"
    }.merge(response)

    stub_request(:post, "#{MATRIX_URL}/_matrix/client/v3/login")
      .to_return(
        status: 200,
        body: body.to_json,
        headers: { 'Content-Type' => 'application/json' }
      )
  end

  def stub_matrix_space_child(space_id, room_id)
    stub_request(:put, /#{MATRIX_URL}\/_matrix\/client\/v3\/rooms\/.*\/state\/m\.space\.child\//)
      .to_return(
        status: 200,
        body: {}.to_json,
        headers: { 'Content-Type' => 'application/json' }
      )
  end

  def stub_matrix_deactivate_user(user_id)
    stub_request(:post, "#{MATRIX_URL}/_synapse/admin/v1/deactivate/#{URI.encode_www_form_component(user_id)}")
      .to_return(
        status: 200,
        body: { id_server_unbind_result: 'success' }.to_json,
        headers: { 'Content-Type' => 'application/json' }
      )
  end

  def stub_matrix_create_user_failure(username, status = 500)
    stub_request(:get, "#{MATRIX_URL}/_synapse/admin/v1/register")
      .to_return(
        status: 200,
        body: { nonce: "test-nonce" }.to_json,
        headers: { 'Content-Type' => 'application/json' }
      )

    stub_request(:post, "#{MATRIX_URL}/_synapse/admin/v1/register")
      .to_return(
        status: status,
        body: { errcode: 'M_UNKNOWN', error: 'Server error' }.to_json,
        headers: { 'Content-Type' => 'application/json' }
      )
  end
end

RSpec.configure do |config|
  config.include MatrixStubs
end
