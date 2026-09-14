import re
import sys
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    LongTable,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "output" / "pdf"


def clean_inline(text):
    text = text.strip()
    tokens = []

    def stash(value):
        tokens.append(value)
        return f"@@TOKEN{len(tokens) - 1}@@"

    text = re.sub(
        r"`([^`]+)`",
        lambda m: stash(f"<font name='Courier'>{escape_xml(m.group(1))}</font>"),
        text,
    )
    text = re.sub(
        r"\*\*([^*]+)\*\*",
        lambda m: stash(f"<b>{escape_xml(m.group(1))}</b>"),
        text,
    )
    text = re.sub(
        r"_([^_]+)_",
        lambda m: stash(f"<i>{escape_xml(m.group(1))}</i>"),
        text,
    )
    text = escape_xml(text)
    changed = True
    while changed:
        changed = False
        for idx, value in enumerate(tokens):
            token = f"@@TOKEN{idx}@@"
            if token in text:
                text = text.replace(token, value)
                changed = True
    return text


def escape_xml(text):
    return (
        str(text)
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )


def split_row(line):
    cells = [c.strip() for c in line.strip().strip("|").split("|")]
    return cells


def is_separator(line):
    return bool(re.match(r"^\|\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$", line.strip()))


def page_footer(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(colors.HexColor("#64748B"))
    page = f"Page {doc.page}"
    canvas.drawRightString(doc.pagesize[0] - doc.rightMargin, 0.38 * inch, page)
    canvas.drawString(doc.leftMargin, 0.38 * inch, "SMAART Institute Mobile App")
    canvas.restoreState()


def build_pdf(markdown_path, output_path, title, landscape_mode=False):
    page_size = landscape(A4) if landscape_mode else A4
    doc = SimpleDocTemplate(
        str(output_path),
        pagesize=page_size,
        rightMargin=0.48 * inch,
        leftMargin=0.48 * inch,
        topMargin=0.55 * inch,
        bottomMargin=0.62 * inch,
    )
    base = getSampleStyleSheet()
    styles = {
        "h1": ParagraphStyle(
            "h1",
            parent=base["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=18,
            leading=22,
            textColor=colors.HexColor("#0F1E42"),
            spaceAfter=12,
        ),
        "h2": ParagraphStyle(
            "h2",
            parent=base["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=13,
            leading=16,
            textColor=colors.HexColor("#045C9A"),
            spaceBefore=10,
            spaceAfter=6,
        ),
        "h3": ParagraphStyle(
            "h3",
            parent=base["Heading3"],
            fontName="Helvetica-Bold",
            fontSize=10.5,
            leading=13,
            textColor=colors.HexColor("#1E293B"),
            spaceBefore=8,
            spaceAfter=4,
        ),
        "body": ParagraphStyle(
            "body",
            parent=base["BodyText"],
            fontName="Helvetica",
            fontSize=8.6,
            leading=11.2,
            textColor=colors.HexColor("#1F2937"),
            alignment=TA_LEFT,
            spaceAfter=5,
        ),
        "table": ParagraphStyle(
            "table",
            parent=base["BodyText"],
            fontName="Helvetica",
            fontSize=6.9 if landscape_mode else 6.6,
            leading=8.4 if landscape_mode else 8.0,
            textColor=colors.HexColor("#111827"),
        ),
        "table_header": ParagraphStyle(
            "table_header",
            parent=base["BodyText"],
            fontName="Helvetica-Bold",
            fontSize=7.1 if landscape_mode else 6.8,
            leading=8.5,
            textColor=colors.white,
        ),
    }

    story = []
    lines = markdown_path.read_text(encoding="utf-8").splitlines()
    i = 0
    first_h1 = True
    while i < len(lines):
        line = lines[i].rstrip()
        if not line:
            story.append(Spacer(1, 3))
            i += 1
            continue

        if line.startswith("|") and i + 1 < len(lines) and is_separator(lines[i + 1]):
            rows = [split_row(line)]
            i += 2
            while i < len(lines) and lines[i].startswith("|"):
                rows.append(split_row(lines[i]))
                i += 1
            max_cols = max(len(r) for r in rows)
            norm_rows = [r + [""] * (max_cols - len(r)) for r in rows]
            data = []
            for ridx, row in enumerate(norm_rows):
                style_name = "table_header" if ridx == 0 else "table"
                data.append([Paragraph(clean_inline(cell), styles[style_name]) for cell in row])
            total_width = doc.width
            if max_cols == 2:
                col_widths = [total_width * 0.26, total_width * 0.74]
            elif max_cols == 3:
                col_widths = [total_width * 0.15, total_width * 0.65, total_width * 0.20]
            elif max_cols == 4:
                col_widths = [total_width * 0.20, total_width * 0.18, total_width * 0.34, total_width * 0.28]
            else:
                col_widths = [total_width / max_cols] * max_cols
            table = LongTable(data, colWidths=col_widths, repeatRows=1, splitByRow=1)
            table.setStyle(
                TableStyle(
                    [
                        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0F1E42")),
                        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                        ("BACKGROUND", (0, 1), (-1, -1), colors.HexColor("#F8FAFC")),
                        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor("#FFFFFF"), colors.HexColor("#F8FAFC")]),
                        ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#CBD5E1")),
                        ("VALIGN", (0, 0), (-1, -1), "TOP"),
                        ("LEFTPADDING", (0, 0), (-1, -1), 4),
                        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
                        ("TOPPADDING", (0, 0), (-1, -1), 4),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                    ]
                )
            )
            story.append(table)
            story.append(Spacer(1, 7))
            continue

        if line.startswith("# "):
            if not first_h1:
                story.append(PageBreak())
            story.append(Paragraph(clean_inline(line[2:]), styles["h1"]))
            first_h1 = False
        elif line.startswith("## "):
            story.append(Paragraph(clean_inline(line[3:]), styles["h2"]))
        elif line.startswith("### "):
            story.append(Paragraph(clean_inline(line[4:]), styles["h3"]))
        elif line.startswith("- "):
            story.append(Paragraph("- " + clean_inline(line[2:]), styles["body"]))
        else:
            story.append(Paragraph(clean_inline(line), styles["body"]))
        i += 1

    doc.title = title
    doc.build(story, onFirstPage=page_footer, onLaterPages=page_footer)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    build_pdf(
        ROOT / "docs" / "MOBILE_APP_REQUIREMENTS_DOCUMENT.md",
        OUT / "SMAART_Mobile_App_Requirements_Document.pdf",
        "SMAART Mobile App Requirements Document",
        landscape_mode=False,
    )
    build_pdf(
        ROOT / "docs" / "MOBILE_APP_CURRENT_STATUS_TABLE.md",
        OUT / "SMAART_Mobile_App_Current_Status_Table.pdf",
        "SMAART Mobile App Current Status Table",
        landscape_mode=True,
    )


if __name__ == "__main__":
    sys.exit(main())
