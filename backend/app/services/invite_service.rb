class InviteService
  def create(circle:, creator:, max_uses: nil, expires_in: nil)
    max_uses ||= ServerSetting.get('default_invite_max_uses').to_i
    max_uses = 15 if max_uses <= 0

    invite = Invite.new(
      circle: circle,
      creator: creator,
      max_uses: max_uses,
      expires_at: expires_in ? Time.current + expires_in : nil
    )

    token = invite.generate_token
    invite.save!
    token
  end

  def validate(token)
    return nil if token.blank?

    invite = Invite.find_by_token(token)
    return nil unless invite&.valid_for_use?

    invite
  end

  def consume(token, user)
    invite = validate(token)
    raise InvalidTokenError, 'Invalid or expired invite' unless invite

    ActiveRecord::Base.transaction do
      invite.consume!
      CircleMembership.create!(
        user: user,
        circle: invite.circle,
        role: 'member'
      )
    end

    invite
  end

  class InvalidTokenError < StandardError; end
end
