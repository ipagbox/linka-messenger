class User < ApplicationRecord
  has_many :circle_memberships, dependent: :destroy
  has_many :circles, through: :circle_memberships
  has_many :created_circles, class_name: 'Circle', foreign_key: :creator_id, dependent: :nullify
  has_many :invites, foreign_key: :creator_id, dependent: :destroy

  validates :matrix_user_id, presence: true, uniqueness: true
  validates :display_name, presence: true, length: { minimum: 1, maximum: 50 }

  scope :admins, -> { where(is_admin: true) }

  def admin?
    is_admin?
  end

  def can_create_circle?
    created_circles_limit = ServerSetting.get('max_circles_per_user').to_i
    created_circles.count < created_circles_limit
  end

  def circles_count_within_limit?
    can_create_circle?
  end
end
