import React from 'react';
import { X, Target, Users, TrendingUp, Globe, ShieldCheck, Zap } from 'lucide-react';
import { BusinessSolution } from '../types';

interface BusinessSolutionsProps {
  isOpen: boolean;
  onClose: () => void;
  solution: BusinessSolution | null;
}

const BusinessSolutions: React.FC<BusinessSolutionsProps> = ({ isOpen, onClose, solution }) => {
  if (!isOpen || !solution) return null;

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'target': return <Target className="w-8 h-8 text-indigo-600" />;
      case 'users': return <Users className="w-8 h-8 text-indigo-600" />;
      case 'trending': return <TrendingUp className="w-8 h-8 text-indigo-600" />;
      case 'globe': return <Globe className="w-8 h-8 text-indigo-600" />;
      case 'shield': return <ShieldCheck className="w-8 h-8 text-indigo-600" />;
      case 'zap': return <Zap className="w-8 h-8 text-indigo-600" />;
      default: return <Zap className="w-8 h-8 text-indigo-600" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="relative h-48 bg-indigo-600 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-400 rounded-full translate-x-1/4 translate-y-1/4 blur-3xl" />
          </div>
          <div className="relative z-10 text-center">
            <div className="bg-white p-4 rounded-2xl inline-block mb-4 shadow-xl">
              {getIcon(solution.icon)}
            </div>
            <h3 className="text-3xl font-bold text-white tracking-tight">{solution.title}</h3>
          </div>
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-8">
          <p className="text-lg text-slate-600 mb-8 leading-relaxed">
            {solution.description}
          </p>
          
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Key Strategies</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {solution.details.map((detail, idx) => (
                <div key={idx} className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-indigo-200 transition-colors group">
                  <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    {idx + 1}
                  </div>
                  <p className="text-sm text-slate-700 font-medium">{detail}</p>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-10 flex justify-end">
            <button 
              onClick={onClose}
              className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-95"
            >
              Implement Strategy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessSolutions;
