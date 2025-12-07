import React, { useState, useEffect, useRef } from 'react';
import { GlowingBlobBackground, GlassCard, GlassButton, StepIndicator } from './components/LiquidComponents';
import { INTENTS, getIcon, LANGUAGES, TRANSLATIONS, THEMES } from './constants';
import { IntentType, UserInput, GeneratedMessage, FriendshipMission, TopicSuggestion, WallPost, TargetLanguage, ThemeType, ThemeConfig, AppLanguage } from './types';
import { generateDrafts, generateExtras, generateFormattedMessage } from './services/geminiService';
import { ArrowLeft, Send, Sparkles, RefreshCw, Copy, CheckCircle, BarChart2, Shield, Trophy, Lightbulb, Save, Mail, MessageSquare, Globe, Plus, Clock, Loader2, MoreHorizontal, Settings, X, Check, Lock, RotateCcw, Eye, EyeOff, MessageCircleWarning, Undo2, Wind, Undo, Redo, Trash2, LayoutGrid, User, LogOut, Heart, Leaf, Zap } from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

// --- Helper for Translation ---
const useTranslation = (lang: AppLanguage) => {
    return (key: string): string => {
        return TRANSLATIONS[lang]?.[key] || TRANSLATIONS['English'][key] || key;
    };
};

// --- Encryption Helpers ---
const encodeBase64 = (str: string) => {
    try {
        return btoa(unescape(encodeURIComponent(str)));
    } catch (e) {
        return str;
    }
};

const encodeRot13 = (str: string) => {
    return str.replace(/[a-zA-Z]/g, (c) => {
        const base = c <= 'Z' ? 90 : 122;
        const code = c.charCodeAt(0) + 13;
        return String.fromCharCode(code > base ? code - 26 : code);
    });
};

const reverseString = (str: string) => {
    return str.split('').reverse().join('');
};


// --- Sub-Components ---

