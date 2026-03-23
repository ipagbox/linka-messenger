FactoryBot.define do
  factory :circle_membership do
    association :user
    association :circle
    role { 'member' }

    trait :admin do
      role { 'admin' }
    end
  end
end
