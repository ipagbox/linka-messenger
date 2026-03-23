FactoryBot.define do
  factory :invite do
    token_digest { Digest::SHA256.hexdigest(SecureRandom.urlsafe_base64(32)) }
    association :circle
    association :creator, factory: :user
    max_uses { 15 }
    uses_count { 0 }
    expires_at { nil }

    trait :expired do
      expires_at { 1.day.ago }
    end

    trait :exhausted do
      uses_count { 15 }
      max_uses { 15 }
    end

    trait :expiring_soon do
      expires_at { 1.hour.from_now }
    end
  end
end
