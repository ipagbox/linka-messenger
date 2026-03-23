module Api
  module V1
    class ProfilesController < ApplicationController
      include Authenticatable

      def show
        render json: {
          id: current_user.id,
          matrix_user_id: current_user.matrix_user_id,
          display_name: current_user.display_name,
          is_admin: current_user.is_admin
        }
      end

      def update
        if current_user.update(display_name: params[:display_name])
          render json: {
            id: current_user.id,
            matrix_user_id: current_user.matrix_user_id,
            display_name: current_user.display_name
          }
        else
          render json: { errors: current_user.errors.full_messages }, status: :unprocessable_entity
        end
      end
    end
  end
end
