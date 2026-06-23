import argparse
import contextlib
import json
import os
from pathlib import Path
import sys

SCRIPT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = SCRIPT_DIR.parent
LOCAL_PADDLEX_CACHE = BACKEND_DIR / ".paddlex-cache"
os.environ.setdefault("PADDLE_PDX_CACHE_HOME", str(LOCAL_PADDLEX_CACHE))
os.environ.setdefault("PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK", "True")
os.environ.setdefault("FLAGS_use_mkldnn", "0")
LOCAL_PADDLEX_CACHE.mkdir(parents=True, exist_ok=True)


def emit(payload):
    print(json.dumps(payload, ensure_ascii=True))


def to_plain(value):
    if hasattr(value, "tolist"):
        return value.tolist()
    if isinstance(value, dict):
        return {key: to_plain(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [to_plain(item) for item in value]
    return value


def bbox_from_box(box):
    points = to_plain(box)
    if not points:
        return None

    xs = []
    ys = []
    for point in points:
        if isinstance(point, (list, tuple)) and len(point) >= 2:
            xs.append(float(point[0]))
            ys.append(float(point[1]))

    if not xs or not ys:
        return None

    return {
        "x0": min(xs),
        "y0": min(ys),
        "x1": max(xs),
        "y1": max(ys),
    }


def add_word(words, text, score, box):
    text = str(text or "").strip()
    bbox = bbox_from_box(box)
    if not text or bbox is None:
        return

    try:
        confidence = float(score)
    except (TypeError, ValueError):
        confidence = 0

    words.append({
        "text": text,
        "confidence": confidence,
        "bbox": bbox,
    })


def read_result_dict(data, words):
    data = to_plain(data)
    if isinstance(data, dict) and isinstance(data.get("res"), dict):
        data = data["res"]

    if not isinstance(data, dict):
        return

    texts = data.get("rec_texts") or data.get("texts") or []
    scores = data.get("rec_scores") or data.get("scores") or []
    boxes = (
        data.get("rec_polys")
        or data.get("dt_polys")
        or data.get("rec_boxes")
        or data.get("boxes")
        or []
    )

    for index, text in enumerate(texts):
        score = scores[index] if index < len(scores) else 0
        box = boxes[index] if index < len(boxes) else None
        add_word(words, text, score, box)


def read_old_result(data, words):
    data = to_plain(data)
    if not isinstance(data, list):
        return

    # Older PaddleOCR commonly returns:
    # [[ [box, (text, score)], ... ]]
    pages = [data] if data and is_old_record(data[0]) else data

    for page in pages:
        if not isinstance(page, list):
            continue
        for record in page:
            if not is_old_record(record):
                continue
            box = record[0]
            text_data = record[1]
            text = text_data[0] if isinstance(text_data, (list, tuple)) and text_data else ""
            score = text_data[1] if isinstance(text_data, (list, tuple)) and len(text_data) > 1 else 0
            add_word(words, text, score, box)


def is_old_record(record):
    return (
        isinstance(record, (list, tuple))
        and len(record) >= 2
        and isinstance(record[1], (list, tuple))
    )


def extract_words(result):
    words = []

    if isinstance(result, list):
        for item in result:
            if hasattr(item, "json"):
                read_result_dict(item.json() if callable(item.json) else item.json, words)
            elif isinstance(item, dict):
                read_result_dict(item, words)
        if not words:
            read_old_result(result, words)
    elif hasattr(result, "json"):
        read_result_dict(result.json() if callable(result.json) else result.json, words)
    elif isinstance(result, dict):
        read_result_dict(result, words)

    return words


def build_lines(words):
    if not words:
        return []

    heights = [
        max(1, word["bbox"]["y1"] - word["bbox"]["y0"])
        for word in words
        if word.get("bbox")
    ]
    tolerance = max(10, (sum(heights) / len(heights)) * 0.65) if heights else 14
    lines = []

    for word in sorted(words, key=lambda item: (item["bbox"]["y0"], item["bbox"]["x0"])):
        center_y = (word["bbox"]["y0"] + word["bbox"]["y1"]) / 2
        line = next((item for item in lines if abs(item["centerY"] - center_y) <= tolerance), None)

        if line:
            line["words"].append(word)
            count = len(line["words"])
            line["centerY"] = ((line["centerY"] * (count - 1)) + center_y) / count
        else:
            lines.append({"centerY": center_y, "words": [word]})

    rendered = []
    for line in sorted(lines, key=lambda item: item["centerY"]):
        rendered.append(" ".join(
            word["text"]
            for word in sorted(line["words"], key=lambda item: item["bbox"]["x0"])
        ))

    return rendered


def create_ocr():
    from paddleocr import PaddleOCR

    attempts = [
        {
            "use_doc_orientation_classify": False,
            "use_doc_unwarping": False,
            "use_textline_orientation": False,
            "text_det_limit_side_len": 480,
            "text_det_limit_type": "max",
            "text_recognition_batch_size": 8,
            "enable_mkldnn": False,
            "lang": "en",
        },
        {
            "use_doc_orientation_classify": False,
            "use_doc_unwarping": False,
            "use_textline_orientation": False,
            "text_det_limit_side_len": 480,
            "text_det_limit_type": "max",
            "use_angle_cls": True,
            "enable_mkldnn": False,
            "lang": "en",
            "show_log": False,
        },
        {
            "lang": "en",
        },
    ]

    last_error = None
    for kwargs in attempts:
        try:
            return PaddleOCR(**kwargs)
        except TypeError as error:
            last_error = error

    raise last_error


def prepare_image(image_path):
    from PIL import Image

    max_side = int(os.environ.get("PADDLE_OCR_MAX_SIDE", "700"))
    source = Path(image_path)
    prepared = source.with_name(f"{source.stem}-prepared.png")

    with Image.open(source) as image:
        image = image.convert("RGB")
        width, height = image.size
        original_size = (width, height)

        # Most CoE screenshots are portrait phone captures: browser/status bars at
        # top/bottom, result table on the left, watermark on the right. Cropping
        # here keeps grades and codes while avoiding expensive background OCR.
        if height > width * 1.15:
            left = 0
            top = int(height * 0.10)
            right = int(width * 0.66)
            bottom = int(height * 0.88)
            image = image.crop((left, top, right, bottom))
            width, height = image.size

        longest_side = max(width, height)

        if longest_side > max_side:
            scale = max_side / longest_side
            next_size = (max(1, int(width * scale)), max(1, int(height * scale)))
            image = image.resize(next_size, Image.Resampling.LANCZOS)

        image.save(prepared, "PNG", optimize=True)
        print(
            f"[PaddleOCR] Prepared image {original_size[0]}x{original_size[1]} -> {image.size[0]}x{image.size[1]}",
            file=sys.stderr,
            flush=True,
        )

    return str(prepared)


def run_ocr(image_path):
    with contextlib.redirect_stdout(sys.stderr):
        prepared_image_path = prepare_image(image_path)
        ocr = create_ocr()
        if hasattr(ocr, "predict"):
            result = ocr.predict(prepared_image_path)
        else:
            result = ocr.ocr(prepared_image_path, cls=False)

    words = extract_words(result)
    lines = build_lines(words)
    confidences = [word["confidence"] for word in words if word.get("confidence")]

    return {
        "success": True,
        "provider": "paddleocr",
        "text": "\n".join(lines).strip(),
        "words": words,
        "confidence": sum(confidences) / len(confidences) if confidences else 0,
        "rawLineCount": len(lines),
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("image_path")
    args = parser.parse_args()

    try:
        emit(run_ocr(args.image_path))
    except ModuleNotFoundError as error:
        emit({
            "success": False,
            "errorCode": "PADDLEOCR_NOT_INSTALLED",
            "error": f"Missing Python package: {error.name}. Install PaddleOCR requirements.",
        })
        sys.exit(2)
    except Exception as error:
        emit({
            "success": False,
            "errorCode": "PADDLEOCR_FAILED",
            "error": str(error),
        })
        sys.exit(1)


if __name__ == "__main__":
    main()
