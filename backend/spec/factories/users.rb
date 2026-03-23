FactoryBot.define do
  factory :user do
    sequence(:matrix_user_id) { |n| "@user#{n}:localhost" }
    sequence(:display_name) { |n| "User #{n}" }
    is_admin { false }

    trait :admin do
      is_admin { true }
      sequence(:matrix_user_id) { |n| "@admin#{n}:localhost" }
      sequence(:display_name) { |n| "Admin #{n}" }
    end
  end
end
