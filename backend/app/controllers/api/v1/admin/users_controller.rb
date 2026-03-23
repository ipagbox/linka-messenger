module Api
  module V1
    module Admin
      class UsersController < ApplicationController
        include Authenticatable
        before_action :require_admin!

        def index
          users = User.all.order(:created_at)
          render json: users.map { |u|
            { id: u.id, matrix_user_id: u.matrix_user_id, display_name: u.display_name,
              is_admin: u.is_admin, created_at: u.created_at }
          }
        end

        def show
          user = User.find(params[:id])
          render json: {
            id: user.id,
            matrix_user_id: user.matrix_user_id,
            display_name: user.display_name,
            is_admin: user.is_admin,
            circles_count: user.circles.count,
            created_at: user.created_at
          }
        rescue ActiveRecord::RecordNotFound
          render json: { error: "User not found" }, status: :not_found
        end

        def destroy
          user = User.find(params[:id])
          return render json: { error: "Cannot delete yourself" }, status: :unprocessable_entity if user == current_user

          MatrixAdminService.new.deactivate_user(user.matrix_user_id)
          user.destroy
          render json: { message: "User deleted" }
        rescue ActiveRecord::RecordNotFound
          render json: { error: "User not found" }, status: :not_found
        end
      end
    end
  end
end
