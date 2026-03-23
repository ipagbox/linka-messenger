module Api
  module V1
    module Circles
      class InvitesController < ApplicationController
        include Authenticatable

        def index
          circle = current_user.circles.find(params[:circle_id])
          invites = circle.invites.includes(:creator)
          render json: invites.map { |i| serialize_invite(i) }
        rescue ActiveRecord::RecordNotFound
          render json: { error: 'Circle not found' }, status: :not_found
        end

        def create
          circle = current_user.circles.find(params[:circle_id])
          service = InviteService.new
          token = service.create(
            circle: circle,
            creator: current_user,
            max_uses: params[:max_uses]&.to_i || ServerSetting.get('default_invite_max_uses').to_i,
            expires_in: params[:expires_in_hours]&.to_i&.hours
          )

          invite = circle.invites.last
          render json: {
            token: token,
            invite_link: "#{ENV.fetch('FRONTEND_URL', 'http://localhost:5173')}/invite/#{token}",
            invite: serialize_invite(invite)
          }, status: :created
        rescue ActiveRecord::RecordNotFound
          render json: { error: 'Circle not found' }, status: :not_found
        end

        private

        def serialize_invite(invite)
          {
            id: invite.id,
            max_uses: invite.max_uses,
            uses_count: invite.uses_count,
            expires_at: invite.expires_at,
            created_at: invite.created_at
          }
        end
      end
    end
  end
end
