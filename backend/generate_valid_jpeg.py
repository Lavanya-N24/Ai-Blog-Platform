from PIL import Image
import io
import base64

# Create a 100x100 solid red image
img = Image.new('RGB', (100, 100), color='red')

# Save to bytes
img_byte_arr = io.BytesIO()
img.save(img_byte_arr, format='JPEG')
img_byte_arr = img_byte_arr.getvalue()

# Encode to base64
b64_str = base64.b64encode(img_byte_arr).decode('utf-8')

# Output to stdout just the base64 string
print(b64_str)
