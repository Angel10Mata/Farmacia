from PIL import Image

def pad_image(input_path, output_path, padding_factor=0.25):
    # Open the image
    img = Image.open(input_path).convert("RGBA")
    
    # Get the background color from the top-left pixel
    bg_color = img.getpixel((0, 0))
    
    # Calculate new dimensions
    width, height = img.size
    new_width = int(width * (1 + padding_factor * 2))
    new_height = int(height * (1 + padding_factor * 2))
    
    # Create a new image with the background color
    new_img = Image.new("RGBA", (new_width, new_height), bg_color)
    
    # Paste the original image in the center
    paste_x = int((new_width - width) / 2)
    paste_y = int((new_height - height) / 2)
    
    # Paste using alpha composite
    new_img.paste(img, (paste_x, paste_y), img)
    
    # Save the result
    new_img.save(output_path, "PNG")
    print(f"Saved padded image to {output_path}")

if __name__ == "__main__":
    input_file = r"c:\Users\angel\Documents\koreapp\public\kore\logo.png"
    pad_image(input_file, input_file, 0.25)
