module TokenDigestable
  extend ActiveSupport::Concern

  class_methods do
    def find_by_token(token)
      digest = digest_token(token)
      find_by(token_digest: digest)
    end

    def digest_token(token)
      Digest::SHA256.hexdigest(token)
    end
  end

  def generate_token
    token = SecureRandom.urlsafe_base64(32)
    self.token_digest = self.class.digest_token(token)
    token
  end
end
