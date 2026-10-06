import pandas as pd
from sqlalchemy import text
from backend.database.connection import engine

_FACT_DF = None

def get_fact_data(force_reload=False):
    global _FACT_DF
    if _FACT_DF is None or force_reload:
        query = """
        SELECT f.user_id, f.movie_id, f.date_id, f.rating, 
               m.title, m.genres, d.year, d.month, d.day, d.quarter
        FROM fact_rating f
        JOIN dim_movie m ON f.movie_id = m.movie_id
        JOIN dim_date d ON f.date_id = d.date_id
        """
        _FACT_DF = pd.read_sql(query, engine)
    return _FACT_DF

def clear_fact_cache():
    global _FACT_DF
    _FACT_DF = None

def _normalize_measure(measure):
    m = str(measure or '').lower().strip()
    if 'avg' in m or 'average' in m or 'mean' in m:
        return 'avg_rating', 'mean'
    if 'count' in m:
        return 'count', 'count'
    return 'sum', 'sum'

def _normalize_dimension(dim):
    d = str(dim or '').lower().strip()
    if 'time' in d or 'date' in d:
        return 'time'
    if 'genre' in d:
        return 'genre'
    if 'movie' in d or 'title' in d:
        return 'movie'
    return d

def _normalize_hierarchy(h):
    h = str(h or '').lower().strip()
    if 'year' in h:
        return 'year'
    if 'month' in h:
        return 'month'
    if 'genre' in h:
        return 'genre'
    if 'quarter' in h:
        return 'quarter'
    return h

def rollup(dimension, measure, hierarchy_level):
    df = get_fact_data()
    if df.empty:
        return {'data': [], 'operation': 'Roll-up', 'explanation': 'No data available', 'records': 0}

    dim = _normalize_dimension(dimension)
    h_level = _normalize_hierarchy(hierarchy_level)
    m_name, agg_func = _normalize_measure(measure)

    if dim == 'time':
        group_col = h_level if h_level in ['year', 'month', 'quarter', 'day'] else 'year'
        res = df.groupby(group_col)['rating'].agg(agg_func).reset_index()
        res.columns = ['label', 'value']
        res['label'] = res['label'].astype(str)
        if group_col in ['year', 'month']:
            res = res.sort_values('label', ascending=True)
    elif dim == 'genre' or h_level == 'genre':
        df_exp = df.assign(genre=df['genres'].str.split('|')).explode('genre')
        df_exp = df_exp[df_exp['genre'].str.strip() != '']
        res = df_exp.groupby('genre')['rating'].agg(agg_func).reset_index()
        res.columns = ['label', 'value']
        res = res.sort_values('value', ascending=False)
    else:
        # movie title
        res = df.groupby('title')['rating'].agg(agg_func).reset_index()
        res.columns = ['label', 'value']
        res = res.sort_values('value', ascending=False).head(25)

    if agg_func == 'mean':
        res['value'] = res['value'].round(2)

    data = res.head(50).to_dict('records')
    return {
        'data': data,
        'operation': 'Roll-up',
        'explanation': f"Aggregated {measure} rolled up by {hierarchy_level} across {dimension}",
        'records': len(data)
    }

def drilldown(dimension, measure, hierarchy_level, filter_value=None):
    df = get_fact_data()
    if df.empty:
        return {'data': [], 'operation': 'Drill-down', 'records': 0}

    dim = _normalize_dimension(dimension)
    h_level = _normalize_hierarchy(hierarchy_level)
    m_name, agg_func = _normalize_measure(measure)

    filtered_df = df
    if filter_value:
        f_val = str(filter_value).strip()
        if dim == 'time' and f_val.isdigit():
            filtered_df = df[df['year'] == int(f_val)]
        elif dim in ['movie', 'genre']:
            filtered_df = df[df['genres'].str.contains(f_val, case=False, na=False)]

    if dim == 'time':
        group_col = 'month' if h_level in ['month', 'year'] else h_level
        if group_col not in filtered_df.columns:
            group_col = 'month'
        res = filtered_df.groupby(group_col)['rating'].agg(agg_func).reset_index()
        res.columns = ['label', 'value']
        res['label'] = res['label'].astype(str)
        res = res.sort_values('label', ascending=True)
    else:
        res = filtered_df.groupby('title')['rating'].agg(agg_func).reset_index()
        res.columns = ['label', 'value']
        res = res.sort_values('value', ascending=False).head(25)

    if agg_func == 'mean':
        res['value'] = res['value'].round(2)

    data = res.to_dict('records')
    return {
        'data': data,
        'operation': 'Drill-down',
        'explanation': f"Drilled down to {hierarchy_level}" + (f" with filter '{filter_value}'" if filter_value else ""),
        'records': len(data),
        'filter_applied': filter_value
    }

