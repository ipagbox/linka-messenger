class HealthController < ApplicationController
  def show
    render json: { status: "ok", version: "0.1.0" }
  end
end
