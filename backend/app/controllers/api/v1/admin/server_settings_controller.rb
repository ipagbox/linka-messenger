module Api
  module V1
    module Admin
      class ServerSettingsController < ApplicationController
        include Authenticatable
        before_action :require_admin!

        def show
          settings = ServerSetting.all.order(:key)
          render json: settings.map { |s| { key: s.key, value: s.value, description: s.description } }
        end

        def update
          settings_params = params[:settings] || {}
          settings_params.each do |key, value|
            ServerSetting.set(key, value)
          end
          render json: { message: "Settings updated" }
        end
      end
    end
  end
end
