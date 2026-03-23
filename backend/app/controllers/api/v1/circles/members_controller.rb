module Api
  module V1
    module Circles
      class MembersController < ApplicationController
        include Authenticatable

        def index
          circle = current_user.circles.find(params[:circle_id])
          members = circle.members.includes(:circle_memberships)
          render json: members.map { |m|
            membership = m.circle_memberships.find { |cm| cm.circle_id == circle.id }
            {
              id: m.id,
              matrix_user_id: m.matrix_user_id,
              display_name: m.display_name,
              role: membership&.role || "member"
            }
          }
        rescue ActiveRecord::RecordNotFound
          render json: { error: "Circle not found" }, status: :not_found
        end
      end
    end
  end
end
