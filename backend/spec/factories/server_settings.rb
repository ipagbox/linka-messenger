FactoryBot.define do
  factory :server_setting do
    sequence(:key) { |n| "setting_#{n}" }
    value { 'test_value' }
    value_type { 'string' }
    description { 'Test setting' }
  end
end
