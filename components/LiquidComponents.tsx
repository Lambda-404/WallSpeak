import React from 'react';
import { ThemeConfig } from '../types';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
  themeConfig?: ThemeConfig;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', hoverEffect = false, themeConfig }) => {
  const cardStyle = themeConfig ? themeConfig.cardClass : 'bg-white/10 backdrop-blur-xl border border-white/20';
  const textStyle = themeConfig ? themeConfig.textClass : 'text-white';

  return (
    <div className={`
      relative overflow-hidden
      rounded-3xl
      transition-all duration-500 ease-out
      ${cardStyle}
      ${textStyle}
      ${hoverEffect ? 'hover:scale-[1.01] hover:shadow-2xl' : ''}
      ${className}
    `}>
      {!themeConfig?.hideBlobs && (
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
      )}
      <div className="relative z-10 h-full">
        {children}
      </div>
    </div>
  );
};

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  icon?: React.ReactNode;
  themeConfig?: ThemeConfig;
}

export const GlassButton: React.FC<GlassButtonProps> = ({ children, variant = 'primary', icon, className = '', themeConfig, ...props }) => {
  const baseStyle = "flex items-center justify-center gap-2 px-6 py-3 rounded-full font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95";
  const accent = themeConfig?.accentColor || '#2DD4BF';
  
  let variantStyle = {};
  let variantClass = "";

  if (variant === 'primary') {
    variantStyle = { 
        background: themeConfig?.id === 'Light' || themeConfig?.hideBlobs ? accent : `linear-gradient(to right, ${accent}, ${accent}dd)`,
        color: '#fff',
        borderColor: 'transparent'
    };
    variantClass = "shadow-lg hover:shadow-xl border";
  } else if (variant === 'secondary') {
    variantClass = `bg-white/10 hover:bg-white/20 border border-current`;
    if (themeConfig?.id === 'Light' || themeConfig?.id === 'Word' || themeConfig?.id === 'Excel' || themeConfig?.id === 'WeChat') {
        variantClass = "bg-black/5 hover:bg-black/10 border border-black/10 text-black/80";
    }
  } else if (variant === 'ghost') {
    variantClass = "bg-transparent hover:bg-black/5";
    if (!themeConfig?.hideBlobs) variantClass = "bg-transparent hover:bg-white/10";
  }

  return (
    <button 
        className={`${baseStyle} ${variantClass} ${className}`} 
        style={variant === 'primary' ? variantStyle : {}}
        {...props}
    >
      {icon}
      {children}
    </button>
  );
};

export const GlowingBlobBackground = ({ themeConfig }: { themeConfig?: ThemeConfig }) => {
    if (themeConfig?.hideBlobs) {
        return <div className={`fixed inset-0 z-0 ${themeConfig.bgClass}`} />;
    }

    const isLight = themeConfig?.id === 'Light';

    return (
        <div className={`fixed inset-0 z-0 overflow-hidden pointer-events-none ${themeConfig?.bgClass || 'bg-slate-900'}`}>
            <div className={`absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full mix-blend-screen filter blur-[100px] animate-blob ${isLight ? 'bg-purple-300/60' : 'bg-purple-500/30'} opacity-40`} />
            <div className={`absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-2000 ${isLight ? 'bg-teal-300/60' : 'bg-brand-teal/30'} opacity-40`} />
            <div className={`absolute bottom-[-20%] left-[20%] w-[600px] h-[600px] rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-4000 ${isLight ? 'bg-pink-300/60' : 'bg-brand-peach/20'} opacity-40`} />
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
        </div>
    );
};

export const StepIndicator: React.FC<{ currentStep: number; totalSteps: number; themeConfig?: ThemeConfig }> = ({ currentStep, totalSteps, themeConfig }) => {
  const accent = themeConfig?.accentColor || '#2DD4BF';
  return (
    <div className="flex gap-2 justify-center mb-8">
      {Array.from({ length: totalSteps }).map((_, i) => (
        <div 
          key={i}
          className={`h-1.5 rounded-full transition-all duration-500`}
          style={{
             width: i <= currentStep ? '32px' : '8px',
             backgroundColor: i <= currentStep ? accent : (themeConfig?.hideBlobs ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.2)'),
             boxShadow: i <= currentStep ? `0 0 10px ${accent}66` : 'none'
          }}
        />
      ))}
    </div>
  );
};