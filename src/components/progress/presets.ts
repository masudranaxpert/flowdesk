import type { Roadmap } from '../../types';

export function localDateString(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}



/**
 * Built-in starter curriculum presets.
 */
export const presets: Array<Omit<Roadmap, '_id' | 'createdAt' | 'updatedAt'>> = [
  {
    title: '12-Month Rust & Backend Systems Mastery',
    description: 'A comprehensive curriculum from absolute zero to backend systems, advanced DSA, and interview readiness.',
    category: 'rust',
    duration: '12 Months',
    status: 'active',
    dailyHabits: [],
    phases: [
      {
        id: 'm1',
        title: 'Month 1: Rust from absolute zero',
        description: 'Rustup, Cargo, primitive & compound types, ownership basics, control flow, strings, and first CLI projects.',
        targetMonth: 1,
        tasks: [
          { id: 't1-1', title: 'Install Rustup, Cargo toolchain (build, check, test, clippy, fmt) & configure VS Code rust-analyzer', completed: false },
          { id: 't1-2', title: 'Anatomy of Cargo.toml vs Cargo.lock, dependencies, release vs dev profiles & crate basics', completed: false },
          { id: 't1-3', title: 'Variables, mutability (let vs let mut), variable shadowing & compile-time constants (const)', completed: false },
          { id: 't1-4', title: 'Scalar primitive types: integers (i8-i128, u8-u128, isize, usize, overflow), floats (f32, f64), bool & char', completed: false },
          { id: 't1-5', title: 'Compound primitive types: tuples (destructuring, indexing) & fixed-size stack arrays (bounds checking, slices)', completed: false },
          { id: 't1-6', title: 'Functions, parameter typing, return types, statements vs expression-based returns (omitting semicolon)', completed: false },
          { id: 't1-7', title: 'Conditionals: if, else if, else as expressions (assigning if-result directly to variables)', completed: false },
          { id: 't1-8', title: 'Loops in Rust: loop with break value returning, while condition, and for in iterators (0..n, 0..=n)', completed: false },
          { id: 't1-9', title: 'Strings in depth: String (heap-allocated, growable UTF-8) vs &str (read-only string slice view)', completed: false },
          { id: 't1-10', title: 'String operations: push_str, push, slicing &[..], format!() macro & UTF-8 indexing safety rules', completed: false },
          { id: 't1-11', title: 'Introduction to Ownership: Stack vs Heap memory layout, scope rules, RAII and automatic Drop', completed: false },
          { id: 't1-12', title: 'Move semantics vs primitive Copy trait: value ownership transfer during assignment and function calls', completed: false },
          { id: 't1-13', title: 'Basic References & Borrowing: immutable borrow (&T) vs mutable borrow (&mut T) & aliasing XOR mutability rule', completed: false },
          { id: 't1-14', title: 'Standard Library CLI I/O: std::io::stdin, reading input lines, string trimming & primitive parsing', completed: false },
          { id: 't1-15', title: 'Introductory Error Handling: Understanding Result<T, E> basics with .expect() and .unwrap()', completed: false },
          { id: 't1-16', title: 'Project 1: Interactive Number Guessing Game (std::io, rand crate, Ordering cmp match)', completed: false },
          { id: 't1-17', title: 'Project 2: CLI File Reader & Word/Line Frequency Counter tool (std::fs::read_to_string)', completed: false },
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
          { id: 't10-4', title: 'Design Rate Limiters, Distributed Caches, and URL Shorteners', completed: false },
          { id: 't10-5', title: 'Design high-throughput distributed chat & notification services', completed: false },
        ],
      },
      {
        id: 'm11',
        title: 'Month 11: LeetCode Grind + System Design Polish',
        description: 'Hard algorithmic problems, timed mock sessions, and end-to-end design reviews.',
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
    dailyHabits: [],
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
