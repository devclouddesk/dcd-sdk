import re
from typing import Optional, Union, Literal

CropMode = Literal["fill", "fit", "crop", "scale", "thumb"]
OutputFormat = Literal["auto", "webp", "avif", "png", "jpeg", "jpg", "gif"]

KNOWN_IMAGE_EXTS = re.compile(r"\.(jpg|jpeg|png|webp|avif|gif|tiff|svg|bmp)$", re.IGNORECASE)


class TransformationBuilder:
    """
    Fluent builder for constructing dynamic media transformation URLs.
    
    Example:
        url = (
            client.url("avatars/user-123")
            .resize(width=400, height=400, crop="fill")
            .format("webp")
            .quality(85)
            .blur(5)
            .to_string()
        )
    """

    def __init__(self, endpoint: str, public_id: str, delivery_prefix: str = "image/upload"):
        self._endpoint = endpoint.rstrip("/")
        self._public_id = public_id.lstrip("/")
        self._delivery_prefix = delivery_prefix.strip("/") or "image/upload"
        self._width: Optional[int] = None
        self._height: Optional[int] = None
        self._crop: Optional[str] = None
        self._format: Optional[str] = None
        self._quality: Optional[Union[int, str]] = None
        self._blur: Optional[int] = None
        self._grayscale: bool = False
        self._sharpen: bool = False
        self._rotation: Optional[Union[int, str]] = None

    def prefix(self, path_prefix: str) -> "TransformationBuilder":
        """Configure delivery URL path prefix (e.g. 'image/upload', 'cdn', etc.)."""
        self._delivery_prefix = path_prefix.strip("/") or "image/upload"
        return self

    def cloudinary_mode(self) -> "TransformationBuilder":
        """Switch to 1:1 Cloudinary delivery path format (/image/upload/...)."""
        self._delivery_prefix = "image/upload"
        return self

    def width(self, w: int) -> "TransformationBuilder":
        """Set output width in pixels."""
        self._width = round(w)
        return self

    def height(self, h: int) -> "TransformationBuilder":
        """Set output height in pixels."""
        self._height = round(h)
        return self

    def resize(
        self,
        width: Optional[int] = None,
        height: Optional[int] = None,
        crop: Optional[CropMode] = "fill",
    ) -> "TransformationBuilder":
        """Resize image dimensions with an optional crop mode."""
        if width is not None:
            self._width = round(width)
        if height is not None:
            self._height = round(height)
        if crop:
            self._crop = crop
        return self

    def crop(self, mode: CropMode) -> "TransformationBuilder":
        """Set image crop mode ('fill', 'fit', 'crop', 'scale', 'thumb')."""
        self._crop = mode
        return self

    def format(self, fmt: OutputFormat) -> "TransformationBuilder":
        """Set output format ('auto', 'webp', 'avif', 'png', 'jpeg')."""
        self._format = fmt
        return self

    def quality(self, q: Union[int, Literal["auto"]]) -> "TransformationBuilder":
        """Set image compression quality (1-100 or 'auto')."""
        self._quality = q
        return self

    def blur(self, sigma: int = 5) -> "TransformationBuilder":
        """Apply Gaussian blur with radius sigma (1-50)."""
        self._blur = sigma
        return self

    def grayscale(self, enable: bool = True) -> "TransformationBuilder":
        """Convert image to grayscale."""
        self._grayscale = enable
        return self

    def sharpen(self, enable: bool = True) -> "TransformationBuilder":
        """Enhance edges and sharpen image."""
        self._sharpen = enable
        return self

    def rotation(self, rot: Union[int, Literal["auto"]]) -> "TransformationBuilder":
        """Rotate image by degrees (e.g. 90, 180, 270) or 'auto' from EXIF."""
        self._rotation = rot
        return self

    def to_params_string(self) -> str:
        """Builds the transformation parameter string (e.g. w_400,h_400,c_fill,f_webp)."""
        parts = []
        if self._width is not None:
            parts.append(f"w_{self._width}")
        if self._height is not None:
            parts.append(f"h_{self._height}")
        if self._crop:
            parts.append(f"c_{self._crop}")
        if self._format:
            parts.append(f"f_{self._format}")
        if self._quality is not None:
            parts.append(f"q_{self._quality}")
        if self._blur is not None:
            parts.append(f"e_blur_{self._blur}")
        if self._grayscale:
            parts.append("e_gray")
        if self._sharpen:
            parts.append("e_sharp")
        if self._rotation is not None:
            parts.append(f"r_{self._rotation}")

        return ",".join(parts) if parts else "original"

    def build(self) -> str:
        """Returns the full public transformed URL with proper extension."""
        params = self.to_params_string()
        final_public_id = self._public_id

        # Cloudinary standard: If a specific format was selected, ensure URL ends with that extension
        if self._format and self._format != "auto":
            target_ext = "jpg" if self._format == "jpeg" else self._format
            if KNOWN_IMAGE_EXTS.search(final_public_id):
                final_public_id = KNOWN_IMAGE_EXTS.sub(f".{target_ext}", final_public_id)
            else:
                final_public_id = f"{final_public_id}.{target_ext}"

        if params == "original":
            return f"{self._endpoint}/{self._delivery_prefix}/{final_public_id}"
        return f"{self._endpoint}/{self._delivery_prefix}/{params}/{final_public_id}"

    def to_string(self) -> str:
        """Alias for build()."""
        return self.build()

    def __str__(self) -> str:
        return self.build()

    def __repr__(self) -> str:
        return f"<TransformationBuilder url={self.build()!r}>"
