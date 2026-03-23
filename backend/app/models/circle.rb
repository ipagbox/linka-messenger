class Circle < ApplicationRecord
  belongs_to :creator, class_name: "User", optional: true
  has_many :circle_memberships, dependent: :destroy
  has_many :members, through: :circle_memberships, source: :user
  has_many :invites, dependent: :destroy

  validates :name, presence: true, length: { minimum: 1, maximum: 100 }
  validates :max_members, presence: true, numericality: { greater_than: 0 }

  def full?
    member_count >= max_members
  end

  def member_count
    circle_memberships.count
  end

  def has_member?(user)
    members.include?(user)
  end
end
