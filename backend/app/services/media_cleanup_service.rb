class MediaCleanupService
  def cleanup_expired
    retention_days = ServerSetting.get("media_retention_days").to_i
    retention_days = 30 if retention_days <= 0

    # Trigger Synapse media cleanup via Admin API
    matrix_service = MatrixAdminService.new
    begin
      matrix_service.delete_old_media(retention_days.days.ago)
    rescue MatrixAdminService::MatrixError => e
      Rails.logger.error "Media cleanup failed: #{e.message}"
      raise
    end
  end
end
