module Api
  module V1
    class CirclesController < ApplicationController
      include Authenticatable

      def index
        circles = current_user.circles.includes(:creator, :circle_memberships)
        render json: circles.map { |c| serialize_circle(c) }
      end

      def show
        circle = current_user.circles.find(params[:id])
        render json: serialize_circle(circle)
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Circle not found" }, status: :not_found
      end

      def create
        result = CircleService.new.create(
          name: params[:name],
          creator: current_user,
          max_members: params[:max_members] || 15
        )

        render json: {
          circle: serialize_circle(result[:circle]),
          invite_link: result[:invite_link]
        }, status: :created
      rescue CircleService::LimitError => e
        render json: { error: e.message }, status: :unprocessable_entity
      rescue CircleService::MatrixError => e
        render json: { error: e.message }, status: :service_unavailable
      end

      private

      def serialize_circle(circle)
        {
          id: circle.id,
          name: circle.name,
          matrix_space_id: circle.matrix_space_id,
          matrix_general_room_id: circle.matrix_general_room_id,
          matrix_announcements_room_id: circle.matrix_announcements_room_id,
          max_members: circle.max_members,
          member_count: circle.member_count,
          creator: circle.creator ? { id: circle.creator.id, display_name: circle.creator.display_name } : nil,
          created_at: circle.created_at
        }
      end
    end
  end
end
