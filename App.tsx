import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  FlaskConical, 
  TrendingUp, 
  Users,
  ShieldAlert, 
  ChevronRight, 
  Loader2, 
  CheckCircle2,
  Microscope,
  Briefcase,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { runBoardroom, Blueprint } from './services/gemini';

// --- Components ---

const LogoIcon = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Shield Base */}
    <path 
      d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinejoin="round"
    />
    
    {/* Open Book (Thesis) - Line Art */}
    <path 
      d="M12 15.5c-1.5-0.5-3-0.5-4.5-0.5H5v-6h2.5c1.5 0 3 0 4.5 0.5M12 15.5c1.5-0.5 3-0.5 4.5-0.5H19v-6h-2.5c-1.5 0-3 0-4.5 0.5M12 9.5v6" 
      stroke="currentColor" 
      strokeWidth="1.2" 
      strokeLinecap="round"
      className="opacity-50"
    />

    {/* Bold 45-degree Growth Line (Venture) */}
    <path 
      d="M6 16L18 6" 
      stroke="#10b981" 
      strokeWidth="3" 
      strokeLinecap="round"
    />
    <path 
      d="M13 6h5v5" 
      stroke="#10b981" 
      strokeWidth="3" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

const TRLMeter = ({ trl }: { trl: number }) => {
  const levels = [
    "Basic Research", "Tech Concept", "Proof of Concept", 
    "Lab Validation", "Simulated Env", "Prototype", 
    "Demo System", "Qualified System", "Proven System"
  ];
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-end">
        <div>
          <h4 className="text-xs font-mono uppercase text-emerald-500/70">Tech Readiness Level</h4>
          <div className="text-4xl font-bold text-white">TRL {trl}</div>
        </div>
        <div className="text-right">
          <div className="text-xs font-mono uppercase text-slate-500">Status</div>
          <div className="text-sm font-medium text-slate-300 italic">{levels[trl - 1]}</div>
        </div>
      </div>
      <div className="grid grid-cols-9 gap-1">
        {Array.from({ length: 9 }).map((_, i) => (
          <div 
            key={i} 
            className={`h-2 rounded-full transition-all duration-500 ${
              i < trl ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-800'
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-slate-400 italic">
        {trl < 3 ? "Recommendation: Basic Research Grants" : trl > 6 ? "Recommendation: Venture Capital / Pilot Programs" : "Recommendation: R&D Grants / Angel Investment"}
      </p>
    </div>
  );
};

const ViabilityScore = ({ score }: { score: number }) => {
  return (
    <div className="relative h-32 w-32 flex items-center justify-center">
      <svg className="h-full w-full transform -rotate-90">
        <circle
          cx="64"
          cy="64"
          r="58"
          stroke="currentColor"
          strokeWidth="8"
          fill="transparent"
          className="text-slate-800"
        />
        <circle
          cx="64"
          cy="64"
          r="58"
          stroke="currentColor"
          strokeWidth="8"
          fill="transparent"
          strokeDasharray={364.4}
          strokeDashoffset={364.4 - (364.4 * score) / 100}
          className="text-emerald-500 transition-all duration-1000 ease-out"
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-white">{score}%</span>
        <span className="text-[10px] uppercase tracking-wider text-slate-500">Viability</span>
      </div>
    </div>
  );
};

const TabButton = ({ active, onClick, icon: Icon, label }: any) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-all ${
      active 
        ? 'border-emerald-500 text-emerald-500 bg-emerald-500/5' 
        : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
    }`}
  >
    <Icon size={18} />
    <span className="text-sm font-medium uppercase tracking-wide">{label}</span>
  </button>
);

// --- Main App ---

export default function App() {
  const [files, setFiles] = useState<File[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const [activeTab, setActiveTab] = useState('pitch');
  const [loadingStep, setLoadingStep] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles].slice(0, 2)); // Max 2 files
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const analyzePaper = async () => {
    if (files.length === 0) return;

    setIsAnalyzing(true);
    setLoadingStep('Parsing Scientific Data...');
    
    try {
      const texts = await Promise.all(files.map(async (file) => {
        const formData = new FormData();
        formData.append('pdf', file);
        const parseRes = await fetch('/api/parse-pdf', {
          method: 'POST',
          body: formData,
        });
        const data = await parseRes.json();
        return data.text;
      }));

      const combinedText = texts.join("\n\n--- SECOND PAPER ---\n\n");

      setLoadingStep('Convening the Boardroom...');
      // Simulate agent debate steps for UX
      const steps = [
        "The Scientist is extracting technical claims...",
        "The Engineer is assessing TRL and resource requirements...",
        "The MBA is modeling revenue and market gaps...",
        "The Risk Evaluator is conducting a pre-mortem...",
        "Consolidating consensus into a Blueprint..."
      ];

      let i = 0;
      const interval = setInterval(() => {
        if (i < steps.length) {
          setLoadingStep(steps[i]);
          i++;
        } else {
          clearInterval(interval);
        }
      }, 2000);

      const result = await runBoardroom(combinedText);
      setBlueprint(result);
      
      // Save to DB
      await fetch('/api/blueprints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: Date.now().toString(),
          title: result.title,
          content: result
        }),
      });

      clearInterval(interval);
    } catch (error) {
      console.error(error);
      alert("Analysis failed. Please check your API key and try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0b0d] text-slate-200 font-sans selection:bg-emerald-500/30">
      {/* Header */}
      <header className="border-b border-slate-800/50 bg-[#0a0b0d]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500 p-1.5 rounded-lg">
              <LogoIcon className="text-black" size={20} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">Venture<span className="text-emerald-500">Thesis</span></h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">Scientific Commercialization Engine v1.0</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-8">
        {!blueprint ? (
          <div className="max-w-2xl mx-auto pt-20 space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-5xl font-bold text-white tracking-tight">Turn Research into <span className="text-emerald-500 italic">Reality.</span></h2>
              <p className="text-slate-400 text-lg">Upload your academic PDF. Our Multi-Agent Boardroom will debate its commercial viability and build your startup blueprint.</p>
            </div>

            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer group ${
                files.length > 0 ? 'border-emerald-500 bg-emerald-500/5' : 'border-slate-800 hover:border-slate-700 hover:bg-slate-800/30'
              }`}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept=".pdf"
                multiple
              />
              <div className="flex flex-col items-center gap-4">
                <div className={`p-4 rounded-full transition-colors ${files.length > 0 ? 'bg-emerald-500 text-black' : 'bg-slate-800 text-slate-400 group-hover:text-slate-200'}`}>
                  {files.length > 0 ? <CheckCircle2 size={32} /> : <Upload size={32} />}
                </div>
                <div>
                  <p className="text-lg font-medium text-white">
                    {files.length > 0 
                      ? `${files.length} Research Paper${files.length > 1 ? 's' : ''} Selected` 
                      : 'Select Research PDF(s)'}
                  </p>
                  <p className="text-sm text-slate-500">Upload up to 2 papers for cross-disciplinary synthesis</p>
                </div>
              </div>
            </div>

            {files.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center">
                {files.map((f, i) => (
                  <div key={i} className="bg-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-2 border border-slate-700">
                    <span className="text-xs text-slate-300 truncate max-w-[200px]">{f.name}</span>
                    <button onClick={(e) => { e.stopPropagation(); removeFile(i); }} className="text-slate-500 hover:text-red-400">
                      <AlertTriangle size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {files.length > 0 && !isAnalyzing && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={analyzePaper}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
              >
                Launch Boardroom Analysis
                <ChevronRight size={20} />
              </motion.button>
            )}

            {isAnalyzing && (
              <div className="space-y-6 text-center">
                <div className="flex justify-center">
                  <Loader2 className="text-emerald-500 animate-spin" size={48} />
                </div>
                <div className="space-y-2">
                  <p className="text-xl font-medium text-white">{loadingStep}</p>
                  <p className="text-sm text-slate-500 font-mono uppercase tracking-widest">Agents are debating in the background...</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Left Column: Summary & Scores */}
            <div className="lg:col-span-1 space-y-8">
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 space-y-6">
                <div className="space-y-2">
                  <h3 className="text-xs font-mono uppercase text-slate-500 tracking-widest">Project Title</h3>
                  <h2 className="text-2xl font-bold text-white leading-tight">{blueprint.title}</h2>
                </div>
                
                <div className="h-px bg-slate-800" />
                
                <TRLMeter trl={blueprint.lab.trl} />
                
                <div className="h-px bg-slate-800" />
                
                <div className="flex items-center justify-between">
                  <ViabilityScore score={blueprint.lab.viability} />
                  <div className="flex-1 pl-6 space-y-2">
                    <h4 className="text-xs font-mono uppercase text-slate-500">Boardroom Consensus</h4>
                    <p className="text-sm text-slate-300 italic">"The technical foundation is robust, but market entry requires strategic patent positioning."</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileText size={16} className="text-emerald-500" />
                  Source Backlinking
                </h3>
                <div className="space-y-3">
                  {blueprint.sourceBacklinks.map((link, i) => (
                    <div key={i} className="text-xs p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                      <p className="text-slate-300 mb-1">"{link.claim}"</p>
                      <span className="text-emerald-500 font-mono uppercase text-[10px] tracking-wider">[Ref: {link.reference}]</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Blueprint Tabs */}
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden flex flex-col min-h-[600px]">
                <div className="flex border-b border-slate-800 bg-slate-900/80">
                  <TabButton 
                    active={activeTab === 'pitch'} 
                    onClick={() => setActiveTab('pitch')} 
                    icon={TrendingUp} 
                    label="The Pitch" 
                  />
                  <TabButton 
                    active={activeTab === 'lab'} 
                    onClick={() => setActiveTab('lab')} 
                    icon={FlaskConical} 
                    label="The Lab" 
                  />
                  <TabButton 
                    active={activeTab === 'market'} 
                    onClick={() => setActiveTab('market')} 
                    icon={Briefcase} 
                    label="The Market" 
                  />
                  <TabButton 
                    active={activeTab === 'talent'} 
                    onClick={() => setActiveTab('talent')} 
                    icon={Users} 
                    label="Talent Bridge" 
                  />
                  <TabButton 
                    active={activeTab === 'roadmap'} 
                    onClick={() => setActiveTab('roadmap')} 
                    icon={ChevronRight} 
                    label="The Roadmap" 
                  />
                </div>

                <div className="p-8 flex-1">
                  <AnimatePresence mode="wait">
                    {activeTab === 'pitch' && (
                      <motion.div 
                        key="pitch"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-8"
                      >
                        <section className="space-y-3">
                          <h4 className="text-xs font-mono uppercase text-emerald-500 tracking-widest">Problem Statement</h4>
                          <p className="text-lg text-slate-200 leading-relaxed">{blueprint.pitch.problem}</p>
                        </section>
                        <section className="space-y-3">
                          <h4 className="text-xs font-mono uppercase text-emerald-500 tracking-widest">Scientific Solution</h4>
                          <p className="text-lg text-slate-200 leading-relaxed">{blueprint.pitch.solution}</p>
                        </section>
                        <section className="space-y-3">
                          <h4 className="text-xs font-mono uppercase text-emerald-500 tracking-widest">Value Proposition</h4>
                          <div className="p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                            <p className="text-xl font-medium text-white italic">"{blueprint.pitch.valueProp}"</p>
                          </div>
                        </section>
                      </motion.div>
                    )}

                    {activeTab === 'lab' && (
                      <motion.div 
                        key="lab"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-8"
                      >
                        <section className="space-y-4">
                          <h4 className="text-xs font-mono uppercase text-emerald-500 tracking-widest">Resource & Procurement List</h4>
                          <div className="border border-slate-800 rounded-xl overflow-hidden">
                            <table className="w-full text-left text-sm">
                              <thead className="bg-slate-800/50 text-slate-400 uppercase text-[10px] tracking-widest">
                                <tr>
                                  <th className="px-4 py-3">Item</th>
                                  <th className="px-4 py-3">Category</th>
                                  <th className="px-4 py-3">Est. Cost (₹)</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-800">
                                {blueprint.lab.resources.map((res, i) => (
                                  <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                                    <td className="px-4 py-3 text-white font-medium">{res.item}</td>
                                    <td className="px-4 py-3 text-slate-400">{res.category}</td>
                                    <td className="px-4 py-3 text-emerald-500 font-mono">{res.cost}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </section>
                        <section className="space-y-3">
                          <h4 className="text-xs font-mono uppercase text-emerald-500 tracking-widest">Technical Specifications</h4>
                          <div className="p-4 bg-slate-800/30 rounded-xl font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                            {blueprint.lab.techSpecs}
                          </div>
                        </section>
                      </motion.div>
                    )}

                    {activeTab === 'market' && (
                      <motion.div 
                        key="market"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-8"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="p-6 bg-slate-800/30 rounded-xl border border-slate-700/50 space-y-3">
                            <h4 className="text-xs font-mono uppercase text-emerald-500 tracking-widest">Revenue Strategy</h4>
                            <p className="text-slate-300">{blueprint.market.revenueStrategy}</p>
                          </div>
                          <div className="p-6 bg-slate-800/30 rounded-xl border border-slate-700/50 space-y-3">
                            <h4 className="text-xs font-mono uppercase text-emerald-500 tracking-widest">Target Market</h4>
                            <p className="text-slate-300">{blueprint.market.targetMarket}</p>
                          </div>
                        </div>
                        <section className="space-y-3">
                          <h4 className="text-xs font-mono uppercase text-emerald-500 tracking-widest">Competitor/Patent Gap</h4>
                          <div className="p-6 bg-slate-800/30 rounded-xl border border-slate-700/50">
                            <p className="text-slate-300 leading-relaxed">{blueprint.market.competitorGap}</p>
                          </div>
                        </section>
                      </motion.div>
                    )}

                    {activeTab === 'talent' && (
                      <motion.div 
                        key="talent"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-8"
                      >
                        <div className="space-y-2">
                          <h4 className="text-xs font-mono uppercase text-emerald-500 tracking-widest">The Co-Founder Matcher</h4>
                          <p className="text-sm text-slate-400">Bridges the gap between the Lab and the Market by identifying critical human intelligence needs.</p>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                          {blueprint.talentBridge.map((talent, i) => (
                            <div key={i} className="p-6 bg-slate-800/30 rounded-xl border border-slate-700/50 flex items-start justify-between gap-4 group hover:border-emerald-500/30 transition-all">
                              <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                  <h5 className="text-lg font-bold text-white group-hover:text-emerald-500 transition-colors">{talent.role}</h5>
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                    talent.priority === 'High' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                                    talent.priority === 'Medium' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                                    'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                                  }`}>
                                    {talent.priority} Priority
                                  </span>
                                </div>
                                <p className="text-slate-300 text-sm leading-relaxed">{talent.description}</p>
                              </div>
                              <button className="p-2 bg-slate-700 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-slate-600 transition-all">
                                <ExternalLink size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {activeTab === 'roadmap' && (
                      <motion.div 
                        key="roadmap"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-8"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <section className="space-y-4">
                            <h4 className="text-xs font-mono uppercase text-emerald-500 tracking-widest">Immediate Next Steps</h4>
                            <div className="space-y-3">
                              {blueprint.roadmap.nextSteps.map((step, i) => (
                                <div key={i} className="flex items-start gap-3 group">
                                  <div className="mt-1 h-5 w-5 rounded-full border border-emerald-500/30 flex items-center justify-center text-[10px] text-emerald-500 group-hover:bg-emerald-500 group-hover:text-black transition-all">
                                    {i + 1}
                                  </div>
                                  <p className="text-slate-300 text-sm">{step}</p>
                                </div>
                              ))}
                            </div>
                          </section>
                          <section className="space-y-4">
                            <h4 className="text-xs font-mono uppercase text-emerald-500 tracking-widest">Grant & Funding Matches</h4>
                            <div className="space-y-3">
                              {blueprint.roadmap.grantMatches.map((grant, i) => (
                                <div key={i} className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg border border-slate-700/50 hover:border-emerald-500/30 transition-colors cursor-pointer group">
                                  <ExternalLink size={14} className="text-slate-500 group-hover:text-emerald-500" />
                                  <span className="text-sm text-slate-300 group-hover:text-white">{grant}</span>
                                </div>
                              ))}
                            </div>
                          </section>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <button 
                  onClick={() => setBlueprint(null)}
                  className="text-xs font-mono uppercase text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-2"
                >
                  <ChevronRight size={14} className="rotate-180" />
                  Analyze Another Paper
                </button>
                <div className="flex gap-4">
                  <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition-all">
                    Export PDF Blueprint
                  </button>
                  <button className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold rounded-lg transition-all">
                    Share with Investors
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-slate-800/50 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3 opacity-50">
            <LogoIcon size={18} />
            <span className="text-sm font-bold tracking-tight">VentureThesis</span>
          </div>
          <div className="flex gap-8 text-xs font-mono uppercase tracking-widest text-slate-500">
            <a href="#" className="hover:text-emerald-500 transition-colors">Methodology</a>
            <a href="#" className="hover:text-emerald-500 transition-colors">Privacy</a>
            <a href="#" className="hover:text-emerald-500 transition-colors">API</a>
            <a href="#" className="hover:text-emerald-500 transition-colors">Support</a>
          </div>
          <p className="text-xs text-slate-600">© 2026 VentureThesis AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
