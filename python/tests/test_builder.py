import unittest
from dcd_storage_client import TransformationBuilder


class TestTransformationBuilder(unittest.TestCase):
    def test_basic_transformation_url(self):
        builder = TransformationBuilder("http://localhost:7100", "avatars/user.jpg")
        url = (
            builder.resize(width=400, height=400, crop="fill")
            .format("webp")
            .quality(85)
            .to_string()
        )
        self.assertEqual(
            url,
            "http://localhost:7100/v1/image/w_400,h_400,c_fill,f_webp,q_85/avatars/user.jpg",
        )

    def test_original_when_no_transformation(self):
        builder = TransformationBuilder("http://localhost:7100", "docs/file.pdf")
        self.assertEqual(builder.to_params_string(), "original")
        self.assertEqual(builder.to_string(), "http://localhost:7100/v1/image/docs/file.pdf")

    def test_all_effects(self):
        builder = TransformationBuilder("http://localhost:7100", "sample.png")
        url = (
            builder.blur(5)
            .grayscale()
            .sharpen()
            .rotation(90)
            .to_string()
        )
        self.assertEqual(
            url,
            "http://localhost:7100/v1/image/e_blur_5,e_gray,e_sharp,r_90/sample.png",
        )

    def test_slash_handling(self):
        builder = TransformationBuilder("http://localhost:7100///", "///assets/pic.webp")
        url = builder.format("avif").to_string()
        self.assertEqual(url, "http://localhost:7100/v1/image/f_avif/assets/pic.webp")


if __name__ == "__main__":
    unittest.main()
