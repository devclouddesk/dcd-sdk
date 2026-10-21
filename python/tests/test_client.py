import os
import unittest
from dcd_storage_client import (
    StorageClient,
    Storage,
    create_client,
    BucketClient,
    create_bucket_client,
    create_storage_client,
    AuthenticationError,
    NotFoundError,
    PayloadTooLargeError,
    StorageError,
    NetworkTimeoutError,
)


class TestStorageClient(unittest.TestCase):
    def setUp(self):
        self.orig_endpoint = os.environ.get("DCD_STORAGE_ENDPOINT")
        self.orig_key = os.environ.get("DCD_STORAGE_API_KEY")
        if "DCD_STORAGE_ENDPOINT" in os.environ:
            del os.environ["DCD_STORAGE_ENDPOINT"]
        if "DCD_STORAGE_API_KEY" in os.environ:
            del os.environ["DCD_STORAGE_API_KEY"]

    def tearDown(self):
        if self.orig_endpoint:
            os.environ["DCD_STORAGE_ENDPOINT"] = self.orig_endpoint
        if self.orig_key:
            os.environ["DCD_STORAGE_API_KEY"] = self.orig_key

    def test_client_instantiation(self):
        client1 = BucketClient(endpoint="http://localhost:7100", api_key="sk_test")
        client2 = StorageClient(endpoint="http://localhost:7100")
        client3 = create_bucket_client(endpoint="http://localhost:7100")
        client4 = create_storage_client(endpoint="http://localhost:7100")
        client5 = Storage(endpoint="http://localhost:7100")
        client6 = create_client(endpoint="http://localhost:7100")

        self.assertIsInstance(client1, StorageClient)
        self.assertIsInstance(client2, StorageClient)
        self.assertIsInstance(client3, StorageClient)
        self.assertIsInstance(client4, StorageClient)
        self.assertIsInstance(client5, StorageClient)
        self.assertIsInstance(client6, StorageClient)

    def test_auto_detect_env(self):
        os.environ["DCD_STORAGE_ENDPOINT"] = "http://localhost:7100"
        os.environ["DCD_STORAGE_API_KEY"] = "sk_test_123"
        client = StorageClient()
        self.assertEqual(client.endpoint, "http://localhost:7100")
        self.assertEqual(client.api_key, "sk_test_123")
        self.assertEqual(client.get_public_url("avatars/me.jpg"), "http://localhost:7100/v1/image/avatars/me.jpg")

    def test_missing_endpoint_raises(self):
        with self.assertRaises(ValueError):
            StorageClient(endpoint="")

    def test_missing_api_key_for_signed_upload(self):
        client = StorageClient(endpoint="http://localhost:7100")
        with self.assertRaises(AuthenticationError):
            client.create_signed_upload_token()

    def test_missing_api_key_for_get_signed_url(self):
        client = StorageClient(endpoint="http://localhost:7100")
        with self.assertRaises(AuthenticationError):
            client.get_signed_url("invoices/inv-001.pdf")

    def test_namespaces(self):
        client = StorageClient(endpoint="http://localhost:7100")
        self.assertTrue(callable(client.uploader.upload))
        self.assertTrue(callable(client.uploader.destroy))
        self.assertTrue(callable(client.api.resource))
        self.assertTrue(callable(client.api.resources))
        self.assertTrue(callable(client.api.update))
        self.assertTrue(callable(client.api.usage))

    def test_custom_exceptions(self):
        auth_err = AuthenticationError("Unauthorized", 401)
        self.assertIsInstance(auth_err, StorageError)
        self.assertEqual(auth_err.status_code, 401)

        nf_err = NotFoundError("Missing", 404)
        self.assertIsInstance(nf_err, StorageError)
        self.assertEqual(nf_err.status_code, 404)

        large_err = PayloadTooLargeError("Too Big", 413)
        self.assertIsInstance(large_err, StorageError)
        self.assertEqual(large_err.status_code, 413)

        timeout_err = NetworkTimeoutError("Timeout", 408)
        self.assertIsInstance(timeout_err, StorageError)
        self.assertEqual(timeout_err.status_code, 408)


if __name__ == "__main__":
    unittest.main()

