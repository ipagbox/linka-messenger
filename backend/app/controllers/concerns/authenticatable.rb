module Authenticatable
  extend ActiveSupport::Concern

  included do
    before_action :authenticate!
  end

  def authenticate!
    token = request.headers["Authorization"]&.split(" ")&.last
    raise AuthenticationError, "Missing token" if token.blank?

    payload = JWT.decode(token, ENV.fetch("JWT_SECRET", "development_jwt_secret"), true, algorithm: "HS256")
    @current_user = User.find(payload.first["user_id"])
  rescue JWT::DecodeError, JWT::ExpiredSignature, ActiveRecord::RecordNotFound
    render json: { error: "Unauthorized" }, status: :unauthorized
  rescue AuthenticationError
    render json: { error: "Unauthorized" }, status: :unauthorized
  end

  def current_user
    @current_user
  end

  def require_admin!
    render json: { error: "Forbidden" }, status: :forbidden unless current_user&.is_admin?
  end

  def generate_token(user)
    payload = {
      user_id: user.id,
      exp: 30.days.from_now.to_i
    }
    JWT.encode(payload, ENV.fetch("JWT_SECRET", "development_jwt_secret"), "HS256")
  end

  class AuthenticationError < StandardError; end
end
