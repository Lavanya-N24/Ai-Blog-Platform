import urllib.request
import ssl

url = "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Aurora_as_seen_from_Fairbanks.jpg/100px-Aurora_as_seen_from_Fairbanks.jpg"
output_path = "test_image.jpg"

print(f"Downloading {url} to {output_path}...")
try:
    # Bypass SSL verification if needed (for simplicity in dev environments)
    context = ssl._create_unverified_context()
    with urllib.request.urlopen(url, context=context) as response, open(output_path, 'wb') as out_file:
        data = response.read()
        out_file.write(data)
    print("Download complete.")
except Exception as e:
    print(f"Error downloading: {e}")
