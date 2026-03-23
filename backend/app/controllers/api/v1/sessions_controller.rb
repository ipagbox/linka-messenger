module Api
  module V1
    class SessionsController < ApplicationController
      include Authenticatable

      skip_before_action :authenticate!, only: [ :create ]

      def create
        user = User.find_by(matrix_user_id: params[:matrix_user_id])
        return render json: { error: "Invalid credentials" }, status: :unauthorized unless user
        return render json: { error: "Password is required" }, status: :unauthorized if params[:password].blank?

        begin
          matrix_result = MatrixAdminService.new.login_with_password(params[:matrix_user_id], params[:password])
        rescue MatrixAdminService::MatrixError
          return render json: { error: "Invalid credentials" }, status: :unauthorized
        end

        token = generate_token(user)
        render json: {
          token: token,
          matrix_access_token: matrix_result["access_token"],
          matrix_device_id: matrix_result["device_id"],
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
