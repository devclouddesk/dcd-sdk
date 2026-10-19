"""
DevCloudDesk Storage SDK for Python.

Official client for high-performance object storage, asset uploads,
and Cloudinary-style real-time image transformations.
"""

from .client import (
    StorageClient,
    create_storage_client,
    BucketClient,
    create_bucket_client,
    DCDStorage,
)
from .builder import TransformationBuilder
from .exceptions import (
    DCDStorageError,
    AuthenticationError,
    UploadError,
    NotFoundError,
)

__version__ = "1.0.0"
__all__ = [
    "StorageClient",
    "create_storage_client",
    "BucketClient",
    "create_bucket_client",
    "DCDStorage",
    "TransformationBuilder",
    "DCDStorageError",
    "AuthenticationError",
    "UploadError",
    "NotFoundError",
]
