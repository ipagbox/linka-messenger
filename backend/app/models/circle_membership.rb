class CircleMembership < ApplicationRecord
  belongs_to :user
  belongs_to :circle

  validates :user_id, uniqueness: { scope: :circle_id, message: "already a member of this circle" }
  validates :role, inclusion: { in: %w[member admin] }

  scope :admins, -> { where(role: "admin") }
  scope :members_only, -> { where(role: "member") }
end
