Rails.application.routes.draw do
  get "/health", to: "health#show"
  get "up" => "rails/health#show", as: :rails_health_check

  namespace :api do
    namespace :v1 do
      post "invites/validate", to: "invites#validate"
      post "onboarding", to: "onboarding#create"

      resources :circles, only: [ :index, :show, :create ] do
        resources :invites, only: [ :create, :index ], module: :circles
        resources :members, only: [ :index ], module: :circles
        resource :join, only: [ :create ], module: :circles
      end

      resource :profile, only: [ :show, :update ]
      resources :sessions, only: [ :create, :destroy ]

      namespace :admin do
        resources :users, only: [ :index, :show, :destroy ]
        resource :server_settings, only: [ :show, :update ]
      end
    end
  end
end
