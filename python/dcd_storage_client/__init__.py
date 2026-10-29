"""
DevCloudDesk Storage SDK for Python.

Official client for high-performance object storage, asset uploads,
and Cloudinary-style real-time image transformations.
"""

from .client import (
    StorageClient,
    create_storage_client,
    Storage,
    create_client,
    BucketClient,
    create_bucket_client,
)
from .builder import TransformationBuilder
from .exceptions import (
    StorageError,
    AuthenticationError,
    UploadError,
    NotFoundError,
    PayloadTooLargeError,
    NetworkTimeoutError,
)

__version__ = "1.0.3"
__all__ = [
    "StorageClient",
    "create_storage_client",
    "Storage",
    "create_client",
    "BucketClient",
    "create_bucket_client",
    "TransformationBuilder",
    "StorageError",
    "AuthenticationError",
    "UploadError",
    "NotFoundError",
    "PayloadTooLargeError",
    "NetworkTimeoutError",
]
