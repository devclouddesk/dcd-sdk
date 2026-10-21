class StorageError(Exception):
    """Base exception for all DevCloudDesk Storage SDK errors."""
    def __init__(self, message: str, status_code: int = None, details: dict = None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.details = details or {}


class AuthenticationError(StorageError):
    """Raised when an API key is missing, invalid, or unauthorized."""
    pass


class NotFoundError(StorageError):
    """Raised when an asset or resource is not found on the storage cluster."""
    pass


class PayloadTooLargeError(StorageError):
    """Raised when a file exceeds the maximum allowed payload size."""
    pass


class UploadError(StorageError):
    """Raised when a file upload fails."""
    pass


class NetworkTimeoutError(StorageError):
    """Raised when a storage request times out."""
    pass

