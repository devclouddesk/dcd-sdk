class DCDStorageError(Exception):
    """Base exception for all DevCloudDesk Storage SDK errors."""
    pass


class AuthenticationError(DCDStorageError):
    """Raised when an API key is missing, invalid, or unauthorized."""
    pass


class UploadError(DCDStorageError):
    """Raised when a file upload fails."""
    pass


class NotFoundError(DCDStorageError):
    """Raised when an asset is not found on the storage cluster."""
    pass
