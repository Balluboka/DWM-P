import React, { useState, useRef } from "react";
import {
  Layers, ArrowDownToLine, Scissors, Dice5,
  Table as TableIcon, Box, Sparkles, RotateCcw,
  ChevronRight, RefreshCw
} from "lucide-react";
import api from "../../api/client";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import DataTable from "../../components/common/DataTable";
import { useToast } from "../../contexts/ToastContext";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from "recharts";

const CHART_COLORS = [
  "#2563eb","#7c3aed","#059669","#d97706",
  "#dc2626","#0891b2","#db2777","#4f46e5",
  "#16a34a","#9333ea","#ea580c","#0284c7",
];

const GENRE_LIST = [
  "Action","Adventure","Animation","Children","Comedy",
  "Crime","Documentary","Drama","Fantasy","Film-Noir",
  "Horror","Musical","Mystery","Romance","Sci-Fi",
  "Thriller","War","Western"
];

const DIMENSIONS = {
  Genre:  { label:"Genre",      color:"#2563eb", values: GENRE_LIST.slice(0,3) },
  Year:   { label:"Year",       color:"#7c3aed", values: [2014,2015,2016] },
  Rating: { label:"Avg Rating", color:"#059669", values: [3.0,3.5,4.0] },
};

function OLAPCube3D({ activeOp, xDim, yDim, zDim, cubeData, sliceVal }) {
  const [rotX, setRotX] = useState(-22);
  const [rotY, setRotY] = useState(38);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef(null);

  const onDown = (e) => {
    setDragging(true);
    dragStart.current = { x:e.clientX, y:e.clientY, rx:rotX, ry:rotY };
  };
  const onMove = (e) => {
    if (!dragging || !dragStart.current) return;
    setRotY(dragStart.current.ry + (e.clientX - dragStart.current.x)*0.45);
    setRotX(dragStart.current.rx - (e.clientY - dragStart.current.y)*0.45);
  };
  const onUp = () => setDragging(false);

  const palette = {
    rollup:    { front:"#dbeafe", top:"#bfdbfe", side:"#93c5fd", border:"#2563eb" },
    drilldown: { front:"#dcfce7", top:"#bbf7d0", side:"#86efac", border:"#16a34a" },
    slice:     { front:"#fef9c3", top:"#fef08a", side:"#fde047", border:"#ca8a04" },
    dice:      { front:"#fde68a", top:"#fcd34d", side:"#f59e0b", border:"#d97706" },
    pivot:     { front:"#ede9fe", top:"#ddd6fe", side:"#c4b5fd", border:"#7c3aed" },
  }[activeOp] || { front:"#dbeafe", top:"#bfdbfe", side:"#93c5fd", border:"#2563eb" };

  const xVals = DIMENSIONS[xDim]?.values || ["A","B","C"];
  const yVals = DIMENSIONS[yDim]?.values || [1,2,3];
  const zVals = DIMENSIONS[zDim]?.values || [0.5,1.0,1.5];
  const SIZE = 180;

  const getVal = (xi, yi) => {
    if (!cubeData || cubeData.length === 0) return "--";
    const idx = (xi * 3 + yi) % cubeData.length;
    const v = cubeData[idx]?.value;
    return typeof v === "number" ? v.toFixed(1) : "--";
  };

  const isSliced = activeOp === "slice" && sliceVal;

  return (
    <div className="flex flex-col items-center select-none">
      <p className="text-[10px] text-surface-400 mb-2 flex items-center gap-1">
        <RotateCcw size={10}/> Drag cube to rotate
      </p>
      <div className="relative" style={{ width:260, height:260, perspective:900 }}
        onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}>
        {/* axis labels */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 text-[10px] font-bold pointer-events-none"
          style={{color: DIMENSIONS[yDim]?.color||"#7c3aed"}}>{yDim} ↑</div>
        <div className="absolute bottom-0 right-2 text-[10px] font-bold pointer-events-none"
          style={{color: DIMENSIONS[xDim]?.color||"#2563eb"}}>{xDim} →</div>
        <div className="absolute bottom-0 left-2 text-[10px] font-bold pointer-events-none"
          style={{color: DIMENSIONS[zDim]?.color||"#059669"}}>↗ {zDim}</div>

        <div className="absolute" style={{
          top:35, left:40,
          width:SIZE, height:SIZE,
          transformStyle:"preserve-3d",
          transform:`rotateX(${rotX}deg) rotateY(${rotY}deg)`,
          cursor: dragging?"grabbing":"grab",
          transition: dragging?"none":"transform 0.12s ease",
        }}>
          {/* FRONT */}
          <div className="absolute inset-0 overflow-hidden"
            style={{ transform:`translateZ(${SIZE/2}px)`, border:`2px solid ${palette.border}`, background:palette.front, borderRadius:3 }}>
            <div className="w-full h-full grid grid-cols-3 grid-rows-3 gap-px p-px">
              {yVals.map((_yv,yi) => xVals.map((_xv,xi) => {
                const val = getVal(xi,yi);
                const hl = isSliced;
                return (
                  <div key={`${xi}-${yi}`} className="flex flex-col items-center justify-center rounded-sm"
                    style={{
                      background: hl ? `${palette.border}33` : "rgba(255,255,255,0.6)",
                      border:`1px solid ${hl ? palette.border+"66" : "rgba(0,0,0,0.07)"}`,
                      fontSize:8,
                    }}>
                    <span style={{fontSize:9,fontWeight:900,color:"#1e293b"}}>{val}</span>
                    <span style={{fontSize:7,color:"#94a3b8"}}>{String(_xv).slice(0,5)}</span>
                  </div>
                );
              }))}
            </div>
          </div>
          {/* BACK */}
          <div className="absolute inset-0" style={{
            transform:`rotateY(180deg) translateZ(${SIZE/2}px)`,
            background:palette.side, border:`1.5px solid ${palette.border}44`,
            borderRadius:3, opacity:0.6,
          }}>
            <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-surface-500">
              ← {zDim}
            </div>
          </div>
          {/* RIGHT */}
          <div className="absolute inset-0 overflow-hidden" style={{
            transform:`rotateY(90deg) translateZ(${SIZE/2}px)`,
            background:palette.side, border:`1.5px solid ${palette.border}66`, borderRadius:3,
          }}>
            <div className="w-full h-full flex flex-col justify-around items-center py-2">
              {zVals.map((v,i)=>(
                <div key={i} className="text-[9px] font-bold text-surface-700 px-1.5 py-0.5 rounded"
                  style={{background:`${palette.border}22`}}>
                  {String(v).slice(0,5)}
                </div>
              ))}
            </div>
          </div>
          {/* LEFT */}
          <div className="absolute inset-0" style={{
            transform:`rotateY(-90deg) translateZ(${SIZE/2}px)`,
            background:palette.side, border:`1.5px solid ${palette.border}33`,
            borderRadius:3, opacity:0.45,
          }}/>
          {/* TOP */}
          <div className="absolute inset-0 overflow-hidden" style={{
            transform:`rotateX(90deg) translateZ(${SIZE/2}px)`,
            background:palette.top, border:`2px solid ${palette.border}`, borderRadius:3,
          }}>
            <div className="w-full h-full grid grid-cols-3 gap-px p-1">
              {xVals.map((v,i)=>(
                <div key={i} className="flex items-center justify-center rounded text-center"
                  style={{background:`${palette.border}22`,fontSize:8,fontWeight:700,color:"#334155"}}>
                  {String(v).slice(0,6)}
                </div>
              ))}
            </div>
          </div>
          {/* BOTTOM */}
          <div className="absolute inset-0" style={{
            transform:`rotateX(-90deg) translateZ(${SIZE/2}px)`,
            background:palette.top, border:`1.5px solid ${palette.border}33`,
            borderRadius:3, opacity:0.35,
          }}/>
        </div>
      </div>

      {/* View presets */}
      <div className="flex gap-1.5 mt-3">
        {[{l:"ISO",rx:-22,ry:38},{l:"Front",rx:0,ry:0},{l:"Top",rx:-80,ry:30},{l:"Side",rx:-15,ry:85}]
          .map(v=>(
            <button key={v.l} onClick={()=>{setRotX(v.rx);setRotY(v.ry);}}
              className="px-2 py-0.5 text-[10px] font-bold bg-white border border-surface-200 rounded hover:bg-surface-50 text-surface-600">
              {v.l}
            </button>
          ))}
      </div>

      {/* Axis legend */}
      <div className="flex gap-3 mt-2">
        {[[xDim,"#2563eb"],[yDim,"#7c3aed"],[zDim,"#059669"]].map(([d,c])=>(
          <div key={d} className="flex items-center gap-1 text-[10px] font-bold text-surface-600">
            <span className="w-2.5 h-2.5 rounded-full" style={{background:c}}/>
            {d}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function OLAPPage() {
  const [activeTab, setActiveTab] = useState("rollup");
  const [loading, setLoading]     = useState(false);
  const [result, setResult]       = useState(null);
  const { showToast }             = useToast();

  const [xDim, setXDim] = useState("Genre");
  const [yDim, setYDim] = useState("Year");
  const [zDim, setZDim] = useState("Rating");

  const [measure, setMeasure]               = useState("Average Rating");
  const [dim, setDim]                       = useState("Time");
  const [hierarchyLevel, setHierarchyLevel] = useState("Month");
  const [filterValue, setFilterValue]       = useState("");
  const [selectedGenres, setSelectedGenres] = useState(["Action","Comedy"]);
  const [diceYearStart, setDiceYearStart]   = useState("2014");
  const [diceYearEnd, setDiceYearEnd]       = useState("2018");
  const [diceMinRating, setDiceMinRating]   = useState("3.0");
  const [diceMaxRating, setDiceMaxRating]   = useState("5.0");
  const [diceGroupBy, setDiceGroupBy]       = useState("genre");
  const [pivotRows, setPivotRows]           = useState("Genre");
  const [pivotColumns, setPivotColumns]     = useState("Year");

  const toggleGenre = (g) => {
    if (selectedGenres.includes(g)) {
      if (selectedGenres.length > 1) setSelectedGenres(selectedGenres.filter(x=>x!==g));
      else showToast("At least one genre required","warning");
    } else setSelectedGenres([...selectedGenres,g]);
  };

  const runOperation = async () => {
    setLoading(true);
    try {
      let body = {};
      if (activeTab==="rollup"||activeTab==="drilldown") {
        body = { dimension:dim, measure, hierarchy_level:hierarchyLevel };
        if (activeTab==="drilldown") body.filter_value = filterValue.trim()||"2015";
      } else if (activeTab==="slice") {
        body = { dimension:dim, value:filterValue.trim()||(dim==="Time"?"2015":"Action"), measure };
      } else if (activeTab==="dice") {
        body = { conditions:{
          genres:selectedGenres,
          year_start: diceYearStart?parseInt(diceYearStart):null,
          year_end:   diceYearEnd?parseInt(diceYearEnd):null,
          min_rating: diceMinRating?parseFloat(diceMinRating):null,
          max_rating: diceMaxRating?parseFloat(diceMaxRating):null,
          group_by:   diceGroupBy,
        }, measure };
      } else if (activeTab==="pivot") {
        body = { rows:pivotRows, columns:pivotColumns, measure };
      }
      const res = await api.post(`/olap/${activeTab}`, body);
      setResult(res.data);
      showToast("OLAP operation completed","success");
    } catch(err) {
      showToast("Failed: "+(err.response?.data?.detail||err.message),"error");
    } finally { setLoading(false); }
  };

  const tabs = [
    { id:"rollup",    name:"Roll-Up",    icon:Layers,          desc:"Summarise by climbing the hierarchy (e.g. Month→Year)" },
    { id:"drilldown", name:"Drill-Down", icon:ArrowDownToLine, desc:"Expose finer detail within a chosen level" },
    { id:"slice",     name:"Slice",      icon:Scissors,        desc:"Fix one dimension at a single value" },
    { id:"dice",      name:"Dice",       icon:Dice5,           desc:"Sub-cube: filter across multiple dimensions simultaneously" },
    { id:"pivot",     name:"Pivot",      icon:TableIcon,       desc:"Reassign axes — cross-tabulate Row vs Column" },
  ];

  const cubeData = result?.data
    ? (Array.isArray(result.data)?result.data:result.data.rows||[])
    : [];

  const tabBadge = {
    rollup:"bg-blue-50 text-blue-700 border-blue-200",
    drilldown:"bg-green-50 text-green-700 border-green-200",
    slice:"bg-yellow-50 text-yellow-700 border-yellow-200",
    dice:"bg-amber-50 text-amber-700 border-amber-200",
    pivot:"bg-purple-50 text-purple-700 border-purple-200",
  }[activeTab];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-surface-900 tracking-tight">OLAP Multi-Dimensional Analytics</h1>
        <p className="text-sm text-surface-500 mt-1">Explore the Movie Data Warehouse Cube — interactive 3D operations</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1.5 border-b border-surface-200 overflow-x-auto pb-px">
        {tabs.map(tab=>(
          <button key={tab.id}
            onClick={()=>{ setActiveTab(tab.id); setResult(null); }}
            className={`flex items-center px-4 py-2.5 font-bold text-sm rounded-t-lg border-b-2 -mb-px whitespace-nowrap gap-2 transition-all ${
              activeTab===tab.id
                ?"border-primary-600 text-primary-600 bg-primary-50/60"
                :"border-transparent text-surface-600 hover:text-surface-900 hover:bg-surface-100"
            }`}>
            <tab.icon className="w-4 h-4"/>{tab.name}
          </button>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

        {/* ── 3D Cube panel ── */}
        <div className="xl:col-span-2 bg-white card p-5 border border-surface-200 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-primary-100 text-primary-700 rounded-lg"><Box size={16}/></span>
              <div>
                <h3 className="font-extrabold text-surface-900 text-sm">Interactive 3D Data Cube</h3>
                <p className="text-[10px] text-surface-500">Drag to rotate · assign axes below</p>
              </div>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tabBadge}`}>
              {tabs.find(t=>t.id===activeTab)?.name}
            </span>
          </div>

          {/* Axis selectors */}
          <div className="grid grid-cols-3 gap-2">
            {[["X-Axis",xDim,setXDim,"#2563eb"],["Y-Axis",yDim,setYDim,"#7c3aed"],["Z-Axis",zDim,setZDim,"#059669"]]
              .map(([label,val,set,color])=>(
                <div key={label}>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{color}}>{label}</label>
                  <select className="select-field text-xs py-1.5" value={val} onChange={e=>set(e.target.value)}>
                    <option value="Genre">Genre</option>
                    <option value="Year">Year</option>
                    <option value="Rating">Rating</option>
                  </select>
                </div>
              ))}
          </div>

          <OLAPCube3D activeOp={activeTab} xDim={xDim} yDim={yDim} zDim={zDim}
            cubeData={cubeData} sliceVal={filterValue}/>

          <div className="bg-surface-50 rounded-xl p-3 border border-surface-200 text-xs text-surface-600">
            <div className="font-bold text-surface-800 mb-1 flex items-center gap-1">
              <ChevronRight size={12}/>{tabs.find(t=>t.id===activeTab)?.name}
            </div>
            <p>{tabs.find(t=>t.id===activeTab)?.desc}</p>
          </div>
        </div>

        {/* ── Controls + Results ── */}
        <div className="xl:col-span-3 flex flex-col gap-5">
          {/* Controls */}
          <div className="bg-white card p-5 border border-surface-200 shadow-sm space-y-4">
            <h3 className="font-extrabold text-base text-surface-900">
              {tabs.find(t=>t.id===activeTab)?.name} Parameters
            </h3>

            {/* Roll-up / Drill-down / Slice */}
            {(activeTab==="rollup"||activeTab==="drilldown"||activeTab==="slice") && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-surface-700 uppercase tracking-wider mb-1.5">Dimension</label>
                  <select className="select-field" value={dim} onChange={e=>setDim(e.target.value)}>
                    <option value="Time">Time (Temporal)</option>
                    <option value="Genre">Genre (Category)</option>
                    <option value="Movie">Movie (Item)</option>
                  </select>
                </div>
                {(activeTab==="rollup"||activeTab==="drilldown") && (
                  <div>
                    <label className="block text-xs font-bold text-surface-700 uppercase tracking-wider mb-1.5">Hierarchy Level</label>
                    <select className="select-field" value={hierarchyLevel} onChange={e=>setHierarchyLevel(e.target.value)}>
                      <option value="Year">Year (Coarse)</option>
                      <option value="Month">Month (Medium)</option>
                      <option value="Genre">Genre</option>
                    </select>
                  </div>
                )}
                {(activeTab==="drilldown"||activeTab==="slice") && (
                  <div>
                    <label className="block text-xs font-bold text-surface-700 uppercase tracking-wider mb-1.5">
                      {activeTab==="slice"?"Slice Value (fix this coordinate)":"Drill-Down Filter Value"}
                    </label>
                    <input type="text" className="input-field" value={filterValue}
                      onChange={e=>setFilterValue(e.target.value)}
                      placeholder={dim==="Time"?"e.g. 2015":"e.g. Action"}/>
                    <p className="text-[11px] text-surface-500 mt-1">
                      {activeTab==="slice"
                        ?"Keeps one dimension fixed at this value while the other axes remain free."
                        :"Drills into this specific value within the selected dimension."}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Dice */}
            {activeTab==="dice" && (
              <div className="space-y-4">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-xs font-bold text-amber-900 flex items-center gap-1.5 mb-1">
                    <Dice5 size={13} className="text-amber-600"/> Multi-Dimension Sub-Cube
                  </p>
                  <p className="text-[11px] text-amber-700">Filter across Genre, Time, and Rating to carve a sub-cube.</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-surface-700 uppercase tracking-wider mb-1.5">
                    Dim 1 — Genres ({selectedGenres.length} selected)
                  </label>
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2 bg-surface-50 rounded-lg border border-surface-200">
                    {GENRE_LIST.slice(0,10).map(g=>(
                      <button key={g} type="button" onClick={()=>toggleGenre(g)}
                        className={`text-xs px-2.5 py-0.5 rounded-full font-medium transition-all ${
                          selectedGenres.includes(g)?"bg-amber-600 text-white":"bg-white text-surface-600 border border-surface-200 hover:border-amber-400"
                        }`}>
                        {selectedGenres.includes(g)?"✓ ":"+ "}{g}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[["Dim 2 — Year From",diceYearStart,setDiceYearStart,"2014"],
                    ["Year To",diceYearEnd,setDiceYearEnd,"2018"],
                    ["Dim 3 — Min Rating ★",diceMinRating,setDiceMinRating,"3.0"],
                    ["Max Rating ★",diceMaxRating,setDiceMaxRating,"5.0"],
                  ].map(([lbl,val,set,ph])=>(
                    <div key={lbl}>
                      <label className="block text-[10px] text-surface-500 font-medium mb-1">{lbl}</label>
                      <input type="number" step={lbl.includes("Rating")?"0.5":undefined}
                        className="input-field text-sm py-1.5" value={val}
                        onChange={e=>set(e.target.value)} placeholder={ph}/>
                    </div>
                  ))}
                </div>
                <div>
                  <label className="block text-xs font-bold text-surface-700 uppercase tracking-wider mb-1.5">Group Results By</label>
                  <select className="select-field" value={diceGroupBy} onChange={e=>setDiceGroupBy(e.target.value)}>
                    <option value="genre">Genre Dimension</option>
                    <option value="year">Year / Time Dimension</option>
                  </select>
                </div>
              </div>
            )}

            {/* Pivot */}
            {activeTab==="pivot" && (
              <div className="space-y-4">
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl">
                  <p className="text-xs font-bold text-purple-900 flex items-center gap-1.5 mb-1">
                    <TableIcon size={13} className="text-purple-600"/> Cross-Tabulation
                  </p>
                  <p className="text-[11px] text-purple-700">
                    Select Row and Column dimensions. Each cell = <strong>{measure}</strong> for that coordinate pair.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-surface-700 uppercase tracking-wider mb-1.5">Row Dimension (Vertical)</label>
                    <select className="select-field" value={pivotRows} onChange={e=>setPivotRows(e.target.value)}>
                      <option value="Genre">Genre</option>
                      <option value="Year">Year</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-surface-700 uppercase tracking-wider mb-1.5">Column Dimension (Horizontal)</label>
                    <select className="select-field" value={pivotColumns} onChange={e=>setPivotColumns(e.target.value)}>
                      <option value="Year">Year</option>
                      <option value="Month">Month</option>
                      <option value="Genre">Genre</option>
                    </select>
                  </div>
                </div>
                <div className="p-2.5 bg-surface-50 rounded-lg border border-surface-200 text-[11px] text-surface-600">
                  <strong>Example:</strong> Genre × Year shows the <em>average star rating</em> per genre for each year.
                </div>
              </div>
            )}

            {/* Measure */}
            <div>
              <label className="block text-xs font-bold text-surface-700 uppercase tracking-wider mb-1.5">Cube Measure (Fact Value)</label>
              <select className="select-field" value={measure} onChange={e=>setMeasure(e.target.value)}>
                <option value="Average Rating">Average Rating (Mean ★)</option>
                <option value="Count">Count (# of ratings)</option>
                <option value="Sum Rating">Sum (Total Stars)</option>
              </select>
            </div>

            <button onClick={runOperation} disabled={loading}
              className="btn-primary w-full py-3 text-sm font-bold shadow-md hover:shadow-lg transition-all">
              {loading
                ?<><RefreshCw className="w-4 h-4 mr-2 animate-spin"/>Running…</>
                :<><Sparkles className="w-4 h-4 mr-2"/>RUN {tabs.find(t=>t.id===activeTab)?.name.toUpperCase()}</>
              }
            </button>
          </div>

          {/* Results */}
          {loading ? (
            <div className="card flex items-center justify-center min-h-[200px] border border-surface-200">
              <LoadingSpinner message="Calculating OLAP aggregation…"/>
            </div>
          ) : result ? (
            <div className="space-y-4">
              {/* Summary */}
              <div className="card p-4 bg-white border border-surface-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-extrabold text-primary-700 text-sm flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4"/>{result.operation} — Result
                  </h4>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">✓ Success</span>
                </div>
                <p className="text-surface-700 text-sm">{result.explanation}</p>
                <div className="mt-2 pt-2 border-t border-surface-100 flex flex-wrap gap-4 text-xs text-surface-500 font-medium">
                  <span>Records: <strong className="text-surface-900">{result.records ?? (Array.isArray(result.data)?result.data.length:result.data?.rows?.length) ?? 0}</strong></span>
                  {result.total_fact_rows!==undefined&&<span>Fact rows: <strong className="text-surface-900">{result.total_fact_rows.toLocaleString()}</strong></span>}
                  <span>Measure: <strong className="text-primary-700">{measure}</strong></span>
                </div>
              </div>

              {/* Bar chart */}
              {activeTab!=="pivot" && Array.isArray(result.data) && result.data.length>0 && (
                <div className="card p-5 bg-white border border-surface-200 shadow-sm">
                  <h4 className="text-sm font-bold text-surface-800 mb-3">{result.operation} — Visual Chart</h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={result.data} margin={{top:5,right:5,left:0,bottom:30}}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                        <XAxis dataKey="label" tick={{fontSize:10,fill:"#475569"}} angle={-20} textAnchor="end"/>
                        <YAxis tick={{fontSize:10,fill:"#475569"}}/>
                        <Tooltip contentStyle={{backgroundColor:"#fff",borderRadius:"8px",border:"1px solid #e2e8f0",color:"#0f172a"}}/>
                        <Bar dataKey="value" radius={[4,4,0,0]}>
                          {result.data.map((_,i)=><Cell key={i} fill={CHART_COLORS[i%CHART_COLORS.length]}/>)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Pivot table */}
              {activeTab==="pivot" && result.data && (
                <div className="card p-5 bg-white border border-surface-200 shadow-sm space-y-3">
                  <div>
                    <h3 className="text-sm font-bold text-surface-900">Cross-Tab: {pivotRows} × {pivotColumns}</h3>
                    <p className="text-xs text-surface-500 mt-0.5">Cell value = <strong>{measure}</strong> for that row-column pair</p>
                  </div>
                  <div className="overflow-x-auto border border-surface-200 rounded-xl">
                    <table className="w-full text-left text-xs whitespace-nowrap">
                      <thead className="bg-surface-100 font-bold border-b border-surface-200">
                        <tr>
                          <th className="p-2.5 bg-surface-200/80 border-r border-surface-200">{pivotRows} \ {pivotColumns}</th>
                          {result.data.columns?.map((c,i)=>(
                            <th key={i} className="p-2.5 text-center border-r border-surface-100 font-bold text-surface-700">{c}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-100">
                        {result.data.rows?.map((r,i)=>(
                          <tr key={i} className="hover:bg-primary-50/20 transition-colors">
                            <td className="p-2.5 font-bold bg-surface-50 text-surface-900 border-r border-surface-200">{r.label}</td>
                            {result.data.columns?.map((c,ci)=>{
                              const v = r.values?.[c]??r[c];
                              const disp = v!=null?(typeof v==="number"?v.toFixed(measure.toLowerCase().includes("count")?0:2):v):"–";
                              return (
                                <td key={ci} className={`p-2.5 text-center border-r border-surface-100 font-mono ${v===0||v==="0"?"text-surface-400":"text-surface-900 font-semibold"}`}>
                                  {disp}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Data table */}
              {activeTab!=="pivot" && Array.isArray(result.data) && result.data.length>0 && (
                <div className="card p-4 bg-white border border-surface-200 shadow-sm">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-surface-100">
                    <h4 className="text-sm font-bold text-surface-800">Aggregated Records</h4>
                    <span className="text-xs text-surface-500">{result.data.length} rows</span>
                  </div>
                  <DataTable
                    columns={[
                      { header:"Dimension Label", accessor:"label" },
                      { header:`${measure} (Value)`, accessor: r=>(
                        <span className="font-mono font-bold text-surface-900">
                          {typeof r.value==="number"?r.value.toLocaleString(undefined,{maximumFractionDigits:2}):r.value}
                        </span>
                      )},
                    ]}
                    data={result.data}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="card flex flex-col items-center justify-center min-h-[220px] text-center border border-surface-200 p-8">
              <div className="w-16 h-16 bg-surface-100 text-surface-400 rounded-2xl flex items-center justify-center mb-3">
                <Box size={32}/>
              </div>
              <h3 className="font-bold text-surface-800 text-base">Configure &amp; Run an Operation</h3>
              <p className="text-xs text-surface-500 max-w-xs mt-1">
                Assign axis dimensions on the cube, set parameters above, and click Run to see real warehouse data.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
