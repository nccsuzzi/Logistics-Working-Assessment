import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.ai import extract_load_from_text

text = """
Hi team,
We need a refrigerated truck tomorrow morning from Dallas, TX to Houston, TX.
The load is approximately 18,500 lbs of fresh produce.
Delivery must arrive before 5 PM tomorrow. Budget is $1250.
"""

if __name__ == "__main__":
    result = extract_load_from_text(text)
    print("Extraction Result:")
    import json
    print(json.dumps(result, indent=2))