def slice_op(dimension, value, measure):
    df = get_fact_data()
    if df.empty:
        return {'data': [], 'records': 0}

    dim = _normalize_dimension(dimension)
    m_name, agg_func = _normalize_measure(measure)

    val_str = str(value or '').strip()
    filtered_df = df

    if dim == 'genre':
        if val_str:
            filtered_df = df[df['genres'].str.contains(val_str, case=False, na=False)]
        group_col = 'title'
    elif dim == 'time':
        if val_str.isdigit():
            filtered_df = df[df['year'] == int(val_str)]
        group_col = 'month'
    else:
        if val_str:
            filtered_df = df[df['title'].str.contains(val_str, case=False, na=False)]
        group_col = 'title'

    res = filtered_df.groupby(group_col)['rating'].agg(agg_func).reset_index()
    res.columns = ['label', 'value']
    res['label'] = res['label'].astype(str)
    if agg_func == 'mean':
        res['value'] = res['value'].round(2)
    res = res.sort_values('value', ascending=False).head(20)

    data = res.to_dict('records')
    return {
        'data': data,
        'operation': 'Slice',
        'explanation': f"Sliced by {dimension} = '{value}'",
        'records': len(data),
        'dimension': dimension,
        'value': value
    }

def dice(conditions, measure):
    df = get_fact_data()
    if df.empty:
        return {'data': [], 'records': 0}

    m_name, agg_func = _normalize_measure(measure)
    filtered = df

    if conditions:
        if 'min_rating' in conditions and conditions['min_rating'] is not None:
            filtered = filtered[filtered['rating'] >= float(conditions['min_rating'])]
        if 'max_rating' in conditions and conditions['max_rating'] is not None:
            filtered = filtered[filtered['rating'] <= float(conditions['max_rating'])]
        if 'year_start' in conditions and conditions['year_start']:
            filtered = filtered[filtered['year'] >= int(conditions['year_start'])]
        if 'year_end' in conditions and conditions['year_end']:
            filtered = filtered[filtered['year'] <= int(conditions['year_end'])]
        if 'genres' in conditions and conditions['genres']:
            genre_list = [g.strip() for g in conditions['genres'] if str(g).strip()]
            if genre_list:
                pattern = '|'.join([f"(?:{g})" for g in genre_list])
                filtered = filtered[filtered['genres'].str.contains(pattern, case=False, na=False)]

    group_dim = str(conditions.get('group_by', 'genre')).lower() if conditions else 'genre'
    if 'year' in group_dim or 'time' in group_dim:
        res = filtered.groupby('year')['rating'].agg(agg_func).reset_index()
        res.columns = ['label', 'value']
    else:
        df_exp = filtered.assign(genre=filtered['genres'].str.split('|')).explode('genre')
        df_exp = df_exp[df_exp['genre'].str.strip() != '']
        if conditions and conditions.get('genres'):
            selected_genres = [g.strip().lower() for g in conditions['genres']]
            df_exp = df_exp[df_exp['genre'].str.lower().isin(selected_genres)]
            if df_exp.empty:
                df_exp = filtered.assign(genre=filtered['genres'].str.split('|')).explode('genre')
        res = df_exp.groupby('genre')['rating'].agg(agg_func).reset_index()
        res.columns = ['label', 'value']

    res['label'] = res['label'].astype(str)
    if agg_func == 'mean':
        res['value'] = res['value'].round(2)
    res = res.sort_values('value', ascending=False).head(20)

    data = res.to_dict('records')
    return {
        'data': data,
        'operation': 'Dice',
        'explanation': f"Sub-cube formed by dicing across {len(conditions) if conditions else 0} dimensions: Genres, Years, and Rating Range",
        'records': len(data),
        'total_fact_rows': len(filtered),
        'conditions_applied': conditions
    }


def pivot(rows, columns, measure):
    df = get_fact_data()
    if df.empty:
        return {'data': {'columns': [], 'rows': []}, 'records': 0, 'operation': 'Pivot', 'explanation': 'No data loaded'}

    m_name, agg_func = _normalize_measure(measure)

    def _dim_to_col(dim_str):
        d = str(dim_str or '').lower().strip()
        if 'genre' in d:
            return 'genre'
        if 'year' in d:
            return 'year'
        if 'month' in d:
            return 'month'
        if 'quarter' in d:
            return 'quarter'
        return 'genre'

    r_col = _dim_to_col(rows)
    c_col = _dim_to_col(columns)

    # Avoid same dimension on both axes
    if r_col == c_col:
        c_col = 'year' if r_col == 'genre' else 'genre'

    working_df = df.copy()
    if r_col == 'genre' or c_col == 'genre':
        working_df = working_df.assign(genre=working_df['genres'].str.split('|')).explode('genre')
        working_df = working_df[working_df['genre'].str.strip() != '']

    # Make sure columns exist
    if r_col not in working_df.columns:
        r_col = 'genre'
    if c_col not in working_df.columns:
        c_col = 'year'

    pt = pd.pivot_table(
        working_df,
        values='rating',
        index=r_col,
        columns=c_col,
        aggfunc=agg_func,
        fill_value=0
    )

    # Limit rows and columns for readability
    pt = pt.head(12).iloc[:, -10:]

    cols = [str(c) for c in pt.columns]
    data_rows = []
    for idx, row in pt.iterrows():
        row_dict = {}
        for c in pt.columns:
            val = row[c]
            row_dict[str(c)] = round(float(val), 2) if isinstance(val, (float, int)) else val
        r = {
            'label': str(idx),
            'row_label': str(idx),
            'values': row_dict,
            **row_dict
        }
        data_rows.append(r)

    return {
        'data': {'columns': cols, 'rows': data_rows},
        'operation': 'Pivot',
        'explanation': f"Pivoted {rows} (rows) vs {columns} (columns) — showing {measure} for each cell intersection",
        'records': len(data_rows),
        'total_fact_rows': len(df),
        'rows_dim': rows,
        'cols_dim': columns,
        'measure': measure
    }
