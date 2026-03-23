module Api
  module V1
    class SessionsController < ApplicationController
      include Authenticatable

      skip_before_action :authenticate!, only: [ :create ]

      def create
        user = User.find_by(matrix_user_id: params[:matrix_user_id])
        return render json: { error: "Invalid credentials" }, status: :unauthorized unless user

        token = generate_token(user)
        render json: {
          token: token,
          user: {
            id: user.id,
            matrix_user_id: user.matrix_user_id,
            display_name: user.display_name,
            is_admin: user.is_admin
          }
        }
      end

      def destroy
        render json: { message: "Logged out" }
      end
    end
  end
end
