import os
import re

# Paths
ROOT_DIR = r"C:\Users\Nishant Puthran\.gemini\antigravity\scratch\soulsync"
CLIENT_SRC = os.path.join(ROOT_DIR, "client", "src")

# Colors
YELLOW_THEME_BLOCK = """  --color-yellow-50: #fefce8;
  --color-yellow-100: #fef9c3;
  --color-yellow-200: #fef08a;
  --color-yellow-300: #fde047;
  --color-yellow-400: #facc15;
  --color-yellow-500: #eab308;
  --color-yellow-600: #ca8a04;
  --color-yellow-700: #a16207;
  --color-yellow-800: #854d0e;
  --color-yellow-900: #713f12;"""

def refactor_index_css():
    css_path = os.path.join(CLIENT_SRC, "index.css")
    if not os.path.exists(css_path):
        print(f"Error: index.css not found at {css_path}")
        return

    with open(css_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Replace purple theme colors block with yellow theme colors
    purple_pattern = r"  --color-purple-50:[^}]+--color-purple-900: #[0-9a-fA-F]{6};"
    content = re.sub(purple_pattern, YELLOW_THEME_BLOCK, content)
    # If the exact match fails, let's do a wider search or standard replacement
    if "color-purple" in content:
        # Fallback manual line-by-line replacement of the purple block
        lines = content.splitlines()
        new_lines = []
        skip = False
        for line in lines:
            if "--color-purple-50" in line:
                new_lines.append(YELLOW_THEME_BLOCK)
                skip = True
                continue
            if skip:
                if "--color-purple-900" in line:
                    skip = False
                continue
            new_lines.append(line)
        content = "\\n".join(new_lines)

    # Let's replace gradient-playful background colors (yellow & pink)
    # Light mode: linear-gradient(-45deg, #ff9eb5, #e0c3fc, #ffccd5, #c8b6ff)
    # New: linear-gradient(-45deg, #fbcfe8, #fef08a, #ffccd5, #fff59d)
    content = content.replace(
        "linear-gradient(-45deg, #ff9eb5, #e0c3fc, #ffccd5, #c8b6ff)",
        "linear-gradient(-45deg, #fbcfe8, #fef08a, #ffccd5, #fff59d)"
    )

    # Dark mode: linear-gradient(-45deg, #2b1028, #180922, #10061e, #361730)
    # New: linear-gradient(-45deg, #2c0c1e, #291a03, #1e0513, #221d03)
    content = content.replace(
        "linear-gradient(-45deg, #2b1028, #180922, #10061e, #361730)",
        "linear-gradient(-45deg, #2c0c1e, #291a03, #1e0513, #221d03)"
    )

    # Save
    with open(css_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("index.css refactored successfully.")

def refactor_jsx_files():
    for root, dirs, files in os.walk(CLIENT_SRC):
        for file in files:
            if file.endswith(".jsx"):
                file_path = os.path.join(root, file)
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()

                # Perform replacements of purple classes
                updated = content
                # Class name updates
                updated = updated.replace("to-purple-", "to-yellow-")
                updated = updated.replace("from-purple-", "from-yellow-")
                updated = updated.replace("text-purple-", "text-yellow-")
                updated = updated.replace("bg-purple-", "bg-yellow-")
                updated = updated.replace("border-purple-", "border-yellow-")
                updated = updated.replace("shadow-purple-", "shadow-yellow-")
                updated = updated.replace("hover:to-purple-", "hover:to-yellow-")
                updated = updated.replace("hover:from-purple-", "hover:from-yellow-")
                updated = updated.replace("hover:border-purple-", "hover:border-yellow-")
                updated = updated.replace("hover:shadow-purple-", "hover:shadow-yellow-")
                updated = updated.replace("focus:ring-purple-", "focus:ring-yellow-")
                updated = updated.replace("via-purple-", "via-yellow-")
                updated = updated.replace("text-purple-", "text-yellow-")

                if updated != content:
                    with open(file_path, "w", encoding="utf-8") as f:
                        f.write(updated)
                    print(f"Refactored: {file}")

if __name__ == "__main__":
    refactor_index_css()
    refactor_jsx_files()
    print("Refactoring complete!")
