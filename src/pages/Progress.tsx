import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Flame,
  Milestone,
  Plus,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  X,
  Bot,
  Layers,
  ArrowRight,
  ListTodo,
  BookOpen,
  Search,
  Share2,
  BarChart3,
  FileText,
  Award,
  Languages,
  Code2,
  History,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { runAiChat, type AiSettings, defaultAiSettings } from '../lib/ai';
import { PageHeader, Spinner, ConfirmDialog } from '../components/UI';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import type { Roadmap, RoadmapPhase, RoadmapTask, DailyHabit, DailyProgressLog } from '../types';

/**
 * Built-in starter presets based on recommended roadmaps.
 */
const presets: Array<Omit<Roadmap, '_id' | 'createdAt' | 'updatedAt'>> = [
  {
    title: '12-Month Rust & Backend Systems Mastery',
    description: 'A comprehensive curriculum from absolute zero to backend systems, advanced DSA, and interview readiness.',
    category: 'rust',
    duration: '12 Months',
    status: 'active',
    dailyHabits: [
      { id: 'h1', title: 'English speaking happens every day' },
      { id: 'h2', title: 'Daily coding & problem solving (1-2 hours)' },
    ],
    phases: [
      {
        id: 'm1',
        title: 'Month 1: Rust from absolute zero',
        description: 'Rustup, Cargo tooling, basic syntax, primitive types, control flow & first CLI.',
        targetMonth: 1,
        tasks: [
          { id: 't1-1', title: 'Install Rustup, Cargo, and configure VS Code rust-analyzer', completed: false },
          { id: 't1-2', title: 'Variables, mutability, shadowing, and primitive data types', completed: false },
          { id: 't1-3', title: 'Functions, statements, expressions, and control flow (if/loop/while/for)', completed: false },
          { id: 't1-4', title: 'Strings vs &str, string slices and basic manipulation', completed: false },
          { id: 't1-5', title: 'Build first CLI tool: Interactive Guessing Game & Word Counter', completed: false },
        ],
      },
      {
        id: 'm2',
        title: 'Month 2: Rust fundamentals + tooling',
        description: 'Structs, Enums, pattern matching, error handling, crates, and testing.',
        targetMonth: 2,
        tasks: [
          { id: 't2-1', title: 'Structs, Methods, Associated Functions & tuple structs', completed: false },
          { id: 't2-2', title: 'Enums, Option<T>, and deep pattern matching with match and if-let', completed: false },
          { id: 't2-3', title: 'Robust Error Handling with Result<T, E> and the ? operator', completed: false },
          { id: 't2-4', title: 'Managing growing projects with Packages, Crates and Modules', completed: false },
          { id: 't2-5', title: 'Unit testing, integration tests, and Cargo Criterion benchmarks', completed: false },
        ],
      },
      {
        id: 'm3',
        title: 'Month 3: Ownership + memory + data structures',
        description: 'Deep dive into stack/heap memory, borrow checker rules, lifetimes, and smart pointers.',
        targetMonth: 3,
        tasks: [
          { id: 't3-1', title: 'Master Stack vs Heap memory layout and Move semantics', completed: false },
          { id: 't3-2', title: 'Borrowing rules, references, mutable borrows, and Lifetimes (\'a)', completed: false },
          { id: 't3-3', title: 'Smart Pointers: Box<T>, Rc<T>, Arc<T>, and interior mutability with RefCell<T>', completed: false },
          { id: 't3-4', title: 'Implement fundamental data structures (Singly Linked List, Stack, Queue) in Rust', completed: false },
          { id: 't3-5', title: 'Explore RAII, Drop trait, and custom memory management basics', completed: false },
        ],
      },
      {
        id: 'm4',
        title: 'Month 4: Algorithms I',
        description: 'Big-O analysis, binary search, two pointers, sliding window, and sorting.',
        targetMonth: 4,
        tasks: [
          { id: 't4-1', title: 'Time and space complexity (Big-O) analysis with Rust memory footprint', completed: false },
          { id: 't4-2', title: 'Binary Search variants and boundary conditions', completed: false },
          { id: 't4-3', title: 'Two Pointers and Sliding Window techniques', completed: false },
          { id: 't4-4', title: 'Sorting algorithms: QuickSort and MergeSort implemented in safe Rust', completed: false },
          { id: 't4-5', title: 'Solve 25 LeetCode / Codeforces Easy-Medium problems in Rust', completed: false },
        ],
      },
      {
        id: 'm5',
        title: 'Month 5: Algorithms II',
        description: 'Recursion, backtracking, graph representations, traversals, and dynamic programming.',
        targetMonth: 5,
        tasks: [
          { id: 't5-1', title: 'Recursion trees, state spaces, and backtracking algorithms', completed: false },
          { id: 't5-2', title: 'Graph representations (Adjacency list, matrix) and BFS / DFS traversals', completed: false },
          { id: 't5-3', title: 'Shortest path algorithms: Dijkstra and Bellman-Ford in Rust', completed: false },
          { id: 't5-4', title: 'Topological Sort and Cycle Detection in directed/undirected graphs', completed: false },
          { id: 't5-5', title: 'Dynamic Programming fundamentals: 1D memoization and tabulation', completed: false },
        ],
      },
      {
        id: 'm6',
        title: 'Month 6: Advanced DSA',
        description: 'Disjoint set union, segment trees, tries, and competitive programming mastery.',
        targetMonth: 6,
        tasks: [
          { id: 't6-1', title: 'Disjoint Set Union (Union-Find with path compression & rank)', completed: false },
          { id: 't6-2', title: 'Segment Tree and Fenwick Tree (Binary Indexed Tree) for range queries', completed: false },
          { id: 't6-3', title: 'Trie (Prefix Tree) and string matching algorithms (KMP)', completed: false },
          { id: 't6-4', title: '2D Dynamic Programming (Knapsack, LCS, LIS)', completed: false },
          { id: 't6-5', title: 'Solve 35+ Medium-Hard problems and participate in weekly contests', completed: false },
        ],
      },
      {
        id: 'm7',
        title: 'Month 7: Backend engineering with Rust',
        description: 'Async Rust with Tokio runtime, web frameworks (Axum/Actix), and RESTful APIs.',
        targetMonth: 7,
        tasks: [
          { id: 't7-1', title: 'Async Rust fundamentals: Tokio runtime, Future trait, async/await', completed: false },
          { id: 't7-2', title: 'Build a production REST API with Axum (routing, handlers, state)', completed: false },
          { id: 't7-3', title: 'Request validation, error handling middleware, and logging with Tracing', completed: false },
          { id: 't7-4', title: 'PostgreSQL database integration with SQLx (async queries & migrations)', completed: false },
          { id: 't7-5', title: 'Implement JWT Authentication, password hashing (Argon2), and RBAC', completed: false },
        ],
      },
      {
        id: 'm8',
        title: 'Month 8: Databases + APIs + Testing + Docker',
        description: 'Redis caching, connection pooling, multi-stage Docker builds, and CI/CD pipelines.',
        targetMonth: 8,
        tasks: [
          { id: 't8-1', title: 'Database indexing, transactions, ACID guarantees, and performance tuning', completed: false },
          { id: 't8-2', title: 'In-memory caching and pub/sub with Redis in Rust', completed: false },
          { id: 't8-3', title: 'Containerize Rust backend using minimal multi-stage Dockerfiles (Alpine/Distroless)', completed: false },
          { id: 't8-4', title: 'Automated integration tests using Testcontainers', completed: false },
          { id: 't8-5', title: 'Build automated CI/CD pipeline with GitHub Actions (lint, test, build, docker push)', completed: false },
        ],
      },
      {
        id: 'm9',
        title: 'Month 9: OS + Networking + Concurrency',
        description: 'Multithreading, channels, sync primitives, non-blocking I/O, and custom HTTP server.',
        targetMonth: 9,
        tasks: [
          { id: 't9-1', title: 'Threads, Send and Sync traits, Arc<Mutex<T>>, and RwLock<T>', completed: false },
          { id: 't9-2', title: 'Message passing concurrency with crossbeam and Tokio MPSC channels', completed: false },
          { id: 't9-3', title: 'Low-level networking: build a raw TCP server and HTTP parser from scratch', completed: false },
          { id: 't9-4', title: 'Linux OS concepts: processes, file descriptors, signals, and epoll', completed: false },
          { id: 't9-5', title: 'Memory and CPU profiling using Valgrind, perf, and Flamegraphs', completed: false },
        ],
      },
      {
        id: 'm10',
        title: 'Month 10: System Design + Distributed Systems',
        description: 'Scalability, microservices, messaging, distributed caching, and real-world architectures.',
        targetMonth: 10,
        tasks: [
          { id: 't10-1', title: 'Horizontal scaling, Load Balancers (Nginx/HAProxy), and Reverse Proxies', completed: false },
          { id: 't10-2', title: 'Database sharding, master-slave replication, and CAP Theorem tradeoffs', completed: false },
          { id: 't10-3', title: 'Event-driven systems using Apache Kafka or RabbitMQ with Rust producers/consumers', completed: false },
          { id: 't10-4', title: 'Rate limiting algorithms (Token Bucket, Leaky Bucket) & Circuit Breakers', completed: false },
          { id: 't10-5', title: 'Design real-world systems: TinyURL, Distributed Key-Value Store, and Real-time Chat', completed: false },
        ],
      },
      {
        id: 'm11',
        title: 'Month 11: Google-style Interview Preparation',
        description: 'Intensive DSA patterns, Blind 75 / NeetCode 150 review, and behavioral interview practice.',
        targetMonth: 11,
        tasks: [
          { id: 't11-1', title: 'Review top 14 algorithmic patterns (Sliding window, Two pointers, BFS/DFS, DP)', completed: false },
          { id: 't11-2', title: 'Practice 45-minute timed coding problems with clean idiomatic Rust', completed: false },
          { id: 't11-3', title: 'System design whiteboarding practice: end-to-end architectural trade-offs', completed: false },
          { id: 't11-4', title: 'Prepare STAR stories for behavioral interviews and engineering leadership', completed: false },
          { id: 't11-5', title: 'Conduct 5 mock technical interview sessions with peers', completed: false },
        ],
      },
      {
        id: 'm12',
        title: 'Month 12: Mock Interviews + Applications',
        description: 'Portfolio polish, resume refinement, targeted outreach, and closing offers.',
        targetMonth: 12,
        tasks: [
          { id: 't12-1', title: 'Refine GitHub portfolio projects with comprehensive READMEs and benchmarks', completed: false },
          { id: 't12-2', title: 'Optimize technical Resume and LinkedIn profile for senior/mid Rust positions', completed: false },
          { id: 't12-3', title: 'Execute targeted job applications and referral outreach to high-tier companies', completed: false },
          { id: 't12-4', title: 'Complete live interview rounds, take-home projects, and technical debriefs', completed: false },
          { id: 't12-5', title: 'Evaluate offers, negotiate compensation packages, and finalize acceptance', completed: false },
        ],
      },
    ],
    dailyLogs: [],
  },
  {
    title: '30-Day Pandas & NumPy Data Science Sprint',
    description: 'Master data manipulation, cleaning, aggregation, and exploratory analysis in Python.',
    category: 'python',
    duration: '30 Days',
    status: 'active',
    dailyHabits: [
      { id: 'h1', title: 'Daily hands-on coding in Jupyter / Google Colab' },
      { id: 'h2', title: 'Review 1 real-world Kaggle dataset' },
    ],
    phases: [
      {
        id: 'w1',
        title: 'Week 1: NumPy Foundations & Vectorized Math',
        description: 'Arrays, slicing, broadcasting, linear algebra and performance.',
        targetMonth: 1,
        tasks: [
          { id: 'p1-1', title: 'NumPy array creation, data types, and shape inspection', completed: false },
          { id: 'p1-2', title: 'Indexing, slicing, boolean masking, and fancy indexing', completed: false },
          { id: 'p1-3', title: 'Broadcasting rules and element-wise mathematical operations', completed: false },
          { id: 'p1-4', title: 'Matrix multiplication, dot products, and linear algebra routines', completed: false },
          { id: 'p1-5', title: 'Speed benchmark: NumPy vectorization vs Python loops', completed: false },
        ],
      },
      {
        id: 'w2',
        title: 'Week 2: Pandas Series & DataFrames Core',
        description: 'Data ingestion, inspection, selection, filtering, and missing data.',
        targetMonth: 1,
        tasks: [
          { id: 'p2-1', title: 'Series, DataFrame structure, index manipulation', completed: false },
          { id: 'p2-2', title: 'Loading CSV, JSON, Excel, and SQL tables into DataFrames', completed: false },
          { id: 'p2-3', title: 'loc vs iloc indexing, conditional filtering, and query()', completed: false },
          { id: 'p2-4', title: 'Detecting and handling missing values (isna, dropna, fillna, interpolate)', completed: false },
          { id: 'p2-5', title: 'Column data type casting and memory optimization', completed: false },
        ],
      },
      {
        id: 'w3',
        title: 'Week 3: Aggregation, Grouping & Merging',
        description: 'GroupBy, transform, pivot tables, and joining multiple datasets.',
        targetMonth: 1,
        tasks: [
          { id: 'p3-1', title: 'GroupBy split-apply-combine workflow with custom aggregations', completed: false },
          { id: 'p3-2', title: 'Transform, filter, and window functions on groups', completed: false },
          { id: 'p3-3', title: 'Merging, joining, and concatenating multiple DataFrames', completed: false },
          { id: 'p3-4', title: 'Reshaping data with pivot_table, melt, stack, and unstack', completed: false },
          { id: 'p3-5', title: 'Working with dates, timestamps, and DatetimeIndex resample', completed: false },
        ],
      },
      {
        id: 'w4',
        title: 'Week 4: Real-World EDA Project',
        description: 'End-to-end data cleaning, exploratory analysis, and presentation.',
        targetMonth: 1,
        tasks: [
          { id: 'p4-1', title: 'Outlier detection using IQR and Z-scores', completed: false },
          { id: 'p4-2', title: 'Exploratory data analysis (EDA) on real-world e-commerce dataset', completed: false },
          { id: 'p4-3', title: 'Data visualization integrations (Matplotlib & Seaborn plots)', completed: false },
          { id: 'p4-4', title: 'Build an automated data cleaning and reporting pipeline script', completed: false },
          { id: 'p4-5', title: 'Document findings in an executive summary notebook', completed: false },
        ],
      },
    ],
    dailyLogs: [],
  },
];

function localDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export interface HabitTheme {
  label: string;
  badgeBg: string;
  border: string;
  dot: string;
  hex: string;
  colorName: 'purple' | 'amber' | 'sky' | 'emerald' | 'rose';
}

export const getHabitTheme = (title: string, index = 0): HabitTheme => {
  const lower = title.toLowerCase();
  if (lower.includes('english') || lower.includes('speak') || lower.includes('ielts') || lower.includes('eng') || lower.includes('vocab')) {
    return {
      label: 'English Speaking',
      badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      border: 'border-purple-500/40',
      dot: 'bg-purple-500',
      hex: '#a855f7',
      colorName: 'purple',
    };
  }
  if (lower.includes('code') || lower.includes('rust') || lower.includes('python') || lower.includes('study') || lower.includes('algo') || lower.includes('leet') || lower.includes('dsa') || lower.includes('solve')) {
    return {
      label: 'Coding & Study',
      badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      border: 'border-amber-500/40',
      dot: 'bg-amber-500',
      hex: '#f59e0b',
      colorName: 'amber',
    };
  }
  if (lower.includes('routine') || lower.includes('task') || lower.includes('class') || lower.includes('work') || lower.includes('meeting')) {
    return {
      label: 'Routine Task',
      badgeBg: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
      border: 'border-sky-500/40',
      dot: 'bg-sky-500',
      hex: '#0ea5e9',
      colorName: 'sky',
    };
  }
  if (lower.includes('read') || lower.includes('book') || lower.includes('paper') || lower.includes('docs') || lower.includes('research')) {
    return {
      label: 'Reading & Docs',
      badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      border: 'border-emerald-500/40',
      dot: 'bg-emerald-500',
      hex: '#10b981',
      colorName: 'emerald',
    };
  }
  const fallbackThemes: HabitTheme[] = [
    { label: 'Daily Habit', badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', border: 'border-emerald-500/40', dot: 'bg-emerald-500', hex: '#10b981', colorName: 'emerald' },
    { label: 'Daily Habit', badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/40', border: 'border-rose-500/40', dot: 'bg-rose-500', hex: '#f43f5e', colorName: 'rose' },
    { label: 'Daily Habit', badgeBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40', border: 'border-indigo-500/40', dot: 'bg-indigo-500', hex: '#6366f1', colorName: 'purple' },
  ];
  return fallbackThemes[index % fallbackThemes.length];
};

export default function Progress() {
  const navigate = useNavigate();
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [expandedPhases, setExpandedPhases] = useState<Record<string, boolean>>({});

  // Dialogs
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [roadmapToDelete, setRoadmapToDelete] = useState<Roadmap | null>(null);

  // New roadmap form states
  const [createTab, setCreateTab] = useState<'presets' | 'ai' | 'manual'>('presets');
  const [manualTitle, setManualTitle] = useState('');
  const [manualDuration, setManualDuration] = useState('12 Months');
  const [manualHabit, setManualHabit] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [generatingAi, setGeneratingAi] = useState(false);

  // Daily log state for current roadmap
  const [todayMinutes, setTodayMinutes] = useState<number>(60);
  const [todayNotes, setTodayNotes] = useState<string>('');
  const [todayHabitsDone, setTodayHabitsDone] = useState<Record<string, boolean>>({});
  const [savingDailyLog, setSavingDailyLog] = useState(false);

  // New task input state per phase
  const [newTaskTitle, setNewTaskTitle] = useState<Record<string, string>>({});

  // Filter & Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Add phase dialog state
  const [newPhaseOpen, setNewPhaseOpen] = useState(false);
  const [newPhaseTitle, setNewPhaseTitle] = useState('');
  const [activeTab, setActiveTab] = useState<'curriculum' | 'checkin' | 'report'>('curriculum');
  const [newHabitTitle, setNewHabitTitle] = useState('');
  const [chartDaysRange, setChartDaysRange] = useState<30 | 14>(30); // 30 days (1 month) default

  // Fetch all roadmaps
  const fetchRoadmaps = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.roadmaps.list();
      const items: Roadmap[] = Array.isArray(res.items) ? res.items : Array.isArray(res) ? res : [];
      setRoadmaps(items);
      if (items.length > 0) {
        setSelectedId((prev) => (items.some((r) => r._id === prev || r.id === prev) ? prev : items[0]._id || items[0].id || ''));
      }
    } catch {
      toast.error('Could not load roadmaps');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoadmaps();
  }, [fetchRoadmaps]);

  // Selected roadmap
  const currentRoadmap = useMemo(() => {
    return roadmaps.find((r) => (r._id || r.id) === selectedId) || roadmaps[0] || null;
  }, [roadmaps, selectedId]);

  // Expand first phase by default when roadmap changes
  useEffect(() => {
    if (currentRoadmap?.phases?.length) {
      setExpandedPhases((prev) => {
        if (Object.keys(prev).length > 0) return prev;
        const initial: Record<string, boolean> = {};
        currentRoadmap.phases.forEach((p, idx) => {
          initial[p.id] = idx === 0;
        });
        return initial;
      });
    }
  }, [currentRoadmap]);

  // Sync today's log into habit checkboxes if already logged
  useEffect(() => {
    if (!currentRoadmap) return;
    const today = localDateString();
    const existingLog = (currentRoadmap.dailyLogs || []).find((l) => l.date === today);
    if (existingLog) {
      setTodayMinutes(existingLog.minutesSpent || 60);
      setTodayNotes(existingLog.notes || '');
      const habitsMap: Record<string, boolean> = {};
      (existingLog.habitsDone || []).forEach((hId) => {
        habitsMap[hId] = true;
      });
      setTodayHabitsDone(habitsMap);
    } else {
      setTodayNotes('');
      setTodayHabitsDone({});
    }
  }, [currentRoadmap]);

  // Overall statistics calculation
  const stats = useMemo(() => {
    if (!currentRoadmap) return { totalTasks: 0, completedTasks: 0, percentage: 0, streak: 0, totalHours: 0 };
    let total = 0;
    let completed = 0;
    (currentRoadmap.phases || []).forEach((phase) => {
      (phase.tasks || []).forEach((task) => {
        total += 1;
        if (task.completed) completed += 1;
      });
    });
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Calculate total study hours and streak from dailyLogs
    let totalMinutes = 0;
    const logDates = new Set<string>();
    (currentRoadmap.dailyLogs || []).forEach((log) => {
      totalMinutes += log.minutesSpent || 0;
      if (log.date) logDates.add(log.date);
    });

    // Consecutive streak ending today or yesterday
    let streak = 0;
    let d = new Date();
    const todayStr = localDateString(d);
    if (!logDates.has(todayStr)) {
      d.setDate(d.getDate() - 1);
    }
    while (logDates.has(localDateString(d)) && streak < 3650) {
      streak += 1;
      d.setDate(d.getDate() - 1);
    }

    return {
      totalTasks: total,
      completedTasks: completed,
      percentage,
      streak,
      totalHours: (totalMinutes / 60).toFixed(1),
    };
  }, [currentRoadmap]);

  // Toggle a single task completion
  const handleToggleTask = async (phaseId: string, taskId: string) => {
    if (!currentRoadmap) return;
    const updatedPhases = currentRoadmap.phases.map((phase) => {
      if (phase.id !== phaseId) return phase;
      return {
        ...phase,
        tasks: phase.tasks.map((task) => {
          if (task.id !== taskId) return task;
          const nextCompleted = !task.completed;
          return {
            ...task,
            completed: nextCompleted,
            completedAt: nextCompleted ? new Date().toISOString() : undefined,
          };
        }),
      };
    });

    // Optimistic UI update
    const nextRoadmap = { ...currentRoadmap, phases: updatedPhases };
    setRoadmaps((prev) => prev.map((r) => ((r._id || r.id) === (currentRoadmap._id || currentRoadmap.id) ? nextRoadmap : r)));

    try {
      const id = currentRoadmap._id || currentRoadmap.id;
      await api.roadmaps.update(id!, { phases: updatedPhases });
      toast.success('Progress updated', { duration: 1500 });
    } catch {
      toast.error('Failed to sync progress');
      fetchRoadmaps();
    }
  };

  // Add custom task to a phase
  const handleAddTask = async (phaseId: string) => {
    const title = (newTaskTitle[phaseId] || '').trim();
    if (!title || !currentRoadmap) return;

    const newTask: RoadmapTask = {
      id: `task-${Date.now()}`,
      title,
      completed: false,
    };

    const updatedPhases = currentRoadmap.phases.map((phase) => {
      if (phase.id !== phaseId) return phase;
      return { ...phase, tasks: [...phase.tasks, newTask] };
    });

    setNewTaskTitle((prev) => ({ ...prev, [phaseId]: '' }));
    const nextRoadmap = { ...currentRoadmap, phases: updatedPhases };
    setRoadmaps((prev) => prev.map((r) => ((r._id || r.id) === (currentRoadmap._id || currentRoadmap.id) ? nextRoadmap : r)));

    try {
      const id = currentRoadmap._id || currentRoadmap.id;
      await api.roadmaps.update(id!, { phases: updatedPhases });
      toast.success('Task added');
    } catch {
      toast.error('Failed to add task');
    }
  };

  // Delete a task from a phase
  const handleDeleteTask = async (phaseId: string, taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentRoadmap) return;
    const updatedPhases = currentRoadmap.phases.map((phase) => {
      if (phase.id !== phaseId) return phase;
      return {
        ...phase,
        tasks: phase.tasks.filter((t) => t.id !== taskId),
      };
    });
    const nextRoadmap = { ...currentRoadmap, phases: updatedPhases };
    setRoadmaps((prev) => prev.map((r) => ((r._id || r.id) === (currentRoadmap._id || currentRoadmap.id) ? nextRoadmap : r)));
    try {
      const id = currentRoadmap._id || currentRoadmap.id;
      await api.roadmaps.update(id!, { phases: updatedPhases });
      toast.success('Task removed');
    } catch {
      toast.error('Failed to remove task');
    }
  };

  // Add a new phase
  const handleAddPhase = async () => {
    if (!newPhaseTitle.trim() || !currentRoadmap) return;
    const newPhase: RoadmapPhase = {
      id: `phase-${Date.now()}`,
      title: newPhaseTitle.trim(),
      targetMonth: (currentRoadmap.phases?.length || 0) + 1,
      tasks: [],
    };
    const updatedPhases = [...(currentRoadmap.phases || []), newPhase];
    const nextRoadmap = { ...currentRoadmap, phases: updatedPhases };
    setRoadmaps((prev) => prev.map((r) => ((r._id || r.id) === (currentRoadmap._id || currentRoadmap.id) ? nextRoadmap : r)));
    setNewPhaseTitle('');
    setNewPhaseOpen(false);
    try {
      const id = currentRoadmap._id || currentRoadmap.id;
      await api.roadmaps.update(id!, { phases: updatedPhases });
      toast.success('New phase added');
    } catch {
      toast.error('Failed to add phase');
    }
  };

  // Delete a phase
  const handleDeletePhase = async (phaseId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentRoadmap || currentRoadmap.phases.length <= 1) return;
    const updatedPhases = currentRoadmap.phases.filter((p) => p.id !== phaseId);
    const nextRoadmap = { ...currentRoadmap, phases: updatedPhases };
    setRoadmaps((prev) => prev.map((r) => ((r._id || r.id) === (currentRoadmap._id || currentRoadmap.id) ? nextRoadmap : r)));
    try {
      const id = currentRoadmap._id || currentRoadmap.id;
      await api.roadmaps.update(id!, { phases: updatedPhases });
      toast.success('Phase removed');
    } catch {
      toast.error('Failed to remove phase');
    }
  };

  // Export roadmap as Markdown
  const handleExportMarkdown = () => {
    if (!currentRoadmap) return;
    let md = `# ${currentRoadmap.title}\n\n`;
    if (currentRoadmap.description) md += `> ${currentRoadmap.description}\n\n`;
    md += `**Duration:** ${currentRoadmap.duration} | **Status:** ${currentRoadmap.status}\n\n`;
    if ((currentRoadmap.dailyHabits || []).length > 0) {
      md += `### Daily Habits\n`;
      currentRoadmap.dailyHabits.forEach((h) => {
        md += `- [ ] ${h.title}\n`;
      });
      md += `\n`;
    }
    md += `### Curriculum & Milestones\n`;
    (currentRoadmap.phases || []).forEach((p) => {
      md += `\n#### ${p.title}\n`;
      if (p.description) md += `*${p.description}*\n`;
      (p.tasks || []).forEach((t) => {
        md += `- [${t.completed ? 'x' : ' '}] ${t.title}\n`;
      });
    });
    navigator.clipboard.writeText(md);
    toast.success('Roadmap copied to clipboard as Markdown!');
  };

  // 30-Day (1 Month) or 14-Day daily study time & habit activity logs
  const chartDaysData = useMemo(() => {
    const result = [];
    const logsMap = new Map<string, DailyProgressLog>();
    (currentRoadmap?.dailyLogs || []).forEach((log) => {
      if (log.date) logsMap.set(log.date, log);
    });

    const habitsList = currentRoadmap?.dailyHabits || [];
    const habitMap = new Map<string, { title: string; theme: HabitTheme }>();
    habitsList.forEach((h, idx) => {
      habitMap.set(h.id, { title: h.title, theme: getHabitTheme(h.title, idx) });
    });

    for (let i = chartDaysRange - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = localDateString(d);
      const log = logsMap.get(dateStr);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNum = d.getDate();
      const monthShort = d.toLocaleDateString('en-US', { month: 'short' });

      const completedHabitIds = log?.habitsDone || [];
      const completedHabits = completedHabitIds
        .map((hid) => habitMap.get(hid))
        .filter(Boolean) as Array<{ title: string; theme: HabitTheme }>;

      const hasEnglish = completedHabits.some((h) => h.theme.colorName === 'purple');
      const hasCoding = completedHabits.some((h) => h.theme.colorName === 'amber');
      const hasOther = completedHabits.some((h) => h.theme.colorName !== 'purple' && h.theme.colorName !== 'amber');

      result.push({
        date: dateStr,
        dayLabel: `${dayName} ${dayNum}`,
        fullLabel: `${monthShort} ${dayNum} (${dayName})`,
        dayNum,
        shortDay: dayName[0],
        minutes: log?.minutesSpent || 0,
        completedHabits,
        hasEnglish,
        hasCoding,
        hasOther,
        notes: log?.notes || '',
      });
    }
    return result;
  }, [currentRoadmap?.dailyLogs, currentRoadmap?.dailyHabits, chartDaysRange]);

  const maxChartMinutes = useMemo(() => {
    const max = Math.max(...chartDaysData.map((d) => d.minutes), 60);
    return Math.ceil(max / 30) * 30;
  }, [chartDaysData]);

  const avgMinutes = useMemo(() => {
    const logged = chartDaysData.filter((d) => d.minutes > 0);
    return logged.length > 0 ? Math.round(logged.reduce((acc, d) => acc + d.minutes, 0) / logged.length) : 0;
  }, [chartDaysData]);

  const habitAdherence = useMemo(() => {
    const totalLogs = currentRoadmap?.dailyLogs?.length || 0;
    if (totalLogs === 0) return 0;
    const habitsTotal = currentRoadmap?.dailyHabits?.length || 1;
    const completedHabitChecks = (currentRoadmap?.dailyLogs || []).reduce((acc, l) => acc + (l.habitsDone?.length || 0), 0);
    return Math.min(100, Math.round((completedHabitChecks / (totalLogs * habitsTotal)) * 100));
  }, [currentRoadmap]);

  const phaseStats = useMemo(() => {
    if (!currentRoadmap?.phases) return [];
    return currentRoadmap.phases.map((phase) => {
      const total = phase.tasks?.length || 0;
      const completed = phase.tasks?.filter((t) => t.completed).length || 0;
      const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
      return {
        id: phase.id,
        title: phase.title,
        targetMonth: phase.targetMonth,
        total,
        completed,
        pct,
        isDone: total > 0 && completed === total,
      };
    });
  }, [currentRoadmap?.phases]);

  const handleCopyFullReport = () => {
    if (!currentRoadmap) return;
    const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    let report = `=========================================\n`;
    report += `PROGRESS & MASTERY REPORT: ${currentRoadmap.title.toUpperCase()}\n`;
    report += `Generated: ${today}\n`;
    report += `=========================================\n\n`;
    report += `[KEY METRICS]\n`;
    report += `- Overall Completion: ${stats.percentage}%\n`;
    report += `- Milestones Completed: ${stats.completedTasks} / ${stats.totalTasks}\n`;
    report += `- Total Study Time Logged: ${stats.totalHours} hours\n`;
    report += `- Current Streak: ${stats.streak} days\n`;
    report += `- Habit Consistency: ${habitAdherence}%\n`;
    report += `- 14-Day Average Study: ${avgMinutes} mins/session\n\n`;
    report += `[PHASE BREAKDOWN]\n`;
    phaseStats.forEach((p) => {
      report += `- ${p.title}: ${p.completed}/${p.total} tasks (${p.pct}%)${p.isDone ? ' [COMPLETED]' : ''}\n`;
    });
    if ((currentRoadmap.dailyLogs || []).length > 0) {
      report += `\n[RECENT ACTIVITY LOGS]\n`;
      currentRoadmap.dailyLogs.slice(0, 10).forEach((l) => {
        report += `- ${l.date}: ${l.minutesSpent} mins ${l.notes ? `| Note: ${l.notes}` : ''}\n`;
      });
    }
    report += `\n=========================================\n`;
    navigator.clipboard.writeText(report);
    toast.success('Full progress report copied to clipboard!');
  };

  // Filter phases by search query
  const filteredPhases = useMemo(() => {
    if (!currentRoadmap) return [];
    if (!searchQuery.trim()) return currentRoadmap.phases || [];
    const q = searchQuery.toLowerCase().trim();
    return (currentRoadmap.phases || [])
      .map((phase) => {
        const matchPhase = phase.title.toLowerCase().includes(q) || (phase.description || '').toLowerCase().includes(q);
        const matchingTasks = (phase.tasks || []).filter((t) => t.title.toLowerCase().includes(q));
        if (matchPhase) return phase;
        if (matchingTasks.length > 0) return { ...phase, tasks: matchingTasks };
        return null;
      })
      .filter((p): p is RoadmapPhase => Boolean(p));
  }, [currentRoadmap, searchQuery]);

  const allExpanded = useMemo(() => {
    if (!currentRoadmap?.phases?.length) return false;
    return currentRoadmap.phases.every((p) => expandedPhases[p.id] !== false);
  }, [currentRoadmap, expandedPhases]);

  const handleToggleExpandAll = () => {
    if (!currentRoadmap?.phases?.length) return;
    const nextState = !allExpanded;
    const updated: Record<string, boolean> = {};
    currentRoadmap.phases.forEach((p) => {
      updated[p.id] = nextState;
    });
    setExpandedPhases(updated);
  };

  // Save today's daily log (habits & time)
  const handleSaveDailyLog = async () => {
    if (!currentRoadmap) return;
    setSavingDailyLog(true);
    const today = localDateString();
    const habitsDone = Object.keys(todayHabitsDone).filter((k) => todayHabitsDone[k]);

    const newLog: DailyProgressLog = {
      date: today,
      minutesSpent: todayMinutes,
      habitsDone,
      notes: todayNotes.trim(),
    };

    // Rolling 1-month window (auto-expire logs older than 31 days)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 31);
    const cutoffDateStr = localDateString(cutoffDate);

    const existingLogs = (currentRoadmap.dailyLogs || []).filter(
      (l) => l.date !== today && l.date >= cutoffDateStr
    );
    const updatedLogs = [newLog, ...existingLogs].slice(0, 31);

    try {
      const id = currentRoadmap._id || currentRoadmap.id;
      await api.roadmaps.update(id!, { dailyLogs: updatedLogs });
      setRoadmaps((prev) => prev.map((r) => ((r._id || r.id) === id ? { ...r, dailyLogs: updatedLogs } : r)));
      toast.success('Daily activity saved! Keep the streak going 🔥');
    } catch {
      toast.error('Could not save daily log');
    } finally {
      setSavingDailyLog(false);
    }
  };

  // Add custom habit to roadmap
  const handleAddHabit = async () => {
    if (!newHabitTitle.trim() || !currentRoadmap) return;
    const newHabit: DailyHabit = {
      id: `habit-${Date.now()}`,
      title: newHabitTitle.trim(),
    };
    const updatedHabits = [...(currentRoadmap.dailyHabits || []), newHabit];
    const nextRoadmap = { ...currentRoadmap, dailyHabits: updatedHabits };
    setRoadmaps((prev) => prev.map((r) => ((r._id || r.id) === (currentRoadmap._id || currentRoadmap.id) ? nextRoadmap : r)));
    setNewHabitTitle('');
    try {
      const id = currentRoadmap._id || currentRoadmap.id;
      await api.roadmaps.update(id!, { dailyHabits: updatedHabits });
      toast.success('Habit added');
    } catch {
      toast.error('Failed to add habit');
    }
  };

  // Remove habit from roadmap
  const handleDeleteHabit = async (habitId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!currentRoadmap) return;
    const updatedHabits = (currentRoadmap.dailyHabits || []).filter((h) => h.id !== habitId);
    const nextRoadmap = { ...currentRoadmap, dailyHabits: updatedHabits };
    setRoadmaps((prev) => prev.map((r) => ((r._id || r.id) === (currentRoadmap._id || currentRoadmap.id) ? nextRoadmap : r)));
    try {
      const id = currentRoadmap._id || currentRoadmap.id;
      await api.roadmaps.update(id!, { dailyHabits: updatedHabits });
      toast.success('Habit removed');
    } catch {
      toast.error('Failed to remove habit');
    }
  };

  // Import routines as habits
  const handleImportFromRoutine = async () => {
    if (!currentRoadmap) return;
    try {
      const routines = await api.routines.list();
      const routineItems = Array.isArray(routines) ? routines : (routines as any).items || [];
      if (routineItems.length === 0) {
        toast('No routines found in your Routine page.');
        return;
      }
      const existingTitles = new Set((currentRoadmap.dailyHabits || []).map((h) => h.title.toLowerCase()));
      const newHabits: DailyHabit[] = [];
      routineItems.forEach((r: any) => {
        const title = (r.title || r.subject || '').trim();
        if (title && !existingTitles.has(title.toLowerCase())) {
          newHabits.push({ id: `habit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, title });
          existingTitles.add(title.toLowerCase());
        }
      });
      if (newHabits.length === 0) {
        toast('All routines are already added to habits.');
        return;
      }
      const updatedHabits = [...(currentRoadmap.dailyHabits || []), ...newHabits];
      const nextRoadmap = { ...currentRoadmap, dailyHabits: updatedHabits };
      setRoadmaps((prev) => prev.map((r) => ((r._id || r.id) === (currentRoadmap._id || currentRoadmap.id) ? nextRoadmap : r)));
      const id = currentRoadmap._id || currentRoadmap.id;
      await api.roadmaps.update(id!, { dailyHabits: updatedHabits });
      toast.success(`Imported ${newHabits.length} habits from your Routine!`);
    } catch {
      toast.error('Could not import from Routine');
    }
  };

  // Apply a starter preset
  const handleApplyPreset = async (preset: (typeof presets)[0]) => {
    try {
      setLoading(true);
      const created = await api.roadmaps.create(preset);
      toast.success(`Created "${preset.title}"!`);
      setCreateModalOpen(false);
      await fetchRoadmaps();
      setSelectedId(created._id || created.id || '');
    } catch {
      toast.error('Could not create preset roadmap');
      setLoading(false);
    }
  };

  // Create via AI Generation
  const handleGenerateAi = async () => {
    if (!aiPrompt.trim()) return;
    setGeneratingAi(true);
    try {
      const aiSettingsData = await api.aiSettings.get().catch(() => defaultAiSettings as AiSettings);
      const systemInstruction = `You are a learning curriculum planner.
The user wants a structured learning roadmap.
Return a STRICT valid JSON object (without markdown code blocks) representing the roadmap with this structure:
{
  "title": "Title of the roadmap",
  "description": "Short summary",
  "category": "subject slug (e.g. rust, python, devops)",
  "duration": "e.g. 12 Months or 30 Days",
  "dailyHabits": [{"id": "h1", "title": "habit description"}],
  "phases": [
    {
      "id": "p1",
      "title": "Phase/Month 1: ...",
      "description": "...",
      "targetMonth": 1,
      "tasks": [{"id": "t1-1", "title": "...", "completed": false}]
    }
  ]
}`;

      const rawResponse = await runAiChat(
        aiSettingsData,
        [
          { role: 'assistant', content: systemInstruction },
          { role: 'user', content: `Generate a structured roadmap with phases and checklist tasks for: ${aiPrompt}` },
        ],
        '',
        []
      );

      // Clean JSON
      const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('AI did not return a valid JSON structure. Try opening Chatbot to generate.');
      }
      const parsed = JSON.parse(jsonMatch[0]);
      parsed.dailyLogs = [];
      parsed.status = 'active';

      const created = await api.roadmaps.create(parsed);
      toast.success(`AI Roadmap "${parsed.title}" created successfully!`);
      setCreateModalOpen(false);
      setAiPrompt('');
      await fetchRoadmaps();
      setSelectedId(created._id || created.id || '');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'AI generation failed');
    } finally {
      setGeneratingAi(false);
    }
  };

  // Manual Roadmap Creation
  const handleCreateManual = async () => {
    if (!manualTitle.trim()) return;
    try {
      const payload: Partial<Roadmap> = {
        title: manualTitle.trim(),
        description: 'Personal study roadmap',
        category: 'general',
        duration: manualDuration,
        status: 'active',
        dailyHabits: manualHabit.trim() ? [{ id: 'h1', title: manualHabit.trim() }] : [],
        phases: [
          {
            id: 'm1',
            title: 'Phase 1: Getting Started',
            description: 'Core fundamentals',
            targetMonth: 1,
            tasks: [{ id: 't1-1', title: 'Initial setup & orientation', completed: false }],
          },
        ],
        dailyLogs: [],
      };
      const created = await api.roadmaps.create(payload);
      toast.success('Roadmap created!');
      setCreateModalOpen(false);
      setManualTitle('');
      await fetchRoadmaps();
      setSelectedId(created._id || created.id || '');
    } catch {
      toast.error('Could not create roadmap');
    }
  };

  // Delete Roadmap
  const handleDeleteRoadmap = async () => {
    if (!roadmapToDelete) return;
    try {
      const id = roadmapToDelete._id || roadmapToDelete.id;
      await api.roadmaps.delete(id!);
      toast.success('Roadmap deleted');
      setDeleteConfirmOpen(false);
      setRoadmapToDelete(null);
      await fetchRoadmaps();
    } catch {
      toast.error('Failed to delete roadmap');
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-in pb-12">
      {/* Page Header */}
      <PageHeader
        eyebrow="Progress & Mastery"
        title="Learning Roadmaps"
        description="Track your multi-month learning milestones, daily consistency habits, and log progress effortlessly."
      >
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              localStorage.setItem('chatbot-pending-prompt', 'আমাকে একটি নতুন লার্নিং রোডম্যাপ ও প্রগ্রেস শিট বানিয়ে দাও।');
              navigate('/chatbot');
            }}
            className="gap-2"
          >
            <Bot className="h-4 w-4 text-primary" />
            Ask AI Chatbot
          </Button>

          <Button
            size="sm"
            onClick={() => {
              setCreateTab('presets');
              setCreateModalOpen(true);
            }}
            className="gap-2 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            New Roadmap
          </Button>
        </div>
      </PageHeader>

      {loading && roadmaps.length === 0 ? (
        <Spinner />
      ) : roadmaps.length === 0 ? (
        /* Empty State */
        <Card className="rounded-3xl border border-dashed border-border bg-card/60 p-12 text-center">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Milestone className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-semibold tracking-tight">No active roadmaps yet</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Start tracking your long-term goals. Add the pre-configured 12-Month Rust & Backend Mastery roadmap or let AI design one for you.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button onClick={() => handleApplyPreset(presets[0])} className="gap-2">
              <Sparkles className="h-4 w-4" />
              Load 12-Month Rust Roadmap
            </Button>
            <Button variant="outline" onClick={() => setCreateModalOpen(true)}>
              View All Presets & AI Options
            </Button>
          </div>
        </Card>
      ) : (
        <>
          {/* Roadmap Switcher Tabs */}
          <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1">
            <div className="flex items-center gap-2">
              {roadmaps.map((item) => {
                const id = item._id || item.id || '';
                const isSelected = id === selectedId;
                return (
                  <button
                    key={id}
                    onClick={() => setSelectedId(id)}
                    className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium transition-all ${
                      isSelected
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'bg-card border border-border text-muted-foreground hover:bg-accent/70 hover:text-foreground'
                    }`}
                  >
                    <Target className="h-4 w-4 shrink-0" />
                    <span className="max-w-[180px] truncate">{item.title}</span>
                    <Badge variant={isSelected ? 'secondary' : 'outline'} className="ml-1 text-[10px] px-1.5 py-0">
                      {item.duration || 'Track'}
                    </Badge>
                  </button>
                );
              })}
            </div>

            {currentRoadmap && (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:bg-destructive/10 shrink-0"
                onClick={() => {
                  setRoadmapToDelete(currentRoadmap);
                  setDeleteConfirmOpen(true);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>

           {currentRoadmap && (
            <div className="space-y-6">
              {/* Hero Overall Progress Card */}
              <Card className="overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-card via-card to-primary/5 p-6 shadow-sm">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-primary/15 text-primary border-primary/20">
                        {currentRoadmap.status.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{currentRoadmap.duration}</span>
                    </div>
                    <h3 className="text-2xl font-bold tracking-tight">{currentRoadmap.title}</h3>
                    {currentRoadmap.description && (
                      <p className="max-w-md text-sm text-muted-foreground">{currentRoadmap.description}</p>
                    )}
                  </div>

                  {/* Circular / Large Percentage Display */}
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="grid h-24 w-24 place-items-center rounded-3xl border-2 border-primary/30 bg-primary/10 text-primary shadow-inner">
                      <div className="text-center">
                        <span className="text-3xl font-extrabold tracking-tight">{stats.percentage}%</span>
                        <span className="block text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Done</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress Bar & Sub Metrics */}
                <div className="mt-6 space-y-2">
                  <div className="h-3 w-full overflow-hidden rounded-full bg-muted/60">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${stats.percentage}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{stats.completedTasks} of {stats.totalTasks} milestones completed</span>
                    <span>{stats.totalHours} hours total logged</span>
                  </div>
                </div>
              </Card>

              {/* Navigation Tabs */}
              <div className="flex items-center gap-2 border-b border-border/60 pb-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => setActiveTab('curriculum')}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'curriculum'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                  }`}
                >
                  <Layers className="h-4 w-4" />
                  Milestones & Curriculum ({currentRoadmap.phases?.length || 0})
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('checkin')}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'checkin'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                  }`}
                >
                  <CalendarDays className="h-4 w-4 text-amber-500" />
                  Daily Check-in & Tracker
                  {stats.streak > 0 && (
                    <Badge variant="secondary" className="h-5 px-1.5 text-[10px] bg-amber-500/20 text-amber-400">
                      🔥 {stats.streak}d
                    </Badge>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('report')}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'report'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                  }`}
                >
                  <BarChart3 className="h-4 w-4" />
                  Progress Charts & Report
                </button>
              </div>

              {/* TAB 1: Curriculum & Milestones (Full Width) */}
              {activeTab === 'curriculum' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
                    <h4 className="text-base font-semibold tracking-tight flex items-center gap-2">
                      <Layers className="h-4 w-4 text-primary" />
                      Milestones & Curriculum ({currentRoadmap.phases?.length || 0} Phases)
                    </h4>
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="relative min-w-[160px] sm:w-48">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                          placeholder="Filter topics..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="h-8 pl-8 pr-7 text-xs rounded-xl"
                        />
                        {searchQuery && (
                          <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleToggleExpandAll}
                        className="h-8 text-xs rounded-xl"
                      >
                        {allExpanded ? 'Collapse' : 'Expand'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportMarkdown}
                        className="h-8 text-xs rounded-xl gap-1.5"
                        title="Copy roadmap as Markdown"
                      >
                        <Share2 className="h-3.5 w-3.5" /> Export
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => setNewPhaseOpen(true)}
                        className="h-8 text-xs rounded-xl gap-1"
                      >
                        <Plus className="h-3.5 w-3.5" /> Phase
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {filteredPhases.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-border bg-card/40 p-8 text-center text-xs text-muted-foreground">
                        No milestones match "{searchQuery}". Try a different keyword.
                      </div>
                    ) : (
                      filteredPhases.map((phase) => {
                        const isExpanded = expandedPhases[phase.id] !== false;
                        const phaseCompleted = (phase.tasks || []).filter((t) => t.completed).length;
                        const phaseTotal = (phase.tasks || []).length;
                        const phasePct = phaseTotal > 0 ? Math.round((phaseCompleted / phaseTotal) * 100) : 0;
                        const isFullyDone = phaseTotal > 0 && phaseCompleted === phaseTotal;

                        return (
                          <Card
                            key={phase.id}
                            className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                              isFullyDone
                                ? 'border-emerald-500/30 bg-emerald-500/5'
                                : 'border-border bg-card'
                            }`}
                          >
                            {/* Phase Header Bar */}
                            <div
                              onClick={() =>
                                setExpandedPhases((prev) => ({
                                  ...prev,
                                  [phase.id]: !isExpanded,
                                }))
                              }
                              className="flex cursor-pointer items-center justify-between p-4 sm:p-5 hover:bg-accent/40 transition-colors"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <button
                                  type="button"
                                  className="grid h-7 w-7 place-items-center rounded-lg bg-muted text-muted-foreground shrink-0"
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </button>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm font-semibold tracking-tight text-foreground">
                                      {phase.title}
                                    </span>
                                    {isFullyDone && (
                                      <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/25 text-[10px] gap-1">
                                        <CheckCircle2 className="h-3 w-3" /> Completed
                                      </Badge>
                                    )}
                                  </div>
                                  {phase.description && (
                                    <p className="truncate text-xs text-muted-foreground mt-0.5">
                                      {phase.description}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-xs font-semibold text-muted-foreground">
                                  {phaseCompleted}/{phaseTotal} ({phasePct}%)
                                </span>
                                <div className="w-16 hidden sm:block h-2 rounded-full bg-muted overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${
                                      isFullyDone ? 'bg-emerald-500' : 'bg-primary'
                                    }`}
                                    style={{ width: `${phasePct}%` }}
                                  />
                                </div>
                                {currentRoadmap.phases.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={(e) => handleDeletePhase(phase.id, e)}
                                    className="text-muted-foreground/40 hover:text-destructive p-1 rounded-md hover:bg-destructive/10 transition-all ml-1"
                                    title="Delete phase"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Phase Checklist Items */}
                            {isExpanded && (
                              <div className="border-t border-border/50 bg-background/50 px-4 py-3 sm:px-6 space-y-2">
                                {(phase.tasks || []).map((task) => (
                                  <div
                                    key={task.id}
                                    onClick={() => handleToggleTask(phase.id, task.id)}
                                    className={`group flex cursor-pointer items-start justify-between gap-3 rounded-xl p-2.5 transition-all ${
                                      task.completed
                                        ? 'bg-emerald-500/10 text-muted-foreground'
                                        : 'hover:bg-accent/60 text-foreground'
                                    }`}
                                  >
                                    <div className="flex items-start gap-3 min-w-0">
                                      <div
                                        className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-all ${
                                          task.completed
                                            ? 'border-emerald-500 bg-emerald-500 text-white'
                                            : 'border-muted-foreground/40 group-hover:border-primary'
                                        }`}
                                      >
                                        {task.completed && <CheckCircle2 className="h-3.5 w-3.5" />}
                                      </div>
                                      <span
                                        className={`text-sm leading-snug select-none break-words ${
                                          task.completed ? 'line-through opacity-80' : ''
                                        }`}
                                      >
                                        {task.title}
                                      </span>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={(e) => handleDeleteTask(phase.id, task.id, e)}
                                      className="opacity-0 group-hover:opacity-100 hover:text-destructive p-1 rounded-md hover:bg-destructive/10 transition-all shrink-0 text-muted-foreground"
                                      title="Delete milestone"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                ))}

                                {/* Add Task Input in Phase */}
                                <div className="pt-2 flex items-center gap-2">
                                  <Input
                                    size={1}
                                    placeholder="Add milestone topic to this phase..."
                                    value={newTaskTitle[phase.id] || ''}
                                    onChange={(e) =>
                                      setNewTaskTitle((prev) => ({
                                        ...prev,
                                        [phase.id]: e.target.value,
                                      }))
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleAddTask(phase.id);
                                    }}
                                    className="h-9 text-xs"
                                  />
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => handleAddTask(phase.id)}
                                    className="h-9 shrink-0 gap-1 text-xs"
                                  >
                                    <Plus className="h-3.5 w-3.5" /> Add
                                  </Button>
                                </div>
                              </div>
                            )}
                          </Card>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: Daily Check-in & Consistency Tracker */}
              {activeTab === 'checkin' && (
                <div className="grid gap-6 lg:grid-cols-3 animate-fade-in">
                  {/* Left 2 Cols: 30-Day Consistency Chart & Recent History */}
                  <div className="space-y-6 lg:col-span-2">
                    {/* 30-Day / 14-Day Consistency & Study Hours Chart */}
                    <Card className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <BarChart3 className="h-4 w-4 text-amber-500" />
                            <h3 className="text-sm font-semibold tracking-tight">
                              {chartDaysRange === 30 ? '30-Day Study & Habit Consistency' : '14-Day Study Consistency'}
                            </h3>
                            <Badge variant="outline" className="text-[10px] text-primary border-primary/30">
                              Rolling {chartDaysRange} Days
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Auto-rolling 1-month tracking: distinguish English, Coding, & daily study habits
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Range Toggle */}
                          <div className="flex items-center rounded-xl bg-muted/60 p-0.5 border border-border">
                            <button
                              type="button"
                              onClick={() => setChartDaysRange(30)}
                              className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all cursor-pointer ${
                                chartDaysRange === 30
                                  ? 'bg-card text-foreground shadow-sm'
                                  : 'text-muted-foreground hover:text-foreground'
                              }`}
                            >
                              30 Days (1 Month)
                            </button>
                            <button
                              type="button"
                              onClick={() => setChartDaysRange(14)}
                              className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all cursor-pointer ${
                                chartDaysRange === 14
                                  ? 'bg-card text-foreground shadow-sm'
                                  : 'text-muted-foreground hover:text-foreground'
                              }`}
                            >
                              14 Days
                            </button>
                          </div>

                          <Badge variant="secondary" className="text-[11px] gap-1">
                            <Clock className="h-3 w-3" /> Avg: {avgMinutes}m / session
                          </Badge>
                        </div>
                      </div>

                      {/* Color Category Legend */}
                      <div className="flex items-center gap-2.5 flex-wrap text-[11px] text-muted-foreground bg-muted/30 p-2.5 rounded-2xl border border-border/50">
                        <span className="font-semibold text-foreground text-[10px] uppercase tracking-wider">Legend:</span>
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-300 border border-purple-500/30 font-medium">
                          <span className="h-2 w-2 rounded-full bg-purple-500" /> English Practice
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 font-medium">
                          <span className="h-2 w-2 rounded-full bg-amber-500" /> Coding & Study
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-sky-500/15 text-sky-300 border border-sky-500/30 font-medium">
                          <span className="h-2 w-2 rounded-full bg-sky-500" /> Routine
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-gradient-to-r from-purple-500/30 to-amber-500/30 text-amber-300 border border-amber-500/40 font-medium">
                          <span className="h-2 w-2 rounded-full bg-gradient-to-r from-purple-500 to-amber-500" /> Both Completed
                        </span>
                        <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-amber-500/80">
                          <span className="inline-block w-3 border-b border-dashed border-amber-500" /> 60m Target
                        </span>
                      </div>

                      {/* Chart Bars */}
                      <div className="space-y-2">
                        <div className="relative h-48 w-full flex items-end justify-between gap-1 pt-8 pb-2 px-0.5">
                          {/* 60m Goal Reference Line */}
                          <div
                            className="absolute left-0 right-0 border-b border-dashed border-amber-500/40 pointer-events-none z-10 flex justify-end pr-1"
                            style={{ bottom: `${Math.round((60 / maxChartMinutes) * 100)}%` }}
                          >
                            <span className="text-[9px] font-mono text-amber-500/80 -translate-y-full bg-card/80 px-1 rounded">
                              60m Target
                            </span>
                          </div>

                          {chartDaysData.map((item, idx) => {
                            const heightPct = Math.min(100, Math.round((item.minutes / maxChartMinutes) * 100));
                            const isToday = idx === chartDaysData.length - 1;

                            // Determine bar background color based on habits
                            let barClass = 'bg-muted/40';
                            if (item.minutes > 0 || item.completedHabits.length > 0) {
                              if (item.hasEnglish && item.hasCoding) {
                                barClass = isToday
                                  ? 'bg-gradient-to-t from-purple-500 via-amber-400 to-amber-500 shadow-md shadow-amber-500/25 ring-2 ring-primary/40'
                                  : 'bg-gradient-to-t from-purple-500 to-amber-500 hover:brightness-110';
                              } else if (item.hasEnglish) {
                                barClass = isToday
                                  ? 'bg-purple-500 shadow-md shadow-purple-500/25 ring-2 ring-purple-500/50'
                                  : 'bg-purple-500/90 hover:bg-purple-500';
                              } else if (item.hasCoding) {
                                barClass = isToday
                                  ? 'bg-amber-500 shadow-md shadow-amber-500/25 ring-2 ring-amber-500/50'
                                  : 'bg-amber-500/90 hover:bg-amber-500';
                              } else {
                                barClass = isToday
                                  ? 'bg-primary shadow-md shadow-primary/25 ring-2 ring-primary/50'
                                  : 'bg-primary/90 hover:bg-primary';
                              }
                            }

                            return (
                              <div
                                key={item.date}
                                className="group relative flex-1 flex flex-col items-center h-full justify-end"
                              >
                                {/* Tooltip on hover */}
                                <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30 whitespace-nowrap rounded-xl bg-popover px-2.5 py-1.5 text-[10px] font-medium text-popover-foreground shadow-xl border border-border">
                                  <div className="font-bold text-foreground flex items-center gap-1">
                                    {item.fullLabel} {isToday ? '(Today)' : ''}
                                  </div>
                                  <div className="text-amber-400 font-semibold mt-0.5">
                                    Study: {item.minutes}m
                                  </div>
                                  {item.completedHabits.length > 0 ? (
                                    <div className="flex flex-col gap-0.5 mt-1 border-t border-border/50 pt-1">
                                      {item.completedHabits.map((ch, cIdx) => (
                                        <span key={cIdx} className="flex items-center gap-1 text-[9px] text-muted-foreground">
                                          <span className={`h-1.5 w-1.5 rounded-full ${ch.theme.dot}`} />
                                          {ch.title}
                                        </span>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-[9px] text-muted-foreground italic block">No habits checked</span>
                                  )}
                                  {item.notes && <p className="text-[9px] text-muted-foreground italic truncate max-w-[150px] mt-0.5">"{item.notes}"</p>}
                                </div>

                                {/* Value label above bar if > 0 */}
                                {item.minutes > 0 && (
                                  <span className="text-[8px] font-mono font-semibold text-muted-foreground mb-0.5">
                                    {item.minutes}m
                                  </span>
                                )}

                                {/* Bar Pill */}
                                <div
                                  className={`w-full max-w-[22px] rounded-t-md transition-all duration-300 ${barClass}`}
                                  style={{ height: item.minutes > 0 ? `${Math.max(8, heightPct)}%` : item.completedHabits.length > 0 ? '8px' : '4px' }}
                                />

                                {/* Micro activity dots underneath bar */}
                                <div className="flex items-center justify-center gap-0.5 mt-1 h-2">
                                  {item.hasEnglish && (
                                    <span className="h-1.5 w-1.5 rounded-full bg-purple-500 shrink-0" title="English practice" />
                                  )}
                                  {item.hasCoding && (
                                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" title="Coding & study" />
                                  )}
                                  {item.hasOther && (
                                    <span className="h-1.5 w-1.5 rounded-full bg-sky-500 shrink-0" title="Other routine/habit" />
                                  )}
                                </div>

                                {/* X-axis Day Label */}
                                <span
                                  className={`mt-1 text-[9px] font-mono select-none ${
                                    isToday
                                      ? 'font-bold text-amber-500'
                                      : 'text-muted-foreground'
                                  }`}
                                >
                                  {chartDaysRange === 30 ? (idx % 3 === 0 || isToday ? item.dayNum : '') : item.shortDay}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-border/40">
                          <span>{chartDaysRange} days ago</span>
                          <span className="text-[10px] italic">Hover bars to view exact English / Coding / Study details</span>
                          <span className="font-semibold text-foreground">Today</span>
                        </div>
                      </div>
                    </Card>

                    {/* Recent Daily Logs History */}
                    <Card className="rounded-3xl border border-border bg-card p-5 shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                          <History className="h-3.5 w-3.5" /> Recent Activity History (Last 30 Days)
                        </h4>
                        <span className="text-[10px] text-muted-foreground font-medium">
                          Auto-rolling 1 Month
                        </span>
                      </div>
                      {(currentRoadmap.dailyLogs || []).length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">No logged activity yet. Save your first check-in on the right!</p>
                      ) : (
                        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                          {currentRoadmap.dailyLogs.slice(0, 15).map((log, idx) => {
                            const habitsList = currentRoadmap.dailyHabits || [];
                            const habitMap = new Map<string, { title: string; theme: HabitTheme }>();
                            habitsList.forEach((h, hIdx) => {
                              habitMap.set(h.id, { title: h.title, theme: getHabitTheme(h.title, hIdx) });
                            });
                            const completedHabits = (log.habitsDone || [])
                              .map((hid) => habitMap.get(hid))
                              .filter(Boolean) as Array<{ title: string; theme: HabitTheme }>;

                            return (
                              <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-2xl bg-muted/30 border border-border/50 p-3 text-xs">
                                <div className="space-y-1.5 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-foreground">{log.date}</span>
                                    {log.minutesSpent > 0 && (
                                      <Badge variant="secondary" className="text-[10px] font-mono">
                                        ⏱️ {log.minutesSpent}m
                                      </Badge>
                                    )}
                                  </div>
                                  {completedHabits.length > 0 && (
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      {completedHabits.map((ch, cIdx) => (
                                        <span
                                          key={cIdx}
                                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border ${ch.theme.badgeBg}`}
                                        >
                                          <span className={`h-1.5 w-1.5 rounded-full ${ch.theme.dot}`} />
                                          {ch.theme.label}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                  {log.notes && <p className="text-muted-foreground text-xs">{log.notes}</p>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </Card>
                  </div>

                  {/* Right 1 Col: Streak & Today's Check-in */}
                  <div className="space-y-6">
                    {/* Streak & Consistency Card */}
                    <Card className="rounded-3xl border border-border bg-card p-5 shadow-sm space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-amber-500/15 text-amber-500">
                            <Flame className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold tracking-tight">Active Streak</h4>
                            <p className="text-xs text-muted-foreground">Keep studying daily</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-black text-amber-500">{stats.streak}</span>
                          <span className="text-xs text-muted-foreground block">Days Streak</span>
                        </div>
                      </div>
                    </Card>

                    {/* Today's Daily Habit & Study Log Card */}
                    <Card className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-5">
                      <div className="flex items-center justify-between border-b border-border/60 pb-3">
                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 text-primary" />
                          <h4 className="text-sm font-semibold tracking-tight">Today's Check-in</h4>
                        </div>
                        <span className="text-xs font-medium text-muted-foreground">
                          {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>

                      {/* Daily Habits Checklist */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                            Daily Habits & Commitments
                          </label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="xs"
                            onClick={handleImportFromRoutine}
                            className="h-6 text-[11px] text-primary hover:text-primary/90 gap-1 px-1.5 cursor-pointer"
                            title="Import subjects and schedules from your Routine page"
                          >
                            <Clock className="h-3 w-3" /> Sync from Routine
                          </Button>
                        </div>

                        {(currentRoadmap.dailyHabits || []).length === 0 ? (
                          <p className="text-xs text-muted-foreground italic bg-muted/20 p-3 rounded-xl border border-dashed border-border/60">
                            No habits added yet. Add a custom habit below or sync from your Routine.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {currentRoadmap.dailyHabits.map((habit, idx) => {
                              const isDone = Boolean(todayHabitsDone[habit.id]);
                              const theme = getHabitTheme(habit.title, idx);
                              return (
                                <div
                                  key={habit.id}
                                  className={`group flex items-center justify-between gap-3 rounded-2xl border p-2.5 transition-all ${
                                    isDone
                                      ? `${theme.badgeBg}`
                                      : 'border-border bg-muted/40 hover:bg-muted/70 text-muted-foreground'
                                  }`}
                                >
                                  <div
                                    onClick={() =>
                                      setTodayHabitsDone((prev) => ({
                                        ...prev,
                                        [habit.id]: !isDone,
                                      }))
                                    }
                                    className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer select-none"
                                  >
                                    <div
                                      className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-all ${
                                        isDone
                                          ? `${theme.dot} text-white border-transparent`
                                          : 'border-muted-foreground/40 group-hover:border-primary'
                                      }`}
                                    >
                                      {isDone && <CheckCircle2 className="h-3.5 w-3.5" />}
                                    </div>
                                    <div className="flex items-center gap-2 min-w-0 flex-1 flex-wrap">
                                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${theme.badgeBg}`}>
                                        {theme.label}
                                      </span>
                                      <span className={`text-xs font-medium leading-relaxed truncate ${isDone ? 'line-through opacity-80' : ''}`}>
                                        {habit.title}
                                      </span>
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={(e) => handleDeleteHabit(habit.id, e)}
                                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive p-1 rounded hover:bg-destructive/10 transition-all shrink-0 cursor-pointer"
                                    title="Delete habit"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Add Custom Habit Input */}
                        <div className="flex items-center gap-2 pt-1">
                          <Input
                            placeholder="Add habit (e.g. 2 LeetCode problems)..."
                            value={newHabitTitle}
                            onChange={(e) => setNewHabitTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleAddHabit();
                            }}
                            className="h-8 text-xs rounded-xl"
                          />
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={handleAddHabit}
                            className="h-8 text-xs rounded-xl shrink-0 gap-1"
                          >
                            <Plus className="h-3.5 w-3.5" /> Add
                          </Button>
                        </div>
                      </div>

                      {/* Study Time Logger */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Today's Study Time
                          </label>
                          <span className="text-xs font-bold text-primary">{todayMinutes} Minutes</span>
                        </div>

                        {/* Preset buttons */}
                        <div className="grid grid-cols-4 gap-1.5">
                          {[30, 45, 60, 120].map((mins) => (
                            <Button
                              key={mins}
                              type="button"
                              variant={todayMinutes === mins ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setTodayMinutes(mins)}
                              className="h-8 text-xs font-semibold"
                            >
                              {mins < 60 ? `${mins}m` : `${mins / 60}h`}
                            </Button>
                          ))}
                        </div>
                      </div>

                      {/* Notes / Reflection for today */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                          Notes / What did you learn?
                        </label>
                        <Textarea
                          placeholder="e.g. Read about Rust ownership & completed 2 LeetCode problems."
                          value={todayNotes}
                          onChange={(e) => setTodayNotes(e.target.value)}
                          rows={2}
                          className="text-xs"
                        />
                      </div>

                      {/* Save Log Button */}
                      <Button
                        onClick={handleSaveDailyLog}
                        disabled={savingDailyLog}
                        className="w-full gap-2 rounded-xl"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        {savingDailyLog ? 'Saving...' : 'Save Today\'s Progress'}
                      </Button>
                    </Card>
                  </div>
                </div>
              )}

              {/* TAB 3: Progress Charts & Full Report */}
              {activeTab === 'report' && (
                <div className="space-y-6 animate-fade-in">
                  {/* Phase-by-Phase Progress Breakdown */}
                  <Card className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-border/60 pb-3">
                      <div>
                        <h3 className="text-sm font-semibold tracking-tight flex items-center gap-2">
                          <Target className="h-4 w-4 text-primary" />
                          Phase-by-Phase Progress Breakdown
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Detailed milestones completion across all curriculum phases
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs font-semibold">
                        {phaseStats.filter((p) => p.isDone).length} of {phaseStats.length} Phases Completed
                      </Badge>
                    </div>

                    <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                      {phaseStats.map((phase, idx) => (
                        <div
                          key={phase.id}
                          className={`rounded-2xl border p-3.5 transition-all ${
                            phase.isDone
                              ? 'border-emerald-500/30 bg-emerald-500/5'
                              : phase.pct > 0
                              ? 'border-primary/30 bg-primary/5'
                              : 'border-border/60 bg-muted/20'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="grid h-6 w-6 place-items-center rounded-lg bg-muted text-[11px] font-bold shrink-0">
                                {idx + 1}
                              </span>
                              <span className="text-xs font-semibold truncate text-foreground">
                                {phase.title}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-xs font-mono font-medium text-muted-foreground">
                                {phase.completed}/{phase.total} ({phase.pct}%)
                              </span>
                              {phase.isDone ? (
                                <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px] gap-1">
                                  <CheckCircle2 className="h-3 w-3" /> Done
                                </Badge>
                              ) : phase.pct > 0 ? (
                                <Badge variant="secondary" className="text-[10px]">
                                  In Progress
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-[10px] text-muted-foreground">
                                  Pending
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="h-2 w-full overflow-hidden rounded-full bg-muted/60">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                phase.isDone ? 'bg-emerald-500' : 'bg-primary'
                              }`}
                              style={{ width: `${phase.pct}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Comprehensive Executive Report Card */}
                  <Card className="rounded-3xl border border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 p-6 shadow-sm space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold tracking-tight">Executive Progress Report</h3>
                          <p className="text-xs text-muted-foreground">Comprehensive overview of consistency and milestones</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCopyFullReport}
                        className="gap-1.5 text-xs rounded-xl"
                      >
                        <Share2 className="h-3.5 w-3.5" /> Copy Full Report
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="rounded-2xl border border-border/60 bg-muted/30 p-3.5">
                        <span className="text-[11px] text-muted-foreground uppercase font-semibold tracking-wider block">Total Logged</span>
                        <span className="text-xl font-bold text-foreground mt-1 block">{stats.totalHours} hrs</span>
                        <span className="text-[10px] text-muted-foreground">study sessions</span>
                      </div>
                      <div className="rounded-2xl border border-border/60 bg-muted/30 p-3.5">
                        <span className="text-[11px] text-muted-foreground uppercase font-semibold tracking-wider block">Habit Adherence</span>
                        <span className="text-xl font-bold text-emerald-500 mt-1 block">{habitAdherence}%</span>
                        <span className="text-[10px] text-muted-foreground">commitment rate</span>
                      </div>
                      <div className="rounded-2xl border border-border/60 bg-muted/30 p-3.5">
                        <span className="text-[11px] text-muted-foreground uppercase font-semibold tracking-wider block">Completed Tasks</span>
                        <span className="text-xl font-bold text-primary mt-1 block">{stats.completedTasks} / {stats.totalTasks}</span>
                        <span className="text-[10px] text-muted-foreground">{stats.percentage}% overall</span>
                      </div>
                      <div className="rounded-2xl border border-border/60 bg-muted/30 p-3.5">
                        <span className="text-[11px] text-muted-foreground uppercase font-semibold tracking-wider block">Active Streak</span>
                        <span className="text-xl font-bold text-amber-500 mt-1 block">{stats.streak} Days</span>
                        <span className="text-[10px] text-muted-foreground">consecutive days</span>
                      </div>
                    </div>
                  </Card>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* New Roadmap Creation Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="max-w-2xl rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Create Learning Roadmap
            </DialogTitle>
            <DialogDescription>
              Choose a starter curriculum preset, have AI generate one, or create custom milestones.
            </DialogDescription>
          </DialogHeader>

          {/* Navigation Tabs */}
          <div className="flex border-b border-border mt-2">
            <button
              onClick={() => setCreateTab('presets')}
              className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${
                createTab === 'presets'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Recommended Presets
            </button>
            <button
              onClick={() => setCreateTab('ai')}
              className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
                createTab === 'ai'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Bot className="h-4 w-4" /> AI Auto-Planner
            </button>
            <button
              onClick={() => setCreateTab('manual')}
              className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${
                createTab === 'manual'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Custom Manual
            </button>
          </div>

          <div className="py-4">
            {createTab === 'presets' && (
              <div className="space-y-4">
                {presets.map((preset, idx) => (
                  <Card
                    key={idx}
                    className="p-4 rounded-2xl border border-border hover:border-primary/50 transition-all cursor-pointer group bg-card"
                    onClick={() => handleApplyPreset(preset)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="font-semibold text-base group-hover:text-primary transition-colors">
                            {preset.title}
                          </h5>
                          <Badge variant="outline" className="text-xs">
                            {preset.duration}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{preset.description}</p>
                        <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Layers className="h-3.5 w-3.5 text-primary" />
                            {preset.phases.length} Phases
                          </span>
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                            {preset.phases.reduce((acc, p) => acc + p.tasks.length, 0)} Milestones
                          </span>
                        </div>
                      </div>
                      <Button size="sm" className="shrink-0 gap-1.5">
                        Select <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {createTab === 'ai' && (
              <div className="space-y-4">
                <div className="rounded-2xl bg-primary/10 p-4 text-xs text-primary/90 flex items-start gap-3">
                  <Sparkles className="h-5 w-5 shrink-0 mt-0.5" />
                  <span>
                    Tell the AI what skill, language, or topic you want to master. It will generate a full structured curriculum with phases and actionable tasks.
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">What do you want to learn?</label>
                  <Textarea
                    placeholder="e.g. I want a 6-month roadmap to learn Go (Golang) and Kubernetes from zero to building microservices, with weekly milestones."
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    rows={4}
                    className="text-sm"
                  />
                </div>

                <Button
                  onClick={handleGenerateAi}
                  disabled={generatingAi || !aiPrompt.trim()}
                  className="w-full gap-2 rounded-xl"
                >
                  <Sparkles className="h-4 w-4" />
                  {generatingAi ? 'Generating Curriculum...' : 'Generate Roadmap with AI'}
                </Button>
              </div>
            )}

            {createTab === 'manual' && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Roadmap Title</label>
                  <Input
                    placeholder="e.g. Deep Learning Specialization"
                    value={manualTitle}
                    onChange={(e) => setManualTitle(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Duration</label>
                    <Input
                      placeholder="e.g. 6 Months"
                      value={manualDuration}
                      onChange={(e) => setManualDuration(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Daily Habit Target</label>
                    <Input
                      placeholder="e.g. 1 hour coding daily"
                      value={manualHabit}
                      onChange={(e) => setManualHabit(e.target.value)}
                    />
                  </div>
                </div>

                <Button
                  onClick={handleCreateManual}
                  disabled={!manualTitle.trim()}
                  className="w-full rounded-xl"
                >
                  Create Custom Roadmap
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* New Phase Dialog */}
      <Dialog open={newPhaseOpen} onOpenChange={setNewPhaseOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" /> Add New Phase / Month
            </DialogTitle>
            <DialogDescription>
              Define a new milestone stage for your learning track.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Phase Title</label>
              <Input
                placeholder="e.g. Month 13: Distributed Systems Deep Dive"
                value={newPhaseTitle}
                onChange={(e) => setNewPhaseTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddPhase();
                }}
                className="text-sm"
              />
            </div>
            <Button onClick={handleAddPhase} disabled={!newPhaseTitle.trim()} className="w-full rounded-xl">
              Add Phase
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={handleDeleteRoadmap}
        title="Delete Roadmap"
        description={`Are you sure you want to delete "${roadmapToDelete?.title}"? All phases, tasks, and daily progress logs will be permanently removed.`}
      />
    </div>
  );
}
