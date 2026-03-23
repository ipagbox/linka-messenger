module Api
  module V1
    class InvitesController < ApplicationController
      include Authenticatable

      skip_before_action :authenticate!, only: [ :validate ]

      def validate
        token = params[:token]
        invite = InviteService.new.validate(token)

        if invite
          render json: {
            valid: true,
            circle_name: invite.circle.name,
            expires_at: invite.expires_at
          }
        else
          render json: { valid: false, reason: "Invalid, expired, or exhausted invite" }, status: :not_found
        end
      end
    end
  end
end
