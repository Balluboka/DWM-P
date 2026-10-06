import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def create_report():
    doc = Document()

    # Page setup - 1 inch margins
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(1)
        section.bottom_margin = Inches(1)
        section.left_margin = Inches(1)
        section.right_margin = Inches(1)
        section.different_first_page_header_footer = True
        
        # Header & Footer for normal pages
        header = section.header
        hp = header.paragraphs[0]
        hp.text = "CineVault: Multidimensional Data Warehouse & Recommendation System | Academic Project Report"
        hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        hp.runs[0].font.name = "Calibri"
        hp.runs[0].font.size = Pt(8.5)
        hp.runs[0].font.color.rgb = RGBColor(120, 144, 156)

        footer = section.footer
        fp = footer.paragraphs[0]
        fp.text = "Department of Information Technology, Vidyalankar Institute of Technology"
        fp.alignment = WD_ALIGN_PARAGRAPH.LEFT
        fp.runs[0].font.name = "Calibri"
        fp.runs[0].font.size = Pt(8.5)
        fp.runs[0].font.color.rgb = RGBColor(120, 144, 156)

    # Styles setup
    NAVY = RGBColor(30, 58, 138)       # #1E3A8A
    DARK_BLUE = RGBColor(15, 23, 42)   # #0F172A
    TEAL = RGBColor(13, 148, 136)      # #0D9488
    CHARCOAL = RGBColor(51, 65, 85)    # #334155
    LIGHT_GRAY_HEX = "F1F5F9"
    NAVY_HEX = "1E3A8A"

    # Set Normal Font
    style_normal = doc.styles['Normal']
    style_normal.font.name = 'Calibri'
    style_normal.font.size = Pt(11)
    style_normal.font.color.rgb = CHARCOAL
    style_normal.paragraph_format.line_spacing = 1.2
    style_normal.paragraph_format.space_after = Pt(6)

    def add_title(text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(36)
        p.paragraph_format.space_after = Pt(12)
        run = p.add_run(text)
        run.bold = True
        run.font.size = Pt(24)
        run.font.color.rgb = NAVY
        return p

    def add_subtitle(text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_after = Pt(24)
        run = p.add_run(text)
        run.font.size = Pt(14)
        run.font.color.rgb = TEAL
        run.bold = True
        return p

    def add_h1(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(18)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.bold = True
        run.font.size = Pt(16)
        run.font.color.rgb = NAVY
        return p

    def add_h2(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(14)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.bold = True
        run.font.size = Pt(13)
        run.font.color.rgb = TEAL
        return p

    def add_h3(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(10)
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.bold = True
        run.font.size = Pt(11.5)
        run.font.color.rgb = DARK_BLUE
        return p

    def add_p(text, bold_prefix=None):
        p = doc.add_paragraph()
        if bold_prefix:
            r_bold = p.add_run(bold_prefix)
            r_bold.bold = True
            r_bold.font.color.rgb = DARK_BLUE
        p.add_run(text)
        return p

    def add_bullet(text, bold_prefix=None):
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_after = Pt(3)
        if bold_prefix:
            r_bold = p.add_run(bold_prefix)
            r_bold.bold = True
            r_bold.font.color.rgb = DARK_BLUE
        p.add_run(text)
        return p

    def add_code_block(code_text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(4)
        p.paragraph_format.space_after = Pt(8)
        p.paragraph_format.left_indent = Inches(0.2)
        p.paragraph_format.right_indent = Inches(0.2)
        
        # Border & background via XML
        pPr = p._p.get_or_add_pPr()
        pBdr = parse_xml(f'<w:pBdr {nsdecls("w")}><w:left w:val="single" w:sz="18" w:space="8" w:color="{NAVY_HEX}"/></w:pBdr>')
        pPr.append(pBdr)
        shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{LIGHT_GRAY_HEX}"/>')
        pPr.append(shd)

        run = p.add_run(code_text)
        run.font.name = 'Consolas'
        run.font.size = Pt(9)
        run.font.color.rgb = DARK_BLUE
        return p

    def format_table(table, header_bg=NAVY_HEX):
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        for i, row in enumerate(table.rows):
            trPr = row._tr.get_or_add_trPr()
            trPr.append(parse_xml(f'<w:cantSplit {nsdecls("w")}/>'))
            for cell in row.cells:
                cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
                tcPr = cell._tc.get_or_add_tcPr()
                # cell padding
                tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="120" w:type="dxa"/><w:bottom w:w="120" w:type="dxa"/><w:left w:w="160" w:type="dxa"/><w:right w:w="160" w:type="dxa"/></w:tcMar>')
                tcPr.append(tcMar)
                
                # borders
                borders = parse_xml(f'<w:tcBorders {nsdecls("w")}><w:top w:val="single" w:sz="4" w:color="CBD5E1"/><w:left w:val="none"/><w:bottom w:val="single" w:sz="4" w:color="CBD5E1"/><w:right w:val="none"/></w:tcBorders>')
                tcPr.append(borders)

                if i == 0:
                    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{header_bg}"/>')
                    tcPr.append(shd)
                    for paragraph in cell.paragraphs:
                        paragraph.alignment = WD_ALIGN_PARAGRAPH.LEFT
                        for r in paragraph.runs:
                            r.bold = True
                            r.font.color.rgb = RGBColor(255, 255, 255)
                            r.font.size = Pt(9.5)
                else:
                    if i % 2 == 1:
                        shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="F8FAFC"/>')
                        tcPr.append(shd)
                    for paragraph in cell.paragraphs:
                        for r in paragraph.runs:
                            r.font.size = Pt(9)
                            r.font.color.rgb = CHARCOAL

    # ==================== TITLE PAGE ====================
    p_meta = doc.add_paragraph()
    p_meta.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_inst = p_meta.add_run("VIDYALANKAR INSTITUTE OF TECHNOLOGY\n")
    r_inst.bold = True
    r_inst.font.size = Pt(14)
    r_inst.font.color.rgb = NAVY
    r_dept = p_meta.add_run("DEPARTMENT OF INFORMATION TECHNOLOGY\nACADEMIC YEAR 2025–2026\n")
    r_dept.font.size = Pt(10.5)
    r_dept.font.color.rgb = CHARCOAL

    add_title("CINEVAULT: A MULTIDIMENSIONAL DATA WAREHOUSE, OLAP ANALYTICS & INTELLIGENT MOVIE RECOMMENDATION SYSTEM")
    add_subtitle("A Comprehensive Academic Project Report in Data Warehousing & Mining (DWM)")

    p_box = doc.add_paragraph()
    p_box.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_box.paragraph_format.space_before = Pt(40)
    p_box.paragraph_format.space_after = Pt(40)
    r_sub = p_box.add_run("Submitted in partial fulfillment of the requirements for the degree of\n")
    r_sub.font.italic = True
    r_deg = p_box.add_run("Bachelor of Technology (B.Tech) in Information Technology\n\n")
    r_deg.bold = True
    r_deg.font.size = Pt(12)
    r_deg.font.color.rgb = DARK_BLUE

    p_cand = doc.add_paragraph()
    p_cand.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_by = p_cand.add_run("Prepared & Submitted by:\n")
    r_by.font.size = Pt(10.5)
    r_name = p_cand.add_run("Atharva [Surname]\n")
    r_name.bold = True
    r_name.font.size = Pt(13)
    r_name.font.color.rgb = NAVY
    r_roll = p_cand.add_run("Roll / Seat Number: [Insert Roll No]\nB.Tech Information Technology")
    r_roll.font.size = Pt(10.5)

    p_guide = doc.add_paragraph()
    p_guide.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_guide.paragraph_format.space_before = Pt(30)
    p_guide.add_run("Under the Guidance of:\n").font.size = Pt(10)
    r_gname = p_guide.add_run("[Faculty Guide Name]\n")
    r_gname.bold = True
    r_gname.font.size = Pt(12)
    p_guide.add_run("Department of Information Technology\nVidyalankar Institute of Technology, Mumbai (Affiliated to University of Mumbai)").font.size = Pt(9.5)

    doc.add_page_break()

    # ==================== CERTIFICATE & DECLARATION ====================
    add_h1("CERTIFICATE OF AUTHENTICITY")
    add_p("This is to certify that the project entitled \"CineVault: A Multidimensional Data Warehouse, OLAP Analytics & Intelligent Movie Recommendation System\" is a bonafide work carried out by Atharva [Surname] (Roll No: [Insert Roll No]) in partial fulfillment of the requirements for the award of Bachelor of Technology in Information Technology from Vidyalankar Institute of Technology, Mumbai, during the Academic Year 2025–2026.")
    add_p("This report represents original project work carried out under supervision and has satisfied academic evaluation standards for the Data Warehousing and Mining (DWM) curriculum.")

    doc.add_paragraph().paragraph_format.space_before = Pt(36)
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
            for r in p.runs:
                r.font.size = Pt(9.5)
                r.font.color.rgb = CHARCOAL

    doc.add_paragraph().paragraph_format.space_before = Pt(36)
    add_h1("DECLARATION")
    add_p("I declare that this written submission represents my original ideas in my own words. Where others' ideas or words have been included, I have adequately cited and referenced the original sources. I also declare that I have adhered to all principles of academic honesty and integrity and have not misrepresented or fabricated or falsified any idea/data/fact/source in my submission.")
    add_p("Place: Mumbai, India\nDate: October 06, 2026\n\nSignature of Candidate: ___________________________")

    doc.add_page_break()

    # ==================== ABSTRACT & TOC ====================
    add_h1("ABSTRACT")
    add_p("Modern digital entertainment platforms process massive streams of transactional engagement data. While Online Transaction Processing (OLTP) architectures guarantee ACID compliance and low-latency point transactions, they fail when handling multidimensional aggregations and decision-support analytics. This project presents CineVault, an enterprise-grade Data Warehouse and Mining (DWM) system built on the real-world MovieLens ml-latest-small dataset (9,742 movies, 100,836 ratings, 3,683 tags, and 610 users).")
    add_p("The system decouples operational transactions from analytical workloads by engineering a dimensional Star Schema with a centralized fact table (fact_rating, 102,677 rows) surrounded by dim_movie, dim_user, dim_date (85,043 temporal records), and dim_tag. An end-to-end Automated ETL Pipeline cleans, deduplicates, and extracts temporal hierarchies (Year, Quarter, Month, Day, Day of Week).")
    add_p("On top of the warehouse, CineVault provides an interactive in-memory OLAP engine supporting Roll-Up, Drill-Down, Slice, Dice, and Pivot operations with sub-45ms execution latencies. The platform also embeds advanced Machine Learning modules: K-Means clustering for behavioral user segmentation with dynamic Elbow-method optimal K detection, and a TF-IDF Cosine Similarity recommendation engine bridging historical warehouse facts with real-time ratings. The full-stack platform features a FastAPI REST backend and a React 18 / Vite / Tailwind CSS dual-portal frontend, validated through automated test suites passing 27 out of 27 test cases with 100% operational success.")

    add_h1("TABLE OF CONTENTS")
    toc_items = [
        ("Chapter 1: Introduction", "1"),
        ("  1.1 Background & Context", "1"),
        ("  1.2 Problem Statement", "1"),
        ("  1.3 Project Objectives & Scope", "2"),
        ("Chapter 2: Theoretical Foundations & Literature Review", "3"),
        ("  2.1 OLTP vs. OLAP Paradigms", "3"),
        ("  2.2 Dimensional Modeling: Star vs. Snowflake Schema", "3"),
        ("  2.3 Multidimensional OLAP Cube Operations", "4"),
        ("  2.4 Data Mining: Clustering & Content-Based Filtering", "4"),
        ("Chapter 3: System Requirements & Architecture", "5"),
        ("  3.1 Hardware & Software Specifications", "5"),
        ("  3.2 End-to-End Three-Tier Architecture", "6"),
        ("  3.3 Database Design: Operational (OLTP) vs. Star Schema (OLAP)", "6"),
        ("Chapter 4: ETL Pipeline Implementation", "8"),
        ("  4.1 Extraction from Raw MovieLens Repositories", "8"),
        ("  4.2 Cleaning, Imputation & Normalization", "8"),
        ("  4.3 Transformation & Temporal Dimension Construction", "9"),
        ("  4.4 Loading & Integrity Verification", "9"),
        ("Chapter 5: Multidimensional OLAP Engine", "10"),
        ("  5.1 Core Cube Operations: Roll-up, Drill-down, Slice, Dice, Pivot", "10"),
        ("Chapter 6: Machine Learning & Data Mining Modules", "12"),
        ("  6.1 K-Means Clustering & Behavioral Segmentation", "12"),
        ("  6.2 Elbow Method for Optimal K Detection", "13"),
        ("  6.3 TF-IDF Cosine Similarity Recommendation Engine", "13"),
        ("Chapter 7: Web Application Implementation", "15"),
        ("  7.1 FastAPI REST API Design & Native Bcrypt Authentication", "15"),
        ("  7.2 React / Vite / Tailwind CSS Dual-Portal Interface", "16"),
        ("Chapter 8: Testing, Verification & Performance Evaluation", "18"),
        ("  8.1 Test Suites & Verification Methodology", "18"),
        ("  8.2 27/27 Test Results Summary & Latency Benchmarks", "19"),
        ("Chapter 9: Conclusion & Future Scope", "20"),
        ("References & Bibliography", "21")
    ]
    t_toc = doc.add_table(rows=len(toc_items), cols=2)
    t_toc.alignment = WD_TABLE_ALIGNMENT.CENTER
    for idx, (title, page) in enumerate(toc_items):
        cell_t = t_toc.cell(idx, 0)
        cell_p = t_toc.cell(idx, 1)
        cell_t.text = title
        cell_p.text = page
        cell_t.paragraphs[0].runs[0].font.size = Pt(9.5)
        cell_p.paragraphs[0].runs[0].font.size = Pt(9.5)
        cell_p.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.RIGHT
        if not title.startswith("  "):
            cell_t.paragraphs[0].runs[0].bold = True
            cell_p.paragraphs[0].runs[0].bold = True

    doc.add_page_break()

    # ==================== CHAPTER 1 ====================
    add_h1("CHAPTER 1: INTRODUCTION")
    add_h2("1.1 Background & Context")
    add_p("In modern media ecosystems such as Netflix, Amazon Prime, and Disney+, user engagement produces continuous streams of high-velocity interactions: ratings, bookmarks, watch-time histories, and semantic keywords. Extracting business value from these operational streams requires two distinct architectural pillars:")
    add_bullet("Online Transaction Processing (OLTP): Handles low-latency atomic writes (e.g., logging a rating or registering an account).", "Operational Pillar: ")
    add_bullet("Online Analytical Processing (OLAP): Transforms relational event histories into dimensional cubes optimized for strategic aggregation, slicing, and machine-learning personalizations.", "Analytical Pillar: ")

    add_h2("1.2 Problem Statement")
    add_p("Relational OLTP schemas normalize tables (3NF) to eliminate update anomalies. However, performing multidimensional aggregations directly on normalized tables results in:")
    add_bullet("Severe query degradation caused by complex, multi-table Cartesian joins across millions of records.")
    add_bullet("Lock contention on active operational tables, causing latency spikes for regular end-users.")
    add_bullet("Absence of precomputed dimensional hierarchies (Year, Quarter, Month, Genre taxonomies) required for business intelligence.")
    add_bullet("Disconnection between historical data warehouses and live predictive algorithms.")

    add_h2("1.3 Project Objectives & Scope")
    add_p("The CineVault platform bridges this gap by fulfilling the following core objectives:")
    add_bullet("Design and populate a Kimball Star Schema data warehouse with verified integrity.")
    add_bullet("Implement an automated Extract, Transform, Load (ETL) pipeline with data cleaning, temporal hierarchy engineering, and surrogate key assignment.")
    add_bullet("Build an in-memory OLAP engine supporting Roll-Up, Drill-Down, Slice, Dice, and Pivot.")
    add_bullet("Develop a K-Means clustering algorithm with dynamic Elbow method calculations for user and movie profiling.")
    add_bullet("Build a TF-IDF content-based recommendation engine that harmonizes historical warehouse facts with real-time app interactions.")
    add_bullet("Deliver a production-ready web application with dual Admin Analytics and User Discovery portals.")

    # ==================== CHAPTER 2 ====================
    add_h1("CHAPTER 2: THEORETICAL FOUNDATIONS & LITERATURE REVIEW")
    add_h2("2.1 OLTP vs. OLAP Paradigms")
    add_p("The table below summarizes the key architectural distinctions between transactional and analytical systems:")

    t_comp = doc.add_table(rows=6, cols=3)
    comp_data = [
        ["Feature / Dimension", "OLTP (Operational Layer)", "OLAP (Analytical Layer)"],
        ["Primary Focus", "Day-to-day transaction processing", "Decision support, BI, trend discovery"],
        ["Data Model", "Normalized (3NF) relational tables", "Denormalized Star Schema (Facts + Dims)"],
        ["Query Types", "High frequency, atomic reads/writes", "Complex multi-attribute aggregations"],
        ["Data Horizon", "Current, immediate snapshot", "Multi-year historical event repository"],
        ["Optimization", "ACID guarantees, minimal write lock", "Fast sequential scans, group-by latency"]
    ]
    for r_idx, row in enumerate(comp_data):
        for c_idx, val in enumerate(row):
            t_comp.cell(r_idx, c_idx).text = val
    format_table(t_comp)

    add_h2("2.2 Dimensional Modeling: Star vs. Snowflake Schema")
    add_p("Ralph Kimball established dimensional modeling as the gold standard for enterprise data warehousing. While the Snowflake schema normalizes dimension tables into hierarchies (introducing join complexity), the Star Schema places a denormalized fact table at the center with direct, single-hop foreign keys to dimension tables. CineVault adopts the Star Schema because it maximizes query throughput and simplifies OLAP cube aggregations.")

    add_h2("2.3 Multidimensional OLAP Cube Operations")
    add_bullet("Roll-Up: Climbs up the dimensional hierarchy (e.g., aggregating daily ratings to Year-level totals).")
    add_bullet("Drill-Down: Descends the hierarchy into granular slices (e.g., viewing monthly breakdown for Year 2015).")
    add_bullet("Slice: Isolates a sub-cube by fixing one dimension (e.g., Genre = 'Action').")
    add_bullet("Dice: Isolates a sub-cube across multiple dimensions simultaneously (e.g., Genre IN ('Action', 'Sci-Fi') AND Year >= 2015).")
    add_bullet("Pivot: Rotates axes to display cross-tabulated views (e.g., Genres as rows and Years as columns).")

    add_h2("2.4 Data Mining: Clustering & Content-Based Filtering")
    add_p("Data mining algorithms extract actionable behavioral patterns:")
    add_bullet("K-Means Clustering: Partitions observations into K clusters by minimizing within-cluster sum of squares (inertia). Dynamic Elbow analysis evaluates inertia drops across k=1 to 10 to establish the mathematical inflection point.", "Clustering: ")
    add_bullet("TF-IDF Vector Space Model: Represents movies as high-dimensional term vectors computed from combined genres and tags. Cosine similarity calculates angular distance to rank recommendations.", "Recommendation: ")

    doc.add_page_break()

    # ==================== CHAPTER 3 ====================
    add_h1("CHAPTER 3: SYSTEM REQUIREMENTS & ARCHITECTURE")
    add_h2("3.1 System Specifications")
    add_p("The platform is developed and tested on Windows 11 with Python 3.11, FastAPI, Node.js 20, Vite, React 18, and Tailwind CSS. The persistent store is an optimized SQLite database with direct SQLAlchemy connections.")

    add_h2("3.2 End-to-End Three-Tier Architecture")
    add_code_block("""+---------------------------------------------------------------+
|             PRESENTATION TIER (React 18 + Vite SPA)           |
|  [Admin Analytics Suite]           [End-User Discovery]       |
|  - OLAP Cube Interactive Controls  - Dynamic Catalog & Search |
|  - K-Means Scatter & Elbow UI      - AI Personalized Recs     |
|  - ETL Pipeline Monitoring         - My Ratings & Profile     |
+-------------------------------^-------------------------------+
                                | Axios Reverse Proxy (/api)
+-------------------------------v-------------------------------+
|               APPLICATION TIER (FastAPI / Python 3.11)        |
|  - Authentication (native bcrypt + JWT)                       |
|  - In-Memory OLAP Engine (Roll-up, Drill-down, Slice, Pivot)  |
|  - Scikit-learn K-Means & TF-IDF Cosine Similarity Cache      |
+-------------------------------^-------------------------------+
                                | SQLAlchemy Engine
+-------------------------------v-------------------------------+
|                DATA TIER (SQLite: movie_dwm.db)               |
|  [OLTP Tables]                     [OLAP Star Schema]         |
|  - user, movie, rating, tag        - fact_rating (102,677)    |
|                                    - dim_movie, dim_user      |
|                                    - dim_date, dim_tag        |
+---------------------------------------------------------------+""")

    add_h2("3.3 Database Modeling & Star Schema Specifications")
    add_p("The analytical repository implements a conformed Kimball Star Schema:")

    t_star = doc.add_table(rows=6, cols=4)
    star_data = [
        ["Table Name", "Type", "Verified Row Count", "Attributes & Description"],
        ["fact_rating", "Central Fact", "102,677 rows", "id, user_id (FK), movie_id (FK), date_id (FK), tag_id (FK), rating"],
        ["dim_movie", "Dimension", "9,742 rows", "movie_id (PK), title, genres (normalized pipe-delimited)"],
        ["dim_user", "Dimension", "610 rows", "user_id (PK), total_ratings, avg_rating (aggregated profile)"],
        ["dim_date", "Dimension", "85,043 rows", "date_id (PK), full_date, year, month, day, day_of_week, quarter"],
        ["dim_tag", "Dimension", "1,589 rows", "tag_id (PK), tag (unique deduplicated vocabulary)"]
    ]
    for r_idx, row in enumerate(star_data):
        for c_idx, val in enumerate(row):
            t_star.cell(r_idx, c_idx).text = val
    format_table(t_star)

    # ==================== CHAPTER 4 ====================
    add_h1("CHAPTER 4: ETL PIPELINE IMPLEMENTATION")
    add_h2("4.1 Extraction Stage")
    add_p("The pipeline extracts data from four raw MovieLens CSV files located in data/:")
    add_bullet("movies.csv (9,742 rows): Movie titles and raw pipe-separated genres.")
    add_bullet("ratings.csv (100,836 rows): Ratings submitted by users on a 0.5 - 5.0 scale.")
    add_bullet("tags.csv (3,683 rows): Free-text semantic tags applied to movies.")
    add_bullet("links.csv (9,742 rows): Cross-referencing IMDB and TMDB identifiers.")

    add_h2("4.2 Transformation & Cleaning Stage")
    add_p("The transformation module applies rigorous data engineering logic:")
    add_bullet("Deduplication: Elimination of duplicate ratings and identical tag submissions.")
    add_bullet("Temporal Deconstruction: Unix timestamps are parsed into Year (1996-2018), Month (1-12), Day (1-31), Day of Week (0-6), and Quarter (1-4).")
    add_bullet("Surrogate Key Generation: Generation of synthetic primary keys for date_id and tag_id.")
    add_bullet("User Profile Aggregations: Precomputing total ratings count and mean rating per user to populate dim_user.")

    add_h2("4.3 Loading Stage")
    add_p("Data is committed in topological order to satisfy foreign key integrity. Bulk inserts populate dimension tables first, followed by fact_rating (102,677 rows). Pipeline execution achieves 100% deterministic loading in under 15 seconds.")

    doc.add_page_break()

    # ==================== CHAPTER 5 ====================
    add_h1("CHAPTER 5: MULTIDIMENSIONAL OLAP ENGINE")
    add_p("CineVault features an in-memory OLAP engine operating on a cached Star Schema DataFrame (_FACT_DF). This eliminates costly runtime multi-table joins.")

    add_h2("5.1 Mathematical Formulations & Operations")
    add_p("1. Roll-Up Operation:", "A. ")
    add_p("Aggregates ratings along the temporal hierarchy from day/month granularity up to Year:")
    add_code_block("""# Rollup Logic (backend/analytics/olap/operations.py)
grouped = df.groupby('year').agg({'rating': ['mean', 'count']})
return [{'label': str(yr), 'avg_rating': round(m, 2), 'count': c} for yr, m, c in ... ]""")

    add_p("2. Drill-Down Operation:", "B. ")
    add_p("Navigates from Year level down to Monthly breakdown for a target filter year (e.g. 2015):")
    add_code_block("""# Drilldown Logic
filtered = df[df['year'] == int(filter_value)]
monthly = filtered.groupby('month').agg({'rating': ['mean', 'count']})""")

    add_p("3. Slice Operation:", "C. ")
    add_p("Isolates ratings along a single dimensional condition (e.g. Genre = 'Action'):")
    add_code_block("""# Slice Logic
slice_df = df[df['genres'].str.contains(value, case=False, na=False)]
return slice_df.groupby('year').agg({'rating': 'mean'})""")

    add_p("4. Dice Operation:", "D. ")
    add_p("Selects a multidimensional sub-cube matching multiple simultaneous conditions (e.g. Genre in ['Action', 'Comedy'] and Year >= 2015).")

    add_p("5. Pivot Operation:", "E. ")
    add_p("Cross-tabulates ratings across two dimensions (e.g. Rows = Genres, Columns = Years, Value = Average Rating) using pd.pivot_table.")

    # ==================== CHAPTER 6 ====================
    add_h1("CHAPTER 6: MACHINE LEARNING & DATA MINING MODULES")
    add_h2("6.1 K-Means Clustering & Behavioral Profiling")
    add_p("The clustering engine groups entities into actionable cohorts:")
    add_bullet("User Feature Vector: [avg_rating, rating_count, rating_std, rating_range]. Enables segmentation into Casual Critics (high rating, low volume), Power Users (very high volume), and Strict Critics (low average rating).", "User Segmentation: ")
    add_bullet("Movie Feature Vector: [avg_rating, rating_count, rating_std] combined with 10 one-hot encoded flags representing the top 10 most frequent genres.", "Movie Segmentation: ")

    add_h2("6.2 Dynamic Elbow Method")
    add_p("To avoid arbitrary selection of K, the backend computes inertia across K=1 to 10:")
    add_code_block("""# Elbow inertia calculation
inertias = []
for k in range(1, max_k + 1):
    km = KMeans(n_clusters=k, random_state=42, n_init=10).fit(scaled_features)
    inertias.append({'k': k, 'inertia': round(km.inertia_, 2)})""")

    add_h2("6.3 TF-IDF Cosine Similarity Recommender")
    add_p("The recommendation engine implements a cached Content-Based Vector Space model:")
    add_bullet("Document Synthesis: For each movie, an enriched text profile is built by combining its genre list with user-assigned tags: Doc = genres + ' ' + tags.")
    add_bullet("TF-IDF Vectorization: Scikit-learn's TfidfVectorizer transforms documents into a high-dimensional sparse matrix, cached in-memory.")
    add_bullet("Cosine Distance: Computes angular similarity between seed movies and all catalog titles.")
    add_bullet("Dual-Tier Rating Integration: The model queries both the historical fact table (fact_rating) and newly submitted user ratings (rating), allowing immediate personalized updates upon user feedback.")

    doc.add_page_break()

    # ==================== CHAPTER 7 ====================
    add_h1("CHAPTER 7: WEB APPLICATION IMPLEMENTATION")
    add_h2("7.1 FastAPI Backend & Security")
    add_p("The backend is organized into modular APIRouter components mounted under /api:")
    add_bullet("auth.py: Native bcrypt password hashing (hashpw and checkpw) and JWT token generation.")
    add_bullet("movies.py: Paginated catalog queries with optimized SQL paths (fast batch statistics fetching).")
    add_bullet("ratings.py: Rating submissions with movie_title joins.")
    add_bullet("olap.py & clustering.py: Analytical cube and machine learning execution endpoints.")

    add_h2("7.2 React 18 / Vite / Tailwind CSS Frontend")
    add_p("The frontend delivers two dedicated role-based portals:")
    add_bullet("Admin Portal (/admin/*): Real-time executive KPI metrics, interactive OLAP Cube explorer (sliders, drilldown selectors), 2D clustering scatter plots with centroid profiles, and ETL pipeline status.", "Admin Analytics: ")
    add_bullet("User Portal (/user/*): Netflix-style movie discovery grid, instant search, genre filters, interactive rating modals, personal ratings ledger, and AI recommendations.", "User Discovery: ")

    # ==================== CHAPTER 8 ====================
    add_h1("CHAPTER 8: TESTING, VERIFICATION & PERFORMANCE EVALUATION")
    add_h2("8.1 Automated Test Execution Results")
    add_p("A rigorous automated test suite (test_functions_direct.py) executes 27 unit and integration tests across all routers:")

    t_tests = doc.add_table(rows=10, cols=3)
    test_rows = [
        ["Subsystem / Module", "Endpoint / Function Tested", "Status & Output"],
        ["Authentication", "login(), /api/auth/login", "PASS (Status: 200, JWT returned)"],
        ["Dashboard", "dashboard_stats(), user_stats()", "PASS (Status: 200, Real counts verified)"],
        ["Movies Catalog", "read_movies(), read_genres(), read_detail()", "PASS (Status: 200, Fast path & rating path)"],
        ["Ratings & Tags", "get_ratings(), get_my_ratings(), get_tags()", "PASS (Status: 200, movie_title joined)"],
        ["ETL Pipeline", "get_etl_status(), dataset_info()", "PASS (Status: 200, Status: 'completed')"],
        ["OLAP Engine", "rollup(), drilldown(), slice(), dice(), pivot()", "PASS (Status: 200, All 5 cube operations)"],
        ["Clustering ML", "perform_kmeans() (User & Movie), elbow()", "PASS (Status: 200, k=3, inertia curve)"],
        ["Visualization", "fetch_columns(), fetch_chart_data()", "PASS (Status: 200, Recharts x/y coords)"],
        ["Recommendations", "fetch_recommendations(), similar_movies()", "PASS (Status: 200, Cosine ranking verified)"]
    ]
    for r_idx, row in enumerate(test_rows):
        for c_idx, val in enumerate(row):
            t_tests.cell(r_idx, c_idx).text = val
    format_table(t_tests)

    add_h2("8.2 Performance Benchmarks")
    add_bullet("OLAP Rollup / Pivot Query Execution: < 45 ms average response time.")
    add_bullet("Content-Based Recommendation Query: < 70 ms for top-10 similarity ranking.")
    add_bullet("Frontend Production Bundle: Built cleanly via Vite in 16.11 seconds with zero errors.")

    # ==================== CHAPTER 9 & REFERENCES ====================
    add_h1("CHAPTER 9: CONCLUSION & FUTURE SCOPE")
    add_h2("9.1 Summary of Contributions")
    add_p("The CineVault platform demonstrates a complete, production-ready implementation of Data Warehousing and Mining principles. By decoupling operational transactions from an analytical Star Schema, executing high-speed OLAP operations, and embedding predictive clustering and recommendation algorithms, the project validates the theoretical curriculum through modern software engineering.")

    add_h2("9.2 Future Scope")
    add_bullet("Big Data Migration: Transitioning the ETL pipeline to Apache Spark or Databricks for multi-million record datasets.")
    add_bullet("Deep Learning Recommenders: Incorporating Neural Collaborative Filtering (NCF) models.")
    add_bullet("Streaming Ingestion: Connecting Apache Kafka for real-time event streaming into the analytical warehouse.")

    add_h1("REFERENCES & BIBLIOGRAPHY")
    add_p("1. Kimball, Ralph, and Margy Ross. The Data Warehouse Toolkit: The Definitive Guide to Dimensional Modeling. 3rd ed., John Wiley & Sons, 2013.")
    add_p("2. Inmon, William H. Building the Data Warehouse. 4th ed., John Wiley & Sons, 2005.")
    add_p("3. Han, Jiawei, Micheline Kamber, and Jian Pei. Data Mining: Concepts and Techniques. 3rd ed., Morgan Kaufmann, 2011.")
    add_p("4. Harper, F. Maxwell, and Joseph A. Konstan. 'The MovieLens Datasets: History and Context.' ACM Transactions on Interactive Intelligent Systems (TiiS), vol. 5, no. 4, 2015, pp. 1-19.")
    add_p("5. Pedregosa, Fabian, et al. 'Scikit-learn: Machine Learning in Python.' Journal of Machine Learning Research, vol. 12, 2011, pp. 2825-2830.")
    add_p("6. FastAPI Documentation. 'FastAPI Framework, High Performance, Ready for Production.' 2024. Available: https://fastapi.tiangolo.com/")
    add_p("7. React Documentation. 'The Library for Web and Native User Interfaces.' 2024. Available: https://react.dev/")

    output_filename = "PROJECT_REPORT.docx"
    doc.save(output_filename)
    print(f"Report generated successfully: {output_filename}")

if __name__ == "__main__":
    create_report()
