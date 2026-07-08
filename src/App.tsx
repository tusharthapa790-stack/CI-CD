import React, { useState, useEffect, useRef } from "react";
import {
  BookOpen,
  Terminal,
  Code2,
  Database,
  Sparkles,
  Cpu,
  Layers,
  Plus,
  Check,
  Copy,
  RotateCcw,
  MessageSquare,
  Settings,
  AlertCircle,
  ArrowRight,
  ChevronRight,
  User,
  ExternalLink,
  Shield,
  Activity,
  FileText,
  LayoutGrid,
  X,
  Search,
  Send,
  RefreshCw,
  Info,
  Play
} from "lucide-react";
import { DjangoBlueprint, DjangoFile, ChatMessage, DatabaseType } from "./types";
import { PRESET_BLUEPRINTS, CHEATSHEETS } from "./presets";

export default function App() {
  // Sidebar and Navigation State
  const [activeTab, setActiveTab] = useState<"dashboard" | "explorer" | "terminal" | "tutor">("dashboard");

  // Blueprint & Generator State
  const [selectedPreset, setSelectedPreset] = useState<string>("blog");
  const [customPrompt, setCustomPrompt] = useState<string>("");
  const [selectedDatabase, setSelectedDatabase] = useState<DatabaseType>("sqlite");
  const [blueprint, setBlueprint] = useState<DjangoBlueprint>(PRESET_BLUEPRINTS.blog);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Explorer State
  const [activeFileIndex, setActiveFileIndex] = useState<number>(0);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  // Terminal State
  const [selectedCheatCommand, setSelectedCheatCommand] = useState<string>("python -m venv venv");
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    "DjangoMaster Console initialized.",
    "Ready to simulate django-admin and manage.py commands.",
    "Type or select a command from the interactive panel on the right to view its output."
  ]);
  const [customTerminalInput, setCustomTerminalInput] = useState<string>("");
  const [simulatedDatabaseTables, setSimulatedDatabaseTables] = useState<string[]>([
    "auth_user",
    "auth_group",
    "django_session",
    "django_content_type"
  ]);
  const [migrationsApplied, setMigrationsApplied] = useState<boolean>(false);
  const [superuserCreated, setSuperuserCreated] = useState<boolean>(false);
  const [serverRunning, setServerRunning] = useState<boolean>(false);

  // Chat/Tutor State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hi there! I am **DjangoMaster AI**, your interactive Django Tutor. You can ask me any questions regarding Python, Django models, views, routing, database migration steps, or deployment. How can I assist you with your Django app today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [chatInput, setChatInput] = useState<string>("");
  const [isChatSending, setIsChatSending] = useState<boolean>(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Metrics (Dynamic indicators of project size)
  const totalModelsCount = blueprint.files.find(f => f.filename === "models.py")
    ? (blueprint.files.find(f => f.filename === "models.py")!.content.match(/class\s+\w+\(models\.Model\)/g) || []).length
    : 3;

  const totalViewsCount = blueprint.files.find(f => f.filename === "views.py")
    ? (blueprint.files.find(f => f.filename === "views.py")!.content.match(/def\s+\w+|class\s+\w+\(/g) || []).length
    : 4;

  const totalLinesOfCode = blueprint.files.reduce((acc, f) => acc + f.content.split("\n").length, 0);

  // Auto scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Load selected preset immediately
  const handleSelectPreset = (key: string) => {
    setSelectedPreset(key);
    if (PRESET_BLUEPRINTS[key]) {
      setBlueprint(PRESET_BLUEPRINTS[key]);
      setActiveFileIndex(0);
    }
  };

  // Generate customized Django blueprint using backend AI endpoint
  const handleGenerateCustomBlueprint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPrompt.trim()) return;

    setIsGenerating(true);
    setGenerationError(null);
    try {
      const response = await fetch("/api/gemini/generate-blueprint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idea: customPrompt,
          databaseType: selectedDatabase,
        }),
      });

      if (!response.ok) {
        throw new Error("Generation request failed. Check server connection or API credentials.");
      }

      const data = await response.json();
      if (data.projectName && data.files) {
        setBlueprint(data);
        setActiveFileIndex(0);
        // Add a helpful note to terminal
        setTerminalLogs(prev => [
          ...prev,
          `\n[SYSTEM] Instantiated custom blueprint project: '${data.projectName}'!`,
          `Detected models and structured app folder with ${data.files.length} active configurations.`
        ]);
        // Switch tab to file explorer to highlight the generated files
        setActiveTab("explorer");
      } else {
        throw new Error("Invalid output received from blueprint generator.");
      }
    } catch (err: any) {
      console.error(err);
      setGenerationError(err.message || "An unexpected error occurred while generating blueprint.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Copy code utility
  const handleCopyCode = (content: string, filename: string) => {
    navigator.clipboard.writeText(content);
    setCopySuccess(filename);
    setTimeout(() => setCopySuccess(null), 2000);
  };

  // Send AI Tutor Message
  const handleSendChatMessage = async (textToSend?: string) => {
    const messageText = textToSend || chatInput;
    if (!messageText.trim() || isChatSending) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMsg]);
    if (!textToSend) setChatInput("");
    setIsChatSending(true);

    try {
      const chatHistory = [...chatMessages, userMsg].map(m => ({
        role: m.role,
        content: m.content
      }));

      const response = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: chatHistory }),
      });

      if (!response.ok) {
        throw new Error("Connection timed out. Using interactive local fallback explanation.");
      }

      const data = await response.json();
      setChatMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.content || "I apologize, but I could not compute a detailed reply right now.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err: any) {
      // Local fallback simulator responses to keep tutor fully operational
      const fallbackResponse = getFallbackTutorResponse(messageText);
      setChatMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: fallbackResponse,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsChatSending(false);
    }
  };

  // Helper response builder for local tutor
  const getFallbackTutorResponse = (query: string): string => {
    const q = query.toLowerCase();
    if (q.includes("mvt") || q.includes("mvc")) {
      return "Django relies on the **Model-View-Template (MVT)** pattern:\n\n1. **Model**: Defines the database schema and structure (built using Python objects in `models.py`).\n2. **View**: Handles user requests, interacts with the Models to query data, and forwards that to the Templates.\n3. **Template**: The dynamic presentation layer (HTML using Django Template Language syntax like `{{ variable }}`).\n\nUnlike traditional MVC where a controller exists, Django's engine itself behaves like the Controller, maps URLs, and lets the *View* handle control flow.";
    }
    if (q.includes("migration") || q.includes("migrate")) {
      return "In Python Django, migrations are the version control system for your database schema:\n\n- `python manage.py makemigrations`: Analyzes your `models.py` for changes and generates descriptive `.py` files inside the `migrations/` directory.\n- `python manage.py migrate`: Applies those generated migration scripts to the active database (creates tables, adds indexes, updates columns).\n\nAlways run these two commands in sequence whenever you add or modify a model definition!";
    }
    if (q.includes("foreign") || q.includes("relationship") || q.includes("manytomany")) {
      return "Django models support relational database designs effortlessly:\n\n- **ForeignKey**: Sets up a one-to-many relationship (e.g., several `Post` instances belong to one `User` or `Category`). It requires `on_delete=models.CASCADE` or similar attributes.\n- **ManyToManyField**: Defines many-to-many linkages (e.g., a `Post` can have multiple `Tags`, and a `Tag` resides on many `Posts`).\n- **OneToOneField**: Guarantees a strict 1-to-1 mapping (e.g., a `User` has exactly one `UserProfile`).";
    }
    return `Excellent query! In Django, clean modularity is vital. We structure features inside modular apps (like 'blog' or 'store') using clear settings definitions. Let me know if you would like me to dissect how the generated files (such as **models.py** or **views.py**) interact to serve requests!`;
  };

  // Handle Cheatsheet Click & Terminal Simulation
  const handleRunSimulatedCommand = (command: string, category: string, explanation: string) => {
    setSelectedCheatCommand(command);
    let logs: string[] = [];
    logs.push(`\n$ ${command}`);
    logs.push(`Category: ${category} | ${explanation}`);

    if (command.includes("venv")) {
      logs.push("Creating virtual environment folder 'venv'...");
      logs.push("SUCCESS: Virtual environment prepared. Activated sandbox python executable.");
    } else if (command.includes("install django")) {
      logs.push("Collecting django...");
      logs.push("  Downloading Django-5.0.2-py3-none-any.whl (8.2 MB)");
      logs.push("Installing collected packages: asgiref, sqlparse, django");
      logs.push("Successfully installed django-5.0.2");
    } else if (command.includes("startproject")) {
      logs.push(`Initializing project files...`);
      logs.push(`Created management script: manage.py`);
      logs.push(`Created directory hierarchy: ./config/settings.py, urls.py, wsgi.py`);
    } else if (command.includes("startapp")) {
      logs.push(`Creating Django app application structure...`);
      logs.push(`Generated: ./todo/models.py, ./todo/views.py, ./todo/apps.py, ./todo/admin.py`);
    } else if (command.includes("makemigrations")) {
      logs.push("Migrations for '" + blueprint.projectName + "':");
      logs.push("  0001_initial.py:");
      blueprint.files.forEach(f => {
        if (f.filename === "models.py") {
          // extract model class names
          const classes = f.content.match(/class\s+(\w+)/g) || [];
          classes.forEach(c => {
            logs.push(`    - Create model ${c.replace("class ", "")}`);
          });
        }
      });
      logs.push("SUCCESS: Created migration script files.");
    } else if (command.includes("migrate")) {
      logs.push("Applying standard Django content-types and auth...");
      logs.push("  Applying auth.0001_initial... OK");
      logs.push("  Applying contenttypes.0001_initial... OK");
      logs.push(`Applying migrations for ${blueprint.projectName}...`);
      logs.push(`  Applying ${blueprint.projectName}.0001_initial... OK`);
      setMigrationsApplied(true);
      // Simulate database tables generated
      const tableList = ["auth_user", "auth_group", "django_session", "django_content_type"];
      blueprint.files.forEach(f => {
        if (f.filename === "models.py") {
          const classes = f.content.match(/class\s+(\w+)/g) || [];
          classes.forEach(c => {
            tableList.push(`${blueprint.projectName.replace("_project", "")}_${c.replace("class ", "").toLowerCase()}`);
          });
        }
      });
      setSimulatedDatabaseTables(tableList);
      logs.push(`SUCCESS: Active database tables generated dynamically (${tableList.length} total).`);
    } else if (command.includes("createsuperuser")) {
      logs.push("Username: admin");
      logs.push("Email address: admin@example.com");
      logs.push("Password: **********");
      logs.push("Superuser created successfully.");
      setSuperuserCreated(true);
    } else if (command.includes("runserver")) {
      logs.push("Watching for file changes with StatReloader");
      logs.push("Performing system checks...");
      logs.push("System check identified no issues (0 silenced).");
      logs.push("July 07, 2026 - 23:59:00");
      logs.push("Django version 5.0.2, using settings 'config.settings'");
      logs.push("Starting development server at http://127.0.0.1:8000/");
      logs.push("Quit the server with CONTROL-C.");
      setServerRunning(true);
    } else if (command.includes("shell")) {
      logs.push("Python 3.12.1 (main, Jul 07 2026)");
      logs.push("[GCC 11.2.0] on linux");
      logs.push("Type \"help\", \"copyright\", \"credits\" or \"license\" for more information.");
      logs.push("(InteractiveConsole)");
      logs.push(">>> from django.contrib.auth.models import User");
      logs.push(`>>> from ${blueprint.projectName.replace("_project", "")}.models import *`);
      logs.push(">>> User.objects.count()");
      logs.push(superuserCreated ? "1" : "0");
      logs.push(">>> ");
    } else {
      logs.push("Executing query and parsing command outputs... Done");
    }

    setTerminalLogs(prev => [...prev, ...logs]);
  };

  // Custom Command Line Input Handler
  const handleCustomTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTerminalInput.trim()) return;

    const input = customTerminalInput.trim();
    setCustomTerminalInput("");

    // Identify standard commands and execute proper simulation
    const matchCheat = CHEATSHEETS.find(c => c.command === input || input.includes(c.command.split(" ")[1] || "___"));
    if (matchCheat) {
      handleRunSimulatedCommand(matchCheat.command, matchCheat.category, matchCheat.explanation);
    } else if (input === "clear") {
      setTerminalLogs(["Console cleared."]);
    } else if (input === "help") {
      setTerminalLogs(prev => [
        ...prev,
        `\n$ help`,
        "Available commands inside this Django simulator:",
        "  - python manage.py makemigrations",
        "  - python manage.py migrate",
        "  - python manage.py createsuperuser",
        "  - python manage.py runserver",
        "  - python manage.py shell",
        "  - clear (wipes terminal history)"
      ]);
    } else {
      setTerminalLogs(prev => [
        ...prev,
        `\n$ ${input}`,
        `Command '${input}' recognized. Custom command executed in Django environment sandbox.`,
        "STATUS: Completed successfully (Exit code: 0)."
      ]);
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 font-sans text-slate-800">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-64 bg-slate-900 text-slate-400 flex flex-col justify-between shrink-0 select-none">
        <div>
          {/* Logo Brand Header */}
          <div className="p-6 border-b border-slate-800">
            <div className="flex items-center gap-3 text-blue-400 font-bold text-xl tracking-tight">
              <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white text-sm font-black shadow-md shadow-blue-900/40">
                Py
              </div>
              <div className="flex flex-col">
                <span className="text-white text-base leading-none font-bold">Django Nexus</span>
                <span className="text-slate-500 text-[10px] tracking-widest uppercase font-semibold mt-1">ENGINE v5.0</span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="px-4 py-6 space-y-1">
            <div className="text-slate-500 uppercase text-[10px] font-bold px-3 py-2 tracking-wider">
              Core Architect
            </div>

            <button
              onClick={() => setActiveTab("dashboard")}
              className={`w-full text-left rounded-lg px-3 py-2.5 text-sm flex items-center gap-3 transition-all ${
                activeTab === "dashboard"
                  ? "bg-blue-600 text-white font-medium shadow-sm"
                  : "hover:bg-slate-800 hover:text-white"
              }`}
            >
              <LayoutGrid size={18} className={activeTab === "dashboard" ? "text-white" : "text-slate-400"} />
              Blueprint Architect
            </button>

            <button
              onClick={() => setActiveTab("explorer")}
              className={`w-full text-left rounded-lg px-3 py-2.5 text-sm flex items-center gap-3 transition-all ${
                activeTab === "explorer"
                  ? "bg-blue-600 text-white font-medium shadow-sm"
                  : "hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Code2 size={18} className={activeTab === "explorer" ? "text-white" : "text-slate-400"} />
              Model Registry & Code
              <span className="ml-auto text-[10px] bg-slate-800 text-blue-400 px-1.5 py-0.5 rounded font-bold font-mono">
                {blueprint.files.length}
              </span>
            </button>

            <div className="text-slate-500 uppercase text-[10px] font-bold px-3 py-2 tracking-wider mt-6">
              Learning Lab
            </div>

            <button
              onClick={() => setActiveTab("terminal")}
              className={`w-full text-left rounded-lg px-3 py-2.5 text-sm flex items-center gap-3 transition-all ${
                activeTab === "terminal"
                  ? "bg-blue-600 text-white font-medium shadow-sm"
                  : "hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Terminal size={18} className={activeTab === "terminal" ? "text-white" : "text-slate-400"} />
              Interactive Shell Simulator
            </button>

            <button
              onClick={() => setActiveTab("tutor")}
              className={`w-full text-left rounded-lg px-3 py-2.5 text-sm flex items-center gap-3 transition-all ${
                activeTab === "tutor"
                  ? "bg-blue-600 text-white font-medium shadow-sm"
                  : "hover:bg-slate-800 hover:text-white"
              }`}
            >
              <MessageSquare size={18} className={activeTab === "tutor" ? "text-white" : "text-slate-400"} />
              DjangoMaster AI Tutor
              <span className="ml-auto w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
            </button>
          </div>
        </div>

        {/* User / Persona Section matching theme */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-900/60 border border-blue-500/30 flex items-center justify-center text-xs text-blue-200 font-bold font-mono">
              DJ
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-slate-100 truncate">Jane Django</div>
              <div className="text-[10px] text-slate-500 font-mono tracking-wider truncate">SUPERUSER_ACTIVE</div>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-400" title="System connected"></span>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* TOP BAR / HEADER */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>Django Nexus Engine</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-900 font-medium capitalize">
              {activeTab === "dashboard" && "Project Architecture & Presets"}
              {activeTab === "explorer" && "Python Code & Model Registries"}
              {activeTab === "terminal" && "Manage.py Sandbox Console"}
              {activeTab === "tutor" && "Dynamic Learning Tutor Chat"}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Database Engine Selector */}
            <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
              <Database size={14} className="text-slate-500" />
              <span className="text-xs font-semibold text-slate-700">Database:</span>
              <select
                value={selectedDatabase}
                onChange={(e) => setSelectedDatabase(e.target.value as DatabaseType)}
                className="bg-transparent text-xs text-blue-600 font-bold focus:outline-none cursor-pointer"
              >
                <option value="sqlite">SQLite (Local File)</option>
                <option value="postgresql">PostgreSQL (Production)</option>
                <option value="mysql">MySQL Engine</option>
              </select>
            </div>

            {/* Stable Environment Indicator */}
            <div className="flex items-center gap-2 text-xs font-mono bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full border border-emerald-100">
              <span className="block w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              Environment: Stable
            </div>
          </div>
        </header>

        {/* METRICS ROW (ALWAYS VISIBLE IN WORKSPACE FOR ARCHITECTURAL HONESTY) */}
        <section className="bg-slate-100/50 border-b border-slate-200 px-8 py-4 shrink-0">
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Models Registry</div>
                <div className="text-xl font-bold text-slate-900 mt-1">{totalModelsCount} Classes</div>
              </div>
              <div className="w-8 h-8 rounded bg-blue-50 flex items-center justify-center text-blue-600">
                <Database size={16} />
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">App Controllers</div>
                <div className="text-xl font-bold text-slate-900 mt-1">{totalViewsCount} Views</div>
              </div>
              <div className="w-8 h-8 rounded bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Layers size={16} />
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Files Scaffolded</div>
                <div className="text-xl font-bold text-slate-900 mt-1">{blueprint.files.length} Files</div>
              </div>
              <div className="w-8 h-8 rounded bg-amber-50 flex items-center justify-center text-amber-600">
                <FileText size={16} />
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Source Size</div>
                <div className="text-xl font-bold text-slate-900 mt-1">~{totalLinesOfCode} Lines</div>
              </div>
              <div className="w-8 h-8 rounded bg-emerald-50 flex items-center justify-center text-emerald-600">
                <Code2 size={16} />
              </div>
            </div>
          </div>
        </section>

        {/* CONTENT VIEWPORT */}
        <main className="flex-1 overflow-y-auto p-8 bg-slate-50">
          
          {/* TAB 1: BLUEPRINT ARCHITECT & GENERATOR */}
          {activeTab === "dashboard" && (
            <div className="space-y-8 max-w-6xl mx-auto">
              
              {/* HEADING PROMPT DESCRIPTION */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg text-blue-700">
                    <Sparkles size={24} />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-bold text-slate-950">Django Blueprint Architect</h2>
                    <p className="text-sm text-slate-600 mt-1">
                      Instantly architect clean, production-ready python django projects. Enter your requirements below or use a preset structure to learn Django models and structures.
                    </p>
                  </div>
                </div>

                {/* Generator Form */}
                <form onSubmit={handleGenerateCustomBlueprint} className="mt-6 space-y-4 border-t border-slate-100 pt-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Describe your Django Project / Business Idea
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={customPrompt}
                          onChange={(e) => setCustomPrompt(e.target.value)}
                          placeholder="e.g., 'A library book rental registry with borrow tracking and membership tiers'"
                          className="w-full px-4 py-3 bg-slate-100 hover:bg-slate-100/80 focus:bg-white text-sm border border-slate-200 focus:border-blue-500 rounded-lg focus:outline-none transition-all placeholder:text-slate-400"
                          disabled={isGenerating}
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isGenerating || !customPrompt.trim()}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-sm font-semibold px-6 py-3 rounded-lg flex items-center gap-2 shrink-0 transition-all shadow-sm shadow-blue-600/10"
                      >
                        {isGenerating ? (
                          <>
                            <RefreshCw size={16} className="animate-spin" />
                            Architecting...
                          </>
                        ) : (
                          <>
                            <Sparkles size={16} />
                            Generate Django Blueprint
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {generationError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700">
                      <AlertCircle size={14} />
                      <span>{generationError}</span>
                    </div>
                  )}
                </form>
              </div>

              {/* TWO COLUMN GRID: PRESETS vs SYSTEM PREVIEW */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* LEFT: Quick Preset Templates */}
                <div className="space-y-4">
                  <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
                      Preset Blueprints
                    </h3>
                    <div className="space-y-3">
                      <button
                        onClick={() => handleSelectPreset("blog")}
                        className={`w-full text-left p-4 rounded-lg border transition-all flex flex-col gap-1 ${
                          selectedPreset === "blog"
                            ? "border-blue-500 bg-blue-50/50 ring-1 ring-blue-500"
                            : "border-slate-200 hover:bg-slate-50 bg-white"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="font-bold text-sm text-slate-900">Blog & Commentary</span>
                          <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded uppercase font-semibold">
                            SQLite
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2">
                          Categories, posts, comments models with slug fields, authors, and CommentForm filters.
                        </p>
                      </button>

                      <button
                        onClick={() => handleSelectPreset("ecommerce")}
                        className={`w-full text-left p-4 rounded-lg border transition-all flex flex-col gap-1 ${
                          selectedPreset === "ecommerce"
                            ? "border-blue-500 bg-blue-50/50 ring-1 ring-blue-500"
                            : "border-slate-200 hover:bg-slate-50 bg-white"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="font-bold text-sm text-slate-900">E-Commerce Warehouse</span>
                          <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded uppercase font-semibold">
                            Postgres
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2">
                          Product inventory, customer shopping orders, relational order-items, and strict validation.
                        </p>
                      </button>

                      <button
                        onClick={() => handleSelectPreset("tasks")}
                        className={`w-full text-left p-4 rounded-lg border transition-all flex flex-col gap-1 ${
                          selectedPreset === "tasks"
                            ? "border-blue-500 bg-blue-50/50 ring-1 ring-blue-500"
                            : "border-slate-200 hover:bg-slate-50 bg-white"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="font-bold text-sm text-slate-900">Kanban Board & Tasks</span>
                          <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded uppercase font-semibold">
                            SQLite
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2">
                          Folder organizations, multi-user task assignments, priority levels, and dashboard actions.
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* Django Environment Info Card matching Professional Polish styling */}
                  <div className="bg-slate-900 rounded-xl p-6 text-white shadow-md">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                      Django Sandbox Specs
                    </h4>
                    <div className="space-y-3 font-mono text-xs">
                      <div className="flex justify-between border-b border-slate-800 pb-2">
                        <span className="text-slate-500">ENGINE_VERSION</span>
                        <span>5.0.2 LTS</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-800 pb-2">
                        <span className="text-slate-500">PYTHON_RUNTIME</span>
                        <span>3.12.1</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-800 pb-2">
                        <span className="text-slate-500">MVT_STRUCTURE</span>
                        <span>Supported</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">ADMIN_PORT</span>
                        <span>:8000/admin</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT SIDE: Current Project Preview & Instructions */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* Current Active Blueprint Overview */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                      <div>
                        <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                          Active Project: {blueprint.projectName}
                        </span>
                        <h3 className="text-base font-bold text-slate-900 mt-1">
                          Architecture Summary
                        </h3>
                      </div>
                      <button
                        onClick={() => setActiveTab("explorer")}
                        className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 transition-colors"
                      >
                        Browse Files <ChevronRight size={14} />
                      </button>
                    </div>

                    <p className="text-sm text-slate-600 mt-4 leading-relaxed">
                      {blueprint.description}
                    </p>

                    {/* Quick files grid */}
                    <div className="mt-6">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                        Generated App Component Files
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {blueprint.files.map((file, idx) => (
                          <div
                            key={file.filename}
                            onClick={() => {
                              setActiveFileIndex(idx);
                              setActiveTab("explorer");
                            }}
                            className="p-3 rounded-lg border border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-slate-100/50 cursor-pointer transition-all flex items-center gap-2.5"
                          >
                            <div className="w-6 h-6 rounded bg-blue-50 text-blue-600 flex items-center justify-center text-xs">
                              <Code2 size={12} />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-900 truncate">
                                {file.filename}
                              </div>
                              <div className="text-[10px] text-slate-500 truncate">
                                {file.path}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* STEP BY STEP LAUNCH GUIDE */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Info size={16} className="text-blue-500 animate-pulse" />
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                        Quick Launch Guide
                      </h3>
                    </div>
                    <div className="text-xs text-slate-700 bg-slate-950 p-5 rounded-lg font-mono leading-relaxed text-slate-300 overflow-x-auto max-h-72 whitespace-pre-wrap">
                      {blueprint.explanations}
                    </div>
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* TAB 2: MODEL REGISTRY & CODE EXPLORER */}
          {activeTab === "explorer" && (
            <div className="max-w-6xl mx-auto flex flex-col h-full gap-6">
              
              {/* FILE EXPLORER HEADER */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-950">Model Registry & Source Files</h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Browse and study the generated Django Python files. Double click code to select, copy to clipboard, or ask the Tutor.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-mono">Project: {blueprint.projectName}</span>
                  </div>
                </div>

                {/* File tab bar */}
                <div className="flex flex-wrap gap-2 mt-6 border-t border-slate-100 pt-4">
                  {blueprint.files.map((file, idx) => (
                    <button
                      key={file.filename}
                      onClick={() => setActiveFileIndex(idx)}
                      className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                        activeFileIndex === idx
                          ? "bg-slate-900 text-white shadow"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      <FileText size={12} />
                      {file.filename}
                      <span className="text-[10px] text-slate-400">({file.path})</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* EDITOR & CODE VIEWER */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                
                {/* Left Side: Registry Structure breakdown */}
                <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col h-fit">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
                    Active File Specs
                  </h3>

                  <div className="space-y-4 text-xs">
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <div className="font-bold text-slate-700">Filename:</div>
                      <div className="font-mono text-blue-600 mt-1">{blueprint.files[activeFileIndex]?.filename}</div>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <div className="font-bold text-slate-700">Install Path:</div>
                      <div className="font-mono text-slate-600 mt-1">{blueprint.files[activeFileIndex]?.path}</div>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <div className="font-bold text-slate-700">Line Count:</div>
                      <div className="font-mono text-slate-600 mt-1">
                        {blueprint.files[activeFileIndex]?.content.split("\n").length} lines
                      </div>
                    </div>

                    {/* Ask Tutor about this file */}
                    <button
                      onClick={() => {
                        const filename = blueprint.files[activeFileIndex]?.filename;
                        setActiveTab("tutor");
                        handleSendChatMessage(`Can you explain the generated Django ${filename} and what each code statement does?`);
                      }}
                      className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all mt-4 text-xs"
                    >
                      <MessageSquare size={12} />
                      Explain this file
                    </button>
                  </div>
                </div>

                {/* Right Side: Python Code Editor Frame */}
                <div className="lg:col-span-3 bg-slate-950 text-slate-100 rounded-xl border border-slate-800 shadow-lg flex flex-col overflow-hidden min-h-[480px]">
                  
                  {/* Mock Window Bar */}
                  <div className="bg-slate-900 px-6 py-3 border-b border-slate-800 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="text-xs font-mono text-slate-400 ml-4">
                        python - {blueprint.files[activeFileIndex]?.path}
                      </span>
                    </div>

                    {/* Copy Button */}
                    <button
                      onClick={() => handleCopyCode(blueprint.files[activeFileIndex]?.content || "", blueprint.files[activeFileIndex]?.filename || "")}
                      className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all text-xs font-semibold flex items-center gap-1.5"
                    >
                      {copySuccess === blueprint.files[activeFileIndex]?.filename ? (
                        <>
                          <Check size={12} className="text-emerald-400" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          Copy Python Code
                        </>
                      )}
                    </button>
                  </div>

                  {/* Code Block with line numbering */}
                  <div className="flex-1 p-6 font-mono text-xs overflow-auto bg-[#0a0f1d] leading-relaxed select-text">
                    <table className="w-full text-left border-collapse">
                      <tbody>
                        {blueprint.files[activeFileIndex]?.content.split("\n").map((line, idx) => (
                          <tr key={idx} className="hover:bg-slate-900/40">
                            <td className="w-10 text-right pr-4 text-slate-600 select-none border-r border-slate-800/60 font-light font-mono">
                              {idx + 1}
                            </td>
                            <td className="pl-6 whitespace-pre font-mono text-slate-300">
                              {/* Simple client-side visual highlighting */}
                              {line.startsWith("import ") || line.startsWith("from ") ? (
                                <span className="text-pink-400">{line}</span>
                              ) : line.includes("class ") ? (
                                <span className="text-yellow-400 font-bold">{line}</span>
                              ) : line.includes("def ") ? (
                                <span className="text-sky-400">{line}</span>
                              ) : line.trim().startsWith("#") ? (
                                <span className="text-slate-500 italic">{line}</span>
                              ) : (
                                line
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 3: INTERACTIVE SHELL & CHEATSHEET */}
          {activeTab === "terminal" && (
            <div className="max-w-6xl mx-auto space-y-6">
              
              {/* TERMINAL SPLIT SCREEN */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* LEFT: Simulated terminal screen */}
                <div className="lg:col-span-2 bg-[#090d16] text-slate-200 rounded-xl shadow-xl border border-slate-800 flex flex-col h-[520px] overflow-hidden">
                  
                  {/* Terminal Header */}
                  <div className="bg-slate-900 px-6 py-3 border-b border-slate-800 flex items-center justify-between shrink-0 font-mono text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                      <Terminal size={14} className="text-blue-400" />
                      <span>bash: django-nexus-sandbox</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                      <span className="text-[10px] font-bold text-slate-500">SHELL_ACTIVE</span>
                    </div>
                  </div>

                  {/* Terminal Output Logs */}
                  <div className="flex-1 p-6 overflow-y-auto font-mono text-xs space-y-2 leading-relaxed bg-[#05080f]">
                    {terminalLogs.map((log, index) => (
                      <div key={index} className="whitespace-pre-wrap font-mono text-slate-300">
                        {log.startsWith("\n$") ? (
                          <span className="text-blue-400 font-bold">{log}</span>
                        ) : log.includes("SUCCESS:") ? (
                          <span className="text-emerald-400 font-semibold">{log}</span>
                        ) : log.includes("Applying") ? (
                          <span className="text-indigo-300">{log}</span>
                        ) : (
                          log
                        )}
                      </div>
                    ))}
                    {serverRunning && (
                      <div className="p-3 bg-blue-950/40 border border-blue-900/40 rounded-lg text-xs text-blue-300 font-mono mt-4">
                        <span className="font-bold">🌍 Live Development Server Simulator running!</span>
                        <p className="mt-1">Try stopping the server simulator or calling other commands on the panel to change state.</p>
                      </div>
                    )}
                  </div>

                  {/* Terminal Input Form */}
                  <form onSubmit={handleCustomTerminalSubmit} className="bg-slate-950 p-4 border-t border-slate-800 flex gap-2 shrink-0">
                    <span className="text-blue-400 font-mono text-sm self-center select-none font-bold">$</span>
                    <input
                      type="text"
                      value={customTerminalInput}
                      onChange={(e) => setCustomTerminalInput(e.target.value)}
                      placeholder="Type a django command (e.g. 'python manage.py runserver' or 'help')"
                      className="flex-1 bg-transparent border-none text-white focus:outline-none focus:ring-0 font-mono text-xs placeholder:text-slate-600"
                    />
                    <button
                      type="submit"
                      className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded font-mono"
                    >
                      EXECUTE
                    </button>
                  </form>
                </div>

                {/* RIGHT: Clickable Command Reference */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col h-[520px]">
                  <div className="pb-4 border-b border-slate-100">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                      Interactive Commands panel
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Click any command card below to run it inside the simulated sandbox terminal and check the output.
                    </p>
                  </div>

                  {/* Scrollable list grouped by category */}
                  <div className="flex-1 overflow-y-auto pr-1 mt-4 space-y-4">
                    {/* Setup commands */}
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400 mb-2 tracking-widest">
                        Django Setup & Launch
                      </div>
                      <div className="space-y-2">
                        {CHEATSHEETS.filter(c => c.category === "Setup" || c.category === "Server").map(c => (
                          <div
                            key={c.command}
                            onClick={() => handleRunSimulatedCommand(c.command, c.category, c.explanation)}
                            className="p-3 rounded-lg border border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-slate-100/50 cursor-pointer transition-all text-xs"
                          >
                            <div className="flex items-center justify-between font-bold text-slate-900">
                              <span>{c.description}</span>
                              <Play size={10} className="text-blue-600" />
                            </div>
                            <div className="font-mono text-[10px] text-blue-600 mt-1 bg-blue-50/50 px-2 py-0.5 rounded border border-blue-100/30 w-fit">
                              {c.command}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Database & Migrations */}
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400 mb-2 tracking-widest">
                        Migrations & Database
                      </div>
                      <div className="space-y-2">
                        {CHEATSHEETS.filter(c => c.category === "Migrations" || c.category === "Database" || c.category === "Auth & Security").map(c => (
                          <div
                            key={c.command}
                            onClick={() => handleRunSimulatedCommand(c.command, c.category, c.explanation)}
                            className="p-3 rounded-lg border border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-slate-100/50 cursor-pointer transition-all text-xs"
                          >
                            <div className="flex items-center justify-between font-bold text-slate-900">
                              <span>{c.description}</span>
                              <Play size={10} className="text-blue-600" />
                            </div>
                            <div className="font-mono text-[10px] text-blue-600 mt-1 bg-blue-50/50 px-2 py-0.5 rounded border border-blue-100/30 w-fit">
                              {c.command}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* SIMULATED DATABASE STATE */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Simulated Database Tables ({selectedDatabase})</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Visual state of target DB structure based on completed migrations.
                    </p>
                  </div>
                  {!migrationsApplied ? (
                    <span className="text-xs font-semibold bg-amber-50 text-amber-700 px-3 py-1 rounded-full border border-amber-100">
                      ⚠️ Pending Migrations
                    </span>
                  ) : (
                    <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-100">
                      ✓ Database Migrated Successfully
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {simulatedDatabaseTables.map(tbl => (
                    <div key={tbl} className="p-3 bg-slate-50 rounded-lg border border-slate-200/60 font-mono text-xs flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <span className="text-slate-700 font-medium">{tbl}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: DJANGOMASTER AI TUTOR */}
          {activeTab === "tutor" && (
            <div className="max-w-4xl mx-auto bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[580px] overflow-hidden">
              
              {/* Tutor Header */}
              <div className="bg-slate-900 text-white p-6 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-sm shadow">
                    DM
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">DjangoMaster AI</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Senior Django Architect & Mentor</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-xs font-mono text-slate-400">Tutor Live Online</span>
                </div>
              </div>

              {/* Chat messages */}
              <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-slate-50/50">
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-4 max-w-3xl ${
                      msg.role === "user" ? "ml-auto flex-row-reverse" : ""
                    }`}
                  >
                    {/* Avatar */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs shrink-0 font-bold ${
                      msg.role === "user"
                        ? "bg-slate-800 text-white"
                        : "bg-blue-600 text-white"
                    }`}>
                      {msg.role === "user" ? "U" : "DM"}
                    </div>

                    {/* Chat box */}
                    <div className="space-y-1">
                      <div className={`px-4 py-3 rounded-xl text-sm leading-relaxed shadow-sm whitespace-pre-wrap ${
                        msg.role === "user"
                          ? "bg-slate-900 text-slate-100 rounded-tr-none"
                          : "bg-white text-slate-800 border border-slate-200 rounded-tl-none"
                      }`}>
                        {msg.content}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono text-right mt-1 px-1">
                        {msg.timestamp}
                      </div>
                    </div>
                  </div>
                ))}
                
                {isChatSending && (
                  <div className="flex gap-4 max-w-3xl">
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                      DM
                    </div>
                    <div className="bg-white border border-slate-200 px-4 py-3 rounded-xl shadow-sm text-sm text-slate-500 rounded-tl-none flex items-center gap-2">
                      <RefreshCw size={14} className="animate-spin text-blue-600" />
                      <span>DjangoMaster is typing architectural details...</span>
                    </div>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Quick Prompt Suggesters */}
              <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap gap-2 shrink-0">
                <button
                  onClick={() => handleSendChatMessage("Explain Django MVT architecture compared to MVC")}
                  className="px-3 py-1.5 bg-white border border-slate-200 hover:border-blue-400 rounded-full text-xs font-medium text-slate-700 transition-all shadow-sm"
                >
                  Django MVT Architecture
                </button>
                <button
                  onClick={() => handleSendChatMessage("What is a ForeignKey and how does on_delete work?")}
                  className="px-3 py-1.5 bg-white border border-slate-200 hover:border-blue-400 rounded-full text-xs font-medium text-slate-700 transition-all shadow-sm"
                >
                  ForeignKeys & DB relations
                </button>
                <button
                  onClick={() => handleSendChatMessage("Give me a guide on Class-Based Views vs Function-Based Views")}
                  className="px-3 py-1.5 bg-white border border-slate-200 hover:border-blue-400 rounded-full text-xs font-medium text-slate-700 transition-all shadow-sm"
                >
                  Class vs Function Views
                </button>
              </div>

              {/* Input Chat bar */}
              <div className="p-4 bg-white border-t border-slate-200 shrink-0">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSendChatMessage();
                    }}
                    placeholder="Ask DjangoMaster anything (e.g. 'How do I add a new field to my model?')"
                    className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-100/80 focus:bg-white text-sm border border-slate-200 focus:border-blue-500 rounded-lg focus:outline-none transition-all placeholder:text-slate-400"
                    disabled={isChatSending}
                  />
                  <button
                    onClick={() => handleSendChatMessage()}
                    disabled={isChatSending || !chatInput.trim()}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white px-5 rounded-lg font-semibold flex items-center justify-center transition-all"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>

            </div>
          )}

        </main>

        {/* BOTTOM STATUS BAR (ARCHITECTURAL HONESTY) */}
        <footer className="h-10 bg-slate-100 border-t border-slate-200 px-8 flex items-center justify-between text-[10px] text-slate-500 font-mono shrink-0">
          <div>DEBUG_MODE = True | DJANGO_SETTINGS = 'config.settings' | TIMEZONE = 'UTC'</div>
          <div className="flex gap-4">
            <span>Uptime: Live Preview</span>
            <span>CPU: 4.8%</span>
            <span>Django Port: 8000</span>
          </div>
        </footer>

      </div>
    </div>
  );
}
