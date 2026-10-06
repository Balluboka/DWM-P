import React, { useEffect, useState } from 'react';

const KPICard = ({ title, value, icon: Icon, color = 'blue', subtitle, change }) => {
  const [animatedValue, setAnimatedValue] = useState(0);

  const colors = {
    blue: 'text-blue-600 bg-blue-50 border-blue-200',
    green: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    purple: 'text-purple-600 bg-purple-50 border-purple-200',
    amber: 'text-amber-600 bg-amber-50 border-amber-200',
    red: 'text-red-600 bg-red-50 border-red-200',
    cyan: 'text-cyan-600 bg-cyan-50 border-cyan-200',
  };

  const selectedColor = colors[color] || colors.blue;

  useEffect(() => {
    if (typeof value === 'number') {
      const duration = 800;
      const steps = 20;
      const stepValue = value / steps;
      let current = 0;
      
      const timer = setInterval(() => {
        current += stepValue;
        if (current >= value) {
          setAnimatedValue(value);
          clearInterval(timer);
        } else {
          setAnimatedValue(Math.floor(current));
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }
  }, [value]);

  const displayValue = typeof value === 'number' ? animatedValue.toLocaleString() : (value ?? '-');

  // Defensive icon rendering: handle both React elements and Component types
  const renderIcon = () => {
    if (!Icon) return null;
    if (React.isValidElement(Icon)) return Icon;
    if (typeof Icon === 'function' || typeof Icon === 'object') {
      return <Icon size={24} />;
    }
    return null;
  };

  return (
    <div className="card hover:border-primary-300 transition-all duration-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-surface-500 text-sm font-semibold mb-1 tracking-wide">{title}</p>
          <h3 className="text-3xl font-extrabold text-surface-900 mb-2">{displayValue}</h3>
          
          {(subtitle || change) && (
            <div className="flex items-center gap-2 text-sm">
              {change && (
                <span className={`font-semibold ${change.startsWith('+') ? 'text-emerald-600' : change.startsWith('-') ? 'text-red-600' : 'text-surface-500'}`}>
                  {change}
                </span>
              )}
              {subtitle && <span className="text-surface-500 font-medium">{subtitle}</span>}
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl border ${selectedColor} shadow-sm shrink-0`}>
          {renderIcon()}
        </div>
      </div>
    </div>
  );
};

export default KPICard;