const NavigationDock = ({ 
    activeTab, 
    onChange, 
    theme 
}: { 
    activeTab: 'explore' | 'create' | 'me', 
    onChange: (tab: 'explore' | 'create' | 'me') => void,
    theme: ThemeConfig
}) => {
    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
            <div className={`flex items-center gap-2 p-2 rounded-full border shadow-2xl backdrop-blur-xl transition-colors duration-500 ${theme.id === 'Light' ? 'bg-white/90 border-white/60' : 'bg-black/60 border-white/20'}`}>
                <button
                    onClick={() => onChange('explore')}
                    className={`p-3 rounded-full transition-all duration-300 ${activeTab === 'explore' ? 'bg-white text-black shadow-lg scale-110' : theme.id === 'Light' ? 'text-black/60 hover:text-black hover:bg-black/5' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
                >
                    <Globe size={20} />
                </button>
                <button
                    onClick={() => onChange('create')}
                    className={`p-4 rounded-full transition-all duration-300 mx-1 ${activeTab === 'create' ? 'text-white shadow-lg scale-110' : theme.id === 'Light' ? 'text-black/60 hover:text-black hover:bg-black/5' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
                    style={{ backgroundColor: activeTab === 'create' ? theme.accentColor : 'transparent' }}
                >
                    <Plus size={24} strokeWidth={3} />
                </button>
                <button
                    onClick={() => onChange('me')}
                    className={`p-3 rounded-full transition-all duration-300 ${activeTab === 'me' ? 'bg-white text-black shadow-lg scale-110' : theme.id === 'Light' ? 'text-black/60 hover:text-black hover:bg-black/5' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
                >
                    <User size={20} />
                </button>
            </div>
        </div>
    );
};

const MeDashboard = ({
    theme,
    t,
    myPostIds,
    wallPosts,
    onDeletePost,
    appLanguage,
    setAppLanguage,
    currentThemeId,
    setCurrentThemeId
}: {
    theme: ThemeConfig,
    t: (k: string) => string,
    myPostIds: Set<string>,
    wallPosts: WallPost[],
    onDeletePost: (id: string) => void,
    appLanguage: AppLanguage,
    setAppLanguage: (lang: AppLanguage) => void,
    currentThemeId: ThemeType,
    setCurrentThemeId: (id: ThemeType) => void
}) => {
    const myPosts = wallPosts.filter(p => myPostIds.has(p.id));

    return (
        <div className="max-w-4xl mx-auto px-4 pb-32 animate-fade-in">
            <div className="text-center mb-10 pt-10">
                <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 shadow-xl text-4xl border-4 transition-all duration-500 ${theme.id === 'Light' ? 'bg-white border-slate-100' : 'bg-white/10 border-white/5'}`}>
                    🤠
                </div>
                <h2 className="text-3xl font-bold mb-2">My Space</h2>
                <p className="opacity-60">Manage your settings and anonymous history.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                {/* Settings Section */}
                <GlassCard className="p-6" themeConfig={theme}>
                    <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                        <Settings size={18} /> {t('settings.theme')} & {t('settings.language')}
                    </h3>
                    
                    <div className="space-y-6">
                        <div>
                            <label className="text-xs font-bold uppercase tracking-wider opacity-50 mb-3 block">{t('settings.language')}</label>
                            <div className="grid grid-cols-2 gap-2">
                                {LANGUAGES.map(lang => (
                                    <button
                                        key={lang.value}
                                        onClick={() => setAppLanguage(lang.value)}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-all ${appLanguage === lang.value ? 'font-medium shadow-sm' : 'border-transparent bg-black/5 hover:bg-black/10'}`}
                                        style={{ 
                                            borderColor: appLanguage === lang.value ? theme.accentColor : 'transparent', 
                                            backgroundColor: appLanguage === lang.value ? (theme.id === 'Light' ? theme.accentColor + '11' : theme.accentColor + '22') : undefined,
                                            color: appLanguage === lang.value && theme.id === 'Light' ? theme.accentColor : undefined
                                        }}
                                    >
                                        <span className="text-lg">{lang.flag}</span>
                                        {lang.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold uppercase tracking-wider opacity-50 mb-3 block">{t('settings.theme')}</label>
                            <div className="grid grid-cols-2 gap-2 max-h-[240px] overflow-y-auto pr-1 custom-scrollbar">
                                {THEMES.map(th => (
                                    <button
                                        key={th.id}
                                        onClick={() => setCurrentThemeId(th.id)}
                                        className={`flex items-center justify-between px-3 py-2 rounded-xl border text-sm transition-all ${currentThemeId === th.id ? 'border-current font-medium shadow-sm' : 'border-transparent bg-black/5 hover:bg-black/10'}`}
                                        style={{ 
                                            backgroundColor: currentThemeId === th.id ? (theme.id === 'Light' ? theme.accentColor + '11' : theme.accentColor + '22') : undefined,
                                            borderColor: currentThemeId === th.id ? theme.accentColor : 'transparent',
                                            color: currentThemeId === th.id && theme.id === 'Light' ? theme.accentColor : undefined
                                        }}
                                    >
                                        {th.label}
                                        {currentThemeId === th.id && <Check size={14} style={{ color: theme.accentColor }}/>}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </GlassCard>

                {/* My Posts Section */}
                <GlassCard className="p-6" themeConfig={theme}>
                    <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                        <LayoutGrid size={18} /> My Whispers ({myPosts.length})
                    </h3>
                    
                    {myPosts.length === 0 ? (
                        <div className={`h-40 flex flex-col items-center justify-center opacity-40 text-sm border-2 border-dashed rounded-xl ${theme.id === 'Light' ? 'border-black/10' : 'border-white/10'}`}>
                            <Wind size={24} className="mb-2" />
                            <p>You haven't posted anything yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {myPosts.map(post => (
                                <div key={post.id} className={`p-4 rounded-xl border transition-all group ${theme.id === 'Light' ? 'bg-white border-black/5 shadow-sm' : 'bg-white/5 border-white/10'}`}>
                                    <p className="text-sm line-clamp-2 italic mb-3 opacity-80 break-words">"{post.content}"</p>
                                    <div className="flex justify-between items-center text-xs opacity-50">
                                        <span>{new Date(post.timestamp).toLocaleDateString()}</span>
                                        <button 
                                            onClick={() => onDeletePost(post.id)}
                                            className="flex items-center gap-1 hover:text-red-400 transition-colors"
                                        >
                                            <Trash2 size={12} /> Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </GlassCard>
            </div>
        </div>
    );
};

const HeroSection = ({ onStart, t, theme }: { onStart: () => void, t: (k:string)=>string, theme: ThemeConfig }) => (
  <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-6 animate-fade-in">
    <div className={`mb-8 p-6 rounded-[2rem] border shadow-[0_0_50px_rgba(45,212,191,0.15)] ${theme.cardClass} relative group`}>
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
        <div style={{ color: theme.accentColor }}>{getIcon('Feather', 64)}</div>
    </div>
    <h1 className="text-5xl md:text-8xl font-bold mb-8 tracking-tighter bg-clip-text text-transparent transform transition-all duration-700 hover:scale-105"
        style={{ backgroundImage: `linear-gradient(to right, ${theme.textClass === 'text-white' ? '#fff' : '#111'}, ${theme.accentColor})` }}>
      {t('hero.title')}
    </h1>
    <p className={`text-xl md:text-2xl max-w-lg mb-12 leading-relaxed font-light whitespace-pre-line opacity-70`}>
      {t('hero.subtitle')}
    </p>
    <GlassButton onClick={onStart} className="text-lg px-12 py-5 shadow-xl hover:shadow-2xl hover:-translate-y-1" themeConfig={theme}>
      {t('hero.start')}
    </GlassButton>
  </div>
);

const IntentSelection = ({ onSelect, t, theme }: { onSelect: (intent: IntentType) => void, t: (k:string)=>string, theme: ThemeConfig }) => (
  <div className="max-w-5xl mx-auto px-4 py-8 animate-slide-up pb-32">
    <h2 className="text-3xl font-semibold text-center mb-2">{t('intent.title')}</h2>
    <p className="text-center opacity-50 mb-10">{t('intent.subtitle')}</p>
    
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {INTENTS.map((intent) => (
        <GlassCard 
          key={intent.type} 
          hoverEffect 
          themeConfig={theme}
          className="cursor-pointer group relative"
        >
            <button 
                onClick={() => onSelect(intent.type)} 
                className="w-full h-full p-6 flex flex-col items-center text-center focus:outline-none"
            >
              <div className={`p-4 rounded-2xl mb-4 transition-all duration-300 shadow-inner group-hover:scale-110`}
                   style={{ backgroundColor: theme.hideBlobs ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)' }}>
                {getIcon(intent.icon, 32)}
              </div>
              <h3 className="text-lg font-medium mb-1">{intent.label}</h3>
              <p className="text-xs opacity-50">{intent.description}</p>
            </button>
        </GlassCard>
      ))}
    </div>
  </div>
);

const DraftingSpace = ({ 
  intent, 
  data, 
  onChange, 
  onNext, 
  onBack,
  t,
  theme,
  onUndo,
  onRedo,
  canUndo,
  canRedo
}: { 
  intent: IntentType, 
  data: UserInput, 
  onChange: (field: keyof UserInput, value: any) => void,
  onNext: () => void,
  onBack: () => void,
  t: (k:string)=>string,
  theme: ThemeConfig,
  onUndo: () => void,
  onRedo: () => void,
  canUndo: boolean,
  canRedo: boolean
}) => {
    const config = INTENTS.find(i => i.type === intent);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');
    const [draftAvailable, setDraftAvailable] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('whisperwall_draft');
        if (saved) setDraftAvailable(true);
    }, []);

    const handleSave = () => {
        localStorage.setItem('whisperwall_draft', JSON.stringify(data));
        setSaveStatus('saved');
        setDraftAvailable(true);
        setTimeout(() => setSaveStatus('idle'), 2000);
    };

    const handleLoad = () => {
        const saved = localStorage.getItem('whisperwall_draft');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed.recipient) onChange('recipient', parsed.recipient);
                if (parsed.relationship) onChange('relationship', parsed.relationship);
                if (parsed.context) onChange('context', parsed.context);
                if (parsed.intent) onChange('intent', parsed.intent);
                if (parsed.targetLanguage) onChange('targetLanguage', parsed.targetLanguage);
            } catch (e) {
                console.error("Failed to load draft", e);
            }
        }
    };

    const inputClass = `w-full rounded-xl px-4 py-3 focus:outline-none transition-all placeholder-opacity-40 shadow-sm focus:ring-2 focus:ring-opacity-30 ${
        theme.hideBlobs 
        ? 'bg-black/5 border border-black/10 focus:bg-white text-black' 
        : 'bg-black/20 border border-white/10 focus:bg-black/40 text-white placeholder-white/30'
    }`;

    return (
        <div className="max-w-2xl mx-auto px-4 py-8 animate-slide-up pb-32">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:opacity-80 rounded-full transition-colors">
                        <ArrowLeft className="opacity-70" />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg" style={{ backgroundColor: theme.accentColor + '22' }}>
                            {getIcon(config?.icon || 'Feather', 20)}
                        </div>
                        <h2 className="text-2xl font-semibold">{config?.label}</h2>
                    </div>
                </div>

                {/* Undo/Redo Controls */}
                <div className={`flex items-center gap-2 rounded-full p-1 border ${theme.id === 'Light' ? 'bg-black/5 border-black/5' : 'bg-white/5 border-white/5'}`}>
                    <button 
                        onClick={onUndo} 
                        disabled={!canUndo}
                        className={`p-2 rounded-full transition-all ${canUndo ? 'hover:bg-white/10 opacity-100' : 'opacity-30 cursor-not-allowed'}`}
                        title="Undo"
                    >
                        <Undo size={18} />
                    </button>
                    <div className={`w-px h-4 ${theme.id === 'Light' ? 'bg-black/10' : 'bg-white/10'}`}></div>
                    <button 
                        onClick={onRedo} 
                        disabled={!canRedo}
                        className={`p-2 rounded-full transition-all ${canRedo ? 'hover:bg-white/10 opacity-100' : 'opacity-30 cursor-not-allowed'}`}
                        title="Redo"
                    >
                        <Redo size={18} />
                    </button>
                </div>
            </div>

            <GlassCard className="p-8 space-y-6" themeConfig={theme}>
                <div className="space-y-2">
                    <label className="text-sm font-medium opacity-70 uppercase tracking-wider pl-1">{t('drafting.targetLanguage')}</label>
                    <div className="flex gap-2 flex-wrap">
                        {LANGUAGES.map((lang) => (
                            <button
                                key={lang.value}
                                onClick={() => onChange('targetLanguage', lang.value)}
                                className={`
                                    flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-300 text-sm
                                    ${data.targetLanguage === lang.value 
                                        ? `shadow-[0_0_15px_${theme.accentColor}33]` 
                                        : 'opacity-60 hover:opacity-100'
                                    }
                                `}
                                style={{
                                    borderColor: data.targetLanguage === lang.value ? theme.accentColor : 'transparent',
                                    backgroundColor: data.targetLanguage === lang.value ? theme.accentColor + '22' : (theme.hideBlobs ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'),
                                    color: theme.textClass.includes('white') ? 'white' : (data.targetLanguage === lang.value ? theme.accentColor : 'inherit')
                                }}
                            >
                                <span className="text-lg">{lang.flag}</span>
                                <span>{lang.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium uppercase tracking-wider pl-1" style={{ color: theme.accentColor }}>{t('drafting.recipient')}</label>
                    <input 
                        type="text" 
                        value={data.recipient}
                        onChange={(e) => onChange('recipient', e.target.value)}
                        placeholder={t('drafting.recipientPlaceholder')}
                        className={inputClass}
                        style={{ borderColor: theme.hideBlobs ? undefined : 'rgba(255,255,255,0.1)' }}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium uppercase tracking-wider pl-1" style={{ color: theme.accentColor }}>{t('drafting.relationship')}</label>
                    <input 
                        type="text" 
                        value={data.relationship}
                        onChange={(e) => onChange('relationship', e.target.value)}
                        placeholder={t('drafting.relationshipPlaceholder')}
                        className={inputClass}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium uppercase tracking-wider pl-1" style={{ color: theme.accentColor }}>{t('drafting.context')}</label>
                    <textarea 
                        value={data.context}
                        onChange={(e) => onChange('context', e.target.value)}
                        placeholder={t('drafting.contextPlaceholder')}
                        className={`${inputClass} h-40 resize-none`}
                    />
                </div>

                <div className="pt-4 flex justify-between items-center">
                     <div className="flex gap-2 relative">
                        <GlassButton 
                            variant="secondary" 
                            onClick={handleSave}
                            themeConfig={theme}
                            className="px-4 text-sm relative overflow-hidden group"
                            icon={saveStatus === 'saved' ? <CheckCircle size={16}/> : <Save size={16}/>}
                        >
                            {saveStatus === 'saved' ? t('drafting.saved') : t('drafting.save')}
                        </GlassButton>
                        {draftAvailable && (
                             <GlassButton 
                                variant="ghost" 
                                onClick={handleLoad}
                                themeConfig={theme}
                                className="px-4 text-sm"
                            >
                                {t('drafting.load')}
                            </GlassButton>
                        )}
                    </div>
                    
                    <GlassButton 
                        onClick={onNext} 
                        themeConfig={theme}
                        disabled={!data.recipient || !data.context}
                        icon={<Sparkles size={18} />}
                    >
                        {t('drafting.generate')}
                    </GlassButton>
                </div>
            </GlassCard>
        </div>
    );
};

const GenerationView = ({ 
    variations, 
    isLoading, 
    onSelect, 
    safetyAlert,
    t,
    theme
}: { 
    variations: GeneratedMessage[], 
    isLoading: boolean, 
    onSelect: (msg: GeneratedMessage) => void,
    safetyAlert?: { triggered: boolean, message: string },
    t: (k:string)=>string,
    theme: ThemeConfig
}) => {
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in pb-32">
                <div className="relative w-24 h-24 mb-8">
                    <div className="absolute inset-0 border-t-4 rounded-full animate-spin" style={{ borderColor: theme.accentColor }}></div>
                    <div className="absolute inset-2 border-r-4 rounded-full animate-spin animation-delay-500" style={{ borderColor: theme.accentColor, opacity: 0.5 }}></div>
                </div>
                <h3 className="text-2xl font-light opacity-90">{t('generation.loading')}</h3>
                <p className="opacity-50 mt-2">{t('generation.subtitle')}</p>
            </div>
        );
    }

    if (safetyAlert?.triggered) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-12 animate-slide-up pb-32">
                 <GlassCard className="p-8 border-red-500/30 bg-red-900/10" themeConfig={theme}>
                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className="p-4 bg-red-500/20 rounded-full text-red-200">
                            <Shield size={48} />
                        </div>
                        <h3 className="text-2xl font-semibold text-red-400">Pause for a Moment</h3>
                        <p className="text-lg opacity-80 leading-relaxed">
                            {safetyAlert.message}
                        </p>
                    </div>
                 </GlassCard>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 animate-slide-up pb-32">
             <h2 className="text-3xl font-semibold text-center mb-2">{t('generation.choose')}</h2>
             <p className="text-center opacity-50 mb-10">{t('generation.chooseSubtitle')}</p>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {variations.map((msg, idx) => (
                    <GlassCard key={idx} className="flex flex-col h-full hover:border-current transition-colors duration-300" themeConfig={theme}>
                        <div className="p-6 flex-1">
                            <div className="flex justify-between items-center mb-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider`}
                                      style={{ backgroundColor: theme.accentColor + '22', color: theme.accentColor }}>
                                    {msg.tone}
                                </span>
                            </div>
                            <p className="text-lg leading-relaxed whitespace-pre-wrap font-light opacity-90">
                                "{msg.content}"
                            </p>
                        </div>
                        
                        <div className="px-6 pb-6 pt-2 border-t" style={{ borderColor: theme.hideBlobs ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)' }}>
                            {msg.safetyNote && (
                                <div className="flex gap-2 items-start mb-4 text-xs opacity-60 italic">
                                    <Sparkles size={12} className="mt-0.5 shrink-0" />
                                    <span>{t('generation.safetyNote')}: {msg.safetyNote}</span>
                                </div>
                            )}
                            <GlassButton 
                                variant="secondary" 
                                className="w-full text-sm"
                                onClick={() => onSelect(msg)}
                                themeConfig={theme}
                            >
                                {t('generation.select')}
                            </GlassButton>
                        </div>
                    </GlassCard>
                ))}
             </div>
        </div>
    );
};

const PublicWall = ({ 
    posts, 
    onWrite, 
    t, 
    theme,
    myPostIds,
    onDelete
}: { 
    posts: WallPost[], 
    onWrite: () => void, 
    t: (k:string)=>string, 
    theme: ThemeConfig,
    myPostIds: Set<string>,
    onDelete: (id: string) => void
}) => {
    const [filter, setFilter] = useState<'ALL' | 'VENT'>('ALL');
    const [revealed, setRevealed] = useState<Set<string>>(new Set());
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

    const filteredPosts = posts.filter(p => {
        if (filter === 'VENT') return p.intent === IntentType.VENT;
        return true;
    });

    const toggleReveal = (id: string) => {
        const newSet = new Set(revealed);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setRevealed(newSet);
    };

    const handleDeleteClick = (id: string) => {
        if (confirmDelete === id) {
            onDelete(id);
            setConfirmDelete(null);
        } else {
            setConfirmDelete(id);
            // Auto-reset confirmation after 3 seconds
            setTimeout(() => setConfirmDelete(null), 3000);
        }
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in pb-32">
            
            {/* Header / Landing Hero */}
            <div className="text-center mb-16 relative">
                
                {/* Background Decor */}
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full blur-[80px] pointer-events-none ${theme.id === 'Light' ? 'bg-brand-teal/20' : 'bg-white/5'}`}></div>

                <div className={`w-20 h-20 mx-auto rounded-3xl flex items-center justify-center mb-6 shadow-2xl backdrop-blur-xl border border-white/20 transition-transform hover:scale-105 hover:rotate-3 duration-500 relative z-10 ${theme.id === 'Light' ? 'bg-white/90 shadow-[0_20px_50px_rgba(0,0,0,0.1)]' : 'bg-black/30'}`}>
                    <Globe size={40} style={{ color: theme.accentColor }} className="animate-pulse-slow" />
                </div>
                
                <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-clip-text text-transparent tracking-tight leading-tight relative z-10"
                    style={{ backgroundImage: `linear-gradient(to right, ${theme.textClass === 'text-white' ? '#fff' : '#111'}, ${theme.accentColor})` }}>
                    Campus Whispers
                </h1>
                <p className="text-lg md:text-xl opacity-60 max-w-xl mx-auto mb-8 font-light relative z-10">
                    {t('wall.subtitle')}
                </p>

                {/* Floating CTA */}
                <div className="relative z-20 flex justify-center mb-12">
                    <button 
                        onClick={onWrite} 
                        className={`group relative px-8 py-4 rounded-full flex items-center gap-3 transition-all duration-500 hover:scale-105 border overflow-hidden ${theme.id === 'Light' ? 'bg-white shadow-[0_10px_40px_rgba(0,0,0,0.1)] border-black/5' : 'bg-white/5 border-white/10 shadow-[0_0_40px_rgba(45,212,191,0.2)]'}`}
                    >
                        <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ${theme.id === 'Light' ? 'via-black/5' : 'via-white/10'}`}></div>
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${theme.id === 'Light' ? 'bg-black/5 text-black' : 'bg-brand-teal/20 text-brand-teal'}`}>
                            <Plus size={18} />
                        </span>
                        <span className="font-medium text-lg tracking-wide" style={{ color: theme.textClass === 'text-white' ? 'white' : 'black' }}>
                            {t('wall.write')}
                        </span>
                    </button>
                </div>

                {/* Navigation Pills */}
                <div className={`inline-flex p-1.5 rounded-full border backdrop-blur-md shadow-lg relative z-10 ${theme.id === 'Light' ? 'bg-white/60 border-black/5' : 'bg-white/5 border-white/5'}`}>
                    <button
                        onClick={() => setFilter('ALL')}
                        className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${filter === 'ALL' ? 'text-white shadow-inner' : 'opacity-60 hover:opacity-100'}`}
                        style={filter === 'ALL' ? { backgroundColor: theme.accentColor, color: '#fff' } : { color: theme.textClass.includes('white') ? 'white' : 'black' }}
                    >
                        {t('wall.filter.all')}
                    </button>
                    <button
                        onClick={() => setFilter('VENT')}
                        className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2 ${filter === 'VENT' ? 'text-white shadow-inner' : 'opacity-60 hover:opacity-100'}`}
                        style={filter === 'VENT' ? { backgroundColor: theme.accentColor, color: '#fff' } : { color: theme.textClass.includes('white') ? 'white' : 'black' }}
                    >
                        <Wind size={14} />
                        {t('wall.filter.vents')}
                    </button>
                </div>
            </div>

            {/* Info Cards / Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto mb-16">
                <div className={`p-4 rounded-2xl flex items-center gap-4 border backdrop-blur-md ${theme.id === 'Light' ? 'bg-white/60 border-black/5 shadow-sm' : 'bg-white/5 border-white/5'}`}>
                    <div className="p-3 rounded-xl bg-brand-purple/20 text-brand-purple">
                        <Sparkles size={20} />
                    </div>
                    <div>
                        <div className="text-xs font-bold uppercase tracking-wider opacity-40 mb-0.5">Daily Quote</div>
                        <div className="text-sm font-medium italic opacity-80">"Your voice matters, even in silence."</div>
                    </div>
                </div>
                <div className={`p-4 rounded-2xl flex items-center gap-4 border backdrop-blur-md ${theme.id === 'Light' ? 'bg-white/60 border-black/5 shadow-sm' : 'bg-white/5 border-white/5'}`}>
                    <div className="p-3 rounded-xl bg-brand-peach/20 text-brand-peach">
                        <Heart size={20} />
                    </div>
                    <div>
                        <div className="text-xs font-bold uppercase tracking-wider opacity-40 mb-0.5">Activity Pulse</div>
                        <div className="text-sm font-medium opacity-80 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                            {posts.length} whispers today
                        </div>
                    </div>
                </div>
            </div>

            {filteredPosts.length === 0 ? (
                <div className="text-center opacity-30 py-20">
                    <p>{t('wall.empty')}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPosts.map((post) => {
                        const config = INTENTS.find(i => i.type === post.intent);
                        const isRevealed = revealed.has(post.id);
                        const hasOriginal = !!post.originalContent;
                        const isMine = myPostIds.has(post.id);
                        const isConfirming = confirmDelete === post.id;
                        
                        return (
                            <GlassCard 
                                key={post.id} 
                                className={`group hover:border-current transition-all duration-500 hover:-translate-y-1 ${isRevealed ? 'border-red-500/50' : ''}`} 
                                themeConfig={theme}
                            >
                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <div className={`p-1.5 rounded-lg ${theme.id === 'Light' ? 'bg-black/5' : 'bg-white/10'}`}>
                                                {getIcon(config?.icon || 'Feather', 14)}
                                            </div>
                                            <span className="text-xs font-medium opacity-50 uppercase tracking-wider">
                                                {post.customLabel || config?.label}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {isMine && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteClick(post.id); }}
                                                    className={`p-1.5 rounded-full transition-all ${isConfirming ? 'bg-red-500 text-white w-auto px-3' : 'hover:bg-red-500/20 hover:text-red-500 opacity-30 hover:opacity-100'}`}
                                                    title="Delete Post"
                                                >
                                                    {isConfirming ? <span className="text-xs font-bold">Confirm?</span> : <Trash2 size={14} />}
                                                </button>
                                            )}
                                            <span className="text-xs opacity-30 flex items-center gap-1">
                                                <Clock size={10} />
                                                {new Date(post.timestamp).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="relative min-h-[4rem]">
                                        <p className={`font-light leading-relaxed transition-opacity duration-300 break-words whitespace-pre-wrap ${isRevealed ? 'text-red-300 font-mono text-sm opacity-90' : 'opacity-90'}`}>
                                            "{isRevealed ? post.originalContent : post.content}"
                                        </p>
                                    </div>

                                    {/* Micro-interaction icons */}
                                    <div className={`mt-4 pt-4 border-t flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${theme.id === 'Light' ? 'border-black/5' : 'border-white/5'}`}>
                                        <div className="flex gap-2">
                                            <button className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors opacity-50 hover:opacity-100 text-brand-peach">
                                                <Heart size={14} />
                                            </button>
                                            <button className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors opacity-50 hover:opacity-100 text-brand-teal">
                                                <Leaf size={14} />
                                            </button>
                                            <button className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors opacity-50 hover:opacity-100 text-brand-amber">
                                                <Zap size={14} />
                                            </button>
                                        </div>

                                        {hasOriginal && (
                                            <button 
                                                onClick={() => toggleReveal(post.id)}
                                                className={`text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors ${isRevealed ? (theme.id === 'Light' ? 'bg-black/5 text-black' : 'bg-white/10 text-white') : 'opacity-50 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5'}`}
                                            >
                                                {isRevealed ? <EyeOff size={12}/> : <MessageCircleWarning size={12}/>}
                                                {isRevealed ? t('wall.viewPolished') : t('wall.viewOriginal')}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </GlassCard>
                        )
                    })}
                </div>
            )}
        </div>
    );
};

const FinalDashboard = ({ 
    message, 
    extras,
    onReset,
    onPostToWall,
    detectedLabel,
    targetLanguage,
    t,
    theme
}: { 
    message: GeneratedMessage, 
    extras: { missions: FriendshipMission[], topics: TopicSuggestion[], relationshipScore: number } | null,
    onReset: () => void,
    onPostToWall: () => void,
    detectedLabel?: string | null,
    targetLanguage: TargetLanguage,
    t: (k:string)=>string,
    theme: ThemeConfig
}) => {
    const [copied, setCopied] = useState(false);
    const [posted, setPosted] = useState(false);
    const [formatting, setFormatting] = useState<'email' | 'sms' | null>(null);
    const [displayContent, setDisplayContent] = useState(message.content);
    const [isEncrypted, setIsEncrypted] = useState(false);

    // Reset display content if message changes
    useEffect(() => {
        setDisplayContent(message.content);
        setIsEncrypted(false);
    }, [message]);

    const handleCopy = () => {
        navigator.clipboard.writeText(displayContent);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleEmail = async () => {
        setFormatting('email');
        const formatted = await generateFormattedMessage(message.content, 'EMAIL', targetLanguage);
        setFormatting(null);
        const subject = formatted.subject || "Message from WhisperWall";
        // Use displayContent if encrypted, else formatted body
        const body = isEncrypted ? displayContent : formatted.body;
        window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    };

    const handleSMS = async () => {
        setFormatting('sms');
        const formatted = await generateFormattedMessage(message.content, 'SMS', targetLanguage);
        setFormatting(null);
        
        const ua = navigator.userAgent.toLowerCase();
        const isiOS = /iphone|ipad|ipod/.test(ua);
        const separator = isiOS ? '&' : '?';
        // Use displayContent if encrypted, else formatted body
        const body = isEncrypted ? displayContent : formatted.body;
        window.location.href = `sms:${separator}body=${encodeURIComponent(body)}`;
    };

    const handlePost = () => {
        onPostToWall();
        setPosted(true);
    };

    // Encryption Handlers
    const applyEncryption = (type: 'base64' | 'rot13' | 'reverse') => {
        let result = message.content;
        switch(type) {
            case 'base64': result = encodeBase64(message.content); break;
            case 'rot13': result = encodeRot13(message.content); break;
            case 'reverse': result = reverseString(message.content); break;
        }
        setDisplayContent(result);
        setIsEncrypted(true);
    };

    const restoreOriginal = () => {
        setDisplayContent(message.content);
        setIsEncrypted(false);
    };

    const radarData = [
        { subject: 'Trust', A: extras?.relationshipScore || 50, fullMark: 100 },
        { subject: 'Fun', A: (extras?.relationshipScore || 50) * 0.8, fullMark: 100 },
        { subject: 'Depth', A: (extras?.relationshipScore || 50) * 0.9, fullMark: 100 },
        { subject: 'Openness', A: (extras?.relationshipScore || 50) * 0.7, fullMark: 100 },
        { subject: 'Empathy', A: 85, fullMark: 100 },
    ];

    return (
        <div className="max-w-5xl mx-auto px-4 py-8 animate-slide-up pb-24">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Col: Message & Actions */}
                <div className="lg:col-span-2 space-y-6">
                    <GlassCard className="p-8 shadow-md" themeConfig={theme}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-semibold" style={{ color: theme.accentColor }}>{t('dashboard.ready')}</h3>
                            <div className="flex gap-2">
                                <button onClick={handleCopy} className="p-2 hover:bg-black/5 rounded-full transition-colors" title="Copy Text">
                                    {copied ? <CheckCircle size={20} className="text-green-500"/> : <Copy size={20}/>}
                                </button>
                            </div>
                        </div>

                        {detectedLabel && (
                             <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 bg-black/5 rounded-full border border-black/5 text-xs opacity-60">
                                <Sparkles size={12} style={{ color: theme.accentColor }}/>
                                <span>{t('dashboard.intentDetected')}: {detectedLabel}</span>
                            </div>
                        )}

                        <div className={`p-6 rounded-2xl border mb-6 ${theme.hideBlobs ? 'bg-black/5 border-black/5' : 'bg-black/20 border-white/5'}`}>
                            <p className="text-lg md:text-xl font-serif italic opacity-90 leading-relaxed whitespace-pre-wrap break-words">
                                {displayContent}
                            </p>
                        </div>

                        {/* Encryption Tools */}
                         <div className="mb-6 p-4 rounded-xl border border-dashed" style={{ borderColor: theme.accentColor + '44' }}>
                            <div className="flex items-center gap-2 mb-3 opacity-70">
                                <Lock size={14} />
                                <span className="text-xs font-bold uppercase tracking-wider">{t('encrypt.title')}</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <button 
                                    onClick={() => applyEncryption('base64')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${theme.hideBlobs ? 'bg-black/5 border-black/10' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                                >
                                    {t('encrypt.base64')}
                                </button>
                                <button 
                                    onClick={() => applyEncryption('rot13')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${theme.hideBlobs ? 'bg-black/5 border-black/10' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                                >
                                    {t('encrypt.rot13')}
                                </button>
                                <button 
                                    onClick={() => applyEncryption('reverse')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${theme.hideBlobs ? 'bg-black/5 border-black/10' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                                >
                                    {t('encrypt.reverse')}
                                </button>
                                {isEncrypted && (
                                    <button 
                                        onClick={restoreOriginal}
                                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 ml-auto flex items-center gap-1"
                                    >
                                        <Undo2 size={12} />
                                        {t('encrypt.restore')}
                                    </button>
                                )}
                            </div>
                        </div>
                        
                        {/* Quick Send Buttons */}
                        <div className="flex gap-3 mb-6">
                            <GlassButton 
                                onClick={handleEmail} 
                                variant="secondary" 
                                className="flex-1 text-sm" 
                                disabled={!!formatting}
                                themeConfig={theme}
                                icon={formatting === 'email' ? <Loader2 className="animate-spin" size={16}/> : <Mail size={16}/>}
                            >
                                {formatting === 'email' ? t('dashboard.formatting') : t('dashboard.email')}
                            </GlassButton>
                            <GlassButton 
                                onClick={handleSMS} 
                                variant="secondary" 
                                className="flex-1 text-sm" 
                                disabled={!!formatting}
                                themeConfig={theme}
                                icon={formatting === 'sms' ? <Loader2 className="animate-spin" size={16}/> : <MessageSquare size={16}/>}
                            >
                                {formatting === 'sms' ? t('dashboard.addingEmojis') : t('dashboard.sms')}
                            </GlassButton>
                        </div>

                         {/* Post to Wall Button */}
                         <div className="p-4 rounded-xl border flex items-center justify-between"
                              style={{ backgroundColor: theme.accentColor + '11', borderColor: theme.accentColor + '33' }}>
                            <div>
                                <h4 className="font-medium mb-1">{t('dashboard.public')}</h4>
                                <p className="text-xs opacity-50">{t('dashboard.publicDesc')}</p>
                            </div>
                            <GlassButton 
                                onClick={handlePost} 
                                variant="primary" 
                                disabled={posted}
                                themeConfig={theme}
                                className={`text-sm py-2 px-4 ${posted ? 'opacity-50' : ''}`}
                                icon={posted ? <CheckCircle size={16} /> : <Globe size={16} />}
                            >
                                {posted ? t('dashboard.posted') : t('dashboard.post')}
                            </GlassButton>
                        </div>

                        <div className="space-y-4 mt-6">
                            <div className="p-4 rounded-xl border" style={{ borderColor: theme.accentColor + '44', backgroundColor: theme.accentColor + '11' }}>
                                <h4 className="font-medium mb-1 flex items-center gap-2" style={{ color: theme.accentColor }}>
                                    <Send size={16}/> {t('dashboard.link')}
                                </h4>
                                <p className="text-sm opacity-60 truncate">whisperwall.app/msg/x8j29-safe-view</p>
                            </div>
                            <p className="text-xs text-center opacity-40">
                                {t('dashboard.linkDesc')}
                            </p>
                        </div>
                    </GlassCard>

                    {/* Missions */}
                    <GlassCard className="p-6" themeConfig={theme}>
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Trophy size={18} style={{ color: theme.accentColor }}/> {t('dashboard.quests')}
                        </h3>
                        <div className="grid grid-cols-1 gap-3">
                            {extras?.missions.map((m, i) => (
                                <div key={i} className={`flex items-center gap-4 p-3 rounded-xl transition-colors ${theme.hideBlobs ? 'bg-black/5 hover:bg-black/10' : 'bg-white/5 hover:bg-white/10'}`}>
                                    <div className={`
                                        w-2 h-12 rounded-full shrink-0
                                        ${m.difficulty === 'Easy' ? 'bg-green-400' : ''}
                                        ${m.difficulty === 'Medium' ? 'bg-yellow-400' : ''}
                                        ${m.difficulty === 'Deep' ? 'bg-red-400' : ''}
                                    `}/>
                                    <div>
                                        <h5 className="font-medium text-sm">{m.title}</h5>
                                        <p className="text-xs opacity-50">{m.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </GlassCard>
                </div>

                {/* Right Col: Analytics & Topics */}
                <div className="space-y-6">
                    {/* Relationship Meter */}
                    <GlassCard className="p-6 flex flex-col items-center" themeConfig={theme}>
                        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                            <BarChart2 size={18} style={{ color: theme.accentColor }}/> {t('dashboard.bond')}
                        </h3>
                        <div className="h-[200px] w-full text-xs">
                             <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                    <PolarGrid stroke={theme.textClass === 'text-white' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: theme.textClass === 'text-white' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', fontSize: 10 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                    <Radar
                                        name="Relationship"
                                        dataKey="A"
                                        stroke={theme.accentColor}
                                        fill={theme.accentColor}
                                        fillOpacity={0.3}
                                    />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </GlassCard>

                    {/* Topics */}
                    <GlassCard className="p-6" themeConfig={theme}>
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Lightbulb size={18} style={{ color: theme.accentColor }}/> {t('dashboard.topics')}
                        </h3>
                        <div className="space-y-3">
                            {extras?.topics.map((t, i) => (
                                <div key={i} className={`p-3 rounded-xl border ${theme.hideBlobs ? 'bg-black/5 border-black/5' : 'bg-white/5 border-white/5'}`}>
                                    <span className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: theme.accentColor }}>{t.category}</span>
                                    <p className="text-sm opacity-80">"{t.starter}"</p>
                                </div>
                            ))}
                        </div>
                    </GlassCard>

                    <div className="pt-4">
                        <GlassButton onClick={onReset} variant="ghost" className="w-full" themeConfig={theme}>
                            {t('dashboard.reset')}
                        </GlassButton>
                    </div>
                </div>
            </div>
        </div>
    );
};


// --- Main App Controller ---

export default function App() {
  const [activeTab, setActiveTab] = useState<'explore' | 'create' | 'me'>('explore');
  const [step, setStep] = useState<number>(0);
  
  const initialUserInput = {
    intent: IntentType.FRIENDSHIP,
    recipient: '',
    relationship: '',
    context: '',
    targetLanguage: 'English' as TargetLanguage
  };
  const [userInput, setUserInput] = useState<UserInput>(initialUserInput);
  
  // History State
  const [history, setHistory] = useState<UserInput[]>([initialUserInput]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const historyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [generatedContent, setGeneratedContent] = useState<GeneratedMessage[]>([]);
  const [safetyAlert, setSafetyAlert] = useState<{ triggered: boolean, message: string }>();
  const [detectedIntentLabel, setDetectedIntentLabel] = useState<string | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<GeneratedMessage | null>(null);
  const [extras, setExtras] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [wallPosts, setWallPosts] = useState<WallPost[]>([]);
  const [myPostIds, setMyPostIds] = useState<Set<string>>(new Set());
  
  // Settings State
  const [appLanguage, setAppLanguage] = useState<AppLanguage>('English');
  const [currentThemeId, setCurrentThemeId] = useState<ThemeType>('Dark');

  // Derived Values
  const t = useTranslation(appLanguage);
  const theme = THEMES.find(th => th.id === currentThemeId) || THEMES[0];

  useEffect(() => {
      // Sync target language default with UI language change if logical
      const newLang = appLanguage;
      if (userInput.targetLanguage !== newLang) {
          handleInputChange('targetLanguage', newLang);
      }
  }, [appLanguage]);

  // Load posts and user's post IDs on mount
  useEffect(() => {
    const savedPosts = localStorage.getItem('whisperwall_posts');
    if (savedPosts) {
        try {
            setWallPosts(JSON.parse(savedPosts));
        } catch(e) { console.error(e); }
    }

    const savedMyIds = localStorage.getItem('whisperwall_my_ids');
    if (savedMyIds) {
        try {
            setMyPostIds(new Set(JSON.parse(savedMyIds)));
        } catch(e) { console.error(e); }
    }
  }, []);

  // Smooth scroll to top on tab/step change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step, activeTab]);

  const handleStart = () => setStep(1);

  const handleIntentSelect = (intent: IntentType) => {
    handleInputChange('intent', intent);
    setStep(2);
  };

  const handleInputChange = (field: keyof UserInput, value: any) => {
    const newUserInput = { ...userInput, [field]: value };
    setUserInput(newUserInput);

    // Debounce history updates to avoid 1 char = 1 history state
    if (historyTimeoutRef.current) clearTimeout(historyTimeoutRef.current);
    historyTimeoutRef.current = setTimeout(() => {
        setHistory(prev => {
            const newHistory = prev.slice(0, historyIndex + 1);
            newHistory.push(newUserInput);
            return newHistory;
        });
        setHistoryIndex(prev => prev + 1);
    }, 500);
  };

  const handleUndo = () => {
      if (historyIndex > 0) {
          const prevIndex = historyIndex - 1;
          setHistoryIndex(prevIndex);
          setUserInput(history[prevIndex]);
      }
  };

  const handleRedo = () => {
      if (historyIndex < history.length - 1) {
          const nextIndex = historyIndex + 1;
          setHistoryIndex(nextIndex);
          setUserInput(history[nextIndex]);
      }
  };

  const handleGenerate = async () => {
    setIsLoading(true);
    setStep(3);
    setDetectedIntentLabel(null);
    
    try {
        const { variations, safetyAlert, detectedIntent } = await generateDrafts(userInput);
        setGeneratedContent(variations || []);
        setSafetyAlert(safetyAlert);
        if (detectedIntent) setDetectedIntentLabel(detectedIntent);
    } catch (error) {
        console.error(error);
        // Fallback or error handling
    } finally {
        setIsLoading(false);
    }
  };

  const handleSelectMessage = async (msg: GeneratedMessage) => {
      setSelectedMessage(msg);
      // Pre-fetch extras while transitioning
      const extraData = await generateExtras(userInput.context, userInput.targetLanguage);
      setExtras(extraData);
      setStep(4);
  };

  const handleReset = () => {
      setStep(0);
      setUserInput({
        intent: IntentType.FRIENDSHIP,
        recipient: '',
        relationship: '',
        context: '',
        targetLanguage: appLanguage // Reset to current UI lang
      });
      setHistory([initialUserInput]);
      setHistoryIndex(0);
      setGeneratedContent([]);
      setSelectedMessage(null);
      setDetectedIntentLabel(null);
      // Stay on create tab but reset
  };

  const handlePostToWall = () => {
      if (!selectedMessage) return;
      
      const postId = Date.now().toString();
      const newPost: WallPost = {
          id: postId,
          content: selectedMessage.content,
          intent: userInput.intent,
          timestamp: Date.now(),
          color: 'text-brand-teal', // Simple default for now
          customLabel: detectedIntentLabel || undefined,
          // If the intent is VENT, store the original raw context
          originalContent: userInput.intent === IntentType.VENT ? userInput.context : undefined
      };

      const updatedPosts = [newPost, ...wallPosts];
      setWallPosts(updatedPosts);
      localStorage.setItem('whisperwall_posts', JSON.stringify(updatedPosts));

      // Track my post ID
      const newMyIds = new Set(myPostIds);
      newMyIds.add(postId);
      setMyPostIds(newMyIds);
      localStorage.setItem('whisperwall_my_ids', JSON.stringify(Array.from(newMyIds)));
      
      setActiveTab('explore'); // Redirect to Wall
  };

  const handleDeletePost = (id: string) => {
      const updatedPosts = wallPosts.filter(p => p.id !== id);
      setWallPosts(updatedPosts);
      localStorage.setItem('whisperwall_posts', JSON.stringify(updatedPosts));
  };

  const handleTabChange = (tab: 'explore' | 'create' | 'me') => {
      setActiveTab(tab);
      // If switching to Create and step is > 0, maybe keep state or reset?
      // For now, we preserve state.
  };

  return (
    <div className={`min-h-screen relative transition-colors duration-500 ${theme.bgClass} ${theme.textClass} ${theme.font} overflow-x-hidden selection:bg-brand-teal/30`}>
      <GlowingBlobBackground themeConfig={theme} />
      
      {/* App Header (Logo Only) */}
      <header className="absolute top-0 w-full z-40 p-6 flex justify-between items-center animate-fade-in pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto cursor-pointer" onClick={() => { setActiveTab('explore'); }}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg`} 
                 style={{ background: theme.accentColor }}>
                <span className="font-bold text-white text-lg">W</span>
            </div>
            <span className="font-medium tracking-tight opacity-90 hidden md:block">{t('hero.title')}</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 pt-20 min-h-screen flex flex-col">
        {activeTab === 'explore' && (
            <PublicWall 
                posts={wallPosts} 
                onWrite={() => { setActiveTab('create'); handleReset(); handleStart(); }} 
                t={t} 
                theme={theme}
                myPostIds={myPostIds}
                onDelete={handleDeletePost}
            />
        )}

        {activeTab === 'create' && (
            <>
                {step > 1 && step < 5 && (
                    <StepIndicator currentStep={step - 1} totalSteps={4} themeConfig={theme} />
                )}

                {step === 0 && <HeroSection onStart={handleStart} t={t} theme={theme} />}
                {step === 1 && <IntentSelection onSelect={handleIntentSelect} t={t} theme={theme} />}
                {step === 2 && (
                    <DraftingSpace 
                        intent={userInput.intent} 
                        data={userInput} 
                        onChange={handleInputChange}
                        onNext={handleGenerate}
                        onBack={() => setStep(1)}
                        t={t}
                        theme={theme}
                        onUndo={handleUndo}
                        onRedo={handleRedo}
                        canUndo={historyIndex > 0}
                        canRedo={historyIndex < history.length - 1}
                    />
                )}
                {step === 3 && (
                    <GenerationView 
                        variations={generatedContent} 
                        isLoading={isLoading} 
                        onSelect={handleSelectMessage}
                        safetyAlert={safetyAlert}
                        t={t}
                        theme={theme}
                    />
                )}
                {step === 4 && selectedMessage && (
                    <FinalDashboard 
                        message={selectedMessage}
                        extras={extras}
                        onReset={handleReset}
                        onPostToWall={handlePostToWall}
                        detectedLabel={detectedIntentLabel}
                        targetLanguage={userInput.targetLanguage}
                        t={t}
                        theme={theme}
                    />
                )}
            </>
        )}

        {activeTab === 'me' && (
            <MeDashboard 
                theme={theme}
                t={t}
                myPostIds={myPostIds}
                wallPosts={wallPosts}
                onDeletePost={handleDeletePost}
                appLanguage={appLanguage}
                setAppLanguage={setAppLanguage}
                currentThemeId={currentThemeId}
                setCurrentThemeId={setCurrentThemeId}
            />
        )}
      </main>

      {/* Navigation Dock */}
      <NavigationDock activeTab={activeTab} onChange={handleTabChange} theme={theme} />
    </div>
  );
}