module Api
  module V1
    class OnboardingController < ApplicationController
      def create
        result = OnboardingService.new.register(
          token: params[:token],
          display_name: params[:display_name]
        )

        render json: {
          matrix_user_id: result[:user].matrix_user_id,
          access_token: result[:access_token],
          device_id: result[:device_id],
          rails_token: result[:rails_token]
        }, status: :created
      rescue OnboardingService::InvalidInviteError => e
        render json: { error: e.message }, status: :unprocessable_entity
      rescue OnboardingService::MatrixError => e
        render json: { error: e.message }, status: :service_unavailable
      rescue OnboardingService::ConflictError => e
        render json: { error: e.message }, status: :conflict
      end
    end
  end
end
