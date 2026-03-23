class Invite < ApplicationRecord
  include TokenDigestable

  belongs_to :circle
  belongs_to :creator, class_name: "User"

  validates :token_digest, presence: true, uniqueness: true
  validates :max_uses, presence: true, numericality: { greater_than: 0 }
  validates :uses_count, numericality: { greater_than_or_equal_to: 0 }

  scope :active, -> { where("expires_at IS NULL OR expires_at > ?", Time.current).where("uses_count < max_uses") }

  def valid_for_use?
    !expired? && !exhausted?
  end

  def expired?
    expires_at.present? && expires_at <= Time.current
  end

  def exhausted?
    uses_count >= max_uses
  end

  def consume!
    raise "Invite is not valid for use" unless valid_for_use?

    increment!(:uses_count)
  end
end
