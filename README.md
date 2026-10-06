# Movie Recommendation & Data Warehouse Analytics System

## Description
This is a BTech mini-project for the Data Warehouse Management (DWM) subject. It is a fully functional web application that demonstrates real-world Data Warehousing, ETL, OLAP analytics, Machine Learning (K-Means Clustering), and Data Visualization applied to a movie recommendation use case. 

The system implements a functional Star Schema data warehouse and performs all operations using genuine backend processing rather than hardcoded mock data.

## Technologies Used
- **Frontend**: React, Vite, Tailwind CSS, Recharts, Lucide React
- **Backend**: Python, FastAPI, Pandas, NumPy
- **Machine Learning**: Scikit-learn (K-Means Clustering, Content-Based Recommendation)
- **Database**: SQLite (with SQLAlchemy ORM)

## Implemented Experiments
1. **ETL + Data Preprocessing**: Automates Extract, Clean, Transform, and Load operations from raw CSVs to a dimensional Star Schema.
2. **OLAP Operations**: Provides interactive Roll-up, Drill-down, Slice, Dice, and Pivot functionalities.
3. **K-Means Clustering**: Unsupervised machine learning to cluster users and movies, integrated with the Elbow Method to determine the optimal K.
4. **Data Visualization**: Real-time generation of Bar, Line, Scatter, Histogram, and Box Plots.
5. **Movie Recommendation System**: A content-based engine recommending movies using TF-IDF and Cosine Similarity on genres and tags.

## Dataset
This project relies on the **MovieLens Latest Small** dataset. You need the following four files:
- `movies.csv`: Movie ID, title, and genres.
- `ratings.csv`: User ratings and timestamps.
- `tags.csv`: User tags applied to movies.
- `links.csv`: Identifiers linking to IMDb and TMDB.

**Note:** Please download the dataset and place the CSV files inside the `data/` directory before running the application.

## Architecture
- **Operational Data Store (ODS)**: Standard tables for typical CRUD operations (Movies, Ratings, Tags, Users).
- **Data Warehouse (Star Schema)**: 
  - Fact Table: `FactRating`
  - Dimension Tables: `DimMovie`, `DimUser`, `DimDate`, `DimTag`
- **Analytics & ML Modules**: Modular implementation to allow easy future extensions for algorithms like Decision Trees, Naive Bayes, Regression, and Apriori.

## Installation & Setup

### Prerequisites
- Python 3.9+
- Node.js 16+
- npm or yarn

### 1. Backend Setup
```bash
# Navigate to the backend folder or project root
# Install dependencies
pip install -r backend/requirements.txt

# Start the FastAPI server
python -m uvicorn backend.main:app --reload
```
The API will run on `http://localhost:8000`.

### 2. Frontend Setup
```bash
# Navigate to the frontend folder
cd frontend

# Install dependencies
npm install

# Start the Vite development server
npm run dev
```
The UI will be accessible at `http://localhost:5173`.

## How to Use
1. **Start both backend and frontend servers.**
2. **Import Dataset**: Place the four MovieLens CSV files into the `data/` folder.
3. **Login**: Access the application. (Default Admin credentials: `admin` / `admin123`).
4. **Run ETL**: Navigate to the Admin Dashboard -> ETL & Preprocessing and run the pipeline to populate the Data Warehouse.
5. **Explore Analytics**: Use the OLAP Analytics tab to perform multi-dimensional analysis.
6. **Machine Learning**: Run K-Means Clustering to identify user or movie segments.
7. **User View**: Login as a standard user to search movies, rate them, and receive personalized recommendations.

## Future Extensibility
The architecture is designed to accommodate additional Data Mining algorithms:
- `backend/ml/classification/` - Ready for Decision Tree & Naive Bayes
- `backend/ml/regression/` - Ready for Linear & Multiple Regression
- `backend/ml/association/` - Ready for Apriori Rule Mining
