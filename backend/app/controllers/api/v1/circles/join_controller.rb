module Api
  module V1
    module Circles
      class JoinController < ApplicationController
        include Authenticatable

        def create
          circle = Circle.find(params[:circle_id])
          membership = CircleMembership.find_by(user: current_user, circle: circle)

          unless membership
            render json: { error: "You are not a member of this circle" }, status: :forbidden
            return
          end

          matrix_service = MatrixAdminService.new
          joined_rooms = []
          errors = []

          [ circle.matrix_space_id, circle.matrix_general_room_id, circle.matrix_announcements_room_id ].compact.each do |room_id|
            matrix_service.join_room(current_user.matrix_user_id, room_id)
            joined_rooms << room_id
          rescue MatrixAdminService::MatrixError => e
            errors << { room_id: room_id, error: e.message }
          end

          if errors.any? && joined_rooms.empty?
            render json: { error: "Failed to join rooms", details: errors }, status: :service_unavailable
          else
            render json: { joined_rooms: joined_rooms, errors: errors }
          end
        rescue ActiveRecord::RecordNotFound
          render json: { error: "Circle not found" }, status: :not_found
        end
      end
    end
  end
end
