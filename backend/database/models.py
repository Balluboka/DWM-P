from sqlalchemy import Column, Integer, String, Float, ForeignKey, UniqueConstraint
from backend.database.connection import Base

class User(Base):
    __tablename__ = 'user'
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password_hash = Column(String)
    role = Column(String, default='user')
    created_at = Column(Integer)

class Movie(Base):
    __tablename__ = 'movie'
    movie_id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    genres = Column(String)
    imdb_id = Column(String, nullable=True)
    tmdb_id = Column(String, nullable=True)

class Rating(Base):
    __tablename__ = 'rating'
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, index=True)
    movie_id = Column(Integer, index=True)
    rating = Column(Float)
    timestamp = Column(Integer)
    __table_args__ = (UniqueConstraint('user_id', 'movie_id', name='uq_user_movie_rating'),)

class Tag(Base):
    __tablename__ = 'tag'
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, index=True)
    movie_id = Column(Integer, index=True)
    tag = Column(String)
    timestamp = Column(Integer)

class DimMovie(Base):
    __tablename__ = 'dim_movie'
    movie_id = Column(Integer, primary_key=True)
    title = Column(String)
    genres = Column(String)

class DimUser(Base):
    __tablename__ = 'dim_user'
    user_id = Column(Integer, primary_key=True)
    total_ratings = Column(Integer, default=0)
    avg_rating = Column(Float, default=0)

class DimDate(Base):
    __tablename__ = 'dim_date'
    date_id = Column(Integer, primary_key=True, autoincrement=True)
    full_date = Column(String)
    year = Column(Integer)
    month = Column(Integer)
    day = Column(Integer)
    day_of_week = Column(Integer)
    quarter = Column(Integer)

class DimTag(Base):
    __tablename__ = 'dim_tag'
    tag_id = Column(Integer, primary_key=True, autoincrement=True)
    tag = Column(String, unique=True)

class FactRating(Base):
    __tablename__ = 'fact_rating'
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('dim_user.user_id'))
    movie_id = Column(Integer, ForeignKey('dim_movie.movie_id'))
    date_id = Column(Integer, ForeignKey('dim_date.date_id'))
    rating = Column(Float)
    tag_id = Column(Integer, ForeignKey('dim_tag.tag_id'), nullable=True)
