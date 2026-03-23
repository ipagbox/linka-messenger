FactoryBot.define do
  factory :circle do
    sequence(:name) { |n| "Circle #{n}" }
    max_members { 15 }
    association :creator, factory: :user

    trait :with_matrix do
      sequence(:matrix_space_id) { |n| "!space#{n}:localhost" }
      sequence(:matrix_general_room_id) { |n| "!general#{n}:localhost" }
      sequence(:matrix_announcements_room_id) { |n| "!announcements#{n}:localhost" }
    end
  end
end
