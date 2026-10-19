import unittest
from dcd_storage_client import (
    StorageClient,
    BucketClient,
    create_bucket_client,
    create_storage_client,
    AuthenticationError,
    NotFoundError,
    PayloadTooLargeError,
    DCDStorageError,
)


class TestStorageClient(unittest.TestCase):
    def test_client_instantiation(self):
        client1 = BucketClient(endpoint="http://localhost:7100", api_key="sk_test")
        client2 = StorageClient(endpoint="http://localhost:7100")
        client3 = create_bucket_client(endpoint="http://localhost:7100")
        client4 = create_storage_client(endpoint="http://localhost:7100")

        self.assertIsInstance(client1, StorageClient)
        self.assertIsInstance(client2, StorageClient)
        self.assertIsInstance(client3, StorageClient)
        self.assertIsInstance(client4, StorageClient)

    def test_missing_endpoint_raises(self):
        with self.assertRaises(ValueError):
            StorageClient(endpoint="")

    def test_missing_api_key_for_signed_upload(self):
        client = BucketClient(endpoint="http://localhost:7100")
        with self.assertRaises(AuthenticationError):
            client.create_signed_upload_token()

    def test_custom_exceptions(self):
        auth_err = AuthenticationError("Unauthorized", 401)
        self.assertIsInstance(auth_err, DCDStorageError)
        self.assertEqual(auth_err.status_code, 401)

        nf_err = NotFoundError("Missing", 404)
        self.assertIsInstance(nf_err, DCDStorageError)
        self.assertEqual(nf_err.status_code, 404)

        large_err = PayloadTooLargeError("Too Big", 413)
        self.assertIsInstance(large_err, DCDStorageError)
        self.assertEqual(large_err.status_code, 413)


if __name__ == "__main__":
    unittest.main()
