import os
import sys
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def build_polished_report():
    doc = Document()

    # 1-inch margins all around
    for section in doc.sections:
        section.top_margin = Inches(1)
        section.bottom_margin = Inches(1)
        section.left_margin = Inches(1)
        section.right_margin = Inches(1)
        section.different_first_page_header_footer = True

        # Header for normal pages (Monochrome / shades of gray)
        header = section.header
        hp = header.paragraphs[0]
        hp.text = "CineVault: Multidimensional Data Warehouse & Recommendation System | Academic Project Report"
        hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        hp.runs[0].font.name = "Calibri"
        hp.runs[0].font.size = Pt(8.5)
        hp.runs[0].font.color.rgb = RGBColor(107, 114, 128)  # #6B7280

        # Footer for normal pages
        footer = section.footer
        fp = footer.paragraphs[0]
        fp.text = "Department of Information Technology, Vidyalankar Institute of Technology"
        fp.alignment = WD_ALIGN_PARAGRAPH.LEFT
        fp.runs[0].font.name = "Calibri"
        fp.runs[0].font.size = Pt(8.5)
        fp.runs[0].font.color.rgb = RGBColor(107, 114, 128)  # #6B7280

    # Color Palette: ONLY Shades of Black and Dark Charcoal (No colors)
    BLACK = RGBColor(17, 24, 39)          # #111827 - Rich Black
    DARK_CHARCOAL = RGBColor(31, 41, 55)  # #1F2937 - Deep Charcoal
    CHARCOAL = RGBColor(55, 65, 81)       # #374151 - Slate Charcoal
    MUTED_GRAY = RGBColor(107, 114, 128)  # #6B7280 - Neutral Gray

    # Default Normal Style
    style_normal = doc.styles['Normal']
    style_normal.font.name = 'Calibri'
    style_normal.font.size = Pt(10.5)
    style_normal.font.color.rgb = DARK_CHARCOAL
    style_normal.paragraph_format.line_spacing = 1.15
    style_normal.paragraph_format.space_after = Pt(3.5)

    def add_h1(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(8)
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.bold = True
        run.font.size = Pt(14)
        run.font.color.rgb = BLACK
        return p

    def add_h2(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(6)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.bold = True
        run.font.size = Pt(11.5)
        run.font.color.rgb = DARK_CHARCOAL
        return p

    def add_p(text, bold_prefix=None):
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.line_spacing = 1.15
        if bold_prefix:
            r_bold = p.add_run(bold_prefix)
            r_bold.bold = True
            r_bold.font.color.rgb = BLACK
        p.add_run(text)
        return p

    def add_bullet(text, bold_prefix=None):
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.line_spacing = 1.15
        if bold_prefix:
            r_bold = p.add_run(bold_prefix)
            r_bold.bold = True
            r_bold.font.color.rgb = BLACK
        p.add_run(text)
        return p

    def format_minimal_table(table):
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        for i, row in enumerate(table.rows):
            trPr = row._tr.get_or_add_trPr()
            trPr.append(parse_xml(f'<w:cantSplit {nsdecls("w")}/>'))
            for cell in row.cells:
                cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
                tcPr = cell._tc.get_or_add_tcPr()
                # cell margins
                tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="80" w:type="dxa"/><w:bottom w:w="80" w:type="dxa"/><w:left w:w="120" w:type="dxa"/><w:right w:w="120" w:type="dxa"/></w:tcMar>')
                tcPr.append(tcMar)
                # minimal gray border
                borders = parse_xml(f'<w:tcBorders {nsdecls("w")}><w:top w:val="single" w:sz="4" w:color="D1D5DB"/><w:left w:val="none"/><w:bottom w:val="single" w:sz="4" w:color="D1D5DB"/><w:right w:val="none"/></w:tcBorders>')
                tcPr.append(borders)

                if i == 0:
                    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="F3F4F6"/>')
                    tcPr.append(shd)
                    for paragraph in cell.paragraphs:
                        paragraph.paragraph_format.space_after = Pt(1)
                        for r in paragraph.runs:
                            r.bold = True
                            r.font.color.rgb = BLACK
                            r.font.size = Pt(9)
                else:
                    if i % 2 == 1:
                        shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="FAFAFA"/>')
                        tcPr.append(shd)
                    for paragraph in cell.paragraphs:
                        paragraph.paragraph_format.space_after = Pt(1)
                        for r in paragraph.runs:
                            r.font.size = Pt(8.5)
                            r.font.color.rgb = DARK_CHARCOAL

    def add_screenshot_placeholder(fig_num, title, description, height_pt=140):
        table = doc.add_table(rows=1, cols=1)
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        row = table.rows[0]
        trPr = row._tr.get_or_add_trPr()
        trHeight = parse_xml(f'<w:trHeight {nsdecls("w")} w:val="{height_pt * 20}" w:hRule="exact"/>')
        trPr.append(trHeight)

        cell = table.cell(0, 0)
        cell.width = Inches(6.5)
        cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
        tcPr = cell._tc.get_or_add_tcPr()
        borders = parse_xml(f'<w:tcBorders {nsdecls("w")}><w:top w:val="dashed" w:sz="6" w:color="9CA3AF"/><w:left w:val="dashed" w:sz="6" w:color="9CA3AF"/><w:bottom w:val="dashed" w:sz="6" w:color="9CA3AF"/><w:right w:val="dashed" w:sz="6" w:color="9CA3AF"/></w:tcBorders>')
        tcPr.append(borders)
        shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="F9FAFB"/>')
        tcPr.append(shd)

        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(8)
        p.paragraph_format.space_after = Pt(3)
        r1 = p.add_run(f"Figure {fig_num}: [ {title} ]\n")
        r1.bold = True
        r1.font.size = Pt(9.5)
        r1.font.color.rgb = BLACK

        r2 = p.add_run("(Insert Application Screenshot Here)\n")
        r2.italic = True
        r2.font.size = Pt(8.5)
        r2.font.color.rgb = CHARCOAL

        r3 = p.add_run(description)
        r3.font.size = Pt(8)
        r3.font.color.rgb = MUTED_GRAY

        # Add small spacing after table
        doc.add_paragraph().paragraph_format.space_after = Pt(2)

    # =========================================================================
    # PAGE 1: TITLE / COVER PAGE
    # =========================================================================
    p_inst = doc.add_paragraph()
    p_inst.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_inst.paragraph_format.space_before = Pt(20)
    p_inst.paragraph_format.space_after = Pt(6)
    r = p_inst.add_run("VIDYALANKAR INSTITUTE OF TECHNOLOGY\n")
    r.bold = True
    r.font.size = Pt(14)
    r.font.color.rgb = BLACK
    r_sub = p_inst.add_run("DEPARTMENT OF INFORMATION TECHNOLOGY\nACADEMIC YEAR 2025–2026\n")
    r_sub.font.size = Pt(10.5)
    r_sub.font.color.rgb = CHARCOAL

    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(30)
    p_title.paragraph_format.space_after = Pt(10)
    r_t = p_title.add_run("CINEVAULT: A MULTIDIMENSIONAL DATA WAREHOUSE, OLAP ANALYTICS & INTELLIGENT MOVIE RECOMMENDATION SYSTEM")
    r_t.bold = True
    r_t.font.size = Pt(19)
    r_t.font.color.rgb = BLACK

    p_subt = doc.add_paragraph()
    p_subt.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_subt.paragraph_format.space_after = Pt(35)
    r_st = p_subt.add_run("A Project Report in Data Warehousing and Mining (DWM)")
    r_st.bold = True
    r_st.font.size = Pt(12)
    r_st.font.color.rgb = CHARCOAL

    p_deg = doc.add_paragraph()
    p_deg.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_deg.paragraph_format.space_after = Pt(35)
    r_deg_lead = p_deg.add_run("Submitted in partial fulfillment of the requirements for the degree of\n")
    r_deg_lead.font.italic = True
    r_deg_lead.font.size = Pt(10.5)
    r_deg_main = p_deg.add_run("Bachelor of Technology (B.Tech) in Information Technology")
    r_deg_main.bold = True
    r_deg_main.font.size = Pt(12)
    r_deg_main.font.color.rgb = BLACK

    p_cand = doc.add_paragraph()
    p_cand.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_cand.paragraph_format.space_after = Pt(30)
    p_cand.add_run("Submitted by:\n").font.size = Pt(10)
    r_cname = p_cand.add_run("Atharva [Surname]\n")
    r_cname.bold = True
    r_cname.font.size = Pt(12)
    r_cname.font.color.rgb = BLACK
    p_cand.add_run("Roll / Seat Number: [Insert Roll No]\nDepartment of Information Technology").font.size = Pt(10)

    p_guide = doc.add_paragraph()
    p_guide.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_guide.add_run("Under the Guidance of:\n").font.size = Pt(10)
    r_gname = p_guide.add_run("[Faculty Guide Name]\n")
    r_gname.bold = True
    r_gname.font.size = Pt(11.5)
    r_gname.font.color.rgb = BLACK
    p_guide.add_run("Department of Information Technology\nVidyalankar Institute of Technology, Mumbai (Affiliated to University of Mumbai)").font.size = Pt(9.5)

    doc.add_page_break()

    # =========================================================================
    # PAGE 2: CERTIFICATE OF AUTHENTICITY & DECLARATION
    # =========================================================================
    add_h1("CERTIFICATE OF AUTHENTICITY")
    add_p("This is to certify that the project entitled \"CineVault: A Multidimensional Data Warehouse, OLAP Analytics & Intelligent Movie Recommendation System\" is a bonafide record of work carried out by Atharva [Surname] (Roll No: [Insert Roll No]) in partial fulfillment of the requirements for the award of Bachelor of Technology in Information Technology from Vidyalankar Institute of Technology, Mumbai, during the Academic Year 2025–2026.")
    add_p("This report represents original project work carried out under supervision and satisfies evaluation standards prescribed for the Data Warehousing and Mining (DWM) coursework.")

    doc.add_paragraph().paragraph_format.space_before = Pt(25)
    t_sign = doc.add_table(rows=2, cols=3)
    t_sign.alignment = WD_TABLE_ALIGNMENT.CENTER
    signs = [
        ["________________________", "________________________", "________________________"],
        ["Project Supervisor / Guide\nDept. of Information Tech.", "Head of Department (HOD)\nDept. of Information Tech.", "External Examiner\nDate: _______________"]
    ]
    for r_idx, row in enumerate(signs):
        for c_idx, val in enumerate(row):
            cell = t_sign.cell(r_idx, c_idx)
            cell.text = val
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            for run_s in p.runs:
                run_s.font.size = Pt(9)
                run_s.font.color.rgb = DARK_CHARCOAL

    doc.add_paragraph().paragraph_format.space_before = Pt(30)
    add_h1("DECLARATION OF ORIGINALITY")
    add_p("I declare that this project report represents my original work in my own words. Where others' ideas, methodologies, or text have been incorporated, they have been duly cited and referenced in the bibliography. I affirm that I have adhered to all academic integrity policies and have not misrepresented, falsified, or fabricated any data, algorithms, or results in this submission.")
    
    doc.add_paragraph().paragraph_format.space_before = Pt(15)
    p_dec_sign = doc.add_paragraph()
    p_dec_sign.add_run("Place: Mumbai, India\nDate: October 13, 2026\n\nSignature of Candidate: ___________________________")

    doc.add_page_break()

    # =========================================================================
    # PAGE 3: ABSTRACT & ACKNOWLEDGEMENTS
    # =========================================================================
    add_h1("EXECUTIVE ABSTRACT")
    add_p("Modern digital streaming platforms produce continuous streams of transactional engagement data. While Online Transaction Processing (OLTP) architectures guarantee ACID transactional compliance, they fail when handling multi-attribute aggregations and historical decision support. This project presents CineVault, an academic and enterprise-grade Data Warehouse and Mining (DWM) system built upon the canonical MovieLens ml-latest-small dataset (9,742 movies, 100,836 ratings, 3,683 tags, and 610 distinct users).")
    add_p("The architecture decouples operational transactions from analytical workloads by engineering a Kimball dimensional Star Schema centered around a fact_rating table (102,677 fact records) surrounded by dim_movie, dim_user, dim_date (85,043 temporal records), and dim_tag dimension tables. An automated, multi-stage Extract, Transform, Load (ETL) pipeline cleans raw CSV files, enforces domain integrity, constructs temporal hierarchies (Year, Quarter, Month, Day, Day of Week), generates surrogate keys, and populates the schema.")
    add_p("On top of the warehouse, CineVault provides an in-memory OLAP engine supporting sub-second execution of Roll-Up, Drill-Down, Slice, Dice, and Pivot operations. Advanced Machine Learning modules embed K-Means clustering for behavioral user segmentation with dynamic Elbow-method optimal K detection, alongside a TF-IDF Cosine Similarity recommendation engine that bridges historical warehouse records with real-time user ratings. The full-stack platform features a FastAPI REST backend and a responsive React 18 / Vite / Tailwind CSS dual-portal frontend, validated through automated test suites passing 27 out of 27 test cases.")

    doc.add_paragraph().paragraph_format.space_before = Pt(12)
    add_h1("ACKNOWLEDGEMENTS")
    add_p("I express my sincere gratitude to my project supervisor for their invaluable guidance, technical insights, and continuous encouragement throughout this Data Warehousing and Mining project.")
    add_p("I also thank the Head of the Department of Information Technology and the Principal of Vidyalankar Institute of Technology for providing state-of-the-art computational infrastructure and laboratories. Finally, I thank my peers and family for their steadfast motivation throughout this academic pursuit.")

    doc.add_page_break()

    # =========================================================================
    # PAGE 4: TABLE OF CONTENTS (Fits cleanly on Page 4)
    # =========================================================================
    add_h1("TABLE OF CONTENTS")
    toc_items = [
        ("Chapter 1: Introduction", "5"),
        ("  • Background & Industry Context", "5"),
        ("  • Problem Statement & Core Project Objectives", "5"),
        ("Chapter 2: Theoretical Foundations & Literature Review", "5"),
        ("  • OLTP Transactional Layer vs. OLAP Analytical Warehouse", "5"),
        ("  • Ralph Kimball Dimensional Modeling & Star Schema Concepts", "5"),
        ("  • Multidimensional Cube Operations: Roll-Up, Drill-Down, Slice, Dice, Pivot", "5"),
        ("Chapter 3: System Architecture & Dimensional Design", "6"),
        ("  • Decoupled Three-Tier System Architecture", "6"),
        ("  • Conformed Star Schema Specification (fact_rating & 4 Dimension Tables)", "6"),
        ("  • Figure 1: System Architecture & Dimensional Star Schema Model", "6"),
        ("Chapter 4: ETL Pipeline Implementation", "7"),
        ("  • Extraction from Raw MovieLens CSV Repositories", "7"),
        ("  • Cleaning, Deduplication & Temporal Dimension Engineering", "7"),
        ("  • Figure 2: ETL Pipeline Execution & Warehouse Dataset Overview", "7"),
        ("Chapter 5: Multidimensional OLAP Engine", "8"),
        ("  • Analytical Processing Paradigm & In-Memory Fact Caching", "8"),
        ("  • Analytical Execution of Roll-Up, Drill-Down, Slice, Dice, and Pivot", "8"),
        ("  • Figure 3: Interactive OLAP Cube Operations & Aggregation Interface", "8"),
        ("Chapter 6: Machine Learning: K-Means Clustering & Optimal K Detection", "9"),
        ("  • Unsupervised User Behavioral Profiling & Movie Feature Spaces", "9"),
        ("  • Mathematical Optimal K Selection via Dynamic Elbow Inertia Curve", "9"),
        ("  • Figure 4: K-Means Clustering Scatter Plot & Elbow Method Curve", "9"),
        ("Chapter 7: Machine Learning: Content-Based Recommendation Engine", "10"),
        ("  • Information Retrieval Vector Space & TF-IDF Document Synthesis", "10"),
        ("  • Cosine Distance Similarity Ranking & Dual-Tier Live Rating Integration", "10"),
        ("  • Figure 5: Personalized Movie Recommendations & Similarity Scores", "10"),
        ("Chapter 8: Full-Stack Web Application Implementation", "11"),
        ("  • FastAPI REST Backend & Native Bcrypt / JWT Authorization Security", "11"),
        ("  • React 18 / Vite / Tailwind CSS Dual-Portal Interface Architecture", "11"),
        ("  • Figure 6: User Movie Catalog, Search Filters & Rating Modal", "11"),
        ("Chapter 9: Testing, Verification & Performance Evaluation", "12"),
        ("  • Automated Unit & Integration Test Suites (27/27 Passing Cases)", "12"),
        ("  • Sub-50ms OLAP Latency Benchmarks & Production Build Evaluation", "12"),
        ("Chapter 10: Conclusion, Future Scope & References", "12"),
        ("  • Key Project Contributions & Big Data Future Extensions", "12"),
        ("  • Academic References & Formal Bibliography", "12")
    ]
    t_toc = doc.add_table(rows=len(toc_items), cols=2)
    t_toc.alignment = WD_TABLE_ALIGNMENT.CENTER
    for idx, (title, page) in enumerate(toc_items):
        cell_t = t_toc.cell(idx, 0)
        cell_p = t_toc.cell(idx, 1)
        cell_t.text = title
        cell_p.text = page
        p_t = cell_t.paragraphs[0]
        p_p = cell_p.paragraphs[0]
        p_t.paragraph_format.space_before = Pt(0)
        p_t.paragraph_format.space_after = Pt(0.5)
        p_t.paragraph_format.line_spacing = 1.05
        p_p.paragraph_format.space_before = Pt(0)
        p_p.paragraph_format.space_after = Pt(0.5)
        p_p.paragraph_format.line_spacing = 1.05
        p_p.alignment = WD_ALIGN_PARAGRAPH.RIGHT

        # Cell margins
        tcPr_t = cell_t._tc.get_or_add_tcPr()
        tcMar_t = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="20" w:type="dxa"/><w:bottom w:w="20" w:type="dxa"/></w:tcMar>')
        tcPr_t.append(tcMar_t)
        tcPr_p = cell_p._tc.get_or_add_tcPr()
        tcMar_p = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="20" w:type="dxa"/><w:bottom w:w="20" w:type="dxa"/></w:tcMar>')
        tcPr_p.append(tcMar_p)

        if not title.startswith("  "):
            p_t.runs[0].bold = True
            p_p.runs[0].bold = True
            p_t.runs[0].font.size = Pt(8.5)
            p_p.runs[0].font.size = Pt(8.5)
            p_t.runs[0].font.color.rgb = BLACK
            p_p.runs[0].font.color.rgb = BLACK
        else:
            p_t.runs[0].font.size = Pt(8)
            p_p.runs[0].font.size = Pt(8)
            p_t.runs[0].font.color.rgb = DARK_CHARCOAL
            p_p.runs[0].font.color.rgb = DARK_CHARCOAL

    doc.add_page_break()

    # =========================================================================
    # PAGE 5: CHAPTER 1 & CHAPTER 2 (Introduction & Theoretical Foundations)
    # =========================================================================
    add_h1("CHAPTER 1: INTRODUCTION")
    add_h2("1.1 Background & Context")
    add_p("Digital entertainment streaming platforms generate massive streams of operational interactions: ratings, searches, reviews, and qualitative tagging. Deriving strategic business intelligence from these signals requires two distinct database paradigms: Online Transaction Processing (OLTP) for atomic point operations, and Online Analytical Processing (OLAP) for historical decision support.")
    
    add_h2("1.2 Problem Statement & Project Objectives")
    add_p("Performing multi-attribute aggregations directly on normalized relational tables causes severe query latency due to expensive multi-table Cartesian joins across millions of rows, while introducing lock contention on active user tables. CineVault resolves this by: (1) Designing a conformed Star Schema data warehouse; (2) Engineering an automated multi-stage ETL pipeline; (3) Constructing an in-memory OLAP cube engine; (4) Integrating K-Means clustering and TF-IDF content-based recommendation algorithms; and (5) Delivering an interactive full-stack web application.")

    add_h1("CHAPTER 2: THEORETICAL FOUNDATIONS & LITERATURE REVIEW")
    add_h2("2.1 OLTP vs. OLAP Paradigms")
    add_p("The table below contrasts operational transactional systems with analytical data warehouses:")

    t_comp = doc.add_table(rows=5, cols=3)
    comp_data = [
        ["Dimension", "OLTP (Transactional Layer)", "OLAP (Analytical Layer)"],
        ["Primary Goal", "Day-to-day atomic transactions", "Historical decision support & BI"],
        ["Data Model", "Normalized (3NF) relational tables", "Denormalized Star Schema (Facts + Dims)"],
        ["Query Types", "High frequency, row-level lookups", "Complex multi-attribute aggregations"],
        ["Optimization", "ACID guarantees, low write latency", "Fast sequential scans, group-by speed"]
    ]
    for r_idx, row in enumerate(comp_data):
        for c_idx, val in enumerate(row):
            t_comp.cell(r_idx, c_idx).text = val
    format_minimal_table(t_comp)

    add_h2("2.2 Ralph Kimball Dimensional Modeling & Cube Operations")
    add_p("Dimensional modeling separates business measurements (Fact Tables) from descriptive business contexts (Dimension Tables). Denormalizing dimensions directly around a central fact table minimizes query join hops. On top of the star schema, Multidimensional OLAP Cube operations enable interactive data exploration: Roll-Up aggregates up hierarchies; Drill-Down reveals granular breakdowns; Slice filters on a single dimension; Dice isolates multi-dimensional sub-cubes; and Pivot rotates dimensions across axes.")

    doc.add_page_break()

    # =========================================================================
    # PAGE 6: CHAPTER 3: SYSTEM ARCHITECTURE & DIMENSIONAL DESIGN
    # =========================================================================
    add_h1("CHAPTER 3: SYSTEM ARCHITECTURE & DIMENSIONAL DESIGN")
    add_h2("3.1 Three-Tier Decoupled Architecture")
    add_p("CineVault implements an enterprise 3-tier decoupled architecture: (1) Presentation Tier: Built with React 18, Vite, and Tailwind CSS, providing distinct Admin Decision-Support and End-User Discovery portals; (2) Application Tier: High-performance Python 3.11 asynchronous FastAPI server hosting modular REST routers, in-memory OLAP operations, and Scikit-learn ML routines; and (3) Data Tier: SQLite storage maintaining separated OLTP transactional tables alongside a Kimball Star Schema.")

    add_h2("3.2 Conformed Star Schema Specification")
    add_p("The analytical warehouse models movie evaluations via a central fact table surrounded by four dimension tables:")

    t_star = doc.add_table(rows=6, cols=4)
    star_data = [
        ["Table Name", "Table Type", "Verified Records", "Key Attributes & Architectural Role"],
        ["fact_rating", "Central Fact", "102,677 rows", "id, user_id (FK), movie_id (FK), date_id (FK), tag_id (FK), rating"],
        ["dim_movie", "Dimension", "9,742 rows", "movie_id (PK), title, genres (normalized pipe-separated)"],
        ["dim_user", "Dimension", "610 rows", "user_id (PK), total_ratings, avg_rating (aggregated profile)"],
        ["dim_date", "Dimension", "85,043 rows", "date_id (PK), full_date, year, month, day, day_of_week, quarter"],
        ["dim_tag", "Dimension", "1,589 rows", "tag_id (PK), tag (unique deduplicated vocabulary)"]
    ]
    for r_idx, row in enumerate(star_data):
        for c_idx, val in enumerate(row):
            t_star.cell(r_idx, c_idx).text = val
    format_minimal_table(t_star)

    add_screenshot_placeholder(
        "1",
        "System Architecture & Dimensional Star Schema Model",
        "Place architectural diagram illustrating Presentation, Application, and Data tiers alongside the Star Schema ERD.",
        height_pt=140
    )

    doc.add_page_break()

    # =========================================================================
    # PAGE 7: CHAPTER 4: ETL PIPELINE IMPLEMENTATION
    # =========================================================================
    add_h1("CHAPTER 4: ETL PIPELINE IMPLEMENTATION")
    add_h2("4.1 Extraction Stage")
    add_p("The automated ETL pipeline extracts raw data from four canonical MovieLens CSV files: movies.csv (9,742 records of movie identifiers, titles, and genre strings), ratings.csv (100,836 individual evaluations on a 0.5 to 5.0 scale), tags.csv (3,683 free-text user tags), and links.csv (9,742 external IMDB/TMDB cross-reference identifiers).")

    add_h2("4.2 Cleaning, Imputation & Transformation")
    add_p("During the transformation phase, the pipeline applies deterministic data engineering rules:")
    add_bullet("Deduplication & Integrity: Eliminates redundant user tags and enforces valid rating bounds (0.5 to 5.0).")
    add_bullet("Temporal Deconstruction: Parses raw epoch timestamps into structured calendar dimensions (Year 1996-2018, Month 1-12, Day 1-31, Day of Week 0-6, and Fiscal Quarter 1-4) stored in dim_date.")
    add_bullet("Surrogate Key Generation: Synthesizes integer surrogate keys for date_id and tag_id, establishing referential integrity.")
    add_bullet("Dimension Pre-Aggregations: Computes per-user historical metrics (total_ratings and avg_rating) to populate dim_user.")

    add_h2("4.3 Loading Stage & Integrity Verification")
    add_p("Clean data is bulk-inserted in strict topological dependency order (dimension tables loaded first, followed by fact_rating). Automated validation confirms 100% referential integrity without orphan foreign keys.")

    add_screenshot_placeholder(
        "2",
        "ETL Pipeline Execution & Warehouse Dataset Overview",
        "Place screenshot of Admin ETL Monitor illustrating extraction metrics, cleaning stages, and dimensional table row counts.",
        height_pt=140
    )

    doc.add_page_break()

    # =========================================================================
    # PAGE 8: CHAPTER 5: MULTIDIMENSIONAL OLAP ENGINE
    # =========================================================================
    add_h1("CHAPTER 5: MULTIDIMENSIONAL OLAP ENGINE")
    add_h2("5.1 Analytical Processing Paradigm")
    add_p("To eliminate repetitive runtime Cartesian joins, CineVault's analytical service caches a consolidated dimensional DataFrame in server memory upon startup. Analytical requests are evaluated directly against this vectorized structure, enabling sub-45ms responses.")

    add_h2("5.2 Five Core OLAP Cube Operations")
    add_p("The analytical engine provides complete implementation of all foundational cube operations:")
    add_bullet("Roll-Up: Aggregates ratings upward through dimensional hierarchies (e.g., summarizing daily ratings into annual totals), providing macro-level volume and average score trends.", "A. Roll-Up: ")
    add_bullet("Drill-Down: Descends into finer levels of granularity (e.g., navigating from Year 2015 into its 12 individual constituent months) to reveal underlying seasonal patterns.", "B. Drill-Down: ")
    add_bullet("Slice: Isolates a sub-cube by fixing a single dimensional criterion (e.g., extracting ratings exclusively where Genre = 'Action'), enabling focused genre performance analysis.", "C. Slice: ")
    add_bullet("Dice: Evaluates multi-dimensional criteria simultaneously across multiple dimensions (e.g., Genre IN ('Action', 'Sci-Fi') AND Year >= 2015 AND Rating >= 4.0).", "D. Dice: ")
    add_bullet("Pivot (Cross-Tabulation): Rotates data axes to render bivariate cross-tabulations (e.g., mapping Genres along rows, Years across columns, and Average Rating in cells).", "E. Pivot: ")

    add_h2("5.3 Query Performance & Memory Efficiency")
    add_p("Vectorized Pandas aggregations avoid iterative row scans, delivering analytical query latency under 45 milliseconds across all 102,677 fact records.")

    add_screenshot_placeholder(
        "3",
        "Interactive OLAP Cube Operations & Aggregation Interface",
        "Place screenshot of Admin OLAP Page showing interactive controls for Roll-up, Drill-down, Slice, Dice, and Pivot tables.",
        height_pt=140
    )

    doc.add_page_break()

    # =========================================================================
    # PAGE 9: CHAPTER 6: MACHINE LEARNING: K-MEANS CLUSTERING
    # =========================================================================
    add_h1("CHAPTER 6: MACHINE LEARNING: K-MEANS CLUSTERING & ELBOW METHOD")
    add_h2("6.1 Unsupervised Clustering Architecture")
    add_p("CineVault deploys Scikit-learn's K-Means clustering algorithm to identify behavioral customer cohorts and group catalog movies based on high-dimensional feature distributions. The algorithm iteratively partitions entities by minimizing within-cluster inertia.")

    add_h2("6.2 Feature Engineering & Cohort Profiles")
    add_p("Entities are represented by specialized, domain-tailored numerical feature vectors:")
    add_bullet("User Behavioral Feature Space: Each user is mapped to a 4-dimensional vector: [avg_rating, total_ratings, rating_std, rating_range]. Clustering segments users into actionable cohorts: Casual Critics (high average, low volume), Power Enthusiasts (exceptionally high volume), and Strict Critics (low average, high variance).")
    add_bullet("Movie Feature Space: Movies are represented by a 13-dimensional vector comprising 3 rating metrics (avg_rating, rating_count, rating_std) combined with 10 binary flags indicating membership in top-10 genres.")

    add_h2("6.3 Mathematical Optimal K Selection via Elbow Method")
    add_p("To avoid arbitrary selection of cluster count K, the system calculates total within-cluster sum of squares (inertia) across K=1 to 10. The resulting coordinate pairs are visualized dynamically on the frontend, allowing administrators to verify the mathematical inflection point.")

    add_screenshot_placeholder(
        "4",
        "K-Means Clustering Scatter Plot & Elbow Method Curve",
        "Place screenshot of Admin Clustering Page showing 2D user scatter visualization alongside the dynamic Elbow inertia curve.",
        height_pt=140
    )

    doc.add_page_break()

    # =========================================================================
    # PAGE 10: CHAPTER 7: MACHINE LEARNING: RECOMMENDATION ENGINE
    # =========================================================================
    add_h1("CHAPTER 7: MACHINE LEARNING: RECOMMENDATION ENGINE")
    add_h2("7.1 Vector Space Model & Document Synthesis")
    add_p("The recommendation subsystem utilizes an Information Retrieval Vector Space Model. For every catalog title, an enriched content document is synthesized by combining normalized genre categories with user-contributed descriptive semantic tags. This produces rich semantic profiles capturing both broad genre classifications and fine-grained thematic nuances.")

    add_h2("7.2 TF-IDF Matrix Formulation & Cosine Distance")
    add_p("Scikit-learn's TfidfVectorizer transforms synthesized documents into a high-dimensional term frequency-inverse document frequency matrix, cached in server memory. Pairwise similarity between movie vectors is computed via Cosine Similarity, measuring the angular distance between vectors independently of document length.")

    add_h2("7.3 Dual-Tier Live Interaction Bridge")
    add_p("To eliminate the cold-start problem common in offline data warehouses, CineVault links newly submitted transactional ratings with historical fact tables. When a logged-in user rates a film on the web portal, the recommender incorporates this rating into their preference vector instantly without requiring an ETL re-run, generating recommendations in under 70 milliseconds.")

    add_screenshot_placeholder(
        "5",
        "Personalized Movie Recommendations & Similarity Scores",
        "Place screenshot of User Recommendations Page showing AI-recommended movie cards, similarity scores, and seed titles.",
        height_pt=140
    )

    doc.add_page_break()

    # =========================================================================
    # PAGE 11: CHAPTER 8: WEB APPLICATION IMPLEMENTATION
    # =========================================================================
    add_h1("CHAPTER 8: FULL-STACK WEB APPLICATION IMPLEMENTATION")
    add_h2("8.1 FastAPI Backend & Security")
    add_p("The backend is built using FastAPI (Python 3.11), organized into modular routers under /api. Passwords are salted and hashed using Python's native bcrypt library, eliminating passlib truncation anomalies. Stateful authentication utilizes JWT tokens signed with HMAC-SHA256, verified via dependency injection.")

    add_h2("8.2 Frontend Architecture (React 18 & Vite)")
    add_p("The frontend is structured as a responsive Single Page Application with Tailwind CSS and Lucide React iconography. An Axios client configured with a Bearer token interceptor and Vite reverse proxy communicates seamlessly with the backend.")

    add_h2("8.3 Role-Based Application Portals")
    add_p("The system delivers two dedicated, role-protected application portals:")
    add_bullet("Administrator Decision-Support Suite (/admin/*): Executive KPI dashboards, interactive OLAP Cube explorer, 2D K-Means scatter inspection, ETL status monitor, and system health checks.", "Admin Portal: ")
    add_bullet("Consumer Discovery Experience (/user/*): Netflix-style catalog with live search, genre filters, interactive rating modals, personal ratings ledger, and AI recommendation shelves.", "User Portal: ")

    add_screenshot_placeholder(
        "6",
        "User Movie Catalog, Search Filters & Rating Modal",
        "Place screenshot of User Discover Page showing the movie grid, live search bar, genre filter chips, and rating submission modal.",
        height_pt=140
    )

    doc.add_page_break()

    # =========================================================================
    # PAGE 12: CHAPTER 9: TESTING & CHAPTER 10: CONCLUSION & REFERENCES
    # =========================================================================
    add_h1("CHAPTER 9: TESTING, VERIFICATION & PERFORMANCE EVALUATION")
    add_h2("9.1 Automated Test Execution Results")
    add_p("Automated unit and integration test suites validated all 27 backend routes with 100% passage:")

    t_test = doc.add_table(rows=6, cols=3)
    t_data = [
        ["Subsystem / Module", "Endpoints & Functions Tested", "Verified Output & Status"],
        ["Auth & Users", "login(), register(), /api/auth/me", "PASS (Status: 200, JWT token returned)"],
        ["Catalog & Ratings", "read_movies(), get_ratings(), get_tags()", "PASS (Status: 200, movie_title joined)"],
        ["ETL Pipeline", "get_etl_status(), dataset_info()", "PASS (Status: 200, Status: 'completed')"],
        ["OLAP Engine", "rollup(), drilldown(), slice(), dice(), pivot()", "PASS (Status: 200, In-memory aggregations)"],
        ["Machine Learning", "perform_kmeans(), elbow(), recommendations()", "PASS (Status: 200, Sub-70ms cosine ranking)"]
    ]
    for r_idx, row in enumerate(t_data):
        for c_idx, val in enumerate(row):
            t_test.cell(r_idx, c_idx).text = val
    format_minimal_table(t_test)

    add_h1("CHAPTER 10: CONCLUSION & FUTURE SCOPE")
    add_h2("10.1 Key Contributions")
    add_p("CineVault successfully demonstrates an end-to-end Data Warehousing and Mining platform. Decoupling operational transactions from a conformed Kimball Star Schema enabled sub-45ms OLAP aggregations. In-memory K-Means clustering and TF-IDF content-based recommendations provide actionable business intelligence and real-time personalization.")

    add_h2("10.2 Future Scope")
    add_p("Future enhancements include: (1) Migrating storage and ETL pipelines to Apache Spark for multi-million record datasets; (2) Incorporating Deep Learning Neural Collaborative Filtering (NCF); and (3) Connecting Apache Kafka for real-time streaming ETL ingestion.")

    doc.add_paragraph().paragraph_format.space_before = Pt(4)
    add_h2("REFERENCES & BIBLIOGRAPHY")
    add_p("1. Kimball, Ralph, and Margy Ross. The Data Warehouse Toolkit: The Definitive Guide to Dimensional Modeling. 3rd ed., John Wiley & Sons, 2013.\n"
          "2. Inmon, William H. Building the Data Warehouse. 4th ed., John Wiley & Sons, 2005.\n"
          "3. Han, Jiawei, Micheline Kamber, and Jian Pei. Data Mining: Concepts and Techniques. 3rd ed., Morgan Kaufmann, 2011.\n"
          "4. Harper, F. M., and Konstan, J. A. 'The MovieLens Datasets: History and Context.' ACM TiiS, vol. 5, no. 4, 2015.\n"
          "5. Pedregosa, Fabian, et al. 'Scikit-learn: Machine Learning in Python.' JMLR, vol. 12, 2011, pp. 2825-2830.")

    output_filename = "PROJECT_REPORT.docx"
    doc.save(output_filename)
    print(f"Polished report successfully generated: {output_filename}")

if __name__ == "__main__":
    build_polished_report()
